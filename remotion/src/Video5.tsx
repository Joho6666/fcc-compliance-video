import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, Easing} from 'remotion';
import {FPS, type Scene} from './timing4';
import {chunks, FONT, clamp} from './Video';
import {TechBackdrop, THEMES} from './TechBackdrop';
import {
  INK, NAVY, TEAL, GREEN, ORANGE, RED, YELLOW, PEACH, MINT, W, H, SUB_BOTTOM, S,
  pop, P, Text, Chip, Title, G, Grid, Badge, Line, Bubble, Mascot, Wipe, useShake, SceneOffsetCtx, Timing4Ctx, ThemeCtx,
  IconDoc, IconBuilding, IconClipboard, IconChip, IconFactory, IconPerson, type Pose,
} from './Video4';

// Data-driven explainer: every on-screen element comes from a script JSON (see 脚本模板/ and scripts/*.json),
// so a new topic only needs a new script file. Layouts follow the v4 scenes (hook / valid / analogy / chain / impact / timeline / check / outro).

export type TitlePart = {t: string; hl?: boolean};
export type ScriptBeat = {id: string; scene: string; text: string; pose: string; sfx?: string};
export type Script5 = {
  meta: Record<string, string>;
  beats: ScriptBeat[];
  scenes: Record<string, Record<string, any>>; // eslint-disable-line @typescript-eslint/no-explicit-any
};

// ---------- extra icons (same flat thick-outline style) ----------
const IconBox: React.FC<{w?: number}> = ({w = 180}) => (
  <svg width={w} height={w} viewBox="0 0 120 120">
    <path d="M16 40l44-22 44 22v50l-44 22-44-22z" {...S} fill="#F7E4B8" />
    <path d="M16 40l44 22 44-22M60 62v50" {...S} />
    <path d="M38 29l44 22v16" {...S} strokeWidth={4} />
  </svg>
);
const IconCar: React.FC<{w?: number}> = ({w = 200}) => (
  <svg width={w} height={w * 0.75} viewBox="0 0 120 90">
    <path d="M14 58l8-24q4-10 16-10h44q12 0 16 10l8 24v14H14z" {...S} fill={TEAL} />
    <path d="M30 34h60l6 18H24z" {...S} fill="#DFF6FF" strokeWidth={4} />
    <circle cx="36" cy="72" r="11" {...S} fill={INK} /><circle cx="84" cy="72" r="11" {...S} fill={INK} />
    <circle cx="36" cy="72" r="4" fill="#fff" /><circle cx="84" cy="72" r="4" fill="#fff" />
  </svg>
);
const IconSign: React.FC<{w?: number}> = ({w = 170}) => (
  <svg width={w} height={w} viewBox="0 0 120 120">
    <path d="M60 64v48" {...S} strokeWidth={8} />
    <path d="M60 10l46 46-46 46-46-46z" {...S} fill={YELLOW} />
    <path d="M60 36v24M60 72v2" {...S} strokeWidth={9} />
  </svg>
);
const IconNav: React.FC<{w?: number}> = ({w = 170}) => (
  <svg width={w} height={w} viewBox="0 0 120 120">
    <path d="M60 110s-36-38-36-62a36 36 0 0 1 72 0c0 24-36 62-36 62z" {...S} fill={GREEN} />
    <circle cx="60" cy="48" r="14" {...S} fill="#fff" strokeWidth={4} />
  </svg>
);
const IconShield: React.FC<{w?: number}> = ({w = 170}) => (
  <svg width={w} height={w * 1.1} viewBox="0 0 120 132">
    <path d="M60 8l46 16v34c0 32-20 56-46 66-26-10-46-34-46-66V24z" {...S} fill="#5C86FF" />
    <path d="M60 22l32 11v25c0 22-13 40-32 48" fill="#8CC8FF" opacity={0.5} />
    <path d="M38 64l16 16 30-32" fill="none" stroke="#fff" strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconRefresh: React.FC<{w?: number}> = ({w = 150}) => (
  <svg width={w} height={w} viewBox="0 0 120 120">
    <circle cx="60" cy="60" r="48" {...S} fill={MINT} />
    <path d="M86 50a28 28 0 0 0-50-8M34 70a28 28 0 0 0 50 8" {...S} strokeWidth={8} />
    <path d="M30 30v14h14M90 90V76H76" {...S} strokeWidth={8} />
  </svg>
);
const IconCoin: React.FC<{w?: number}> = ({w = 150}) => (
  <svg width={w} height={w} viewBox="0 0 120 120">
    <ellipse cx="60" cy="84" rx="40" ry="14" {...S} fill={YELLOW} />
    <path d="M20 66v18M100 66v18" {...S} />
    <ellipse cx="60" cy="66" rx="40" ry="14" {...S} fill={YELLOW} />
    <ellipse cx="60" cy="44" rx="40" ry="14" {...S} fill="#FFE27A" />
    <path d="M20 44v22M100 44v22" {...S} />
    <path d="M60 36v16M54 40h12" {...S} strokeWidth={4} />
  </svg>
);
const IconGlobe: React.FC<{w?: number}> = ({w = 170}) => (
  <svg width={w} height={w} viewBox="0 0 120 120">
    <circle cx="60" cy="60" r="48" {...S} fill="#8CC8FF" />
    <ellipse cx="60" cy="60" rx="20" ry="48" {...S} fill="none" strokeWidth={4} />
    <path d="M12 60h96M20 36h80M20 84h80" {...S} strokeWidth={4} />
  </svg>
);

const ICONS: Record<string, React.FC<{w?: number}>> = {
  doc: IconDoc, box: IconBox, car: IconCar, sign: IconSign, nav: IconNav, shield: IconShield, refresh: IconRefresh, coin: IconCoin, globe: IconGlobe,
  chip: IconChip, factory: IconFactory, person: IconPerson, clipboard: (p) => <IconClipboard w={p.w} />, lab: (p) => <IconBuilding w={p.w} kind="lab" />,
};
const Icon: React.FC<{name: string; w: number}> = ({name, w}) => {
  const C = ICONS[name] ?? IconDoc;
  return <C w={w} />;
};

const TitleParts: React.FC<{parts: TitlePart[]; hl?: string}> = ({parts, hl = GREEN}) => (
  <>{parts.map((p, i) => (p.hl ? <G key={i} color={hl}>{p.t}</G> : <React.Fragment key={i}>{p.t}</React.Fragment>))}</>
);

// ---------- scenes ----------
type SP5 = {s: Scene; b: number[]; sc: Record<string, any>; beats: ScriptBeat[]}; // eslint-disable-line @typescript-eslint/no-explicit-any

/** Pose of the beat currently being spoken ('none' hides the guide). */
const poseNow = (f: number, b: number[], beats: ScriptBeat[]) => {
  let i = 0;
  for (let k = 0; k < b.length; k++) if (f >= b[k]) i = k;
  return beats[i]?.pose ?? 'master';
};
const Guide: React.FC<{f: number; b: number[]; beats: ScriptBeat[]; at: number; big?: boolean; x?: number}> = ({f, b, beats, at, big, x}) => {
  const pose = poseNow(f, b, beats);
  if (pose === 'none') return null;
  return big ? <Mascot f={f} at={at} pose={pose as Pose} x={x} /> : <Mascot f={f} at={at} pose={pose as Pose} w={250} h={250} x={x ?? 10} />;
};

const Hook: React.FC<SP5> = ({b, sc, beats}) => {
  const f = useCurrentFrame();
  const badges: string[] = sc.badges ?? [];
  return (
    <div style={{position: 'absolute', inset: 0, ...useShake(f, 8)}}>
      <Title f={f}><TitleParts parts={sc.title} /></Title>
      {badges.map((t, i) => (
        <P key={t} f={f} at={8 + i * 5} x={210 + (i % 3) * 330} y={560 + Math.floor(i / 3) * 190} rot={i % 2 ? 4 : -4}>
          <div style={{width: 250, height: 150, borderRadius: 26, background: '#fff', border: `6px solid ${INK}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 10px 0 rgba(18,56,74,0.25)'}}><Text size={t.length > 3 ? 56 : 70} color={[NAVY, GREEN, ORANGE, RED, TEAL, NAVY][i % 6]}>{t}</Text></div>
        </P>
      ))}
      {sc.chip && <P f={f} at={42} x={540} y={940}><Chip color={ORANGE}>{sc.chip}</Chip></P>}
      <Guide f={f} b={b} beats={beats} at={2} big />
      {sc.bubble && b[1] !== undefined && <Bubble f={f} at={b[1] + 4} x={430} y={1210} w={590}>{sc.bubble}</Bubble>}
    </div>
  );
};

const Valid: React.FC<SP5> = ({b, sc, beats}) => {
  const f = useCurrentFrame();
  const stampAt = b[0] + 16;
  const sp = spring({frame: f - stampAt, fps: FPS, config: {damping: 9, stiffness: 260, mass: 0.6}});
  return (
    <div style={{position: 'absolute', inset: 0, ...useShake(f, stampAt)}}>
      <Title f={f}><TitleParts parts={sc.title} /></Title>
      <P f={f} at={4} x={540} y={680}><Icon name={sc.icon ?? 'shield'} w={380} /></P>
      {sc.stamp && f >= stampAt && (
        <div style={{position: 'absolute', left: 540, top: 820, transform: `translate(-50%, -50%) rotate(-12deg) scale(${3 - 2 * Math.min(1, sp)})`, opacity: Math.min(1, sp * 2),
          border: `12px solid ${GREEN}`, color: GREEN, borderRadius: 22, padding: '4px 34px', fontFamily: FONT, fontWeight: 900, fontSize: 104, letterSpacing: 4,
          background: 'rgba(255,255,255,0.9)', whiteSpace: 'nowrap'}}>{sc.stamp}</div>
      )}
      {sc.tag && b[1] !== undefined && <P f={f} at={b[1] + 4} x={600} y={1010}><Chip color={NAVY} size={44}>{sc.tag}</Chip></P>}
      <Guide f={f} b={b} beats={beats} at={b[0] + 24} big />
      {sc.bubble && <Bubble f={f} at={b[0] + 34} x={430} y={1250} w={420}>{sc.bubble}</Bubble>}
    </div>
  );
};

const Analogy: React.FC<SP5> = ({b, sc, beats}) => {
  const f = useCurrentFrame();
  const rows: {l: {icon: string; label: string}; r: {icon: string; label: string}}[] = sc.rows ?? [];
  const ys = [540, 890, 1235];
  const cell = (c: {icon: string; label: string}) => (
    <div style={{textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
      <Icon name={c.icon} w={200} /><div style={{marginTop: 6}}><Text size={48}>{c.label}</Text></div>
    </div>
  );
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <Title f={f}><TitleParts parts={sc.title} /></Title>
      {rows.map((r, i) => (
        <React.Fragment key={i}>
          <P f={f} at={b[i] ?? 0} x={250} y={ys[i]}>{cell(r.l)}</P>
          <P f={f} at={(b[i] ?? 0) + 10} x={540} y={ys[i] - 30}><Text size={140} color={ORANGE}>=</Text></P>
          <P f={f} at={(b[i] ?? 0) + 18} x={830} y={ys[i]}>{cell(r.r)}</P>
        </React.Fragment>
      ))}
      <Guide f={f} b={b} beats={beats} at={b[0] + 20} />
    </div>
  );
};

const Chain: React.FC<SP5> = ({b, sc, beats}) => {
  const f = useCurrentFrame();
  const cards: {icon: string; text: string}[] = sc.cards ?? [];
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <Title f={f}><TitleParts parts={sc.title} /></Title>
      {cards.map((c, i) => {
        const at = b[i] ?? b[b.length - 1];
        const x = pop(f, at + 12, 9);
        return (
          <P key={c.text} f={f} at={at} x={540} y={540 + i * 290}>
            <div style={{width: 760, height: 200, borderRadius: 28, background: '#fff', border: `6px solid ${INK}`, display: 'flex', alignItems: 'center', gap: 30, padding: '0 40px',
              boxShadow: '0 10px 0 rgba(18,56,74,0.25)', position: 'relative'}}>
              <Icon name={c.icon} w={130} /><Text size={58} align="left">{c.text}</Text>
              <div style={{position: 'absolute', right: -24, top: -30, transform: `scale(${Math.max(0, x)})`}}><Badge kind="cross" size={84} /></div>
            </div>
          </P>
        );
      })}
      <Guide f={f} b={b} beats={beats} at={b[0] + 20} />
    </div>
  );
};

const Impact: React.FC<SP5> = ({b, sc, beats}) => {
  const f = useCurrentFrame();
  const ban = pop(f, b[0] + 16, 9);
  const b1 = b[1] ?? b[0] + 40;
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <Title f={f}><TitleParts parts={sc.title} hl={RED} /></Title>
      <P f={f} at={b[0]} x={540} y={600}>
        <div style={{position: 'relative', textAlign: 'center'}}>
          <Icon name={sc.from?.icon ?? 'doc'} w={250} />
          <div style={{position: 'absolute', left: -40, right: -40, top: -10, display: 'flex', justifyContent: 'center', transform: `scale(${Math.max(0, ban)})`}}>
            <svg width={320} height={320} viewBox="0 0 120 120"><circle cx="60" cy="60" r="50" fill="rgba(224,82,74,0.12)" stroke={RED} strokeWidth={9} /><path d="M25 95L95 25" stroke={RED} strokeWidth={9} strokeLinecap="round" /></svg>
          </div>
          <div style={{marginTop: 10}}><Text size={50} color={RED}>{sc.from?.label}</Text></div>
        </div>
      </P>
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <Line f={f} at={b1} x1={540} y1={830} x2={540} y2={900} color={RED} />
        <Line f={f} at={b1 + 22} x1={540} y1={1130} x2={540} y2={1210} color={RED} />
      </svg>
      {sc.mid && <P f={f} at={b1 + 6} x={540} y={1020}><div style={{display: 'flex', alignItems: 'center', gap: 22}}><Icon name={sc.mid.icon} w={160} /><Text size={50}>{sc.mid.label}</Text></div></P>}
      <P f={f} at={b1 + 26} x={655} y={1320}>
        <div style={{display: 'flex', alignItems: 'center', gap: 22}}><Badge kind="warn" size={80} /><Chip color={RED} size={48}>{sc.result}</Chip></div>
      </P>
      <Guide f={f} b={b} beats={beats} at={b[0] + 24} />
    </div>
  );
};

const Timeline: React.FC<SP5> = ({b, sc, beats}) => {
  const f = useCurrentFrame();
  const nodes: {d: string; t?: string; now?: boolean}[] = sc.nodes ?? [];
  const x = 170, y0 = 590, step = 270;
  const grow = interpolate(f, [b[0] + 4, b[0] + 70], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const len = step * (nodes.length - 1);
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <Title f={f}><TitleParts parts={sc.title} /></Title>
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <line x1={x} y1={y0} x2={x} y2={y0 + len * grow} stroke={INK} strokeWidth={9} strokeLinecap="round" />
      </svg>
      {nodes.map((n, i) => {
        const y = y0 + i * step;
        const p = pop(f, b[0] + 6 + i * 22, 11);
        const pulse = n.now ? 1 + 0.4 * ((f % 34) / 34) : 1;
        return (
          <React.Fragment key={n.d}>
            {n.now && <div style={{position: 'absolute', left: x - 34 * pulse, top: y - 34 * pulse, width: 68 * pulse, height: 68 * pulse, borderRadius: '50%', background: ORANGE, opacity: p * (1 - (f % 34) / 34) * 0.5}} />}
            <div style={{position: 'absolute', left: x - 26, top: y - 26, width: 52, height: 52, borderRadius: 26, background: n.now ? ORANGE : '#fff', border: `7px solid ${INK}`, transform: `scale(${Math.max(0, p)})`}} />
            <div style={{position: 'absolute', left: x + 80, top: y - 64, opacity: Math.min(1, p * 2), transform: `translateX(${(1 - Math.min(1, p)) * 50}px)`}}>
              <Text size={74} align="left" color={n.now ? ORANGE : INK}>{n.d}</Text>
              {n.t && <Text size={42} align="left" weight={700} color={n.now ? INK : '#4A6572'}>{n.t}</Text>}
            </div>
          </React.Fragment>
        );
      })}
      {sc.chip && b[1] !== undefined && (
        <P f={f} at={b[1]} x={600} y={1390}><div style={{display: 'flex', alignItems: 'center', gap: 24}}><Icon name="refresh" w={110} /><Chip color={ORANGE} size={56}>{sc.chip}</Chip></div></P>
      )}
      <Guide f={f} b={b} beats={beats} at={b[0] + 20} />
    </div>
  );
};

const Check: React.FC<SP5> = ({b, sc, beats}) => {
  const f = useCurrentFrame();
  const items: string[] = sc.items ?? [];
  const card = pop(f, 2, 13);
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <Title f={f} size={sc.titleSize ?? 112}><TitleParts parts={sc.title} /></Title>
      <div style={{position: 'absolute', left: 60, top: 420, width: 960, transform: `scale(${Math.max(0, card)})`, transformOrigin: 'top center', opacity: Math.min(1, card * 2)}}>
        <div style={{position: 'absolute', left: 340, top: -30, width: 280, height: 70, borderRadius: 18, background: TEAL, border: `6px solid ${INK}`}} />
        <div style={{background: '#fff', border: `6px solid ${INK}`, borderRadius: 30, padding: '30px 30px 12px', boxShadow: '0 12px 0 rgba(18,56,74,0.25)'}}>
          {sc.header && <div style={{textAlign: 'center', margin: '18px 0 10px'}}><Text size={42} color={NAVY}>{sc.header}</Text></div>}
          {items.map((t, i) => {
            const start = b[i + 1] ?? 1e9;
            const tick = interpolate(f, [start + 8, start + 22], [0, 1], clamp);
            const active = f >= start && f < (b[i + 2] ?? 1e9);
            const done = f >= start + 8;
            return (
              <div key={t} style={{display: 'flex', alignItems: 'center', height: 132, borderRadius: 18, margin: '0 0 8px', padding: '0 22px', background: active ? '#FFF1DD' : 'transparent', border: `4px solid ${active ? ORANGE : 'transparent'}`}}>
                <div style={{width: 66, height: 66, borderRadius: 33, background: done ? GREEN : '#fff', border: `5px solid ${INK}`, color: done ? '#fff' : INK, fontFamily: FONT, fontWeight: 900, fontSize: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none'}}>{i + 1}</div>
                <div style={{marginLeft: 26, flex: 1}}><Text size={50} align="left">{t}</Text></div>
                <svg width="74" height="74" viewBox="0 0 56 56">
                  <rect x="4" y="4" width="48" height="48" rx="10" fill="#fff" stroke={INK} strokeWidth="5" />
                  <path d="M13 29l10 10 20-23" fill="none" stroke={GREEN} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="56" strokeDashoffset={56 * (1 - tick)} />
                </svg>
              </div>
            );
          })}
        </div>
      </div>
      <Guide f={f} b={b} beats={beats} at={b[0] + 10} />
    </div>
  );
};

const Outro: React.FC<SP5 & {source?: string}> = ({b, sc, beats, source}) => {
  const f = useCurrentFrame();
  const sticker = pop(f, b[0] + 6, 10);
  const b1 = b[1] ?? b[0] + 30;
  const pose = poseNow(f, b, beats);
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <Title f={f}><TitleParts parts={sc.title} /></Title>
      <Mascot f={f} at={2} pose={(pose === 'none' ? 'wave' : pose) as Pose} x={0} w={460} h={700} bottom={H - SUB_BOTTOM - 70} />
      {sc.sticker && (
        <div style={{position: 'absolute', left: 620, top: 470, transform: `scale(${Math.max(0, sticker)}) rotate(4deg)`, transformOrigin: 'center'}}>
          <div style={{border: '6px dashed #222', borderRadius: 40, padding: 14, background: '#fff', boxShadow: '0 10px 0 rgba(18,56,74,0.25)'}}>
            <div style={{background: NAVY, borderRadius: 28, padding: '30px 34px', textAlign: 'center'}}><Text size={70} color="#fff">{sc.sticker}</Text></div>
          </div>
        </div>
      )}
      {sc.bubble && <Bubble f={f} at={b1 + 2} x={520} y={860} w={500}>{sc.bubble}</Bubble>}
      {sc.bye && <P f={f} at={b1 + 26} x={850} y={1230}><Text size={56} color={TEAL}>{sc.bye}</Text></P>}
      {source && <div style={{position: 'absolute', right: 70, top: 1412}}><Text size={26} weight={500} color="#5B7480">{source}</Text></div>}
    </div>
  );
};

const RENDER: Record<string, React.FC<SP5 & {source?: string}>> = {hook: Hook, valid: Valid, analogy: Analogy, chain: Chain, impact: Impact, timeline: Timeline, check: Check, outro: Outro};

const Subtitle5: React.FC<{text: Record<string, string>}> = ({text}) => {
  const f = useCurrentFrame();
  const {scenes} = React.useContext(Timing4Ctx);
  for (const s of scenes) {
    for (const bt of s.beats) {
      const start = s.from + bt.from;
      if (f < start || f >= start + bt.dur) continue;
      const parts = chunks(text[bt.clip] ?? '');
      if (!parts.length) return null;
      const total = parts.reduce((n, p) => n + p.length, 0);
      let acc = 0;
      const local = (f - start) / Math.max(1, bt.dur - 6);
      const cur = parts.find((p) => (acc += p.length) / total > local) ?? parts[parts.length - 1];
      return (
        <div style={{position: 'absolute', left: 40, right: 120, bottom: SUB_BOTTOM, display: 'flex', justifyContent: 'center', zIndex: 60}}>
          <div style={{background: 'rgba(70,82,88,0.82)', color: '#fff', fontFamily: FONT, fontSize: 42, fontWeight: 700, padding: '10px 28px', borderRadius: 12, textAlign: 'center', lineHeight: 1.3}}>
            {cur.replace(/[，。：；、！？]$/, '')}
          </div>
        </div>
      );
    }
  }
  return null;
};

export const Video5: React.FC<{script: Script5}> = ({script}) => {
  const theme = React.useContext(ThemeCtx);
  const tm = React.useContext(Timing4Ctx);
  const text = Object.fromEntries(script.beats.map((b) => [b.id, b.text]));
  return (
    <AbsoluteFill style={{background: '#E8EEF0'}}>
      {theme === 'paper' ? <Grid /> : <TechBackdrop theme={theme} />}
      {tm.scenes.map((s, i) => {
        const R = RENDER[s.id];
        const beats = script.beats.filter((x) => x.scene === s.id);
        return (
          <Sequence key={s.id} from={s.from} durationInFrames={s.dur} name={s.id}>
            <SceneOffsetCtx.Provider value={s.from}>
              <AbsoluteFill>
                {R && <R s={s} b={s.beats.map((x) => x.from)} sc={script.scenes[s.id] ?? {}} beats={beats} source={script.meta.source} />}
                {i > 0 && <WipeAt />}
              </AbsoluteFill>
            </SceneOffsetCtx.Provider>
            {s.beats.map((bt) => (
              <Sequence key={bt.clip} from={bt.from} durationInFrames={bt.dur + 12} name={bt.clip}>
                <Audio src={staticFile(`${tm.voDir}/${bt.clip}.mp3`)} />
              </Sequence>
            ))}
          </Sequence>
        );
      })}
      <Subtitle5 text={text} />
      <div style={{position: 'absolute', right: theme === 'paper' ? 60 : 70, top: theme === 'paper' ? 70 : 1462, fontFamily: FONT, fontSize: 30, fontWeight: 700,
        color: theme === 'paper' ? '#7E97A1' : THEMES[theme].watermark, zIndex: 60}}>{script.meta.watermark ?? ''}</div>
    </AbsoluteFill>
  );
};

const WipeAt: React.FC = () => {
  const f = useCurrentFrame();
  return <Wipe f={f} />;
};

// keep PEACH referenced for future bubble colour overrides
void PEACH;
