// Mirror of makeTiming4 for a script JSON: writes {total, shots:[{scene, clip, sfx, from, dur}]} for build_v3.py.
// Run: SCRIPT=scripts/rzt_intro.json VOJSON=vo5.json OUT=mix_timing_rzt.json node tools/timing5_dump.mjs
import fs from 'node:fs';
const root = new URL('../remotion/src/', import.meta.url);
const read = (p) => JSON.parse(fs.readFileSync(new URL(p, root), 'utf8'));
const vo = read(process.env.VOJSON || 'vo5.json');
const script = read(process.env.SCRIPT || 'scripts/rzt_intro.json');
const FPS = 30, LEAD = 0.3, GAP = 0.16, TAIL = 1.9;
const sec = (s) => Math.round(s * FPS);
const beats = script.beats;
let cur = sec(LEAD); const shots = [];
beats.forEach((b, i) => { const dur = sec(vo[b.id] + GAP + (i === beats.length - 1 ? TAIL : 0)); shots.push({scene: b.scene, clip: b.id, sfx: b.sfx, from: cur / FPS, dur: dur / FPS}); cur += dur; });
fs.writeFileSync(new URL('../' + (process.env.OUT || 'mix_timing_rzt.json'), import.meta.url), JSON.stringify({total: cur / FPS, shots}, null, 1));
console.log(beats.length, 'beats, total', (cur / FPS).toFixed(2), 's');
