# LPS Bridge

The LPS Bridge connects Lilly Pad Studios to your real lights. Web browsers aren't allowed to send
Art-Net, so this small program does it for them. It runs on a computer on the show network (later
a Raspberry Pi in the rack) and:

- **serves Lilly Pad Studios** on the show network, so the iPad or any computer can open it;
- **sends the app's DMX values as Art-Net** (universe 1) to the Pknight node at `192.168.8.50`, about 30
  times a second, straight to the node (never broadcast, so the X32's Wi-Fi stays clear);
- **fails safe:** if the app goes quiet for 1 second (iPad asleep, Wi-Fi drop, app closed), it fades
  over 3 seconds to the show's **safe look** (calm white by default: PARs and LM30As soft white,
  movers low white parked facing the stage, LF4808 off) and holds it until the app comes back.

## First-time setup (Windows)

1. Install **Node.js**, the **LTS** version, from [nodejs.org](https://nodejs.org). Accept the defaults.
2. Download this project: on the GitHub page, **Code → Download ZIP**, then unzip it (for example to
   your Desktop).
3. Connect the computer to the **show network** (the GL.iNet router's Wi-Fi or a cable).

## Every show

1. Open the project folder, then **bridge**, and double-click **Start LPS Bridge.bat**.
   - The first time, Windows Firewall asks about Node.js: tick **Private networks** and click **Allow**.
   - A window opens with addresses like `http://192.168.8.107:8080`. **Leave it open.**
2. On the iPad (on the show Wi-Fi) or the computer, open that address in the browser.
3. The header changes from **SIMULATION ONLY** to **LIVE · ART-NET 192.168.8.50**. You're live.
   - **Send to lights: On/Off** (next to the LIVE pill, top right) pauses the output: the lights hold
     their look while you program, then follow the app again when you switch it back on.
   - **One device controls the lights at a time**: the one that connected most recently. Any other open
     copy shows **VIEWING ONLY** and a **Take control** button.
   - **PATCH → DMX Output Monitor → Preview safe look** shows the safe look on screen **and on the
     lights**; tap it again to return to the show.
4. **Test the failsafe**: with the app live, lock the iPad (or close the browser tab). About a second
   later the lights fade over 3 seconds to the safe look; unlock and reopen to return to the show.
5. To stop, close the bridge window. The lights **fade to blackout** over 1.5 seconds first (setting:
   `onClose`), so the rig never sits on a leftover look.

On Mac, Linux or Raspberry Pi, run `start-lps-bridge.sh` instead (`sh start-lps-bridge.sh`).

## Settings

Defaults suit the owner's rig (see `docs/network.md`). To change them, copy
`bridge-config.example.json` to `bridge-config.json` in this folder and edit it:

| Setting | Default | Meaning |
|---|---|---|
| `nodeIp` | `192.168.8.50` | The Art-Net node's address |
| `httpPort` | `8080` | Port for opening the app |
| `universes` | `{"1": 0}` | LPS universe → Art-Net universe. **Only listed universes are sent.** Add `"2": 1` only when fixtures are patched to universe 2 and it has its own output (the Pknight node outputs every universe it receives) |
| `fps` | `30` | Art-Net refresh rate |
| `lostAfterMs` | `1000` | Silence before the failsafe starts |
| `safeFadeSeconds` | `3` | Fade to the safe look |
| `returnFadeSeconds` | `0.5` | Fade back to the live show |
| `onClose` | `blackout` | When the bridge is closed: `blackout`, `safe` (the safe look) or `hold` |
| `closeFadeSeconds` | `1.5` | Fade before the bridge exits |

## Good to know

- The address opens the **newest preview build** in this folder. `http://<computer>:8080/stable` opens
  the stable `index.html`. Keep the folder up to date (download the ZIP again) to get new builds.
- The bridge sends nothing until the app has connected once, so starting it never changes the lights.
- If the **bridge stops unexpectedly** (computer crash or power loss) it can't send anything, and the
  Pknight node **holds the last values** (tested). That's why the calm-white failsafe matters during a show.
- Tests: `node tests/bridge.test.js` runs the bridge against a simulated Art-Net node.

## Troubleshooting

- **Lights flicker, colours or movement act strangely, but they work in QLC+:** make sure **QLC+ (or any other
  lighting program) is closed** while the bridge runs. Two programs sending to the node at once fight over
  the lights. Also check `bridge-config.json` (if you made one) lists only universe 1 unless you really use 2.
