/* HOME: static markup in index.html (#view-home) plus the image trail that follows the mouse over the title */
import { ASSETS } from './data.js';
import { renderAll } from './pixel.js';
import { $, reduce } from './util.js';

var el = $('#view-home'), trail = $('.trail'), title = $('.title', el), started = false;
/* PHOTO TRAIL with physics. Each photo is a little body: it is thrown with the speed of the cursor, spins from that
   speed, slows down with drag, bounces off the screen edges and pushes other photos away.
   It pops in with a springy overshoot and shrinks away at the end of its life. */
var bodies = [], raf = 0, last = 0, idx = 0, W = innerWidth, H = innerHeight;
addEventListener('resize', function () { W = innerWidth; H = innerHeight; });
var GRAV = 0, DRAG = 2.4, BOUNCE = .5, LIFE = 7000, MAXN = 14;
var cur = { x: -999, y: -999, vx: 0, vy: 0, t: 0, on: false }; /* the cursor is a pusher */
function spring(t) { /* 0..1 in, small overshoot */
  if (t >= 1) return 1; var c = 1.9; t -= 1; return 1 + (c + 1) * t * t * t + c * t * t;
}
function spawn(x, y, vx, vy) {
  var im = new Image(); im.src = ASSETS.trail[idx++ % ASSETS.trail.length]; im.alt = ''; im.draggable = false;
  trail.appendChild(im);
  var sp = Math.hypot(vx, vy), cap = 1100, k = sp > cap ? cap / sp : 1;
  var b = { el: im, x: x, y: y, vx: vx * k * .3, vy: vy * k * .3, rot: (Math.random() - .5) * 14, vr: (vx * k) * .012 + (Math.random() - .5) * 40, age: 0, w: 150, h: 100, s: 0 };
  im.onload = function () { b.h = b.w * (im.naturalHeight / im.naturalWidth); if (b.h > 200) { b.h = 200; b.w = b.h * (im.naturalWidth / im.naturalHeight); } im.style.width = b.w + 'px'; };
  bodies.push(b);
  if (bodies.length > MAXN) bodies[0].age = Math.max(bodies[0].age, LIFE - 400);
  if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
}
function tick(now) {
  var dt = Math.min(.033, (now - last) / 1000); last = now;
  var i, j, a, c;
  for (i = 0; i < bodies.length; i++) {
    a = bodies[i]; a.age += dt * 1000;
    a.vy += GRAV * dt; var d = Math.exp(-DRAG * dt); a.vx *= d; a.vy *= d; a.vr *= Math.exp(-2.2 * dt);
    a.x += a.vx * dt; a.y += a.vy * dt; a.rot += a.vr * dt;
    var hw = a.w * .5, hh = a.h * .5;
    if (a.x < hw) { a.x = hw; a.vx = Math.abs(a.vx) * BOUNCE; a.vr *= -.6; }
    if (a.x > W - hw) { a.x = W - hw; a.vx = -Math.abs(a.vx) * BOUNCE; a.vr *= -.6; }
    if (a.y < hh) { a.y = hh; a.vy = Math.abs(a.vy) * BOUNCE; }
    if (a.y > H - hh) { a.y = H - hh; a.vy = -Math.abs(a.vy) * BOUNCE; }
  }
  /* the cursor shoves photos: away from it, plus a kick along the way it is moving, plus some spin */
  if (cur.on) {
    var cs = Math.exp(-6 * dt); cur.vx *= cs; cur.vy *= cs;
    for (i = 0; i < bodies.length; i++) {
      a = bodies[i]; var px = a.x - cur.x, py = a.y - cur.y, pd = Math.hypot(px, py) || .01, pr = (a.w + a.h) * .25 + 70;
      if (pd < pr) {
        var f = 1 - pd / pr, nx = px / pd, ny = py / pd;
        a.vx += nx * f * 2600 * dt + cur.vx * f * 9 * dt; a.vy += ny * f * 2600 * dt + cur.vy * f * 9 * dt ;
        a.vr += (cur.vx * ny - cur.vy * nx) * f * .03 * dt * 60 + nx * f * 20 * dt;
        if (a.age > LIFE - 1500) a.age = LIFE - 1500; /* touched photos stay a little longer */
      }
    }
  }
  /* soft push apart */
  for (i = 0; i < bodies.length; i++) for (j = i + 1; j < bodies.length; j++) {
    a = bodies[i]; c = bodies[j];
    var dx = c.x - a.x, dy = c.y - a.y, ra = (a.w + a.h) * .2, rc = (c.w + c.h) * .2, dist = Math.hypot(dx, dy) || .01, min = ra + rc;
    if (dist < min) { var p = (min - dist) / dist * .5; a.x -= dx * p; a.y -= dy * p; c.x += dx * p; c.y += dy * p; a.vx -= dx / dist * 40; a.vy -= dy / dist * 40; c.vx += dx / dist * 40; c.vy += dy / dist * 40; }
  }
  for (i = bodies.length - 1; i >= 0; i--) {
    a = bodies[i];
    var t = a.age / LIFE, sIn = spring(Math.min(1, a.age / 380)), sOut = t > .82 ? Math.max(0, 1 - (t - .82) / .18) : 1, s = sIn * sOut;
    a.el.style.opacity = Math.min(1, a.age / 120) * sOut;
    a.el.style.transform = 'translate3d(' + (a.x - a.w * .5) + 'px,' + (a.y - a.h * .5) + 'px,0) rotate(' + a.rot + 'deg) scale(' + s + ')';
    if (a.age >= LIFE) { a.el.remove(); bodies.splice(i, 1); }
  }
  raf = bodies.length ? requestAnimationFrame(tick) : 0;
}
function startTrail() {
  if (started) return; started = true;
  var fine = matchMedia('(pointer:fine)').matches; if (!fine || reduce) return;
  var spawnT = 0, lx = null, ly = null, lt = 0, vx = 0, vy = 0, px = null, py = null, pt = 0;
  document.addEventListener('mousemove', function (e) {
    if (el.hidden) return;
    var n = performance.now(), d = Math.max(8, n - pt) / 1000;
    if (px !== null) { cur.vx = cur.vx * .4 + ((e.clientX - px) / d) * .6; cur.vy = cur.vy * .4 + ((e.clientY - py) / d) * .6; }
    px = e.clientX; py = e.clientY; pt = n; cur.x = px; cur.y = py; cur.on = true;
    if (bodies.length && !raf) { last = n; raf = requestAnimationFrame(tick); }
  });
  document.addEventListener('mouseleave', function () { cur.on = false; px = null; });
  title.addEventListener('mousemove', function (e) {
    var now = performance.now(), dt = Math.max(8, now - lt) / 1000;
    if (lx !== null) { vx = vx * .5 + ((e.clientX - lx) / dt) * .5; vy = vy * .5 + ((e.clientY - ly) / dt) * .5; }
    if (now - spawnT < 420 || (lx !== null && Math.hypot(e.clientX - lx, e.clientY - ly) < 260)) return;
    spawnT = now;
    lx = e.clientX; ly = e.clientY; lt = now;
    spawn(e.clientX, e.clientY, vx, vy);
  });
  title.addEventListener('mouseleave', function () { lx = ly = null; vx = vy = 0; });
}
export const HomeView = {
  mount: function () { el.hidden = false; scrollTo(0, 0); renderAll(); startTrail(); return Promise.resolve(); },
  unmount: function () { el.hidden = true; trail.innerHTML = ''; bodies = []; if (raf) { cancelAnimationFrame(raf); raf = 0; } }
};
