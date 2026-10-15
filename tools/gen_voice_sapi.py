"""Placeholder voice-over with the offline Windows voice (Microsoft Huihui) when online TTS is unavailable.
Same output contract as gen_voice.mjs: remotion/public/vo/<id>.mp3 + remotion/src/vo.json.
Replace later by deleting public/vo and running gen_voice.mjs (MOSS)."""
import json
import os
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "remotion"
OUT = ROOT / "public" / "vo"
FFBIN = Path(os.environ.get("FFBIN", r"C:\Users\JOHO\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0-full_build\bin"))
RATE = os.environ.get("SAPI_RATE", "1")  # -10..10

PS = r"""
Add-Type -AssemblyName System.Speech
$s = New-Object System.Speech.Synthesis.SpeechSynthesizer
$s.SelectVoice('Microsoft Huihui Desktop')
$s.Rate = {rate}
$s.SetOutputToWaveFile('{wav}')
$s.Speak([IO.File]::ReadAllText('{txt}', [Text.Encoding]::UTF8))
$s.Dispose()
"""


def main():
    lines = json.loads((ROOT / "src" / "lines.json").read_text(encoding="utf-8"))
    OUT.mkdir(parents=True, exist_ok=True)
    durations = {}
    with tempfile.TemporaryDirectory() as tmp:
        for item in lines:
            out = OUT / f"{item['id']}.mp3"
            if not out.exists():
                txt, wav = Path(tmp, "t.txt"), Path(tmp, "o.wav")
                txt.write_text(item["text"], encoding="utf-8")
                subprocess.run(["powershell", "-NoProfile", "-Command", PS.format(rate=RATE, wav=wav, txt=txt)], check=True)
                subprocess.run([str(FFBIN / "ffmpeg.exe"), "-y", "-v", "error", "-i", str(wav),
                                "-af", "silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse",
                                "-ar", "44100", "-b:a", "160k", str(out)], check=True)
            d = subprocess.run([str(FFBIN / "ffprobe.exe"), "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(out)],
                               capture_output=True, text=True, check=True).stdout
            durations[item["id"]] = round(float(d), 2)
            print(item["id"], durations[item["id"]])
    (ROOT / "src" / "vo.json").write_text(json.dumps(durations, indent=2), encoding="utf-8")


main()
