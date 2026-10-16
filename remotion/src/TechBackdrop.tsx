import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';

// Tech-style backdrop following the client's robot IP sheets: gradient sky, soft glow blobs, twinkling particles,
// drifting translucent hologram cards, a slow light arc, plus a frosted glass panel that hosts the diagrams.
export type TechTheme = 'techDark' | 'techLavender' | 'techBright';

export const THEMES: Record<TechTheme, {
  sky: string; blobs: [string, string]; particle: string; card: string; cardStroke: string; icon: string; arc: string;
  panelBg: string; panelBorder: string; panelGlow: string; watermark: string; wipe: string; sparkle?: string;
}> = {
  techDark: {
    sky: 'linear-gradient(180deg, #0A1140 0%, #241A6B 55%, #120C3A 100%)', blobs: ['rgba(64,170,255,0.45)', 'rgba(150,90,255,0.45)'],
    particle: '#9FE3FF', card: 'rgba(90,150,255,0.14)', cardStroke: 'rgba(140,200,255,0.75)', icon: '#A8E6FF', arc: 'rgba(130,200,255,0.6)',
    panelBg: 'rgba(228,238,255,0.94)', panelBorder: 'rgba(120,200,255,1)', panelGlow: '0 0 70px rgba(80,170,255,0.75), inset 0 0 40px rgba(120,190,255,0.25)', watermark: 'rgba(70,100,170,0.8)', wipe: '#4C7DFF',
  },
  techLavender: {
    sky: 'linear-gradient(180deg, #FAF8FF 0%, #E6DEFF 55%, #CFC4FF 100%)', blobs: ['rgba(140,120,255,0.35)', 'rgba(110,200,255,0.30)'],
    particle: '#8C7BFF', card: 'rgba(255,255,255,0.45)', cardStroke: 'rgba(140,120,240,0.55)', icon: '#7A6BF0', arc: 'rgba(140,120,255,0.45)',
    panelBg: 'rgba(246,242,255,0.85)', panelBorder: 'rgba(200,185,255,0.95)', panelGlow: '0 20px 60px rgba(110,90,220,0.3)', watermark: 'rgba(110,95,190,0.8)', wipe: '#8C7BFF',
  },
  techBright: {
    sky: 'linear-gradient(180deg, #D9EEFF 0%, #E6E1FF 50%, #FBEFFF 100%)', blobs: ['rgba(90,200,255,0.40)', 'rgba(255,170,230,0.30)'],
    particle: '#5AB8FF', card: 'rgba(255,255,255,0.55)', cardStroke: 'rgba(90,160,255,0.6)', icon: '#4E8BFF', arc: 'rgba(255,255,255,0.8)',
    panelBg: 'rgba(255,255,255,0.84)', panelBorder: 'rgba(255,255,255,1)', panelGlow: '0 20px 60px rgba(80,140,255,0.28)', watermark: 'rgba(80,110,190,0.8)', wipe: '#5AB8FF', sparkle: '#FFC93D',
  },
};

// deterministic pseudo-random so every render is identical
const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const HoloCard: React.FC<{x: number; y: number; w: number; h: number; kind: number; f: number; t: typeof THEMES[TechTheme]; seed: number}> = ({x, y, w, h, kind, f, t, seed}) => {
  const dy = Math.sin(f / 40 + seed) * 18;
  const rot = Math.sin(f / 60 + seed) * 3 - 6 + seed * 2;
  const s = {fill: 'none', stroke: t.icon, strokeWidth: 5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
  return (
    <div style={{position: 'absolute', left: x, top: y + dy, width: w, height: h, transform: `rotate(${rot}deg)`, borderRadius: 22,
      background: t.card, border: `2px solid ${t.cardStroke}`, boxShadow: `0 0 26px ${t.cardStroke}`, backdropFilter: 'blur(2px)'}}>
      <svg width={w} height={h} viewBox="0 0 100 70">
        {kind === 0 && <><path d="M38 22l-12 13 12 13M62 22l12 13-12 13M54 18l-8 34" {...s} /></>}
        {kind === 1 && <><path d="M24 54V40M40 54V28M56 54V34M72 54V20" {...s} strokeWidth={8} /></>}
        {kind === 2 && <><circle cx="50" cy="35" r="20" {...s} /><path d="M45 26l13 9-13 9z" fill={t.icon} stroke="none" /></>}
        {kind === 3 && <><path d="M50 14l18 7v12c0 12-8 20-18 24-10-4-18-12-18-24V21z" {...s} /><path d="M42 35l6 6 11-12" {...s} /></>}
        {kind === 4 && <><path d="M20 22h60M20 35h44M20 48h52" {...s} /></>}
        {/* smart hardware set */}
        {kind === 5 && <><circle cx="50" cy="36" r="24" {...s} /><path d="M32 22a24 24 0 0 1 36 0" {...s} strokeWidth={8} /><circle cx="50" cy="36" r="6" {...s} /><path d="M26 54l-8 6M22 50l-9 1" {...s} strokeWidth={3} /></>}
        {kind === 6 && <><path d="M50 8v8" {...s} /><circle cx="50" cy="7" r="3" fill={t.icon} stroke="none" /><rect x="28" y="16" width="44" height="38" rx="12" {...s} /><circle cx="41" cy="33" r="4" fill={t.icon} stroke="none" /><circle cx="59" cy="33" r="4" fill={t.icon} stroke="none" /><path d="M42 44h16M22 30v10M78 30v10" {...s} /></>}
        {kind === 7 && <><rect x="30" y="8" width="40" height="54" rx="6" {...s} /><path d="M30 20h40" {...s} /><circle cx="40" cy="14" r="1.5" fill={t.icon} stroke="none" /><circle cx="50" cy="41" r="13" {...s} /><path d="M43 43a8 8 0 0 0 12 0" {...s} strokeWidth={3} /></>}
        {kind === 8 && <><path d="M12 46l6-12q3-6 10-6h30q7 0 12 6l10 8q8 1 8 8v4H12z" {...s} /><circle cx="30" cy="54" r="7" {...s} /><circle cx="72" cy="54" r="7" {...s} /><path d="M52 8l-8 12h8l-6 11" {...s} strokeWidth={4} /></>}
      </svg>
    </div>
  );
};

/** icons: 'ui' = original code/chart/play/shield cards; 'hardware' = robot vacuum / robot / appliance / EV. */
export const TechBackdrop: React.FC<{theme: TechTheme; icons?: 'ui' | 'hardware'}> = ({theme, icons = 'ui'}) => {
  const k = icons === 'hardware' ? [5, 6, 7, 8] : [0, 1, 2, 3];
  const f = useCurrentFrame();
  const t = THEMES[theme];
  const particles = Array.from({length: theme === 'techDark' ? 70 : 45}, (_, i) => i);
  return (
    <AbsoluteFill style={{background: t.sky, overflow: 'hidden'}}>
      {/* soft glow blobs */}
      <div style={{position: 'absolute', left: -200 + Math.sin(f / 90) * 60, top: 120, width: 900, height: 900, borderRadius: '50%', background: `radial-gradient(circle, ${t.blobs[0]} 0%, rgba(0,0,0,0) 65%)`}} />
      <div style={{position: 'absolute', left: 420 + Math.cos(f / 80) * 60, top: 980, width: 1000, height: 1000, borderRadius: '50%', background: `radial-gradient(circle, ${t.blobs[1]} 0%, rgba(0,0,0,0) 65%)`}} />
      {/* light arc */}
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <ellipse cx={540} cy={980} rx={760} ry={300} fill="none" stroke={t.arc} strokeWidth={3}
          transform={`rotate(${-18 + Math.sin(f / 120) * 4} 540 980)`} strokeDasharray="900 700" strokeDashoffset={-f * 6} />
      </svg>
      {/* hologram cards around the panel edges */}
      <HoloCard x={40} y={30} w={170} h={118} kind={k[0]} f={f} t={t} seed={1} />
      <HoloCard x={820} y={10} w={200} h={140} kind={k[1]} f={f} t={t} seed={2} />
      <HoloCard x={-30} y={1560} w={190} h={130} kind={k[2]} f={f} t={t} seed={3} />
      <HoloCard x={870} y={1600} w={210} h={146} kind={k[3]} f={f} t={t} seed={4} />
      <HoloCard x={680} y={1760} w={150} h={104} kind={4} f={f} t={t} seed={5} />
      {/* twinkling particles */}
      {particles.map((i) => {
        const tw = 0.35 + 0.65 * Math.abs(Math.sin(f / (14 + rnd(i) * 20) + i));
        const size = 3 + rnd(i + 99) * 6;
        return <div key={i} style={{position: 'absolute', left: rnd(i) * 1080, top: (rnd(i + 7) * 1920 - f * (0.3 + rnd(i + 3) * 0.6) + 1920 * 4) % 1920,
          width: size, height: size, borderRadius: '50%', background: t.particle, opacity: tw, boxShadow: `0 0 ${size * 3}px ${t.particle}`}} />;
      })}
      {t.sparkle && [0, 1, 2, 3].map((i) => {
        const sc = 0.6 + 0.4 * Math.abs(Math.sin(f / 12 + i * 1.7));
        return (
          <svg key={i} width={60} height={60} viewBox="-30 -30 60 60" style={{position: 'absolute', left: [70, 960, 180, 900][i], top: [210, 260, 1500, 1460][i], transform: `scale(${sc})`}}>
            <path d="M0 -26 Q4 -4 26 0 Q4 4 0 26 Q-4 4 -26 0 Q-4 -4 0 -26Z" fill={t.sparkle} />
          </svg>
        );
      })}
      {/* frosted glass panel that hosts the diagrams */}
      <div style={{position: 'absolute', left: 30, top: 118, width: 1020, height: 1400, borderRadius: 44, background: t.panelBg,
        border: `3px solid ${t.panelBorder}`, boxShadow: t.panelGlow}}>
      </div>
    </AbsoluteFill>
  );
};
