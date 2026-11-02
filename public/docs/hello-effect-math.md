# hello scribbles / timing

files: `index.html` (paths), `public/css/loading.css` (dash), `public/js/loading.js` (clock)

## stroke reveal

SVG paths are already traced. mostly cubic Béziers, not font glyphs.

```text
B(u) = (1-u)^3 P0 + 3(1-u)^2 u P1 + 3(1-u)u^2 P2 + u^3 P3
0 <= u <= 1
B'(u) = 3(1-u)^2(P1-P0) + 6(1-u)u(P2-P1) + 3u^2(P3-P2)
L = integral_0^1 ||B'(u)|| du   // actual curved length; usually numeric
```

Path may have several C segments. Browser handles the length. We don't sample it.

`pathLength="1"` -> normalized dash coordinates:

```text
dasharray  = 1
dashoffset = 1  // hidden
dashoffset = 0  // fully drawn

visible_fraction ~= 1 - dashoffset
visible_length   ~= L * (1 - dashoffset)
```

Only approximate: path start/end caps and self-overlap can alter actual painted pixels.

## time per path

```text
i = path index
d_i = CSS --delay   (ms)
q_i = CSS --duration (ms)
t = elapsed since SVG got .is-writing

u_i(t) = clamp((t - d_i) / q_i, 0, 1)
offset_i(t) = 1 - easeInOut(u_i(t))  // CSS animation-timing-function
```

Easing is applied **per stroke**. CSS currently uses `ease-in-out`, not linear; clock is linear, handwriting speed isn't.

```text
T_word = max_i(d_i + q_i)
T_en = max(0+800, 700+2800) = 3500 ms
T_vi = max(0+300, 400+700, 1000+500, 1500+300,
           1800+900, 2600+1100, 3600+1000, 4600+800,
           5400+1500, 7000+800) = 7800 ms
```

`max` matters. Delays overlap. Don't sum durations.

EN: 2 paths, second starts at 700ms (100ms before first finishes).
VI: 10 paths; last accent starts 7000ms, ends 7800ms.

## progress / finish

```text
r(t) = clamp(t / T_word, 0, 1)
p(t) = round(15 + 80*r(t))     // during writing: 15% -> 95%
p_next = max(p_previous, p(t)) // never move progress backwards
on last path animationend: p = 95
assets ready: p = 100
```

`getComputedStyle(path)` -> parse `--delay` and `--duration` -> `T_word`. So language timing comes from the *selected* SVG, not a global 3500/7800 constant.

```text
language = ?lang=en|vi
        ?? saved preference (x86-language / language / lang)
        ?? navigator.language
        ?? html lang
        ?? en
```

One word only. `selected = vi ? vietnamese : english`; `toggleAttribute("hidden", greeting !== selected)`. Important: SVG `.hidden = false` wasn't reliable here; Chromium CI caught the English SVG remaining hidden.

`animationend` on last path = normal completion. Fallback `T_word + 500ms` if event missing. Whole-loader watchdog = 20000ms. End: 500ms for `meet x86.`, 500ms fade out. Reduced motion bypasses writing.

## gotchas

- `pathLength=1` is dash-distance normalization, **not** 1px stroke length.
- Status should come from selected language, not animation sequence.
- `T_en != T_vi`; don't scale Vietnamese paths to 3.5s.
- `ease-in-out` on each path means `p(t)` is time progress, **not** percent of total ink drawn.
- CSS `[hidden] { display:none }` + JS `toggleAttribute` needed for SVG.
- CI: `tests/loader.spec.mjs` checks actual visible writing, not just status text.
