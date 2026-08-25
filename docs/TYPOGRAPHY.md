# Typography

Shared font catalog for the banner overlays. Display faces come first, followed by
regular faces; that order is the persisted numeric index used by `titleFont`,
`messageFont`, `userFont`, and `prefixFont`.

Do not reorder this list unless you also provide URL migration logic. Old meat-bag
bookmarks would otherwise wake up wearing the wrong typeface.

| Index | Font family | Group | Import |
|-------|-------------|-------|--------|
| `0` | `Monster Chiller` | Display | `https://fonts.cdnfonts.com/css/monster-chiller` |
| `1` | `YouMurderer BB` | Display | `https://fonts.cdnfonts.com/css/youmurderer-bb` |
| `2` | `Streetmark` | Display | `https://fonts.cdnfonts.com/css/streetmark` |
| `3` | `Germania One` | Display | `https://fonts.cdnfonts.com/css/germania-one` |
| `4` | `Konstruktor` | Display | `https://fonts.cdnfonts.com/css/konstruktor` |
| `5` | `Better VCR` | Regular | `https://fonts.cdnfonts.com/css/better-vcr` |
| `6` | `Flapdoodle` | Regular | `https://fonts.cdnfonts.com/css/flapdoodle` |
| `7` | `Londrina Solid` | Regular | `https://fonts.cdnfonts.com/css/londrina-solid` |
| `8` | `Pill Gothic 600mg` | Regular | `https://fonts.cdnfonts.com/css/pill-gothic-600mg` |
| `9` | `Segoe UI` | Regular | `https://fonts.cdnfonts.com/css/segoe-ui-4` |

## Implementation contract

- Import all ten faces in banner stylesheets before displaying the font picker.
- Quote family names and provide a generic fallback, for example
  `font-family: 'Better VCR', monospace`.
- Persist the catalog index, not the family name. Current code still accepts legacy
  family-name URLs and rewrites them to indices.
- The settings menu uses **Better VCR**; overlay fields may use any catalog entry.
- These are third-party CDN fonts. If the CDN is unavailable, browser fallbacks render
  the overlay—the clanker should not block startup waiting for a font.
