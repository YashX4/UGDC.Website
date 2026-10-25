/* shared helpers */
export var root = document.documentElement;
export var $ = function (s, c) { return (c || document).querySelector(s); };
export var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
export var css = function (n) { return getComputedStyle(root).getPropertyValue(n).trim(); };
export var reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
export var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
export var ease = function (t) { t = Math.max(0, Math.min(1, t)); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
export var loadImage = function (src) {
  return new Promise(function (res, rej) { var im = new Image(); im.crossOrigin = 'anonymous'; im.onload = function () { res(im); }; im.onerror = rej; im.src = src; });
};
export var getJSON = function (u) { return fetch(u).then(function (r) { return r.json(); }); };
export var fonts = function () {
  if (!document.fonts) return Promise.resolve();
  return Promise.race([
    Promise.all([document.fonts.load('700 20px Goethe'), document.fonts.load('12px Silkscreen')]).then(function () { return document.fonts.ready; }),
    new Promise(function (r) { setTimeout(r, 2500); })]);
};
export var cap = function (t) { return '[ ' + String(t).toUpperCase() + ' ]'; };
/* restart a CSS animation class */
export var retrigger = function (el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };
