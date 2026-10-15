import vo from './vo3.json';
import lines from './lines3.json';

export const FPS = 30;
const LEAD = 0.35; // before first shot
const GAP = 0.14; // after each clip
const TAIL = 1.8; // after the last clip

const D = vo as Record<string, number>;
export const TEXT3 = Object.fromEntries((lines as {id: string; text: string}[]).map((l) => [l.id, l.text]));

export type Move = 'in' | 'out' | 'panL' | 'panR';
export type Deco = 'stamp' | 'grey' | 'scan' | 'redzone' | 'flip' | 'none';
export type Shot = {
  id: number; clip: string; img: string; move: Move; tint?: 'navy' | 'red' | 'green';
  kw: string; accent?: string; // accent = part of kw to colour
  kwSize?: number; sub?: string; deco?: Deco; shake?: boolean; flash?: boolean; sfx?: string; check?: number; // check = checklist item index (0-4), -1 = intro
};

export const SHOTS: Shot[] = [
  {id: 1, clip: 'n1', img: 'v_chamber', move: 'in', tint: 'red', kw: '10.29', kwSize: 285, sub: 'FCC 投票', shake: true, sfx: 'boom'},
  {id: 2, clip: 'n2', img: 'v_router', move: 'in', kw: '报告还能用吗？', accent: '还能用吗？', kwSize: 120, sfx: 'ping'},
  {id: 3, clip: 'n3a', img: 'v_report', move: 'out', kw: '不会作废', accent: '不会', kwSize: 170, deco: 'stamp', tint: 'green', sfx: 'stamp'},
  {id: 4, clip: 'n3b', img: 'v_report', move: 'out', kw: '现在只是提案', accent: '提案', kwSize: 120, deco: 'grey'},
  {id: 5, clip: 'n4', img: 'v_desk', move: 'panL', kw: '你有没有想过？', accent: '想过', kwSize: 120, flash: true, sfx: 'whoosh'},
  {id: 6, clip: 'n5', img: 'v_router', move: 'panR', kw: '谁测的？', accent: '谁', kwSize: 230, sfx: 'whoosh', flash: true},
  {id: 7, clip: 'n6a', img: 'v_factory', move: 'panL', kw: 'ODM', kwSize: 250, shake: true, sfx: 'boom'},
  {id: 8, clip: 'n6b', img: 'v_module', move: 'in', kw: '模块商', kwSize: 200, shake: true, sfx: 'boom'},
  {id: 9, clip: 'n6c', img: 'v_desk', move: 'out', kw: '一份 PDF', accent: 'PDF', kwSize: 190, flash: true, sfx: 'whoosh'},
  {id: 10, clip: 'n7a', img: 'v_chamber', move: 'in', tint: 'red', kw: '若被限制', accent: '限制', kwSize: 170, deco: 'redzone', sfx: 'boom'},
  {id: 11, clip: 'n7b', img: 'v_label', move: 'in', kw: '换型号 · 重认证', accent: '重认证', kwSize: 100, deco: 'scan', sfx: 'ping'},
  {id: 12, clip: 'n8a', img: 'v_time', move: 'in', kw: '2028.12', kwSize: 200, deco: 'flip', sfx: 'page', flash: true},
  {id: 13, clip: 'n8b', img: 'v_time', move: 'in', kw: '你有时间', accent: '时间', kwSize: 160},
  {id: 14, clip: 'n9', img: 'v_checklist', move: 'in', kw: '问 5 个问题', accent: '5 个', kwSize: 120, check: -1, sfx: 'whoosh'},
  {id: 15, clip: 'n10', img: 'v_checklist', move: 'in', kw: '哪家实验室', kwSize: 120, check: 0, sfx: 'tick'},
  {id: 16, clip: 'n11', img: 'v_checklist', move: 'in', kw: '哪个国家', kwSize: 120, check: 1, sfx: 'tick'},
  {id: 17, clip: 'n12', img: 'v_checklist', move: 'in', kw: '谁申请', kwSize: 120, check: 2, sfx: 'tick'},
  {id: 18, clip: 'n13', img: 'v_checklist', move: 'in', kw: '模块认证', kwSize: 120, check: 3, sfx: 'tick'},
  {id: 19, clip: 'n14', img: 'v_checklist', move: 'in', kw: '备选方案', kwSize: 120, check: 4, sfx: 'tick'},
  {id: 20, clip: 'n15', img: 'v_checklist', move: 'out', kw: '截图转采购', accent: '截图', kwSize: 120, check: 5, sfx: 'ping'},
  {id: 21, clip: 'n16a', img: 'v_router', move: 'out', tint: 'green', kw: '合规认证通', kwSize: 130, sfx: 'boom'},
  {id: 22, clip: 'n16b', img: 'v_router', move: 'out', tint: 'green', kw: '第一时间告诉你', accent: '第一时间', kwSize: 100},
];

const sec = (s: number) => Math.round(s * FPS);

export type Placed = Shot & {from: number; dur: number; audioFrom: number};
export const placed: Placed[] = [];
let cursor = sec(LEAD);
SHOTS.forEach((s, i) => {
  const dur = sec(D[s.clip] + GAP + (i === SHOTS.length - 1 ? TAIL : 0));
  placed.push({...s, from: cursor, dur, audioFrom: cursor});
  cursor += dur;
});
export const TOTAL3 = cursor;
