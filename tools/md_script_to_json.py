"""Parse a filled-in script template (Markdown, see 脚本模板/系列视频脚本模板.md) into the structured script JSON.
Usage: python tools/md_script_to_json.py <script.md> <out.json> <lines.json> [id_prefix]
- meta comes from the 基本信息 table, beats from the 分句脚本 table (one row = one narration line = one shot)
- 角色动作 -> pose, 场景 -> scene; a default sound effect per scene is filled in (edit the JSON to change)
- scenes[...] gets the scene title (first non-empty 画面标题, 【】 = highlighted words) and the raw 画面要素 text;
  structured on-screen fields (icons, cards, items) are added by hand afterwards."""
import json
import re
import sys
from pathlib import Path

POSE = {"吃惊": "surprised", "思考": "think", "欢呼": "check", "指点": "point", "挥手": "wave", "待机": "master", "不出镜": "none", "摊手介绍": "master"}
SFX = {"hook": "pop", "valid": "pop", "analogy": "page", "chain": "pop", "impact": "pop", "timeline": "ping", "check": "tick", "outro": "pop"}


def rows(md: str, header_hint: str):
    lines = md.splitlines()
    start = next(i for i, l in enumerate(lines) if l.strip().startswith("|") and header_hint in l)
    out = []
    for l in lines[start + 2:]:
        if not l.strip().startswith("|"):
            break
        out.append([c.strip() for c in l.strip().strip("|").split("|")])
    return out


def title_parts(t: str):
    return [{"t": m.group(1) or m.group(2), "hl": bool(m.group(1))} for m in re.finditer(r"【([^】]+)】|([^【】]+)", t) if (m.group(1) or m.group(2)).strip()]


md = Path(sys.argv[1]).read_text(encoding="utf-8")
prefix = sys.argv[4] if len(sys.argv) > 4 else "r"
meta = {r[0]: r[1] for r in rows(md, "字段")}
beats, scenes, pose_now = [], {}, {}
for i, r in enumerate(rows(md, "旁白"), 1):
    scene, text, title, elements, pose_cn, note = (r + [""] * 6)[:6]
    text = re.sub(r"`?\[核实\]`?", "", text).strip()
    pose = POSE.get(pose_cn, pose_now.get(scene, "master"))
    pose_now[scene] = pose
    beats.append({"id": f"{prefix}{i}", "scene": scene, "text": text, "pose": pose, "sfx": SFX.get(scene, "pop"), "note": note})
    sc = scenes.setdefault(scene, {"title": [], "elements": []})
    if title and not sc["title"]:
        sc["title"] = title_parts(title)
    if elements:
        sc["elements"].append(elements)
for s in {b["scene"] for b in beats}:
    first = next(b for b in beats if b["scene"] == s)
    first["sfx"] = "whoosh" if s not in ("hook",) else "ping"
out = {"meta": meta, "beats": beats, "scenes": scenes}
Path(sys.argv[2]).write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
Path(sys.argv[3]).write_text(json.dumps([{"id": b["id"], "text": b["text"]} for b in beats], ensure_ascii=False, indent=1), encoding="utf-8")
print(len(beats), "beats;", {s: sum(1 for b in beats if b["scene"] == s) for s in scenes})
