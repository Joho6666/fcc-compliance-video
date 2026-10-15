// wan2.2-s2v digital-human clip: portrait of the authorized person + an audio slice of an existing narration track.
// Usage: node dh_s2v.mjs <id> <voice-render.mp4> <startSec> <durSec> [480P|720P]
//   -> cuts the audio window, runs wan2.2-s2v-detect on dh/portrait.png, then ONE paid wan2.2-s2v task,
//      saves ../remotion/public/dh/<id>.mp4. Ledger (dh/s2v_ledger.json) is written before the paid request.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { config } = await import('file:///D:/video-replicate-studio/apps/studio/lib/env.mjs');
const HERE = path.dirname(fileURLToPath(import.meta.url));
const DH = path.join(HERE, 'dh');
const OUT = path.join(HERE, '..', 'remotion', 'public', 'dh');
const FF = 'C:/Users/JOHO/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0-full_build/bin/ffmpeg.exe';
const base = config.wan.base;
const A = { Authorization: `Bearer ${config.wan.key}` };
const J = { ...A, 'Content-Type': 'application/json', 'X-DashScope-OssResourceResolve': 'enable' };
const wait = ms => new Promise(r => setTimeout(r, ms));

const [id, voiceRender, start, dur, resolution = '480P'] = process.argv.slice(2);
if (!id || !voiceRender || !start || !dur) throw new Error('usage: node dh_s2v.mjs <id> <voice-render.mp4> <startSec> <durSec> [480P|720P]');
if (Number(dur) >= 20) throw new Error('s2v audio must be < 20 s; split the window');

const ledgerFile = path.join(DH, 's2v_ledger.json');
const led = existsSync(ledgerFile) ? JSON.parse(await readFile(ledgerFile, 'utf8')) : {};
const save = () => writeFile(ledgerFile, JSON.stringify(led, null, 1));
await mkdir(OUT, { recursive: true });

async function upload(file, name, model) {
  const p = await (await fetch(`${base}/api/v1/uploads?action=getPolicy&model=${model}`, { headers: A })).json();
  const d = p.data;
  if (!d) throw new Error('getPolicy failed: ' + JSON.stringify(p).slice(0, 200));
  const key = `${d.upload_dir}/${name}`;
  const form = new FormData();
  for (const [k, v] of [['OSSAccessKeyId', d.oss_access_key_id], ['Signature', d.signature], ['policy', d.policy], ['x-oss-object-acl', d.x_oss_object_acl], ['x-oss-forbid-overwrite', d.x_oss_forbid_overwrite], ['key', key], ['success_action_status', '200']]) form.append(k, v);
  form.append('file', new Blob([await readFile(file)]), name);
  const r = await fetch(d.upload_host, { method: 'POST', body: form });
  if (!r.ok) throw new Error(`upload ${name} HTTP ${r.status}`);
  return `oss://${key}`;
}

let taskId = led[id]?.taskId;
if (!taskId) {
  // 1. audio window from the existing voice-only render (keeps the exact pauses -> lip-sync lines up with the timeline)
  const wav = path.join(DH, `${id}.wav`);
  execFileSync(FF, ['-y', '-v', 'error', '-ss', String(start), '-t', String(dur), '-i', voiceRender, '-vn', '-ac', '1', '-ar', '44100', wav]);

  // 2. portrait check (cheap, sync)
  const imgDetect = await upload(path.join(DH, 'portrait.png'), 'portrait.png', 'wan2.2-s2v-detect');
  const det = await (await fetch(`${base}/api/v1/services/aigc/image2video/face-detect`, {
    method: 'POST', headers: J, body: JSON.stringify({ model: 'wan2.2-s2v-detect', input: { image_url: imgDetect } }),
  })).json();
  console.log('detect', JSON.stringify(det.output || det).slice(0, 200));
  if (!det.output?.check_pass) { console.log('portrait rejected by detect'); process.exit(1); }

  // 3. one paid s2v task
  const img = await upload(path.join(DH, 'portrait.png'), 'portrait.png', 'wan2.2-s2v');
  const aud = await upload(wav, `${id}.wav`, 'wan2.2-s2v');
  led[id] = { state: 'submitting', at: new Date().toISOString(), start, dur, resolution };
  await save();
  const r = await (await fetch(`${base}/api/v1/services/aigc/image2video/video-synthesis`, {
    method: 'POST', headers: { ...J, 'X-DashScope-Async': 'enable' },
    body: JSON.stringify({ model: 'wan2.2-s2v', input: { image_url: img, audio_url: aud }, parameters: { resolution } }),
  })).json();
  taskId = r.output?.task_id;
  led[id] = { ...led[id], state: taskId ? 'submitted' : 'rejected', taskId, resp: taskId ? undefined : r };
  await save();
  if (!taskId) { console.log('rejected', JSON.stringify(r)); process.exit(1); }
  console.log('submitted', id, taskId);
} else {
  console.log('resuming existing task', id, taskId, led[id].state);
}

for (let i = 0; i < 80; i++) {
  if (led[id].state === 'succeeded') break;
  await wait(15000);
  const q = await (await fetch(`${base}/api/v1/tasks/${taskId}`, { headers: A })).json();
  const st = q.output?.task_status;
  console.log('poll', i, st);
  if (st === 'SUCCEEDED') {
    const url = q.output.results?.video_url || q.output.video_url;
    await writeFile(path.join(OUT, `${id}.mp4`), Buffer.from(await (await fetch(url)).arrayBuffer()));
    led[id] = { ...led[id], state: 'succeeded', usage: q.usage };
    await save();
    console.log('saved', `remotion/public/dh/${id}.mp4`, JSON.stringify(q.usage));
    break;
  }
  if (['FAILED', 'CANCELED', 'UNKNOWN'].includes(st)) {
    led[id] = { ...led[id], state: 'failed', out: q.output };
    await save();
    console.log('FAILED', q.output?.code, q.output?.message);
    break;
  }
}
