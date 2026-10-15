"""v3 vertical: synthesize SFX, build the sfx track, mix voice + BGM + SFX, and create the JianYing draft.
Prereqs: remotion/out/fcc3_voice.mp4 rendered, mix_timing3.json written by tools/timing3_dump.mjs.
Run: PYTHONIOENCODING=utf-8 .venv/Scripts/python.exe build_v3.py
"""
import json
import os
import re
import subprocess
import sys
from pathlib import Path

skill_root = os.getenv("JY_SKILL_ROOT") or os.path.expanduser("~/.claude/skills/jianying-editor")
sys.path.insert(0, os.path.join(skill_root, "scripts"))
from jy_wrapper import JyProject  # noqa: E402

HERE = Path(__file__).resolve().parent
BIN = Path(r"C:\Users\JOHO\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0-full_build\bin")
FF = str(BIN / "ffmpeg.exe")
OUT = HERE / "remotion" / "out"
SFX = HERE / "research" / "sfx"
SFX.mkdir(parents=True, exist_ok=True)
V = os.getenv("V", "3")  # "3" = dark photo version, "4" = cartoon explainer version
CFG = {
    "3": dict(src="fcc3_voice.mp4", norm="fcc3_norm.mp4", name="FCC新规解读_风格A_v3_竖屏", final="FCC新规解读_风格A_v3_竖屏.mp4", timing="mix_timing3.json",
              bgm=["7378239487698765862", "7377933297086253119"]),  # Perfect Sense (数码科技), fallback Light Corporate02
    "XT": dict(src="fccDH_voice.mp4", norm="fccDH_norm.mp4", name="FCC新规解读_PPT数字人_竖屏", final="FCC新规解读_PPT数字人_竖屏.mp4", timing="mix_timingXT.json",
               bgm=["7377933297086253119", "7378239487698765862"]),  # Light Corporate02, fallback Perfect Sense
    "4Q": dict(src="fcc4q_voice.mp4", norm="fcc4q_norm.mp4", name="FCC新规解读_Q版盾牌_竖屏", final="FCC新规解读_Q版盾牌_竖屏.mp4", timing="mix_timing4.json",
               bgm=["7378229393163175948", "7274159195459651625", "7377933297086253119"]),  # same cheerful BGM as v4
    "R1": dict(src="fcc4r1_voice.mp4", norm="fcc4r1_norm.mp4", name="FCC新规解读_机器人R1_竖屏", final="FCC新规解读_机器人R1_竖屏.mp4", timing="mix_timing4.json",
               bgm=["7378239487698765862", "7377933297086253119"]),  # Perfect Sense (数码科技)
    "R2": dict(src="fcc4r2_voice.mp4", norm="fcc4r2_norm.mp4", name="FCC新规解读_机器人R2_竖屏", final="FCC新规解读_机器人R2_竖屏.mp4", timing="mix_timing4.json",
               bgm=["7377933297086253119", "7378239487698765862"]),  # Light Corporate02
    "R3": dict(src="fcc4r3_voice.mp4", norm="fcc4r3_norm.mp4", name="FCC新规解读_机器人R3_竖屏", final="FCC新规解读_机器人R3_竖屏.mp4", timing="mix_timing4.json",
               bgm=["7378229393163175948", "7377933297086253119"]),  # 轻松欢乐俏皮钢琴尤克里里
    "4QK": dict(src="fcc4qkid_voice.mp4", norm="fcc4qkid_norm.mp4", name="FCC新规解读_Q版盾牌_萌娃配音_竖屏", final="FCC新规解读_Q版盾牌_萌娃配音_竖屏.mp4", timing="mix_timing4_kid.json",
                bgm=["7378229393163175948", "7274159195459651625", "7377933297086253119"]),  # same cheerful BGM as the shield cut
    "RZT": dict(src="rzt1_voice.mp4", norm="rzt1_norm.mp4", name="认证通简介_Q版盾牌_深色科技", final="认证通简介_Q版盾牌_深色科技.mp4", timing="mix_timing_rzt.json",
                bgm=["7378239487698765862", "7377933297086253119"]),  # Perfect Sense (时尚节奏数码科技)
    "4": dict(src="fcc4_voice.mp4", norm="fcc4_norm.mp4", name="FCC新规解读_动漫科普_v4_竖屏", final="FCC新规解读_动漫科普_v4_竖屏.mp4", timing="mix_timing4.json",
              bgm=["7378229393163175948", "7274159195459651625", "7377933297086253119"]),  # 轻松欢乐俏皮钢琴尤克里里, 轻松的吹口哨, Light Corporate02
}[V]
SRC = OUT / CFG["src"]
NAME = CFG["name"]
BGM_CANDIDATES = CFG["bgm"]
BGM_TARGET_LUFS = -32.0   # voice is -16 LUFS; music sits ~16 dB under it
FADE_IN, FADE_OUT = 0.8, 2.0

timing = json.loads((HERE / CFG["timing"]).read_text(encoding="utf-8"))
TOTAL = timing["total"]


def ff(*args):
    subprocess.run([FF, "-y", "-v", "error", *args], check=True)


def lufs(path) -> float:
    r = subprocess.run([FF, "-hide_banner", "-i", str(path), "-vn", "-af", "ebur128", "-f", "null", "-"], capture_output=True, text=True, encoding="utf-8", errors="replace")
    return float(re.findall(r"I:\s+(-?\d+\.\d+) LUFS", r.stderr)[-1])


# 1. synthesize sound effects (name -> (lavfi source, filter, gain))
RAND = "(random(0)*2-1)"
SYNTH = {
    "boom": (f"aevalsrc='sin(2*PI*(46+70*exp(-t*16))*t)*exp(-t*4.5)*0.95+0.25*{RAND}*exp(-t*28)':d=1.0:s=44100", "lowpass=f=900", 0.5),
    "stamp": (f"aevalsrc='(sin(2*PI*(90+60*exp(-t*30))*t)*exp(-t*14)+{RAND}*exp(-t*70)*0.7)':d=0.6:s=44100", "lowpass=f=2500", 0.55),
    "whoosh": ("anoisesrc=c=pink:d=0.7:a=0.9:s=44100", "highpass=f=350,lowpass=f=6000,afade=t=in:d=0.35,afade=t=out:st=0.35:d=0.35", 0.4),
    "tick": ("aevalsrc='sin(2*PI*1568*t)*exp(-t*26)+0.6*gt(t,0.07)*sin(2*PI*2093*(t-0.07))*exp(-(t-0.07)*26)':d=0.4:s=44100", "", 0.5),
    "ping": ("aevalsrc='sin(2*PI*1760*t)*exp(-t*8)*0.6+sin(2*PI*2637*t)*exp(-t*11)*0.3':d=0.8:s=44100", "", 0.45),
    "pop": ("aevalsrc='sin(2*PI*(450+3200*t)*t)*exp(-t*20)':d=0.25:s=44100", "", 0.5),
    "page": ("anoisesrc=c=white:d=0.3:a=0.8:s=44100", "highpass=f=2500,afade=t=out:st=0.05:d=0.25", 0.3),
}
for name, (src, filt, gain) in SYNTH.items():
    out = SFX / f"{name}.wav"
    chain = ",".join(x for x in [filt, f"volume={gain}"] if x)
    ff("-f", "lavfi", "-i", src, "-af", chain, "-ar", "44100", "-ac", "1", str(out))

# 2. sfx track aligned to shot starts (whoosh leads the cut a little)
cues = [(s["from"] - (0.15 if s["sfx"] == "whoosh" else 0.0), s["sfx"]) for s in timing["shots"] if s.get("sfx")]
inputs, labels, parts = [], [], []
for i, (t, name) in enumerate(cues):
    inputs += ["-i", str(SFX / f"{name}.wav")]
    ms = max(0, int(t * 1000))
    parts.append(f"[{i}:a]adelay={ms}|{ms}[c{i}]")
    labels.append(f"[c{i}]")
parts.append(f"{''.join(labels)}amix=inputs={len(labels)}:normalize=0:duration=longest,apad=whole_dur={TOTAL:.3f},atrim=0:{TOTAL:.3f}[a]")
sfx_track = SFX / "sfx_track.wav"
ff(*inputs, "-filter_complex", ";".join(parts), "-map", "[a]", str(sfx_track))
print("sfx cues:", len(cues))

# 3. voice -> -16 LUFS (video stream copied)
norm = OUT / CFG["norm"]
ff("-i", str(SRC), "-c:v", "copy", "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-c:a", "aac", "-b:a", "192k", str(norm))

# 4. JianYing draft + BGM
project = JyProject(NAME, overwrite=True)
bgm_file, bgm_id = None, None
for cid in BGM_CANDIDATES:
    p = project.cloud_manager.download_asset(cid)
    if p and os.path.exists(p):
        bgm_file, bgm_id = Path(p), cid
        break
if not bgm_file:
    raise SystemExit("no BGM could be downloaded")
bgm_lufs = lufs(bgm_file)
gain = 10 ** ((BGM_TARGET_LUFS - bgm_lufs) / 20)
print(f"BGM {bgm_id} {bgm_file.name}: {bgm_lufs} LUFS -> volume {gain:.3f}")

project.add_media_safe(str(norm), start_time="0s", track_name="Main")
seg = project.add_cloud_music(bgm_id, start_time="0s", duration=f"{TOTAL:.3f}s", track_name="BGM")
seg.volume = round(gain, 3)
seg.add_fade(f"{FADE_IN}s", f"{FADE_OUT}s")
sfx_seg = project.add_audio_safe(str(sfx_track), start_time="0s", duration=f"{TOTAL:.3f}s", track_name="SFX")
project.save()
print("draft:", NAME)

# 5. local mix (same levels)
final = HERE / CFG["final"]
fc = (f"[1:a]atrim=0:{TOTAL:.3f},volume={gain:.4f},afade=t=in:d={FADE_IN},afade=t=out:st={TOTAL - FADE_OUT:.3f}:d={FADE_OUT}[bgm];"
      f"[0:a][bgm][2:a]amix=inputs=3:normalize=0:duration=first,alimiter=limit=0.84:level=disabled[a]")
ff("-i", str(norm), "-i", str(bgm_file), "-i", str(sfx_track), "-filter_complex", fc, "-map", "0:v", "-map", "[a]",
   "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", str(final))
print("final:", final, "LUFS", lufs(final))
