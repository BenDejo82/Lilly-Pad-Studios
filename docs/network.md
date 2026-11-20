# Show network — owner's rig

Lighting shares the owner's dedicated audio network (the one the iPad uses to control the
Behringer X32 Rack). Art-Net for one universe is light traffic (about 20–25 KB/s), so one network
is fine for this rig. Split lighting onto its own network or VLAN only if the rig grows to many
universes.

## Addresses (subnet 192.168.8.0 / 255.255.255.0)

| Device | IP address | How it's set |
|---|---|---|
| Router: GL.iNet travel router (Slate AX style, 2 × LAN + WAN) | 192.168.8.1 (settings page) | Automatic range (DHCP) 192.168.8.100–249 |
| Behringer X32 Rack | **192.168.8.200** | Fixed; **reserved in the router** so it's never handed to another device |
| Pknight CR011R Art-Net node | **192.168.8.50** | Fixed, set on the node's OLED menu; mask 255.255.255.0 |
| LPS Bridge computer (planned) | 192.168.8.60 | Fixed, when the bridge exists |
| iPad, phones, laptops | automatic (DHCP) | Router |

Keep .50 and .60 outside the router's automatic (DHCP) range, or reserve them too.

**Ports:** gear goes in **LAN1 / LAN2** (e.g. LAN1 = X32 Rack, LAN2 = Art-Net node). **WAN** is only for an
internet uplink; anything plugged in there is not on the show network. For more wired devices (e.g. a
wired show computer), add a small unmanaged switch to one LAN port. PC and iPad join the router's Wi-Fi.

**Node IP note:** the Pknight CR011R's IP can't be changed from its own buttons (it reverts to
10.201.6.100). It was set to 192.168.8.50 with **DMX-Workshop** (Windows), with the PC's Ethernet
temporarily on 10.201.6.10 / 255.0.0.0 and the node cabled straight to the PC. Because the node sets its
own address, it doesn't appear in the router's client list; check it with `ping 192.168.8.50`.

## Art-Net

- Node mode: **Art-Net → DMX output** (default; blue LED solid). Universe **0** (shown as
  "Universe 1" in QLC+).
- Node connected by **Ethernet** to the router/switch, never Wi-Fi.
- Always send Art-Net **unicast to 192.168.8.50**, never broadcast: broadcast traffic slows the Wi-Fi
  the iPad uses for the mixer. The LPS Bridge must send unicast.
- Node indicators: left green Ethernet LED = link; right green LED blinks fast = Art-Net arriving.

## Pre-show check

Run lights (QLC+ or LPS) while moving faders on the X32 from the iPad, and confirm the mixer stays
responsive.
