# Overlay themes

Shared visual themes for helper apps (OBS Browser Sources). A theme is the **look**
of the overlay surface — glass, glow, pulse — plus optional **preferred fonts**.
It is not layout and not the settings menu chrome.

Control UI chrome stays as specified in [`Control_UI.md`](Control_UI.md). Themes
style the effect / banner only; settings panel typeface remains Better VCR.

---

## Layout

```text
themes/
├── lcd-glass/
│   ├── theme.json    # id, name, description, preferred fonts
│   ├── theme.css     # tokens + .theme-panel surface
│   └── theme.js      # chromatic pulse + PixiJS pane (needs vendor/pixi)
├── sesh-glass/
│   ├── theme.json
│   ├── theme.css
│   └── theme.js          # red pulse + PixiJS fire (needs vendor/pixi)
├── sesh-glass-old/
│   ├── theme.json
│   ├── theme.css
│   └── theme.js          # original static halftone + red pulse
└── 3026-d3c0/
    ├── theme.json
    ├── theme.css
    └── theme.js
```

Each theme folder has a `theme.json` next to its CSS/JS. The JSON is descriptive
metadata for meat bags and tooling; current apps load the catalog entry registered by
`theme.js`, so keep both descriptions (and preferred fonts) synchronized.

| Field | Meaning |
|-------|---------|
| `id` | Stable slug — URL param value, `data-theme` attribute |
| `name` | Label for settings menu pickers |
| `description` | What it looks like |
| `preferredDisplay` | Default Display face when fonts are unset / reset ([`TYPOGRAPHY.md`](TYPOGRAPHY.md)) |
| `preferredRegular` | Default Regular face when fonts are unset / reset |

---

## Host contract

1. Link the theme CSS and JS from the app HTML (path relative to the app folder).
2. Set `document.documentElement.dataset.theme` to the theme `id`.
3. Put `class="theme-panel"` on the glass surface (the banner box, not the page).
4. Settings menu pickers read `window.SeshThemes.catalog` (each `theme.js` registers itself).
5. Effects: `window.SeshThemes.effects[id].start(el)` / `.stop(el)` — pass the `.theme-panel` node. Pixi canvases attach to that element; an ancestor leaves fire/caustics behind the glass. Glass themes write `--theme-text-shadow` so child text pulses.
6. When font URL params are missing, or fonts are reset / theme is changed, apply
   `preferredDisplay` / `preferredRegular` to the overlay field roles (see
   [`TYPOGRAPHY.md`](TYPOGRAPHY.md)).

Persist the choice as URL param `theme` (see [`Control_UI.md`](Control_UI.md) live-update contract).

Page background stays **transparent**.

---

## LCD Glass

Frosted navy-cyan glass pane, ice-blue text, and a magenta/cyan chromatic pulse.
A **PixiJS** caustic wash, specular rim, and quiet ice specks sit behind the
readout on `.theme-panel`. CSS CRT scanlines sit over that wash (under the
text), with a slow phosphor sweep, a few horizontal chroma jitters, and a
tiny staggered readout tear — no extra JS.
Hosts that offer this pane must load
[`vendor/pixi/pixi.min.js`](../vendor/pixi/pixi.min.js) before `theme.js`. CSS
gradient remains if Pixi is missing or `start()` is not a `.theme-panel`. Page
background stays transparent.

Preferred fonts — Display: `Better VCR`; Regular: `Better VCR`.

## Sesh Glass

Frosted red-to-lime glass (`#F20D0D` → `#E5F20D`), warm readout text, a red
(`#F20D0D`) glow pulse, and a **PixiJS** fire bed along the bottom of
`.theme-panel` with rising embers. Hosts that offer this theme must load
[`vendor/pixi/pixi.min.js`](../vendor/pixi/pixi.min.js) before `theme.js`. CSS
bottom-up gradient remains if Pixi is missing. Page background stays transparent.

Preferred fonts — Display: `Monster Chiller`; Regular: `Londrina Solid`.

## Sesh Glass (old)

The previous static Sesh Glass: same red-to-lime frost, halftone, and red text
pulse, without Pixi. URL id: `sesh-glass-old`.

Preferred fonts — Display: `Monster Chiller`; Regular: `Londrina Solid`.

## 3026 D3C0

Futuristic art deco on **HackTheBox Lite** colors — navy glass
(`#111927` → `#1a2332`), signature lime metal (`#9fef00`), bright readout
(`#c5f467`), amber accent (`#ffaf00`), tight radius, sunburst wash, and a
green/amber text pulse.

Preferred fonts — Display: `Lemondrop`; Regular: `Brighton Sans NBP`.

---

## Adding a theme

1. Create `themes/<id>/` with `theme.json`, `theme.css`, and `theme.js` if it has motion.
2. Scope CSS to `[data-theme="<id>"]`. Do not style `#settings-menu`.
3. Add matching `id`, `name`, `description`, `preferredDisplay`, and
   `preferredRegular` to `theme.json` and the `SeshThemes.catalog` registration in
   `theme.js`. Preferred faces must exist in the typography catalog.
4. Register motion in `SeshThemes.effects` if needed. `start()` must cancel an existing
   runner for the same element; `stop()` must cancel animation and remove inline theme
   properties so another theme starts cleanly.
5. Link the new CSS/JS from each app that should offer it.
6. Test switching themes repeatedly. One panel should have one animation runner—no
   multiplying clanker heartbeats. Confirm preferred fonts apply when font params are
   absent and when the theme picker changes.

---

## Related

- [Control_UI.md](Control_UI.md)
- [TYPOGRAPHY.md](TYPOGRAPHY.md) — catalog indices and preferred-font roles
- [`seshbanner/`](../seshbanner/) — banner theme consumer
- [`trbanner/`](../trbanner/) — Trick Request Banner consumer
