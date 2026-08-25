# Overlay themes

Shared visual themes for helper apps (OBS Browser Sources). A theme is the **look** of the overlay surface — glass, glow, pulse — not layout, fonts, or the settings menu.

Control UI chrome stays as specified in [`Control_UI.md`](Control_UI.md). Themes style the effect / banner only.

---

## Layout

```text
themes/
└── lcd-glass/
    ├── theme.json    # id, name, description of the look
    ├── theme.css     # tokens + .theme-panel surface
    └── theme.js      # optional effects (e.g. chromatic pulse) + catalog entry
```

Each theme folder has a `theme.json` next to its CSS/JS:

| Field | Meaning |
|-------|---------|
| `id` | Stable slug — URL param value, `data-theme` attribute |
| `name` | Label for settings dropdowns |
| `description` | What it looks like |

---

## Host contract

1. Link the theme CSS and JS from the app HTML (path relative to the app folder).
2. Set `document.documentElement.dataset.theme` to the theme `id`.
3. Put `class="theme-panel"` on the glass surface (the banner box, not the page).
4. Settings dropdowns read `window.SeshThemes.catalog` (each theme.js registers itself).
5. Effects: `window.SeshThemes.effects[id].start(el)` / `.stop(el)` — pass the panel or an ancestor. LCD Glass writes `--theme-text-shadow` so child text pulses.

Persist the choice as URL param `theme` (see [`Control_UI.md`](Control_UI.md) live-update contract).

Page background stays **transparent**.

---

## LCD Glass

Frosted navy-cyan glass, ice-blue text, magenta/cyan chromatic pulse. Extracted from `tmp/trglass.html`.

---

## Adding a theme

1. Create `themes/<id>/` with `theme.json`, `theme.css`, and `theme.js` if it has motion.
2. Scope CSS to `[data-theme="<id>"]`. Do not style `#settings-menu`.
3. Register in `theme.js` (`SeshThemes.catalog` + `SeshThemes.effects` if needed).
4. Link the new CSS/JS from each app that should offer it.

---

## Related

- [Control_UI.md](Control_UI.md)
- [`seshbanner/`](../seshbanner/) — first consumer
- [`trbanner/`](../trbanner/) — Trick Request Banner consumer
- [`tmp/trglass.html`](../tmp/trglass.html) — LCD Glass source
