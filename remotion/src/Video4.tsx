import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, Easing} from 'remotion';
import {FPS, TEXT4, sceneById, defaultTiming4, type Scene, type Timing4} from './timing4';
import {FONT, clamp, chunks} from './Video';
import sprites from '../public/shield/sprites.json';
import spritesR1 from '../public/robot1/sprites.json';
import spritesR2 from '../public/robot2/sprites.json';
import spritesR3 from '../public/robot3/sprites.json';
import {TechBackdrop, THEMES, type TechTheme} from './TechBackdrop';

// v4: 9:16 "图解科普" in the style of flat-icon explainers: light graph-paper background, thick-outline icons,
// diagrams that GROW across the beats of a scene, a small original mascot as guide, grey subtitle bar.
export const INK = '#12384a';
export const NAVY = '#164863';
export const TEAL = '#3A9E94';
const TEAL_PAPER = TEAL;
export const MINT = '#CDE8E3';
export const GREEN = '#1E8E5A';
export const ORANGE = '#F28C28';
export const RED = '#E0524A';
export const YELLOW = '#FFD23F';
export const PEACH = '#F9D5B0';
export const BG = '#E8EEF0';
export const W = 1080, H = 1920;
export const SUB_BOTTOM = 300;

export const pop = (f: number, at: number, damping = 12) => spring({frame: f - at, fps: FPS, config: {damping, stiffness: 190, mass: 0.7}});

// ---------- layout primitives ----------

/** Centered element that pops in at frame `at`. */
export const P: React.FC<{f: number; at: number; x: number; y: number; w?: number; rot?: number; children: React.ReactNode; z?: number}> = ({f, at, x, y, w, rot = 0, children, z}) => {
  const p = pop(f, at);
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, transform: `translate(-50%, -50%) scale(${Math.max(0, p)}) rotate(${rot}deg)`, opacity: Math.min(1, p * 2), zIndex: z}}>
      {children}
    </div>
  );
};

export const Text: React.FC<{size?: number; color?: string; weight?: number; align?: 'left' | 'center'; children: React.ReactNode; style?: React.CSSProperties}> = ({size = 48, color = INK, weight = 900, align = 'center', children, style}) => (
  <div style={{fontFamily: FONT, fontSize: size, fontWeight: weight, color, textAlign: align, lineHeight: 1.18, WebkitTextStroke: size > 70 ? `2px ${color}` : undefined, whiteSpace: 'nowrap', ...style}}>{children}</div>
);

export const Chip: React.FC<{color?: string; fg?: string; size?: number; children: React.ReactNode}> = ({color = NAVY, fg = '#fff', size = 44, children}) => (
  <div style={{display: 'inline-block', background: color, color: fg, fontFamily: FONT, fontWeight: 900, fontSize: size, padding: '10px 30px', borderRadius: 18, border: `4px solid ${INK}`, whiteSpace: 'nowrap'}}>{children}</div>
);

export const Title: React.FC<{f: number; at?: number; size?: number; children: React.ReactNode}> = ({f, at = 0, size = 128, children}) => {
  const p = pop(f, at, 14);
  return (
    <div style={{position: 'absolute', left: 70, top: 150, opacity: Math.min(1, p * 2), transform: `translateY(${(1 - p) * 50}px)`}}>
      <Text size={size} align="left">{children}</Text>
    </div>
  );
};
export const G: React.FC<{children: React.ReactNode; color?: string}> = ({children, color = GREEN}) => <span style={{color, WebkitTextStroke: `2px ${color}`}}>{children}</span>;

export const Grid: React.FC = () => {
  const f = useCurrentFrame();
  const lines = Array.from({length: 17}, (_, i) => -80 + i * 10);
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
      <rect width={W} height={H} fill={BG} />
      {lines.map((a) => {
        const r = ((a + Math.sin(f / 90) * 1.5) * Math.PI) / 180;
        return <line key={a} x1={540} y1={-300} x2={540 + Math.sin(r) * 3200} y2={-300 + Math.cos(r) * 3200} stroke="#CCD8DC" strokeWidth={3} opacity={0.7} />;
      })}
      {[500, 780, 1060, 1340, 1620].map((y) => <line key={y} x1={0} y1={y} x2={W} y2={y} stroke="#D6E0E3" strokeWidth={2} opacity={0.8} />)}
    </svg>
  );
};

// ---------- icons (flat, thick outline) ----------
export const S = {fill: 'none', stroke: INK, strokeWidth: 5, strokeLinecap: 'round', strokeLinejoin: 'round'} as const;

export const IconDoc: React.FC<{w?: number; tag?: string}> = ({w = 200, tag}) => (
  <svg width={w} height={w * 1.17} viewBox="0 0 120 140">
    <path d="M18 8h58l26 26v98H18z" {...S} fill="#fff" />
    <path d="M76 8v26h26" {...S} fill={MINT} />
    <path d="M32 58h54M32 74h54M32 90h34" {...S} />
    <rect x="32" y="102" width="12" height="20" {...S} fill={TEAL} strokeWidth={4} />
    <rect x="50" y="108" width="12" height="14" {...S} fill={YELLOW} strokeWidth={4} />
    {tag && <><rect x="0" y="22" width="62" height="28" rx="8" {...S} fill={RED} strokeWidth={4} /><text x="31" y="43" textAnchor="middle" fontSize="20" fontWeight="900" fill="#fff" fontFamily={FONT}>{tag}</text></>}
  </svg>
);

export const IconBuilding: React.FC<{w?: number; kind: 'lab' | 'hospital'; dim?: boolean}> = ({w = 180, kind, dim}) => (
  <svg width={w} height={w} viewBox="0 0 120 120" opacity={dim ? 0.45 : 1}>
    <rect x="16" y="34" width="88" height="76" rx="6" {...S} fill={kind === 'lab' ? MINT : '#fff'} />
    <rect x="48" y="78" width="24" height="32" {...S} fill={PEACH} />
    <rect x="24" y="48" width="18" height="16" {...S} fill="#fff" strokeWidth={4} />
    <rect x="78" y="48" width="18" height="16" {...S} fill="#fff" strokeWidth={4} />
    <circle cx="60" cy="20" r="17" {...S} fill={kind === 'lab' ? TEAL : RED} />
    {kind === 'hospital' ? <path d="M60 12v16M52 20h16" stroke="#fff" strokeWidth={6} strokeLinecap="round" /> : <path d="M55 11h10M57 11v8l-7 11h20l-7-11v-8" {...S} fill="#fff" strokeWidth={3.5} />}
  </svg>
);

export const IconClipboard: React.FC<{w?: number; cross?: boolean}> = ({w = 170, cross}) => (
  <svg width={w} height={w * 1.2} viewBox="0 0 120 144">
    <rect x="14" y="14" width="92" height="120" rx="10" {...S} fill="#fff" />
    <rect x="40" y="4" width="40" height="20" rx="6" {...S} fill={TEAL} />
    {cross ? <path d="M60 52v44M38 74h44" stroke={RED} strokeWidth={13} strokeLinecap="round" /> : <path d="M32 54h56M32 74h56M32 94h36" {...S} />}
  </svg>
);

export const IconChip: React.FC<{w?: number}> = ({w = 150}) => (
  <svg width={w} height={w} viewBox="0 0 120 120">
    <path d="M36 14v14M60 14v14M84 14v14M36 92v14M60 92v14M84 92v14M14 36h14M14 60h14M14 84h14M92 36h14M92 60h14M92 84h14" {...S} />
    <rect x="26" y="26" width="68" height="68" rx="9" {...S} fill={TEAL} />
    <rect x="44" y="44" width="32" height="32" rx="5" {...S} fill={MINT} />
  </svg>
);

export const IconRouter: React.FC<{w?: number}> = ({w = 200}) => (
  <svg width={w} height={w * 0.8} viewBox="0 0 120 96">
    <path d="M30 56L22 14M60 56V8M90 56l8-42" {...S} />
    <rect x="8" y="54" width="104" height="34" rx="10" {...S} fill="#fff" />
    <circle cx="30" cy="71" r="4.5" fill={GREEN} /><circle cx="46" cy="71" r="4.5" fill={ORANGE} /><circle cx="62" cy="71" r="4.5" fill={TEAL} />
    <path d="M84 71h16" {...S} />
  </svg>
);

export const IconFactory: React.FC<{w?: number}> = ({w = 150}) => (
  <svg width={w} height={w} viewBox="0 0 120 120">
    <path d="M14 104V52l26 16V52l26 16V52l26 16V30h14v74z" {...S} fill="#fff" />
    <rect x="86" y="10" width="14" height="22" {...S} fill={TEAL} strokeWidth={4} />
    <rect x="28" y="82" width="14" height="14" {...S} fill={YELLOW} strokeWidth={4} /><rect x="56" y="82" width="14" height="14" {...S} fill={YELLOW} strokeWidth={4} />
  </svg>
);

export const IconPerson: React.FC<{w?: number}> = ({w = 130}) => (
  <svg width={w} height={w} viewBox="0 0 120 120">
    <circle cx="60" cy="36" r="22" {...S} fill={PEACH} />
    <path d="M16 108c0-26 18-40 44-40s44 14 44 40z" {...S} fill={NAVY} />
  </svg>
);

export const IconCalendar: React.FC<{w?: number; head?: string}> = ({w = 520, head = '10 月'}) => (
  <svg width={w} height={w * 0.92} viewBox="0 0 160 148">
    <rect x="10" y="20" width="140" height="120" rx="14" {...S} fill="#fff" />
    <path d="M10 34a14 14 0 0 1 14-14h112a14 14 0 0 1 14 14v22H10z" {...S} fill={ORANGE} />
    <path d="M44 6v26M116 6v26" {...S} strokeWidth={8} />
    <text x="80" y="48" textAnchor="middle" fontSize="20" fontWeight="900" fill="#fff" fontFamily={FONT}>{head}</text>
  </svg>
);

export const IconHourglass: React.FC<{w?: number; f?: number}> = ({w = 170, f = 0}) => {
  const k = (f % 90) / 90;
  return (
    <svg width={w} height={w * 1.3} viewBox="0 0 100 130">
      <path d="M16 8h68M16 122h68" {...S} strokeWidth={8} />
      <path d="M24 8c0 38 26 42 26 57S24 84 24 122M76 8c0 38-26 42-26 57s26 19 26 57" {...S} fill="#fff" />
      <path d={`M${34 + k * 8} ${20 + k * 20}h${32 - k * 16}l-${16 - k * 8} ${28 - k * 10}z`} fill={ORANGE} />
      <path d={`M50 ${122 - 6 - k * 30}l${-12 - k * 6} ${k * 30 + 6}h${24 + k * 12}z`} fill={ORANGE} />
    </svg>
  );
};

export const IconPhone: React.FC<{w?: number}> = ({w = 120}) => (
  <svg width={w} height={w * 1.6} viewBox="0 0 75 120">
    <rect x="6" y="4" width="63" height="112" rx="12" {...S} fill="#fff" />
    <circle cx="37" cy="60" r="16" {...S} fill={MINT} /><circle cx="37" cy="60" r="6" fill={TEAL} />
    <path d="M30 14h15" {...S} />
  </svg>
);

export const Badge: React.FC<{kind: 'tick' | 'cross' | 'warn' | 'q'; size?: number}> = ({kind, size = 70}) => {
  const bg = kind === 'tick' ? GREEN : kind === 'q' ? ORANGE : RED;
  return (
    <div style={{width: size, height: size, borderRadius: size / 2, background: bg, border: `5px solid ${INK}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: FONT, fontWeight: 900, fontSize: size * 0.62}}>
      {kind === 'tick' ? '✓' : kind === 'cross' ? '✕' : kind === 'warn' ? '!' : '?'}
    </div>
  );
};

// ---------- connectors / bubble / mascot ----------
export const Line: React.FC<{f: number; at: number; x1: number; y1: number; x2: number; y2: number; color?: string; dashed?: boolean; dur?: number}> = ({f, at, x1, y1, x2, y2, color = INK, dashed, dur = 14}) => {
  const t = interpolate(f, [at, at + dur], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  if (t <= 0) return null;
  const ex = x1 + (x2 - x1) * t, ey = y1 + (y2 - y1) * t;
  const ang = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
  return (
    <>
      <line x1={x1} y1={y1} x2={ex} y2={ey} stroke={color} strokeWidth={9} strokeLinecap="round" strokeDasharray={dashed ? '4 22' : undefined} />
      {t > 0.95 && <polygon points="0,-20 36,0 0,20" fill={color} transform={`translate(${x2},${y2}) rotate(${ang}) translate(-14,0)`} />}
    </>
  );
};

export const Bubble: React.FC<{f: number; at: number; x: number; y: number; w: number; children: React.ReactNode; tail?: 'left' | 'down'}> = ({f, at, x, y, w, children, tail = 'left'}) => {
  const p = pop(f, at, 10);
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, transform: `scale(${Math.max(0, p)})`, transformOrigin: tail === 'left' ? '0% 70%' : '20% 100%', opacity: Math.min(1, p * 2)}}>
      <div style={{background: PEACH, border: `5px solid ${INK}`, borderRadius: 30, padding: '16px 26px', textAlign: 'center'}}>
        <Text size={48} style={{whiteSpace: 'normal'}}>{children}</Text>
      </div>
      {tail === 'left'
        ? <div style={{position: 'absolute', left: -22, top: '58%', width: 36, height: 36, background: PEACH, borderLeft: `5px solid ${INK}`, borderBottom: `5px solid ${INK}`, transform: 'rotate(45deg)'}} />
        : <div style={{position: 'absolute', left: 46, bottom: -22, width: 36, height: 36, background: PEACH, borderRight: `5px solid ${INK}`, borderBottom: `5px solid ${INK}`, transform: 'rotate(45deg)'}} />}
    </div>
  );
};

export type Pose = 'master' | 'point' | 'surprised' | 'think' | 'check' | 'wave';

// Which guide character to draw: the original engineer (v4) or the client's shield mascot (v4Q).
export const MascotCtx = React.createContext<string>('engineer'); // 'engineer' or a sprite folder under public/
// Scene look: the original graph paper, or one of the tech themes from the robot IP sheets.
export const ThemeCtx = React.createContext<'paper' | TechTheme>('paper');
export const SceneOffsetCtx = React.createContext(0); // scene start frame -> absolute time for lip-sync
// Narration voice in use (timing + audio folder + loudness envelope).
export const Timing4Ctx = React.createContext<Timing4>(defaultTiming4);
const SHIELD_POSE: Record<Pose, string> = {master: 'idle', point: 'point', surprised: 'surprised', think: 'think', check: 'cheer', wave: 'wave'};
type SpriteMeta = Record<string, {w: number; h: number; talk: boolean; blink: boolean}>;
const SPRITE_SETS: Record<string, SpriteMeta> = {shield: sprites as SpriteMeta, robot1: spritesR1 as SpriteMeta, robot2: spritesR2 as SpriteMeta, robot3: spritesR3 as SpriteMeta};

/** Loudness (0..1) of the narration at an absolute frame. */
const ampAt = (tm: Timing4, abs: number) => {
  for (const s of tm.scenes) for (const bt of s.beats) {
    const i = abs - (s.from + bt.from);
    const e = tm.env[bt.clip];
    if (e && i >= 0 && i < e.length) return e[i];
  }
  return 0;
};

const ShieldGuide: React.FC<{f: number; at: number; pose: Pose; x: number; w: number; h: number; bottom: number}> = ({f, at, pose, x, h, bottom}) => {
  const off = React.useContext(SceneOffsetCtx);
  const dir = React.useContext(MascotCtx);
  const tm = React.useContext(Timing4Ctx);
  const abs = off + f;
  const name = SHIELD_POSE[pose];
  const meta = SPRITE_SETS[dir][name];
  const hh = h >= 900 ? 820 : Math.max(h, 300);            // full body, never cropped
  const ww = (hh * meta.w) / meta.h;
  const amp = ampAt(tm, abs);
  const talking = amp > 0.28 && meta.talk;
  const blink = !talking && meta.blink && abs % 78 < 4;
  const src = `${dir}/${name}${talking ? '_talk' : blink ? '_blink' : ''}.png`;
  const p = pop(f, at, 11);
  const bob = Math.sin(abs / 9) * 6;
  const sq = amp * 0.03;
  const glow = pose === 'check' ? 10 + 8 * Math.sin(abs / 5) : 0;
  return (
    <div style={{position: 'absolute', left: x, top: bottom - hh, width: ww, height: hh, opacity: p > 0.01 ? 1 : 0,
      transform: `translateY(${(1 - Math.min(1, p)) * hh * 0.8 + bob}px) scale(${1 + sq}, ${1 - sq})`, transformOrigin: '50% 100%',
      filter: glow ? `drop-shadow(0 0 ${glow}px rgba(255,255,255,0.95))` : undefined}}>
      <div style={{position: 'absolute', left: '12%', right: '12%', bottom: -10, height: 30, borderRadius: '50%', background: 'rgba(120,130,220,0.25)'}} />
      <Img src={staticFile(src)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}} />
    </div>
  );
};

export const Mascot: React.FC<{f: number; at?: number; pose: Pose; x?: number; w?: number; h?: number; bottom?: number}> = ({f, at = 6, pose, x = 20, w = 380, h = 460, bottom = H - SUB_BOTTOM - 80}) => {
  const kind = React.useContext(MascotCtx);
  if (kind !== 'engineer') return <ShieldGuide f={f} at={at} pose={pose} x={x} w={w} h={h} bottom={bottom} />;
  const p = pop(f, at, 13);
  const bob = Math.sin(f / 9) * 5;
  return (
    <div style={{position: 'absolute', left: x, top: bottom - h, width: w, height: h, overflow: 'hidden', opacity: p > 0.01 ? 1 : 0, transform: `translateY(${(1 - Math.min(1, p)) * h * 0.7 + bob}px)`}}>
      <Img src={staticFile(`char/${pose}.png`)} style={{width: w, height: h, objectFit: 'cover', objectPosition: 'center top'}} />
    </div>
  );
};

export const Wipe: React.FC<{f: number}> = ({f}) => {
  const theme = React.useContext(ThemeCtx);
  if (f > 12) return null;
  const TEAL = theme === 'paper' ? TEAL_PAPER : THEMES[theme].wipe;
  const x = interpolate(f, [0, 12], [-W, W + 200], {easing: Easing.inOut(Easing.cubic)});
  return <div style={{position: 'absolute', left: x, top: 0, width: W, height: H, background: TEAL, opacity: 0.9, transform: 'skewX(-12deg)', zIndex: 50}} />;
};

export const useShake = (f: number, at: number, amp = 14) => {
  const k = Math.max(0, 1 - (f - at) / 10) * (f >= at ? 1 : 0);
  return {transform: `translate(${Math.sin(f * 7.3) * amp * k}px, ${Math.cos(f * 6.1) * amp * k}px)`};
};

// ---------- scenes ----------
type SP = {s: Scene; b: number[]};

const SceneHook: React.FC<SP> = ({b}) => {
  const f = useCurrentFrame();
  return (
    <div style={{position: 'absolute', inset: 0, ...useShake(f, 8)}}>
      <Title f={f}><G>FCC</G> 要投票了</Title>
      <P f={f} at={8} x={540} y={700}>
        <div style={{position: 'relative'}}>
          <IconCalendar w={540} head="10 月" />
          <div style={{position: 'absolute', left: 0, right: 0, top: 135, textAlign: 'center'}}><Text size={210} color={INK}>29</Text></div>
        </div>
      </P>
      <P f={f} at={26} x={600} y={1010}><Chip color={ORANGE} fg="#fff">拟表决 · 实验室认可新规</Chip></P>
      <Mascot f={f} at={2} pose={f < b[1] ? 'surprised' : 'think'} />
      <Bubble f={f} at={b[1] + 4} x={430} y={1210} w={590}>报告还能用吗？</Bubble>
    </div>
  );
};

const SceneValid: React.FC<SP> = ({b}) => {
  const f = useCurrentFrame();
  const stampAt = b[0] + 16;
  const sp = spring({frame: f - stampAt, fps: FPS, config: {damping: 9, stiffness: 260, mass: 0.6}});
  const dash = interpolate(f, [b[1], b[1] + 18], [0, 1], clamp);
  return (
    <div style={{position: 'absolute', inset: 0, ...useShake(f, stampAt)}}>
      <Title f={f}>证书<G>不会作废</G></Title>
      <P f={f} at={4} x={540} y={760}><IconDoc w={440} /></P>
      {f >= stampAt && (
        <div style={{position: 'absolute', left: 540, top: 880, transform: `translate(-50%, -50%) rotate(-12deg) scale(${3 - 2 * Math.min(1, sp)})`, opacity: Math.min(1, sp * 2),
          border: `12px solid ${GREEN}`, color: GREEN, borderRadius: 22, padding: '4px 36px', fontFamily: FONT, fontWeight: 900, fontSize: 130, letterSpacing: 6, background: 'rgba(255,255,255,0.88)'}}>VALID</div>
      )}
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <rect x={250} y={420} width={580} height={680} rx={30} fill="none" stroke={ORANGE} strokeWidth={8} strokeDasharray="30 22" strokeDashoffset={(1 - dash) * 400} opacity={dash} />
      </svg>
      <P f={f} at={b[1] + 4} x={540} y={1190}><Chip color={ORANGE}>现在只是提案</Chip></P>
      <Mascot f={f} at={b[0] + 24} pose="check" />
      <Bubble f={f} at={b[0] + 34} x={430} y={1250} w={420}>先别慌</Bubble>
    </div>
  );
};

const SceneAnalogy: React.FC<SP> = ({b}) => {
  const f = useCurrentFrame();
  const eq = (y: number, at: number) => <P f={f} at={at} x={540} y={y}><Text size={140} color={ORANGE}>=</Text></P>;
  const label = (t: string) => <div style={{marginTop: 6}}><Text size={50}>{t}</Text></div>;
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <Title f={f}>打个<G>比方</G></Title>
      <P f={f} at={b[0]} x={250} y={540}><div style={{textAlign: 'center'}}><IconDoc w={230} />{label('认证报告')}</div></P>
      {eq(540, b[0] + 10)}
      <P f={f} at={b[0] + 18} x={830} y={540}><div style={{textAlign: 'center'}}><IconClipboard w={200} cross />{label('体检报告')}</div></P>

      <P f={f} at={b[1]} x={250} y={890}><div style={{textAlign: 'center'}}><IconBuilding w={250} kind="lab" />{label('实验室')}</div></P>
      {eq(890, b[1] + 10)}
      <P f={f} at={b[1] + 18} x={830} y={890}><div style={{textAlign: 'center'}}><IconBuilding w={250} kind="hospital" />{label('医院')}</div></P>

      {[250, 540, 830].map((x, i) => (
        <P key={x} f={f} at={b[2] + i * 8} x={x} y={1235}>
          <div style={{position: 'relative'}}>
            <IconBuilding w={200} kind="hospital" dim={i === 2} />
            <div style={{position: 'absolute', right: -14, top: -10}}><Badge kind={i === 2 ? 'cross' : 'tick'} size={64} /></div>
          </div>
        </P>
      ))}
      <P f={f} at={b[2] + 26} x={540} y={1415}><Chip color={NAVY} size={42}>FCC 重新划线：谁的报告算数</Chip></P>
    </div>
  );
};

const SceneChain: React.FC<SP> = ({b}) => {
  const f = useCurrentFrame();
  const blink = 0.6 + 0.4 * Math.abs(Math.sin(f / 7));
  const box = (y: number, color: string, fg: string, icon: React.ReactNode, text: string, at: number, extra?: React.ReactNode) => (
    <P f={f} at={at} x={540} y={y}>
      <div style={{width: 640, height: 190, borderRadius: 26, background: color, border: `6px solid ${INK}`, display: 'flex', alignItems: 'center', padding: '0 34px', gap: 24, boxShadow: '0 10px 0 rgba(18,56,74,0.25)', position: 'relative'}}>
        {icon}<Text size={50} color={fg} align="left">{text}</Text>{extra}
      </div>
    </P>
  );
  const pdfP = pop(f, b[2] + 6, 11);
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <Title f={f}>报告是<G>谁测的</G>？</Title>
      {box(560, '#fff', INK, <IconPerson w={120} />, '品牌方 / 你', b[0], f >= b[2] ? <div style={{position: 'absolute', right: -40, top: -50, transform: `scale(${pdfP})`}}><IconDoc w={110} tag="PDF" /></div> : null)}
      {box(1150, NAVY, '#fff', <IconBuilding w={130} kind="lab" />, '实验室', b[0] + 10,
        <div style={{position: 'absolute', right: -26, top: -44, opacity: blink}}><Badge kind="q" size={96} /></div>)}
      {f >= b[1] && box(855, '#fff', INK, <div style={{display: 'flex'}}><IconFactory w={100} /><IconChip w={90} /></div>, 'ODM / 模块商', b[1])}
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        {f < b[1] + 6 ? <Line f={f} at={b[0] + 16} x1={540} y1={665} x2={540} y2={1040} dashed color={TEAL} /> : (
          <>
            <Line f={f} at={b[1] + 8} x1={540} y1={665} x2={540} y2={740} />
            <Line f={f} at={b[1] + 16} x1={540} y1={965} x2={540} y2={1040} />
          </>
        )}
      </svg>
      {f >= b[2] && <P f={f} at={b[2] + 14} x={540} y={1380}><Chip color={ORANGE}>你手里，只有一份 PDF</Chip></P>}
      <Mascot f={f} at={b[0] + 20} pose="think" w={260} h={250} bottom={H - SUB_BOTTOM - 80} />
    </div>
  );
};

const SceneImpact: React.FC<SP> = ({b}) => {
  const f = useCurrentFrame();
  const ban = pop(f, b[0] + 16, 9);
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <Title f={f}>若被<G color={RED}>限制</G></Title>
      <P f={f} at={b[0]} x={540} y={620}>
        <div style={{position: 'relative'}}>
          <IconBuilding w={320} kind="lab" />
          <div style={{position: 'absolute', inset: 0, transform: `scale(${Math.max(0, ban)})`}}>
            <svg width={320} height={320} viewBox="0 0 120 120"><circle cx="60" cy="68" r="46" fill="rgba(224,82,74,0.12)" stroke={RED} strokeWidth={9} /><path d="M27 101L93 35" stroke={RED} strokeWidth={9} strokeLinecap="round" /></svg>
          </div>
        </div>
      </P>
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <Line f={f} at={b[1]} x1={540} y1={800} x2={540} y2={900} color={RED} />
        <Line f={f} at={b[1] + 22} x1={540} y1={1130} x2={540} y2={1230} color={RED} />
      </svg>
      <P f={f} at={b[1] + 6} x={540} y={1020}>
        <div style={{display: 'flex', alignItems: 'center', gap: 28}}>
          <div style={{position: 'relative'}}><IconRouter w={240} /><div style={{position: 'absolute', right: -34, top: -26}}><Chip color={YELLOW} fg={INK} size={34}>新型号</Chip></div></div>
        </div>
      </P>
      <P f={f} at={b[1] + 26} x={655} y={1330}>
        <div style={{display: 'flex', alignItems: 'center', gap: 22}}>
          <div style={{position: 'relative'}}><IconDoc w={150} /><div style={{position: 'absolute', right: -30, top: -26}}><Badge kind="warn" size={64} /></div></div>
          <Chip color={RED} size={46}>重新认证 · 可能受影响</Chip>
        </div>
      </P>
      <Mascot f={f} at={b[0] + 24} pose="surprised" w={250} h={250} x={10} />
    </div>
  );
};

const SceneTimeline: React.FC<SP> = ({b}) => {
  const f = useCurrentFrame();
  const x = 170, y0 = 590, step = 270;
  const grow = interpolate(f, [b[0] + 4, b[0] + 70], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const nodes = [
    {d: '10.07', t: '路透社披露表决计划'},
    {d: '10.29', t: 'FCC 拟表决新规则', now: true},
    {d: '2028.12', t: '预计开始实施'},
  ];
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <Title f={f}>离实施<G>还早</G></Title>
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <line x1={x} y1={y0} x2={x} y2={y0 + step * Math.min(1, grow * 2)} stroke={INK} strokeWidth={9} strokeLinecap="round" />
        {grow > 0.5 && <line x1={x} y1={y0 + step} x2={x} y2={y0 + step + (step) * ((grow - 0.5) * 2)} stroke={TEAL} strokeWidth={9} strokeLinecap="round" strokeDasharray="4 22" />}
      </svg>
      {nodes.map((n, i) => {
        const y = y0 + i * step;
        const p = pop(f, b[0] + 6 + i * 22, 11);
        const pulse = n.now ? 1 + 0.4 * ((f % 34) / 34) : 1;
        return (
          <React.Fragment key={n.d}>
            {n.now && <div style={{position: 'absolute', left: x - 34 * pulse, top: y - 34 * pulse, width: 68 * pulse, height: 68 * pulse, borderRadius: '50%', background: ORANGE, opacity: p * (1 - (f % 34) / 34) * 0.5}} />}
            <div style={{position: 'absolute', left: x - 26, top: y - 26, width: 52, height: 52, borderRadius: 26, background: n.now ? ORANGE : '#fff', border: `7px solid ${INK}`, transform: `scale(${Math.max(0, p)})`}} />
            <div style={{position: 'absolute', left: x + 80, top: y - 74, opacity: Math.min(1, p * 2), transform: `translateX(${(1 - Math.min(1, p)) * 50}px)`}}>
              <Text size={100} align="left" color={n.now ? ORANGE : INK}>{n.d}</Text>
              <Text size={48} align="left" weight={700} color={n.now ? INK : '#4A6572'}>{n.t}</Text>
            </div>
          </React.Fragment>
        );
      })}
      <P f={f} at={b[1]} x={600} y={1390}>
        <div style={{display: 'flex', alignItems: 'center', gap: 30}}><IconHourglass w={120} f={f} /><Chip color={ORANGE} size={56}>你有时间</Chip></div>
      </P>
      <Mascot f={f} at={b[1] + 6} pose="check" w={250} h={250} x={10} />
    </div>
  );
};

const CHECKS = ['哪家实验室？', '在哪个国家？', '证书谁申请？', '模块单独认证吗？', '有没有备选方案？'];

const SceneCheck: React.FC<SP> = ({b}) => {
  const f = useCurrentFrame();
  const card = pop(f, 2, 13);
  const flash = interpolate(f, [b[6], b[6] + 6], [0.85, 0], clamp) * (f >= b[6] ? 1 : 0);
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <Title f={f} size={104}>问供应商<G>5 个问题</G></Title>
      <div style={{position: 'absolute', left: 60, top: 430, width: 960, transform: `scale(${Math.max(0, card)})`, transformOrigin: 'top center', opacity: Math.min(1, card * 2)}}>
        <div style={{position: 'absolute', left: 340, top: -30, width: 280, height: 70, borderRadius: 18, background: TEAL, border: `6px solid ${INK}`}} />
        <div style={{background: '#fff', border: `6px solid ${INK}`, borderRadius: 30, padding: '28px 30px 14px', boxShadow: '0 12px 0 rgba(18,56,74,0.25)'}}>
          {CHECKS.map((t, i) => {
            const start = b[i + 1];
            const tick = interpolate(f, [start + 8, start + 22], [0, 1], clamp);
            const active = f >= start && f < (b[i + 2] ?? 1e9);
            const done = f >= start + 8;
            return (
              <div key={t} style={{display: 'flex', alignItems: 'center', height: 150, borderRadius: 18, margin: '0 0 10px', padding: '0 22px', background: active ? '#FFF1DD' : 'transparent', border: `4px solid ${active ? ORANGE : 'transparent'}`}}>
                <div style={{width: 70, height: 70, borderRadius: 35, background: done ? GREEN : '#fff', border: `5px solid ${INK}`, color: done ? '#fff' : INK, fontFamily: FONT, fontWeight: 900, fontSize: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none'}}>{i + 1}</div>
                <div style={{marginLeft: 28, flex: 1}}><Text size={56} align="left">{t}</Text></div>
                <svg width="78" height="78" viewBox="0 0 56 56">
                  <rect x="4" y="4" width="48" height="48" rx="10" fill="#fff" stroke={INK} strokeWidth="5" />
                  <path d="M13 29l10 10 20-23" fill="none" stroke={GREEN} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="56" strokeDashoffset={56 * (1 - tick)} />
                </svg>
              </div>
            );
          })}
        </div>
      </div>
      <AbsoluteFill style={{background: '#fff', opacity: flash, zIndex: 40}} />
      {f >= b[6] && <P f={f} at={b[6] + 6} x={700} y={1430}><div style={{display: 'flex', alignItems: 'center', gap: 20}}><IconPhone w={86} /><Chip color={ORANGE} size={46}>截图 → 转给采购</Chip></div></P>}
      <Mascot f={f} at={b[0] + 10} pose={f >= b[6] ? 'check' : 'point'} w={250} h={250} x={10} />
    </div>
  );
};

const SceneOutro: React.FC<SP> = ({b}) => {
  const f = useCurrentFrame();
  const sticker = pop(f, b[0] + 6, 10);
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <Title f={f}>关注 <G>合规认证通</G></Title>
      <Mascot f={f} at={2} pose="wave" x={10} w={560} h={1020} bottom={H - SUB_BOTTOM - 70} />
      <div style={{position: 'absolute', left: 640, top: 600, transform: `scale(${Math.max(0, sticker)}) rotate(4deg)`, transformOrigin: 'center'}}>
        <div style={{border: '6px dashed #222', borderRadius: 40, padding: 14, background: '#fff', boxShadow: '0 10px 0 rgba(18,56,74,0.25)'}}>
          <div style={{background: NAVY, borderRadius: 28, padding: '34px 36px', textAlign: 'center'}}>
            <Text size={66} color="#fff">合规</Text><Text size={66} color="#fff">认证通</Text>
          </div>
        </div>
      </div>
      <Bubble f={f} at={b[1] + 2} x={560} y={950} w={470} tail="down">新规一出，第一时间告诉你</Bubble>
      <P f={f} at={b[1] + 26} x={800} y={1350}><Text size={56} color={TEAL}>我们下期见~</Text></P>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 150, textAlign: 'center'}}><Text size={26} weight={500} color="#5B7480">信息来源：Reuters、FCC 公开文件 · 以 FCC 正式规则为准</Text></div>
    </div>
  );
};

const SCENES: Record<string, React.FC<SP>> = {hook: SceneHook, valid: SceneValid, analogy: SceneAnalogy, chain: SceneChain, impact: SceneImpact, timeline: SceneTimeline, check: SceneCheck, outro: SceneOutro};

const SceneView: React.FC<{s: Scene; first: boolean}> = ({s, first}) => {
  const f = useCurrentFrame();
  const C = SCENES[s.id];
  return (
    <SceneOffsetCtx.Provider value={s.from}>
    <AbsoluteFill>
      <C s={s} b={s.beats.map((x) => x.from)} />
      {!first && <Wipe f={f} />}
    </AbsoluteFill>
    </SceneOffsetCtx.Provider>
  );
};

const Subtitle: React.FC = () => {
  const f = useCurrentFrame();
  const {scenes} = React.useContext(Timing4Ctx);
  for (const s of scenes) {
    for (const bt of s.beats) {
      const start = s.from + bt.from;
      if (f < start || f >= start + bt.dur) continue;
      const parts = chunks(TEXT4[bt.clip]);
      const total = parts.reduce((n, p) => n + p.length, 0);
      let acc = 0;
      const local = (f - start) / Math.max(1, bt.dur - 6);
      const cur = parts.find((p) => (acc += p.length) / total > local) ?? parts[parts.length - 1];
      return (
        <div style={{position: 'absolute', left: 40, right: 120, bottom: SUB_BOTTOM, display: 'flex', justifyContent: 'center', zIndex: 60}}>
          <div style={{background: 'rgba(70,82,88,0.82)', color: '#fff', fontFamily: FONT, fontSize: 42, fontWeight: 700, padding: '10px 28px', borderRadius: 12, textAlign: 'center', lineHeight: 1.3}}>
            {cur.replace(/[，。：；、]$/, '')}
          </div>
        </div>
      );
    }
  }
  return null;
};

export const Video4: React.FC = () => {
  const theme = React.useContext(ThemeCtx);
  const tm = React.useContext(Timing4Ctx);
  return (
  <AbsoluteFill style={{background: BG}}>
    {theme === 'paper' ? <Grid /> : <TechBackdrop theme={theme} />}
    {tm.scenes.map((s, i) => (
      <Sequence key={s.id} from={s.from} durationInFrames={s.dur} name={s.id}>
        <SceneView s={s} first={i === 0} />
        {s.beats.map((bt) => (
          <Sequence key={bt.clip} from={bt.from} durationInFrames={bt.dur + 12} name={bt.clip}>
            <Audio src={staticFile(`${tm.voDir}/${bt.clip}.mp3`)} />
          </Sequence>
        ))}
      </Sequence>
    ))}
    <Subtitle />
    <div style={{position: 'absolute', right: theme === 'paper' ? 60 : 70, top: theme === 'paper' ? 70 : 1462, fontFamily: FONT, fontSize: 30, fontWeight: 700, color: theme === 'paper' ? '#7E97A1' : THEMES[theme].watermark, zIndex: 60}}>@合规认证通</div>
  </AbsoluteFill>
  );
};

export {sceneById};
