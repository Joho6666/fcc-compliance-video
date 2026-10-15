// Mirror of remotion/src/timing3.ts: dumps shot start times (seconds) + sfx cues to mix_timing3.json.
import fs from 'node:fs';
const root = new URL('../remotion/src/', import.meta.url);
const vo = JSON.parse(fs.readFileSync(new URL('vo3.json', root), 'utf8'));
const src = fs.readFileSync(new URL('timing3.ts', root), 'utf8');
const FPS = 30, LEAD = 0.35, GAP = 0.14, TAIL = 1.8;
const shots = [...src.replace(/\r/g, '').matchAll(/\{id: (\d+), clip: '(\w+)'.*?\},?\n/g)].map(m => ({
  id: +m[1], clip: m[2], sfx: (m[0].match(/sfx: '(\w+)'/) || [])[1], check: (m[0].match(/check: (-?\d)/) || [])[1],
}));
const sec = s => Math.round(s * FPS);
let cur = sec(LEAD); const out = [];
shots.forEach((s, i) => { const dur = sec(vo[s.clip] + GAP + (i === shots.length - 1 ? TAIL : 0)); out.push({...s, from: cur / FPS, dur: dur / FPS}); cur += dur; });
fs.writeFileSync(new URL('../mix_timing3.json', import.meta.url), JSON.stringify({total: cur / FPS, shots: out}, null, 1));
console.log(shots.length, 'shots, total', (cur / FPS).toFixed(2), 's');
console.log(out.map(o => `${o.id}@${o.from.toFixed(1)}`).join(' '));
