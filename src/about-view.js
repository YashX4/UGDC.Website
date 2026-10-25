/* ABOUT and RESOURCES views. Markup lives in index.html (#view-about, #view-resources), content in data.js (BOARD, ABOUT_STREAM, SLIDES).
   About is a long scroll with three scenes driven by scroll position:
   1. the hero photo gets eaten by block pixels as you scroll
   2. a stream of photos pops in at the centre, stacks, then flies off the top
   3. the eboard row slides sideways while you scroll down
   Everything starts on mount and stops on unmount, so nothing runs behind the other pages. */
import { ABOUT_STREAM, BOARD, SLIDES } from './data.js';
import { renderAll } from './pixel.js';
import { $, $$, css, reduce, sleep } from './util.js';

var LEVELS = [0, .35, .7, 1];
var PERSON = [
  '....XXXX....', '...XXXXXX...', '...XXXXXX...', '...XXXXXX...', '....XXXX....', '.....XX.....',
  '..XXXXXXXX..', '.XXXXXXXXXX.', 'XXXXXXXXXXXX', 'XXXXXXXXXXXX', 'XXXXXXXXXXXX', 'XXXXXXXXXXXX'
];
var elA = $('#view-about'), elR = $('#view-resources');
var track = $('#boardTrack'), stream = $('#stream'), pinB = $('#boardPin'), ahero = $('.ahero'),
    pxCv = $('.ahero__px'), px = pxCv.getContext('2d'), heroImg = $('.ahero__img');
var built = false, active = false, SIMG = [], pxCells = null, pxS = 0, pxW = 0, pxH = 0, heroReady = null, listRendered = false;
var rnd = (function (s) { return function () { return (s = (s * 16807) % 2147483647) / 2147483647; }; })(7);
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

function build() {
  if (built) return; built = true;
  /* eboard row */
  BOARD.forEach(function (m, i) {
    var el = document.createElement('article'); el.className = 'member';
    var num = String(i + 1).padStart(2, '0') + '/';
    el.innerHTML = '<div class="member__photo">' + (m.photo ? '<img src="' + m.photo + '" alt="' + m.name + '">' : '<canvas data-portrait aria-hidden="true"></canvas>') + '<span class="member__num">' + num + '</span></div>' +
      '<div class="member__meta"><span class="cap member__role">[' + m.role + ']</span><h3 class="sr">' + m.name + '</h3>' +
      '<div class="member__name" aria-hidden="true"><span class="t" data-text="' + m.name + '"></span></div><p class="member__desc">' + m.desc + '</p></div>';
    track.appendChild(el);
  });
  /* photo stream */
  SIMG = ABOUT_STREAM.map(function (src, i) {
    var im = new Image(); im.className = 'stream__img'; im.src = src; im.alt = ''; im.style.zIndex = i + 1; stream.appendChild(im);
    return { im: im, x: (rnd() - .5) * (i % 3 === 0 ? .1 : .46), r: (rnd() - .5) * 7 };
  });
  heroReady = new Promise(function (res) {
    if (heroImg.complete) res(); else { heroImg.addEventListener('load', res); heroImg.addEventListener('error', res); }
  });
}

function paintPortraits() {
  var brand = css('--brand');
  $$('canvas[data-portrait]').forEach(function (cv) {
    var m = PERSON, S = 8, pad = 3, w = m[0].length + pad * 2, h = Math.round(w * 1.25);
    cv.width = w * S; cv.height = h * S; var x = cv.getContext('2d'); x.clearRect(0, 0, cv.width, cv.height);
    x.fillStyle = brand; x.globalAlpha = .16; var top = h - m.length;
    m.forEach(function (row, y) { for (var i = 0; i < row.length; i++) if (row[i] === 'X') x.fillRect((i + pad) * S, (y + top) * S, S, S); });
    x.globalAlpha = 1;
  });
}

function setupPx() {
  var r = pxCv.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
  pxW = r.width; pxH = r.height; pxCv.width = Math.ceil(pxW * dpr); pxCv.height = Math.ceil(pxH * dpr); px.setTransform(dpr, 0, 0, dpr, 0, 0);
  pxS = Math.ceil(Math.max(pxW, pxH) / (pxW < 600 ? 10 : 20));
  var cols = Math.ceil(pxW / pxS), rows = Math.ceil(pxH / pxS); pxCells = [];
  for (var rr = 0; rr < rows; rr++) for (var c = 0; c < cols; c++) pxCells.push([c * pxS, rr * pxS, (rr / rows) * .25 + rnd() * .6]);
}
function sizeBoard() {
  if (reduce) { track.style.flexWrap = 'wrap'; pinB.style.height = 'auto'; track.parentElement.style.position = 'relative'; track.parentElement.style.height = 'auto'; return; }
  var extra = Math.max(0, track.scrollWidth - innerWidth);
  pinB.style.height = (innerHeight + extra) + 'px';
}

function onScroll() {
  if (!active || reduce) return;
  var vh = innerHeight;
  /* hero: coloured blocks eat the photo */
  var hr = ahero.getBoundingClientRect(), p = clamp(-hr.top / (hr.height - vh), 0, 1);
  px.clearRect(0, 0, pxW, pxH);
  if (p > 0 && pxCells) {
    px.fillStyle = css('--bg');
    for (var i = 0; i < pxCells.length; i++) {
      var c = pxCells[i], k = clamp((p * 1.15 - c[2]) / .14, 0, 1), a = LEVELS[Math.min(3, Math.floor(k * 4))];
      if (a <= 0) continue; px.globalAlpha = a; px.fillRect(c[0], c[1], pxS + 1, pxS + 1);
    }
    px.globalAlpha = 1;
  }
  /* photo stream */
  var sr = stream.parentElement.getBoundingClientRect(), q = clamp(-sr.top / (sr.height - vh), 0, 1);
  var N = SIMG.length, span = .26;
  SIMG.forEach(function (s, idx) {
    var cc = span * .2 + (1 - span * 1.4) * idx / (N - 1), u = (q - cc) / (span / 2);
    if (u < -1 || u > 2.2) { s.im.style.opacity = 0; return; }
    var grow = clamp(u + 1, 0, 1), up = Math.max(0, u), sc = .42 + .58 * grow, y = -up * vh * .62;
    s.im.style.opacity = grow > 0 ? 1 : 0;
    var room = Math.max(0, (innerWidth - s.im.offsetWidth * sc) / 2 - 12), xo = (s.x / .23) * room * .9 * Math.min(1, grow * 1.4);
    s.im.style.transform = 'translate(calc(-50% + ' + xo + 'px), calc(-50% + ' + y + 'px)) rotate(' + (s.r * grow) + 'deg) scale(' + sc + ')';
  });
  /* eboard row */
  var br = pinB.getBoundingClientRect(), extra = pinB.offsetHeight - vh, b = extra > 0 ? clamp(-br.top / extra, 0, 1) : 0;
  track.style.transform = 'translateX(' + (-b * Math.max(0, track.scrollWidth - innerWidth)) + 'px)';
}
var raf = 0;
function onScrollRaf() { if (!raf) raf = requestAnimationFrame(function () { raf = 0; onScroll(); }); }
function onResize() { if (!active) return; setupPx(); sizeBoard(); onScroll(); }

export const AboutView = {
  mount: function () {
    build(); elA.hidden = false; scrollTo(0, 0); active = true;
    addEventListener('scroll', onScrollRaf, { passive: true }); addEventListener('resize', onResize);
    return Promise.race([heroReady, sleep(4000)]).then(function () {
      renderAll(); paintPortraits(); setupPx(); sizeBoard(); onScroll();
      /* fonts or layout can settle a beat later */
      setTimeout(function () { if (active) { sizeBoard(); onScroll(); } }, 250);
    });
  },
  unmount: function () {
    active = false; elA.hidden = true;
    removeEventListener('scroll', onScrollRaf); removeEventListener('resize', onResize);
  }
};

/* RESOURCES: the deck list. The orange pixel arrow is a game menu cursor: it jumps to the row you point at or tab to
   (the one orange pop on this screen). With a fine pointer, slide 1 of the deck follows the cursor in a blue frame
   and resolves in blocks, the same four opacity steps as the wipe. */
var ARROW = ['X....', 'XX...', 'XXX..', 'XXXX.', 'XXX..', 'XX...', 'X....'];
var resList = $('#resList'), resCursor = null, peek = null, peekImg = null, peekCv = null, peekSrc = '', peekRaf = 0;
var finePointer = !!(window.matchMedia && matchMedia('(pointer:fine)').matches);
function span(cls, text) { var s = document.createElement('span'); s.className = cls; s.textContent = text; return s; }

function buildResources() {
  SLIDES.forEach(function (s, i) {
    var li = document.createElement('li'), a = document.createElement('a'), soon = !s.pdf;
    li.className = 'res__row';
    if (soon) { a.className = 'is-soon'; a.setAttribute('aria-disabled', 'true'); }
    else { a.href = s.pdf; a.target = '_blank'; a.rel = 'noopener'; if (s.cover) a.dataset.cover = s.cover; }
    a.append(span('res__num', String(i + 1).padStart(2, '0')), span('res__name', s.title),
      span('res__date', s.date + (s.pages ? ' / ' + s.pages + ' slides' : '')), span('res__pdf', soon ? 'Soon' : 'PDF'));
    li.appendChild(a); resList.appendChild(li);
  });
  resCursor = document.createElement('span'); resCursor.className = 'res__cursor'; resCursor.setAttribute('aria-hidden', 'true');
  var svg = '<svg viewBox="0 0 5 7" shape-rendering="crispEdges">';
  ARROW.forEach(function (row, y) { for (var x = 0; x < row.length; x++) if (row[x] === 'X') svg += '<rect x="' + x + '" y="' + y + '" width="1.02" height="1.02" fill="var(--lime)"/>'; });
  resCursor.innerHTML = svg + '</svg>'; resList.appendChild(resCursor);
  resList.addEventListener('mouseover', function (e) { var a = e.target.closest('a'); if (a) pointAt(a); });
  resList.addEventListener('focusin', function (e) { var a = e.target.closest('a'); if (a) pointAt(a); });
  if (finePointer && !reduce) {
    peek = document.createElement('div'); peek.className = 'res__peek'; peek.hidden = true; peek.setAttribute('aria-hidden', 'true');
    peekImg = new Image(); peekImg.alt = ''; peekCv = document.createElement('canvas');
    peek.append(peekImg, peekCv); elR.appendChild(peek);
    resList.addEventListener('mousemove', followPeek);
    resList.addEventListener('mouseleave', hidePeek);
  }
}
/* the cursor jumps, no easing, like a menu on old hardware */
function pointAt(a) {
  var li = a.parentElement;
  resCursor.style.transform = 'translateY(' + (li.offsetTop + li.offsetHeight / 2) + 'px)';
}
function followPeek(e) {
  var a = e.target.closest('a[data-cover]');
  if (!a) { hidePeek(); return; }
  if (a.dataset.cover !== peekSrc) showPeek(a.dataset.cover);
  var w = peek.offsetWidth, h = peek.offsetHeight, g = 8;
  var x = e.clientX + 28; if (x + w > innerWidth - 16) x = e.clientX - 28 - w;
  var y = Math.max(16, Math.min(innerHeight - h - 16, e.clientY - h / 2));
  peek.style.transform = 'translate(' + Math.round(x / g) * g + 'px,' + Math.round(y / g) * g + 'px)';
}
function showPeek(src) {
  peekSrc = src; peekImg.src = src; peek.hidden = false;
  var r = peekCv.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2), W = r.width, H = r.height;
  peekCv.width = Math.ceil(W * dpr); peekCv.height = Math.ceil(H * dpr);
  var x = peekCv.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0);
  var s = Math.ceil(W / 12), cells = [];
  for (var yy = 0; yy < H; yy += s) for (var xx = 0; xx < W; xx += s) cells.push([xx, yy, Math.random() * .7]);
  var bg = css('--bg-subtle'), t0 = performance.now(), dur = 320;
  cancelAnimationFrame(peekRaf);
  (function frame(now) {
    var p = Math.min(1, (now - t0) / dur); x.clearRect(0, 0, W, H); x.fillStyle = bg;
    for (var i = 0; i < cells.length; i++) {
      var k = clamp((p - cells[i][2]) / .3, 0, 1), a = 1 - LEVELS[Math.min(3, Math.floor(k * 4))];
      if (a <= 0) continue; x.globalAlpha = a; x.fillRect(cells[i][0], cells[i][1], s + 1, s + 1);
    }
    x.globalAlpha = 1;
    if (p < 1) peekRaf = requestAnimationFrame(frame);
  })(t0);
}
function hidePeek() { if (!peek) return; cancelAnimationFrame(peekRaf); peek.hidden = true; peekSrc = ''; }

export const ResourcesView = {
  mount: function () {
    if (!listRendered) { listRendered = true; buildResources(); }
    elR.hidden = false; scrollTo(0, 0); renderAll();
    var first = $('a', resList); if (first) pointAt(first);
    return Promise.resolve();
  },
  unmount: function () { elR.hidden = true; hidePeek(); }
};
