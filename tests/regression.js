// Lilly Pad Studios regression tests.
// Opens a build in a real browser (Chromium via Playwright) and checks that
// core features still work, so a visual change can't quietly break an effect.
//
// Usage:   node tests/regression.js <build.html> [more builds...]
// Example: node tests/regression.js preview/Lilly_Pad_Studios_v0.3.30_Fan_Outward_FIX_TEST.html
// Needs:   Playwright (npm install playwright, then npx playwright install chromium)
//
// Exit code is 0 when every check passes, 1 otherwise.

const path = require('path');
const { chromium, devices } = require('playwright');

const VIEWS = {
  'iPad landscape': { ...devices['iPad Pro 11 landscape'] },
  'iPad portrait': { ...devices['iPad Pro 11'] },
  'Desktop': { viewport: { width: 1440, height: 900 } },
};

// Reads every selected mover's beam rotation, e.g. [-12.3, 12.3].
const moverAngles = (page) => page.evaluate(() =>
  [...document.querySelectorAll('.fixture.multi-selected .aim-assembly')].map(a => {
    const m = (a.getAttribute('transform') || '').match(/rotate\((-?[\d.]+)\)/);
    return m ? Number(m[1]) : 0;
  }));

// Reads every fixture's beam colour and brightness, to see if a colour effect is running.
const fixtureColours = (page) => page.evaluate(() =>
  [...document.querySelectorAll('.fixture')].map(g =>
    ['fill', 'fill-opacity'].map(a => g.querySelector('.beam-guide')?.getAttribute(a) || '').join(',')).join('|'));

const click = (page, selector) => page.evaluate(s => {
  const el = document.querySelector(s);
  if (!el) throw new Error('Missing control: ' + s);
  el.click();
}, selector);

async function newPage(browser, file, view, reducedMotion = 'no-preference') {
  const context = await browser.newContext({ ...VIEWS[view], reducedMotion });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('file://' + path.resolve(file));
  await page.waitForTimeout(800);
  return { context, page, errors };
}

async function testBuild(browser, file) {
  const results = [];
  const check = (name, ok, detail = '') => results.push({ name, ok, detail });

  // 1. Loads without JavaScript errors on iPad (both orientations) and desktop.
  for (const view of Object.keys(VIEWS)) {
    const { context, page, errors } = await newPage(browser, file, view);
    const fixtures = await page.evaluate(() => document.querySelectorAll('.fixture').length);
    check(`Loads with no errors · ${view}`, errors.length === 0 && fixtures > 0,
      errors.length ? errors.slice(0, 2).join(' / ') : `${fixtures} fixtures on stage`);
    await context.close();
  }

  // 2. Every Move FX moves the beams, with the device's Reduce Motion setting on and off.
  for (const reducedMotion of ['reduce', 'no-preference']) {
    for (const mode of ['circle', 'sweep', 'eight']) {
      const { context, page, errors } = await newPage(browser, file, 'iPad landscape', reducedMotion);
      await click(page, '[data-quick-group="movers"]');
      await click(page, `[data-move-fx="${mode}"]`);
      await page.waitForTimeout(300);
      const a = await moverAngles(page);
      await page.waitForTimeout(900);
      const b = await moverAngles(page);
      const moved = a.length >= 2 && a.some((v, i) => Math.abs(v - b[i]) > 0.5);
      check(`Move FX ${mode} animates · Reduce Motion ${reducedMotion === 'reduce' ? 'on' : 'off'}`,
        moved && errors.length === 0, `angles ${a.map(v => v.toFixed(1))} → ${b.map(v => v.toFixed(1))}`);
      await context.close();
    }
  }

  // 3. Fan was removed in v0.3.31 (Sweep with Mirror: Pan covers it); its button must stay gone.
  {
    const { context, page, errors } = await newPage(browser, file, 'iPad landscape');
    const fanButton = await page.evaluate(() => !!document.querySelector('[data-move-fx="fan"]'));
    check('Fan Move FX button is removed', !fanButton);
    await context.close();
  }

  // 4. Fold-out sections hold the right panels. In v0.3.32 and earlier every FX ENGINE section
  //    was shifted one down (Flash FX was empty) because panels were placed by position.
  {
    const { context, page } = await newPage(browser, file, 'iPad landscape');
    const sections = await page.evaluate(() => {
      const out = {};
      document.querySelectorAll('details.lps-accordion').forEach(d => {
        out[d.querySelector('summary').textContent.trim()] = d.querySelector('.lps-accordion-body');
      });
      const has = (title, sel) => !!out[title]?.querySelector(sel);
      return {
        'Flash FX holds the flash controls': has('Flash FX', '.fx-flash-controls'),
        'Movement FX holds the Move FX panel': has('Movement FX', '#moveFxBox'),
        'Effect Library holds the effect parameters': has('Effect Library & Parameters', '#fxContextPanel'),
        'Effect Programming holds the designer status': has('Effect Programming', '#fxDesignerStatus'),
        'Channel Controls holds the Master Dimmer': has('Channel Controls & Dimmer', '#dimmer'),
        'Strobe & Shutter holds the strobe pattern': has('Strobe & Shutter', '.strobe-parameters'),
      };
    });
    for (const [name, ok] of Object.entries(sections)) check(`Section: ${name}`, ok);
    await context.close();
  }

  // 5. Layout order (v0.3.34): the stage view comes straight after the Stage Visualizer bar,
  //    and the view controls sit at the bottom of the panel.
  {
    const { context, page } = await newPage(browser, file, 'iPad landscape');
    const order = await page.evaluate(() => {
      const kids = [...document.querySelector('#lightingStagePanel .lps-stage-scroll').children];
      const first = kids.find(k => k.offsetParent !== null);
      const controls = document.querySelector('.lps-view-controls');
      return { stageFirst: first && first.id === 'stage', controlsLast: !!controls && kids[kids.length - 1] === controls,
        zoomInside: !!controls && !!controls.querySelector('#stageZoom') };
    });
    check('Layout: stage view sits directly under the Stage Visualizer bar', order.stageFirst);
    check('Layout: View & Layout controls are at the bottom', order.controlsLast && order.zoomInside);
    await context.close();
  }

  // 6. Colour effects change fixture colours over time.
  for (const fx of ['chase', 'rainbow']) {
    const { context, page, errors } = await newPage(browser, file, 'iPad landscape');
    await click(page, '[data-quick-group="pars"]');
    await click(page, `[data-fx="${fx}"]`);
    await page.waitForTimeout(300);
    const a = await fixtureColours(page);
    let b = a;
    for (let k = 0; k < 6 && b === a; k++) { await page.waitForTimeout(200); b = await fixtureColours(page); }
    check(`Colour FX ${fx} changes the stage`, a !== b && errors.length === 0);
    await context.close();
  }

  return results;
}

(async () => {
  const files = process.argv.slice(2);
  if (!files.length) {
    console.log('Usage: node tests/regression.js <build.html> [more builds...]');
    process.exit(1);
  }
  const browser = await chromium.launch();
  let failed = 0;
  for (const file of files) {
    console.log(`\n${path.basename(file)}`);
    let results;
    try {
      results = await testBuild(browser, file);
    } catch (e) {
      results = [{ name: 'Test run', ok: false, detail: e.message.split('\n')[0] }];
    }
    for (const r of results) {
      if (!r.ok) failed++;
      console.log(`  ${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.detail ? '  (' + r.detail + ')' : ''}`);
    }
  }
  await browser.close();
  console.log(failed ? `\n${failed} check(s) failed.` : '\nAll checks passed.');
  process.exit(failed ? 1 : 0);
})();
