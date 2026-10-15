"""Assemble the FCC video in a JianYing draft: rendered Remotion video (with voice) + cloud BGM + checklist tick SFX.
Also writes a local preview mix with ffmpeg (JianYing 11.x cannot be auto-exported by the skill).
Run with the project venv:  .venv/Scripts/python.exe build_jy_draft.py
"""
import json
import os
import subprocess
import sys
from pathlib import Path

skill_root = os.getenv("JY_SKILL_ROOT") or os.path.expanduser("~/.claude/skills/jianying-editor")
sys.path.insert(0, os.path.join(skill_root, "scripts"))
from jy_wrapper import JyProject  # noqa: E402

HERE = Path(__file__).resolve().parent
FF = Path(r"C:\Users\JOHO\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0-full_build\bin\ffmpeg.exe")
VARIANT = os.getenv("VARIANT", "")  # "" = 16:9, "_竖屏" = 9:16
SRC = HERE / "remotion" / "out" / ("fcc_A_v2_voice.mp4" if not VARIANT else "fcc_A_v2_vertical.mp4")
NORM = HERE / "remotion" / "out" / f"fcc_A_v2_norm{'_v' if VARIANT else ''}.mp4"
DRAFT = f"FCC新规解读_风格A_v2{VARIANT}"

BGM_ID = "7377933297086253119"   # Light Corporate02 (135 s)
TICK_ID = "7605852475454737700"  # 科技提示音效 (1.07 s)
# BGM measures -10.8 LUFS vs voice -16 LUFS after normalising; 0.09 (~-21 dB) puts it near -32 LUFS, under the voice.
BGM_VOL, TICK_VOL = 0.09, 0.45
FADE_IN, FADE_OUT = 1.0, 2.5

timing = json.loads((HERE / "mix_timing.json").read_text(encoding="utf-8"))
total = timing["total"]

# 1. voice to -16 LUFS, video stream copied
subprocess.run([str(FF), "-y", "-v", "error", "-i", str(SRC), "-c:v", "copy",
                "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-c:a", "aac", "-b:a", "192k", str(NORM)], check=True)

# 2. JianYing draft
project = JyProject(DRAFT, overwrite=True)
project.add_media_safe(str(NORM), start_time="0s", track_name="Main")
bgm = project.add_cloud_music(BGM_ID, start_time="0s", duration=f"{total:.3f}s", track_name="BGM")
bgm.volume = BGM_VOL
bgm.add_fade(f"{FADE_IN}s", f"{FADE_OUT}s")
for t in timing["ticks"]:
    seg = project.add_cloud_media(TICK_ID, start_time=f"{t:.3f}s", duration="1.07s", track_name="SFX")
    if seg is not None:
        seg.volume = TICK_VOL
project.save()
print("draft saved:", DRAFT)

# 3. local preview mix (same levels) so the result can be reviewed without opening JianYing
cache = Path.home() / "cloud_cache"
bgm_file = next(cache.glob(f"{BGM_ID}_*"))
tick_file = next(cache.glob(f"{TICK_ID}_*"), None) or project.cloud_manager.download_asset(TICK_ID)
inputs = ["-i", str(NORM), "-i", str(bgm_file)] + sum((["-i", str(tick_file)] for _ in timing["ticks"]), [])
f = [f"[1:a]atrim=0:{total:.3f},volume={BGM_VOL},afade=t=in:d={FADE_IN},afade=t=out:st={total - FADE_OUT:.3f}:d={FADE_OUT}[bgm]"]
labels = ["[0:a]", "[bgm]"]
for i, t in enumerate(timing["ticks"]):
    ms = int(t * 1000)
    f.append(f"[{i + 2}:a]volume={TICK_VOL},adelay={ms}|{ms}[t{i}]")
    labels.append(f"[t{i}]")
f.append(f"{''.join(labels)}amix=inputs={len(labels)}:normalize=0:duration=first[a]")
out = HERE / f"FCC新规解读_风格A_v2{VARIANT}.mp4"
subprocess.run([str(FF), "-y", "-v", "error", *inputs, "-filter_complex", ";".join(f), "-map", "0:v", "-map", "[a]",
                "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", str(out)], check=True)
print("preview:", out)
