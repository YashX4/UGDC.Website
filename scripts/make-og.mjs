/* The link preview image (Open Graph / Twitter card), 1200 by 630: the pixel tower emblem and the wordmark on Klein blue.
     npm run dev   (in another terminal)
     npm run og
   It loads the site from the dev server so the wordmark goes through the real rasterized serif (src/pixel.js). */
import { chromium } from '@playwright/test';
import { resolve } from 'node:path';

const url = process.env.SITE || 'http://127.0.0.1:5173/';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.goto(url);
await page.waitForFunction(() => document.documentElement.dataset.ready === 'true', null, { timeout: 30000 });
await page.evaluate(async () => {
  const { renderT } = await import('/src/pixel.js');
  const { EMBLEMS } = await import('/src/emblem-data.js');
  await document.fonts.load('700 20px Goethe'); await document.fonts.load('12px Silkscreen');
  const card = document.createElement('div');
  card.style.cssText = 'position:fixed;inset:0;z-index:999;background:var(--brand);display:flex;align-items:center;justify-content:center;gap:56px';
  card.innerHTML = '<canvas id="og-emblem"></canvas>' +
    '<div style="display:flex;flex-direction:column;align-items:flex-start;gap:28px">' +
    '<span class="t" data-text="UMass Game Dev" style="color:#fff;font-size:104px;filter:none"></span>' +
    '<span style="font-family:var(--mono);color:#fff;font-size:22px;letter-spacing:.06em;text-transform:uppercase">[ Game development club at UMass Amherst ]</span></div>';
  document.body.appendChild(card);
  /* the blue emblem art, 49 by 73, at 5 screen pixels per art pixel */
  const im = new Image(); im.src = EMBLEMS.blue; await im.decode();
  const cv = card.querySelector('#og-emblem'), k = 5; cv.width = im.width * k; cv.height = im.height * k;
  const x = cv.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(im, 0, 0, cv.width, cv.height);
  renderT(card.querySelector('.t'));
  document.querySelector('.crt').style.display = 'none';
});
await page.waitForTimeout(300);
await page.screenshot({ path: resolve(import.meta.dirname, '../public/og-image.png') });
await browser.close();
console.log('wrote public/og-image.png');
