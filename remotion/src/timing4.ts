import vo from './vo4.json';
import lines from './lines4.json';
import env4 from './vo4_env.json';

export const FPS = 30;
const LEAD = 0.3;
const GAP = 0.16;
const TAIL = 1.9;

const D = vo as Record<string, number>;
export const TEXT4 = Object.fromEntries((lines as {id: string; text: string}[]).map((l) => [l.id, l.text]));

export type SceneId = 'hook' | 'valid' | 'analogy' | 'chain' | 'impact' | 'timeline' | 'check' | 'outro';

// One beat = one narration clip. Scenes group beats: the diagram on screen keeps growing across the beats of a scene (no hard cuts inside).
const BEATS: {scene: SceneId; clip: string; sfx?: string}[] = [
  {scene: 'hook', clip: 'm1', sfx: 'boom'},
  {scene: 'hook', clip: 'm2', sfx: 'pop'},
  {scene: 'valid', clip: 'm3a', sfx: 'stamp'},
  {scene: 'valid', clip: 'm3b', sfx: 'pop'},
  {scene: 'analogy', clip: 'm4a', sfx: 'whoosh'},
  {scene: 'analogy', clip: 'm4b', sfx: 'pop'},
  {scene: 'analogy', clip: 'm4c', sfx: 'pop'},
  {scene: 'chain', clip: 'm5a', sfx: 'whoosh'},
  {scene: 'chain', clip: 'm5b', sfx: 'pop'},
  {scene: 'chain', clip: 'm5c', sfx: 'pop'},
  {scene: 'impact', clip: 'm6a', sfx: 'whoosh'},
  {scene: 'impact', clip: 'm6b', sfx: 'ping'},
  {scene: 'timeline', clip: 'm7a', sfx: 'whoosh'},
  {scene: 'timeline', clip: 'm7b', sfx: 'pop'},
  {scene: 'check', clip: 'm8', sfx: 'whoosh'},
  {scene: 'check', clip: 'm8_1', sfx: 'tick'},
  {scene: 'check', clip: 'm8_2', sfx: 'tick'},
  {scene: 'check', clip: 'm8_3', sfx: 'tick'},
  {scene: 'check', clip: 'm8_4', sfx: 'tick'},
  {scene: 'check', clip: 'm8_5', sfx: 'tick'},
  {scene: 'check', clip: 'm9', sfx: 'ping'},
  {scene: 'outro', clip: 'm10a', sfx: 'whoosh'},
  {scene: 'outro', clip: 'm10b', sfx: 'pop'},
];

const sec = (s: number) => Math.round(s * FPS);

export type Beat = {clip: string; from: number; dur: number}; // frames; from is relative to the scene
export type Scene = {id: SceneId; from: number; dur: number; beats: Beat[]};
export type Timing4 = {scenes: Scene[]; TOTAL: number; voDir: string; env: Record<string, number[]>};

/** Scene layout for any narration voice (durations per clip + its loudness envelope for lip-sync). */
export type BeatSpec = {scene: SceneId; clip: string};
export function makeTiming4(durations: Record<string, number>, voDir: string, env: Record<string, number[]>, beats: BeatSpec[] = BEATS): Timing4 {
  const scenes: Scene[] = [];
  let cursor = sec(LEAD);
  beats.forEach((b, i) => {
    const dur = sec(durations[b.clip] + GAP + (i === beats.length - 1 ? TAIL : 0));
    let s = scenes[scenes.length - 1];
    if (!s || s.id !== b.scene) {
      s = {id: b.scene, from: cursor, dur: 0, beats: []};
      scenes.push(s);
    }
    s.beats.push({clip: b.clip, from: cursor - s.from, dur});
    s.dur += dur;
    cursor += dur;
  });
  return {scenes, TOTAL: cursor, voDir, env};
}

export const defaultTiming4 = makeTiming4(D, 'vo4', env4 as Record<string, number[]>);
export const scenes = defaultTiming4.scenes;
export const TOTAL4 = defaultTiming4.TOTAL;
export const sceneById = (id: SceneId) => scenes.find((s) => s.id === id)!;
