/* Favicons and app icons: the brand tile, a white pixel d pad (outlined arms, dot in the middle) on Klein blue,
   drawn by whole pixels so it is crisp at every size.
     npm run icons
   Writes favicon.ico (16, 32, 48), favicon-32.png, favicon-48.png, apple-touch-icon.png, icon-192.png, icon-512.png to public/. */
import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const out = resolve(import.meta.dirname, '../public');
const DPAD = ['...XXX...', '...X.X...', '...X.X...', 'XXXX.XXXX', 'X...X...X', 'XXXX.XXXX', '...X.X...', '...X.X...', '...XXX...'];
const BRAND = '#002fa7';

const browser = await chromium.launch();
const page = await browser.newPage();
/* the mark fills about 65% of the tile; tiny sizes take what whole pixels allow */
const png = (size) => page.evaluate(([size, dpad, brand]) => {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const x = c.getContext('2d');
  x.fillStyle = brand; x.fillRect(0, 0, size, size);
  const n = dpad.length, s = Math.max(1, Math.floor(size * (size < 40 ? .8 : .65) / n)), w = n * s;
  const o = Math.floor((size - w) / 2);
  x.fillStyle = '#ffffff';
  dpad.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] === 'X') x.fillRect(o + i * s, o + j * s, s, s); });
  return c.toDataURL('image/png').split(',')[1];
}, [size, DPAD, BRAND]).then((b64) => Buffer.from(b64, 'base64'));

const small = {};
for (const s of [16, 32, 48]) small[s] = await png(s);
writeFileSync(resolve(out, 'favicon-32.png'), small[32]);
writeFileSync(resolve(out, 'favicon-48.png'), small[48]);
for (const [name, s] of [['apple-touch-icon.png', 180], ['icon-192.png', 192], ['icon-512.png', 512]]) writeFileSync(resolve(out, name), await png(s));
await browser.close();

/* favicon.ico holding the three small PNGs (PNG in ICO, read by every current browser) */
const imgs = [16, 32, 48].map((s) => [s, small[s]]);
const head = Buffer.alloc(6 + 16 * imgs.length);
head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(imgs.length, 4);
let offset = head.length;
imgs.forEach(([s, buf], i) => {
  const e = 6 + 16 * i;
  head.writeUInt8(s, e); head.writeUInt8(s, e + 1); head.writeUInt8(0, e + 2); head.writeUInt8(0, e + 3);
  head.writeUInt16LE(1, e + 4); head.writeUInt16LE(32, e + 6); head.writeUInt32LE(buf.length, e + 8); head.writeUInt32LE(offset, e + 12);
  offset += buf.length;
});
writeFileSync(resolve(out, 'favicon.ico'), Buffer.concat([head, ...imgs.map(([, b]) => b)]));
console.log('wrote favicon.ico, favicon-32.png, favicon-48.png, apple-touch-icon.png, icon-192.png, icon-512.png');
