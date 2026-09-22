# Detailed 3D pack

Adapted from the source-model pipeline in pattssun/OpenWii, commit
`f1caee803adf58a1c80b660eea3a18cf6f09f8d5`.
The original Mario Kart 8 models are Nintendo artwork, separate from the
OpenWii software's MIT license. [sources.json](sources.json) records the exact
source pages, public download links, uploader credits and archive SHA-256 hashes.

## Reproduce

Start WiiPhone with `npm start`. In another terminal, run:

```sh
npm run setup:kart-assets
```

Requires Node, the project's npm dependencies, Google Chrome and Python 3.9+.
For a server running on a different port, set `KART_BUILD_ORIGIN`, for example
`KART_BUILD_ORIGIN=https://localhost:8445 npm run setup:kart-assets`.

The installer downloads and verifies the eleven archives, extracts them under
`games/mario-kart/evidence/asset-study/`, runs the converters below and writes
`assets/mario-kart/manifest.json` after successful conversion. Inputs, converted
assets and model-specific provenance are local ignored files. Keep `sources.json`
and the pipeline in Git so the pack can be reproduced without committing binaries.

## Conversion

- `build-source.mjs`: Mario, Standard Kart and Standard Tire; creates independent
  wheel pivots, seated driver bones and a head pivot, then exports `mario-source.glb`.
- `build-source-rivals.mjs`: fits Luigi, Peach, Yoshi, Toad, Bowser, Donkey Kong and
  Koopa to the same chassis, preserving each driver's textures and paint.
- `build-source-stadium.mjs`: converts Mario Kart Stadium and reconstructs the
  driving surface. `source-road.py` derives the centerline from mesh UVs;
  `source-surface.py` attaches the measured ground triangles and boost masks.

The converters accept WiiPhone's self-signed development HTTPS certificate.
Each output has a `.provenance.json` record alongside it; the course also has
`stadium-route.json`. Missing models retain the procedural version at runtime.
Use `?sourceCourse=0` to compare with the generated track.

## Validation

With the server running:

```sh
KART_SOURCE=1 npm run test:kart-browser
npm run test:kart-phone
```

The first check requires all eight GLB racers and the imported course, then
completes a lap using keyboard events, including antigravity, gliding and results.
The phone check uses synthetic orientation and real touch events through the
WebSocket relay; it is not a physical-device sensor test.
