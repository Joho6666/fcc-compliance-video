import React from 'react';
import {AbsoluteFill, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, Easing} from 'remotion';
import {C, FONT, clamp} from './Video';
import {FPS} from './timing';

// Digital-human layer (authorized presenter 小谭) laid over a 9:16 base video.
//   host: full-screen presenter (video on top, keyword card below); the base subtitles stay on top of this layer.
//   pip : small circle top-right, clear of the PPT title (left) and diagrams (centre/bottom).
export type DHWindow = {from: number; dur: number; src: string; mode: 'host' | 'pip'; kicker?: string; caption?: string; nameTag?: boolean};

const PIP = {x: 690, y: 140, d: 330}; // circle top-left corner + diameter
const PIP_C = {x: PIP.x + PIP.d / 2, y: PIP.y + PIP.d / 2};
const VID_H = 1215; // 512x576 source scaled to 1080 wide

const Host: React.FC<{w: DHWindow; fromPip: boolean; last: boolean}> = ({w, fromPip, last}) => {
  const f = useCurrentFrame();
  const cx = fromPip ? PIP_C.x : 540, cy = fromPip ? PIP_C.y : 620;
  const rIn = interpolate(f, [0, 12], [fromPip ? PIP.d / 2 : 0, 1700], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const rOut = last ? 1700 : interpolate(f, [w.dur - 9, w.dur], [1700, 0], {...clamp, easing: Easing.in(Easing.cubic)});
  const r = Math.min(rIn, rOut);
  const card = spring({frame: f - 8, fps: FPS, config: {damping: 14}});
  const tag = spring({frame: f - 16, fps: FPS, config: {damping: 13}});
  return (
    <AbsoluteFill style={{clipPath: `circle(${r}px at ${cx}px ${cy}px)`, background: '#fff'}}>
      {/* blurred copy fills behind, sharp copy on top */}
      <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1300, overflow: 'hidden'}}>
        <OffthreadVideo src={staticFile(w.src)} muted style={{position: 'absolute', left: -120, top: -80, width: 1320, height: 1480, objectFit: 'cover', filter: 'blur(28px) brightness(0.85)'}} />
        <OffthreadVideo src={staticFile(w.src)} muted style={{position: 'absolute', left: 0, top: 40, width: 1080, height: VID_H, objectFit: 'cover'}} />
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 180, background: 'linear-gradient(180deg, rgba(255,255,255,0), #fff)'}} />
      </div>
      <div style={{position: 'absolute', left: 0, top: 0, width: 16, height: 1920, background: C.orange}} />
      {w.nameTag && (
        <div style={{position: 'absolute', left: 60, top: 1040, transform: `translateX(${(1 - Math.min(1, tag)) * -300}px)`, opacity: Math.min(1, tag * 2),
          background: C.navy, color: '#fff', fontFamily: FONT, fontWeight: 800, fontSize: 38, padding: '12px 30px', borderRadius: 10, borderLeft: `10px solid ${C.orange}`}}>
          主讲 · 小谭
        </div>
      )}
      {(w.kicker || w.caption) && (
        <div style={{position: 'absolute', left: 70, right: 70, top: 1290, opacity: Math.min(1, card * 2), transform: `translateY(${(1 - Math.min(1, card)) * 40}px)`}}>
          {w.kicker && <div style={{fontFamily: FONT, fontSize: 30, fontWeight: 700, letterSpacing: '0.14em', color: C.orange}}>{w.kicker}</div>}
          {w.caption && <div style={{fontFamily: FONT, fontSize: 76, fontWeight: 900, color: C.navy, marginTop: 8, lineHeight: 1.2}}>{w.caption}</div>}
        </div>
      )}
    </AbsoluteFill>
  );
};

const Pip: React.FC<{w: DHWindow}> = ({w}) => {
  const f = useCurrentFrame();
  const pIn = spring({frame: f, fps: FPS, config: {damping: 12}});
  const pOut = interpolate(f, [w.dur - 8, w.dur], [1, 0], clamp);
  const s = Math.min(pIn, pOut);
  return (
    <div style={{position: 'absolute', left: PIP.x, top: PIP.y, width: PIP.d, height: PIP.d, borderRadius: '50%', overflow: 'hidden',
      border: '8px solid #fff', boxShadow: `0 0 0 5px ${C.orange}, 0 18px 40px rgba(11,37,69,0.3)`, transform: `scale(${s})`, transformOrigin: 'center'}}>
      <OffthreadVideo src={staticFile(w.src)} muted style={{position: 'absolute', left: -PIP.d * 0.18, top: -PIP.d * 0.02, width: PIP.d * 1.36, height: PIP.d * 1.36 * (576 / 512), objectFit: 'cover'}} />
    </div>
  );
};

export const DHLayer: React.FC<{windows: DHWindow[]}> = ({windows}) => (
  <>
    {windows.map((w, i) => {
      const prev = windows[i - 1];
      const fromPip = !!prev && prev.mode === 'pip' && prev.from + prev.dur === w.from;
      return (
        <Sequence key={w.src} from={w.from} durationInFrames={w.dur} name={`dh-${w.mode}`}>
          {w.mode === 'host' ? <Host w={w} fromPip={fromPip} last={i === windows.length - 1} /> : <Pip w={w} />}
        </Sequence>
      );
    })}
    <div style={{position: 'absolute', left: 40, bottom: 170, fontFamily: FONT, fontSize: 24, color: 'rgba(91,107,130,0.85)'}}>本视频含 AI 生成内容</div>
  </>
);
