"""16 fps s2v clips -> 30 fps with local RIFE (rife-ncnn-vulkan v4.6), last frame held to fill the full window.
Reads mix_timingXT.json for window lengths. Output: remotion/public/dh/<id>_30.mp4 (no audio; narration comes from the base timeline).
Usage: python tools/interp_dh.py
"""
import json
import shutil
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DH = ROOT / "remotion" / "public" / "dh"
FF = Path(r"C:\Users\JOHO\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0-full_build\bin")
RIFE = Path(r"D:\research\tools\rife\rife-ncnn-vulkan.exe")
FPS = 30


def probe(p: Path) -> float:
    out = subprocess.run([str(FF / "ffprobe.exe"), "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)],
                         capture_output=True, text=True, check=True).stdout
    return float(out)


timing = json.loads((ROOT / "mix_timingXT.json").read_text(encoding="utf-8"))
for w in timing["dh"]:
    src = DH / f"xt_{w['id']}.mp4"
    dst = DH / f"xt_{w['id']}_30.mp4"
    clip_s = probe(src)
    with tempfile.TemporaryDirectory() as tmp:
        fin, fout = Path(tmp, "in"), Path(tmp, "out")
        fin.mkdir(); fout.mkdir()
        subprocess.run([str(FF / "ffmpeg.exe"), "-v", "error", "-i", str(src), str(fin / "%06d.png")], check=True)
        target = round(clip_s * FPS)
        subprocess.run([str(RIFE), "-i", str(fin), "-o", str(fout), "-n", str(target), "-m", str(RIFE.parent / "rife-v4.6")],
                       check=True, cwd=str(RIFE.parent), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        pad = max(0.0, w["seconds"] - target / FPS)
        subprocess.run([str(FF / "ffmpeg.exe"), "-y", "-v", "error", "-framerate", str(FPS), "-i", str(fout / "%08d.png"),
                        "-vf", f"tpad=stop_mode=clone:stop_duration={pad:.3f}", "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p",
                        "-r", str(FPS), str(dst)], check=True)
    print(w["id"], f"{clip_s:.2f}s@16 -> {probe(dst):.2f}s@30 (window {w['seconds']}s)")
