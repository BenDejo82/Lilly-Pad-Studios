#!/usr/bin/env node
'use strict';
/*
 * LPS Bridge — connects Lilly Pad Studios to real lights.
 *
 * Browsers can't send Art-Net, so this small program does it for them:
 *   1. It serves Lilly Pad Studios on the show network (open http://<this computer>:8080).
 *   2. The app streams its DMX values here over a WebSocket (/bridge), and the bridge sends them
 *      as Art-Net, unicast, to the Art-Net node (default 192.168.8.50).
 *   3. Failsafe: if the app goes quiet for 1 s (iPad asleep, Wi-Fi drop, app closed) the bridge
 *      fades over 3 s to the show's safe look (calm white by default) and holds it until the app
 *      returns, then fades back to the live show.
 *   4. One device controls the lights at a time: the most recently connected copy of the app.
 *      Other copies are "viewing only" until they tap Take control. Only the controlling device's
 *      messages count, so the failsafe watches the device that is actually running the show.
 *
 * Plain Node.js (18 or newer), no extra packages. Runs on Windows, Mac, Linux and Raspberry Pi.
 * Settings: bridge-config.json next to this file (see bridge-config.example.json).
 * Run: node lps-bridge.js   (or double-click "Start LPS Bridge.bat" on Windows)
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const dgram = require('dgram');
const crypto = require('crypto');
const os = require('os');

const VERSION = '0.2.0';
const ROOT = path.resolve(__dirname, '..');
const DEFAULTS = {
  nodeIp: '192.168.8.50',   // the Art-Net node
  artnetPort: 6454,         // standard Art-Net port
  httpPort: 8080,           // where the app is served
  universes: { 1: 0, 2: 1 }, // LPS universe -> Art-Net universe (Net 0, Sub-Net 0)
  fps: 30,                  // Art-Net refresh rate
  lostAfterMs: 1000,        // silence before the failsafe starts
  safeFadeSeconds: 3,       // fade to the safe look
  returnFadeSeconds: 0.5,   // fade back to the live show
};

function loadConfig() {
  let file = {};
  const configPath = path.join(__dirname, 'bridge-config.json');
  if (fs.existsSync(configPath)) {
    try { file = JSON.parse(fs.readFileSync(configPath, 'utf8')); }
    catch (e) { console.error(`Couldn't read bridge-config.json (${e.message}); using defaults.`); }
  }
  const c = { ...DEFAULTS, ...file };
  // Environment overrides (used by the automated tests).
  if (process.env.LPS_NODE_IP) c.nodeIp = process.env.LPS_NODE_IP;
  if (process.env.LPS_ARTNET_PORT) c.artnetPort = Number(process.env.LPS_ARTNET_PORT);
  if (process.env.LPS_HTTP_PORT) c.httpPort = Number(process.env.LPS_HTTP_PORT);
  return c;
}
const config = loadConfig();

// ───────────── Art-Net ─────────────
// ArtDmx packet (Art-Net 4): "Art-Net\0", OpOutput 0x5000 (little-endian), protocol 14,
// sequence, physical, SubUni + Net (15-bit port address), length (big-endian), data.
let sequence = 0;
function artDmx(portAddress, data) {
  const packet = Buffer.alloc(18 + 512);
  packet.write('Art-Net\0', 0, 'ascii');
  packet.writeUInt16LE(0x5000, 8);
  packet.writeUInt16BE(14, 10);
  sequence = sequence % 255 + 1;
  packet[12] = sequence;
  packet[13] = 0;
  packet[14] = portAddress & 0xff;          // Sub-Net (high nibble) + Universe (low nibble)
  packet[15] = (portAddress >> 8) & 0x7f;   // Net
  packet.writeUInt16BE(512, 16);
  Buffer.from(data).copy(packet, 18, 0, 512);
  return packet;
}
const udp = dgram.createSocket('udp4');
udp.on('error', e => console.error('Art-Net socket error:', e.message));

// ───────────── Output state and failsafe ─────────────
const lpsUniverses = Object.keys(config.universes).map(Number);
const blank = () => Object.fromEntries(lpsUniverses.map(u => [u, new Uint8Array(512)]));
let live = null;            // latest live frame from the app
let safe = null;            // latest safe-look frame from the app
let output = blank();       // what is being sent right now
let lastMessage = 0;        // when the app last sent anything
let sendEnabled = true;     // the app's "Send to lights" switch
let controller = null;      // the one connection allowed to control the lights
let mode = 'waiting';       // waiting | live | paused | fading-to-safe | safe | returning
let fade = null;            // { from, to, start, seconds, next }

const mix = (a, b, t) => Object.fromEntries(lpsUniverses.map(u =>
  [u, Uint8Array.from(a[u], (v, k) => Math.round(v + (b[u][k] - v) * t))]));
const copy = f => Object.fromEntries(lpsUniverses.map(u => [u, Uint8Array.from(f[u])]));

function step(now) {
  if (!live) return; // nothing sent until the app has connected at least once
  const quiet = now - lastMessage > config.lostAfterMs;
  if (quiet && !['fading-to-safe', 'safe'].includes(mode)) {
    mode = 'fading-to-safe';
    fade = { from: copy(output), start: now, seconds: config.safeFadeSeconds, next: 'safe' };
    log(`App lost: fading to the safe look over ${config.safeFadeSeconds} s.`);
  } else if (!quiet && ['fading-to-safe', 'safe'].includes(mode)) {
    mode = 'returning';
    fade = { from: copy(output), start: now, seconds: config.returnFadeSeconds, next: 'live' };
    log('App back: returning to the live show.');
  }
  if (mode === 'fading-to-safe' || mode === 'returning') {
    const target = mode === 'fading-to-safe' ? (safe || blank()) : live;
    const t = Math.min(1, (now - fade.start) / 1000 / fade.seconds);
    output = mix(fade.from, target, t);
    if (t >= 1) { mode = fade.next; fade = null; }
  } else if (mode === 'safe') {
    output = copy(safe || blank());
  } else if (sendEnabled) {
    mode = 'live';
    output = copy(live);
  } else {
    mode = 'paused'; // "Send to lights" off: hold the current output, ignore new changes
  }
  for (const u of lpsUniverses) {
    udp.send(artDmx(config.universes[u], output[u]), config.artnetPort, config.nodeIp);
  }
}
setInterval(() => step(Date.now()), Math.round(1000 / config.fps));

// ───────────── Messages from the app ─────────────
// Binary message: byte 0 = type (1 = live, 2 = safe look, 3 = take control), byte 1 = flags
// (bit 0 = send to lights), then 512 bytes for each LPS universe in order 1, 2.
// Frames from a device that isn't in control are ignored.
function onAppMessage(socket, buf) {
  if (buf[0] === 3) { giveControl(socket); return; }
  if (socket !== controller || buf.length !== 2 + 512 * lpsUniverses.length) return;
  const frame = Object.fromEntries(lpsUniverses.map((u, k) => [u, new Uint8Array(buf.subarray(2 + k * 512, 2 + (k + 1) * 512))]));
  lastMessage = Date.now();
  if (buf[0] === 1) { live = frame; sendEnabled = (buf[1] & 1) === 1; }
  else if (buf[0] === 2) safe = frame;
}

// ───────────── Minimal WebSocket server (RFC 6455) ─────────────
const clients = new Set();
function wsHandshake(req, socket) {
  const key = req.headers['sec-websocket-key'];
  if (!key) return socket.destroy();
  const accept = crypto.createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  socket.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\n\r\n`);
  socket.setNoDelay(true);
  clients.add(socket);
  log(`App connected (${socket.remoteAddress}).`);
  giveControl(socket); // the newest device takes control
  let pending = Buffer.alloc(0);
  socket.on('data', chunk => {
    pending = Buffer.concat([pending, chunk]);
    while (pending.length >= 2) {
      const opcode = pending[0] & 0x0f, masked = (pending[1] & 0x80) !== 0;
      let len = pending[1] & 0x7f, offset = 2;
      if (len === 126) { if (pending.length < 4) return; len = pending.readUInt16BE(2); offset = 4; }
      else if (len === 127) { if (pending.length < 10) return; len = Number(pending.readBigUInt64BE(2)); offset = 10; }
      if (len > 1 << 20) return socket.destroy(); // nothing legitimate is this big
      const maskEnd = offset + (masked ? 4 : 0);
      if (pending.length < maskEnd + len) return;
      const payload = Buffer.from(pending.subarray(maskEnd, maskEnd + len));
      if (masked) { const mask = pending.subarray(offset, maskEnd); for (let i = 0; i < len; i++) payload[i] ^= mask[i & 3]; }
      pending = pending.subarray(maskEnd + len);
      if (opcode === 0x2) onAppMessage(socket, payload);
      else if (opcode === 0x9) wsSend(socket, payload, 0xA);     // ping -> pong
      else if (opcode === 0x8) { wsSend(socket, Buffer.alloc(0), 0x8); socket.end(); }
    }
  });
  const gone = () => {
    if (!clients.delete(socket)) return;
    log('App disconnected.');
    if (socket === controller) { controller = null; log('The controlling device left: no device is in control.'); broadcastStatus(); }
  };
  socket.on('close', gone);
  socket.on('error', gone);
}
function wsSend(socket, data, opcode = 0x1) {
  const body = Buffer.isBuffer(data) ? data : Buffer.from(String(data));
  const head = body.length < 126 ? Buffer.from([0x80 | opcode, body.length])
    : Buffer.from([0x80 | opcode, 126, body.length >> 8, body.length & 255]);
  try { socket.write(Buffer.concat([head, body])); } catch (e) { /* closing */ }
}
function giveControl(socket) {
  if (controller === socket) return;
  controller = socket;
  lastMessage = Date.now();
  log(`Control: ${socket.remoteAddress} now controls the lights.`);
  broadcastStatus();
}
function status(socket) {
  return { lpsBridge: VERSION, node: config.nodeIp, universes: config.universes, mode, sendEnabled,
    clients: clients.size, inControl: socket ? socket === controller : undefined, hasController: !!controller };
}
function broadcastStatus() { for (const c of clients) wsSend(c, JSON.stringify(status(c))); }
setInterval(broadcastStatus, 1000);

// ───────────── Web server: the app and a status endpoint ─────────────
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };
function newestPreview() {
  const dir = path.join(ROOT, 'preview');
  const version = f => (f.match(/v(\d+)\.(\d+)\.(\d+)/) || []).slice(1).map(Number);
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('.html') && version(f).length) : [];
  files.sort((a, b) => { const x = version(a), y = version(b); return x[0] - y[0] || x[1] - y[1] || x[2] - y[2]; });
  return files.length ? '/preview/' + files[files.length - 1] : '/index.html';
}
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/bridge/status') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    return res.end(JSON.stringify(status()));
  }
  if (url.pathname === '/') { res.writeHead(302, { Location: newestPreview() }); return res.end(); }
  if (url.pathname === '/stable') { res.writeHead(302, { Location: '/index.html' }); return res.end(); }
  const file = path.normalize(path.join(ROOT, decodeURIComponent(url.pathname)));
  const allowed = file.startsWith(path.join(ROOT, 'preview') + path.sep) || file === path.join(ROOT, 'index.html');
  if (!allowed || !TYPES[path.extname(file)] || !fs.existsSync(file)) { res.writeHead(404); return res.end('Not found'); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)], 'Cache-Control': 'no-store' });
  fs.createReadStream(file).pipe(res);
});
server.on('upgrade', (req, socket) => {
  if (new URL(req.url, 'http://localhost').pathname === '/bridge') wsHandshake(req, socket);
  else socket.destroy();
});

function log(message) { console.log(`[${new Date().toLocaleTimeString()}] ${message}`); }
server.listen(config.httpPort, () => {
  const addresses = Object.values(os.networkInterfaces()).flat()
    .filter(a => a && a.family === 'IPv4' && !a.internal).map(a => a.address);
  console.log(`\nLPS Bridge ${VERSION} is running.`);
  console.log(`Sending Art-Net to ${config.nodeIp} (universe 1 -> Art-Net ${config.universes[1]}).`);
  console.log('\nOpen Lilly Pad Studios from any device on the show network:');
  for (const a of addresses) console.log(`   http://${a}:${config.httpPort}`);
  console.log('\nLeave this window open during the show. Close it to stop the bridge.\n');
});
