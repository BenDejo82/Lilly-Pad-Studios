# Fixture DMX channels — owner's rig

Source: photos of the owner's printed manuals and channel cards (November 2026).
These are the reference for the app's fixture profiles (`fixtureProfiles` in each build).
**Nothing here has changed the app yet**: profile changes need a reviewed, approved build.

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

## DJXFLI 90W moving head — 13-channel mode ⚠️ (complete)

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

**Differs from the app.** App profile `DJXFLI_MOVER` assumes: 1 Pan, 2 Tilt, 3 Pan/tilt speed,
4 Master dimmer, 5 Strobe, 6–9 R/G/B/W, 10 Color auto, 11 Motor auto, 12 Built-in programs,
13 Reset. Everything from channel 3 on is shifted compared with the card.

---

## Betopper LM30A — 13-channel mode ⚠️ (7-channel mode also listed)

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

## Betopper LF4808 — 15-channel mode ⚠️ (4- and 152-channel modes also listed)

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

**Differs from the app.** App profile `LF4808` assumes: 1 Master dimmer, 2 Strobe, 3 Strobe speed,
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
