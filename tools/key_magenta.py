"""Turn magenta-background mascot renders into transparent PNGs (soft edge + despill).
raw/<name>.png -> remotion/public/char/<name>.png (cropped to content, 700px wide)."""
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent / "remotion" / "public" / "char"
for src in sorted((ROOT / "raw").glob("*.png")):
    im = np.asarray(Image.open(src).convert("RGB")).astype(np.float32)
    # "magentaness": both R and B high, G low
    mag = np.minimum(im[..., 0], im[..., 2]) - im[..., 1]
    alpha = np.clip(1.0 - (mag - 60.0) / 110.0, 0.0, 1.0)           # <60 solid, >170 transparent
    out = im.copy()
    spill = np.clip(mag, 0, None) * (alpha > 0) * 0.5              # remove pink fringe on the edge
    out[..., 0] -= spill; out[..., 2] -= spill
    rgba = np.dstack([np.clip(out, 0, 255), alpha * 255]).astype(np.uint8)
    img = Image.fromarray(rgba, "RGBA")
    box = img.getchannel("A").point(lambda v: 255 if v > 20 else 0).getbbox()
    img = img.crop(box)
    img = img.resize((700, round(img.height * 700 / img.width)), Image.LANCZOS)
    img.save(ROOT / src.name)
    print(src.stem, img.size)
