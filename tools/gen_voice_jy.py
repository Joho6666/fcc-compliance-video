"""Voice-over via the jianying-editor skill's SAMI TTS (剪映 voices).
Usage:
  python gen_voice_jy.py test <speaker> [<speaker> ...]   -> samples/voice_test/<speaker>.mp3 (line s1 only)
  python gen_voice_jy.py all <speaker>                    -> remotion/public/vo/<id>.mp3 + remotion/src/vo.json
"""
import asyncio
import json
import os
import subprocess
import sys
from pathlib import Path

skill_root = os.getenv("JY_SKILL_ROOT") or os.path.expanduser("~/.claude/skills/jianying-editor")
sys.path.insert(0, os.path.join(skill_root, "scripts"))
from universal_tts import generate_voice_with_meta  # noqa: E402

HERE = Path(__file__).resolve().parent.parent
ROOT = HERE / "remotion"
FFBIN = Path(r"C:\Users\JOHO\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0-full_build\bin")
TEMPO = os.getenv("TEMPO", "1.0")  # >1 speeds up without pitch change


async def tts(text, speaker, out: Path):
    raw = out.with_suffix(".raw")
    path, backend = await generate_voice_with_meta(text, str(raw), speaker, backend="sami", allow_fallback=False, sami_retries=3)
    if not path:
        raise RuntimeError(f"SAMI failed for {speaker}: {text}")
    # trim leading/trailing silence, optional tempo, normalise container to mp3
    subprocess.run([str(FFBIN / "ffmpeg.exe"), "-y", "-v", "error", "-i", path,
                    "-af", f"silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,atempo={TEMPO}",
                    "-ar", "44100", "-b:a", "192k", str(out)], check=True)
    os.remove(path)


def duration(p: Path) -> float:
    d = subprocess.run([str(FFBIN / "ffprobe.exe"), "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)],
                       capture_output=True, text=True, check=True).stdout
    return round(float(d), 2)


async def main():
    mode, *speakers = sys.argv[1:]
    LINES = os.getenv("LINES", "lines")
    lines = json.loads((ROOT / "src" / f"{LINES}.json").read_text(encoding="utf-8"))
    if mode == "test":
        out_dir = HERE / "samples" / "voice_test"
        out_dir.mkdir(parents=True, exist_ok=True)
        for sp in speakers:
            out = out_dir / f"{sp}.mp3"
            await tts(lines[0]["text"], sp, out)
            print(sp, duration(out))
        return
    speaker = speakers[0]
    vo = ROOT / "public" / os.getenv("VODIR", "vo")
    vo.mkdir(parents=True, exist_ok=True)
    durations = {}
    for item in lines:
        out = vo / f"{item['id']}.mp3"
        if not out.exists():
            await tts(item["text"], speaker, out)
        durations[item["id"]] = duration(out)
        print(item["id"], durations[item["id"]])
    (ROOT / "src" / os.getenv("VOJSON", "vo.json")).write_text(json.dumps(durations, indent=2), encoding="utf-8")


asyncio.run(main())
