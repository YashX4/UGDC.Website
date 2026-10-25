/* ============================================================
   TABLE VIEW (#view-table): the cartridge table for one jam.
   The 3D table fills the screen, the game info is laid on top of it, a plus in the very corner opens the menu.
   Clicking a cartridge zooms into its label, then the "now loading" screen shows (and opens the itch.io page if the game has a link).
   ============================================================ */
import { JAMS, OPEN_ITCH_IN_NEW_TAB } from './data.js';
import { nav } from './nav.js';
import { inkOf, rasterInto, renderT } from './pixel.js';
import { clearWipe, wipe, wipeBlock } from './transition.js';
import { $, cap, reduce, retrigger, root } from './util.js';

var el = $('#view-table'), stage = $('#tableStage'), loadEl = $('#tableLoading');
var info = $('#tInfo'), swapEl = $('#tSwap'), titleCv = $('#tTitle'), h1 = $('#tH1'), countEl = $('#tCount'),
    statusEl = $('#tStatus'), descEl = $('#tDesc'), creditsEl = $('#tCredits'),
    progText = $('#tProgText'), progBar = $('#tProgBar'),
    tload = $('#tLoad'), tLoadTitle = $('#tLoadTitle'), tPct = $('#tPct'), tBar = $('#tBar'), tLoadNote = $('#tLoadNote'), tLoadLink = $('#tLoadLink'), tLoadBack = $('#tLoadBack');
var jam = null, games = [], engine = null, cv = null, alive = false, offs = [], navT = 0;
var S = { hovered: -1, center: 3, opened: -1, shown: -1 };

function listen(t, type, fn, opt) { t.addEventListener(type, fn, opt); offs.push(function () { t.removeEventListener(type, fn, opt); }); }
function pad(v) { return (v < 10 ? '0' : '') + v; }

function paintTitle() {
  var g = games[S.shown]; if (!g) return;
  rasterInto(titleCv, g.title, innerWidth >= 1100 ? 60 : 40, inkOf(titleCv), Math.max(200, Math.min(1100, stage.clientWidth - 48) - 60));
}
function render() {
  var s = S, shown = s.opened >= 0 ? s.opened : (s.hovered >= 0 ? s.hovered : s.center), g = games[shown], n = games.length;
  statusEl.textContent = cap(s.opened >= 0 ? 'Inserting' : (s.hovered >= 0 ? 'Previewing' : 'On the table')) + ' ' + cap('by ' + g.team);
  progText.textContent = pad(s.center + 1) + ' / ' + pad(n);
  progBar.style.width = Math.round((s.center + 1) / n * 100) + '%';
  if (shown !== s.shown) {
    s.shown = shown;
    h1.textContent = g.title; descEl.textContent = g.desc;
    creditsEl.innerHTML = '';
    (g.credits || []).forEach(function (c) {
      var sp = document.createElement('span'); sp.className = 'capsub';
      var nm = document.createElement('span'); nm.className = 'cr-name'; nm.textContent = c.name;
      sp.appendChild(nm); sp.appendChild(document.createTextNode(' ' + c.role)); creditsEl.appendChild(sp);
    });
    paintTitle(); retrigger(swapEl, 'swap');
  }
}

/* ---- menu: the main nav, restyled as a corner plus on this screen (see nav.css) ---- */
function menu(o) { if (!o) nav.close(); }

/* ---- opening a game: pixel blocks cover, then the blue loader screen with the game name ---- */
var loadRun = 0;
async function zoomed(i) {
  var g = games[i], run = ++loadRun;
  wipeBlock(true);
  if (!reduce) await wipe('in', 550);
  if (run !== loadRun || !alive) return;
  tLoadTitle.dataset.text = g.title; renderT(tLoadTitle);
  tLoadNote.textContent = g.link ? 'Taking you to the itch.io page' : 'No itch.io link yet for this one';
  tLoadLink.hidden = !g.link; if (g.link) tLoadLink.href = g.link;
  tload.hidden = false; root.classList.toggle('tloading', true); clearWipe(); wipeBlock(false);
  var t0 = performance.now(), dur = 1700;
  (function tick(now) {
    if (run !== loadRun || tload.hidden) return;
    var p = Math.min(1, (now - t0) / dur);
    tPct.textContent = 'Loading ' + Math.round(p * 100) + '%'; tBar.style.width = (p * 100) + '%';
    if (p < 1) requestAnimationFrame(tick);
  })(t0);
  if (!g.link) return;
  navT = setTimeout(function () {
    try { if (OPEN_ITCH_IN_NEW_TAB) window.open(g.link, '_blank', 'noopener'); else window.location.assign(g.link); } catch (er) {}
  }, dur);
}
async function closeGame() {
  clearTimeout(navT); loadRun++;
  if (!tload.hidden && !reduce) {
    /* hand the blue to the wipe canvas, drop the loader, dissolve into the table */
    wipeBlock(true); await wipe('in', 1); tload.hidden = true; root.classList.toggle('tloading', false); await wipe('out', 700); clearWipe(); wipeBlock(false);
  } else { tload.hidden = true; root.classList.toggle('tloading', false); clearWipe(); wipeBlock(false); }
  if (engine) engine.close();
  S.opened = -1; render();
}
function onKey(e) {
  if (!engine) return;
  if (e.key === 'ArrowLeft') { e.preventDefault(); engine.step(-1); }
  else if (e.key === 'ArrowRight') { e.preventDefault(); engine.step(1); }
  else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); engine.openCenter(); }
}

export const TableView = {
  mount: function (route) {
    jam = JAMS[route.jam]; games = jam.games; alive = true; offs = [];
    el.hidden = false; loadEl.hidden = false; tload.hidden = true; root.classList.toggle('tloading', false); menu(false);
    $('#navBack').setAttribute('href', route.token === 'games' ? '#home' : '#events');
    S = { hovered: -1, center: Math.min(3, games.length - 1), opened: -1, shown: -1 };
    countEl.textContent = cap(jam.title + ' / ' + games.length + ' games');
    render();
    var c = document.createElement('canvas'); c.className = 'table__canvas'; stage.insertBefore(c, stage.firstChild); cv = c;
    listen(c, 'pointerdown', function (e) { engine && engine.down(e); });
    listen(c, 'pointermove', function (e) { engine && engine.move(e); });
    listen(c, 'pointerup', function (e) { engine && engine.up(e); });
    listen(c, 'pointerleave', function (e) { engine && engine.leave(e); });
    listen(c, 'pointercancel', function (e) { engine && engine.leave(e); });
    listen(stage, 'keydown', onKey);
    listen(document, 'keydown', function (e) { if (e.key === 'Escape') { if (S.opened >= 0) closeGame(); else menu(false); } });
    listen(window, 'resize', paintTitle);
    listen(tLoadBack, 'click', closeGame);
    /* the engine and three.js load on first use, in their own chunk */
    return import('./table.js').then(function (T) { return Promise.all([T, T.loadTableAssets(games)]); }).then(function (v) {
      var T = v[0], A = v[1];
      if (!alive || cv !== c) return;
      engine = new T.GameTable(c, games, A, {
        onHover: function (i) { S.hovered = i; c.style.cursor = i >= 0 ? 'pointer' : 'grab'; render(); },
        onCenter: function (i) { S.center = i; render(); },
        onOpen: function (i) { S.opened = i; S.hovered = -1; render(); },
        onZoomed: zoomed
      });
      loadEl.hidden = true;
      try { stage.focus({ preventScroll: true }); } catch (er) {}
    });
  },
  unmount: function () {
    alive = false; clearTimeout(navT); offs.forEach(function (f) { f(); }); offs = [];
    if (engine) { engine.dispose(); engine = null; }
    if (cv) { cv.remove(); cv = null; }
    el.hidden = true; tload.hidden = true; root.classList.toggle('tloading', false);
  }
};
