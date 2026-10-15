"""Fallback voice-over via edge-tts (free Microsoft neural voices) when MOSS is down.
Writes remotion/public/vo/<id>.mp3 and remotion/src/vo.json, same contract as gen_voice.mjs."""
import asyncio
import json
import os
import subprocess
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parent.parent / "remotion"
OUT = ROOT / "public" / "vo"
VOICE = os.environ.get("VOICE", "zh-CN-XiaoxiaoNeural")
RATE = os.environ.get("RATE", "+8%")
FFPROBE = os.environ.get("FFPROBE", "ffprobe")


async def main():
    lines = json.loads((ROOT / "src" / "lines.json").read_text(encoding="utf-8"))
    OUT.mkdir(parents=True, exist_ok=True)
    durations = {}
    for item in lines:
        out = OUT / f"{item['id']}.mp3"
        if not out.exists():
            await edge_tts.Communicate(item["text"], VOICE, rate=RATE).save(str(out))
        d = subprocess.run([FFPROBE, "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(out)],
                           capture_output=True, text=True, check=True).stdout
        durations[item["id"]] = round(float(d), 2)
        print(item["id"], durations[item["id"]])
    (ROOT / "src" / "vo.json").write_text(json.dumps(durations, indent=2), encoding="utf-8")


asyncio.run(main())
