# Lilly Pad Studios

A browser-based lighting-control app: program colours, effects, moving-head movement and
cues, and preview them on a virtual stage.

> Easy enough for beginners. Powerful enough for professionals.

**Status:** prototype. It simulates lighting only; there is no real DMX output yet.

## Open it

- **Stable build:** [`index.html`](https://bendejo82.github.io/Lilly-Pad-Studios/)
- **Latest test build:** the highest version in [`preview/`](preview/). Open it as
  `https://bendejo82.github.io/Lilly-Pad-Studios/preview/<file name>`.
- **Older builds:** [`preview/archive/`](preview/archive/), kept for reference.

## In this repo

| Path | What it is |
|---|---|
| `index.html` | The stable build |
| `preview/` | Current test builds, newest version first to check |
| `preview/archive/` | Older test builds |
| `bridge/` | The LPS Bridge: sends the app's DMX to real lights over Art-Net ([how to use it](bridge/README.md)) |
| `tests/regression.js` | Automatic browser tests: `node tests/regression.js <build.html>` |
| `ROADMAP.md` | Goals, version history, plan and fixture research |
| `CLAUDE.md` | Working notes for Claude |
