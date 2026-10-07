# tailors_time

An experimental WebGL clock built with Three.js: articulated scissors indicate hours and minutes, a sewing needle sweeps seconds, and stitched thread records the elapsed minute on a vermilion felt surface.

- Exactly 60 measuring-tape divisions and 12 pin anchors.
- Continuous local time, a shared mechanical pivot, and fading stitch history.
- Full-screen, text-free presentation with restrained pointer parallax.

## Run locally

Serve the `dist` directory using a static HTTP server:

```sh
npx serve dist
```

Open the local URL printed by the server. No build step is required.

## Files

- `dist/clock.js` — Three.js geometry, materials, clock motion, and stitching.
- `dist/index.html` and `dist/style.css` — document and full-screen presentation.
- `dist/vendor/` — bundled Three.js and its MIT license.
- `.openai/hosting.json` — existing Sites deployment configuration.

## Live experience

https://tailors-time-atelier.cl7578.chatgpt.site

The Sites deployment currently requires owner access.
