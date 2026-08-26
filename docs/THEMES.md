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
│   └── theme.js      # optional effects (e.g. chromatic pulse) + catalog entry
├── sesh-glass/
│   ├── theme.json
│   ├── theme.css
│   └── theme.js
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
| `name` | Label for settings dropdowns |
| `description` | What it looks like |
| `preferredDisplay` | Default Display face when fonts are unset / reset ([`TYPOGRAPHY.md`](TYPOGRAPHY.md)) |
| `preferredRegular` | Default Regular face when fonts are unset / reset |

---

## Host contract

1. Link the theme CSS and JS from the app HTML (path relative to the app folder).
2. Set `document.documentElement.dataset.theme` to the theme `id`.
3. Put `class="theme-panel"` on the glass surface (the banner box, not the page).
4. Settings dropdowns read `window.SeshThemes.catalog` (each `theme.js` registers itself).
5. Effects: `window.SeshThemes.effects[id].start(el)` / `.stop(el)` — pass the panel or an ancestor. Glass themes write `--theme-text-shadow` so child text pulses.
6. When font URL params are missing, or fonts are reset / theme is changed, apply
   `preferredDisplay` / `preferredRegular` to the overlay field roles (see
   [`TYPOGRAPHY.md`](TYPOGRAPHY.md)).

Persist the choice as URL param `theme` (see [`Control_UI.md`](Control_UI.md) live-update contract).

Page background stays **transparent**.

---

## LCD Glass

Frosted navy-cyan glass, ice-blue text, and a magenta/cyan chromatic pulse.

Preferred fonts — Display: `Better VCR`; Regular: `Better VCR`.

## Sesh Glass

Frosted red-to-lime glass (`#F20D0D` → `#E5F20D`), warm readout text, a red
(`#F20D0D`) glow pulse, and a halftone dot screen over the panel.

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
   absent and when the theme select changes.

---

## Related

- [Control_UI.md](Control_UI.md)
- [TYPOGRAPHY.md](TYPOGRAPHY.md) — catalog indices and preferred-font roles
- [`seshbanner/`](../seshbanner/) — banner theme consumer
- [`trbanner/`](../trbanner/) — Trick Request Banner consumer
