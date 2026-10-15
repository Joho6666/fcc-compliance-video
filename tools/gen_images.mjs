// Generate landscape stills through the user's OpenAI-compatible image relay (config from video-replicate-studio).
// Usage: node gen_images.mjs <id> [<id> ...]   (ids from PROMPTS below; existing files are skipped)
import { mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import os from 'node:os';
const run = promisify(execFile);
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { config } = await import('file:///D:/video-replicate-studio/apps/studio/lib/env.mjs');
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'remotion', 'public', 'img');

const STYLE = 'Photorealistic editorial photograph, clean corporate look, cool white and navy blue tones with a subtle orange accent light, soft studio lighting, shallow depth of field, 16:9 composition with empty space on the left for text overlay. No text, no letters, no logos, no watermarks.';

const STYLE_V = 'Cinematic photograph, dark moody navy blue and black palette with a subtle orange accent light, shallow depth of field, high contrast, vertical 9:16 composition, large dark empty area in the upper-middle for text overlay. No text, no letters, no numbers, no logos, no watermarks.';
const PROMPTS = {
  v_chamber: 'Wide view inside a dark EMC anechoic test chamber, walls covered in dark pyramid RF absorber cones, a small white wireless router on a turntable far in the distance, thin cold blue light, deep perspective.',
  v_router: 'Medium shot of a white Wi-Fi router with antennas on a round turntable inside an anechoic chamber, absorber cones behind, dramatic cold rim light, a small orange LED glow.',
  v_report: 'Close-up top-down view of a printed certification test report on a dark desk, only grey placeholder lines and small simple charts (no words), a pen beside it, soft window light.',
  v_desk: 'A business owner dark office desk at dusk: a stack of printed PDF reports, a smartphone, a laptop with a blank softly glowing screen, warm desk lamp, moody.',
  v_factory: 'Electronics assembly production line in a factory at night, rows of white consumer wireless devices on a conveyor belt, blurred workers in the background, cool lighting with orange accents.',
  v_module: 'Extreme macro of a small wireless module circuit board with an antenna trace and tiny chips, dark background, shallow depth of field, orange and blue light reflections.',
  v_label: 'Back of a white electronics device with a blank label sticker, a handheld barcode scanner pointing at it emitting a thin red laser line, dark background, macro.',
  v_time: 'An hourglass with glowing orange sand on a dark navy desk, a blurred wall calendar in the background with no readable text, cinematic shallow depth of field.',
  v_checklist: 'Top-down view of a dark navy desk with a blank paper clipboard (no writing at all), a pen and a magnifying glass, soft light from above, lots of empty space.',
  chamber: 'A modern EMC anechoic test chamber with blue-grey pyramid RF absorber foam covering walls, a small white wireless router on a turntable in the center, a measurement antenna on a mast to the right.',
  label: 'Close-up of the back of a white consumer electronics device lying on a desk, with a blank white compliance label sticker area (completely blank, no printing), a printed test report document partly visible beside it.',
  products: 'A neat arrangement of wireless consumer electronics on a light grey table: a Wi-Fi router, a security camera, a smartwatch, smart speaker and a small bluetooth module circuit board, viewed from a 45 degree angle.',
  export: 'Stacked cardboard shipping cartons of electronics on pallets in a bright warehouse, with a container port visible through a large open door in the background.',
  report: 'Overhead view of a navy blue desk with a stack of plain white paper documents showing only grey placeholder lines and simple colored bar charts (absolutely no words or titles), a magnifying glass, a pen and an empty clipboard.',
};

// Fallback provider: Alibaba DashScope wan2.2-t2i-flash (mainland, reachable without proxy).
const wait = ms => new Promise(r => setTimeout(r, ms));
async function wanImage(prompt, size = '1440*810') {
  const A = { Authorization: `Bearer ${config.wan.key}`, 'Content-Type': 'application/json' };
  const r = await (await fetch(`${config.wan.base}/api/v1/services/aigc/text2image/image-synthesis`, {
    method: 'POST', headers: { ...A, 'X-DashScope-Async': 'enable' },
    body: JSON.stringify({ model: 'wan2.2-t2i-flash', input: { prompt, negative_prompt: 'text, letters, words, logo, watermark, signature, blurry, distorted' }, parameters: { size, n: 1, prompt_extend: false, watermark: false } }),
  })).json();
  if (!r.output?.task_id) throw new Error(JSON.stringify(r));
  for (let i = 0; i < 60; i++) {
    await wait(4000);
    const q = await (await fetch(`${config.wan.base}/api/v1/tasks/${r.output.task_id}`, { headers: A })).json();
    if (q.output.task_status === 'SUCCEEDED') return Buffer.from(await (await fetch(q.output.results[0].url, { signal: AbortSignal.timeout(60_000) })).arrayBuffer());
    if (q.output.task_status === 'FAILED') throw new Error(JSON.stringify(q.output));
  }
  throw new Error('timeout');
}
const PROVIDER = process.env.IMG_PROVIDER || 'wan';

async function gen(id) {
  const out = path.join(OUT, `${id}.png`);
  if (existsSync(out)) return console.log('skip', id);
  if (PROVIDER === 'wan') {
    const v = id.startsWith('v_');
    const bytes = await wanImage(`${PROMPTS[id]} ${v ? STYLE_V : STYLE}`, v ? '810*1440' : '1440*810');
    await mkdir(OUT, { recursive: true }); await writeFile(out, bytes); return console.log('ok', id, bytes.length);
  }
  const c = config.image;
  // curl, not fetch: Node fetch ignores the system proxy (127.0.0.1:7890) and fails to reach the relay.
  const tmp = path.join(os.tmpdir(), `img-${id}-${Date.now()}`);
  await writeFile(`${tmp}.req.json`, JSON.stringify({ model: c.model, prompt: `${PROMPTS[id]} ${STYLE}`, size: process.env.IMG_SIZE || '1536x1024', n: 1 }));
  // header via curl config on stdin so the key never shows in the process list
  const cfgText = `header = "Authorization: Bearer ${c.key}"
header = "Content-Type: application/json"
`;
  const child = run('curl', ['-sS', '--http1.1', '--retry', '2', '--retry-all-errors', '--max-time', '300', '-K', '-', '-X', 'POST', '--data-binary', `@${tmp}.req.json`, '-o', `${tmp}.res.json`, `${c.base}/images/generations`], { maxBuffer: 1 << 20 });
  child.child.stdin.end(cfgText);
  await child;
  const json = JSON.parse(await readFile(`${tmp}.res.json`, 'utf8').catch(() => '{}') || '{}');
  await rm(`${tmp}.req.json`, { force: true }); await rm(`${tmp}.res.json`, { force: true });
  const d = json.data?.[0];
  let bytes;
  if (d?.b64_json) bytes = Buffer.from(d.b64_json, 'base64');
  else if (d?.url) {
    await run('curl', ['-sS', '--max-time', '120', '-o', `${tmp}.img`, new URL(d.url, `${c.base}/`).href]);
    bytes = await readFile(`${tmp}.img`); await rm(`${tmp}.img`, { force: true });
  } else throw new Error(`${id}: ${json.error?.message || json.message || 'no image in response'}`);
  await mkdir(OUT, { recursive: true });
  await writeFile(out, bytes);
  console.log('ok', id, bytes.length);
}

const ids = process.argv.slice(2);
for (const id of ids) {  // sequential + retry: DashScope throttles parallel requests
  for (let attempt = 1; attempt <= 4; attempt++) {
    try { await gen(id); break; } catch (e) {
      console.error('retry', id, attempt, String(e.message).slice(0, 120));
      if (attempt === 4) console.error('FAIL', id);
      await wait(6000 * attempt);
    }
  }
}
