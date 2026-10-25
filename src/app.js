/* ============================================================
   APP: routes, view lifecycle, page transitions
   Routes (bare tokens so they also survive the artifact preview): ""/home -> home, about, resources, events -> poster wall, <jam key> -> cartridge table.
   Every change of page goes: pixel wipe covers -> old view unmounts, new view mounts and loads -> wipe reveals.
   Poster -> table is the exception: the camera pushes into the poster, pixel blocks cover the screen, the blue loader shows the jam name, then the table is revealed.
   ============================================================ */
import { AboutView, ResourcesView } from './about-view.js';
import { JAMS } from './data.js';
import { HomeView } from './home-view.js';
import { nav } from './nav.js';
import { TableView } from './table-view.js';
import { clearWipe, intro, loaderReveal, loaderRun, loaderShow, wipe, wipeBlock } from './transition.js';
import { renderAll } from './pixel.js';
import { $$, fonts, reduce, root, sleep } from './util.js';
import { WallView } from './wall-view.js';
import { inject } from '@vercel/analytics';

var views = { home: HomeView, about: AboutView, resources: ResourcesView, wall: WallView, table: TableView };
var cur = null, curRoute = null, busy = false;
var ctx = { openJam: openJam }; /* what views may ask of the router */

function parse(token) {
  token = String(token || '').replace(/^#\/?/, '');
  if (!token || token === 'home') return { v: 'home', token: '' };
  if (token === 'about') return { v: 'about', token: 'about' };
  if (token === 'resources') return { v: 'resources', token: 'resources' };
  if (token === 'events') return { v: 'wall', token: 'events' };
  if (JAMS[token]) return { v: 'table', token: token, jam: token };
  return { v: 'home', token: '' };
}
/* the tab title per page; home keeps the full title from index.html */
var HOME_TITLE = document.title;
function setTitle(route) {
  var name = { about: 'About', resources: 'Resources', wall: 'Events' }[route.v] || (route.jam ? (route.jam === 'games' ? 'Games' : JAMS[route.jam].title) : '');
  document.title = name ? name + ' | UMass Game Dev' : HOME_TITLE;
}
function push(route) {
  try { if ((location.hash || '').replace('#', '') !== route.token) history.pushState({ t: route.token }, '', route.token ? '#' + route.token : location.pathname + location.search); } catch (e) {}
}
/* unmount the current view, mount the next, resolve when it is ready (capped so a slow asset never traps the user behind the cover) */
async function swap(route) {
  if (cur) cur.unmount();
  cur = views[route.v]; curRoute = route;
  root.dataset.view = route.v; setTitle(route);
  nav.setCurrent(route.v === 'home' || route.v === 'about' || route.v === 'resources' ? route.v : route.token === 'games' ? 'games' : 'events');
  await Promise.race([cur.mount(route, ctx), sleep(8000)]);
}

/* go(token): full page change with the pixel wipe */
export async function go(token, opts) {
  var route = parse(token);
  if (busy || (curRoute && route.token === curRoute.token && !(opts && opts.force))) return;
  busy = true; nav.close();
  if (reduce) { await swap(route); if (!(opts && opts.noPush)) push(route); busy = false; return; }
  wipeBlock(true);
  await wipe('in', 650);
  await swap(route); if (!(opts && opts.noPush)) push(route);
  await sleep(120);
  await wipe('out', 750); clearWipe(); wipeBlock(false);
  busy = false;
}

/* openJam(key): called by the wall when the push into the poster ends.
   Blocks cover the screen, the blue loader shows the jam name while the table loads, then it reveals the table. */
export async function openJam(key) {
  if (busy || !JAMS[key]) return; busy = true;
  var route = parse(key);
  if (reduce) { await swap(route); push(route); busy = false; return; }
  wipeBlock(true);
  await wipe('in', 600);
  loaderShow(JAMS[key].title, JAMS[key].sponsors); clearWipe();
  var ready = swap(route);
  await loaderRun(ready, 1100);
  push(route);
  await loaderReveal();
  busy = false;
}

/* links marked data-transition */
$$('a[data-transition]').forEach(function (a) {
  a.addEventListener('click', function (e) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    e.preventDefault(); go(a.getAttribute('href'));
  });
});
function onNav() { var r = parse(location.hash); if (!curRoute || r.token !== curRoute.token) go(location.hash, { noPush: true }); }
addEventListener('popstate', onNav); addEventListener('hashchange', onNav);
addEventListener('pageshow', function (e) { if (e.persisted) { clearWipe(); wipeBlock(false); busy = false; } });

/* Vercel Web Analytics: cookieless visitor and page view counts. It only reports once Analytics is enabled on the Vercel project. */
inject();

/* boot: mount the first view behind the loader, keep the loader up until it is ready, then reveal */
(async function boot() {
  var route = parse(location.hash);
  var first = swap(route);
  /* views rasterize their headlines on mount, which can beat the Goethe load; draw them again once it lands */
  fonts().then(renderAll);
  await intro(first);
  await first;
  root.dataset.ready = 'true';
})();
