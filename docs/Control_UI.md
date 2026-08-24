# Control UI — Configuration Menu Specification

| Field | Value |
|-------|-------|
| **Status** | Draft / Template |
| **Last updated** | 2026-08-24 |
| **Purpose** | Spec for the configuration / control UI menu — fill in feature notes; clankers implement later |

> **For mortal meat bags:** write short sentences in the *One-liner* and *Behavior* fields. Skip anything you do not care about yet.
> **For clankers:** treat empty fields as TBD. Do not invent requirements. Ask before implementing ambiguous items.

---

## Overview

**What is the Control UI?**

<!-- One or two sentences: what this menu controls, e.g. "Central settings panel for Sesh Sofa show helpers." -->

**Who uses it?**

<!-- e.g. show operators, producers, mortal meat bags on set -->

**Where does it live?**

| Item | Value |
|------|-------|
| URL / path | TBD |
| Opens in | TBD (browser tab / embedded panel / kiosk) |
| Auth required? | TBD |

---

## Global layout

Describe the shell every screen shares.

| Area | Description |
|------|-------------|
| **Header** | TBD — title, show name, connection status? |
| **Navigation** | TBD — sidebar / top tabs / accordion |
| **Main panel** | TBD — settings form area |
| **Footer / actions** | TBD — Save, Cancel, Reset defaults? |
| **Mobile / small screens** | TBD — collapsible nav? stacked layout? |

**Layout sketch (optional):**

```text
┌─────────────────────────────────────┐
│ Header                              │
├──────────┬──────────────────────────┤
│ Nav      │ Main panel               │
│          │                          │
│          │                          │
├──────────┴──────────────────────────┤
│ [Save] [Cancel] [Reset]             │
└─────────────────────────────────────┘
```

---

## Navigation and menu structure

Outline the menu tree. Add sections as mortal meat bags define them.

- [ ] **Section A** — TBD
  - [ ] Feature placeholder
- [ ] **Section B** — TBD
  - [ ] Feature placeholder

---

## Feature catalog

Copy the block below for each feature. Replace `[Name]` and fill in fields.

<!-- Keep a numbered list here for quick reference once features are named -->

| # | Feature name | Section | Status |
|---|--------------|---------|--------|
| — | *(none yet)* | — | — |

---

### Feature block template

```markdown
### Feature: [Name]

- **One-liner (mortal meat bag notes):**
- **User story:** As a … I want … so that …
- **UI placement:** (menu section, label, control type: toggle / select / text / slider)
- **Default value:**
- **Valid range / options:**
- **Behavior:** (what happens on change, live vs on save)
- **Persistence:** (localStorage / file / API — TBD)
- **Dependencies:** (other features, services, hardware)
- **Edge cases:**
- **Acceptance criteria:**
- **Implementation hints for clankers:** (files to touch, APIs, state shape — fill later)
```

---

### EXAMPLE — delete or replace

> This is a worked example showing how to fill a feature block. Remove when real features are added.

### Feature: Dark mode toggle

- **One-liner (mortal meat bag notes):** switch the UI to dark so it does not blind us in the control room
- **User story:** As an operator I want to toggle dark mode so that I can use the menu comfortably in low light
- **UI placement:** Section "Appearance", label "Dark mode", control type: toggle
- **Default value:** `true` (match show aesthetic — black + glitch accents)
- **Valid range / options:** on / off
- **Behavior:** applies immediately on toggle; no save button needed
- **Persistence:** `localStorage` key `sesh.control.appearance.darkMode`
- **Dependencies:** CSS theme variables
- **Edge cases:** first visit with no stored preference → use default
- **Acceptance criteria:** toggle persists across reload; entire Control UI respects theme
- **Implementation hints for clankers:** CSS custom properties on `:root`; toggle writes to localStorage; no backend yet

---

### EXAMPLE — delete or replace

### Feature: Show name label

- **One-liner (mortal meat bag notes):** display "Sesh Sofa" in the header so operators know which show config they are editing
- **User story:** As an operator I want to see the show name so that I do not edit the wrong show's settings
- **UI placement:** Header, read-only text
- **Default value:** `"Sesh Sofa"`
- **Valid range / options:** n/a (display only for now)
- **Behavior:** static display
- **Persistence:** n/a (hardcoded until multi-show support)
- **Dependencies:** none
- **Edge cases:** n/a
- **Acceptance criteria:** show name visible on every Control UI screen
- **Implementation hints for clankers:** constant or config file; later move to persisted show profile

---

## Data model sketch

Placeholder for saved settings shape. Clankers: implement against this once fields are defined.

```json
{
  "version": 1,
  "show": {
    "name": "Sesh Sofa"
  },
  "appearance": {
    "darkMode": true
  },
  "sections": {}
}
```

| Field | Type | Description |
|-------|------|-------------|
| `version` | number | Schema version for migrations |
| `show.name` | string | Display name |
| `appearance.darkMode` | boolean | Example from template |
| `sections` | object | Per-section settings (TBD) |

**Storage location:** TBD (localStorage / JSON file / API)

---

## Non-goals

What this menu explicitly does **not** do (prevents scope creep):

- [ ] TBD — add items as decisions are made
- [ ] Not a general-purpose CMS
- [ ] Not user account management (until specified)

---

## Open questions

- [ ] Where does the Control UI run — same origin as helpers or separate?
- [ ] Save per-device or sync across operator stations?
- [ ] Who can edit settings vs view-only?
- [ ] *(add more as mortal meat bags think of them)*

---

## Related docs

- [001_CLANKER_INIT.md](001_CLANKER_INIT.md) — agent entry point
- [docs/README.md](README.md) — documentation index
