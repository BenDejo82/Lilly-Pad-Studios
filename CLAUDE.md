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

**Confirm with the owner before creating any new build.** Describe what you plan to change
(and what you've found, if it's a bug) and wait for a go-ahead before making the new
`preview/` file or pushing it. This applies to every new version, including small fixes.

1. Copy the latest `preview/` build to a new file with the next version number and a short
   description, e.g. `Lilly_Pad_Studios_v0.3.31_<What_Changed>_TEST.html`. Never edit an
   older build in place: the owner may have it open or be comparing against it.
2. Update the version label in the header (`<span class="small">… · v0.3.xx</span>`) and the
   `<title>`.
3. Make the change. Because lines are very long, edit with exact string replacement and
   check each target string occurs exactly once.
4. Run the tests on the new build, in all three browser engines, and fix anything that fails:
   `node tests/regression.js preview/<new build>.html` (Chromium: Chrome and Edge), then again with
   `LPS_BROWSER=webkit` (Safari on Mac, iPad and iPhone) and `LPS_BROWSER=firefox`. Firefox and WebKit
   come from `npx playwright install firefox webkit` (plus `install-deps` on Linux); in cloud sessions
   the `lilly-pad-studios` environment allows those downloads.
5. Commit the new build to `preview/` on `main` (that's how it reaches the iPad), and add a
   row to the version table in `ROADMAP.md`.
6. Give the owner the iPad link:
   `https://bendejo82.github.io/Lilly-Pad-Studios/preview/<file name>`

## Code conventions

- All styling lives in the single `<style id="lps-styles">` block. Change or add rules there;
  never add another `<style>` block or patch earlier rules with extra `!important` layers.
- Never use `alert()`: it pauses the whole app (and running effects) on the iPad. Use
  `lpsNotify('message')` for in-app notices. The only allowed prompt is the import confirmation.
- Fold-out sections are defined in `SECTIONS` by a marker element, never by position.
- The 3D view (`setupStage3D`, inside the main stage script) reads the same state through
  `appearance()` and `movementPosition()`; never keep a separate copy of show data for 3D.
  Three.js r158 is stored in `<script id="lps-three-lib" type="text/plain">` and only run when
  3D is first opened. Its sizes (stage 7.3 × 4.9 m, truss 3 m) are defaults until the owner gives
  real measurements.
- DMX output values come only from the DMX engine (`dmxFrame()` / `dmxSafeFrame()`, exposed read-only as
  `window.LPSDMX`), using `fixtureProfiles`. It calls `appearance(f,i,now,{dmx:true})`, which skips the
  on-screen strobe simulation and flash overlays; real strobing goes through each fixture's strobe channel,
  capped at `DMX_LIMITS.strobeMaxHz`. Blackout = zeros except mover position/speed. The LPS Bridge must
  fade to the safe look (`dmxSafeFrame`) if it loses contact with the app.
- Before publishing, also run the code checker (ESLint, no-undef / no-unused-vars) and compare
  screenshots of every screen with the previous build when a change should not alter the look.

## Rules

- Development order: **Lighting → Projection Mapping → Unified Sequencer.** Lighting and
  projection mapping must share one cue and timing system (see `ROADMAP.md`). Develop
  projection mapping in separate builds until it's ready.
- LPS will have Free and Pro tiers in **one** codebase. When adding a feature, keep it easy to
  gate behind a capability check later; never fork into separate Free and Pro builds.
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
