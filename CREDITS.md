# Credits

Third-party code and fonts vendored under [`vendor/`](vendor/). This project is
**AGPL-3.0** ([`LICENSE`](LICENSE)). Vendored works keep their original licenses.

## Runtime libraries

| Package | Version | License | Upstream | Local path |
|---------|---------|---------|----------|------------|
| PixiJS | 8.8.1 | MIT | https://pixijs.com/ · https://github.com/pixijs/pixijs | [`vendor/pixi/`](vendor/pixi/) |
| iro.js | 5.5.2 | MPL-2.0 | https://iro.js.org/ · https://github.com/jaames/iro.js | [`vendor/iro/`](vendor/iro/) |
| marked | 15.0.6 | MIT | https://marked.js.org/ · https://github.com/markedjs/marked | [`vendor/marked/`](vendor/marked/) |
| Tabler Icons (webfont) | 3.35.0 | MIT | https://tabler.io/icons · https://github.com/tabler/tabler-icons | [`vendor/tabler-icons/`](vendor/tabler-icons/) |

## Fonts

| Face | Catalog | License | Source | Local path |
|------|---------|---------|--------|------------|
| Geist | Regular index `9` | SIL Open Font License 1.1 | https://vercel.com/font · https://github.com/vercel/geist-font | [`vendor/fonts/geist/`](vendor/fonts/geist/) |
| Monster Chiller | Display `0` | Foundry license via CDNFonts | https://fonts.cdnfonts.com/css/monster-chiller | [`vendor/fonts/monster-chiller/`](vendor/fonts/monster-chiller/) |
| YouMurderer BB | Display `1` | Foundry license via CDNFonts | https://fonts.cdnfonts.com/css/youmurderer-bb | [`vendor/fonts/youmurderer-bb/`](vendor/fonts/youmurderer-bb/) |
| Streetmark | Display `2` | Foundry license via CDNFonts | https://fonts.cdnfonts.com/css/streetmark | [`vendor/fonts/streetmark/`](vendor/fonts/streetmark/) |
| Germania One | Display `3` | Foundry license via CDNFonts | https://fonts.cdnfonts.com/css/germania-one | [`vendor/fonts/germania-one/`](vendor/fonts/germania-one/) |
| Konstruktor | Display `4` | Foundry license via CDNFonts | https://fonts.cdnfonts.com/css/konstruktor | [`vendor/fonts/konstruktor/`](vendor/fonts/konstruktor/) |
| Better VCR | Display & Regular `5` | Foundry license via CDNFonts | https://fonts.cdnfonts.com/css/better-vcr | [`vendor/fonts/better-vcr/`](vendor/fonts/better-vcr/) |
| Flapdoodle | Regular `6` | Foundry license via CDNFonts | https://fonts.cdnfonts.com/css/flapdoodle | [`vendor/fonts/flapdoodle/`](vendor/fonts/flapdoodle/) |
| Londrina Solid | Regular `7` | Foundry license via CDNFonts | https://fonts.cdnfonts.com/css/londrina-solid | [`vendor/fonts/londrina-solid/`](vendor/fonts/londrina-solid/) |
| Pill Gothic 600mg | Regular `8` | Foundry license via CDNFonts | https://fonts.cdnfonts.com/css/pill-gothic-600mg | [`vendor/fonts/pill-gothic-600mg/`](vendor/fonts/pill-gothic-600mg/) |
| Lemondrop | Display `10` | Foundry license via CDNFonts | https://fonts.cdnfonts.com/css/lemondrop | [`vendor/fonts/lemondrop/`](vendor/fonts/lemondrop/) |
| Brighton Sans NBP | Regular `11` | Foundry license via CDNFonts | https://fonts.cdnfonts.com/css/brighton-sans-nbp | [`vendor/fonts/brighton-sans-nbp/`](vendor/fonts/brighton-sans-nbp/) |

CDNFonts redistributes faces from various foundries. Copies here are for offline
GitHub Pages / OBS use. If a foundry license is stricter than this project's
needs, replace that face — **TBD** where CDNFonts does not publish a clear
license file next to the font.

Segoe UI is **not** vendored (Microsoft proprietary). Catalog index `9` is Geist.

Overlay hosts load [`vendor/fonts/overlay.css`](vendor/fonts/overlay.css).
Landing, ABS, Spot Smoke, and docs load [`vendor/fonts/ui.css`](vendor/fonts/ui.css)
(Better VCR + Geist). Settings chrome stays Better VCR.
