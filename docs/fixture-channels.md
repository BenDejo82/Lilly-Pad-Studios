# Fixture DMX channels — owner's rig

Source: photos of the owner's printed manuals and channel cards (November 2026).
These are the reference for the app's fixture profiles (`fixtureProfiles` in each build).
**Since v0.3.36 the app's profiles match these lists and are marked verified.**

Status key: ✅ matches the app · ⚠️ differs from the app · ❓ still needed

---

## OPPSK 36W RGB PAR — 7-channel mode ✅

| Ch | Value | Function |
|---|---|---|
| 1 | 0–255 | Master dimmer |
| 2 | 0–255 | Red dimmer |
| 3 | 0–255 | Green dimmer |
| 4 | 0–255 | Blue dimmer |
| 5 | 0–255 | RGB (colour function; exact ranges not listed on the card) |
| 6 | 1–255 | Strobe speed |
| 7 | 1–255 | Mode |

App profile `OPPSK_PAR` matches this order.

---

## DJXFLI 90W moving head — 13-channel mode ✅

The card confirms **13 channels** (the 12-channel manual found online is a different variant).
Channels 1–4 confirmed from the full manual table. In DMX mode with no signal, the display's first digit flickers.

| Ch | Value | Function |
|---|---|---|
| 1 | 0–255 | X axis (pan) |
| 2 | 0–255 | X-axis fine adjustment (pan fine) |
| 3 | 0–255 | Y axis (tilt) |
| 4 | 0–255 | Y-axis fine adjustment (tilt fine) |
| 5 | 0–255 | X/Y axis speed (fast → slow) |
| 6 | 0–255 | Total dimming (dark → bright) |
| 7 | 0 | Strobe: no function |
| 7 | 1–255 | Strobe: synchronous, slow → fast (1 Hz–25 Hz) |
| 8 | 0–255 | Red dimming |
| 9 | 0–255 | Green dimming |
| 10 | 0–255 | Blue dimming |
| 11 | 0–255 | White dimming |
| 12 | 0–49 | Macro: channels 1–13 valid (normal DMX control) |
| 12 | 50–200 | Macro: self-propelled (auto) |
| 12 | 201–255 | Macro: sound control |
| 13 | 0–240 | Reset: no function |
| 13 | 241–255 | Reset: fixture reset (hold 5 s) |

**Fixed in v0.3.36.** Before that, the app differed: App profile `DJXFLI_MOVER` assumes: 1 Pan, 2 Tilt, 3 Pan/tilt speed,
4 Master dimmer, 5 Strobe, 6–9 R/G/B/W, 10 Color auto, 11 Motor auto, 12 Built-in programs,
13 Reset. Everything from channel 3 on is shifted compared with the card.

### Specs and front-panel menu (from the manual)

- Product: LED Beam 90W moving head. Control: DMX512, **13 channels only**.
- Working modes: DMX512, master/slave, self-propelled (auto), voice (sound) control.
- Dimming 0–100% smooth; strobe up to 25 flashes per second.
- Power listed as AC 220 V / 50 Hz. ⚠️ Check the label on the actual units before plugging into
  120 V / 60 Hz mains; many units like this are 100–240 V, but the listing doesn't say so.
- Look (for graphics): beam head with a single round front lens, held in a yoke on a square base
  with a 4-digit display.

| Menu | What it does |
|---|---|
| Addr | DMX start address A001–A512 |
| CHnd | Channel mode (13CH) |
| SLnd | Operation mode: DMX / self-propelled / voice control |
| Pan | YES/NO: reverse the X (pan) motor direction |
| Tilt | YES/NO: reverse the Y (tilt) motor direction |
| SEne | Sound sensitivity 0–100 |
| LED | Display always on (ON/OFF) |
| DISP | Flip the display (YES/NO) |
| Ver | Software version (V100) |
| Faet | Restore factory settings (YES/NO) |
| Fine-tuning | Hold MENU 5 s: Pan and Tilt fine adjustment −127…127 |

**Note for the app:** because Pan and Tilt can be reversed on the fixture itself, the app's
future DMX output should offer per-fixture pan/tilt invert too, so the two movers can mirror
each other however they're hung.

---

## Betopper LM30A — 13-channel mode ✅ (7-channel mode also listed)

### 13-channel mode (the mode the app patches)

| Ch | Value | Function |
|---|---|---|
| 1 | 0–255 | Y-axis motor 1 (0°–135°) |
| 2 | 0–255 | Y-axis motor 2 (0°–135°) |
| 3 | 0–255 | Dimmer (0–100%) |
| 4 | 0–9 | Strobe: none |
| 4 | 10–255 | Strobe: slow → fast |
| 5 | 0–255 | R dimmer (bar 1) |
| 6 | 0–255 | G dimmer (bar 1) |
| 7 | 0–255 | B dimmer (bar 1) |
| 8 | 0–255 | W dimmer (bar 1) |
| 9 | 0–255 | **W** dimmer (bar 2) |
| 10 | 0–255 | **B** dimmer (bar 2) |
| 11 | 0–255 | **G** dimmer (bar 2) |
| 12 | 0–255 | **R** dimmer (bar 2) |
| 13 | 130–199 | No function |
| 13 | 200–249 | Reset (hold 3 s) |
| 13 | 250–255 | Single unit, sound control (random) |

**Differs from the app** on channels 9–12: the app assumes bar 2 is R, G, B, W; the manual lists
it in reverse (W, B, G, R). Everything else matches.

### 7-channel mode (for reference)

| Ch | Value | Function |
|---|---|---|
| 1 | 0–255 | Y-axis motor 1 (0°–135°) |
| 2 | 0–255 | Y-axis motor 2 (0°–135°) |
| 3 | 0–255 | Dimmer (0–100%) |
| 4 | 0–9 / 10–255 | Strobe: none / slow → fast |
| 5 | 0–7 | No effect |
| 5 | 8–255 | Effects 1–25 (in steps of ~10: 8–17 Effect 1 … 247–255 Effect 25) |
| 6 | 0–255 | Effect speed (quick → slow) |
| 7 | 0–199 / 200–249 / 250–255 | No function / Reset (3 s) / Single unit, sound control |

Motor fine tuning (front panel): MENU → hold ENTER > 3 s → TIL1 (Y-axis motor 1), adjust −127…127,
ENTER to store.

---

## Betopper LF4808 — 15-channel mode ✅ (4- and 152-channel modes also listed)

Typed out by the owner from the manual. Wording kept as the manual has it (machine-translated).

### 15-channel mode (the mode the app patches)

| Ch | Value | Function |
|---|---|---|
| 1 | 0–255 | Aiming |
| 2 | 0–255 | R |
| 3 | 0–255 | G |
| 4 | 0–255 | B |
| 5 | 0–255 | W |
| 6 | 0–255 | Pigment (likely colour presets / colour macro) |
| 7 | 0–255 | RGB pattern *(listed as "CH?" in the copy; by position this is channel 7)* |
| 8 | 0–255 | RGB velocity (speed) |
| 9 | 0–255 | W pattern |
| 10 | 0–255 | W velocity (speed) |
| 11 | 0–255 | RGBW strobe |
| 12 | 0–255 | RGBW pattern |
| 13 | 0–255 | RGBW velocity (speed) |
| 14 | 0–255 | Background colour |
| 15 | 0–255 | Background colour light (brightness) |

**Fixed in v0.3.36.** Before that, the app differed: App profile `LF4808` assumes: 1 Master dimmer, 2 Strobe, 3 Strobe speed,
4–7 R/G/B/W, 8 Aiming / pattern position, 9 Effect colour, 10 Pattern select, 11 Pattern speed,
12 Effect mode, 13 Effect speed, 14 Sound, 15 Reset. Almost every channel differs.
**Note: this mode has no master dimmer channel.** Brightness comes from the R, G, B and W levels
(and channel 15 for the background colour). The value ranges inside channels 6–14 (which values
pick which pattern) aren't listed yet.

### 4-channel mode

| Ch | Value | Function |
|---|---|---|
| 1 | 0–255 | R |
| 2 | 0–255 | G |
| 3 | 0–255 | B |
| 4 | 0–255 | W |

### 152-channel mode (pixel control)

| Ch | Value | Function |
|---|---|---|
| 1–144 | 0–255 | **48 RGB sections**, 3 channels each: section 1 = ch 1 R, 2 G, 3 B; section 2 = ch 4–6; … section 48 = ch 142–144 |
| 145–152 | 0–255 | **8 white sections**, 1 channel each: white section 1 = ch 145 … white section 8 = ch 152 |

This tells us the panel's real layout for graphics and future pixel effects: **48 individually
controllable colour sections and 8 white sections**.

## KeoBin lasers (QLC+ only for now; not in Lilly Pad Studios yet)

From the owner's manuals; may need checking on the units. QLC+ definitions: `docs/qlcplus/KeoBin-*.qxf`.
Planned addresses (universe 1): **L2600 124** (room kept to 157 for its 34-channel mode) ·
**L2800 158–175** · **LA500 176–191**. Laser class and mW output still to be read from the labels.

**Off values:** L2600 ch 1 = 0 (34-channel mode: ch 1 and ch 18 = 0) · L2800 ch 1 = 241–255, or every
laser and LED channel at 0 (**ch 1 = 0 is DMX control, not off**) · LA500 ch 1 = 0 (to confirm).

### L2600 — 6-channel mode
| Ch | Function | Values |
|---|---|---|
| 1 | Laser on/off | 0 off · 1–255 on |
| 2 | Auto / sound program | 0–31 effects, 32–63 serial, 64–95 mixed (auto) · 96–127 saving · 128–223 the same, sound · 224–255 saving (manual says 224–225) |
| 3 | Pattern group | 16 values per group from 0 · 224–255 group 0 (manual's numbering of the top groups is unclear) |
| 4 | Pattern | each value one pattern |
| 5 | Color | 32 values each: full color, red, yellow, green, cyan, blue, pink, white |
| 6 | Speed | 0 still · 1–255 slow to fast |

### L2600 — 34-channel mode (two layers, A = ch 1–17, B = ch 18–34)
Ch 1 on/off and mode (0 off, 1–99 auto, 100–199 sound, 200–254 "saving", 255 pattern A off) · 2 out of
bounds / size · 3 group (A only; ch 20 has no function) · 4 pattern · 5 zoom · 6 rotation · 7 X move ·
8 Y move · 9 X size · 10 Y size · 11 fixed color · 12 pattern color (56–63 white; manual says 65–63) ·
13 dots · 14 drawing amount · 15 drawing · 16 twist · 17 grating (13 groups of 20). Ch 18–34 repeat these
for layer B (ch 18 255 = group A off, B on).

### L2800 — 18-channel mode (pattern + beam lasers with RGBW/UV LEDs)
| Ch | Function | Values |
|---|---|---|
| 1 | Mode | 0–5 DMX · 6–50 auto 1 · 51–90 auto 2 · 91–140 sound 1 · 141–190 sound 2 · 191–240 sound 3 · 241–255 off |
| 2, 3 | Red, green pattern laser | 0–255 |
| 4, 5 | Red, blue beam laser | 0–255 |
| 6 | Pattern motor | rotation speed |
| 7–10 | LED red, green, blue, white/UV | 0–255 |
| 11 | LED strobe | 0 off · 1–4 solid · 5–255 slow to fast |
| 12 | Laser pattern | 0–4 none · 5–229 patterns 1–45 (5 values each) · 230–255 point |
| 13, 14 | Pan, tilt | 0–199 position · 200–255 auto movement |
| 15 | Fixed rotation | 0°, 90°, 180°, 270° (64 values each) |
| 16 | Continuous rotation | 0–9 stop · 10–120 CW fast to slow · 135–245 CCW slow to fast (121–134 not listed) |
| 17 | Flip | 0–9 stop · 10–120 horizontal · 135–245 vertical |
| 18 | Stretch / zoom | 0–127 static big to small · 128–255 dynamic |

### LA500 — 16-channel mode (rear menu: Mode 0 DMX, 16CH)
| Ch | Function | Values |
|---|---|---|
| 1 | Laser on/off | 0–255 (probably 0 off; check) |
| 2 | Strobe | 0–9 none · 10–255 slow to fast |
| 3 | Color | 0–34 fixed white, red, blue, purple, cyan, yellow, green (about 5 each) · 35–39 color cycle · 40–44 initial color · 45–46 rainbow · 47–214 segments · 215–255 gradients |
| 4 | Color flow | 0–9 static · 10–127 forward · 128–255 reverse |
| 5 | Pattern | within the group on ch 6 |
| 6 | Pattern group | 0–49 geometric · 50–74 edge highlight · 75–99 punched · 125–174 animations · 225–255 LightElf custom (100–124, 175–224 not listed) |
| 7 | Size | 0–255 |
| 8 | Auto size | 0–15 static · 16–255 auto zoom |
| 9 | Rotation | 0–127 angle · 128–191 CW · 192–255 CCW |
| 10, 11 | X flip, Y flip | 0–127 position · 128–255 speed |
| 12, 13 | Pan, tilt | 0–255 |
| 14 | X wave | 0–1 none · 2–255 wave |
| 15 | Drawing | 0–1 none · 2–127 manual · 128–255 auto |
| 16 | Dynamic effects | 0–1 none · 2–202 effects · 203–234 macros · 235–255 random |
