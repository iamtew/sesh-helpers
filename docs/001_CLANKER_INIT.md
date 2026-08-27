# CLANKER INIT — Single Point of Entry for AI Agents

> **If you are an AI agent:** read this file first, every time, before touching anything in this repo.
> **If you are a mortal meat bag:** you are welcome here too — this doc is written for clankers, but humans can follow along.

This is the authoritative onboarding document for Sesh Helpers. When in doubt, trust what is written in `./docs/` over assumptions, stale training data, or vibes.

---

## What this project is

**Sesh Helpers** is a collection of helper apps for the **Sesh Sofa** show.

The current project is dependency-light, static browser overlays and ABS backdrop
apps. Documentation records the intended contracts, but running code is evidence
too: compare the two before changing behavior instead of trusting stale text or
clanker vibes.

License: **AGPL-3.0** (see [`LICENSE`](../LICENSE) at repo root).

---

## Start here workflow

Follow this order. Do not skip steps.

1. **Read this file** (`docs/001_CLANKER_INIT.md`) — you are here.
2. **Read the docs index** ([`docs/README.md`](README.md)) — see what specs exist.
3. **Read the task-specific doc** — e.g. [`Control_UI.md`](Control_UI.md) for configuration menu work.
4. **Inspect the repo** — verify what actually exists vs what docs describe as planned.
5. **Implement minimally** — smallest correct change; update docs if you learn something new.

When stuck, check **Known gaps / TBD** below before inventing architecture. Ask mortal meat bags when requirements are ambiguous.

---

## Repository map

```text
sesh-helpers/
├── index.html                # Landing page — logo + project list
├── README.md                 # Human overview
├── LICENSE                   # AGPL-3.0
├── CNAME                     # GitHub Pages custom domain
├── img/
│   ├── seshhelpers.png       # Project logo / brand asset
│   ├── seshsofa.png          # Sesh Sofa artwork
│   └── apartment_panorama.png # Optional demo backdrop
├── graphics/
│   └── seshhelpers.af        # Editable Affinity source for the project logo
├── spotsmoke/                # Spot Smoke helper app (OBS Browser Source)
├── seshbanner/               # Sesh Banner helper app (OBS Browser Source)
├── trbanner/                 # Trick Request Banner (OBS Browser Source)
├── abs/                      # ABS — Animated Background System (OBS backdrops)
│   ├── glitch-post.js        # Shared glitch post-process (band shift, chroma, bulge)
│   ├── diamond/              # Diamond — LCD geometric diamond lattice
│   ├── ripple/               # Ripple — pulsing pixel wave backdrop
│   ├── voroni/               # Voroni — Voronoi pulse field backdrop
│   └── coderain/             # Code Rain — matrix code rain backdrop / overlay
├── themes/                   # Shared overlay themes (see THEMES.md)
│   ├── lcd-glass/            # LCD Glass — frosted cyan glass + chromatic pulse
│   ├── sesh-glass/           # Sesh Glass — red-lime glass + halftone + chromatic pulse
│   └── 3026-d3c0/            # 3026 D3C0 — HTB Lite art deco (navy + #9fef00)
├── docs/
│   ├── index.html            # Docs viewer — browse spec markdown in the browser
│   ├── README.md             # Documentation index
│   ├── 001_CLANKER_INIT.md   # THIS FILE — agent entry point
│   ├── OBS_INSTALL.md        # Shared OBS Browser Source install guide
│   ├── Control_UI.md         # Settings menu framework pattern
│   ├── THEMES.md             # Shared overlay theme contract
│   └── TYPOGRAPHY.md         # Shared fonts
```

| Path | Status | Notes |
|------|--------|-------|
| `docs/` | **Exists** | Living documentation; extend as project grows |
| `docs/index.html` | **Exists** | Docs viewer — themed markdown browser for spec files |
| `index.html` | **Exists** | Landing page with project list (add new apps here) |
| `img/seshhelpers.png` | **Exists** | Brand reference for UI styling |
| `spotsmoke/` | **Exists** | First helper app; Control UI reference impl |
| `seshbanner/` | **Exists** | Banner overlay; Control UI + layouts |
| `trbanner/` | **Exists** | Trick Request Banner; fixed layout + demo backgrounds |
| `abs/` | **Exists** | ABS category landing; full-screen OBS backdrop apps |
| `abs/diamond/` | **Exists** | Diamond lattice backdrop; per-app palettes in `notes.md` |
| `abs/ripple/` | **Exists** | Ripple pixel wave backdrop; per-app palettes in `notes.md` |
| `abs/voroni/` | **Exists** | Voroni Voronoi pulse field; per-app palettes in `notes.md` |
| `abs/coderain/` | **Exists** | Code Rain matrix rain; per-app color/bg/dir in `notes.md` |
| `themes/` | **Exists** | Shared overlay themes; see [`THEMES.md`](THEMES.md) |
| `*/notes.md` | **Exists** | Operator setup and complete URL parameter contracts |
| `seshbanner/playlist.js` | **Exists** | Public YouTube playlist extraction and ticker formatting |
| Build tooling / CI | **None** | Intentional: static files, no build step |
| Deployment | **GitHub Pages** | Repo root is the webroot; custom domain is `helpers.seshsofa.nl` |

**OBS / transparency:** Helper apps are almost always OBS Browser Sources. Keep `html, body` background `transparent`. See [`Control_UI.md`](Control_UI.md).

**ABS (Animated Background System):** Full-screen backdrop apps under `abs/<name>/`. They do **not** use shared overlay themes (`themes/` / [`THEMES.md`](THEMES.md)). Palette switching is **per app** — each ABS app owns its named palettes and documents them in its `notes.md`. ABS Control UI omits the checkerboard util (the canvas *is* the background). Link new ABS apps from `abs/index.html` and the root landing.

When you add a helper app: put it in its own directory, link it from `index.html`, and update this map.

---

## Documentation conventions

- **`00x_` prefixed files** — ordered reading for agents (e.g. `001_CLANKER_INIT.md`).
- **Unnumbered files** — feature or domain specs (e.g. `Control_UI.md`).
- **`docs/README.md`** — human-friendly index; link new docs from there.
- **Honesty over completeness** — prefer "TBD" over fabricated detail.

When you add a doc:

1. Create the file under `docs/`.
2. Add it to [`docs/README.md`](README.md).
3. Link it from this file if it is essential onboarding material.

---

## Working principles

- **Minimal scope** — smallest change that solves the task. No drive-by refactors.
- **No over-engineering** — no abstractions for one-liners; no speculative error handling for impossible edges.
- **Match existing conventions** — read surrounding code and docs before writing new patterns.
- **OBS-first canvases** — helper apps use transparent page backgrounds for Browser Sources (see [`Control_UI.md`](Control_UI.md)).
- **Document first when bootstrapping** — if you build something new, write down how it works.
- **Tests when meaningful** — only add tests that cover real behavior, not obvious trivia.
- **Do not commit unless asked** — mortal meat bags control git history.

---

## Known gaps / TBD

These are intentionally undecided. Do not guess; update docs or ask.

| Topic | Status |
|-------|--------|
| Tech stack | Static HTML/JS/CSS per helper app; no build step |
| Control UI | Framework in [`Control_UI.md`](Control_UI.md); reference in `spotsmoke/` |
| Overlay themes | [`THEMES.md`](THEMES.md); LCD Glass, Sesh Glass |
| Deployment / hosting | GitHub Pages (repo root), `https://helpers.seshsofa.nl/` |
| Shared Control UI module | TBD — extract from Spot Smoke if useful |
| Authentication / operator roles | TBD |

---

## Quick links

| Resource | Path |
|----------|------|
| Docs viewer | [`docs/index.html`](index.html) |
| Documentation index | [`docs/README.md`](README.md) |
| Install in OBS | [`OBS_INSTALL.md`](OBS_INSTALL.md) |
| Control UI framework | [`Control_UI.md`](Control_UI.md) |
| Typography | [`TYPOGRAPHY.md`](TYPOGRAPHY.md) |
| Overlay themes | [`THEMES.md`](THEMES.md) |
| Landing page | [`index.html`](../index.html) |
| Spot Smoke | [`spotsmoke/`](../spotsmoke/) |
| Sesh Banner | [`seshbanner/`](../seshbanner/) |
| Trick Request Banner | [`trbanner/`](../trbanner/) |
| ABS | [`abs/`](../abs/) |
| Diamond (ABS) | [`abs/diamond/`](../abs/diamond/) |
| Ripple (ABS) | [`abs/ripple/`](../abs/ripple/) |
| Voroni (ABS) | [`abs/voroni/`](../abs/voroni/) |
| Code Rain (ABS) | [`abs/coderain/`](../abs/coderain/) |
| Logo asset | [`img/seshhelpers.png`](../img/seshhelpers.png) |
| Root README | [`README.md`](../README.md) |

---

*Keep this map synchronized with the repository. Future clankers have enough problems.*
