# Control UI — Framework

| Field | Value |
|-------|-------|
| **Status** | Framework pattern (extracted from Spot Smoke) |
| **Reference impl** | [`spotsmoke/`](../spotsmoke/) |
| **Audience** | Clankers re-implementing this menu on new Sesh Helpers apps |

> High-level notes only. App-specific settings (sliders, toggles, etc.) belong in each project's own docs or code — not here.

---

## What this is

A **reusable settings-menu pattern** for full-screen helper webapps — typically OBS Browser Sources with a transparent background. Operators open a panel, tweak settings, preview the effect, copy a URL, and hide the panel for clean broadcast output.

Copy this framework per project. Swap the title, sections, and controls; keep the behavior contract.

---

## Visibility contract

Two modes, stored in app state as `settingsMode`:

| Mode | Menu | Operator overlays | Broadcast output |
|------|------|-------------------|------------------|
| `ON` | Visible | Shown (crosshairs, guides, etc.) | Panel + guides visible in interact view |
| `DISABLE` | Hidden | Hidden | Effect only — clean for OBS |

**Persist as URL param:** `menu=DISABLE` hides; omit or any other value = show.

### Input map

| Input | When menu hidden | When menu visible |
|-------|------------------|-------------------|
| **Double-click** background | Show menu | App-specific *(Spot Smoke: place spot — see reference)* |
| **✕ Close** (header) | — | Hide menu |
| Load `?menu=DISABLE` | Start hidden | — |
| **Copy URL for OBS** | — | Copy full config URL with `menu=DISABLE` |

**Rule for clankers:** double-click always reaches the menu when hidden. Hide is always explicit (close button or OBS URL). Clicks inside `#settings-menu` never propagate to the background handler.

**DOM hooks:**

- `#settings-menu.open` — panel visible
- `body.settings-mode` — app is in operator/configure mode (enable overlays, preview backdrops, etc.)

---

## Shell layout

Fixed panel, one screen edge. ~300px wide, scrollable, dark glass + blur.

```text
┌──────────────────────────────┐
│ [App title]    [utils…][✕]  │  header
│ Hint text (optional)         │
│ ▼ Section A                  │  accordion (one open)
│   …controls…                 │
│ ▶ Section B                  │
│ ▶ Section C                  │
│ [ Primary action ]           │  footer actions
│ [ Reset ]                    │
│ [ Copy URL ] [ Copy for OBS ]│
└──────────────────────────────┘
```

### Header

| Slot | Required | Purpose |
|------|----------|---------|
| Title | yes | App name |
| Utility buttons | optional | Help, preview toggles, flip side — app-specific |
| ✕ Close | yes | Hide menu (`menu=DISABLE`) |

**Flip side:** optional `side=left|right` — moves panel to other edge. Persist in URL.

### Body — accordion sections

- One section expanded at a time.
- Toggle buttons with `aria-expanded` + `hidden` panels.
- Each section groups related controls.

**Control types to reuse:**

| Type | Pattern |
|------|---------|
| Range slider | Label + slider + live value readout; update on `input` |
| Toggle | Checkbox row; disable dependent sliders when off |
| Color | Picker + hex field, kept in sync |
| Button | Full-width; primary / destructive / small variants |

All controls update state **live** — no Save/Cancel batch.

### Footer actions

| Button | Required | Behavior |
|--------|----------|----------|
| Test / Preview | recommended | Trigger effect preview (runtime only, not persisted) |
| Reset all | recommended | Restore defaults, sync UI, rewrite URL |
| Copy URL | yes | Clipboard ← current `location.href` |
| Copy URL for OBS | yes | Clipboard ← current URL + `menu=DISABLE` |

---

## State and persistence

**No localStorage. No server.** Config lives in URL query params.

```text
on change → update state object → history.replaceState(?params)
on load   → parse URLSearchParams → hydrate state → sync UI
```

Every persisted setting gets a URL param. Booleans as `"true"` / `"false"`. Keep param names short and stable — OBS URLs are the config file.

Minimum params every app should support:

| Param | Purpose |
|-------|---------|
| `menu` | `DISABLE` = hidden menu |
| `side` | `left` \| `right` panel position |

App-specific params are defined per project. See [`spotsmoke/app.js`](../spotsmoke/app.js) `defaults` for one example.

---

## OBS operator flow

1. Browser Source → set URL → match canvas resolution.
2. Enable *Shutdown source when not visible* + *Refresh browser when scene becomes active*.
3. **Interact** → double-click to open menu → configure → test → close with ✕.
4. **Copy URL for OBS** → paste into Browser Source URL → save. Config survives refresh.

Effect runs independently of menu visibility.

---

## Visual language

Shared look across Sesh Helpers apps:

| Token | Value |
|-------|-------|
| Accent | `#0ff` cyan |
| Reset / destructive | `#f40` |
| Panel bg | `rgba(10, 10, 20, 0.95)` + backdrop blur |
| Title / action font | `Better VCR` or project monospace |
| Page background | `transparent` (OBS overlay) |

Range rows: label column + slider + bold value. Buttons: bordered, uppercase, accent-colored.

---

## Agent checklist — new helper app

When implementing Control UI on a new project:

- [ ] Add `#settings-menu` panel with header, accordion sections, footer actions
- [ ] Implement `settingsMode` ON / DISABLE with `menu` URL param
- [ ] Double-click background shows menu when hidden; ignore clicks inside panel
- [ ] ✕ close hides menu and updates URL
- [ ] All settings → state object → URL params via `replaceState`
- [ ] Load hydrates state from URL on init
- [ ] Copy URL + Copy URL for OBS buttons
- [ ] `body.settings-mode` toggles operator overlays
- [ ] Transparent page bg; effect canvas separate from menu DOM
- [ ] Document app-specific params and sections in that project's docs — not here

---

## App-specific extensions

Optional hooks beyond the shared shell — define per app:

| Extension | Example (Spot Smoke) |
|-----------|---------------------|
| Canvas interaction | Double-click places spot when menu open |
| Operator overlay | Crosshair canvas, only in `settings-mode` |
| Preview backdrop | Checkerboard toggle for transparency check |
| Help modal | Full-screen setup image |

Do not copy Spot Smoke's sliders into other apps unless the app needs them. Copy the **shell and contracts** above.

---

## Open questions

- [Y] Extract shared CSS/JS module from Spot Smoke?

If you can extract atomic code, or slightly rewrite, for making compatible with iomplementation across multiple "simple web apps" let's do it. 

- [Y] Should double-click toggle hide as well as show?

No, double-click will only show the menu. When inside the menu, double-click might be used for something else.



---

## Related

- [001_CLANKER_INIT.md](001_CLANKER_INIT.md) — project entry point
- [`spotsmoke/`](../spotsmoke/) — reference implementation (read the code for concrete defaults)
- [`spotsmoke/notes.md`](../spotsmoke/notes.md) — operator install ramblings
