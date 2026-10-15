// Client shield mascot sprites in the polished gpt-image-2.5 style, using the client's own sheet figure as the reference.
// Usage: node gen_shield_sprites.mjs <name> [<name> ...]      names from SPRITES below; existing files are skipped
// Output: remotion/public/shield/raw/<name>.png (magenta background; key it out afterwards)
import { mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);
const { config } = await import('file:///D:/video-replicate-studio/apps/studio/lib/env.mjs');
const SET = process.env.SET || 'shield'; // shield | robot1 | robot2 | robot3
const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'remotion', 'public', SET);
const OUT = path.join(DIR, 'raw');
const REF = path.join(DIR, SET === 'shield' ? 'ref_point.png' : 'ref.png');
const c = config.image;

const KEEP_SHIELD = 'Exactly the same mascot character as the reference image: same blue-to-purple glossy shield body with a bevelled rim, same big white check mark on the belly, same big glossy dark-blue eyes with white highlights, pink blush, white cartoon gloves, blue arms and legs, white sneakers, same thick dark navy outline and the same polished soft-shaded cartoon style. Full body, centered, facing the viewer, the whole character visible with margin around it. Flat solid pure magenta (#FF00FF) background, no ground shadow, no sparks, no text, no other objects.';
const STYLE_TAIL = 'Full body, centered, facing the viewer, the whole character visible with margin around it. Flat solid pure magenta (#FF00FF) background, no ground shadow, no sparks, no text, no other objects.';
const ROBOT = {
  robot1: 'Exactly the same robot mascot as the reference image: a cute chibi robot whose head is a rounded white-lavender TV monitor with a light-cyan glowing screen face showing big dark glossy eyes, pink blush and a small smile, white-lavender headphones on both sides, two thin antennae with blue ball tips, a white and lavender rounded body suit with a blue shield-and-check badge on the chest, lavender gloved hands and boots, the same soft polished pastel cartoon shading with a thin navy outline.',
  robot2: 'Exactly the same robot mascot as the reference image: a cute chibi robot whose head is a rounded white monitor with a DARK navy glossy screen that shows a blue shield with a white check mark plus big cute eyes, pink blush and a smile, blue headphones, two thin antennae with blue ball tips, a white body with a round glowing blue badge on the chest, dark shorts, white gloves and white boots, the same soft polished pastel cartoon shading with a thin navy outline.',
  robot3: 'Exactly the same robot mascot as the reference image: a cute chibi robot whose head is a rounded lavender-purple TV monitor with a light-cyan glowing screen face showing big dark glossy eyes, pink blush and a smile, purple headphones with cyan rims, two thin antennae with blue ball tips, a lavender-purple rounded body suit with a blue shield-and-check badge on the chest, lavender gloves and boots, the same soft polished pastel cartoon shading with a thin navy outline.',
};
const KEEP = SET === 'shield' ? KEEP_SHIELD : `${ROBOT[SET]} ${STYLE_TAIL}`;
const POSE = {
  idle: 'Pose: standing relaxed, both gloved fists resting at the sides, gentle closed-mouth smile, both eyes open.',
  point: 'Pose: the left glove does a finger-gun pointing gesture up and to the side, the other glove is a relaxed fist at the hip, one eye winking, closed-mouth smile.',
  present: 'Pose: both arms open wide to the sides with open gloved hands, presenting something, both eyes open, closed-mouth smile.',
  wave: 'Pose: one gloved hand raised high waving with open fingers, the other glove a fist at the side, one eye winking, closed-mouth smile.',
  cheer: 'Pose: both gloved fists raised above the head in celebration, one leg kicked up, eyes squeezed into happy closed arcs, closed-mouth big grin.',
  think: 'Pose: thinking, one gloved index finger touching the chin, eyes looking up, slightly worried eyebrows, small closed mouth, the other glove at the side.',
  surprised: 'Pose: surprised, both open gloved hands on the cheeks, big sparkly eyes wide open, small round closed mouth, a tiny sweat drop.',
};
// variant -> [base pose, instruction]; variants are edited from their own base image so only the face changes
const VARIANT = {
  talk: 'Keep everything identical (pose, body, gloves, eyes, colors, framing, background) and change ONLY the mouth: open it mid-speech, showing a dark red mouth and a small pink tongue.',
  blink: 'Keep everything identical (pose, body, gloves, mouth, colors, framing) and change ONLY the eyes: both eyes gently closed as curved lines (a blink).',
};
const SPRITES = Object.fromEntries([
  ...Object.entries(POSE).map(([k, v]) => [k, {prompt: `${KEEP} ${v}`, ref: REF}]),
  ...Object.keys(POSE).map((k) => [`${k}_talk`, {prompt: VARIANT.talk, ref: path.join(OUT, `${k}.png`)}]),
  ...['idle', 'point', 'present'].map((k) => [`${k}_blink`, {prompt: VARIANT.blink, ref: path.join(OUT, `${k}.png`)}]),
]);

async function edit(prompt, ref) {
  const tmp = path.join(os.tmpdir(), `shield-${Date.now()}`);
  const cfg = `header = "Authorization: Bearer ${c.key}"\n`; // stdin: the key stays out of the process list
  const args = ['-sS', '--http1.1', '--retry', '2', '--retry-all-errors', '--max-time', '300', '-K', '-', '-X', 'POST', '-o', `${tmp}.res`,
    '-F', `model=${c.model}`, '-F', `prompt=${prompt}`, '-F', 'size=1024x1024', '-F', 'n=1', '-F', `image=@${ref};type=image/png`, `${c.base}/images/edits`];
  const child = run('curl', args, { maxBuffer: 1 << 20 });
  child.child.stdin.end(cfg);
  await child;
  const text = await readFile(`${tmp}.res`, 'utf8').catch(() => '');
  await rm(`${tmp}.res`, { force: true });
  const j = JSON.parse(text || '{}');
  const d = j.data?.[0];
  if (d?.b64_json) return Buffer.from(d.b64_json, 'base64');
  if (d?.url) { await run('curl', ['-sS', '--max-time', '120', '-o', `${tmp}.img`, new URL(d.url, `${c.base}/`).href]); const b = await readFile(`${tmp}.img`); await rm(`${tmp}.img`, { force: true }); return b; }
  throw new Error(j.error?.message || j.message || text.slice(0, 200));
}

await mkdir(OUT, { recursive: true });
for (const name of process.argv.slice(2)) {
  const out = path.join(OUT, `${name}.png`);
  if (existsSync(out)) { console.log('skip', name); continue; }
  for (let attempt = 1; attempt <= 3; attempt++) {
    try { const b = await edit(SPRITES[name].prompt, SPRITES[name].ref); await writeFile(out, b); console.log('ok', name, b.length); break; }
    catch (e) { console.error('retry', name, attempt, String(e.message).slice(0, 150)); await new Promise(r => setTimeout(r, 5000 * attempt)); }
  }
}
