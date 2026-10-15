"""Key the magenta background off the shield sprites and align each pose's variants (talk/blink) to its base,
so swapping images while talking/blinking never makes the character jump.
raw/<pose>[_talk|_blink].png -> remotion/public/shield/<same>.png (same canvas per pose) + shield/sprites.json (sizes)."""
import json
from pathlib import Path

import numpy as np
from PIL import Image

import sys
DIR = Path(__file__).resolve().parent.parent / "remotion" / "public" / (sys.argv[1] if len(sys.argv) > 1 else "shield")
POSES = ["idle", "point", "present", "wave", "cheer", "think", "surprised"]


def key(path: Path) -> Image.Image:
    im = np.asarray(Image.open(path).convert("RGB")).astype(np.float32)
    mag = np.minimum(im[..., 0], im[..., 2]) - im[..., 1]          # magenta-ness
    alpha = np.clip(1.0 - (mag - 60.0) / 110.0, 0.0, 1.0)
    out = im.copy()
    spill = np.clip(mag, 0, None) * (alpha > 0) * 0.5               # remove pink fringe
    out[..., 0] -= spill
    out[..., 2] -= spill
    return Image.fromarray(np.dstack([np.clip(out, 0, 255), alpha * 255]).astype(np.uint8), "RGBA")


def bbox(img: Image.Image):
    return img.getchannel("A").point(lambda v: 255 if v > 40 else 0).getbbox()


meta = {}
for pose in POSES:
    base = key(DIR / "raw" / f"{pose}.png")
    bx0, by0, bx1, by1 = bbox(base)
    pad = 24
    box = (max(0, bx0 - pad), max(0, by0 - pad), min(base.width, bx1 + pad), min(base.height, by1 + pad))
    base.crop(box).save(DIR / f"{pose}.png")
    for var in ("talk", "blink"):
        src = DIR / "raw" / f"{pose}_{var}.png"
        if not src.exists():
            continue
        v = key(src)
        vx0, vy0, vx1, vy1 = bbox(v)
        # scale + shift the variant so its silhouette box matches the base's
        sx, sy = (bx1 - bx0) / (vx1 - vx0), (by1 - by0) / (vy1 - vy0)
        s = (sx + sy) / 2
        scaled = v.resize((round(v.width * s), round(v.height * s)), Image.LANCZOS)
        canvas = Image.new("RGBA", base.size, (0, 0, 0, 0))
        canvas.paste(scaled, (round(bx0 - vx0 * s), round(by0 - vy0 * s)), scaled)
        canvas.crop(box).save(DIR / f"{pose}_{var}.png")
        print(f"{pose}_{var}: scale {s:.3f}, shift ({bx0 - vx0 * s:.0f}, {by0 - vy0 * s:.0f})")
    meta[pose] = {"w": box[2] - box[0], "h": box[3] - box[1],
                  "talk": (DIR / "raw" / f"{pose}_talk.png").exists(), "blink": (DIR / "raw" / f"{pose}_blink.png").exists()}
(DIR / "sprites.json").write_text(json.dumps(meta, indent=1), encoding="utf-8")
print(json.dumps(meta))
