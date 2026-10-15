"""Generate style-variant sample cards (HTML) and screenshot them to PNG with headless Edge."""
import subprocess
from pathlib import Path

ROOT = Path(__file__).parent
OUT_HTML = ROOT / "samples" / "html"
OUT_PNG = ROOT / "samples"
EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

STYLES = {
    "A_严肃合规": dict(
        bg="#FFFFFF", fg="#0B2545", muted="#5B6B82", accent="#F26B1D", line="#D5DCE6",
        panel="#F3F6FA", font="'Microsoft YaHei'", title_font="'Microsoft YaHei'",
        title_weight=800, deco="bar"),
    "B_新闻解读": dict(
        bg="#111114", fg="#FFFFFF", muted="#9A9AA3", accent="#FFD400", line="#2E2E35",
        panel="#1C1C21", font="'Microsoft YaHei'", title_font="'Microsoft YaHei'",
        title_weight=900, deco="highlight"),
    "C_杂志编辑": dict(
        bg="#F4EFE6", fg="#1A1A1A", muted="#6E655A", accent="#C8102E", line="#CFC6B8",
        panel="#EAE3D6", font="'Microsoft YaHei'", title_font="'SimSun'",
        title_weight=700, deco="rule"),
    "D_科技蓝图": dict(
        bg="#0A1F44", fg="#E8F1FF", muted="#7FA3D6", accent="#3DE0FF", line="#1F3D70",
        panel="#0F2A57", font="'Microsoft YaHei'", title_font="'Microsoft YaHei'",
        title_weight=800, deco="grid"),
}

BASE_CSS = """
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:%(w)dpx;height:%(h)dpx;overflow:hidden}
body{background:%(bg)s;color:%(fg)s;font-family:%(font)s,sans-serif;position:relative}
.grid{position:absolute;inset:0;background-image:linear-gradient(%(line)s 1px,transparent 1px),linear-gradient(90deg,%(line)s 1px,transparent 1px);background-size:40px 40px;opacity:.55}
.t{font-family:%(title_font)s,serif;font-weight:%(title_weight)s;letter-spacing:.01em}
.kicker{display:inline-block;font-size:22px;font-weight:700;letter-spacing:.12em;color:%(accent)s}
.muted{color:%(muted)s}
.acc{color:%(accent)s}
.hl{background:%(accent)s;color:#111;padding:0 .12em}
.brand{font-size:20px;font-weight:700;letter-spacing:.1em;color:%(muted)s}
.src{font-size:17px;color:%(muted)s}
"""


def deco(s):
    if s["deco"] == "grid":
        return '<div class="grid"></div>'
    if s["deco"] == "bar":
        return f'<div style="position:absolute;left:0;top:0;bottom:0;width:14px;background:{s["accent"]}"></div>'
    return ""


def title_html(s, text, key):
    # key = phrase to emphasise
    if s["deco"] == "highlight":
        return text.replace(key, f'<span class="hl">{key}</span>')
    return text.replace(key, f'<span class="acc">{key}</span>')


def cover(s):
    w, h = 1800, 766  # 900x383 @2x
    rule = f'<div style="width:120px;height:6px;background:{s["accent"]};margin:0 auto 34px"></div>' if s["deco"] == "rule" else ""
    body = f"""
{deco(s)}
<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center">
  {rule}
  <div class="kicker" style="font-size:34px;margin-bottom:26px">FCC 新规解读</div>
  <div class="t" style="font-size:116px;line-height:1.15">{title_html(s, "你的 FCC 报告<br>还能用吗？", "还能用吗？")}</div>
  <div class="muted" style="font-size:36px;margin-top:30px">实验室认可规则拟收紧 · 企业现在该确认什么</div>
</div>
<div class="brand" style="position:absolute;right:60px;bottom:40px;font-size:30px">合规认证通</div>
<div style="position:absolute;left:{(w-766)//2}px;top:0;width:766px;height:{h}px;outline:2px dashed rgba(255,0,0,0)"></div>
"""
    return w, h, body


def timeline(s):
    w, h = 1080, 760
    nodes = [
        ("2026.04.30", "FCC 发布实验室认可<br>规则制定提案", False),
        ("2026.10.07", "路透社披露<br>表决计划", False),
        ("2026.10.29", "FCC 拟表决<br>新规则", True),
        ("2028.12", "预计开始<br>实施", False),
    ]
    xs = [190, 420, 650, 880]
    y = 400
    items = ""
    for (d, txt, now), x in zip(nodes, xs):
        dot = s["accent"] if now else s["bg"]
        items += f"""
<div style="position:absolute;left:{x-14}px;top:{y-14}px;width:28px;height:28px;border-radius:50%;background:{dot};border:5px solid {s['accent'] if now else s['fg']}"></div>
<div style="position:absolute;left:{x-120}px;width:240px;top:{y-110}px;text-align:center;font-size:30px;font-weight:800" class="{'acc' if now else ''}">{d}</div>
<div style="position:absolute;left:{x-120}px;width:240px;top:{y+44}px;text-align:center;font-size:24px;line-height:1.45" class="{'' if now else 'muted'}">{txt}</div>"""
    tag = f"""<div style="position:absolute;left:{650-110}px;top:{y+150}px;width:220px;text-align:center;font-size:20px;font-weight:700;padding:8px 0;border-radius:6px;background:{s['accent']};color:#111">▲ 现在：待表决</div>"""
    body = f"""
{deco(s)}
<div style="position:absolute;left:70px;top:60px;right:70px">
  <div class="kicker">TIMELINE</div>
  <div class="t" style="font-size:56px;margin-top:10px">{title_html(s, "新规走到哪一步了？", "哪一步")}</div>
  <div class="muted" style="font-size:24px;margin-top:12px">仍是拟议规则，现有 FCC 证书不会因此立即失效</div>
</div>
<div style="position:absolute;left:190px;right:200px;top:{y-2}px;height:4px;background:{s['fg']};opacity:.85"></div>
<div style="position:absolute;left:650px;right:200px;top:{y-2}px;height:4px;background:repeating-linear-gradient(90deg,{s['muted']} 0 12px,transparent 12px 22px)"></div>
{items}{tag}
<div class="src" style="position:absolute;left:70px;bottom:36px">来源：Reuters、FCC 公开文件 · 以 FCC 正式规则为准</div>
<div class="brand" style="position:absolute;right:70px;bottom:34px">合规认证通</div>
"""
    return w, h, body


def checklist(s):
    w, h = 1080, 1200
    rows = [
        ("FCC 测试报告对应哪家实验室？", "了解实际测试方"),
        ("实验室具体在哪个国家 / 地区？", "判断未来是否受影响"),
        ("FCC 证书由谁申请、谁持有？", "明确责任主体"),
        ("无线模块是否单独认证？整机要补测吗？", "了解认证路径"),
        ("规则变化后有没有替代测试方案？", "提前评估时间和成本"),
    ]
    rh = 150
    trs = ""
    for i, (q, goal) in enumerate(rows):
        top = 330 + i * rh
        trs += f"""
<div style="position:absolute;left:70px;right:70px;top:{top}px;height:{rh-16}px;background:{s['panel']};border-radius:{4 if s['deco'] in ('rule','bar') else 14}px;display:flex;align-items:center;padding:0 36px">
  <div style="width:56px;height:56px;flex:none;border-radius:50%;border:4px solid {s['accent']};display:flex;align-items:center;justify-content:center;font-size:30px;font-weight:900" class="acc">{i+1}</div>
  <div style="margin-left:28px;flex:1">
    <div style="font-size:31px;font-weight:700">{q}</div>
    <div class="muted" style="font-size:22px;margin-top:8px">→ {goal}</div>
  </div>
  <div style="width:40px;height:40px;flex:none;border:3px solid {s['muted']};border-radius:6px"></div>
</div>"""
    body = f"""
{deco(s)}
<div style="position:absolute;left:70px;top:70px;right:70px">
  <div class="kicker">CHECKLIST · 建议截图保存</div>
  <div class="t" style="font-size:58px;margin-top:12px;line-height:1.25">{title_html(s, "发给 ODM / 模块供应商的<br>5 个确认问题", "5 个确认问题")}</div>
</div>
{trs}
<div class="src" style="position:absolute;left:70px;bottom:46px">不必急着换实验室 · 先摸清现状，等正式规则出台再决定</div>
<div class="brand" style="position:absolute;right:70px;bottom:44px">合规认证通</div>
"""
    return w, h, body


CARDS = {"1_封面": cover, "2_时间线": timeline, "3_自查清单": checklist}


def main():
    OUT_HTML.mkdir(parents=True, exist_ok=True)
    pngs = []
    for sname, s in STYLES.items():
        for cname, fn in CARDS.items():
            w, h, body = fn(s)
            css = BASE_CSS % dict(s, w=w, h=h)
            html = f'<!doctype html><html><head><meta charset="utf-8"><style>{css}</style></head><body>{body}</body></html>'
            hp = OUT_HTML / f"{sname}_{cname}.html"
            hp.write_text(html, encoding="utf-8")
            pp = OUT_PNG / f"{sname}_{cname}.png"
            subprocess.run([EDGE, "--headless=new", "--disable-gpu", "--hide-scrollbars",
                            "--force-device-scale-factor=1", f"--window-size={w},{h}",
                            f"--screenshot={pp}", hp.as_uri()], check=True,
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=60)
            pngs.append(pp)
            print(pp.name)

    # contact sheet for side-by-side comparison
    cells = "".join(
        f'<section><h2>{sname}</h2><div class="row">' +
        "".join(f'<img src="{sname}_{c}.png">' for c in CARDS) + "</div></section>"
        for sname in STYLES)
    (OUT_PNG / "对比总览.html").write_text(
        '<!doctype html><meta charset="utf-8"><title>FCC 样张对比</title><style>'
        'body{font-family:"Microsoft YaHei";background:#ddd;margin:24px}section{margin-bottom:40px}'
        '.row{display:flex;gap:16px;align-items:flex-start}img{height:340px;box-shadow:0 2px 10px #0003}'
        'img:first-child{height:auto;width:800px}</style>' + cells, encoding="utf-8")


if __name__ == "__main__":
    main()
