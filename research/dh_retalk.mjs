// VideoRetalk (DashScope 声动人像) lip-sync test: re-time the mouth of the authorized person's own clip to a new audio.
// Uploads clip.mp4 + voice.wav to DashScope temporary storage (oss://, valid 48h), submits ONE paid task, polls, downloads dh/retalk_2s.mp4.
// A ledger file is written BEFORE the paid request so a rerun can never double-charge.
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { config } = await import('file:///D:/video-replicate-studio/apps/studio/lib/env.mjs');
const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'dh');
const base = config.wan.base;
const MODEL = 'videoretalk';
const A = { Authorization: `Bearer ${config.wan.key}` };
const J = { ...A, 'Content-Type': 'application/json' };
const wait = ms => new Promise(r => setTimeout(r, ms));
const ledgerFile = path.join(DIR, 'ledger.json');
const led = existsSync(ledgerFile) ? JSON.parse(await readFile(ledgerFile, 'utf8')) : {};
const save = () => writeFile(ledgerFile, JSON.stringify(led, null, 1));

if (led.retalk?.state === 'submitted' || led.retalk?.state === 'submitting') {
  console.log('already submitted, polling existing task', led.retalk.taskId);
}

async function upload(file, name) {
  const p = await (await fetch(`${base}/api/v1/uploads?action=getPolicy&model=${MODEL}`, { headers: A })).json();
  const d = p.data;
  if (!d) throw new Error('getPolicy failed: ' + JSON.stringify(p).slice(0, 200));
  const key = `${d.upload_dir}/${name}`;
  const form = new FormData();
  for (const [k, v] of [['OSSAccessKeyId', d.oss_access_key_id], ['Signature', d.signature], ['policy', d.policy], ['x-oss-object-acl', d.x_oss_object_acl], ['x-oss-forbid-overwrite', d.x_oss_forbid_overwrite], ['key', key], ['success_action_status', '200']]) form.append(k, v);
  form.append('file', new Blob([await readFile(path.join(DIR, file))]), name);
  const r = await fetch(d.upload_host, { method: 'POST', body: form });
  if (!r.ok) throw new Error(`upload ${name} HTTP ${r.status}`);
  return `oss://${key}`;
}

let taskId = led.retalk?.taskId;
if (!taskId) {
  const video = await upload('clip.mp4', 'clip.mp4');
  const audio = await upload('voice.wav', 'voice.wav');
  console.log('uploaded');
  led.retalk = { state: 'submitting', at: new Date().toISOString() };
  await save();
  const r = await (await fetch(`${base}/api/v1/services/aigc/image2video/video-synthesis`, {
    method: 'POST',
    headers: { ...J, 'X-DashScope-Async': 'enable', 'X-DashScope-OssResourceResolve': 'enable' },
    body: JSON.stringify({ model: MODEL, input: { video_url: video, audio_url: audio }, parameters: { video_extension: false } }),
  })).json();
  taskId = r.output?.task_id;
  led.retalk = { state: taskId ? 'submitted' : 'rejected', taskId, resp: taskId ? undefined : r };
  await save();
  if (!taskId) { console.log('rejected', JSON.stringify(r)); process.exit(1); }
  console.log('submitted', taskId);
}

for (let i = 0; i < 90; i++) {
  await wait(10000);
  const q = await (await fetch(`${base}/api/v1/tasks/${taskId}`, { headers: A })).json();
  const st = q.output?.task_status;
  console.log('poll', i, st);
  if (st === 'SUCCEEDED') {
    const url = q.output.video_url || q.output.results?.video_url;
    await writeFile(path.join(DIR, 'retalk_2s.mp4'), Buffer.from(await (await fetch(url)).arrayBuffer()));
    led.retalk = { state: 'succeeded', taskId, usage: q.usage };
    await save();
    console.log('saved retalk_2s.mp4', JSON.stringify(q.usage));
    break;
  }
  if (['FAILED', 'CANCELED', 'UNKNOWN'].includes(st)) {
    led.retalk = { state: 'failed', taskId, out: q.output };
    await save();
    console.log('FAILED', q.output?.code, q.output?.message);
    break;
  }
}
