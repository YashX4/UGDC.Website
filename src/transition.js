/* ============================================================
   LOADER + PIXEL BLOCK WIPE
   - loader: solid Klein screen, the mark and a progress line, then it breaks apart into big pixel blocks (site intro)
   - wipe(mode, ms): "in" covers the screen with blocks from the bottom up, "out" reveals from the top down
   Every page change goes cover -> swap view -> reveal, see app.js
   ============================================================ */
import { paintEmblems, renderT } from './pixel.js';
import { $, css, fonts, reduce, sleep } from './util.js';

var wipeCv = $('#wipe'), wx = wipeCv.getContext('2d');
var loader = $('#loader'), pctEl = $('#loaderPct'), barEl = $('#loaderBar');
var LEVELS = [0, .35, .7, 1]; /* opacity steps so blocks pop in stages like old hardware */

export const wipe = function (mode, dur) {
  return new Promise(function (res) {
    var dpr = Math.min(devicePixelRatio || 1, 2), W = innerWidth, H = innerHeight;
    wipeCv.width = Math.ceil(W * dpr); wipeCv.height = Math.ceil(H * dpr); wx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var s = Math.ceil(Math.max(W, H) / (W < 600 ? 9 : 16)), cols = Math.ceil(W / s), rows = Math.ceil(H / s), cells = [];
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
      var sweep = mode === 'in' ? (rows - 1 - r) / rows : r / rows;
      cells.push([c * s, r * s, sweep * .55 + Math.random() * .3]);
    }
    var brand = css('--brand'), t0 = performance.now(), seg = .15;
    function frame(now) {
      var p = Math.min(1, (now - t0) / dur); wx.clearRect(0, 0, W, H); wx.fillStyle = brand;
      for (var i = 0; i < cells.length; i++) {
        var k = Math.max(0, Math.min(1, (p - cells[i][2]) / seg)), a = LEVELS[Math.min(3, Math.floor(k * 4))];
        if (mode === 'out') a = 1 - a; if (a <= 0) continue;
        wx.globalAlpha = a; wx.fillRect(cells[i][0], cells[i][1], s + 1, s + 1);
      }
      wx.globalAlpha = 1;
      if (p < 1) requestAnimationFrame(frame); else res();
    }
    requestAnimationFrame(frame);
  });
};
export const clearWipe = function () { wx.clearRect(0, 0, wipeCv.width, wipeCv.height); };
export const wipeBlock = function (on) { wipeCv.style.pointerEvents = on ? 'auto' : 'none'; };

/* The loader screen is reusable: the site intro, the poster to table hop and the cartridge loading screen are all variations of it.
   loaderShow(title, sponsors)  solid Klein screen with the emblem, a title and an optional sponsor line
   loaderRun(ready, min)  counts up until `ready` resolves and `min` ms have passed
   loaderReveal()  mark fades, the blue turns into pixel blocks that dissolve */
var titleEl = $('.loader__mark .t');
/* the sponsor strip at the foot of a loader: [ Sponsored by ] and a row of white logos (or names when there is no logo) */
export const showSponsors = function (el, list) {
  el.hidden = !(list && list.length); el.textContent = '';
  if (el.hidden) return;
  var lead = document.createElement('span'); lead.className = 'loader__sponsors-cap'; lead.textContent = '[ Sponsored by ]';
  var row = document.createElement('span'); row.className = 'loader__sponsors-row';
  list.forEach(function (s) {
    if (s.logo) { var im = new Image(); im.src = s.logo; im.alt = s.name; row.appendChild(im); }
    else { var t = document.createElement('span'); t.textContent = s.name; row.appendChild(t); }
  });
  el.append(lead, row);
};
var sponsorsEl = $('#loaderSponsors');
export const loaderShow = function (title, sponsors) {
  loader.classList.remove('is-out'); loader.hidden = false; showSponsors(sponsorsEl, sponsors);
  titleEl.dataset.text = title || 'UMass Game Dev'; renderT(titleEl); paintEmblems();
  pctEl.textContent = 'Loading 0%'; barEl.style.width = '0%';
};
export const loaderRun = async function (ready, minMs) {
  var min = sleep(minMs || 1100), done = false;
  Promise.all([fonts(), ready, min]).then(function () { done = true; }, function () { done = true; });
  var shown = 0, t0 = performance.now();
  await new Promise(function (r) {
    (function tick(now) {
      var target = done ? 100 : Math.min(92, (now - t0) / (minMs || 1100) * 92);
      shown += (target - shown) * .18; if (done && shown > 99.4) shown = 100;
      pctEl.textContent = 'Loading ' + Math.round(shown) + '%'; barEl.style.width = shown + '%';
      if (shown < 100) requestAnimationFrame(tick); else r();
    })(t0);
  });
  await sleep(180);
};
export const loaderReveal = async function () {
  loader.classList.add('is-out'); await sleep(260);
  var dpr = Math.min(devicePixelRatio || 1, 2); wipeCv.width = innerWidth * dpr; wipeCv.height = innerHeight * dpr;
  wx.fillStyle = css('--brand'); wx.fillRect(0, 0, wipeCv.width, wipeCv.height);
  loader.hidden = true;
  await wipe('out', 900); clearWipe(); wipeBlock(false);
};
/* site intro */
/* sponsors: shown when the site opens straight onto a jam that has them */
export const intro = async function (ready, sponsors) {
  if (reduce) { loader.hidden = true; return; }
  loaderShow('UMass Game Dev', sponsors);
  await loaderRun(ready, 1100);
  await loaderReveal();
};
