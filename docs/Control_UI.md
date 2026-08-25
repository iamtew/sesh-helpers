# Control UI — Framework

| Field | Value |
|-------|-------|
| **Status** | Framework pattern (from Spot Smoke) |
| **Reference impls** | [`spotsmoke/`](../spotsmoke/) (canvas), [`seshbanner/`](../seshbanner/) and [`trbanner/`](../trbanner/) (drag + themes) |
| **Audience** | Clankers re-implementing this menu |

> High-level only. App-specific controls live in each project's docs/code — not here.

---

## What this is

Reusable settings-menu pattern for full-screen helper webapps (usually OBS Browser Sources, transparent bg). Operators open a panel, tweak live, copy a URL, hide the panel for clean output.

Copy the **contracts** below. Swap title, sections, and controls per app.

### OBS Browser Sources — transparent canvas

Almost all simple web apps in this repo are meant for **OBS Browser Sources**. They must composite cleanly over the scene:

- `html, body { background: transparent }` — never paint an opaque page fill.
- Operator overlays (guides, checkerboard, settings chrome) only under `body.settings-mode`.
- Clean output = `menu=DISABLE` (panel + overlays hidden; effect/banner only).

---

## Visibility contract

`settingsMode`: `ON` | `DISABLE`. URL param: `menu=DISABLE` hides; anything else (or omit) = show.

| Mode | Menu | Operator overlays | OBS output |
|------|------|-------------------|------------|
| `ON` | Visible | Shown | Panel + guides in Interact |
| `DISABLE` | Hidden | Hidden | Effect only |

| Input | Menu hidden | Menu visible |
|-------|-------------|--------------|
| **Double-click** background | Show menu | App-specific (Spot Smoke: place spot) |
| **✕ Close** | — | Hide menu |
| Load `?menu=DISABLE` | Start hidden | — |
| **Copy URL for OBS** | — | Copy config URL with `menu=DISABLE` |

- Double-click always opens when hidden. Hide only via ✕ or OBS URL.
- Clicks inside `#settings-menu` never hit the background handler.
- Hooks: `#settings-menu.open`, `body.settings-mode`.

---

## Shell layout

Fixed panel, one edge, ~300px, scrollable, dark glass + blur.

```text
┌──────────────────────────────┐
│ [App title]    [utils…][✕]  │
│ Hint (optional)              │
│ ▼ Section A   (one open)     │
│   …controls…                 │
│ ▶ Section B                  │
│ [ Test ] [ Reset ]           │
│ [ Copy URL ] [ Copy for OBS ]│
└──────────────────────────────┘
```

| Slot | Required | Notes |
|------|----------|-------|
| Title | yes | App name |
| Utils | optional | Help, checkerboard, flip side… |
| ✕ Close | yes | Sets `menu=DISABLE` |
| Accordion | yes | One section open; `aria-expanded` + `hidden` |
| Flip side | optional | `side=left\|right` in URL; apps default to **right** |

**Controls:** range (label + slider + value, on `input`), toggle (+ disable dependents), color (picker + hex sync), buttons (primary / destructive / small).

### Footer

| Button | Required | Behavior |
|--------|----------|----------|
| Test / Preview | recommended | Runtime only — not URL-persisted |
| Reset all | recommended | Defaults → apply live → rewrite URL |
| Copy URL | yes | Clipboard ← `location.href` as-is |
| Copy URL for OBS | yes | Clone URL → set `menu=DISABLE` → copy |

Copy buttons **only** read the address bar. They never assemble params. Stale URL = broken OBS save.

---

## Live update contract — IMPERATIVE

On **every** setting change, do **both** in the **same** handler. No Save. No reload. No “export later.”

1. **Page live** — effect / canvas / overlays update immediately.
2. **URL live** — full query string rewritten via `history.replaceState` so `location.href` matches state.

```text
control event
  → update state
  → apply to page (effect, labels, overlays)
  → write ALL persisted params → history.replaceState
```

| DO | DO NOT |
|----|--------|
| Fire on `input` while dragging | Wait for Save, blur, or menu close |
| Apply to the running render path now | Defer visuals until refresh |
| Rewrite the **full** param set each time | Leave URL stale until Copy |
| Keep readouts synced | Treat URL as a separate export step |

Operators tweak until it looks right, then Copy. Clipboard must match what they see.

**Persistence:** no `localStorage`, account, or configuration server. The URL query
string is the complete config, so a meat bag can copy one string and reproduce the
same overlay.

| Rule | Detail |
|------|--------|
| Every persisted setting | Has a URL query param |
| On load | Parse params → hydrate state → sync UI → apply to page; missing → defaults |
| Runtime-only (e.g. Test) | No URL param; still update page live |
| Booleans | `"true"` / `"false"` |
| Param names | Short, stable |
| Copy URL | `navigator.clipboard.writeText(location.href)` |
| Copy URL for OBS | Clone → `menu=DISABLE` → copy |

**Minimum params:** `menu` (`DISABLE` = hidden), `side` (`left` \| `right`).

App params: see each app's `defaults` + `updateURL()` and operator notes:
[`spotsmoke`](../spotsmoke/notes.md), [`seshbanner`](../seshbanner/notes.md),
[`trbanner`](../trbanner/notes.md).

---

## OBS operator flow

1. Browser Source → URL → canvas resolution.
2. Enable *Shutdown source when not visible* + *Refresh browser when scene becomes active*.
3. Interact → double-click open → configure (live) → test → ✕ close.
4. **Copy URL for OBS** → paste into source URL → save.

If refresh loses settings, live URL sync is broken — fix that first.

---

## Visual language

| Token | Value |
|-------|-------|
| Accent | `#0ff` |
| Reset / destructive | `#f40` |
| Panel bg | `rgba(10, 10, 20, 0.95)` + blur |
| Title / actions | `Better VCR` (see [`TYPOGRAPHY.md`](TYPOGRAPHY.md)) |
| Page bg | `transparent` (required for OBS — see above) |

---

## Clanker checklist

- [ ] `#settings-menu` shell: header, accordion, footer
- [ ] `settingsMode` ON / DISABLE + `menu` URL param
- [ ] Double-click shows menu when hidden; ignore clicks inside panel
- [ ] ✕ hides menu and updates URL
- [ ] **Live page:** every setting change updates the effect immediately
- [ ] **Live URL:** every setting change rewrites full query via `replaceState`
- [ ] Every persisted setting ↔ URL param; load hydrates from URL
- [ ] Copy URL = `location.href`; Copy for OBS = same + `menu=DISABLE`
- [ ] Verify: drag slider → effect changes → URL changes → copy → new tab matches
- [ ] `body.settings-mode` for overlays; **transparent** page bg (OBS)
- [ ] Document app-specific params in that project's docs — not here

---

## App-specific extensions

| Extension | Spot Smoke example |
|-----------|-------------------|
| Canvas interaction | Double-click places spot when menu open |
| Operator overlay | Crosshairs only in `settings-mode` |
| Preview backdrop | Checkerboard toggle |
| Help modal | Setup image |

Copy shell + contracts. Do not copy Spot Smoke's sliders unless the app needs them.

---

## Decisions

- **Shared CSS/JS module:** TBD — extract only when the repeated app code can share one contract cleanly.
- **Double-click hide:** No. Double-click only shows. Inside the menu, double-click may do something else (e.g. place spot).

---

## Related

- [001_CLANKER_INIT.md](001_CLANKER_INIT.md)
- [`spotsmoke/`](../spotsmoke/) — reference impl
- [`spotsmoke/notes.md`](../spotsmoke/notes.md) — operator notes
- [`seshbanner/`](../seshbanner/) — banner + layouts (Control UI consumer)
- [`seshbanner/notes.md`](../seshbanner/notes.md) — Sesh Banner operator contract
- [`trbanner/`](../trbanner/) — Trick Request Banner (Control UI consumer)
- [`trbanner/notes.md`](../trbanner/notes.md) — Trick Request operator contract
- [TYPOGRAPHY.md](TYPOGRAPHY.md)
- [THEMES.md](THEMES.md)
