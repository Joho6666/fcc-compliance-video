import React from 'react';

// Client's shield mascot, rebuilt as SVG so every part animates. Canvas follows the client's art (1374 x 1145).
// v2 follows the client's polished pose sheet: bevelled rim, big glossy eyes, real cartoon gloves, sneakers, ground shadow, sparks.
export type ShieldPose = 'idle' | 'point' | 'present' | 'wave' | 'cheer' | 'think' | 'surprised';
export type ShieldExpr = 'wink' | 'normal' | 'happy' | 'surprised' | 'think';

const INK = '#1C1A5E';
const ARM = '#4E6CF2';
const CUFF = '#ECEBFF';

type V = [number, number];
const SHOULDER_L: V = [392, 600];
const SHOULDER_R: V = [1030, 630];

type Glove = 'point' | 'fist' | 'open';
type Hand = {p: V; g: Glove};
const POSES: Record<ShieldPose, {l: Hand; r: Hand}> = {
  point: {l: {p: [300, 560], g: 'point'}, r: {p: [1048, 715], g: 'fist'}},
  present: {l: {p: [272, 520], g: 'open'}, r: {p: [1128, 540], g: 'open'}},
  idle: {l: {p: [352, 690], g: 'fist'}, r: {p: [1060, 705], g: 'fist'}},
  wave: {l: {p: [278, 420], g: 'open'}, r: {p: [1048, 715], g: 'fist'}},
  cheer: {l: {p: [305, 385], g: 'fist'}, r: {p: [1100, 400], g: 'fist'}},
  think: {l: {p: [352, 690], g: 'fist'}, r: {p: [722, 590], g: 'point'}},
  surprised: {l: {p: [462, 492], g: 'open'}, r: {p: [940, 506], g: 'open'}},
};
const DEFAULT_EXPR: Record<ShieldPose, ShieldExpr> = {
  point: 'wink', present: 'normal', idle: 'normal', wave: 'wink', cheer: 'happy', think: 'think', surprised: 'surprised',
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpV = (a: V, b: V, t: number): V => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
const S = {stroke: INK, strokeWidth: 9, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const};

/** Cartoon glove in local coords: wrist toward +x, fingers toward -x. `rot` aims the wrist at the shoulder. */
const GloveShape: React.FC<{at: V; g: Glove; rot: number; mirror: boolean}> = ({at, g, rot, mirror}) => (
  <g transform={`translate(${at[0]} ${at[1]}) rotate(${rot}) scale(1.36 ${mirror ? -1.36 : 1.36})`}>
    <rect x={38} y={-44} width={44} height={88} rx={20} fill={CUFF} {...S} />
    {g === 'open' && [-52, -22, 8, 38].map((a) => (
      <rect key={a} x={-118} y={-20} width={92} height={40} rx={20} fill="#fff" {...S} transform={`rotate(${a})`} />
    ))}
    {g === 'open' && <rect x={-40} y={-112} width={40} height={76} rx={20} fill="#fff" {...S} transform="rotate(-25)" />}
    {g === 'point' && <rect x={-150} y={-30} width={125} height={48} rx={24} fill="#fff" {...S} />}
    {g === 'point' && <rect x={-36} y={-108} width={42} height={84} rx={21} fill="#fff" {...S} />}
    <ellipse cx={0} cy={0} rx={68} ry={62} fill="#fff" {...S} />
    {g !== 'open' && <path d="M -40 -26 q -20 26 0 52 M -14 -34 q -16 34 0 68" fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />}
    {g === 'fist' && <ellipse cx={-6} cy={-50} rx={34} ry={22} fill="#fff" {...S} />}
    <ellipse cx={8} cy={28} rx={30} ry={13} fill="#DCD9FF" opacity={0.75} />
  </g>
);

const Arm: React.FC<{from: V; to: V}> = ({from, to}) => (
  <>
    <line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} stroke={INK} strokeWidth={86} strokeLinecap="round" />
    <line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} stroke={ARM} strokeWidth={66} strokeLinecap="round" />
  </>
);

const Sparks: React.FC<{x: number; y: number; color: string; rot?: number; scale?: number}> = ({x, y, color, rot = 0, scale = 1}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale})`} stroke={color} strokeWidth={22} strokeLinecap="round">
    <line x1={0} y1={-20} x2={0} y2={-80} />
    <line x1={-40} y1={-6} x2={-80} y2={-46} />
    <line x1={40} y1={-6} x2={80} y2={-46} />
  </g>
);

const Shoe: React.FC<{x: number; y: number; rot: number}> = ({x, y, rot}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(1.15)`}>
    <ellipse cx={0} cy={6} rx={104} ry={58} fill="#fff" {...S} />
    <path d="M -34 -34 Q -10 -64 36 -58 Q 64 -50 66 -22 Q 20 -14 -34 -34 Z" fill={ARM} {...S} />
    <path d="M -96 22 Q 0 52 98 22" fill="none" stroke="#C9C6F2" strokeWidth={10} strokeLinecap="round" />
    <ellipse cx={-40} cy={-30} rx={24} ry={9} fill="#fff" opacity={0.55} />
  </g>
);

export const ShieldMascot: React.FC<{
  frame: number; height: number; pose?: ShieldPose; prevPose?: ShieldPose; poseT?: number; expr?: ShieldExpr;
  talk?: number; glow?: number; draw?: number; flip?: boolean; sparks?: boolean;
}> = ({frame, height, pose = 'point', prevPose, poseT = 1, expr, talk = 0, glow = 0, draw = 1, flip, sparks = true}) => {
  const width = (height * 1374) / 1145;
  const ex: ShieldExpr = expr ?? DEFAULT_EXPR[pose];
  const P0 = POSES[prevPose ?? pose], P1 = POSES[pose];
  const t = Math.min(1, Math.max(0, poseT));
  const waveOff = pose === 'wave' ? Math.sin(frame / 4) * 34 : 0;
  const cheerOff = pose === 'cheer' ? -Math.abs(Math.sin(frame / 5)) * 26 : 0;
  const lh: Hand = {p: lerpV(P0.l.p, [P1.l.p[0] + waveOff, P1.l.p[1] + cheerOff], t), g: t < 0.5 ? P0.l.g : P1.l.g};
  const rh: Hand = {p: lerpV(P0.r.p, [P1.r.p[0], P1.r.p[1] + cheerOff], t), g: t < 0.5 ? P0.r.g : P1.r.g};
  const aim = (hand: V, sh: V) => (Math.atan2(sh[1] - hand[1], sh[0] - hand[0]) * 180) / Math.PI;

  const kick = pose === 'cheer' ? t : prevPose === 'cheer' ? 1 - t : 0;
  const hop = pose === 'cheer' ? Math.abs(Math.sin(frame / 5)) * 26 : 0;
  const bob = Math.sin(frame / 9) * 9 - hop;
  const squash = Math.sin(frame / 9 + 1.2) * 0.014 + talk * 0.012;
  const blink = (ex === 'normal' || ex === 'wink' || ex === 'think') && frame % 78 < 3;
  const open = 0.15 + talk * 0.85;
  const glowPx = glow * 36;

  const eye = (cx: number, cy: number, k = 1, look: V = [0, 0]) =>
    blink
      ? <path d={`M ${cx - 50} ${cy + 4} q 50 26 100 0`} fill="none" stroke={INK} strokeWidth={17} strokeLinecap="round" />
      : (
        <g>
          <ellipse cx={cx} cy={cy} rx={56 * k} ry={68 * k} fill="url(#shield-eye)" stroke={INK} strokeWidth={5} />
          <circle cx={cx + 18 * k + look[0]} cy={cy - 26 * k + look[1]} r={20 * k} fill="#fff" />
          <circle cx={cx - 20 * k + look[0]} cy={cy + 28 * k + look[1]} r={9 * k} fill="#fff" />
          {ex === 'surprised' && <circle cx={cx + 26 * k} cy={cy + 10 * k} r={6} fill="#fff" />}
        </g>
      );
  const happyEye = (cx: number, cy: number) => <path d={`M ${cx - 52} ${cy + 18} Q ${cx} ${cy - 44} ${cx + 52} ${cy + 18}`} fill="none" stroke={INK} strokeWidth={20} strokeLinecap="round" />;

  const mouthBottom = 412 + 92 * open;
  const mouth = ex === 'surprised'
    ? <ellipse cx={690} cy={462} rx={26} ry={30 + talk * 12} fill="#7A1638" stroke={INK} strokeWidth={6} />
    : ex === 'think' && talk < 0.15
      ? <path d="M 650 452 Q 690 438 730 456" fill="none" stroke={INK} strokeWidth={12} strokeLinecap="round" />
      : (
        <g>
          <path d={`M 636 410 Q 690 428 746 410 Q 734 ${mouthBottom} 690 ${mouthBottom} Q 646 ${mouthBottom} 636 410 Z`} fill="#7A1638" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
          {open > 0.3 && <ellipse cx={690} cy={mouthBottom - 20 * open} rx={34 * open} ry={16 * open} fill="#FF5C7A" />}
        </g>
      );

  return (
    <svg width={width} height={height} viewBox="0 0 1374 1145" style={{overflow: 'visible', transform: flip ? 'scaleX(-1)' : undefined}}>
      <defs>
        <linearGradient id="shield-rim" x1="0.1" y1="0.05" x2="0.9" y2="0.95">
          <stop offset="0" stopColor="#8CC8FF" /><stop offset="0.5" stopColor="#5C86FF" /><stop offset="1" stopColor="#5232C9" />
        </linearGradient>
        <linearGradient id="shield-face" x1="0.15" y1="0.1" x2="0.85" y2="0.95">
          <stop offset="0" stopColor="#3D9CFF" /><stop offset="1" stopColor="#7650F0" />
        </linearGradient>
        <linearGradient id="shield-eye" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0" stopColor="#0E0B36" /><stop offset="0.65" stopColor="#1B2270" /><stop offset="1" stopColor="#3B5BD6" />
        </linearGradient>
        <filter id="shield-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={glowPx / 2 + 0.01} result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* ground shadow (shrinks while hopping) */}
      <ellipse cx={730} cy={1075} rx={330 - hop * 2} ry={30} fill="#B7BFFF" opacity={0.4} />

      <g transform={`translate(0 ${bob}) translate(700 960) scale(${1 + squash} ${1 - squash}) translate(-700 -960)`}>
        {/* legs + sneakers */}
        <line x1={612} y1={880} x2={lerp(602, 560, kick)} y2={lerp(955, 925, kick)} stroke={INK} strokeWidth={94} strokeLinecap="round" />
        <line x1={612} y1={880} x2={lerp(602, 560, kick)} y2={lerp(955, 925, kick)} stroke={ARM} strokeWidth={74} strokeLinecap="round" />
        <line x1={790} y1={872} x2={830} y2={930} stroke={INK} strokeWidth={94} strokeLinecap="round" />
        <line x1={790} y1={872} x2={830} y2={930} stroke={ARM} strokeWidth={74} strokeLinecap="round" />
        <Shoe x={lerp(585, 520, kick)} y={lerp(1010, 960, kick)} rot={lerp(4, 32, kick)} />
        <Shoe x={885} y={985} rot={-14} />

        <Arm from={SHOULDER_L} to={lh.p} />
        <Arm from={SHOULDER_R} to={rh.p} />

        {/* bevelled shield: rim, then the inset face */}
        <path d="M 362 238 Q 352 228 368 222 L 740 97 Q 752 92 764 98 L 1116 290 Q 1131 298 1128 314 L 1096 560 Q 1074 770 662 936 Q 646 943 632 934 Q 418 770 393 585 Z"
          fill="url(#shield-rim)" stroke={INK} strokeWidth={11} strokeLinejoin="round" />
        <path d="M 424 284 L 750 172 L 1064 340 L 1038 556 Q 1018 720 650 870 Q 470 734 450 582 Z"
          fill="url(#shield-face)" stroke="#A9C6FF" strokeWidth={5} strokeLinejoin="round" />
        <path d="M 458 356 Q 478 314 534 292" fill="none" stroke="#fff" strokeWidth={22} strokeLinecap="round" opacity={0.9} />
        <circle cx={452} cy={402} r={11} fill="#fff" opacity={0.85} />

        {/* face */}
        {ex === 'happy' && <>{happyEye(550, 368)}{happyEye(840, 382)}</>}
        {ex === 'wink' && <>{eye(550, 352)}<path d="M 786 404 Q 838 340 896 388" fill="none" stroke={INK} strokeWidth={22} strokeLinecap="round" /><path d="M 892 384 l 22 -10" stroke={INK} strokeWidth={14} strokeLinecap="round" /></>}
        {ex === 'normal' && <>{eye(550, 352)}{eye(840, 368)}</>}
        {ex === 'surprised' && <>{eye(550, 352, 1.12)}{eye(840, 368, 1.12)}</>}
        {ex === 'think' && (
          <>
            {eye(550, 352, 1, [8, -14])}{eye(840, 368, 1, [8, -14])}
            <path d="M 500 262 Q 545 248 590 268 M 800 278 Q 845 256 890 268" fill="none" stroke={INK} strokeWidth={12} strokeLinecap="round" />
          </>
        )}
        <ellipse cx={462} cy={465} rx={44} ry={21} fill="#FF9CC0" opacity={0.9} />
        <ellipse cx={918} cy={482} rx={46} ry={21} fill="#FF9CC0" opacity={0.9} />
        {mouth}
        {ex === 'surprised' && <path d="M 985 290 q 24 32 0 56 q -24 -24 0 -56 Z" fill="#9FD8FF" stroke={INK} strokeWidth={6} />}

        {/* belly check: can glow and be redrawn */}
        <path d="M 565 612 L 660 706 L 842 548" fill="none" stroke="#fff" strokeWidth={80} strokeLinecap="round" strokeLinejoin="round"
          pathLength={1} strokeDasharray={1} strokeDashoffset={1 - Math.min(1, Math.max(0, draw))} filter={glow > 0 ? 'url(#shield-glow)' : undefined} />

        <GloveShape at={lh.p} g={lh.g} rot={aim(lh.p, SHOULDER_L)} mirror={false} />
        <GloveShape at={rh.p} g={rh.g} rot={aim(rh.p, SHOULDER_R)} mirror />

        {sparks && t > 0.9 && pose === 'point' && <Sparks x={175} y={430} color="#4FB4F5" rot={-40} />}
        {sparks && t > 0.9 && pose === 'present' && <><Sparks x={150} y={420} color="#4FB4F5" rot={-45} /><Sparks x={1240} y={440} color="#4FB4F5" rot={45} /></>}
        {sparks && t > 0.9 && pose === 'wave' && <Sparks x={175} y={300} color="#4FB4F5" rot={-35} scale={0.8} />}
        {sparks && t > 0.9 && (pose === 'cheer' || ex === 'surprised') && <Sparks x={1000} y={170} color="#F6C343" rot={20} />}
        {sparks && t > 0.9 && pose === 'cheer' && <Sparks x={430} y={160} color="#F6C343" rot={-20} />}
        {(pose === 'think' || ex === 'think') && (
          <text x={1060} y={230} fontSize={160} fontWeight={900} fill="#3C7BF5" stroke={INK} strokeWidth={5} fontFamily="Microsoft YaHei">?</text>
        )}
      </g>
    </svg>
  );
};
