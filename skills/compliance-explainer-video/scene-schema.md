# Script JSON schema (`remotion/src/scripts/<id>.json`, rendered by `Video5.tsx`)

Working example: `remotion/src/scripts/rzt_intro.json` (认证通简介). Copy it and replace the content.

```jsonc
{
  "meta": {"brand": "认证通", "watermark": "@认证通", "source": "信息来源：……", "mascot": "shield", "theme": "paper"},
  "beats": [  // one narration line = one shot; ids become mp3 names
    {"id": "r1", "scene": "hook", "text": "旁白一句", "pose": "surprised", "sfx": "ping"}
  ],
  "scenes": { "hook": {…}, "valid": {…}, … }   // fields below
}
```

- `pose`: `master` (待机) · `point` · `surprised` · `think` · `check` (欢呼) · `wave` · `none` (hide guide in that beat)
- `sfx`: `boom` (use sparingly) · `stamp` · `whoosh` · `tick` · `ping` · `pop` · `page`
- `title` (every scene): `[{"t": "出海合规"}, {"t": "有多难", "hl": true}]` — ≤ 8 字 total; `hl` = green (red in impact)
- Icon names: `doc box car sign nav shield refresh coin globe chip factory person clipboard lab` — new icons go in `ICONS` in `Video5.tsx` (flat, thick `{...S}` outline, spread `S` before `fill`)

| Scene | Fields | Beats used |
|---|---|---|
| hook | `badges` (≤ 6 short texts, 3 per row), `chip`, `bubble` (shows on beat 2) | 2 |
| valid | `icon`, `stamp` (big rotated stamp text), `tag` (≤ 12 字, beat 2), `bubble` | 2 |
| analogy | `rows: [{l: {icon, label}, r: {icon, label}}]` — row i appears on beat i | 3 |
| chain | `cards: [{icon, text}]` — card i on beat i, each gets a red ✕ | 3 |
| impact | `from {icon,label}` (with ⊘), `mid {icon,label}`, `result` (red chip) | 2 |
| timeline | `nodes: [{d, t?, now?}]` (3 nodes; `now` pulses orange), `chip` (beat 2) | 2 |
| check | `header`, `items` (5, ≤ 10 字; item i ticks on beat i+1), `titleSize` (default 112, use 104 for long titles) | 1 + N + 1 |
| outro | `sticker` (brand), `bubble` (slogan, beat 2), `bye` | 2 |

Scenes are matched by the `scene` of each beat in order; a scene may be skipped entirely (keep hook / valid / check / outro).
