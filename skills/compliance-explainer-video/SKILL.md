---
name: compliance-explainer-video
description: Use when making a 认证通 / 合规认证通 short video (Q版盾牌, 小白debug 风格科普, 方格纸, 合规/认证/出海/新规解读), when the user hands over a filled 脚本模板 .md or a new compliance topic, or says "按之前的模板/风格再做一条".
---

# 认证通 · 小白debug 风格 Q版科普视频

## Overview
One fixed template, data-driven: a new topic = a new script JSON + male voice + one composition. Scene layouts are code (`Video5.tsx`), all on-screen text comes from JSON — never hardcode topic text in components.

**Template video (the reference look):** `fcc-video/认证通简介_Q版盾牌_方格纸_男声.mp4`

Project root: `C:\Users\JOHO\Documents\Codex\2026-09-26\files-pasted-by-the-user-github\work\repo\fcc-video` (below: `$P`). Remotion app in `$P/remotion`.

## Fixed spec (do not vary unless the user asks)

| Item | Value |
|---|---|
| Canvas | 1080×1920, 30 fps, 45–75 s |
| Look | `ThemeCtx="paper"` (方格纸, no tech frame / glass panel / holo cards) |
| Mascot | `MascotCtx="shield"` (client IP sprites in `remotion/public/shield`) |
| Voice | **male only**: 剪映 SAMI「萌娃百科」`zh_male_zhengtaikp`, `TEMPO=1.05` |
| BGM | `7378229393163175948` 轻松欢乐俏皮钢琴尤克里里 (fallbacks `7274159195459651625`, `7377933297086253119`), -32 LUFS under -16 LUFS voice |
| Structure | 8 scenes: hook / valid / analogy / chain / impact / timeline / check / outro |
| Branding | watermark from `meta.watermark` (e.g. `@认证通`), source line in outro from `meta.source` |
| Output | `$P/<标题>_Q版盾牌_方格纸_男声.mp4` + 剪映草稿 of the same name; open it in the default player |

## Workflow (new topic `<id>`, e.g. `rzt2`; composition IDs use `-`, never `_`)

1. **Script → JSON.** Copy the user's md to `$P/research/scripts/`, then
   `python tools/md_script_to_json.py <md> remotion/src/scripts/<id>.json remotion/src/<id>_lines.json <prefix>`
   Then fill each `scenes.<type>` structured fields by hand — see `scene-schema.md`. Set `meta.watermark`, `meta.source`, `meta.brand`.
2. **Voice (male).** From `$P`:
   `LINES=<id>_lines VODIR=vo_<id> VOJSON=vo_<id>.json TEMPO=1.05 .venv/Scripts/python.exe -I tools/gen_voice_jy.py all zh_male_zhengtaikp`
   Listen for misread English/numbers (AI+SaaS, dates); rewrite the line in Chinese reading, delete that mp3, rerun (existing clips are skipped).
3. **Lip-sync envelope.** `python tools/vo_env.py vo_<id> vo_<id>.json vo_<id>_env.json` (paths are relative to `remotion/public` and `remotion/src`).
4. **Composition.** In `remotion/src/Root.tsx`: import the script, `vo_<id>.json`, env json; `const t = timingForScript(script as unknown as Script5, vo, 'vo_<id>', env)` (from `timing5.ts`); wrap `<Video5 script={…}/>` in `ThemeCtx "paper"` → `MascotCtx "shield"` → `Timing4Ctx t`; register `<Composition id="<ID>" … durationInFrames={t.TOTAL} width={1080} height={1920}/>`. `npx tsc -p . --noEmit`.
5. **Check frames before the full render.** `npx remotion still <ID> out/x.png --frame=N` at the end of each scene (scene ends: `mix_timing_<id>.json` from step 6), tile with ffmpeg `xstack`, look for overflow / overlaps.
6. **Mix timing.** `SCRIPT=scripts/<id>.json VOJSON=vo_<id>.json OUT=mix_timing_<id>.json node tools/timing5_dump.mjs`
7. **Render + mix.** `npx remotion render <ID> out/<id>_voice.mp4`; add a `CFG` entry in `$P/build_v3.py` (src/norm/name/final/timing/bgm as above), run `V=<KEY> PYTHONIOENCODING=utf-8 .venv/Scripts/python.exe build_v3.py`.
8. **Verify + deliver.** ffprobe 1080×1920/30 fps; `volumedetect` peak < -1 dB; LUFS ≈ -16; open the mp4; tell the user the path and anything marked `[核实]`.

## Script rules (check before voicing)
- One sentence = one shot, 8–20 字; titles ≤ 8 字 with one `【高亮】` word.
- Numbers/dates in Chinese reading in narration; Arabic numerals on screen.
- Analogies start with "打个比方"; consequences only from the source, otherwise mark `[核实]` and tell the user.
- Certification marks (CE/FCC/…) as plain text badges only — never draw official logos.
- Brand endorsements (e.g. 前安克资深合规认证专家) — remind the user to confirm with the client.

## Common mistakes
| Mistake | Fix |
|---|---|
| Female voice / tech-dark look by habit | Template is paper + male. Old dark/female cuts exist only as history. |
| Editing `Video4.tsx` scenes or FCC data for a new topic | Only add JSON + composition; FCC4/R1–R3 must stay unchanged. |
| Composition id with `_` | Remotion rejects it; use `-`. |
| Windows CRLF breaks string replace / regex in node or python | Write with `newline='\n'`; strip `\r` when reading. |
| `vo_env.py` given full paths | It prefixes `remotion/public` / `remotion/src` itself. |
| Layout guesses | `P x` is the element centre, `Bubble x` its left edge; shield sprites render wider than `w` — verify with stills. |
| Peaks at 0 dBFS | Keep `alimiter=limit=0.84:level=disabled` in build_v3.py. |
| Uploading the project publicly | Never include real-person digital-human likeness/voice (`public/dh`, `vo_xt`, `research/dh`, `research/voice`) or downloaded reference videos. |
