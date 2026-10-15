import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, Easing} from 'remotion';
import {FPS, TEXT, defaultTiming, type Clip, type Timing} from './timing';

// Which narration timing/voice to use (SAMI default, or the cloned voice for the digital-human cut).
export const TimingCtx = React.createContext<Timing>(defaultTiming);
import {C, FONT, clamp, useAppear, KenBurns, Rise, Sweep, Kicker, Icon, chunks} from './Video';

// 9:16 (1080x1920) re-layout of style A. Safe zones: top 120, bottom ~330 (subtitles + platform UI), right 120 on the lower half.
const PAD = 80;

const Fade: React.FC<{h: number; top?: boolean}> = ({h, top}) => (
  <div style={{position: 'absolute', left: 0, right: 0, [top ? 'top' : 'bottom']: 0, height: h,
    background: `linear-gradient(${top ? 0 : 180}deg, #fff, rgba(255,255,255,0))`}} />
);

/** Image band at the top of a scene, faded into the white page. */
const Band: React.FC<{src: string; dur: number; h: number; ox?: [number, number]; from?: number; to?: number}> = ({src, dur, h, ox, from, to}) => (
  <>
    <KenBurns src={src} dur={dur} style={{inset: 'auto', left: 0, top: 0, width: 1080, height: h}} ox={ox} from={from} to={to} />
    <div style={{position: 'absolute', left: 0, top: h - 200, width: 1080, height: 200, background: 'linear-gradient(180deg, rgba(255,255,255,0), #fff)'}} />
  </>
);

const Frame: React.FC<{children: React.ReactNode; bar?: boolean}> = ({children, bar = true}) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 10], [0, 1], clamp);
  return (
    <AbsoluteFill style={{background: C.bg, fontFamily: FONT, color: C.navy, opacity: o, transform: `translateY(${(1 - o) * 30}px)`}}>
      {children}
      {bar && <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: 12, background: C.orange}} />}
    </AbsoluteFill>
  );
};

const Brand: React.FC = () => (
  <div style={{position: 'absolute', right: PAD, top: 70, fontSize: 30, fontWeight: 700, letterSpacing: '0.1em', color: C.muted}}>合规认证通</div>
);

const Title: React.FC<{kicker: string; top: number; children: React.ReactNode}> = ({kicker, top, children}) => (
  <div style={{position: 'absolute', left: PAD, right: PAD, top}}>
    <Kicker>{kicker}</Kicker>
    <Rise delay={4} style={{fontSize: 84, fontWeight: 900, marginTop: 14, lineHeight: 1.2}}>{children}</Rise>
  </div>
);

const Hook: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const badge = useAppear(48, 10);
  return (
    <Frame bar={false}>
      <KenBurns src="chamber" dur={dur} from={1.35} to={1.2} ox={[50, 50]} oy={[65, 55]} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.9) 36%, rgba(255,255,255,0) 62%)'}} />
      <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: 12, background: C.orange}} />
      <div style={{position: 'absolute', left: PAD, right: PAD, top: 250}}>
        <Kicker delay={4}>FCC 新规解读</Kicker>
        <Rise delay={10} style={{fontSize: 128, fontWeight: 900, lineHeight: 1.15, marginTop: 26}}>你的 FCC 报告</Rise>
        <Rise delay={18} style={{fontSize: 128, fontWeight: 900, lineHeight: 1.15, color: C.orange}}>还能用吗？</Rise>
        <div style={{marginTop: 54, display: 'inline-flex', alignItems: 'center', gap: 18, transform: `scale(${badge})`, transformOrigin: 'left center',
          background: C.navy, color: '#fff', padding: '16px 34px', borderRadius: 10, fontSize: 38, fontWeight: 700}}>
          <span style={{width: 16, height: 16, borderRadius: 8, background: C.orange, opacity: 0.5 + 0.5 * Math.sin(f / 4)}} />
          快速自查
        </div>
      </div>
      <Brand />
    </Frame>
  );
};

const NODES = [
  {d: '2026.04.30', t: 'FCC 发布规则制定提案'},
  {d: '2026.10.07', t: '路透社披露表决计划'},
  {d: '2026.10.29', t: 'FCC 拟表决新规则', now: true},
  {d: '2028.12', t: '预计开始实施'},
];

const Timeline: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const x = 150, y0 = 700, step = 190;
  const grow = interpolate(f, [20, 20 + 90], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const nowY = y0 + step * 2;
  const tag = useAppear(130, 12);
  return (
    <Frame>
      <Band src="export" dur={dur} h={420} ox={[30, 70]} />
      <Title kicker="TIMELINE" top={430}>新规走到<span style={{color: C.orange}}>哪一步</span>了？</Title>
      <div style={{position: 'absolute', left: x - 3, top: y0, width: 6, height: (nowY - y0) * Math.min(1, grow * 1.5), background: C.navy}} />
      <div style={{position: 'absolute', left: x - 3, top: nowY, width: 6, height: (y0 + step * 3 - nowY) * interpolate(grow, [0.66, 1], [0, 1], clamp),
        background: `repeating-linear-gradient(180deg, ${C.muted} 0 16px, transparent 16px 28px)`}} />
      {NODES.map((n, i) => {
        const y = y0 + step * i;
        const p = spring({frame: f - (20 + i * 26), fps: FPS, config: {damping: 11}});
        const pulse = n.now ? 1 + 0.5 * ((f % 36) / 36) : 1;
        return (
          <React.Fragment key={n.d}>
            {n.now && <div style={{position: 'absolute', left: x - 30 * pulse, top: y - 30 * pulse, width: 60 * pulse, height: 60 * pulse, borderRadius: '50%',
              background: C.orange, opacity: p * (1 - (f % 36) / 36) * 0.45}} />}
            <div style={{position: 'absolute', left: x - 20, top: y - 20, width: 40, height: 40, borderRadius: '50%', transform: `scale(${p})`,
              background: n.now ? C.orange : '#fff', border: `7px solid ${n.now ? C.orange : C.navy}`}} />
            <div style={{position: 'absolute', left: x + 70, top: y - 44, opacity: p, transform: `translateX(${(1 - p) * 40}px)`}}>
              <div style={{fontSize: 56, fontWeight: 800, color: n.now ? C.orange : C.navy}}>{n.d}</div>
              <div style={{fontSize: 36, marginTop: 6, color: n.now ? C.navy : C.muted, fontWeight: n.now ? 700 : 400}}>{n.t}</div>
            </div>
          </React.Fragment>
        );
      })}
      <div style={{position: 'absolute', left: x + 70 + 345, top: nowY - 56, fontSize: 30, fontWeight: 800, padding: '10px 22px', borderRadius: 8,
        background: C.orange, color: '#fff', transform: `scale(${tag})`, transformOrigin: 'left center', whiteSpace: 'nowrap'}}>现在：待表决</div>
      <Rise delay={200} style={{position: 'absolute', left: PAD, right: PAD, top: 1360, fontSize: 44, fontWeight: 700, lineHeight: 1.4}}>
        仍是拟议规则<br /><Sweep delay={210}>现有证书不会立即失效</Sweep>
      </Rise>
    </Frame>
  );
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
    <Frame>
      <Band src="products" dur={dur} h={460} ox={[65, 55]} from={1.1} to={1.25} />
      <Title kicker="SCOPE" top={450}>哪些产品<span style={{color: C.orange}}>要留意</span>？</Title>
      <Rise delay={10} style={{position: 'absolute', left: PAD, top: 710, fontSize: 36, color: C.muted}}>带无线功能、需要 FCC 设备授权</Rise>
      {PRODUCTS.map((p, i) => {
        const a = spring({frame: f - (40 + i * 34), fps: FPS, config: {damping: 12}});
        return (
          <div key={p.k} style={{position: 'absolute', left: PAD, top: 790 + i * 134, width: 920, display: 'flex', alignItems: 'center', gap: 32,
            opacity: a, transform: `translateX(${(1 - a) * -80}px)`, background: C.panel, borderRadius: 12, padding: '16px 40px 16px 28px'}}>
            <div style={{transform: 'scale(1.2)'}}><Icon kind={p.k} /></div>
            <div style={{fontSize: 46, fontWeight: 700}}>{p.t}</div>
          </div>
        );
      })}
    </Frame>
  );
};

const Chain: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const boxes = [
    {t: '品牌方 / 你', sub: '拿到报告'},
    {t: 'ODM · 模块商 · 代理', sub: '安排测试'},
    {t: '实验室', sub: '在哪测？谁测？', q: true},
  ];
  const x = PAD + 20, w = 900, h = 190, y0 = 500, gap = 130;
  return (
    <Frame>
      <KenBurns src="label" dur={dur} from={1.0} to={1.1} />
      <AbsoluteFill style={{background: 'rgba(255,255,255,0.9)'}} />
      <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: 12, background: C.orange}} />
      <Title kicker="WHO TESTED IT" top={170}>你的报告，<br /><span style={{color: C.orange}}>是谁测的</span>？</Title>
      {boxes.map((b, i) => {
        const start = 30 + i * 55;
        const a = spring({frame: f - start, fps: FPS, config: {damping: 13}});
        const y = y0 + i * (h + gap);
        const arrow = interpolate(f, [start + 20, start + 45], [0, 1], clamp);
        const blink = b.q ? 0.55 + 0.45 * Math.abs(Math.sin(f / 6)) : 1;
        return (
          <React.Fragment key={b.t}>
            <div style={{position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: 16, opacity: a, transform: `scale(${0.88 + 0.12 * a})`,
              background: b.q ? C.navy : '#fff', color: b.q ? '#fff' : C.navy, border: `4px solid ${b.q ? C.navy : C.line}`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(11,37,69,0.12)'}}>
              <div style={{fontSize: 56, fontWeight: 800, whiteSpace: 'nowrap'}}>{b.t}</div>
              <div style={{fontSize: 36, marginTop: 12, color: b.q ? C.orange : C.muted, fontWeight: b.q ? 800 : 400}}>{b.sub}</div>
              {b.q && <div style={{position: 'absolute', right: -24, top: -36, width: 96, height: 96, borderRadius: 48, background: C.orange, color: '#fff',
                fontSize: 70, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: blink}}>?</div>}
            </div>
            {i < boxes.length - 1 && (
              <div style={{position: 'absolute', left: x + w / 2 - 4, top: y + h + 14, width: 8, height: (gap - 28) * arrow, background: C.orange}}>
                <div style={{position: 'absolute', left: -14, bottom: -18, borderTop: `22px solid ${C.orange}`, borderLeft: '18px solid transparent', borderRight: '18px solid transparent', opacity: arrow > 0.9 ? 1 : 0}} />
              </div>
            )}
          </React.Fragment>
        );
      })}
      <Rise delay={170} style={{position: 'absolute', left: PAD, right: PAD, top: 1410, fontSize: 44, fontWeight: 700}}>
        很多企业<Sweep delay={180}>并不清楚最后一环</Sweep>
      </Rise>
    </Frame>
  );
};

const CHECKS = [
  ['报告对应哪家实验室？', '了解实际测试方'],
  ['实验室在哪个国家 / 地区？', '判断未来是否受影响'],
  ['证书由谁申请、谁持有？', '明确责任主体'],
  ['模块是否单独认证？', '整机要不要补测'],
  ['有没有替代测试方案？', '提前评估时间和成本'],
];

const Check: React.FC<{dur: number; clips: Clip[]}> = ({dur, clips}) => {
  const f = useCurrentFrame();
  return (
    <Frame>
      <Band src="report" dur={dur} h={360} ox={[55, 50]} from={1.25} to={1.4} />
      <Title kicker="CHECKLIST · 建议截图保存" top={340}>向供应商确认<span style={{color: C.orange}}> 5 件事</span></Title>
      {CHECKS.map(([q, g], i) => {
        const start = clips[i + 1].from;
        const a = spring({frame: f - start, fps: FPS, config: {damping: 14}});
        const tick = interpolate(f, [start + 18, start + 32], [0, 1], clamp);
        const active = f >= start && f < (clips[i + 2]?.from ?? dur);
        return (
          <div key={q} style={{position: 'absolute', left: PAD, top: 590 + i * 166, width: 920, height: 146, borderRadius: 12, display: 'flex', alignItems: 'center',
            padding: '0 32px', background: active ? '#FFF4EC' : C.panel, border: `3px solid ${active ? C.orange : 'transparent'}`,
            opacity: 0.25 + 0.75 * a, transform: `translateX(${(1 - a) * 50}px)`}}>
            <div style={{width: 66, height: 66, borderRadius: 33, border: `4px solid ${C.orange}`, color: C.orange, fontSize: 36, fontWeight: 900,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none'}}>{i + 1}</div>
            <div style={{marginLeft: 26, flex: 1}}>
              <div style={{fontSize: 42, fontWeight: 800}}>{q}</div>
              <div style={{fontSize: 30, color: C.muted, marginTop: 6}}>→ {g}</div>
            </div>
            <svg width="60" height="60" viewBox="0 0 56 56" style={{flex: 'none'}}>
              <rect x="4" y="4" width="48" height="48" rx="8" fill="none" stroke={C.muted} strokeWidth="4" />
              <path d="M14 29l9 9 19-21" fill="none" stroke={C.orange} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"
                strokeDasharray="50" strokeDashoffset={50 * (1 - tick)} />
            </svg>
          </div>
        );
      })}
    </Frame>
  );
};

const Outro: React.FC<{dur: number}> = ({dur}) => {
  const logo = useAppear(150, 12);
  return (
    <Frame bar={false}>
      <KenBurns src="chamber" dur={dur} from={1.3} to={1.45} ox={[50, 50]} />
      <AbsoluteFill style={{background: 'rgba(255,255,255,0.9)'}} />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: `0 ${PAD}px`, paddingBottom: 200}}>
        <Rise delay={6} style={{fontSize: 96, fontWeight: 900}}>不必急着换实验室</Rise>
        <Rise delay={40} style={{fontSize: 52, color: C.muted, marginTop: 36, lineHeight: 1.5}}>
          先<Sweep delay={50}>摸清现状</Sweep><br />等 FCC 正式规则出台再决定
        </Rise>
        <div style={{marginTop: 90, transform: `scale(${logo})`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 36}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 22}}>
            <div style={{width: 18, height: 84, background: C.orange}} />
            <div style={{fontSize: 72, fontWeight: 900, letterSpacing: '0.12em'}}>合规认证通</div>
          </div>
          <div style={{background: C.navy, color: '#fff', fontSize: 40, fontWeight: 700, padding: '16px 44px', borderRadius: 10}}>关注 · 持续跟进</div>
        </div>
      </AbsoluteFill>
      <div style={{position: 'absolute', left: PAD, right: PAD, bottom: 150, textAlign: 'center', fontSize: 26, color: C.muted}}>
        信息来源：Reuters、FCC 公开文件 · 以 FCC 正式规则为准
      </div>
    </Frame>
  );
};

const Subtitles: React.FC = () => {
  const f = useCurrentFrame();
  const {scenes} = React.useContext(TimingCtx);
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
        <div style={{position: 'absolute', left: 40, right: 120, bottom: 300, display: 'flex', justifyContent: 'center'}}>
          <div style={{background: 'rgba(11,37,69,0.9)', color: '#fff', fontFamily: FONT, fontSize: 40, fontWeight: 600, padding: '12px 26px', borderRadius: 10, textAlign: 'center', lineHeight: 1.35}}>
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
  const {TOTAL} = React.useContext(TimingCtx);
  return <div style={{position: 'absolute', left: 0, top: 0, height: 8, width: `${(f / TOTAL) * 100}%`, background: C.orange}} />;
};

const COMPS = {hook: Hook, timeline: Timeline, products: Products, chain: Chain, outro: Outro} as const;

export const VideoV: React.FC<{timing?: Timing; children?: React.ReactNode}> = ({timing = defaultTiming, children}) => (
  <TimingCtx.Provider value={timing}>
  <AbsoluteFill style={{background: C.bg}}>
    {timing.scenes.map((s) => {
      const Comp = s.id === 'check' ? null : COMPS[s.id];
      return (
        <Sequence key={s.id} from={s.from} durationInFrames={s.dur} name={s.id}>
          {Comp ? <Comp dur={s.dur} /> : <Check dur={s.dur} clips={timing.sceneOf('check').clips} />}
          {s.clips.map((c) => (
            <Sequence key={c.id} from={c.from} durationInFrames={c.dur + 15} name={c.id}>
              <Audio src={staticFile(`${timing.voDir}/${c.id}.mp3`)} />
            </Sequence>
          ))}
        </Sequence>
      );
    })}
    {children}
    <Subtitles />
    <Progress />
  </AbsoluteFill>
  </TimingCtx.Provider>
);
