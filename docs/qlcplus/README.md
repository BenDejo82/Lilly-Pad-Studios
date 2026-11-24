# QLC+ fixture definitions for the owner's rig

QLC+'s built-in library doesn't include these budget fixtures, so these definitions were written from
the owner's manuals (the same channel lists as `docs/fixture-channels.md` and the Lilly Pad Studios
profiles). All four validate against QLC+'s own fixture schema.

| File | Fixture | Modes |
|---|---|---|
| `OPPSK-36W-RGB-PAR.qxf` | OPPSK 36W RGB PAR | 7 Channel |
| `DJXFLI-90W-LED-Beam-Moving-Head.qxf` | DJXFLI 90W LED Beam moving head | 13 Channel |
| `Betopper-LM30A.qxf` | Betopper LM30A | 13 Channel, 7 Channel |
| `Betopper-LF4808.qxf` | Betopper LF4808 | 15 Channel, 4 Channel |

## Install (Windows)

1. Close QLC+.
2. Copy the `.qxf` files into your QLC+ user fixtures folder: `C:\Users\<your name>\QLC+\Fixtures`
   (create the `Fixtures` folder if it isn't there).
3. Open QLC+. In **Fixtures & Functions → add fixture**, they appear under their manufacturer
   (**OPPSK**, **DJXFLI**, **Betopper**).

Mac: `~/Library/Application Support/QLC+/Fixtures`. Linux: `~/.qlcplus/fixtures`.

## Addresses (universe 1)

PAR 1 **001**, PAR 2 **008**, PAR 3 **015**, PAR 4 **022**, PAR 5 **029**, PAR 6 **036**, PAR 7 **043**,
PAR 8 **050** (all 7 Channel) · MOVER 1 **057**, MOVER 2 **070** (13 Channel) · LF4808 **083** (15 Channel) ·
LM30A 1 **098**, LM30A 2 **111** (13 Channel).

Remember: close QLC+ before starting the LPS Bridge; only one program should send to the node.
