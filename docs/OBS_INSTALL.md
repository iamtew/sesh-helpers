# Install in OBS

Clanker-built helpers for meat bags. Same Browser Source dance for every app —
overlays and ABS backdrops alike.

App URLs look like `https://helpers.seshsofa.nl/<app>/` (for example
`/spotsmoke/`, `/seshbanner/`, `/abs/diamond/`). Per-app controls and URL
parameters live in each app’s `notes.md`.

---

## Installation

- Add a **Browser Source** in OBS.
- URL: **`https://helpers.seshsofa.nl/<app>/`**
- **Resolution:** match your canvas (most common: **1920×1080**).
- Enable both checkboxes:
  - *Shutdown source when not visible*
  - *Refresh browser when scene becomes active*

---

## Configuration

- **Interact** → opens the control window. Resize if you need more room.
- **Double-click** anywhere → **Settings Menu**.
- Tweak the controls for that app (see its `notes.md`). Changes apply live.
- Close the menu when you’re done.
- Hide/unhide the browser source — the page reloads when OBS refreshes it, so
  effects that run on load start again automatically.

---

## Save Your Configuration — To Survive a Refresh!!!

- Browser source **visible**. **Interact** again.
- **Double-click** anywhere → reopen settings.
- **Copy URL for OBS** → your personalized config URL (`menu=DISABLE` for clean
  output).
- **Properties** → paste into the **URL field**. Save and close.

Configuration lives in the URL query string — no account, server-side storage,
or local storage for meat bags to babysit. Double-click the background later if
you need the controls back (or paste a URL without `menu=DISABLE`).
