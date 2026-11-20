# Lilly Pad Studios — Roadmap

Lilly Pad Studios (LPS) is a lighting-control app that should serve beginners and
lighting professionals alike.

> **Easy enough for beginners. Powerful enough for professionals.**
> You shouldn't have to outgrow Lilly Pad Studios just because you've outgrown being a beginner.

**LPS is not just a DMX controller.** It's one production environment where lighting,
projection mapping, MIDI control and stage visualisation work together, instead of five
separate applications. For example: trigger a lighting cue from a MIDI controller that
changes the stage colours while a mapped visual transitions across the backdrop, all
from Lilly Pad Studios. Projection mapping is where the project originally started.

The production systems:

- **Lighting control:** fixtures, colours, effects, movement, cues, DMX output.
- **Projection mapping:** surfaces mapped onto set pieces and backdrops, with visuals that
  transition in step with the lighting.
- **MIDI integration:** trigger effects and scenes from the owner's Novation Launchkey or
  Nektar controller.
- **Stage visualisation:** preview an entire production before setting up the real
  equipment.

LPS shouldn't simply imitate an existing lighting console. It should make professional
lighting control more intuitive without giving up the capabilities professionals need.

## Where we stand

- **Phase:** prototype, in functional testing and UI refinement. Several systems have
  been tested successfully, but it is not yet a production-ready lighting console.
- **Stable build:** `index.html` (currently **v0.3.35**, released after a feature review on the iPad). The previous stable v0.3.13 is in `preview/archive/`.
- **Latest test build:** see the highest version in `preview/`.
- **Last build verified on the iPad:** v0.3.35 (code cleanup).
- **Older builds:** `preview/archive/`.

## The big picture: Lighting → Projection Mapping → Unified Sequencer

1. **Lighting:** get the lighting engine, console and fixtures dependable (the master
   roadmap below).
2. **Projection Mapping:** developed **separately** (its own test builds) until it's ready,
   so it can't destabilise the lighting builds.
3. **Unified Show Sequencer** *(future concept, not implemented)*: build a show on a
   timeline of three synchronised tracks, e.g. a lighting cue changes the stage colours
   while a mapped visual transitions across the backdrop.

**Key architectural decision:** Projection Mapping and Lighting must share a common **cue
and timing system**. Any cue, timing or effect code written for either one should use that
shared model, so the sequencer later connects two compatible systems instead of forcing
unrelated pieces together.

**Release rule:** no new stable release until the owner and Claude have reviewed its
features together.

### Development order

1. Lighting console foundation *(current)*
2. Projection mapping engine *(next)*
3. Unified sequencer *(after mapping)*
4. **Independent user testing** *(before charging anyone)*
5. Free / Pro licensing *(before any public commercial release)*

### Independent user testing

After projection mapping and the sequencer, put LPS in the hands of 10–20 independent
operators who weren't involved in building it. Ask them to complete real tasks **without
coaching**:

- patch fixtures
- create a chase
- map a surface
- synchronise a cue
- save a show
- recover from a mistake

Measure how long each task takes, where they struggle, and whether they'd choose LPS over
their existing tools. That shows whether the biggest advantage is simplicity, integration,
pricing, or something not yet recognised.

### Positioning

The market won't reward LPS merely for combining features that already exist. It can stand
out by making lighting, mapping and sequencing **dramatically easier to use together**,
especially for independent musicians, small production companies, and creators who don't
have a dedicated lighting or video technician. Judge new features by that: does it make the
whole show easier to build and run?

### Technical realities to design for

- **Today's LPS is a browser-based simulator.** It has no verified real-world DMX output and
  no multi-projector control.
- **Multiple HDMI / projector outputs need an output architecture**, not a licence switch: a
  way to address several displays reliably, likely through a desktop application or a
  companion output service working alongside the browser app.
- **Licensing must not depend on a live internet connection.** A temporary outage must never
  interrupt an active show (e.g. licences validated in advance and cached for offline use).

### Free and Pro: one app, different capabilities

- One application, one core engine, one codebase. Free and Pro differ only in which
  capabilities are unlocked.
- Design the capability limits into the architecture now, without charging anyone yet.
- Possible later: educational licences or discounted Pro access for students, schools and
  community theatres.
- **Open decision for the owner:** Pro as a one-time purchase or a subscription.

> One idea. One application. Endless possibilities.

## Target architecture

One lighting platform, two levels of interaction:

- **Simple Workspace:** fast setup, touch-first programming, quick colours and FX.
- **Professional Workspace:** advanced programming, groups, cue stacks, detailed fixture control.
- Both sit on one **LPS Lighting Engine** (patch, fixture attributes, effects, cues,
  playback, output) and share the same show state. Simple Workspace is an easier way to
  run the professional engine, not a watered-down version of LPS.
- Around the engine: the Stage Visualizer, projection mapping, MIDI controllers, real DMX
  output, and MVR / GDTF import, all sharing one show (so a cue can drive lights and
  mapped visuals together).

Who it is for:

- **Beginner:** adds fixtures, picks colours, builds a chase and runs a show without
  learning a complicated console.
- **Working operator:** groups, palettes, precise movement, effects, cue lists, playback
  and reliable DMX output for weddings, bands and corporate events.
- **Touring professional:** imports an MVR stage design, works with verified GDTF fixture
  definitions, and runs a large production.

## What's been built

- **Projection mapping (alpha):** the MAPPING tab lets you create several four-cornered
  surfaces, drag their corners, set a tint, opacity and outline, and import a reference
  image. It's a planning tool only: no video playback, warping, masking or projector output yet.
- **MIDI:** not started.

- **A. Foundation:** browser-based HTML/JavaScript prototype; Simple and Professional
  Workspaces on one shared lighting state; Stage Visualizer; fixture selection; colour and
  intensity; patch and programmable looks.
- **B. Programming and effects:** Static, Pulse, Chase and Rainbow effects; chase colours
  (Fixture Colour, White, Custom); multi-fixture targeting; multiple chase groups;
  moving-head effects and beam-direction visualisation; speed and intensity controls.
- **C. Cues and show management:** STC (Save to Cue), cue recall, Undo/Redo, Save Project
  (browser storage), Export/Import JSON, project reopening.
- **D. Interface and workflow:** Quick Colour and FX near the visualizer, grouped project
  actions, simpler buttons, floating Stage Visualizer. A professional interface needs
  symmetry, consistent spacing and deliberate control placement, not just attractive
  colours and effects.
- **E. Real-world fixture research:** the personal rig (below) and the *Slayer 2026 LA
  Support* MVR file as a professional touring reference.

## Version history (recent)

| Version | Milestone | Result |
|---|---|---|
| v0.3.16 | Earlier stable prototype checkpoint | Previous baseline |
| v0.3.17 | Simple Workspace prototype | Foundation for further changes |
| v0.3.18 | Visible FX controls, custom chase colours, STC | Passed functional testing |
| v0.3.19 | Undo/Redo correction | Passed |
| v0.3.20 | Chase colour sync between fixture groups | Passed |
| v0.3.21 | Single-tap history correction | Passed; project reopening confirmed |
| v0.3.22 | Grouped project controls, Quick Colour and FX | Working in initial testing |
| v0.3.23 | Experimental vibrant fixture graphics | Rejected visually |
| v0.3.24 | Visualizer docking and scroll correction | Insufficient |
| v0.3.25 | Independent floating-window dragging | Passed on iPad |
| v0.3.26 | Cleaner, text-first console UI | Move FX regression reported |
| v0.3.27 | Movement visibility and stage-control alignment | Movement still failed on iPad |
| v0.3.28 | Move FX no longer stopped by the device's Reduce Motion setting | Browser-tested; Fan found static on iPad |
| v0.3.29 | Fan Move FX animates (opens and closes) | Fan swung inward on iPad |
| v0.3.30 | Fan spreads outward, by stage position | Passed on iPad |
| v0.3.31 | Fan Move FX removed (Sweep with Mirror: Pan covers the out-and-in look) | Passed on iPad |
| v0.3.32 | Console layout cleanup: one design layer (uniform buttons, type, spacing), duplicate colour/FX/deselect/save-cue controls removed, layout tools in a collapsible "Edit layout" section, tidy labels, correct version badge | Browser-tested; iPad check pending |
| v0.3.33 | FX ENGINE and Pro LIVE fold-out sections fixed: panels were sorted by position and had shifted one section down (Flash FX was empty, its settings sat in Effect Programming). Now sorted by what each panel contains | Browser-tested; iPad check pending |
| v0.3.34 | Stage view directly under the Stage Visualizer bar; zoom, beam guides, view and Edit layout grouped as "View & Layout" at the bottom of the panel | Browser-tested; iPad check pending |
| v0.3.35 | Code cleanup: docked Stage Visualizer bar no longer sticks to the top; 22 blocking pop-ups replaced with in-app notices; Undo also records keyboard actions; all fold-out sections placed by content; 14 style blocks merged into one with dead and overridden rules removed (screens pixel-identical); hidden duplicate Quick Color code and unused values removed; test suite expanded to 36 checks | Passed on iPad · **released as stable `index.html`** |
| v0.3.36 | Realistic fixtures + verified profiles: OPPSK PAR with 36 LEDs, upright LM30A with two bars of 4, LF4808 matrix (48 colour + 8 white sections), DJXFLI mover with fixed base and turning head; one selection outline; LM30A, LF4808 and DJXFLI channel maps corrected to the owner's manuals and all four marked verified; 13 new tests (49 total) | Browser-tested; iPad check pending |
| v0.3.37 | Truss numbered the professional way, stage left to stage right (from the audience: PAR 6 … PAR 1); PAR 7 = SR boom, PAR 8 = SL boom; Stage Right / Stage Left and boom labels on the visualizer; DMX addresses unchanged; saved shows in the old order are updated once (dragged fixtures stay put); 7 new tests (56 total) | Browser-tested; iPad check pending |
| v0.3.38 | Aligned rig: truss fixtures evenly spaced (49 units, symmetric, LF4808 centred); booms directly under the truss legs; one line for all labels and palette boxes; shows saved before v0.3.37 have every truss position mirrored (nudged ones too) and v0.3.37 shows move to the even spacing; 10 new tests (66 total) | Browser-tested; iPad check pending |
| v0.3.39 | 3D visualizer prototype: 2D/3D switch on the Stage Visualizer; goal-post truss on tripod legs, stage deck, all 13 fixtures in rig order with soft haze-style beams and floor pools; live colours, effects, Blackout and Move FX (mover heads pan/tilt); PAR 7/8 as floor uplights aimed at the performers; touch orbit/zoom/pan with Front/Top/Reset views; Three.js r158 stored in the file and loaded only when 3D opens (works offline); 2D labels now SR FLOOR / SL FLOOR; 9 new tests (75 total) | Browser-tested; iPad check pending |
| v0.3.40 | Full screen fixed: enlarges whichever view is showing (2D or 3D), with the browser's full screen or a fill-the-window fallback (iPhone / some iPads); each view has its own Exit full screen button; the Files menu no longer shows through; 14 new tests (89 total) | Browser-tested; iPad check pending |
| v0.3.41 | Cross-browser pass: 3D resizes batched to the next frame (removes a Safari "ResizeObserver loop" error); fixture labels lifted 2 units so they clear the palette boxes in every browser; test suite now runs in Chromium (Chrome/Edge), WebKit (Safari, iPad) and Firefox: 89/89, 89/89 and 77/77 (Firefox test machine has no WebGL; the app's notice is checked instead) | Browser-tested; iPad check pending |

## Master roadmap

Stages are development gates, not promised release dates. Move on when a stage meets its
exit requirement, not because the version number went up.

1. **Stabilise the lighting engine** *(current)*. Resolve Move FX, verify cue
   reliability, confirm independent fixture selection, build repeatable tests for every
   important control.
   *Exit:* core effects, history, project loading and visualizer movement pass repeatable
   tests on iPad and desktop.
2. **Complete the professional UI foundation.** One consistent design system:
   typography, spacing, responsive grids, compact controls, docking, coherent navigation,
   touch-friendly selection. Stage Visualizer and programming tools easy to use together.
   *Exit:* common programming tasks need no unnecessary tab switching or overlapping controls.
3. **Realistic fixtures and visualisation.** Replace generic fixture icons with accurate,
   efficient visuals based on real geometry, LED layouts, mounting orientation and optics.
   Test with the personal rig first, then the Slayer MVR as a larger benchmark.
   *Exit:* fixtures are recognisable, selection is clear, beams animate correctly, and
   large layouts stay responsive.
4. **Professional programming.** Fixture attributes, palettes, groups, presets, timing,
   advanced effects, cue stacks, reliable playback, live-show safeguards.
   *Exit:* a complete rehearsal show can be programmed, saved, reopened and played back
   predictably.
5. **Hardware output and interoperability.** Real DMX output through supported hardware
   and protocols, starting with one carefully tested path. GDTF fixture definitions and
   MVR import, validating addresses, modes, universes and geometry.
   *Exit:* verified output to real fixtures, recoverable connection failures, dependable
   imported-show behaviour.
6. **Expanded show-production platform.** Projection mapping, video sync, timecode, MIDI
   control surfaces, show automation.
   *Exit:* these share a stable show timeline and control architecture without
   compromising lighting reliability.

## Current sprint

1. **Resolve Move FX completely.** Verify on the real iPad: selected-mover targeting,
   Circle / Sweep / Figure Eight movement, and beam visualisation. (Fan was removed in
   v0.3.31; a static "spread positions" tool may return in Stage 4 with presets.)
2. **Finish the console layout cleanup.** Remove overlaps, unnecessary bubble buttons and
   duplicate controls; fix inconsistent alignment.
3. **Rebuild fixture visuals accurately** (see *Fixture visual spec* below).
4. **Establish a tested release candidate.** Retest cues, chase groups, Undo/Redo, saved
   projects, floating windows and responsive layouts, then promote it to `index.html`.

Later: the Slayer MVR goes in a **separate experimental workspace**, so importing the
touring rig can never touch the personal show data. Projection mapping waits until
lighting control is dependable.

## Development standards

| Area | Standard |
|---|---|
| Version control | Keep a known-good build (`index.html`) and separate test builds (`preview/`). |
| Regression testing | Re-run `tests/regression.js` after every change. A visual change must never break an effect that worked. |
| UI development | Use one consistent design system, not isolated CSS tweaks. |
| Fixture definitions | Keep appearance, control attributes and DMX profiles separate. Never change a DMX profile just to update graphics. |
| Performance | Test the small personal rig and professional-scale rigs. |
| Compatibility | Test desktop and iPad, in both orientations. |
| Project integrity | Preserve user data, validate imports, support portable backups. |
| Release approval | Promote a build to `index.html` only after the required tests pass and it's been checked on the iPad. |

Longer term: move from one large HTML file to a modular app (rendering, effects, project
management and output as separate modules).

## Personal rig (small-production reference)

Verified DMX channel lists from the owner's manuals are in [`docs/fixture-channels.md`](docs/fixture-channels.md).

**Numbering convention:** units on the truss are numbered from **stage left to stage right**
(performer's view), the standard in professional lighting paperwork. Seen from the audience they
read, left to right: PAR 6 · MOVER 2 · LM30A 2 · PAR 5 · PAR 4 · LF4808 · PAR 3 · PAR 2 ·
LM30A 1 · MOVER 1 · PAR 1. **PAR 7** is the **stage-right floor uplight** (audience left) and **PAR 8**
the **stage-left floor uplight** (audience right). Addresses are grouped by fixture type: PARs 001–050,
movers 057 and 070, LF4808 083, LM30As 098 and 111. On the visualizer the 11 truss units are evenly spaced
and symmetric about the centre. PAR 7 and PAR 8 are **floor uplights** on small stands near the foot of each
truss leg (the rig is a goal-post truss on two tripod legs), aimed up and in at the performers.

Dimensions and DMX modes vary by listing and model revision; verify against the actual
units before changing any LPS profile.

| Fixture | Researched facts | How it should look in the visualizer |
|---|---|---|
| **OPPSK 36W RGB PAR** | 36 individual LEDs; about 7.3 × 6.1 × 3.1 in; 25° beam | Round face with 36 small LED lenses, simple housing |
| **Betopper LM30A** | Spider-style, eight 3W RGBW LEDs, independently moving sections; about 11 × 6.3 × 4.9 in | Two narrow LED bars of four lenses each, mounted upright. Not a round PAR shape. |
| **Betopper LF4808** | Rectangular matrix strobe, 768 RGB + 112 white LEDs; about 17.5 × 9.4 × 3.2 in; 4-, 15- and 152-channel modes | Wide rectangular panel with a simplified LED matrix, centred on the truss |
| **DJXFLI 90W moving head** | About 8.7 × 7.5 × 11 in; pan/tilt; narrow beam. Manual lists 12 DMX channels but the LPS patch uses 13: **verify the exact variant.** | Recognisable base, yoke and head, beam leaving the lens |

### Fixture visual spec

- A fixture looks like the real unit even when it's off. When on, its lenses light up and
  the beam shows the programmed colour.
- Selection adds one restrained highlight and doesn't change the fixture's colour. No
  stacked rings.
- Keep the physical truss layout, including the upright LM30As and the centred LF4808.

## Professional reference: Slayer 2026 LA Support MVR

114 fixtures across six types: Robe Robin iForte (30), Robe Robin iSpiider (23), Chauvet
Color STRIKE M (22), Chauvet STRIKE Array 4 (20), Chauvet STRIKE Array 2 (15), MDG The One
Touring (4). The MVR archive holds 288 GLB geometry files, fixture positions, orientation
matrices, identifiers and addressing; one embedded GDTF (the MDG fixture), with the others
referenced by name.

Use it for: (1) realistic fixture appearance, (2) importing the layout into a separate
read-only preview, (3) testing performance and navigation with a 114-fixture rig. It is a
reference project and must never overwrite the personal rig or its patch.

## The goal

Take LPS to a show: open it on a laptop or tablet, load the show or import the venue's rig,
verify fixtures, addresses and universes, program colours, movement, effects and cues,
preview it realistically, connect supported output hardware, run the show, save, and move
on to the next venue.

LPS should be a coherent system where every feature works together, every control has a
clear purpose, and the interface feels natural to both a first-time user and an
experienced lighting designer.
