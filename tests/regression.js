// Lilly Pad Studios regression tests.
// Opens a build in a real browser (Chromium via Playwright) and checks that
// core features still work, so a visual change can't quietly break an effect.
//
// Usage:   node tests/regression.js <build.html> [more builds...]
// Engines: LPS_BROWSER=chromium (default, Chrome/Edge) | firefox | webkit (Safari's engine)
// Example: node tests/regression.js preview/Lilly_Pad_Studios_v0.3.35_Code_Cleanup_TEST.html
// Needs:   Playwright (npm install playwright, then npx playwright install chromium firefox webkit)
//
// Exit code is 0 when every check passes, 1 otherwise.

const path = require('path');
const playwright = require('playwright');
const { devices } = playwright;
const ENGINE = process.env.LPS_BROWSER || 'chromium';
if (!['chromium', 'firefox', 'webkit'].includes(ENGINE)) throw new Error('LPS_BROWSER must be chromium, firefox or webkit');

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

// Some test browsers (e.g. headless Firefox here) have no WebGL. The app then shows a notice
// instead of 3D, and the 3D checks verify that notice rather than the 3D scene.
const hasWebGL = page => page.evaluate(() => {
  const c = document.createElement('canvas');
  return !!(c.getContext('webgl2') || c.getContext('webgl'));
});

const click = (page, selector) => page.evaluate(s => {
  const el = document.querySelector(s);
  if (!el) throw new Error('Missing control: ' + s);
  el.click();
}, selector);

async function newPage(browser, file, view, reducedMotion = 'no-preference') {
  const options = { ...VIEWS[view], reducedMotion };
  if (ENGINE === 'firefox') delete options.isMobile; // Firefox can't emulate a mobile viewport; touch still works
  const context = await browser.newContext(options);
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
    // Browsers redraw at slightly different moments, so wait (up to 2 s) for the stage to change.
    const lookAfter = async (selector, previous) => {
      await click(page, selector);
      for (let k = 0; k < 20; k++) { const now = await look(); if (now !== previous) return now; }
      return look();
    };
    const g1 = await lookAfter('#goCue', await look());
    const g2 = await lookAfter('#goCue', g1);
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

  // 14. Truss numbering (v0.3.37): numbered stage left to stage right, so from the audience
  //     (screen) the truss reads PAR 6 … PAR 1 left to right; PAR 7 is the SR floor uplight, PAR 8 the SL one.
  {
    const { context, page, errors } = await newPage(browser, file, 'iPad landscape');
    const layout = () => page.evaluate(() => [...document.querySelectorAll('.fixture')].map(g => {
      const m = g.getAttribute('transform').match(/translate\(([\d.]+),([\d.]+)/);
      return { name: g.getAttribute('aria-label').replace(/ DMX.*/, ''), x: +m[1], y: +m[2] };
    }));
    const truss = l => l.filter(f => f.y === 78).sort((a, b) => a.x - b.x).map(f => f.name).join(' · ');
    const expectedTruss = 'PAR 6 · MOVER 2 · LM30A 2 · PAR 5 · PAR 4 · LF4808 · PAR 3 · PAR 2 · LM30A 1 · MOVER 1 · PAR 1';
    let l = await layout();
    check('Numbering: truss runs stage left to stage right', truss(l) === expectedTruss, truss(l));
    const boom = n => l.find(f => f.name === n);
    check('Numbering: PAR 7 on the SR floor position (screen left), PAR 8 on the SL floor position', boom('PAR 7').x < 100 && boom('PAR 8').x > 540);
    check('Numbering: Stage Right / Stage Left and floor-position labels are shown',
      await page.evaluate(() => [...document.querySelectorAll('#stageSvg text')].map(t => t.textContent).join('|'))
        .then(t => /STAGE RIGHT/.test(t) && /STAGE LEFT/.test(t) && /SR FLOOR/.test(t) && /SL FLOOR/.test(t)));
    check('Numbering: DMX addresses unchanged',
      await page.evaluate(() => ['PAR 1 DMX 1', 'PAR 6 DMX 36', 'MOVER 1 DMX 57', 'LM30A 2 DMX 111', 'LF4808 DMX 83']
        .every(a => !!document.querySelector(`.fixture[aria-label="${a}"]`))));

    // Shows saved by earlier builds are updated once on open.
    const saveWith = (layoutVersion, xs, tweak) => page.evaluate(([layoutVersion, xs, tweak]) => {
      const key = 'lilly-pad-studios-v03', d = JSON.parse(localStorage.getItem(key));
      if (layoutVersion) d.layoutVersion = layoutVersion; else delete d.layoutVersion;
      d.fixtures.forEach((f, i) => { f.x = xs[i]; f.y = (i === 6 || i === 7) ? 175 : 78; });
      if (tweak) d.fixtures[10].x = tweak;
      localStorage.setItem(key, JSON.stringify(d));
    }, [layoutVersion, xs, tweak]);
    await page.locator('#lpsSaveShow').tap();
    // Before v0.3.37: numbered the wrong way round, with the LF4808 nudged off its default spot.
    await saveWith(null, [75, 225, 270, 370, 415, 565, 45, 595, 145, 495, 320, 190, 450], 333);
    await page.reload(); await page.waitForTimeout(800);
    l = await layout();
    check('Numbering: shows saved before v0.3.37 are renumbered on open',
      truss(l).replace('LF4808', 'X') === expectedTruss.replace('LF4808', 'X'), truss(l));
    check('Numbering: nudged truss fixtures are mirrored too', l.find(f => f.name === 'LF4808').x === 307);
    // v0.3.37: right numbering, uneven spacing.
    await page.locator('#lpsSaveShow').tap();
    await saveWith(2, [565, 415, 370, 270, 225, 75, 45, 595, 495, 145, 320, 450, 190]);
    await page.reload(); await page.waitForTimeout(800);
    l = await layout();
    check('Alignment: shows saved by v0.3.37 move to the even spacing',
      truss(l) === expectedTruss && l.find(f => f.name === 'PAR 2').x === 418);
    check('Numbering: no errors', errors.length === 0, errors.slice(0, 2).join(' / '));
    await context.close();
  }

  // 15. Alignment (v0.3.38): even truss spacing, one line for labels and palettes, every beam and
  //     palette centred under its fixture, floor PARs directly under the truss legs.
  for (const detailed of [false, true]) {
    const { context, page } = await newPage(browser, file, 'iPad landscape');
    if (detailed) { await click(page, '#stageMode'); await page.waitForTimeout(300); }
    const m = await page.evaluate(() => {
      const svg = document.getElementById('stageSvg'), inv = svg.getScreenCTM().inverse();
      const box = el => { const r = el.getBoundingClientRect(), p = svg.createSVGPoint(), q = svg.createSVGPoint();
        p.x = r.left; p.y = r.top; q.x = r.right; q.y = r.bottom; const a = p.matrixTransform(inv), b = q.matrixTransform(inv);
        return { cx: (a.x + b.x) / 2, top: a.y, bottom: b.y }; };
      const fx = [...document.querySelectorAll('.fixture')].map(g => {
        const t = g.getAttribute('transform').match(/translate\(([\d.]+),([\d.]+)\)/);
        const pick = s => g.querySelector(s) ? box(g.querySelector(s)) : null;
        return { x: +t[1], y: +t[2], beam: pick('.beam-guide'), label: pick('text'), pal: pick('.quick-color-trigger') };
      });
      const legs = document.querySelector('#stageSvg path[d^="M65 78L"]').getAttribute('d').match(/L([\d.]+) ([\d.]+)/g).map(s => s.slice(1).split(' ').map(Number));
      return { fx, legs };
    });
    const truss = m.fx.filter(f => f.y === 78).sort((a, b) => a.x - b.x);
    const gaps = truss.slice(1).map((f, i) => Math.round(f.x - truss[i].x));
    const mode = detailed ? 'Detailed view' : 'Clean view';
    check(`Alignment: truss fixtures evenly spaced · ${mode}`, new Set(gaps).size === 1, gaps.join(','));
    check(`Alignment: every beam centred under its fixture · ${mode}`, m.fx.every(f => !f.beam || Math.abs(f.beam.cx - f.x) < 0.6));
    if (detailed) {
      const one = vals => Math.max(...vals) - Math.min(...vals) < 0.6;
      check('Alignment: truss labels on one line', one(truss.map(f => f.label.bottom)));
      check('Alignment: truss palette boxes on one line and centred', one(truss.map(f => f.pal.top)) && m.fx.every(f => Math.abs(f.pal.cx - f.x) < 0.6));
      check('Alignment: labels clear of palette boxes', m.fx.every(f => f.label.bottom <= f.pal.top));
    }
    const booms = m.fx.filter(f => f.y !== 78).sort((a, b) => a.x - b.x);
    check(`Alignment: floor PARs sit directly under the truss legs · ${mode}`,
      booms.length === 2 && Math.abs(booms[0].x - m.legs[0][0]) < 0.6 && Math.abs(booms[1].x - m.legs[1][0]) < 0.6, JSON.stringify(m.legs));
    await context.close();
  }

  // 16. 3D visualizer (v0.3.39): opens on request, mirrors the rig and the show, and closes back to 2D.
  {
    const { context, page, errors } = await newPage(browser, file, 'iPad landscape');
    const toggle = page.locator('#stage3dToggle');
    check('3D: the stage opens in 2D by default',
      await page.evaluate(() => !document.getElementById('stage').hidden && (!window.LPS3D || !window.LPS3D.isOn())));
    await toggle.tap();
    await page.waitForTimeout(1500);
    if (!(await hasWebGL(page))) {
      const notice = await page.evaluate(() => document.getElementById('lpsNotice')?.textContent || '');
      check('3D: without WebGL, a clear notice appears and 2D stays usable',
        /WebGL/.test(notice) && await page.evaluate(() => !window.LPS3D.isOn() && !document.getElementById('stage').hidden), notice);
      check('3D: no errors', errors.length === 0, errors.slice(0, 2).join(' / '));
      await context.close();
    } else {
    const snap = () => page.evaluate(() => window.LPS3D.snapshot());
    let units = await snap();
    check('3D: opens with all 13 fixtures and hides the 2D view',
      units.length === 13 && await page.evaluate(() => window.LPS3D.isOn() && document.getElementById('stage').hidden
        && !!document.querySelector('#stage3d canvas')), `${units.length} fixtures`);
    const truss = units.filter(u => !u.onFloor).sort((a, b) => a.x - b.x).map(u => u.name).join(' · ');
    check('3D: truss order matches the rig (PAR 1 at stage left)',
      truss === 'PAR 6 · MOVER 2 · LM30A 2 · PAR 5 · PAR 4 · LF4808 · PAR 3 · PAR 2 · LM30A 1 · MOVER 1 · PAR 1', truss);
    const byName = n => units.find(u => u.name === n);
    check('3D: PAR 7 and PAR 8 are floor uplights at stage right and stage left',
      byName('PAR 7').onFloor && byName('PAR 8').onFloor && byName('PAR 7').x < 0 && byName('PAR 8').x > 0);

    await page.locator('[data-quick-group="pars"]').tap();
    await page.locator('#swatches .swatch', { hasText: 'RED' }).tap();
    await page.waitForTimeout(300);
    units = await snap();
    check('3D: beams follow the programmed colour', units.find(u => u.name === 'PAR 1').beam === '#ff0000'
      && units.find(u => u.name === 'PAR 1').beamOpacity > 0.1, JSON.stringify(units.find(u => u.name === 'PAR 1')));

    await page.locator('[data-quick-group="movers"]').tap();
    await click(page, '[data-move-fx="circle"]');
    await page.waitForTimeout(300);
    const pan1 = (await snap()).find(u => u.name === 'MOVER 1').pan;
    await page.waitForTimeout(900);
    const pan2 = (await snap()).find(u => u.name === 'MOVER 1').pan;
    check('3D: Move FX turns the mover heads', Math.abs(pan1 - pan2) > 0.02, `${pan1} → ${pan2}`);

    await page.locator('#blackout').tap();
    await page.waitForTimeout(300);
    check('3D: Blackout turns every beam off', (await snap()).every(u => u.beamOpacity === 0));
    await page.locator('#blackout').tap();

    await page.locator('[data-view3d="top"]').tap();
    await page.locator('[data-view3d="front"]').tap();
    await toggle.tap();
    await page.waitForTimeout(300);
    check('3D: switching back shows the 2D view again',
      await page.evaluate(() => !window.LPS3D.isOn() && !document.getElementById('stage').hidden && document.getElementById('stage3d').hidden));
    check('3D: no errors', errors.length === 0, errors.slice(0, 2).join(' / '));
    await context.close();
    }
  }

  // 17. Full screen (v0.3.40) enlarges whichever stage view is showing, in 2D and 3D, both with the
  //     browser's full screen and with the fill-the-window fallback used where that isn't available
  //     (iPhone, some iPads). Each view has its own exit button.
  for (const fallback of [false, true]) {
    const { context, page, errors } = await newPage(browser, file, 'iPad landscape');
    if (fallback) {
      await page.evaluate(() => { delete Element.prototype.requestFullscreen; Element.prototype.webkitRequestFullscreen = undefined; });
    }
    const how = fallback ? 'fallback' : 'browser full screen';
    const views = (await hasWebGL(page)) ? ['3D', '2D'] : ['2D'];
    for (const view of views) {
      const id = view === '3D' ? 'stage3d' : 'stage';
      if (view === '3D') { await page.locator('#stage3dToggle').tap(); await page.waitForTimeout(1200); }
      await click(page, '#expandStage');
      await page.waitForTimeout(700);
      const full = await page.evaluate(id => {
        const v = document.getElementById(id), target = id === 'stage3d' ? v.querySelector('canvas') : v, r = target.getBoundingClientRect();
        const covering = document.elementFromPoint(innerWidth / 2, 60);
        // Measured while full: in real full screen the window becomes the whole monitor.
        return { w: Math.round(r.width), h: Math.round(r.height), screen: [innerWidth, innerHeight],
          exit: !v.querySelector('.stage-exit-full').hidden, onTop: v.contains(covering) };
      }, id);
      check(`Full screen: ${view} fills the screen · ${how}`,
        full.w >= full.screen[0] - 2 && full.h >= full.screen[1] - 20 && full.onTop, JSON.stringify(full));
      check(`Full screen: ${view} shows its own exit button · ${how}`, full.exit);
      await page.locator(`#${id} .stage-exit-full`).click();
      await page.waitForTimeout(600);
      const after = await page.evaluate(id => ({ fs: !!document.fullscreenElement, expanded: document.getElementById(id).classList.contains('expanded'),
        label: document.getElementById('expandStage').textContent }), id);
      check(`Full screen: ${view} exit returns to the panel · ${how}`, !after.fs && !after.expanded && after.label === 'Full screen', JSON.stringify(after));
      if (view === '3D') { await page.locator('#stage3dToggle').tap(); await page.waitForTimeout(300); }
    }
    check(`Full screen: no errors · ${how}`, errors.length === 0, errors.slice(0, 2).join(' / '));
    await context.close();
  }

  // 18. DMX engine (v0.3.42): real channel values per the owner's manuals (docs/fixture-channels.md),
  //     Blackout zeros, strobe within limits, the calm-white safe look, and the on-screen monitor.
  {
    const { context, page, errors } = await newPage(browser, file, 'iPad landscape');
    const ch = (addr, n, safe = false) => page.evaluate(([addr, n, safe]) =>
      [...(safe ? window.LPSDMX.safeFrame() : window.LPSDMX.frame())[1].slice(addr - 1, addr - 1 + n)], [addr, n, safe]);
    const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
    const tapColour = async (group, colour) => {
      await page.locator(`[data-quick-group="${group}"]`).tap();
      await page.locator('#swatches .swatch', { hasText: colour }).tap();
      await page.waitForTimeout(200);
    };
    await tapColour('pars', 'RED');
    check('DMX: OPPSK PAR red = dimmer on ch 1, red on ch 2', same(await ch(1, 7), [204, 255, 0, 0, 0, 0, 0]), JSON.stringify(await ch(1, 7)));
    await tapColour('betopper', 'WHITE');
    check('DMX: LM30A white uses its white LEDs (ch 8 bar 1, ch 9 bar 2) and dimmer on ch 3',
      same(await ch(98, 13), [0, 0, 204, 0, 0, 0, 0, 255, 255, 0, 0, 0, 0]), JSON.stringify(await ch(98, 13)));
    check('DMX: LF4808 white on ch 5, scaled by the dimmer (no master dimmer channel)',
      same(await ch(83, 15), [0, 0, 0, 0, 204, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]), JSON.stringify(await ch(83, 15)));
    const mover = await ch(57, 13);
    check('DMX: DJXFLI pan/tilt centred (16-bit) with speed on ch 5 and dimmer on ch 6',
      mover[0] === 128 && mover[2] === 128 && mover[4] === 20 && mover[5] === 204, JSON.stringify(mover));

    await page.locator('[data-quick-group="movers"]').tap();
    await click(page, '#strobe');
    await page.evaluate(() => { const r = document.getElementById('rate'); r.value = 15; r.dispatchEvent(new Event('input', { bubbles: true })); });
    await page.waitForTimeout(200);
    // v0.3.44: the top of the strobe slider is each fixture's fastest strobe; Max strobe limits it.
    check('DMX: strobe slider top = the fixture\'s fastest (DJXFLI ch 7 = 255)', (await ch(57, 13))[6] === 255, String((await ch(57, 13))[6]));
    await page.locator('[data-quick-group="pars"]').tap();
    await click(page, '#strobe');
    await page.evaluate(() => { const r = document.getElementById('rate'); r.value = 15; r.dispatchEvent(new Event('input', { bubbles: true })); });
    await page.waitForTimeout(200);
    check('DMX: OPPSK PAR strobe at the slider top uses its full range (ch 6 = 255)', (await ch(1, 7))[5] === 255, String((await ch(1, 7))[5]));
    await click(page, '#strobe');
    await page.locator('[data-quick-group="movers"]').tap();
    await click(page, '#strobe');

    // v0.3.45: strobe patterns, width and offset reach the real lights (LPS flashes the dimmer).
    await page.locator('[data-quick-group="pars"]').tap();
    await click(page, '#strobe');
    await page.evaluate(() => { const m = document.getElementById('strobeMode'); m.value = 'random'; m.dispatchEvent(new Event('change', { bubbles: true })); m.dispatchEvent(new Event('input', { bubbles: true })); });
    const dims = new Set(); let fixtureStrobe = 0;
    for (let k = 0; k < 25; k++) { const v = await ch(1, 7); dims.add(v[0]); fixtureStrobe = Math.max(fixtureStrobe, v[5]); await page.waitForTimeout(40); }
    check('DMX: Random strobe pattern flashes the PAR dimmer (fixture strobe channel off)', dims.size > 1 && dims.has(0) && fixtureStrobe === 0, [...dims].join(','));
    await page.evaluate(() => { const m = document.getElementById('strobeMode'); m.value = 'regular'; m.dispatchEvent(new Event('change', { bubbles: true })); m.dispatchEvent(new Event('input', { bubbles: true })); });
    await page.waitForTimeout(150);
    check('DMX: Regular strobe at default width/offset uses the PAR\'s own strobe channel', (await ch(1, 7))[5] > 0, String((await ch(1, 7))[5]));
    await click(page, '#strobe');

    // v0.3.45: Flash FX reach the lights.
    await click(page, '#whiteStrobe');
    const flash = new Set();
    for (let k = 0; k < 25; k++) { const v = await ch(1, 7); flash.add(v[0] + ':' + v.slice(1, 4).join('/')); await page.waitForTimeout(40); }
    check('DMX: Flash FX white strobe flashes the PAR in white', [...flash].some(x => x.startsWith('255:255/255/255')) && flash.size > 1, [...flash].slice(0, 4).join(' '));
    await click(page, '#whiteStrobe');

    // v0.3.45: a White chase stays pure white, fades included (no fixture colour creeping back).
    await page.evaluate(() => document.querySelector('#lpsSimpleChaseColor [data-chase-mode="white"]')?.click());
    await click(page, '[data-fx="chase"]');
    let pure = true, seen = 0;
    for (let k = 0; k < 30; k++) {
      const frame = await page.evaluate(() => [...window.LPSDMX.frame()[1].slice(0, 56)]);
      for (let par = 0; par < 8; par++) { const [d, r, g, b] = frame.slice(par * 7, par * 7 + 4); if (d > 0) { seen++; if (!(r === g && g === b)) pure = false; } }
      await page.waitForTimeout(40);
    }
    check('DMX: White chase stays pure white on the PARs, fades included', pure && seen > 0, `${seen} lit samples`);
    await click(page, '[data-fx="static"]');

    await page.locator('#blackout').tap();
    await page.waitForTimeout(200);
    const all = await page.evaluate(() => [...window.LPSDMX.frame()[1]]);
    // Mover pan, tilt and pan/tilt speed (motor settings, not light) for MOVER 1 (057) and MOVER 2 (070).
    const moverPositions = new Set([56, 58, 60, 69, 71, 73]);
    check('DMX: Blackout sends zero on every channel except mover position and motor speed',
      all.every((v, k) => v === 0 || moverPositions.has(k)), all.map((v, k) => v && !moverPositions.has(k) ? k + 1 : null).filter(Boolean).join(','));
    await page.locator('#blackout').tap();

    check('DMX: safe look = PAR soft white at 40%', same(await ch(1, 7, true), [102, 255, 255, 255, 0, 0, 0]), JSON.stringify(await ch(1, 7, true)));
    check('DMX: safe look = mover low white, parked at centre, no strobe',
      same(await ch(57, 13, true), [128, 0, 128, 0, 20, 64, 0, 0, 0, 0, 255, 0, 0]), JSON.stringify(await ch(57, 13, true)));
    check('DMX: safe look keeps the LF4808 strobe panel off', (await ch(83, 15, true)).every(v => v === 0));

    await click(page, '#lpsWorkspaceToggle');
    await click(page, '.tabs [data-tab="patch"]');
    await page.evaluate(() => document.querySelectorAll('#patch details').forEach(d => { d.open = true; }));
    await page.waitForTimeout(400);
    check('DMX monitor: lists all 13 fixtures on universe 1',
      (await page.evaluate(() => document.querySelectorAll('#dmxMonitor .dmx-row').length)) === 13);
    check('DMX monitor: PAR 1 shows its live red value',
      await page.evaluate(() => [...document.querySelectorAll('#dmxMonitor .dmx-row')][0].textContent.includes('255')));
    await page.evaluate(() => { const m = document.getElementById('maxStrobe'); m.value = 50; m.dispatchEvent(new Event('input', { bubbles: true })); });
    await click(page, '[data-quick-group="pars"]');
    await click(page, '#strobe');
    await page.waitForTimeout(200);
    check('DMX: Max strobe at 50% halves the PAR\'s top strobe (ch 6 = 128)', (await ch(1, 7))[5] === 128, String((await ch(1, 7))[5]));
    await click(page, '#strobe');
    await page.selectOption('#safeLookSelect', 'blackout');
    await page.locator('#lpsSaveShow').tap();
    await page.reload(); await page.waitForTimeout(800);
    check('DMX: the safe-look choice is saved with the show', (await page.evaluate(() => window.LPSDMX.safeLook())) === 'blackout');
    check('DMX: the Max strobe setting is saved with the show', (await page.evaluate(() => window.LPSDMX.maxStrobe())) === 50);
    check('DMX: no errors', errors.length === 0, errors.slice(0, 2).join(' / '));
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
  // Chromium: software WebGL so the 3D view can be tested without a graphics card.
  const browser = await playwright[ENGINE].launch(ENGINE === 'chromium'
    ? { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] } : {});
  console.log(`Engine: ${ENGINE} ${browser.version()}`);
  let failed = 0;
  for (const file of files) {
    console.log(`\n${path.basename(file)}`);
    let results;
    try {
      results = await testBuild(browser, file);
    } catch (e) {
      results = [{ name: 'Test run', ok: false, detail: e.message.split('\n')[0] + ' @ ' + (e.stack.split('\n').find(l => l.includes('regression.js')) || '').trim() }];
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
