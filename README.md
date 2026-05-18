# Bangalore in Bloom — React

A React + Vite port of the single-file HTML data visualization. The original 3.5MB HTML file (with inlined Tone.js, Leaflet, and base64 fonts) has been split into a maintainable component structure.

## Architecture

- **7 visualization components**, one per section, each in `src/components/Viz0X*.jsx`
- **Shared data module** at `src/data/bloom.js` (species + month constants + helpers)
- **Scene image** for Viz06 mosaic kept as base64 data URL in `src/data/scene-image.js`
- **Tone.js** and **Leaflet** loaded as npm packages instead of inlined libs
- **Fonts** loaded from Google Fonts CDN via `<link>` in `index.html` (originally inlined as ~3MB of base64 woff2)

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:5173. First click on the play button in Viz01 or hover into Viz06 will start the audio (browsers require a user gesture).

## Build

```bash
npm run build
npm run preview
```

## The seven visualizations

1. **The Soundscape** — Tone.js ambient + WebGL ridged-glass shader
2. **The Wordmark** — typographic bloom calendar
3. **The Season** — 5 seasons as watercolour canvas slides
4. **The Canvas** — Leaflet map of Bangalore with petal overlay
5. **The Score** — heatmap table
6. **The Loop** — 118-year pixel mosaic, saturating glass loupe, Tone.js audio per (year, month)
7. **The Year** — 12 monthly cyclographs

Viz01 and Viz06 share a tonal system (same scales, same drones) so they belong to one musical family even though each is self-contained.
