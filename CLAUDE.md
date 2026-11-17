# Lilly Pad Studios — notes for Claude

Lilly Pad Studios (LPS) is a browser-based production environment: lighting control,
projection mapping, MIDI control and stage visualisation working together. It is not
just a DMX controller. Each build is one
self-contained HTML file (HTML, CSS and JavaScript inline, mostly minified onto long
lines). The owner tests on an iPad through GitHub Pages and uploads files through the
GitHub website.

**Read `ROADMAP.md` first.** It holds the project goals, version history, current sprint,
the owner's fixture details and the development standards.

## Where things live

- `index.html`: the **stable** build. Only replace it when the owner says a preview build
  passed on the iPad and the tests pass.
- `preview/`: numbered test builds, e.g. `Lilly_Pad_Studios_v0.3.30_Fan_Outward_FIX_TEST.html`.
  The highest version is the current working build. Keep only the last few builds here,
  plus the last build verified on the iPad; move older ones to `preview/archive/`.
- `preview/archive/`: older test builds, kept for reference. Don't build on these.
- `tests/regression.js`: browser tests for core features.

## How to make a change

1. Copy the latest `preview/` build to a new file with the next version number and a short
   description, e.g. `Lilly_Pad_Studios_v0.3.31_<What_Changed>_TEST.html`. Never edit an
   older build in place: the owner may have it open or be comparing against it.
2. Update the version label in the header (`<span class="small">… · v0.3.xx</span>`) and the
   `<title>`.
3. Make the change. Because lines are very long, edit with exact string replacement and
   check each target string occurs exactly once.
4. Run the tests on the new build and fix anything that fails:
   `node tests/regression.js preview/<new build>.html`
5. Commit the new build to `preview/` on `main` (that's how it reaches the iPad), and add a
   row to the version table in `ROADMAP.md`.
6. Give the owner the iPad link:
   `https://bendejo82.github.io/Lilly-Pad-Studios/preview/<file name>`

## Rules

- Development order: **Lighting → Projection Mapping → Unified Sequencer.** Lighting and
  projection mapping must share one cue and timing system (see `ROADMAP.md`). Develop
  projection mapping in separate builds until it's ready.
- Never promote a build to `index.html` (a release) without reviewing its features with
  the owner first.

- Never change DMX profiles or channel counts just to change graphics. Appearance, control
  attributes and DMX profiles are separate.
- A visual change must never break an effect that worked. Add a test to
  `tests/regression.js` when fixing a bug, so it can't come back.
- The device's Reduce Motion setting may calm strobe and flash previews, but must not stop
  Move FX or other effects the owner starts on purpose.
- Keep the Slayer MVR (and any imported show) separate from the owner's personal rig and
  patch.
- Test on iPad sizes (portrait and landscape) as well as desktop.
- The owner isn't a programmer. Explain results in plain language and say what to tap to
  test something.
