# CLANKER INIT — Single Point of Entry for AI Agents

> **If you are an AI agent:** read this file first, every time, before touching anything in this repo.
> **If you are a mortal meat bag:** you are welcome here too — this doc is written for clankers, but humans can follow along.

This is the authoritative onboarding document for Sesh Helpers. When in doubt, trust what is written in `./docs/` over assumptions, stale training data, or vibes.

---

## What this project is

**Sesh Helpers** is a collection of helper apps for the **Sesh Sofa** show.

The project is in **bootstrap phase**. Most features are not built yet. Documentation is the source of truth — if something is not written down, treat it as undecided.

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
├── README.md                 # Short human overview (start here if you are meat)
├── LICENSE                   # AGPL-3.0
├── docs/
│   ├── README.md             # Documentation index
│   ├── 001_CLANKER_INIT.md   # THIS FILE — agent entry point
│   └── Control_UI.md         # Configuration menu spec (template, not implemented)
└── webroot/
    ├── index.html            # Placeholder landing page
    └── img/
        └── seshhelpers.png   # Project logo / brand asset
```

| Path | Status | Notes |
|------|--------|-------|
| `docs/` | **Exists** | Living documentation; extend as project grows |
| `webroot/index.html` | **Exists** | Static placeholder; no build step yet |
| `webroot/img/seshhelpers.png` | **Exists** | Brand reference for UI styling |
| Application code | **Not yet** | No backend, no Control UI implementation |
| Build tooling / CI | **Not yet** | TBD |
| Deployment | **Not yet** | TBD |

Future directories (apps, services, config) will appear as features land. Update this table when they do.

---

## Documentation conventions

- **`00x_` prefixed files** — ordered reading for agents (e.g. `001_CLANKER_INIT.md`).
- **Unnumbered files** — feature or domain specs (e.g. `Control_UI.md`).
- **`docs/README.md`** — human-friendly index; link new docs from there.
- **Templates** — docs marked *Draft / Template* are fill-in specs. Mortal meat bags write short notes; clankers implement from the structured fields.
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
- **Document first when bootstrapping** — if you build something new, write down how it works.
- **Tests when meaningful** — only add tests that cover real behavior, not obvious trivia.
- **Do not commit unless asked** — mortal meat bags control git history.

---

## Known gaps / TBD

These are intentionally undecided. Do not guess; update docs or ask.

| Topic | Status |
|-------|--------|
| Tech stack (frontend framework, backend, language) | TBD |
| Control UI implementation | Spec template only — see [`Control_UI.md`](Control_UI.md) |
| Deployment / hosting | TBD |
| Show-specific integrations (hardware, APIs, broadcast) | TBD |
| Authentication / operator roles | TBD |
| Data persistence strategy | TBD |

---

## Quick links

| Resource | Path |
|----------|------|
| Documentation index | [`docs/README.md`](README.md) |
| Control UI spec (template) | [`Control_UI.md`](Control_UI.md) |
| Landing page | [`webroot/index.html`](../webroot/index.html) |
| Logo asset | [`webroot/img/seshhelpers.png`](../webroot/img/seshhelpers.png) |
| Root README | [`README.md`](../README.md) |

---

*Last updated: bootstrap phase. Extend this file as the project grows.*
