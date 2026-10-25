/* pill nav: collapsed pill that grows into the big menu. Links with data-transition go through the pixel wipe (app.js). */
import { paintEmblems } from './pixel.js';
import { $, $$ } from './util.js';

var navEl = $('.nav'), tog = $('#navToggle');
function setOpen(o) { navEl.dataset.open = o; if (o) { setTimeout(paintEmblems, 30); setTimeout(paintEmblems, 700); } tog.setAttribute('aria-expanded', o); tog.setAttribute('aria-label', o ? 'Close menu' : 'Open menu'); }
tog.addEventListener('click', function () { setOpen(navEl.dataset.open !== 'true'); });
document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
document.addEventListener('click', function (e) { if (!navEl.contains(e.target)) setOpen(false); });
export var nav = { close: function () { setOpen(false); }, setCurrent: function (route) {
  $$('.nav a[data-route]').forEach(function (a) { if (a.dataset.route === route) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
} };
