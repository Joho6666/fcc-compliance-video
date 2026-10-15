import vo from './vo.json';
import lines from './lines.json';

export const FPS = 30;
const LEAD = 0.5; // silence before the first clip of a scene
const GAP = 0.25; // between clips inside a scene
const TAIL = 0.6; // after the last clip of a scene

export type SceneId = 'hook' | 'timeline' | 'products' | 'chain' | 'check' | 'outro';

const SCENES: {id: SceneId; clips: string[]; tail?: number}[] = [
  {id: 'hook', clips: ['s1']},
  {id: 'timeline', clips: ['s2']},
  {id: 'products', clips: ['s3']},
  {id: 'chain', clips: ['s4']},
  {id: 'check', clips: ['s5', 's5_1', 's5_2', 's5_3', 's5_4', 's5_5']},
  {id: 'outro', clips: ['s6'], tail: 2.2},
];

const sec = (s: number) => Math.round(s * FPS);
export const TEXT = Object.fromEntries((lines as {id: string; text: string}[]).map((l) => [l.id, l.text]));

export type Clip = {id: string; from: number; dur: number}; // frames, relative to its scene
export type Scene = {id: SceneId; from: number; dur: number; clips: Clip[]};
export type Timing = {scenes: Scene[]; TOTAL: number; sceneOf: (id: SceneId) => Scene; voDir: string};

/** Same scene layout for any set of narration durations (e.g. the SAMI voice or the cloned voice). */
export function makeTiming(durations: Record<string, number>, voDir = 'vo'): Timing {
  const scenes: Scene[] = [];
  let cursor = 0;
  for (const s of SCENES) {
    let t = LEAD;
    const clips: Clip[] = s.clips.map((id, i) => {
      const c = {id, from: sec(t), dur: sec(durations[id])};
      t += durations[id] + (i < s.clips.length - 1 ? GAP : 0);
      return c;
    });
    const dur = sec(t + (s.tail ?? TAIL));
    scenes.push({id: s.id, from: cursor, dur, clips});
    cursor += dur;
  }
  return {scenes, TOTAL: cursor, sceneOf: (id) => scenes.find((s) => s.id === id)!, voDir};
}

export const defaultTiming = makeTiming(vo as Record<string, number>);
export const scenes = defaultTiming.scenes;
export const TOTAL = defaultTiming.TOTAL;
export const sceneOf = defaultTiming.sceneOf;
