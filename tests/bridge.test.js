// End-to-end test of the LPS Bridge: a real bridge, a fake Art-Net node and a browser.
//
// Usage: node tests/bridge.test.js
// Starts bridge/lps-bridge.js on test ports, opens the newest preview build from it, and checks:
// the app connects; Art-Net packets are valid ArtDmx; their values match the app's DMX engine;
// "Send to lights" off holds the output; closing the app fades to the safe look; reopening returns.
// Exit code is 0 when every check passes.

const path = require('path');
const dgram = require('dgram');
const { spawn } = require('child_process');
const { chromium, devices } = require('playwright');

const HTTP_PORT = 18080, NODE_PORT = 16454;
const results = [];
const check = (name, ok, detail = '') => results.push({ name, ok, detail });
const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  // Fake Art-Net node: keep the latest ArtDmx packet per Art-Net universe.
  const packets = [];
  const node = dgram.createSocket('udp4');
  node.on('message', msg => packets.push({ at: Date.now(), msg }));
  await new Promise(r => node.bind(NODE_PORT, '127.0.0.1', r));
  const latest = universe => {
    for (let k = packets.length - 1; k >= 0; k--) {
      const m = packets[k].msg;
      if ((m[14] | (m[15] << 8)) === universe) return m;
    }
    return null;
  };
  const values = (universe, from, n) => { const m = latest(universe); return m ? [...m.subarray(18 + from - 1, 18 + from - 1 + n)] : null; };

  const bridge = spawn(process.execPath, [path.join(__dirname, '..', 'bridge', 'lps-bridge.js')], {
    env: { ...process.env, LPS_NODE_IP: '127.0.0.1', LPS_ARTNET_PORT: String(NODE_PORT), LPS_HTTP_PORT: String(HTTP_PORT) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let bridgeLog = '';
  bridge.stdout.on('data', d => { bridgeLog += d; });
  bridge.stderr.on('data', d => { bridgeLog += d; });
  await wait(800);

  const browser = await chromium.launch();
  try {
    check('Bridge: starts and prints the address to open', /LPS Bridge .* is running/.test(bridgeLog), bridgeLog.split('\n')[1] || '');
    const status = await (await fetch(`http://127.0.0.1:${HTTP_PORT}/bridge/status`)).json();
    check('Bridge: status endpoint answers', status.lpsBridge && status.node === '127.0.0.1', JSON.stringify(status));
    const blocked = await fetch(`http://127.0.0.1:${HTTP_PORT}/..%2Fbridge%2Flps-bridge.js`);
    check('Bridge: only serves the app, nothing else from the computer', blocked.status === 404);
    check('Bridge: sends nothing before the app connects', packets.length === 0);

    const context = await browser.newContext(devices['iPad Pro 11 landscape']);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`http://127.0.0.1:${HTTP_PORT}/`);
    await page.waitForTimeout(1500);
    check('App: connects to the bridge and shows LIVE in the header',
      /LIVE · ART-NET 127\.0\.0\.1/.test(await page.textContent('header .status')), await page.textContent('header .status'));
    check('App: shows the "Send to lights" switch', await page.isVisible('#bridgeOutput'));

    const m = latest(0);
    const header = m && m.subarray(0, 8).toString('ascii') === 'Art-Net\0' && m.readUInt16LE(8) === 0x5000
      && m.readUInt16BE(10) === 14 && m.readUInt16BE(16) === 512 && m.length === 530;
    check('Art-Net: packets are valid ArtDmx (Art-Net 4, 512 channels)', !!header);
    check('Art-Net: universe 1 goes to Art-Net universe 0 and universe 2 to 1', !!latest(0) && !!latest(1));
    const first = packets.length; await wait(1000); const rate = packets.length - first;
    check('Art-Net: refreshes about 30 times a second per universe', rate >= 40 && rate <= 80, `${rate} packets/s for 2 universes`);

    await page.locator('[data-quick-group="pars"]').tap();
    await page.locator('#swatches .swatch', { hasText: 'RED' }).tap();
    await wait(400);
    const app = await page.evaluate(() => [...window.LPSDMX.frame()[1]]);
    const sent = values(0, 1, 512);
    check('Art-Net: values match the app\'s DMX engine exactly', JSON.stringify(app) === JSON.stringify(sent));
    check('Art-Net: PAR 1 red arrives as dimmer + red', JSON.stringify(values(0, 1, 2)) === JSON.stringify([app[0], 255]), JSON.stringify(values(0, 1, 7)));

    await page.locator('#bridgeOutput').tap();
    await page.locator('#swatches .swatch', { hasText: 'BLUE' }).tap();
    await wait(400);
    check('Send to lights off: the lights hold their look while programming', values(0, 2, 3).join() === '255,0,0', values(0, 1, 7).join());
    await page.locator('#bridgeOutput').tap();
    await wait(400);
    check('Send to lights on: the lights follow the app again', values(0, 2, 3).join() === '0,0,255', values(0, 1, 7).join());

    // v0.3.44: Preview safe look also sends the safe look to the lights while it's on.
    const safe = await page.evaluate(() => [...window.LPSDMX.safeFrame()[1].slice(0, 7)]);
    await page.evaluate(() => { document.getElementById('lpsWorkspaceToggle').click(); document.querySelector('.tabs [data-tab="patch"]').click();
      document.querySelectorAll('#patch details').forEach(d => { d.open = true; }); });
    await page.locator('#safeLookPreview').click();
    await wait(400);
    check('Preview safe look: shows the safe look on the lights', values(0, 1, 7).join() === safe.join(), values(0, 1, 7).join());
    await page.locator('#safeLookPreview').click();
    await wait(400);
    check('Preview safe look: tapping again returns the lights to the show', values(0, 2, 3).join() === '0,0,255', values(0, 1, 7).join());

    // v0.3.44: one device controls the lights. A second device takes control; the first only views.
    const second = await context.newPage();
    await second.goto(`http://127.0.0.1:${HTTP_PORT}/`);
    await wait(1500);
    check('Control: the newest device takes control', /LIVE/.test(await second.textContent('header .status')));
    check('Control: the other device shows Viewing only and a Take control button',
      /VIEWING ONLY/.test(await page.textContent('header .status')) && (await page.textContent('#bridgeOutput')) === 'Take control',
      await page.textContent('header .status'));
    await page.evaluate(() => [...document.querySelectorAll('#swatches .swatch')].find(x => x.textContent.trim() === 'GREEN').click());
    await wait(400);
    const secondFrame = await second.evaluate(() => [...window.LPSDMX.frame()[1]]);
    check('Control: the viewing device can\'t change the lights', JSON.stringify(values(0, 1, 512)) === JSON.stringify(secondFrame));
    await page.locator('#bridgeOutput').click();
    await wait(1200);
    check('Control: Take control hands the lights back', /LIVE/.test(await page.textContent('header .status'))
      && /VIEWING ONLY/.test(await second.textContent('header .status')), await page.textContent('header .status'));
    check('Control: the lights follow the device in control', values(0, 2, 3).join() === '0,255,0', values(0, 1, 7).join());

    // The controlling device is lost while another device is still open (viewing): failsafe must still run.
    await page.close(); // the app disappears (iPad asleep, Wi-Fi drop, app closed)
    await wait(1000 + 1500);
    const mid = values(0, 1, 7);
    // Halfway from the green look (dimmer 204, green) to calm white (dimmer 102, white): in between.
    check('Failsafe: starts fading to the safe look about a second after the controlling device is lost',
      mid[0] < 204 && mid[0] > 102 && mid[1] > 0 && mid[1] < 255, mid.join());
    await wait(2000);
    check('Failsafe: holds the calm-white safe look', values(0, 1, 7).join() === safe.join(), `${values(0, 1, 7).join()} (expected ${safe.join()})`);
    check('Failsafe: keeps refreshing the node while the app is away', Date.now() - packets[packets.length - 1].at < 200);

    check('Failsafe: works even while another device is open but viewing',
      /VIEWING ONLY|RECONNECTING|LIVE/.test(await second.textContent('header .status')));
    await second.close();
    const page2 = await context.newPage();
    await page2.goto(`http://127.0.0.1:${HTTP_PORT}/`);
    await wait(2500);
    const reopened = await page2.evaluate(() => [...window.LPSDMX.frame()[1]]);
    check('Failsafe: when the app returns, the bridge follows the app again',
      JSON.stringify(values(0, 1, 512)) === JSON.stringify(reopened), values(0, 1, 7).join());
    check('App: no errors', errors.length === 0, errors.slice(0, 2).join(' / '));
    await context.close();
  } catch (e) {
    check('Test run', false, e.message.split('\n')[0]);
  } finally {
    await browser.close();
    bridge.kill();
    node.close();
  }
  let failed = 0;
  for (const r of results) {
    if (!r.ok) failed++;
    console.log(`  ${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.detail ? '  (' + r.detail + ')' : ''}`);
  }
  console.log(failed ? `\n${failed} check(s) failed.` : '\nAll bridge checks passed.');
  process.exit(failed ? 1 : 0);
})();
