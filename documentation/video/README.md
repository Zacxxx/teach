# Build Week demo video

This folder contains the editable sources and rendered master for the Teach
hackathon video described in `../hackathon-video-script.md`.

## What the footage represents

The central walkthrough is a native 30 fps GNOME screen recording of the actual
embedded component running through the repository's deterministic judge-demo
path. It contains real DOM motion, button clicks, timer updates, processing
animation, scrolling, editing, optimization, and publishing. No badge or
editorial overlay is placed over the product UI. The workflow documents shown
inside that recording are deliberately synthetic.

## Render

Requirements: Bun, FFmpeg, ImageMagick, `uvx`, and network access for the
Microsoft Edge neural voice service.

```bash
bun run video:capture
bun run scripts/build-demo-video.ts
```

The capture and assembly scripts:

1. open a temporary kiosk-mode browser on the synthetic Teach autoplay path;
2. record the live component with GNOME's native recorder and retain only the
   1920×1080 demo display;
3. render the SVG title and end cards and build a repository/CI proof composite;
4. generate neutral narration with `en-US-AndrewMultilingualNeural`;
5. derive time-aligned captions from the voice service;
6. assemble a 1920×1080, 30 fps H.264/AAC master with subtle original ambient
   audio at least 18 dB below the narration.

Generated temporary clips and voice fragments live under `work/` and `audio/`.
They are ignored by Git. The reviewable deliverables are:

- `teach-build-week-demo.mp4`
- `teach-build-week-demo.srt`
- `assets/live-teach-demo.mp4`
- `segments.json`
- the source and captured images under `assets/`

The master is a polished assembly for the submission. The raw dual-display
GNOME recording and temporary Chromium profile are deleted after the clean
left-display crop is produced; they are never committed.
