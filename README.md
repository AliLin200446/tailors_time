# tailors_time

An experimental WebGL clock built with Three.js: articulated scissors indicate hours and minutes, a sewing needle ticks seconds, and stitched thread records the elapsed minute on a vermilion felt surface.

- Exactly 60 measuring-tape divisions and 12 pin anchors.
- Continuous hour/minute time, an 80 ms mechanical second tick, and discrete fading stitch history.
- Quiet procedural Web Audio unlocks on the first click or touch.
- Double-sided cloth flips, thin selvages, and 60 equal arc-length divisions between twelve fixed pin anchors.
- Full-screen, text-free presentation with restrained pointer parallax.

## Run locally

Serve the `dist` directory using a static HTTP server:

```sh
npx serve dist
```

Open the local URL printed by the server. No build step is required.

## Files

- `dist/clock.js` — Three.js scene, layering, audio, and stitching.
- `dist/mechanics.js` — deterministic tick impulse and stitch indexing.
- `dist/tape-system.js` — equal-length constrained ribbon spans and twist frames.
- `dist/index.html` and `dist/style.css` — document and full-screen presentation.
- `dist/vendor/` — bundled Three.js and its MIT license.
- `.openai/hosting.json` — existing Sites deployment configuration.

## Live experience

https://tailors-time-atelier.cl7578.chatgpt.site

The Sites deployment currently requires owner access.

## Deploy on Vercel

This repository is intentionally a static site, not a Vite/React build project.
The files in `dist/` are the committed application source and production assets;
there is no `package.json`, dependency installation, or compilation step.
Three.js is bundled locally in `dist/vendor/`.

Import this repository and deploy `main` with the repository root (`.`) as the
Root Directory. The root `vercel.json` explicitly configures:

- Framework Preset: Other (`null`).
- Install Command: empty (skip).
- Build Command: empty (skip).
- Output Directory: `dist`.

Vercel serves `dist/index.html` at `/`, with its relative CSS and ES-module imports
resolving from the same output directory. No SPA fallback or rewrites are needed;
this site has no client-side routes. Keep `dist/` tracked in Git.

Without this configuration, Vercel's static-site default serves the repository
root. Since that directory has no `index.html`, `/` returns 404 even though
`/dist/index.html` exists. The `.openai/hosting.json` configuration is for Sites
and does not configure Vercel. No DNS or custom-domain changes are required.
