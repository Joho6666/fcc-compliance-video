import vo5 from './vo5.json';
import env5 from './vo5_env.json';
import vo5Kid from './vo5_kid.json';
import env5Kid from './vo5_kid_env.json';
import rzt from './scripts/rzt_intro.json';
import {makeTiming4, type SceneId} from './timing4';
import type {Script5} from './Video5';

/** Timing for any script JSON + its narration clips (durations json, public/<voDir>, loudness envelope json). */
export const timingForScript = (script: Script5, vo: Record<string, number>, voDir: string, env: Record<string, number[]>) =>
  makeTiming4(vo, voDir, env, script.beats.map((b) => ({scene: b.scene as SceneId, clip: b.id})));

// 认证通简介: scenes and beat timing come straight from the script JSON (same LEAD/GAP/TAIL rules as v4).
export const rztScript = rzt as unknown as Script5;
export const timingRZT = makeTiming4(
  vo5 as Record<string, number>,
  'vo5',
  env5 as Record<string, number[]>,
  rztScript.beats.map((b) => ({scene: b.scene as SceneId, clip: b.id})),
);

// Same script, male narrator (剪映「萌娃百科」, zh_male_zhengtaikp) on the 小白 explainer look.
export const timingRZTKid = makeTiming4(
  vo5Kid as Record<string, number>,
  'vo5_kid',
  env5Kid as Record<string, number[]>,
  rztScript.beats.map((b) => ({scene: b.scene as SceneId, clip: b.id})),
);
