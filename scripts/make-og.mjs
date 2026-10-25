/* The link preview image (Open Graph / Twitter card), 1200 by 630: the brand lockup on Klein blue.
     npm run dev   (in another terminal)
     npm run og
   It loads the site from the dev server so the wordmark goes through the real rasterized serif (src/pixel.js). */
import { chromium } from '@playwright/test';
import { resolve } from 'node:path';

const url = process.env.SITE || 'http://127.0.0.1:5173/';
const DPAD = ['...XXX...', '...X.X...', '...X.X...', 'XXXX.XXXX', 'X...X...X', 'XXXX.XXXX', '...X.X...', '...X.X...', '...XXX...'];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.goto(url);
await page.waitForFunction(() => document.documentElement.dataset.ready === 'true', null, { timeout: 30000 });
await page.evaluate(async (dpad) => {
  const { renderT } = await import('/src/pixel.js');
  await document.fonts.load('700 20px Goethe'); await document.fonts.load('12px Silkscreen');
  const card = document.createElement('div');
  card.style.cssText = 'position:fixed;inset:0;z-index:999;background:var(--brand);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:34px';
  card.innerHTML = '<div style="display:flex;align-items:center;gap:30px"><canvas id="og-mark"></canvas>' +
    '<span class="t" data-text="UMass Game Dev" style="color:#fff;font-size:118px;filter:none"></span></div>' +
    '<span style="font-family:var(--mono);color:#fff;font-size:24px;letter-spacing:.06em;text-transform:uppercase">[ Game development club at UMass Amherst ]</span>';
  document.body.appendChild(card);
  const cv = card.querySelector('#og-mark'), s = 12; cv.width = cv.height = dpad.length * s;
  const x = cv.getContext('2d'); x.fillStyle = '#fff';
  dpad.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] === 'X') x.fillRect(i * s, j * s, s, s); });
  renderT(card.querySelector('.t'));
  document.querySelector('.crt').style.display = 'none';
}, DPAD);
await page.waitForTimeout(300);
await page.screenshot({ path: resolve(import.meta.dirname, '../public/og-image.png') });
await browser.close();
console.log('wrote public/og-image.png');
