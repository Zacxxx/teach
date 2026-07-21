# Build Week demo video

This folder contains the editable sources and rendered master for the Teach
hackathon video described in `../hackathon-video-script.md`.

## What the footage represents

The Teach screens are captures of the actual embedded component running through
the repository's deterministic judge-demo path. Product shots carry a visible
`DETERMINISTIC JUDGE DEMO · ACTUAL TEACH COMPONENT` label. This makes every
state repeatable without presenting fixture content as somebody's private live
recording. The workflow documents shown in the montage are deliberately
synthetic.

## Render

Requirements: Bun, FFmpeg, ImageMagick, `uvx`, and network access for the
Microsoft Edge neural voice service.

```bash
bun run scripts/build-demo-video.ts
```

The script:

1. renders the SVG title, workflow, and end cards;
2. builds a repository/CI proof composite from the browser captures;
3. generates neutral narration with `en-US-AndrewMultilingualNeural`;
4. derives time-aligned captions from the voice service;
5. assembles a 1920×1080, 30 fps H.264/AAC master with subtle original ambient
   audio at least 18 dB below the narration.

Generated temporary clips and voice fragments live under `work/` and `audio/`.
They are ignored by Git. The reviewable deliverables are:

- `teach-build-week-demo.mp4`
- `teach-build-week-demo.srt`
- `segments.json`
- the source and captured images under `assets/`

The master is a polished assembly for the submission. A live single-take
recording remains the strongest final replacement if the director records one;
the timeline, narration, captions, proof shots, and end card can be reused.
