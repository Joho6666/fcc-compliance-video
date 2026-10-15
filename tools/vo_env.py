"""Per-frame loudness envelope (30 fps, 0..1) for every narration clip -> drives the mascot's mouth.
Usage: python tools/vo_env.py <vo-dir under remotion/public> <durations json under remotion/src> <out json under remotion/src>"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent / "remotion"
FF = r"C:\Users\JOHO\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0-full_build\bin\ffmpeg.exe"
SR, FPS = 16000, 30
vo_dir, dur_json, out_json = sys.argv[1:4]
env = {}
for clip in json.loads((ROOT / "src" / dur_json).read_text(encoding="utf-8")):
    pcm = subprocess.run([FF, "-v", "error", "-i", str(ROOT / "public" / vo_dir / f"{clip}.mp3"), "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"],
                         capture_output=True, check=True).stdout
    x = np.frombuffer(pcm, dtype=np.int16).astype(np.float32) / 32768
    hop = SR // FPS
    rms = np.array([np.sqrt(np.mean(x[i:i + hop] ** 2)) for i in range(0, len(x) - hop + 1, hop)])
    ref = np.percentile(rms, 95) or 1.0
    v = np.clip((rms / ref - 0.12) / 0.88, 0, 1)
    env[clip] = [round(float(a), 2) for a in v]
(ROOT / "src" / out_json).write_text(json.dumps(env), encoding="utf-8")
print(len(env), "clips; frames:", sum(len(v) for v in env.values()))
