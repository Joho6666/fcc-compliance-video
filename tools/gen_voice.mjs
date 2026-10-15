// Voice-over clips via the user's MOSS TTS (config from video-replicate-studio).
// Writes remotion/public/vo/<id>.mp3 and remotion/src/vo.json ({id: seconds}). Existing clips are kept.
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { config, tools } = await import('file:///D:/video-replicate-studio/apps/studio/lib/env.mjs');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'remotion');
const OUT = path.join(ROOT, 'public', 'vo');
const VOICE_NAME = process.env.VOICE || '女播音';

export const LINES = JSON.parse(await readFile(path.join(ROOT, 'src', 'lines.json'), 'utf8'));

const auth = { Authorization: `Bearer ${config.moss.key}` };
const voices = (await (await fetch(`${config.moss.base}/v1/audio/voices`, { headers: auth })).json()).data;
const voice = voices.find(v => v.name === VOICE_NAME);
if (!voice) throw new Error(`voice ${VOICE_NAME} not found`);

await mkdir(OUT, { recursive: true });
const durations = {};
for (const { id, text } of LINES) {
  const out = path.join(OUT, `${id}.mp3`);
  if (!existsSync(out)) {
    let res;
    for (let attempt = 1; attempt <= 4; attempt++) {
      res = await fetch(`${config.moss.base}/v1/audio/speech`, {
        method: 'POST', headers: { ...auth, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: config.moss.ttsModel, input: text, voice_id: voice.id, language: 'zh', response_format: 'mp3' }),
        signal: AbortSignal.timeout(120_000),
      });
      if (res.ok) break;
      console.warn(id, 'attempt', attempt, res.status);
      await new Promise(r => setTimeout(r, 4000 * attempt));
    }
    if (!res.ok) throw new Error(`${id}: HTTP ${res.status} ${await res.text()}`);
    await writeFile(out, Buffer.from(await res.arrayBuffer()));
  }
  const probe = execFileSync(tools.ffprobe, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', out]).toString();
  durations[id] = Math.round(Number(probe) * 100) / 100;
  console.log(id, durations[id]);
}
await writeFile(path.join(ROOT, 'src', 'vo.json'), JSON.stringify(durations, null, 2));
