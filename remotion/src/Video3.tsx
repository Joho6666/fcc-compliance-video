import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, Easing} from 'remotion';
import {FPS, TEXT3, TOTAL3, placed, type Placed} from './timing3';
import {KenBurns, FONT, clamp} from './Video';

// v3: 9:16, full-bleed photos + one big keyword per shot, hard cuts, no white "slides".
const ORANGE = '#FF8A3D';
const ACCENT = {navy: ORANGE, red: '#FF5A4F', green: '#3DDC97'} as const;
const CHECKS = ['哪家实验室？', '在哪个国家？', '证书谁申请？', '模块单独认证吗？', '有没有备选方案？'];
const checkStart = placed.find((s) => s.check !== undefined)!.from;

const MOVES: Record<string, {from: number; to: number; ox: [number, number]; oy: [number, number]}> = {
  in: {from: 1.04, to: 1.22, ox: [50, 50], oy: [60, 45]},
  out: {from: 1.24, to: 1.06, ox: [50, 50], oy: [45, 55]},
  panL: {from: 1.22, to: 1.22, ox: [72, 28], oy: [50, 50]},
  panR: {from: 1.22, to: 1.22, ox: [28, 72], oy: [50, 50]},
};

const Keyword: React.FC<{s: Placed; top: number}> = ({s, top}) => {
  const f = useCurrentFrame();
  const p = spring({frame: f, fps: FPS, config: {damping: 11, stiffness: 220, mass: 0.7}});
  const color = ACCENT[s.tint ?? 'navy'];
  const parts = s.accent ? s.kw.split(s.accent) : [s.kw];
  const flip = s.deco === 'flip' ? `perspective(900px) rotateX(${(1 - Math.min(1, p)) * -85}deg)` : '';
  return (
    <div style={{position: 'absolute', left: 40, right: 40, top, textAlign: 'center', fontFamily: FONT, fontWeight: 900, whiteSpace: 'nowrap',
      fontSize: s.kwSize ?? 130, lineHeight: 1.1, color: '#fff', textShadow: '0 8px 40px rgba(0,0,0,0.75), 0 2px 6px rgba(0,0,0,0.6)',
      opacity: Math.min(1, p * 1.6), transform: `${flip} scale(${1.4 - 0.4 * p})`}}>
      {s.accent ? <>{parts[0]}<span style={{color}}>{s.accent}</span>{parts[1]}</> : s.kw}
      {s.sub && <div style={{fontSize: 52, fontWeight: 700, letterSpacing: '0.2em', color, marginTop: 8}}>{s.sub}</div>}
    </div>
  );
};

const Stamp: React.FC = () => {
  const f = useCurrentFrame();
  const p = spring({frame: f - 8, fps: FPS, config: {damping: 9, stiffness: 260, mass: 0.6}});
  return (
    <div style={{position: 'absolute', left: 150, right: 150, top: 1010, transform: `rotate(-10deg) scale(${f < 8 ? 0 : 3 - 2 * p})`, opacity: f < 8 ? 0 : Math.min(1, p * 2),
      border: '14px solid #3DDC97', color: '#3DDC97', borderRadius: 24, textAlign: 'center', fontSize: 150, fontWeight: 900, letterSpacing: '0.1em', fontFamily: FONT,
      padding: '10px 0', background: 'rgba(8,40,28,0.55)'}}>VALID</div>
  );
};

const RedZone: React.FC = () => {
  const f = useCurrentFrame();
  const r = interpolate(f, [0, 30], [0, 1500], {...clamp, easing: Easing.out(Easing.cubic)});
  return <div style={{position: 'absolute', left: 540 - r, top: 1100 - r, width: r * 2, height: r * 2, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(255,60,50,0.0) 35%, rgba(255,60,50,0.42) 100%)', opacity: 0.75 + 0.25 * Math.sin(f / 4)}} />;
};

const Scan: React.FC = () => {
  const f = useCurrentFrame();
  const y = interpolate(f % 36, [0, 36], [380, 1500]);
  return <div style={{position: 'absolute', left: 0, right: 0, top: y, height: 8, background: '#FF5A4F', boxShadow: '0 0 40px 14px rgba(255,90,79,0.65)'}} />;
};

const Checklist: React.FC<{idx: number}> = ({idx}) => {
  const f = useCurrentFrame();
  const enter = spring({frame: f, fps: FPS, config: {damping: 15}});
  return (
    <div style={{position: 'absolute', left: 70, right: 70, top: 560, opacity: Math.min(1, enter * 1.5), transform: `translateY(${(1 - enter) * 60}px)`,
      background: 'rgba(6,16,36,0.88)', border: '2px solid rgba(255,255,255,0.18)', borderRadius: 24, padding: '18px 36px', backdropFilter: 'blur(8px)'}}>
      {CHECKS.map((t, i) => {
        const done = i < idx || idx === 5;
        const now = i === idx;
        const tick = done ? 1 : now ? interpolate(f, [4, 14], [0, 1], clamp) : 0;
        return (
          <div key={t} style={{display: 'flex', alignItems: 'center', height: 150, borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.14)' : 'none',
            opacity: done || now || idx === -1 ? 1 : 0.35}}>
            <div style={{width: 62, height: 62, borderRadius: 31, border: `4px solid ${ORANGE}`, color: ORANGE, fontSize: 34, fontWeight: 900, flex: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{i + 1}</div>
            <div style={{marginLeft: 30, flex: 1, fontSize: 48, fontWeight: 800, color: now ? ORANGE : '#fff', fontFamily: FONT}}>{t}</div>
            <svg width="64" height="64" viewBox="0 0 56 56">
              <rect x="4" y="4" width="48" height="48" rx="9" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="4" />
              <path d="M13 29l10 10 20-23" fill="none" stroke="#3DDC97" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"
                strokeDasharray="56" strokeDashoffset={56 * (1 - tick)} />
            </svg>
          </div>
        );
      })}
    </div>
  );
};

const ShotView: React.FC<{s: Placed}> = ({s}) => {
  const f = useCurrentFrame();
  const isCheck = s.check !== undefined;
  const m = MOVES[s.move];
  // jitter after an impact (shot start, or the stamp landing at frame 8)
  const impact = s.deco === 'stamp' ? 8 : 0;
  const amp = s.shake ?? s.deco === 'stamp' ? Math.max(0, 1 - (f - impact) / 10) * (f >= impact ? 1 : 0) : 0;
  const jx = Math.sin(f * 7.3) * 14 * amp, jy = Math.cos(f * 6.1) * 14 * amp;
  const grey = s.deco === 'grey' ? interpolate(f, [4, 26], [0, 1], clamp) : 0;
  const abs = s.from + f;
  return (
    <AbsoluteFill style={{background: '#050e20', transform: `translate(${jx}px, ${jy}px) scale(${1 + amp * 0.02})`}}>
      <div style={{position: 'absolute', inset: 0, filter: `grayscale(${grey}) brightness(${1 - grey * 0.25})`}}>
        {isCheck
          ? <div style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>
              <img src={staticFile(`img/${s.img}.png`)} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.1 + (abs - checkStart) * 0.0004})`}} />
            </div>
          : <KenBurns src={s.img} dur={s.dur} {...m} />}
      </div>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(5,14,32,0.35) 0%, rgba(5,14,32,0.15) 40%, rgba(0,0,0,0.7) 100%)'}} />
      {s.tint === 'red' && <AbsoluteFill style={{background: 'rgba(160,20,20,0.28)', mixBlendMode: 'multiply'}} />}
      {s.tint === 'green' && <AbsoluteFill style={{background: 'rgba(20,110,70,0.22)', mixBlendMode: 'multiply'}} />}
      {s.deco === 'redzone' && <RedZone />}
      {s.deco === 'scan' && <Scan />}
      {s.deco === 'stamp' && <Stamp />}
      {isCheck && <Checklist idx={s.check!} />}
      <Keyword s={s} top={isCheck ? 300 : 620} />
      {s.flash && <AbsoluteFill style={{background: '#fff', opacity: interpolate(f, [0, 6], [0.55, 0], clamp)}} />}
    </AbsoluteFill>
  );
};

const Subtitle: React.FC = () => {
  const f = useCurrentFrame();
  const s = placed.find((p) => f >= p.from && f < p.from + p.dur);
  if (!s) return null;
  return (
    <div style={{position: 'absolute', left: 40, right: 120, bottom: 300, display: 'flex', justifyContent: 'center'}}>
      <div style={{background: 'rgba(0,0,0,0.55)', color: '#fff', fontFamily: FONT, fontSize: 40, fontWeight: 700, padding: '12px 28px', borderRadius: 10, textAlign: 'center', lineHeight: 1.35}}>
        {TEXT3[s.clip].replace(/[，。：；、]$/, '')}
      </div>
    </div>
  );
};

const Chrome: React.FC = () => {
  const f = useCurrentFrame();
  const last = placed[placed.length - 1];
  const outro = f >= last.from - 1;
  return (
    <>
      <div style={{position: 'absolute', left: 0, top: 0, height: 8, width: `${(f / TOTAL3) * 100}%`, background: ORANGE}} />
      <div style={{position: 'absolute', right: 70, top: 70, fontSize: 30, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.75)', fontFamily: FONT}}>合规认证通</div>
      {outro && <div style={{position: 'absolute', left: 60, right: 60, bottom: 150, textAlign: 'center', fontSize: 26, color: 'rgba(255,255,255,0.7)', fontFamily: FONT}}>
        信息来源：Reuters、FCC 公开文件 · 以 FCC 正式规则为准
      </div>}
    </>
  );
};

export const Video3: React.FC = () => (
  <AbsoluteFill style={{background: '#050e20'}}>
    {placed.map((s) => (
      <Sequence key={s.id} from={s.from} durationInFrames={s.dur} name={`shot${s.id}`}>
        <ShotView s={s} />
        <Audio src={staticFile(`vo3/${s.clip}.mp3`)} />
      </Sequence>
    ))}
    <Subtitle />
    <Chrome />
  </AbsoluteFill>
);
