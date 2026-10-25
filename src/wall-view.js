/* ============================================================
   WALL VIEW (#view-wall): owns the poster wall engine, the text laid on the wall, and input.
   Input: hover the screen edges to scroll, wheel, drag, arrow keys, click a side poster to centre it,
   click (or Enter) the centred poster to open its jam.
   ============================================================ */
import { POSTERS, WALL_START } from './data.js';
import { inkOf, rasterInto } from './pixel.js';
import { $, cap, retrigger } from './util.js';
import { state } from './state.js';

var P = POSTERS;
var el = $('#view-wall'), stage = $('#wallStage'), swapEl = $('#wallSwap'), titleCv = $('#wallTitle'),
    h1 = $('#wallH1'), capEl = $('#wallCap'), loadEl = $('#wallLoading');
var engine = null, cv = null, alive = false, shown = -1, opened = -1, offs = [];

function paintTitle() {
  var p = P[shown]; if (!p) return;
  rasterInto(titleCv, p.title, innerWidth >= 1100 ? 60 : 40, inkOf(titleCv), Math.max(200, stage.clientWidth - 48));
}
function setShown(i) {
  if (i === shown) return; shown = i;
  var p = P[i];
  h1.textContent = p.title;
  capEl.textContent = cap(p.date) + (p.theme ? ' ' + cap(p.theme) : '');
  paintTitle(); retrigger(swapEl, 'swap');
}
function listen(target, type, fn, opt) { target.addEventListener(type, fn, opt); offs.push(function () { target.removeEventListener(type, fn, opt); }); }
function onKey(e) {
  if (!engine) return;
  if (e.key === 'ArrowLeft') { e.preventDefault(); engine.step(-1); }
  else if (e.key === 'ArrowRight') { e.preventDefault(); engine.step(1); }
  else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); engine.openCenter(); }
  else if (e.key === 'Escape' && opened >= 0) { engine.close(); opened = -1; }
}
function onResize() { paintTitle(); }

export const WallView = {
  /* ctx.openJam(key) is the router's poster to table hop (app.js) */
  mount: function (route, ctx) {
    alive = true; el.hidden = false; shown = -1; opened = -1;
    loadEl.hidden = false;
    var c = document.createElement('canvas'); c.className = 'wall__canvas'; stage.insertBefore(c, stage.firstChild); cv = c;
    setShown(state.wallIndex != null ? state.wallIndex : WALL_START);
    listen(c, 'pointerdown', function (e) { engine && engine.down(e); });
    listen(c, 'pointermove', function (e) { engine && engine.move(e); });
    listen(c, 'pointerup', function (e) { engine && engine.up(e); });
    listen(c, 'pointerleave', function (e) { engine && engine.leave(e); });
    listen(c, 'pointercancel', function (e) { engine && engine.leave(e); });
    listen(c, 'wheel', function (e) { engine && engine.wheel(e); }, { passive: false });
    listen(stage, 'keydown', onKey);
    listen(window, 'resize', onResize);
    /* the engine and three.js load on first use, in their own chunk */
    return import('./wall.js').then(function (W) { return Promise.all([W, W.loadWallAssets(P)]); }).then(function (v) {
      var W = v[0], A = v[1];
      if (!alive || cv !== c) return;
      engine = new W.PosterWall(c, P, A, {
        onHover: function (i) { c.style.cursor = i >= 0 ? 'pointer' : 'default'; },
        onCenter: function (i) { state.wallIndex = i; if (opened < 0) setShown(i); },
        onOpen: function (i) { opened = i; setShown(i); },
        onZoomed: function (i) { ctx.openJam(P[i].jam); }
      });
      loadEl.hidden = true;
      try { stage.focus({ preventScroll: true }); } catch (er) {}
    });
  },
  unmount: function () {
    alive = false; offs.forEach(function (f) { f(); }); offs = [];
    if (engine) { engine.dispose(); engine = null; }
    if (cv) { cv.remove(); cv = null; }
    el.hidden = true;
  }
};
