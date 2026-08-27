# sesh-helpers

Browser-source helpers for the Sesh Sofa show, assembled by clankers for meat bags.

The apps are static HTML, CSS, and JavaScript. There is no build step: open them from
the hosted site or serve the repository root with any static web server.

**Hosted site:** <https://helpers.seshsofa.nl/>

## Projects

| App | What it does | Operator notes |
|-----|--------------|----------------|
| [Spot Smoke](spotsmoke/) | Configurable smoke emitter for OBS | [Setup and URL parameters](spotsmoke/notes.md) |
| [Sesh Banner](seshbanner/) | Title/message banner with themes and playlist layouts | [Setup and URL parameters](seshbanner/notes.md) |
| [Trick Request Banner](trbanner/) | Fixed title/requester/message overlay | [Setup and URL parameters](trbanner/notes.md) |
| [ABS](abs/) | Animated Background Scene (full-screen OBS backdrops) | See each app under `abs/` |
| [Diamond](abs/diamond/) | LCD geometric diamond lattice (ABS) | [Setup and URL parameters](abs/diamond/notes.md) |
| [Ripple](abs/ripple/) | Pulsing pixel wave backdrop (ABS) | [Setup and URL parameters](abs/ripple/notes.md) |
| [Voroni](abs/voroni/) | Voronoi pulse field with edge ripples (ABS) | [Setup and URL parameters](abs/voroni/notes.md) |
| [Code Rain](abs/coderain/) | Matrix code rain backdrop / overlay (ABS) | [Setup and URL parameters](abs/coderain/notes.md) |

## Install in OBS

Same Browser Source dance for every app — overlays and ABS backdrops alike.
App URLs look like `https://helpers.seshsofa.nl/<app>/`. Full copy also lives in
[docs/OBS_INSTALL.md](docs/OBS_INSTALL.md).

### Installation

- Add a **Browser Source** in OBS.
- URL: **`https://helpers.seshsofa.nl/<app>/`**
- **Resolution:** match your canvas (most common: **1920×1080**).
- Enable both checkboxes:
  - *Shutdown source when not visible*
  - *Refresh browser when scene becomes active*

### Configuration

- **Interact** → opens the control window. Resize if you need more room.
- **Double-click** anywhere → **Settings Menu**.
- Tweak the controls for that app (see its `notes.md`). Changes apply live.
- Close the menu when you’re done.
- Hide/unhide the browser source — the page reloads when OBS refreshes it, so
  effects that run on load start again automatically.

### Save Your Configuration — To Survive a Refresh!!!

- Browser source **visible**. **Interact** again.
- **Double-click** anywhere → reopen settings.
- **Copy URL for OBS** → your personalized config URL (`menu=DISABLE` for clean
  output).
- **Properties** → paste into the **URL field**. Save and close.

Configuration lives in the URL query string — no account, server-side storage,
or local storage for meat bags to babysit. Double-click the background later if
you need the controls back.

## Local development

Serve the repository root rather than opening files directly so browser APIs and
relative assets behave like production. For example:

```sh
python -m http.server 8000
```

Then open <http://localhost:8000/>. No package install or clanker ritual is required.

## Documentation

[Install in OBS](docs/OBS_INSTALL.md) is the shared Browser Source guide.
[docs/README.md](docs/README.md) indexes the implementation contracts and clanker
onboarding. App-specific operator instructions live beside each app in `notes.md`.

## License

AGPL-3.0 — see [LICENSE](LICENSE).
