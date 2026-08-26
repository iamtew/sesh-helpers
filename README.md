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
| [ABS](abs/) | Animated Background System (full-screen OBS backdrops) | See each app under `abs/` |
| [Diamond](abs/diamond/) | LCD geometric diamond lattice (ABS) | [Setup and URL parameters](abs/diamond/notes.md) |
| [Ripple](abs/ripple/) | Pulsing pixel wave backdrop (ABS) | [Setup and URL parameters](abs/ripple/notes.md) |
| [Voroni](abs/voroni/) | Voronoi pulse field with edge ripples (ABS) | [Setup and URL parameters](abs/voroni/notes.md) |

## Using an overlay in OBS

1. Add a **Browser Source** and use the hosted app URL.
2. Match the source resolution to the OBS canvas (usually `1920×1080`).
3. Enable **Shutdown source when not visible** and **Refresh browser when scene becomes active**.
4. Choose **Interact**, configure the overlay, then use **Copy URL for OBS**.
5. Paste the copied URL back into the Browser Source properties.

Configuration lives in the URL query string—there is no account, server-side storage,
or local storage for the meat bags to babysit. `menu=DISABLE` produces the clean OBS
output; double-click the background to bring the controls back.

## Local development

Serve the repository root rather than opening files directly so browser APIs and
relative assets behave like production. For example:

```sh
python -m http.server 8000
```

Then open <http://localhost:8000/>. No package install or clanker ritual is required.

## Documentation

[docs/README.md](docs/README.md) indexes the implementation contracts and clanker
onboarding. App-specific operator instructions live beside each app in `notes.md`.

## License

AGPL-3.0 — see [LICENSE](LICENSE).
