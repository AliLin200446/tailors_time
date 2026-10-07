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
