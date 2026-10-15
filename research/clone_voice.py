"""CosyVoice voice clone of the authorized speaker (DashScope / Model Studio, Beijing).
Usage:
  python clone_voice.py create <sample.wav> [prefix]     -> research/voice/voice.json (voice_id; creating a voice is free)
  python clone_voice.py say "<text>" <out.mp3>           -> synthesize with the cloned voice
Needs DASHSCOPE_API_KEY in the environment.
"""
import json
import os
import sys
import time
from pathlib import Path

import dashscope
import requests
from dashscope.audio.tts_v2 import SpeechSynthesizer

KEY = os.environ["DASHSCOPE_API_KEY"]
dashscope.api_key = KEY
BASE = "https://dashscope.aliyuncs.com"
H = {"Authorization": f"Bearer {KEY}"}
MODEL = os.getenv("TTS_MODEL", "cosyvoice-v3-flash")  # clone and synthesis must use the same model
STATE = Path(__file__).resolve().parent / "voice" / "voice.json"


def upload(path: Path, model: str) -> str:
    p = requests.get(f"{BASE}/api/v1/uploads", params={"action": "getPolicy", "model": model}, headers=H, timeout=30).json()
    d = p.get("data") or {}
    if not d:
        raise RuntimeError(f"getPolicy failed: {str(p)[:200]}")
    key = f"{d['upload_dir']}/{path.name}"
    form = {"OSSAccessKeyId": d["oss_access_key_id"], "Signature": d["signature"], "policy": d["policy"],
            "x-oss-object-acl": d["x_oss_object_acl"], "x-oss-forbid-overwrite": d["x_oss_forbid_overwrite"],
            "key": key, "success_action_status": "200"}
    with open(path, "rb") as fh:
        r = requests.post(d["upload_host"], data=form, files={"file": (path.name, fh)}, timeout=120)
    r.raise_for_status()
    return f"oss://{key}"


def enroll(payload: dict) -> dict:
    r = requests.post(f"{BASE}/api/v1/services/audio/tts/customization",
                      headers={**H, "Content-Type": "application/json", "X-DashScope-OssResourceResolve": "enable"},
                      json={"model": "voice-enrollment", "input": payload}, timeout=120)
    return r.json()


def create(sample: Path, prefix: str):
    url = upload(sample, "voice-enrollment")
    res = enroll({"action": "create_voice", "target_model": MODEL, "prefix": prefix, "url": url})
    vid = (res.get("output") or {}).get("voice_id")
    if not vid:
        raise SystemExit(f"create_voice failed: {json.dumps(res, ensure_ascii=False)[:300]}")
    print("voice_id", vid)
    for _ in range(40):
        q = enroll({"action": "query_voice", "voice_id": vid})
        st = (q.get("output") or {}).get("status")
        print("status", st)
        if st == "OK":
            break
        if st in ("UNDEPLOYED", "FAILED"):
            raise SystemExit(f"voice not usable: {json.dumps(q, ensure_ascii=False)[:300]}")
        time.sleep(5)
    STATE.write_text(json.dumps({"voice_id": vid, "model": MODEL, "sample": str(sample)}, ensure_ascii=False, indent=1), encoding="utf-8")


def say(text: str, out: Path):
    vid = json.loads(STATE.read_text(encoding="utf-8"))["voice_id"]
    audio = SpeechSynthesizer(model=MODEL, voice=vid).call(text)
    if not audio:
        raise SystemExit("synthesis returned no audio")
    out.write_bytes(audio)
    print("saved", out, len(audio), "bytes")


FF = Path(r"C:\Users\JOHO\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0-full_build\bin")


def batch(lines_json: Path, out_dir: Path, durations_json: Path):
    """Synthesize every line with the cloned voice, trim leading/trailing silence, write {id: seconds}."""
    import subprocess
    vid = json.loads(STATE.read_text(encoding="utf-8"))["voice_id"]
    out_dir.mkdir(parents=True, exist_ok=True)
    durations = {}
    for item in json.loads(lines_json.read_text(encoding="utf-8")):
        out = out_dir / f"{item['id']}.mp3"
        if not out.exists():
            raw = out.with_suffix(".raw.mp3")
            audio = SpeechSynthesizer(model=MODEL, voice=vid).call(item["text"])
            if not audio:
                raise SystemExit(f"no audio for {item['id']}")
            raw.write_bytes(audio)
            subprocess.run([str(FF / "ffmpeg.exe"), "-y", "-v", "error", "-i", str(raw), "-af",
                            "silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse",
                            "-ar", "44100", "-b:a", "192k", str(out)], check=True)
            raw.unlink()
        d = subprocess.run([str(FF / "ffprobe.exe"), "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(out)],
                           capture_output=True, text=True, check=True).stdout
        durations[item["id"]] = round(float(d), 2)
        print(item["id"], durations[item["id"]])
    durations_json.write_text(json.dumps(durations, indent=2), encoding="utf-8")


if __name__ == "__main__":
    cmd = sys.argv[1]
    if cmd == "create":
        create(Path(sys.argv[2]), sys.argv[3] if len(sys.argv) > 3 else "xiaotan")
    elif cmd == "say":
        say(sys.argv[2], Path(sys.argv[3]))
    elif cmd == "batch":
        batch(Path(sys.argv[2]), Path(sys.argv[3]), Path(sys.argv[4]))
