import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import {FPS, TEXT, TOTAL, scenes, sceneOf, type Clip} from './timing';

// Style A「严肃合规」: white, navy, one orange accent.
export const C = {bg: '#FFFFFF', navy: '#0B2545', muted: '#5B6B82', orange: '#F26B1D', line: '#D5DCE6', panel: '#F3F6FA'};
export const FONT = "'Microsoft YaHei', 'PingFang SC', sans-serif";
export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const useAppear = (delay: number, damping = 16) => {
  const frame = useCurrentFrame();
  return spring({frame: frame - delay, fps: FPS, config: {damping, mass: 0.8}});
};

/** Slow zoom + pan on a still; scale never drops below 1 so the edge never shows. */
export const KenBurns: React.FC<{src: string; dur: number; from?: number; to?: number; ox?: [number, number]; oy?: [number, number]; style?: React.CSSProperties}> = ({
  src, dur, from = 1.04, to = 1.16, ox = [45, 55], oy = [50, 50], style,
}) => {
  const f = useCurrentFrame();
  const t = interpolate(f, [0, dur], [0, 1], clamp);
  return (
    <div style={{position: 'absolute', overflow: 'hidden', inset: 0, ...style}}>
      <Img
        src={staticFile(`img/${src}.png`)}
        style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${from + (to - from) * t})`,
          transformOrigin: `${ox[0] + (ox[1] - ox[0]) * t}% ${oy[0] + (oy[1] - oy[0]) * t}%`}}
      />
    </div>
  );
};

/** Text that rises in, optionally with an orange highlight sweep behind a keyword. */
export const Rise: React.FC<{delay?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({delay = 0, children, style}) => {
  const p = useAppear(delay);
  return <div style={{opacity: p, transform: `translateY(${(1 - p) * 40}px)`, ...style}}>{children}</div>;
};

export const Sweep: React.FC<{delay: number; children: React.ReactNode}> = ({delay, children}) => {
  const f = useCurrentFrame();
  const w = interpolate(f, [delay, delay + 14], [0, 100], {...clamp, easing: Easing.out(Easing.cubic)});
  return (
    <span style={{position: 'relative', display: 'inline-block', padding: '0 6px'}}>
      <span style={{position: 'absolute', left: 0, bottom: '8%', height: '38%', width: `${w}%`, background: C.orange, opacity: 0.28}} />
      <span style={{position: 'relative'}}>{children}</span>
    </span>
  );
};

export const Kicker: React.FC<{children: React.ReactNode; delay?: number}> = ({children, delay = 0}) => (
  <Rise delay={delay}>
    <div style={{fontSize: 30, fontWeight: 700, letterSpacing: '0.14em', color: C.orange}}>{children}</div>
  </Rise>
);

const Brand: React.FC<{color?: string}> = ({color = C.muted}) => (
  <div style={{position: 'absolute', right: 70, top: 52, fontSize: 28, fontWeight: 700, letterSpacing: '0.1em', color}}>合规认证通</div>
);

/** Scene wrapper: fade + slight slide in, left orange bar of style A. */
const SceneFrame: React.FC<{children: React.ReactNode; bar?: boolean}> = ({children, bar = true}) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 10], [0, 1], clamp);
  return (
    <AbsoluteFill style={{background: C.bg, fontFamily: FONT, color: C.navy, opacity: o, transform: `translateX(${(1 - o) * 30}px)`}}>
      {children}
      {bar && <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: 16, background: C.orange}} />}
    </AbsoluteFill>
  );
};

// ---------- scenes ----------

const Hook: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const badge = useAppear(48, 10);
  return (
    <SceneFrame bar={false}>
      <KenBurns src="chamber" dur={dur} from={1.12} to={1.0} ox={[55, 50]} oy={[60, 50]} />
      <AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.9) 38%, rgba(255,255,255,0) 66%)'}} />
      <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: 16, background: C.orange}} />
      <div style={{position: 'absolute', left: 130, top: 300}}>
        <Kicker delay={4}>FCC 新规解读</Kicker>
        <Rise delay={10} style={{fontSize: 108, fontWeight: 900, lineHeight: 1.15, marginTop: 24}}>你的 FCC 报告</Rise>
        <Rise delay={18} style={{fontSize: 108, fontWeight: 900, lineHeight: 1.15, color: C.orange}}>还能用吗？</Rise>
        <div style={{marginTop: 46, display: 'inline-flex', alignItems: 'center', gap: 16, transform: `scale(${badge})`, transformOrigin: 'left center',
          background: C.navy, color: '#fff', padding: '14px 30px', borderRadius: 8, fontSize: 34, fontWeight: 700}}>
          <span style={{display: 'inline-block', width: 14, height: 14, borderRadius: 7, background: C.orange, opacity: 0.5 + 0.5 * Math.sin(f / 4)}} />
          快速自查
        </div>
      </div>
      <Brand />
    </SceneFrame>
  );
};

const NODES = [
  {d: '2026.04.30', t: 'FCC 发布\n规则制定提案'},
  {d: '2026.10.07', t: '路透社披露\n表决计划'},
  {d: '2026.10.29', t: 'FCC 拟表决\n新规则', now: true},
  {d: '2028.12', t: '预计\n开始实施'},
];

const Timeline: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const x0 = 150, x1 = 1170, y = 560;
  const step = (x1 - x0) / (NODES.length - 1);
  const grow = interpolate(f, [20, 20 + 90], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const nowX = x0 + step * 2;
  const tag = useAppear(130, 12);
  return (
    <SceneFrame>
      <KenBurns src="export" dur={dur} style={{left: 1340}} ox={[40, 60]} />
      <div style={{position: 'absolute', left: 1340, top: 0, bottom: 0, width: 160, background: 'linear-gradient(90deg,#fff,rgba(255,255,255,0))'}} />
      <div style={{position: 'absolute', left: 130, top: 120}}>
        <Kicker>TIMELINE</Kicker>
        <Rise delay={4} style={{fontSize: 76, fontWeight: 900, marginTop: 14}}>新规走到<span style={{color: C.orange}}>哪一步</span>了？</Rise>
      </div>
      {/* solid past segment + dashed future segment */}
      <div style={{position: 'absolute', left: x0, top: y - 3, height: 6, width: (nowX - x0) * Math.min(1, grow * 1.5), background: C.navy}} />
      <div style={{position: 'absolute', left: nowX, top: y - 3, height: 6, width: (x1 - nowX) * interpolate(grow, [0.66, 1], [0, 1], clamp),
        background: `repeating-linear-gradient(90deg, ${C.muted} 0 16px, transparent 16px 28px)`}} />
      {NODES.map((n, i) => {
        const x = x0 + step * i;
        const p = spring({frame: f - (20 + i * 26), fps: FPS, config: {damping: 11}});
        const pulse = n.now ? 1 + 0.5 * ((f % 36) / 36) : 1;
        return (
          <React.Fragment key={n.d}>
            {n.now && <div style={{position: 'absolute', left: x - 26 * pulse, top: y - 26 * pulse, width: 52 * pulse, height: 52 * pulse, borderRadius: '50%',
              background: C.orange, opacity: p * (1 - (f % 36) / 36) * 0.45}} />}
            <div style={{position: 'absolute', left: x - 18, top: y - 18, width: 36, height: 36, borderRadius: '50%', transform: `scale(${p})`,
              background: n.now ? C.orange : '#fff', border: `6px solid ${n.now ? C.orange : C.navy}`}} />
            <div style={{position: 'absolute', left: x - 170, width: 340, top: y - 112, textAlign: 'center', fontSize: 44, fontWeight: 800,
              color: n.now ? C.orange : C.navy, opacity: p, transform: `translateY(${(1 - p) * 20}px)`}}>{n.d}</div>
            <div style={{position: 'absolute', left: x - 170, width: 340, top: y + 50, textAlign: 'center', fontSize: 32, lineHeight: 1.45, whiteSpace: 'pre-line',
              color: n.now ? C.navy : C.muted, opacity: p}}>{n.t}</div>
          </React.Fragment>
        );
      })}
      <div style={{position: 'absolute', left: nowX - 140, top: y + 190, width: 280, textAlign: 'center', fontSize: 30, fontWeight: 800, padding: '12px 0',
        borderRadius: 8, background: C.orange, color: '#fff', transform: `scale(${tag})`}}>▲ 现在：待表决</div>
      <Rise delay={200} style={{position: 'absolute', left: 130, top: 880, fontSize: 40, fontWeight: 700}}>
        仍是拟议规则 · <Sweep delay={210}>现有证书不会立即失效</Sweep>
      </Rise>
    </SceneFrame>
  );
};

export const Icon: React.FC<{kind: string}> = ({kind}) => {
  const s = {fill: 'none', stroke: C.orange, strokeWidth: 4, strokeLinecap: 'round', strokeLinejoin: 'round'} as const;
  const paths: Record<string, React.ReactNode> = {
    wifi: <><path d="M8 26a34 34 0 0 1 48 0" {...s} /><path d="M17 35a21 21 0 0 1 30 0" {...s} /><path d="M26 44a8 8 0 0 1 12 0" {...s} /><circle cx="32" cy="52" r="2.5" fill={C.orange} /></>,
    router: <><rect x="8" y="34" width="48" height="16" rx="4" {...s} /><path d="M18 34V14M32 34V10M46 34V14" {...s} /><circle cx="18" cy="42" r="2" fill={C.orange} /></>,
    watch: <><rect x="18" y="18" width="28" height="28" rx="7" {...s} /><path d="M24 18l2-10h12l2 10M24 46l2 10h12l2-10M32 26v7l5 3" {...s} /></>,
    home: <><path d="M10 30L32 12l22 18" {...s} /><path d="M16 26v26h32V26" {...s} /><path d="M27 42a7 7 0 0 1 10 0" {...s} /></>,
    chip: <><rect x="18" y="18" width="28" height="28" rx="3" {...s} /><path d="M24 18v-8M32 18v-8M40 18v-8M24 46v8M32 46v8M40 46v8M18 24h-8M18 32h-8M18 40h-8M46 24h8M46 32h8M46 40h8" {...s} /></>,
  };
  return <svg width="64" height="64" viewBox="0 0 64 64">{paths[kind]}</svg>;
};

const PRODUCTS = [
  {k: 'wifi', t: 'Wi-Fi / 蓝牙设备'},
  {k: 'router', t: '路由器 · 摄像头'},
  {k: 'watch', t: '智能穿戴'},
  {k: 'home', t: '智能家居'},
  {k: 'chip', t: '使用无线模块的产品'},
];

const Products: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  return (
    <SceneFrame>
      <KenBurns src="products" dur={dur} style={{left: 960}} from={1.05} to={1.2} ox={[60, 45]} />
      <div style={{position: 'absolute', left: 960, top: 0, bottom: 0, width: 140, background: 'linear-gradient(90deg,#fff,rgba(255,255,255,0))'}} />
      <div style={{position: 'absolute', left: 130, top: 120}}>
        <Kicker>SCOPE</Kicker>
        <Rise delay={4} style={{fontSize: 76, fontWeight: 900, marginTop: 14}}>哪些产品<span style={{color: C.orange}}>要留意</span>？</Rise>
        <Rise delay={10} style={{fontSize: 34, color: C.muted, marginTop: 14}}>带无线功能、需要 FCC 设备授权的电子产品</Rise>
      </div>
      {PRODUCTS.map((p, i) => {
        const a = spring({frame: f - (40 + i * 34), fps: FPS, config: {damping: 12}});
        return (
          <div key={p.k} style={{position: 'absolute', left: 130, top: 400 + i * 118, display: 'flex', alignItems: 'center', gap: 28,
            opacity: a, transform: `translateX(${(1 - a) * -60}px)`, background: C.panel, borderRadius: 10, padding: '14px 40px 14px 22px', width: 700}}>
            <Icon kind={p.k} />
            <div style={{fontSize: 40, fontWeight: 700}}>{p.t}</div>
          </div>
        );
      })}
    </SceneFrame>
  );
};

const Chain: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const boxes = [
    {t: '品牌方 / 你', sub: '拿到报告'},
    {t: 'ODM · 模块商 · 代理', sub: '安排测试'},
    {t: '实验室', sub: '在哪测？谁测？', q: true},
  ];
  const y = 560, w = 480, gap = 120, x0 = 130;
  return (
    <SceneFrame>
      <KenBurns src="label" dur={dur} from={1.0} to={1.1} />
      <AbsoluteFill style={{background: 'rgba(255,255,255,0.88)'}} />
      <div style={{position: 'absolute', left: 130, top: 120}}>
        <Kicker>WHO TESTED IT</Kicker>
        <Rise delay={4} style={{fontSize: 76, fontWeight: 900, marginTop: 14}}>你的报告，<span style={{color: C.orange}}>是谁测的</span>？</Rise>
      </div>
      {boxes.map((b, i) => {
        const start = 30 + i * 55;
        const a = spring({frame: f - start, fps: FPS, config: {damping: 13}});
        const x = x0 + i * (w + gap);
        const arrow = interpolate(f, [start + 20, start + 45], [0, 1], clamp);
        const blink = b.q ? 0.55 + 0.45 * Math.abs(Math.sin(f / 6)) : 1;
        return (
          <React.Fragment key={b.t}>
            <div style={{position: 'absolute', left: x, top: y - 110, width: w, height: 220, borderRadius: 14, opacity: a, transform: `scale(${0.85 + 0.15 * a})`,
              background: b.q ? C.navy : '#fff', color: b.q ? '#fff' : C.navy, border: `4px solid ${b.q ? C.navy : C.line}`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(11,37,69,0.12)'}}>
              <div style={{fontSize: 42, fontWeight: 800, whiteSpace: 'nowrap'}}>{b.t}</div>
              <div style={{fontSize: 32, marginTop: 12, color: b.q ? C.orange : C.muted, fontWeight: b.q ? 800 : 400}}>{b.sub}</div>
              {b.q && <div style={{position: 'absolute', right: -30, top: -40, width: 86, height: 86, borderRadius: 43, background: C.orange, color: '#fff',
                fontSize: 62, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: blink}}>?</div>}
            </div>
            {i < boxes.length - 1 && (
              <div style={{position: 'absolute', left: x + w + 20, top: y - 4, width: (gap - 40) * arrow, height: 8, background: C.orange}}>
                <div style={{position: 'absolute', right: -14, top: -12, borderLeft: `22px solid ${C.orange}`, borderTop: '16px solid transparent', borderBottom: '16px solid transparent', opacity: arrow > 0.9 ? 1 : 0}} />
              </div>
            )}
          </React.Fragment>
        );
      })}
      <Rise delay={170} style={{position: 'absolute', left: 130, top: 860, fontSize: 40, fontWeight: 700}}>
        很多企业<Sweep delay={180}>并不清楚最后一环</Sweep>
      </Rise>
    </SceneFrame>
  );
};

const CHECKS = [
  ['报告对应哪家实验室？', '了解实际测试方'],
  ['实验室在哪个国家 / 地区？', '判断未来是否受影响'],
  ['证书由谁申请、谁持有？', '明确责任主体'],
  ['模块是否单独认证？整机要补测吗？', '了解认证路径'],
  ['规则变化后有没有替代方案？', '提前评估时间和成本'],
];

const Check: React.FC<{dur: number; clips: Clip[]}> = ({dur, clips}) => {
  const f = useCurrentFrame();
  return (
    <SceneFrame>
      <KenBurns src="report" dur={dur} style={{right: 1260}} from={1.15} to={1.3} ox={[55, 50]} oy={[45, 55]} />
      <div style={{position: 'absolute', left: 560, top: 0, bottom: 0, width: 100, background: 'linear-gradient(90deg,rgba(255,255,255,0),#fff)'}} />
      <div style={{position: 'absolute', left: 720, top: 90}}>
        <Kicker>CHECKLIST · 建议截图保存</Kicker>
        <Rise delay={4} style={{fontSize: 62, fontWeight: 900, marginTop: 12}}>向供应商确认 <span style={{color: C.orange}}>5 件事</span></Rise>
      </div>
      {CHECKS.map(([q, g], i) => {
        const start = clips[i + 1].from;
        const a = spring({frame: f - start, fps: FPS, config: {damping: 14}});
        const tick = interpolate(f, [start + 18, start + 32], [0, 1], clamp);
        const active = f >= start && f < (clips[i + 2]?.from ?? dur);
        return (
          <div key={q} style={{position: 'absolute', left: 720, top: 250 + i * 138, width: 1090, height: 120, borderRadius: 10, display: 'flex', alignItems: 'center',
            padding: '0 34px', background: active ? '#FFF4EC' : C.panel, border: `3px solid ${active ? C.orange : 'transparent'}`,
            opacity: 0.25 + 0.75 * a, transform: `translateX(${(1 - a) * 40}px)`}}>
            <div style={{width: 60, height: 60, borderRadius: 30, border: `4px solid ${C.orange}`, color: C.orange, fontSize: 32, fontWeight: 900,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none'}}>{i + 1}</div>
            <div style={{marginLeft: 28, flex: 1}}>
              <div style={{fontSize: 38, fontWeight: 800}}>{q}</div>
              <div style={{fontSize: 27, color: C.muted, marginTop: 6}}>→ {g}</div>
            </div>
            <svg width="56" height="56" viewBox="0 0 56 56" style={{flex: 'none'}}>
              <rect x="4" y="4" width="48" height="48" rx="8" fill="none" stroke={C.muted} strokeWidth="4" />
              <path d="M14 29l9 9 19-21" fill="none" stroke={C.orange} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"
                strokeDasharray="50" strokeDashoffset={50 * (1 - tick)} />
            </svg>
          </div>
        );
      })}
    </SceneFrame>
  );
};

const Outro: React.FC<{dur: number}> = ({dur}) => {
  const logo = useAppear(150, 12);
  return (
    <SceneFrame bar={false}>
      <KenBurns src="chamber" dur={dur} from={1.0} to={1.12} />
      <AbsoluteFill style={{background: 'rgba(255,255,255,0.9)'}} />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', textAlign: 'center'}}>
        <Rise delay={6} style={{fontSize: 88, fontWeight: 900}}>不必急着换实验室</Rise>
        <Rise delay={40} style={{fontSize: 46, color: C.muted, marginTop: 28}}>
          先<Sweep delay={50}>摸清现状</Sweep>，等 FCC 正式规则出台再决定
        </Rise>
        <div style={{marginTop: 80, transform: `scale(${logo})`, display: 'flex', alignItems: 'center', gap: 24}}>
          <div style={{width: 18, height: 76, background: C.orange}} />
          <div style={{fontSize: 64, fontWeight: 900, letterSpacing: '0.12em'}}>合规认证通</div>
          <div style={{marginLeft: 20, background: C.navy, color: '#fff', fontSize: 34, fontWeight: 700, padding: '14px 32px', borderRadius: 8}}>关注 · 持续跟进</div>
        </div>
      </AbsoluteFill>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 150, textAlign: 'center', fontSize: 24, color: C.muted, fontFamily: FONT}}>
        信息来源：Reuters、FCC 公开文件 · 以 FCC 正式规则为准
      </div>
    </SceneFrame>
  );
};

// ---------- subtitles + progress ----------

/** Split a clip's line at punctuation and time the chunks by character count. */
export const chunks = (text: string) => text.split(/(?<=[，。：；、！？])/).map((s) => s.trim()).filter(Boolean);

const Subtitles: React.FC = () => {
  const f = useCurrentFrame();
  for (const s of scenes) {
    for (const c of s.clips) {
      const start = s.from + c.from;
      if (f < start || f >= start + c.dur) continue;
      const parts = chunks(TEXT[c.id]);
      const total = parts.reduce((n, p) => n + p.length, 0);
      let acc = 0;
      const local = (f - start) / c.dur;
      const cur = parts.find((p) => (acc += p.length) / total > local) ?? parts[parts.length - 1];
      return (
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 46, display: 'flex', justifyContent: 'center'}}>
          <div style={{background: 'rgba(11,37,69,0.88)', color: '#fff', fontFamily: FONT, fontSize: 40, fontWeight: 600, padding: '12px 32px', borderRadius: 8, maxWidth: 1600}}>
            {cur.replace(/[，。：；、]$/, '')}
          </div>
        </div>
      );
    }
  }
  return null;
};

const Progress: React.FC = () => {
  const f = useCurrentFrame();
  return <div style={{position: 'absolute', left: 0, top: 0, height: 8, width: `${(f / TOTAL) * 100}%`, background: C.orange}} />;
};

const SCENE_COMPONENTS = {hook: Hook, timeline: Timeline, products: Products, chain: Chain, outro: Outro} as const;

export const Video: React.FC = () => {
  const {width} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: C.bg, width}}>
      {scenes.map((s) => {
        const Comp = s.id === 'check' ? null : SCENE_COMPONENTS[s.id];
        return (
          <Sequence key={s.id} from={s.from} durationInFrames={s.dur} name={s.id}>
            {Comp ? <Comp dur={s.dur} /> : <Check dur={s.dur} clips={sceneOf('check').clips} />}
            {s.clips.map((c) => (
              <Sequence key={c.id} from={c.from} durationInFrames={c.dur + 15} name={c.id}>
                <Audio src={staticFile(`vo/${c.id}.mp3`)} />
              </Sequence>
            ))}
          </Sequence>
        );
      })}
      <Subtitles />
      <Progress />
    </AbsoluteFill>
  );
};
