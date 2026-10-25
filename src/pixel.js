/* ============================================================
   PIXEL LOOK
   - pixel icons (pad, heart, dpad) and the UMGD emblem, drawn in brand tokens
   - the rasterized serif: Goethe drawn on a 20 pixel em grid, thresholded,
     scaled up and thresholded again so you get square pixels with softened steps
   Two entry points on purpose (they differ slightly, merge them later if you want):
     renderT(el)    for  .t[data-text]  elements (home, nav, loader). Reads size and colour from CSS.
     rasterInto(...) for canvases that already exist (wall title, table title). Takes size and colour.
   ============================================================ */
import { EMBLEMS } from './emblem-data.js';
import { $$, css, reduce, root } from './util.js';

var MAPS = {
  pad: ['...XXXXXXXXXX...', '..XWWWWWWWWWWX..', '.XWWXWWWWWWWWWX.', 'XWWXXXWWWWWXWWWX', 'XWWWXWWWWWXWXWWX', 'XWWWWWWWWWWXWWWX', 'XWWWWWXXXXWWWWWX', 'XWWWWX....XWWWWX', '.XWWX......XWWX.', '..XX........XX..'],
  heart: ['.XXX...XXX.', 'XLLLX.XLLLX', 'XLWWLXLLLLX', 'XLWLLLLLLLX', 'XLLLLLLLLLX', '.XLLLLLLLX.', '..XLLLLLX..', '...XLLLX...', '....XLX....', '.....X.....'],
  dpad: ['...XXX...', '...X.X...', 'XXXX.XXXX', 'X.......X', 'XXXX.XXXX', '...X.X...', '...XXX...']
};
export { MAPS };

function pixelSVG(svg, name) {
  var m = MAPS[name], h = m.length, w = m[0].length;
  svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
  var col = { X: name === 'heart' ? 'var(--lime)' : 'var(--brand)', W: 'var(--icon-fill)', L: 'var(--lime-fill)' };
  var s = '';
  m.forEach(function (row, y) { for (var x = 0; x < row.length; x++) { var c = row[x]; if (col[c]) s += '<rect x="' + x + '" y="' + y + '" width="1.02" height="1.02" style="fill:' + col[c] + '"/>'; } });
  svg.innerHTML = s;
}
$$('[data-pixel-svg]').forEach(function (s) { pixelSVG(s, s.dataset.pixelSvg); });
export { pixelSVG };

/* ---------- emblem ---------- */
var EMB = {}, geomCache = null;
function loadEmblem() {
  var keys = Object.keys(EMBLEMS), left = keys.length;
  keys.forEach(function (k) {
    var im = new Image();
    im.onload = function () { EMB[k] = im; if (--left === 0) { geomCache = null; paintEmblems(); } };
    im.src = EMBLEMS[k];
  });
}
function geom(im) {
  if (geomCache) return geomCache;
  var w = im.width, H = im.height, c = document.createElement('canvas'); c.width = w; c.height = H;
  var x = c.getContext('2d'); x.drawImage(im, 0, 0); var data = x.getImageData(0, 0, w, H).data, sx = 0, sw = 0;
  /* visual centre of the whole mark so both halves share one axis */
  for (var y = 0; y < H; y++) for (var i = 0; i < w; i++) if (data[(y * w + i) * 4 + 3] > 8) { sx += i; sw++; }
  var cx = sx / sw + .5, half = Math.ceil(Math.max(cx, w - cx));
  geomCache = { w: w, H: H, W: half * 2, off: Math.round(half - cx) };
  return geomCache;
}
function paintEmblems() {
  var brand = css('--brand'), accent = css('--lime');
  root.style.setProperty('--tile-ink', css('--content')); /* plus signs on the accent tile */
  if (!EMB.home) return;
  var g = geom(EMB.home);
  $$('canvas[data-emblem]').forEach(function (cv) {
    var im = EMB[cv.dataset.emblem] || EMB.home;
    var rows = (cv.dataset.rows || '0,1').split(',').map(Number);
    var y0 = Math.round(rows[0] * g.H), y1 = Math.round(rows[1] * g.H), h = y1 - y0;
    /* whole device pixels per art pixel, so every block is the same size */
    cv.style.setProperty('--frac', 2 * h / g.H); cv.style.height = ''; cv.style.width = '';
    var dpr = window.devicePixelRatio || 1, tgt = cv.getBoundingClientRect().height;
    var S = tgt > 0 ? Math.max(1, Math.round(tgt * dpr / h)) : 6;
    cv.width = g.W * S; cv.height = h * S;
    if (tgt > 0) { cv.style.height = (h * S / dpr) + 'px'; cv.style.width = (g.W * S / dpr) + 'px'; }
    var x = cv.getContext('2d'); x.clearRect(0, 0, cv.width, cv.height); x.imageSmoothingEnabled = false;
    x.drawImage(im, 0, y0, g.w, h, g.off * S, 0, g.w * S, h * S);
  });
  $$('canvas[data-pixel]').forEach(function (cv) {
    var m = MAPS[cv.dataset.pixel], S2 = 4; cv.width = m[0].length * S2; cv.height = m.length * S2;
    var x = cv.getContext('2d'); x.fillStyle = brand;
    m.forEach(function (row, y) { for (var i = 0; i < row.length; i++) if (row[i] === 'X') x.fillRect(i * S2, y * S2, S2, S2); });
  });
}
export { paintEmblems };
(function(){ var tile = document.querySelector('.nav__visual'), last = 0; if (tile && window.ResizeObserver) new ResizeObserver(function(){ var w = tile.clientWidth; if (w && Math.abs(w - last) > 2) { last = w; paintEmblems(); } }).observe(tile); })();
var rzT; window.addEventListener('resize', function () { clearTimeout(rzT); rzT = setTimeout(paintEmblems, 120); });

/* ---------- rasterized serif, element version ---------- */
var CELLS = 20, SQUEEZE = 1;
function renderT(el) {
  var text = el.dataset.text; if (!text) return;
  var cs = getComputedStyle(el), fs = parseFloat(cs.fontSize), color = cs.color;
  var cellsPerEm = +el.dataset.cells || CELLS, dpr = Math.min(window.devicePixelRatio || 1, 2.5), cell = fs / cellsPerEm;
  var font = '700 ' + cellsPerEm + 'px Goethe, "Times New Roman", serif';
  var meas = document.createElement('canvas').getContext('2d'); meas.font = font;
  var lw = Math.ceil(meas.measureText(text).width * SQUEEZE) + 2, lh = Math.ceil(cellsPerEm) + 1, base = Math.round(cellsPerEm * .7);
  var lo = document.createElement('canvas'); lo.width = lw; lo.height = lh;
  var lx = lo.getContext('2d'); lx.font = font; lx.textBaseline = 'alphabetic';
  lx.save(); lx.scale(SQUEEZE, 1); lx.fillStyle = '#000'; lx.fillText(text, 1 / SQUEEZE, base); lx.restore();
  var ld = lx.getImageData(0, 0, lw, lh);
  for (var i = 3; i < ld.data.length; i += 4) ld.data[i] = ld.data[i] >= 105 ? 255 : 0;
  lx.putImageData(ld, 0, 0);
  var W = Math.max(1, Math.round(lw * cell * dpr)), H = Math.max(1, Math.round(lh * cell * dpr));
  var cv = el.querySelector('canvas'); if (!cv) { cv = document.createElement('canvas'); el.appendChild(cv); }
  cv.width = W; cv.height = H; cv.style.width = (W / dpr) + 'px'; cv.style.height = (H / dpr) + 'px';
  var hx = cv.getContext('2d');
  hx.imageSmoothingEnabled = !el.dataset.flat || cell * dpr > 3; hx.imageSmoothingQuality = 'high';
  hx.drawImage(lo, 0, 0, W, H);
  var hd = hx.getImageData(0, 0, W, H), d = hd.data, m = color.match(/\d+(\.\d+)?/g) || [30, 30, 30];
  var soft = cell * dpr < 3; /* tiny sizes keep some antialiasing */
  for (var j = 0; j < d.length; j += 4) {
    var a = d[j + 3]; d[j] = +m[0]; d[j + 1] = +m[1]; d[j + 2] = +m[2];
    d[j + 3] = soft ? a : (a >= 128 ? 255 : (a >= 112 ? Math.round((a - 112) * 16) : 0));
  }
  hx.putImageData(hd, 0, 0);
}
export { renderT };
export const renderAll = function () { $$('.t[data-text]').forEach(renderT); paintEmblems(); };

/* ---------- rasterized serif, canvas version (wall and table titles) ---------- */
export const inkOf = function (el) { var c = getComputedStyle(el).color.match(/\d+/g) || [30, 30, 30]; return [+c[0], +c[1], +c[2]]; };
export const rasterInto = function (cv, text, fontSizePx, rgb, maxW) {
  var C = 20, dpr = Math.min(window.devicePixelRatio || 1, 2.5), font = '700 ' + C + 'px Goethe';
  var m = document.createElement('canvas').getContext('2d'); m.font = font;
  var lw = Math.ceil(m.measureText(text).width) + 2, lh = C + 1;
  while (fontSizePx > 20 && lw * fontSizePx / C > maxW) fontSizePx -= 20;
  var cell = fontSizePx / C;
  var lo = document.createElement('canvas'); lo.width = lw; lo.height = lh;
  var lx = lo.getContext('2d'); lx.font = font; lx.fillText(text, 1, 14);
  var ld = lx.getImageData(0, 0, lw, lh);
  for (var i = 3; i < ld.data.length; i += 4) ld.data[i] = ld.data[i] >= 105 ? 255 : 0;
  lx.putImageData(ld, 0, 0);
  cv.width = Math.round(lw * cell * dpr); cv.height = Math.round(lh * cell * dpr);
  cv.style.width = (cv.width / dpr) + 'px'; cv.style.height = (cv.height / dpr) + 'px';
  var hx = cv.getContext('2d'); hx.imageSmoothingEnabled = true;
  hx.drawImage(lo, 0, 0, cv.width, cv.height);
  var hd = hx.getImageData(0, 0, cv.width, cv.height), d = hd.data;
  for (var j = 0; j < d.length; j += 4) { d[j] = rgb[0]; d[j + 1] = rgb[1]; d[j + 2] = rgb[2]; d[j + 3] = d[j + 3] >= 128 ? 255 : 0; }
  hx.putImageData(hd, 0, 0);
};

/* ---------- scramble on hover (nav links) ---------- */
var GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&*+=<>/\\[]';
export const scramble = function (el) {
  if (!el.dataset.orig) el.dataset.orig = el.textContent;
  if (reduce) { el.textContent = el.dataset.orig; return; }
  el._f = 0; if (el._s) return; el._s = 1; var total = 12;
  (function tick() {
    var final = el.dataset.orig, f = ++el._f;
    el.textContent = Array.prototype.map.call(final, function (c, i) { return c === ' ' ? ' ' : (i < final.length * f / total ? c : GLYPHS[Math.random() * GLYPHS.length | 0]); }).join('');
    if (f < total) requestAnimationFrame(function () { setTimeout(tick, 28); }); else { el.textContent = final; el._s = 0; }
  })();
};
$$('[data-scramble]').forEach(function (a) { a.addEventListener('mouseenter', function () { scramble(a); }); a.addEventListener('focus', function () { scramble(a); }); });

loadEmblem();
var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(renderAll, 120); });
