# QLC+ fixture definitions for the owner's rig

QLC+'s built-in library doesn't include these budget fixtures, so these definitions were written from
the owner's manuals (the same channel lists as `docs/fixture-channels.md` and the Lilly Pad Studios
profiles). All seven validate against QLC+'s own fixture schema.

| File | Fixture | Modes |
|---|---|---|
| `OPPSK-36W-RGB-PAR.qxf` | OPPSK 36W RGB PAR | 7 Channel |
| `DJXFLI-90W-LED-Beam-Moving-Head.qxf` | DJXFLI 90W LED Beam moving head | 13 Channel |
| `Betopper-LM30A.qxf` | Betopper LM30A | 13 Channel, 7 Channel |
| `Betopper-LF4808.qxf` | Betopper LF4808 | 15 Channel, 4 Channel |
| `KeoBin-L2600.qxf` | KeoBin L2600 animation laser | 6 Channel, 34 Channel |
| `KeoBin-L2800.qxf` | KeoBin L2800 laser + LED effect | 18 Channel |
| `KeoBin-LA500.qxf` | KeoBin LA500 animation laser | 16 Channel |

## Install (Windows)

1. Close QLC+.
2. Copy the `.qxf` files into your QLC+ user fixtures folder: `C:\Users\<your name>\QLC+\Fixtures`
   (create the `Fixtures` folder if it isn't there).
3. Open QLC+. In **Fixtures & Functions → add fixture**, they appear under their manufacturer
   (**OPPSK**, **DJXFLI**, **Betopper**, **KeoBin**).

Mac: `~/Library/Application Support/QLC+/Fixtures`. Linux: `~/.qlcplus/fixtures`.

## Addresses (universe 1)

PAR 1 **001**, PAR 2 **008**, PAR 3 **015**, PAR 4 **022**, PAR 5 **029**, PAR 6 **036**, PAR 7 **043**,
PAR 8 **050** (all 7 Channel) · MOVER 1 **057**, MOVER 2 **070** (13 Channel) · LF4808 **083** (15 Channel) ·
LM30A 1 **098**, LM30A 2 **111** (13 Channel) · lasers (QLC+ only for now): L2600 **124** (6 Channel;
room kept to 157 for 34 Channel), L2800 **158** (18 Channel), LA500 **176** (16 Channel).

Lasers: aim every beam well above head height, and check the label's Class before a public show.
The L2800's channel 1 at 0 means DMX control, not off: off is 241–255 or all its laser and LED channels at 0.

Remember: close QLC+ before starting the LPS Bridge; only one program should send to the node.
