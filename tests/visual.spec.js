import { test, expect } from '@playwright/test';

/* Every approved screen, in the states the owner signed off. Baselines come from the original prototype (see playwright.config.js).
   Rules for stable shots: never move the mouse over the 3D scenes unless the shot is about hover, wait for the loaders to finish,
   and seed Math.random so the pixel wipe and the photo trail make the same picks every run. */

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    var a = 123456789;
    Math.random = function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  });
  const problems = [];
  page.on('pageerror', (e) => problems.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') problems.push(m.type() + ': ' + m.text()); });
  page.on('requestfailed', (r) => problems.push('requestfailed: ' + r.url()));
  page.on('response', (r) => { if (r.status() >= 400) problems.push(r.status() + ' ' + r.url()); });
  page.problems = problems;
});

test.afterEach(async ({ page }) => {
  /* known noise: headless GPU messages, the Canvas2D readback hint, and the wall's AudioContext waiting for a gesture */
  const real = page.problems.filter((p) => !/favicon|fonts\.(googleapis|gstatic)|GPU stall|ReadPixels|willReadFrequently|AudioContext was not allowed/.test(p));
  expect(real, 'console errors and failed requests').toEqual([]);
});

const shot = (page, name, opts = {}) => expect(page).toHaveScreenshot(name + '.png', opts);

async function open(page, hash = '') {
  await page.goto('/' + hash);
  await page.waitForFunction(() => document.documentElement.dataset.ready === 'true', null, { timeout: 30000 });
  await page.evaluate(() => document.fonts.ready);
  /* the prototype rasterizes headlines on mount, which can beat the Goethe font load. A resize redraws every headline,
     so both builds are compared with the font in place. */
  await page.evaluate(() => dispatchEvent(new Event('resize')));
  await page.waitForTimeout(600);
}
const SETTLE = 4000; /* the 3D rows ease toward their target forever, give them time under software rendering */
async function view(page) { return page.evaluate(() => document.documentElement.dataset.view); }
async function waitHidden(page, sel) { await page.waitForSelector(sel, { state: 'hidden', timeout: 30000 }); }
/* click on a point of the canvas and park the pointer in the middle of the stage afterwards? no: tests that need a still scene never move the mouse */

test('home', async ({ page }) => {
  await open(page);
  expect(await view(page)).toBe('home');
  await shot(page, 'home');
});

test('home with the menu open', async ({ page }) => {
  await open(page);
  await page.click('#navToggle');
  await page.waitForTimeout(SETTLE);
  await shot(page, 'home-menu');
});

test('about', async ({ page, isMobile }) => {
  await open(page, '#about');
  expect(await view(page)).toBe('about');
  await shot(page, 'about-top');
  const at = async (sel, f, name) => {
    await page.evaluate(([s, k]) => { const r = document.querySelector(s); scrollTo(0, r.getBoundingClientRect().top + scrollY + (r.offsetHeight - innerHeight) * k); }, [sel, f]);
    await page.waitForTimeout(500);
    await shot(page, name);
  };
  await at('.ahero', 0.6, 'about-hero-eaten');
  await at('.stream', 0.5, 'about-stream');
  await at('#boardPin', 0.6, 'about-board');
});

test('resources', async ({ page }) => {
  await open(page, '#resources');
  expect(await view(page)).toBe('resources');
  await shot(page, 'resources');
});

test('poster wall', async ({ page }) => {
  await open(page, '#events');
  await waitHidden(page, '#wallLoading');
  await page.waitForTimeout(SETTLE);
  expect(await view(page)).toBe('wall');
  await shot(page, 'wall-fall');
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(SETTLE);
  await shot(page, 'wall-spring');
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(SETTLE);
  await shot(page, 'wall-blank');
});

test('cartridge table (fall)', async ({ page }) => {
  await open(page, '#fall-2026');
  await waitHidden(page, '#tableLoading');
  await page.waitForTimeout(SETTLE);
  expect(await view(page)).toBe('table');
  await shot(page, 'table-fall');
});

test('cartridge table (spring, with covers)', async ({ page }) => {
  await open(page, '#spring-2026');
  await waitHidden(page, '#tableLoading');
  await page.waitForTimeout(SETTLE);
  await shot(page, 'table-spring');
});

test('games tab', async ({ page }) => {
  await open(page, '#games');
  await waitHidden(page, '#tableLoading');
  await page.waitForTimeout(SETTLE);
  await shot(page, 'table-games');
  expect(await page.getAttribute('#navBack', 'href')).toBe('#home');
});

test('table corner menu', async ({ page, isMobile }) => {
  test.skip(isMobile, 'hover menu is a desktop interaction');
  await open(page, '#fall-2026');
  await waitHidden(page, '#tableLoading');
  await page.waitForTimeout(SETTLE);
  await page.click('#navToggle');
  await page.waitForTimeout(SETTLE);
  await shot(page, 'table-menu', { maxDiffPixelRatio: 0.01 });
});

test('open a cartridge: zoom, wipe, blue loader', async ({ page, isMobile }) => {
  test.skip(isMobile, 'covered by the flow test on phone');
  await open(page, '#fall-2026');
  await waitHidden(page, '#tableLoading');
  await page.waitForTimeout(SETTLE);
  await page.mouse.move(720, 560);
  await page.waitForTimeout(600);
  await shot(page, 'table-hover', { maxDiffPixelRatio: 0.05 }); /* the hovered cartridge bobs with time */
  await page.mouse.down(); await page.mouse.up();
  await page.waitForSelector('#tLoad:not([hidden])', { timeout: 15000 });
  await page.waitForFunction(() => document.getElementById('tPct').textContent === 'Loading 100%', null, { timeout: 15000 });
  await page.waitForTimeout(400);
  await shot(page, 'table-loading');
  await page.click('#tLoadBack');
  await waitHidden(page, '#tLoad');
  await page.waitForFunction(() => getComputedStyle(document.getElementById('wipe')).pointerEvents === 'none', null, { timeout: 15000 });
});

test('flow: menu to events, poster to table, plus back to the wall, home', async ({ page, isMobile }) => {
  test.skip(isMobile, 'pointer hover steps are desktop');
  await open(page);
  await page.click('#navToggle');
  await page.waitForTimeout(500);
  await page.click('a[data-route="events"]');
  await page.waitForFunction(() => document.documentElement.dataset.view === 'wall', null, { timeout: 15000 });
  await waitHidden(page, '#wallLoading');
  await page.waitForTimeout(SETTLE);
  /* click the centred poster: flips, pushes in, blocks, blue loader with the jam name, table */
  await page.mouse.click(720, 450);
  await page.waitForFunction(() => document.documentElement.dataset.view === 'table', null, { timeout: 25000 });
  await waitHidden(page, '#tableLoading');
  await page.waitForTimeout(2500);
  expect(await page.evaluate(() => document.getElementById('tCount').textContent)).toContain('FALL GAME JAM 2026');
  expect(await page.evaluate(() => location.hash)).toBe('#fall-2026');
  /* the corner plus, then Back goes to the wall */
  await page.click('#navBack');
  await page.waitForFunction(() => document.documentElement.dataset.view === 'wall', null, { timeout: 15000 });
  expect(await page.evaluate(() => location.hash)).toBe('#events');
  /* the router ignores navigation while a wipe runs, so let it finish first */
  await page.waitForFunction(() => getComputedStyle(document.getElementById('wipe')).pointerEvents === 'none', null, { timeout: 15000 });
  /* browser back returns to the table, forward again works */
  await page.goBack();
  await page.waitForFunction(() => document.documentElement.dataset.view === 'table', null, { timeout: 15000 });
});

test('phone: home, wall, table', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phone project only');
  await open(page);
  await shot(page, 'phone-home');
  await open(page, '#events');
  await waitHidden(page, '#wallLoading');
  await page.waitForTimeout(SETTLE);
  await shot(page, 'phone-wall');
  await open(page, '#fall-2026');
  await waitHidden(page, '#tableLoading');
  await page.waitForTimeout(SETTLE);
  await shot(page, 'phone-table');
});
