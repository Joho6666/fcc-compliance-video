// Original mascot "认证小哥" via the user's OpenAI-compatible image relay (curl, because Node fetch ignores the proxy).
// Usage: node gen_character.mjs master | pose <name> ... | all
// Output: remotion/public/char/raw/<name>.png (magenta background; tools/key_magenta.py makes the transparent cut-outs)
import { mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);
const { config } = await import('file:///D:/video-replicate-studio/apps/studio/lib/env.mjs');
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'remotion', 'public', 'char', 'raw');
const c = config.image;
const SIZE = '1024x1536';

const STYLE = 'Flat vector cartoon illustration, thick dark teal outlines (about 6px), simple flat colors with no gradients, cute chibi proportions (big head), clean mascot design for a Chinese tech explainer video. Full body, centered, on a flat solid pure magenta (#FF00FF) background with nothing else in the scene. No text, no letters, no logos, no watermark.';
const CHARACTER = 'An original young male certification engineer mascot named Renzheng Xiaoge: round face with a friendly smile, short black hair under a bright yellow safety helmet, round black-rimmed glasses, a navy-blue work vest over a light-teal shirt, orange scarf-like neck tag, dark trousers and white sneakers.';
const POSES = {
  master: `${CHARACTER} Standing relaxed, facing the viewer, one hand waving slightly. ${STYLE}`,
  point: `Same character, same outfit, same face. Pose: confidently pointing with one index finger up and to the side as if explaining something, mouth open mid-speech. ${STYLE}`,
  surprised: `Same character, same outfit, same face. Pose: shocked and surprised, both hands up near the cheeks, wide eyes, small sweat drop. ${STYLE}`,
  think: `Same character, same outfit, same face. Pose: thinking, one hand on chin, head slightly tilted, a small question mark floating beside the head. ${STYLE}`,
  check: `Same character, same outfit, same face. Pose: proud, holding up a clipboard that has a big green check mark on it (no other writing), smiling. ${STYLE}`,
  wave: `Same character, same outfit, same face. Pose: cheerful, waving one hand high with a wide smile, as if saying goodbye. ${STYLE}`,
};

async function callApi(endpoint, { json, form }) {
  const tmp = path.join(os.tmpdir(), `char-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  const args = ['-sS', '--http1.1', '--retry', '2', '--retry-all-errors', '--max-time', '300', '-K', '-', '-X', 'POST', '-o', `${tmp}.res`];
  let cfg = `header = "Authorization: Bearer ${c.key}"\n`; // via stdin so the key never shows in the process list
  if (json) { await writeFile(`${tmp}.req`, JSON.stringify(json)); cfg += 'header = "Content-Type: application/json"\n'; args.push('--data-binary', `@${tmp}.req`); }
  if (form) for (const [k, v] of Object.entries(form)) args.push('-F', v.file ? `${k}=@${v.file};type=image/png` : `${k}=${v}`);
  args.push(`${c.base}${endpoint}`);
  const child = run('curl', args, { maxBuffer: 1 << 20 });
  child.child.stdin.end(cfg);
  await child;
  const text = await readFile(`${tmp}.res`, 'utf8').catch(() => '{}');
  await rm(`${tmp}.req`, { force: true }); await rm(`${tmp}.res`, { force: true });
  const j = JSON.parse(text || '{}');
  const d = j.data?.[0];
  if (d?.b64_json) return Buffer.from(d.b64_json, 'base64');
  if (d?.url) { await run('curl', ['-sS', '--max-time', '120', '-o', `${tmp}.img`, new URL(d.url, `${c.base}/`).href]); const b = await readFile(`${tmp}.img`); await rm(`${tmp}.img`, { force: true }); return b; }
  throw new Error(j.error?.message || j.message || text.slice(0, 200));
}

async function make(name) {
  const out = path.join(OUT, `${name}.png`);
  if (existsSync(out)) return console.log('skip', name);
  const master = path.join(OUT, 'master.png');
  const bytes = name === 'master'
    ? await callApi('/images/generations', { json: { model: c.model, prompt: POSES.master, size: SIZE, n: 1 } })
    : await callApi('/images/edits', { form: { model: c.model, prompt: POSES[name], size: SIZE, n: '1', image: { file: master } } });
  await mkdir(OUT, { recursive: true });
  await writeFile(out, bytes);
  console.log('ok', name, bytes.length);
}

const [mode, ...rest] = process.argv.slice(2);
const names = mode === 'all' ? Object.keys(POSES) : mode === 'pose' ? rest : [mode];
for (const n of names) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    try { await make(n); break; } catch (e) { console.error('retry', n, attempt, String(e.message).slice(0, 150)); await new Promise(r => setTimeout(r, 5000 * attempt)); }
  }
}
