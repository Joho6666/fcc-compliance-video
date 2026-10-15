import vo5 from './vo5.json';
import env5 from './vo5_env.json';
import rzt from './scripts/rzt_intro.json';
import {makeTiming4, type SceneId} from './timing4';
import type {Script5} from './Video5';

// 认证通简介: scenes and beat timing come straight from the script JSON (same LEAD/GAP/TAIL rules as v4).
export const rztScript = rzt as unknown as Script5;
export const timingRZT = makeTiming4(
  vo5 as Record<string, number>,
  'vo5',
  env5 as Record<string, number[]>,
  rztScript.beats.map((b) => ({scene: b.scene as SceneId, clip: b.id})),
);
