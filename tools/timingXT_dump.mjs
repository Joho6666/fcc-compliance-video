// Mirror of makeTiming() in remotion/src/timing.ts for the cloned-voice cut.
// Writes mix_timingXT.json: total, scene windows (seconds), digital-human windows, and sfx cues for build_v3.py (V=XT).
import fs from 'node:fs';
const root = new URL('../remotion/src/', import.meta.url);
const vo = JSON.parse(fs.readFileSync(new URL('vo_xt.json', root), 'utf8'));
const FPS = 30, LEAD = 0.5, GAP = 0.25, TAIL = 0.6;
const SCENES = [
  { id: 'hook', clips: ['s1'] }, { id: 'timeline', clips: ['s2'] }, { id: 'products', clips: ['s3'] }, { id: 'chain', clips: ['s4'] },
  { id: 'check', clips: ['s5', 's5_1', 's5_2', 's5_3', 's5_4', 's5_5'] }, { id: 'outro', clips: ['s6'], tail: 2.2 },
];
const sec = s => Math.round(s * FPS);
let cursor = 0; const scenes = [];
for (const s of SCENES) {
  let t = LEAD;
  const clips = s.clips.map((id, i) => { const c = { id, from: sec(t), dur: sec(vo[id]) }; t += vo[id] + (i < s.clips.length - 1 ? GAP : 0); return c; });
  const dur = sec(t + (s.tail ?? TAIL));
  scenes.push({ id: s.id, from: cursor, dur, clips }); cursor += dur;
}
const S = id => scenes.find(s => s.id === id);
const f2s = f => +(f / FPS).toFixed(3);
const check = S('check');
// Digital-human windows: host = big presenter, pip = small circle over the PPT. ~half of the runtime.
const dh = [
  { id: 'hook', mode: 'host', from: S('hook').from, dur: S('hook').dur },
  { id: 'chain', mode: 'pip', from: S('chain').from, dur: S('chain').dur },
  { id: 'check_intro', mode: 'host', from: check.from, dur: check.clips[1].from },
  { id: 'outro', mode: 'host', from: S('outro').from, dur: S('outro').dur },
].map(w => ({ ...w, start: f2s(w.from), seconds: f2s(w.dur) }));
const shots = [
  ...scenes.slice(1).map(s => ({ from: f2s(s.from), sfx: 'whoosh' })),
  ...check.clips.slice(1).map(c => ({ from: f2s(check.from + c.from + 18), sfx: 'tick' })),
].sort((a, b) => a.from - b.from);
const total = f2s(cursor);
fs.writeFileSync(new URL('../mix_timingXT.json', import.meta.url), JSON.stringify({ total, scenes: scenes.map(s => ({ id: s.id, start: f2s(s.from), seconds: f2s(s.dur) })), dh, shots }, null, 1));
const dhSec = dh.reduce((n, w) => n + w.seconds, 0);
console.log('total', total, 's; digital human', dhSec.toFixed(1), 's =', Math.round(dhSec / total * 100) + '%');
dh.forEach(w => console.log(' ', w.id, w.mode, w.start, '+', w.seconds));
