// Mirror of remotion/src/timing4.ts: writes mix_timing4.json ({total, shots:[{from, dur, sfx}]}) for build_v3.py (V=4).
import fs from 'node:fs';
const root = new URL('../remotion/src/', import.meta.url);
const vo = JSON.parse(fs.readFileSync(new URL(process.env.VOJSON || 'vo4.json', root), 'utf8'));
const src = fs.readFileSync(new URL('timing4.ts', root), 'utf8').replace(/\r/g, '');
const FPS = 30, LEAD = 0.3, GAP = 0.16, TAIL = 1.9;
const beats = [...src.matchAll(/\{scene: '(\w+)', clip: '(\w+)'(?:, sfx: '(\w+)')?\}/g)].map(m => ({ scene: m[1], clip: m[2], sfx: m[3] }));
const sec = s => Math.round(s * FPS);
let cur = sec(LEAD); const shots = [];
beats.forEach((b, i) => { const dur = sec(vo[b.clip] + GAP + (i === beats.length - 1 ? TAIL : 0)); shots.push({ ...b, from: cur / FPS, dur: dur / FPS }); cur += dur; });
fs.writeFileSync(new URL('../' + (process.env.OUT || 'mix_timing4.json'), import.meta.url), JSON.stringify({ total: cur / FPS, shots }, null, 1));
console.log(beats.length, 'beats, total', (cur / FPS).toFixed(2), 's');
