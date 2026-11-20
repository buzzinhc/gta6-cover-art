# gta6-cover-art

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/buzzinhc/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/buzzinhc/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

**Vice Poster Studio** is a fan-made cover-art maker that runs entirely in the browser. It builds the kind of multi-panel collage poster a big open-world game box is famous for — a hero panel, supporting scenes, white gutters, a huge condensed headline — out of your own photos. It is an original style tribute: no publisher logos, artwork, characters or font files are used, and nothing is uploaded anywhere. Photos are read locally and rendered on a `<canvas>` on your own machine.

## What you can do

- **Three collage layouts** — the classic five-panel Collage, a Spotlight layout with one hero shot over a film strip, and Bands (two panels over a wide banner). Switch layouts at any time; photos carry over.
- **Per-panel photo work** — click a panel (or its chip) to select it, load a photo from disk, drag the photo inside the panel to reposition it, and zoom with the slider or the mouse wheel. One click fills every panel with the selected photo.
- **Headline editor** — a main title and a tagline, set in the bundled Anton typeface with the thick outline and drop shadow poster art needs. Three finishes: classic white, a Vice sunset gradient, and neon pink with a glow.
- **Vice grade** — an optional colour grade that pushes saturation and contrast and washes each photo with pink at the top, tangerine through the middle and violet shade at the bottom. Strength is a slider.
- **Box-art frame** — an optional white-and-ink frame around the whole poster.
- **Exports** — one click downloads a PNG at 1080 × 1080, 1080 × 1350 or 1920 × 1080. The poster is always drawn at full export resolution; the on-screen preview is just a scaled view, and the pink selection outline never appears in an export.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. There is no build step and the app makes no network requests: the page, its two ES modules (`app/src/render.js` for drawing, `app/src/studio.js` for the editor), the bundled font and the sample photos are all static files under `app/`.

Four sample photos ship in `app/samples/` so the studio is full the moment it loads: two photographic scenes provided with the competition starter (a pier, a boulevard) and two synthetic illustrations drawn for this entry (a neon night street, a sunset boardwalk).

Deterministic screenshot states are built in: opening the app with `?shot=cover`, `?shot=cover2`, `?shot=cover3` or `?shot=editor` presents a fixed scene with fixed photos and titles. `shots.json` at the repository root lists the four shots used for this entry's screenshots.

## Notes

- The headline typeface is Anton by Vernon Adams, bundled under the SIL Open Font License 1.1 (see `app/fonts/OFL.txt`).
- Everything about the look — layout geometry, grade, title treatment — is original code written for this entry; the resemblance to famous box art is composition and colour, not copied assets.

<sub>Entered on [make.fun](https://make.fun/?ref=fjpy230d&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
