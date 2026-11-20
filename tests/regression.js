// Lilly Pad Studios regression tests.
// Opens a build in a real browser (Chromium via Playwright) and checks that
// core features still work, so a visual change can't quietly break an effect.
//
// Usage:   node tests/regression.js <build.html> [more builds...]
// Example: node tests/regression.js preview/Lilly_Pad_Studios_v0.3.35_Code_Cleanup_TEST.html
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

  // 7. Show workflow with real finger taps: colours, Undo/Redo, cues and GO, save and reopen.
  {
    const { context, page, errors } = await newPage(browser, file, 'iPad landscape');
    const dialogs = [];
    page.on('dialog', d => { dialogs.push(d.message()); d.dismiss(); });
    // The stage redraws on the next animation frame, so give it a moment before reading it.
    const look = async () => { await page.waitForTimeout(150); return page.evaluate(() =>
      [...document.querySelectorAll('.fixture .beam-guide')].map(x => x.getAttribute('fill')).join('|')); };
    const swatch = name => page.locator('#swatches .swatch', { hasText: name }).tap();
    const base = await look();
    await page.locator('[data-quick-group="pars"]').tap();
    await swatch('RED'); const red = await look();
    await swatch('BLUE'); const blue = await look();
    check('Workflow: colour taps change the stage', red !== base && blue !== red);
    await page.locator('#lpsUndo').tap(); const u1 = await look();
    await page.locator('#lpsUndo').tap(); const u2 = await look();
    await page.locator('#lpsRedo').tap(); const r1 = await look();
    check('Workflow: Undo steps back through colour changes', u1 === red && u2 === base);
    check('Workflow: Redo re-applies an undone change', r1 === red);

    await page.locator('#lpsSTC').tap();
    await swatch('BLUE');
    await page.locator('#lpsSTC').tap();
    const cueCount = () => page.evaluate(() => document.querySelectorAll('#cueList > *').length);
    check('Workflow: Save Cue captures cues', (await cueCount()) === 2, `${await cueCount()} cues`);
    await click(page, '#lpsWorkspaceToggle');
    await click(page, '.tabs [data-tab="show"]');
    await click(page, '#goCue'); const g1 = await look();
    await click(page, '#goCue'); const g2 = await look();
    check('Workflow: GO steps between cues', new Set([g1, g2]).size === 2 && [g1, g2].includes(red) && [g1, g2].includes(blue));

    await page.locator('#lpsSaveShow').tap();
    const saved = await look();
    await page.reload(); await page.waitForTimeout(800);
    check('Workflow: reopening restores the stage', (await look()) === saved);
    check('Workflow: reopening restores the cues', (await cueCount()) === 2);
    check('Workflow: no pop-up dialogs interrupt the show', dialogs.length === 0, dialogs.join(' / '));
    check('Workflow: no errors', errors.length === 0, errors.slice(0, 2).join(' / '));
    await context.close();
  }

  // 8. Export JSON produces a valid show file, and Import JSON brings it back.
  {
    const { context, page, errors } = await newPage(browser, file, 'iPad landscape');
    page.on('dialog', d => d.accept()); // the import confirmation is the one intended prompt
    // The stage redraws on the next animation frame, so give it a moment before reading it.
    const look = async () => { await page.waitForTimeout(150); return page.evaluate(() =>
      [...document.querySelectorAll('.fixture .beam-guide')].map(x => x.getAttribute('fill')).join('|')); };
    await page.locator('[data-quick-group="pars"]').tap();
    await page.locator('#swatches .swatch', { hasText: 'RED' }).tap();
    const exported = await look();
    await page.evaluate(() => { document.getElementById('lpsFileMenu').open = true; });
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 5000 }).catch(() => null),
      click(page, '#lpsExportShow')]);
    let json = null;
    try { json = JSON.parse(require('fs').readFileSync(await download.path(), 'utf8')); } catch (e) { /* reported below */ }
    check('Files: Export JSON downloads a valid show file',
      !!json && Array.isArray(json.fixtures) && Array.isArray(json.cues));
    if (json) {
      await page.locator('#swatches .swatch', { hasText: 'GREEN' }).tap();
      const [chooser] = await Promise.all([
        page.waitForEvent('filechooser', { timeout: 5000 }).catch(() => null),
        click(page, '#lpsImportShow')]);
      if (chooser) { await chooser.setFiles(await download.path()); await page.waitForTimeout(800); }
      check('Files: Import JSON restores the exported show', !!chooser && (await look()) === exported);
    }
    check('Files: no errors', errors.length === 0, errors.slice(0, 2).join(' / '));
    await context.close();
  }

  // 9. A corrupted save in browser storage must not stop the app from starting.
  {
    const { context, page } = await newPage(browser, file, 'iPad landscape');
    await page.evaluate(() => {
      for (const k of Object.keys(localStorage)) if (/lps|lilly/i.test(k)) localStorage.setItem(k, '{broken');
      localStorage.setItem('lilly-pad-studios-v03', '{broken');
    });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.reload(); await page.waitForTimeout(800);
    const fixtures = await page.evaluate(() => document.querySelectorAll('.fixture').length);
    check('Files: starts cleanly when saved data is corrupted', errors.length === 0 && fixtures > 0, errors.join(' / '));
    await context.close();
  }

  // 10. The docked Stage Visualizer bar scrolls with the page instead of sticking to the top.
  {
    const { context, page } = await newPage(browser, file, 'iPad landscape');
    await page.evaluate(() => scrollTo(0, 600)); await page.waitForTimeout(150);
    const top = await page.evaluate(() => document.getElementById('stageHeading').getBoundingClientRect().top);
    check('Layout: docked Stage Visualizer bar scrolls away with the page', top < -10, `bar top ${Math.round(top)}px`);
    await context.close();
  }

  // 11. Tap every visible control on every tab, in both workspaces: nothing may throw an error
  //     or open a blocking pop-up.
  {
    const { context, page, errors } = await newPage(browser, file, 'iPad landscape');
    const dialogs = [];
    page.on('dialog', d => { dialogs.push(d.message()); d.dismiss(); });
    let tapped = 0;
    const sweep = async () => {
      await page.evaluate(() => document.querySelectorAll('details').forEach(d => { d.open = true; }));
      tapped += await page.evaluate(() => {
        const skip = /^(lpsWorkspaceToggle|detachVisualizer|restoreVisualizer|expandStage|lpsLoadShow|lpsImportShow|importProject|lpsRecovery|downloadRecovery|exportProject|lpsExportShow|mapExport)$/;
        const controls = [...document.querySelectorAll('button')]
          .filter(b => b.offsetParent !== null && !b.closest('.tabs') && !skip.test(b.id));
        controls.forEach(b => b.click());
        return controls.length;
      });
      await page.waitForTimeout(150);
    };
    await sweep();
    await click(page, '#lpsWorkspaceToggle');
    for (const tab of ['live', 'program', 'fx', 'show', 'mapping', 'patch']) {
      await click(page, `.tabs [data-tab="${tab}"]`);
      await sweep();
    }
    check('Sweep: every control can be tapped without errors', errors.length === 0 && tapped > 150,
      errors.length ? errors.slice(0, 2).join(' / ') : `${tapped} taps`);
    check('Sweep: no blocking pop-ups (messages appear in the app instead)', dialogs.length === 0, dialogs.slice(0, 3).join(' / '));
    await context.close();
  }

  // 12. Fixture drawings (v0.3.36): each type is drawn as the real unit, and only its lenses glow.
  {
    const { context, page, errors } = await newPage(browser, file, 'iPad landscape');
    const fixture = name => `.fixture[aria-label^="${name} "]`;
    const lensCount = name => page.evaluate(sel => document.querySelector(sel + ' .led')?.children.length ?? 0, fixture(name));
    check('Fixtures: OPPSK PAR shows 36 LEDs', (await lensCount('PAR 1')) === 36);
    check('Fixtures: LM30A shows two bars of 4 lenses', (await lensCount('LM30A 1')) === 8);
    check('Fixtures: LF4808 shows 48 colour sections', (await lensCount('LF4808')) === 48);
    check('Fixtures: LF4808 shows 8 white sections',
      (await page.evaluate(sel => document.querySelectorAll(sel + ' .white-section').length, fixture('LF4808'))) === 8);
    check('Fixtures: mover lens and head turn with the beam',
      await page.evaluate(sel => !!document.querySelector(sel + ' .aim-assembly .led'), fixture('MOVER 1')));

    const lensState = name => page.evaluate(sel => {
      const led = document.querySelector(sel + ' .led');
      return { fill: led.getAttribute('fill'), opacity: Number(led.getAttribute('opacity')) };
    }, fixture(name));
    await page.locator('[data-quick-group="pars"]').tap();
    await page.locator('#swatches .swatch', { hasText: 'RED' }).tap();
    await page.waitForTimeout(200);
    const lit = await lensState('PAR 1');
    check('Fixtures: lenses glow in the programmed colour', lit.fill === 'rgb(255,0,0)' && lit.opacity > 0.3, JSON.stringify(lit));
    await page.locator('#blackout').tap();
    await page.waitForTimeout(200);
    const dark = await lensState('PAR 1');
    const housing = await page.evaluate(sel => document.querySelectorAll(sel + ' circle, ' + sel + ' rect').length, fixture('PAR 1'));
    check('Fixtures: Blackout darkens the lenses but the housing stays visible', dark.opacity === 0 && housing > 36, JSON.stringify(dark));
    check('Fixtures: selection is one outline (no old dashed rings)',
      await page.evaluate(() => document.querySelectorAll('.fixture .select-ring').length === document.querySelectorAll('.fixture').length
        && !document.querySelector('.fixture circle.core')));
    check('Fixtures: no errors', errors.length === 0, errors.slice(0, 2).join(' / '));
    await context.close();
  }

  // 13. DMX channel maps match the owner's manuals (docs/fixture-channels.md) and are verified.
  {
    const { context, page } = await newPage(browser, file, 'iPad landscape');
    await click(page, '#selectAll');
    await page.waitForTimeout(200);
    const details = await page.evaluate(() => document.getElementById('fixtureProfileDetails').textContent);
    const expected = {
      'PAR 1': '1 Master dimmer · 2 Red · 3 Green · 4 Blue · 5 RGB colour function · 6 Strobe speed · 7 Mode',
      'MOVER 1': '1 Pan · 2 Pan fine · 3 Tilt · 4 Tilt fine · 5 Pan / tilt speed · 6 Master dimmer · 7 Strobe (1–25 Hz) · 8 Red · 9 Green · 10 Blue · 11 White · 12 Macro: DMX / auto / sound · 13 Reset',
      'LF4808': '1 Aiming · 2 Red · 3 Green · 4 Blue · 5 White · 6 Pigment (colour preset) · 7 RGB pattern · 8 RGB pattern speed · 9 White pattern · 10 White pattern speed · 11 RGBW strobe · 12 RGBW pattern · 13 RGBW pattern speed · 14 Background colour · 15 Background colour brightness',
      'LM30A 1': '1 Tilt motor 1 · 2 Tilt motor 2 · 3 Master dimmer · 4 Strobe · 5 Red bar 1 · 6 Green bar 1 · 7 Blue bar 1 · 8 White bar 1 · 9 White bar 2 · 10 Blue bar 2 · 11 Green bar 2 · 12 Red bar 2 · 13 Reset / sound',
    };
    for (const [name, channels] of Object.entries(expected)) {
      const block = details.split(/\n(?=\S)/).find(b => b.startsWith(name + ':')) || '';
      check(`Profiles: ${name} channel map matches the manual and is verified`, block.includes('verified') && block.includes(channels));
    }
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
