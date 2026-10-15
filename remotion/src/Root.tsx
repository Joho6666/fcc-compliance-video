import {Composition} from 'remotion';
import {Video} from './Video';
import {VideoV} from './VideoV';
import {Video3} from './Video3';
import {Video4, MascotCtx, ThemeCtx, Timing4Ctx} from './Video4';
import {makeTiming4} from './timing4';
import voKid from './vo4_kid.json';
import envKid from './vo4_kid_env.json';
import {DHLayer, type DHWindow} from './DHLayer';
import {ShieldTest} from './ShieldTest';
import {Video5} from './Video5';
import {timingRZT, rztScript} from './timing5';
import {FPS, TOTAL, makeTiming} from './timing';
import {TOTAL3} from './timing3';
import {TOTAL4} from './timing4';
import voXT from './vo_xt.json';

// v2 PPT layout re-timed to the cloned voice (小谭, authorized).
const timingXT = makeTiming(voXT as Record<string, number>, 'vo_xt');
const VideoXT: React.FC = () => <VideoV timing={timingXT} />;
// v4 with the client's shield mascot as the guide.
const Video4Q: React.FC = () => <MascotCtx.Provider value="shield"><Video4 /></MascotCtx.Provider>;
// Shield version re-voiced with the cute boy voice (剪映「萌娃百科」).
const timingKid = makeTiming4(voKid as Record<string, number>, 'vo4_kid', envKid as Record<string, number[]>);
const Video4QKid: React.FC = () => <Timing4Ctx.Provider value={timingKid}><MascotCtx.Provider value="shield"><Video4 /></MascotCtx.Provider></Timing4Ctx.Provider>;
// Robot IP versions: each robot with the tech scene look of its own design sheet.
const robotCut = (dir: string, theme: 'techDark' | 'techLavender' | 'techBright'): React.FC => () => (
  <ThemeCtx.Provider value={theme}><MascotCtx.Provider value={dir}><Video4 /></MascotCtx.Provider></ThemeCtx.Provider>
);
const Video4R1 = robotCut('robot1', 'techDark');
// Theme check with the already-finished shield sprites (used while robot sprites are still generating).
const themePreview = (theme: 'techDark' | 'techLavender' | 'techBright'): React.FC => () => (
  <ThemeCtx.Provider value={theme}><MascotCtx.Provider value="shield"><Video4 /></MascotCtx.Provider></ThemeCtx.Provider>
);
const PreviewDark = themePreview('techDark');
const PreviewLavender = themePreview('techLavender');
const PreviewBright = themePreview('techBright');
const Video4R2 = robotCut('robot2', 'techLavender');
const Video4R3 = robotCut('robot3', 'techBright');

// 认证通简介: data-driven scenes from scripts/rzt_intro.json (shield guide on the dark tech look).
const VideoRZT: React.FC = () => (
  <ThemeCtx.Provider value="techDark"><MascotCtx.Provider value="shield"><Timing4Ctx.Provider value={timingRZT}><Video5 script={rztScript} /></Timing4Ctx.Provider></MascotCtx.Provider></ThemeCtx.Provider>
);

// Digital-human windows (~45% of the runtime); keep in sync with tools/timingXT_dump.mjs, which cut the s2v audio.
const sc = timingXT.sceneOf;
const check = sc('check');
const DH_WINDOWS: DHWindow[] = [
  {from: sc('hook').from, dur: sc('hook').dur, src: 'dh/xt_hook_30.mp4', mode: 'host', kicker: 'FCC 新规解读', caption: '你的 FCC 报告还能用吗？', nameTag: true},
  {from: sc('chain').from, dur: sc('chain').dur, src: 'dh/xt_chain_30.mp4', mode: 'pip'},
  {from: check.from, dur: check.clips[1].from, src: 'dh/xt_check_intro_30.mp4', mode: 'host', kicker: 'CHECKLIST', caption: '向供应商确认 5 件事'},
  {from: sc('outro').from, dur: sc('outro').dur, src: 'dh/xt_outro_30.mp4', mode: 'host', kicker: '合规认证通', caption: '先摸清现状，再做决定'},
];
const VideoDH: React.FC = () => (
  <VideoV timing={timingXT}>
    <DHLayer windows={DH_WINDOWS} />
  </VideoV>
);

export const RemotionRoot = () => (
  <>
    <Composition id="FCC" component={Video} durationInFrames={TOTAL} fps={FPS} width={1920} height={1080} />
    <Composition id="FCCV" component={VideoV} durationInFrames={TOTAL} fps={FPS} width={1080} height={1920} />
    <Composition id="FCC3" component={Video3} durationInFrames={TOTAL3} fps={FPS} width={1080} height={1920} />
    <Composition id="FCC4" component={Video4} durationInFrames={TOTAL4} fps={FPS} width={1080} height={1920} />
    <Composition id="FCC4Q" component={Video4Q} durationInFrames={TOTAL4} fps={FPS} width={1080} height={1920} />
    <Composition id="ThemeDark" component={PreviewDark} durationInFrames={TOTAL4} fps={FPS} width={1080} height={1920} />
    <Composition id="ThemeLavender" component={PreviewLavender} durationInFrames={TOTAL4} fps={FPS} width={1080} height={1920} />
    <Composition id="ThemeBright" component={PreviewBright} durationInFrames={TOTAL4} fps={FPS} width={1080} height={1920} />
    <Composition id="FCC4QKid" component={Video4QKid} durationInFrames={timingKid.TOTAL} fps={FPS} width={1080} height={1920} />
    <Composition id="FCC4R1" component={Video4R1} durationInFrames={TOTAL4} fps={FPS} width={1080} height={1920} />
    <Composition id="FCC4R2" component={Video4R2} durationInFrames={TOTAL4} fps={FPS} width={1080} height={1920} />
    <Composition id="FCC4R3" component={Video4R3} durationInFrames={TOTAL4} fps={FPS} width={1080} height={1920} />
    <Composition id="FCCV-XT" component={VideoXT} durationInFrames={timingXT.TOTAL} fps={FPS} width={1080} height={1920} />
    <Composition id="ShieldTest" component={ShieldTest} durationInFrames={30} fps={FPS} width={1536} height={2080} />
    <Composition id="FCCV-DH" component={VideoDH} durationInFrames={timingXT.TOTAL} fps={FPS} width={1080} height={1920} />
    <Composition id="RZT1" component={VideoRZT} durationInFrames={timingRZT.TOTAL} fps={FPS} width={1080} height={1920} />
  </>
);
