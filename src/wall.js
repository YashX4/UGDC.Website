/* ============================================================
   POSTER WALL ENGINE (three.js)
   PosterWall(canvas, posters, assets, callbacks): a brick wall with posters taped on, one big centred poster
   you scroll between. Tape lifts off the posters that move and sticks back down when they settle (with sound).
   Clicking the centred poster flips it and pushes the camera into the wall, then onZoomed fires.
   Callbacks: onHover(i) onCenter(i) onOpen(i) onZoomed(i). Methods: down move up wheel leave step(d) open(i) openCenter() close() dispose()
   The view that owns it is wall-view.js.
   ============================================================ */
import * as THREE from 'three';
import { ASSETS, WALL_START } from './data.js';
import { ease, loadImage } from './util.js';
import { state } from './state.js';

var THEME = { paper: '#f6f4ef', paperInk: '#6b6f80', monoFont: 'Silkscreen, monospace', tape: 0xe9e4d6,
  fontLoads: ['24px Silkscreen', '20px Goethe'],
  light: { sky: 0xf6f4ef, ground: 0x8f8f9c, hemi: .95, key: 1.6, rim: 0x002fa7 } };
var BRICK = { diff: ASSETS.wall.brick, nor: ASSETS.wall.brickNormal };

function makeBackCanvas(label, sub) {
  var c = document.createElement('canvas'); c.width = 640; c.height = 800;
  var x = c.getContext('2d');
  x.fillStyle = THEME.paper; x.fillRect(0, 0, 640, 800);
  x.strokeStyle = THEME.paperInk; x.globalAlpha = .55; x.lineWidth = 4; x.setLineDash([16, 12]); x.strokeRect(36, 36, 568, 728); x.setLineDash([]); x.globalAlpha = 1;
  x.fillStyle = THEME.paperInk; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.font = '34px ' + THEME.monoFont; x.fillText(label, 320, 380);
  x.globalAlpha = .6; x.font = '22px ' + THEME.monoFont; x.fillText(sub, 320, 430);
  return c;
}

// paper that hangs from two pieces of tape: a gentle curl toward the bottom
function paperGeo(w, h, flip) {
  var g = new THREE.PlaneGeometry(w, h, 10, 12), p = g.attributes.position;
  for (var i = 0; i < p.count; i++) {
    var x = p.getX(i), y = p.getY(i), v = (h / 2 - y) / h;
    var z = .05 * v * v + .012 * Math.sin(x * 3.1 + v * 2.2) * v;
    p.setZ(i, flip ? -z + .002 : z);
  }
  g.computeVertexNormals();
  return g;
}

function PosterWall(canvas, posters, A, cb) {
  var T = THREE, self = this;
  var G = 1.62, G2 = 1.12, H = 2.1, n = posters.length, TAU = Math.PI;
  var renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.outputEncoding = T.sRGBEncoding;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
  var scene = new T.Scene();
  var camera = new T.PerspectiveCamera(30, 2, .05, 60);
  var TH = THEME.light;
  scene.add(new T.HemisphereLight(TH.sky, TH.ground, TH.hemi));
  var key = new T.DirectionalLight(0xffffff, TH.key); key.position.set(-3.6, 3.2, 3.4); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); var sc = key.shadow.camera; sc.left = -9; sc.right = 9; sc.top = 5; sc.bottom = -5; sc.near = .5; sc.far = 16; key.shadow.bias = -.0005;
  scene.add(key);
  var rim = new T.DirectionalLight(TH.rim, .6); rim.position.set(4, -1, 3); scene.add(rim);

  var world = new T.Group(); scene.add(world);
  // brick wall: colour map and normal map under a raking light so the mortar joints read as depth
  var WALL_W = 26, WALL_H = 10, TILE = 1.6;
  function rep(t) { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(WALL_W / TILE, WALL_H / TILE); t.needsUpdate = true; }
  rep(A.brickDiff); rep(A.brickNor);
  var wall = new T.Mesh(new T.PlaneGeometry(WALL_W, WALL_H), new T.MeshStandardMaterial({ map: A.brickDiff, normalMap: A.brickNor, normalScale: new T.Vector2(1.5, 1.5), roughness: .95 }));
  wall.position.set(0, 0, -.02); wall.receiveShadow = true; scene.add(wall);

  var pick = [], items = [];
  // sound: synthesized, starts after the first click, key or scroll (browsers block audio before that)
  var actx = null;
  function audio() {
    try {
      if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
    } catch (er) { actx = null; }
    return actx && actx.state === 'running' ? actx : null;
  }
  function noiseBuf(a, dur, shape) {
    var len = Math.floor(a.sampleRate * dur), b = a.createBuffer(1, len, a.sampleRate), d = b.getChannelData(0);
    for (var q = 0; q < len; q++) d[q] = (Math.random() * 2 - 1) * shape(q / len);
    return b;
  }
  function peelSound() {
    var a = audio(); if (!a) return;
    var now = a.currentTime, dur = .34;
    var src = a.createBufferSource(); src.buffer = noiseBuf(a, dur, function (u) { return Math.pow(1 - u, 1.4) * (.55 + .45 * Math.abs(Math.sin(u * 46))); });
    var f = a.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = .9;
    f.frequency.setValueAtTime(700, now); f.frequency.exponentialRampToValueAtTime(3600, now + dur);
    var g = a.createGain(); g.gain.setValueAtTime(.22, now); g.gain.exponentialRampToValueAtTime(.001, now + dur);
    src.connect(f); f.connect(g); g.connect(a.destination); src.start(now);
  }
  function stickSound() {
    var a = audio(); if (!a) return;
    var now = a.currentTime;
    var o = a.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(190, now); o.frequency.exponentialRampToValueAtTime(70, now + .09);
    var g = a.createGain(); g.gain.setValueAtTime(.22, now); g.gain.exponentialRampToValueAtTime(.001, now + .12);
    o.connect(g); g.connect(a.destination); o.start(now); o.stop(now + .14);
    var src = a.createBufferSource(); src.buffer = noiseBuf(a, .05, function (u) { return Math.pow(1 - u, 3); });
    var hp = a.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1800;
    var g2 = a.createGain(); g2.gain.value = .14;
    src.connect(hp); hp.connect(g2); g2.connect(a.destination); src.start(now);
  }
  var tapeGeo = new T.PlaneGeometry(.36, .13);
  var seeds = [-.025, .02, -.012, .03];
  posters.forEach(function (p, i) {
    var tapes = [];
    var fImg = A.fronts[i], aspect = fImg ? fImg.width / fImg.height : .77, w = H * aspect;
    var holder = new T.Group(); holder.position.set(0, .05, .02); holder.rotation.z = seeds[i % 4]; world.add(holder);
    var ftex = fImg ? new T.Texture(fImg) : new T.CanvasTexture(makeBackCanvas('[ NEXT JAM ]', 'POSTER GOES HERE')); ftex.encoding = T.sRGBEncoding; ftex.anisotropy = 8; ftex.needsUpdate = true;
    var fm = new T.MeshStandardMaterial({ map: ftex, roughness: .85, side: T.FrontSide });
    var front = new T.Mesh(paperGeo(w, H, false), fm); front.castShadow = true; front.receiveShadow = true; holder.add(front);
    var bImg = A.backs[i], btex, bw = w;
    if (bImg) { bw = H * bImg.width / bImg.height; btex = new T.Texture(bImg); }
    else { btex = new T.CanvasTexture(makeBackCanvas('[ THEME POSTER ]', p.title.toUpperCase())); bw = H * .8; }
    btex.encoding = T.sRGBEncoding; btex.anisotropy = 8; btex.needsUpdate = true;
    var bm = new T.MeshStandardMaterial({ map: btex, roughness: .85, side: T.FrontSide });
    var back = new T.Mesh(paperGeo(bw, H, true), bm); back.rotation.y = Math.PI; back.receiveShadow = true; holder.add(back);
    [-1, 1].forEach(function (s) {
      var tmat = new T.MeshStandardMaterial({ color: THEME.tape, transparent: true, opacity: .8, roughness: .6 });
      var t = new T.Mesh(tapeGeo, tmat); t.position.set(s * (w / 2 - .12), H / 2 - .03, .012); t.rotation.z = s * .55 + seeds[(i + 1) % 4]; holder.add(t);
      tapes.push({ m: t, mat: tmat, s: s, x: t.position.x, y: t.position.y, rz: t.rotation.z });
    });
    front.userData.i = i; pick.push(front);
    items.push({ holder: holder, fm: fm, bm: bm, ftex: ftex, btex: btex, cx: 0, z: 0, s: 1, ry: 0, dim: 1, rz0: holder.rotation.z, tapes: tapes, peel: 0, sway: 0, loose: false });
  });

  var lastTg = 1, lastPeel = 0, moving = false;
  var offset = Math.min(state.wallIndex != null ? state.wallIndex : WALL_START, n - 1), target = offset, hovered = -1, lastCenter = -1, opened = -1, openAt = 0, fired = false, closing = 0;
  var ray = new T.Raycaster(), ndc = new T.Vector2(), drag = null, raf = 0, ptr = null, edgeScrolling = false, EDGE = .2;
  var baseCam = new T.Vector3(), baseLook = new T.Vector3(0, .05, 0), camLook = new T.Vector3(0, .05, 0), tmp = new T.Vector3(), endCam = new T.Vector3(), endLook = new T.Vector3();

  function resize() {
    var w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    var dist = 5.2 * Math.max(1, 1.8 / camera.aspect);
    baseCam.set(0, .05, dist);
    if (opened < 0) { camera.position.copy(baseCam); camera.lookAt(baseLook); }
    camera.updateProjectionMatrix();
  }
  function unitsPerPx() { var vh = 2 * baseCam.z * Math.tan(30 * Math.PI / 360); return vh / canvas.clientHeight; }
  function hit(e) {
    var r = canvas.getBoundingClientRect();
    ndc.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    var h = ray.intersectObjects(pick, false);
    return h.length ? h[0].object.userData.i : -1;
  }
  function clamp(v) { return Math.max(0, Math.min(n - 1, v)); }
  function setHover(i) { if (i !== hovered) { hovered = i; cb.onHover(i); } }
  function local(e) { var r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height, cx: e.clientX, cy: e.clientY, type: e.pointerType || 'mouse' }; }

  // input arrives through the component handlers (props on the canvas)
  this.down = function (e) { audio(); if (opened >= 0) return; ptr = local(e); drag = { x: e.clientX, t: target, moved: false, id: e.pointerId, type: ptr.type }; };
  this.move = function (e) {
    if (opened >= 0) return;
    ptr = local(e);
    if (drag && (e.buttons || drag.type === 'touch')) {
      var dx = e.clientX - drag.x;
      if (Math.abs(dx) > 6) { drag.moved = true; setHover(-1); try { canvas.setPointerCapture(drag.id); } catch (er) {} }
      if (drag.moved) target = clamp(drag.t - dx * unitsPerPx() / G);
    }
  };
  this.up = function (e) {
    if (opened >= 0) { drag = null; return; }
    if (drag && !drag.moved) { var i = hit(e); if (i >= 0) { if (i === Math.round(target)) self.open(i); else target = i; } }
    else if (drag) target = Math.round(target);
    drag = null;
    if ((e.pointerType || 'mouse') === 'touch') { ptr = null; setHover(-1); }
  };
  var wAcc = 0, wT = 0;
  this.wheel = function (e) {
    audio();
    if (opened >= 0) return;
    var d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY, now = performance.now();
    if (now - wT > 300) wAcc = 0;
    wAcc += d;
    if (Math.abs(wAcc) > 4 && now - wT > 130) { target = clamp(Math.round(target) + (wAcc > 0 ? 1 : -1)); wAcc = 0; wT = now; }
    try { e.preventDefault(); } catch (er) {}
  };
  this.leave = function () { if (!drag) { ptr = null; setHover(-1); if (edgeScrolling) { edgeScrolling = false; target = Math.round(target); } } };
  var ro = new ResizeObserver(resize); ro.observe(canvas); resize();

  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var dead = false;
  function frame(t) {
    var k = reduced ? 1 : .13;
    if (ptr && ptr.type !== 'touch' && !drag && opened < 0 && n > 2) {
      var ex = ptr.x / ptr.w, sp = 0;
      if (ex < EDGE) sp = -(1 - ex / EDGE); else if (ex > 1 - EDGE) sp = (ex - (1 - EDGE)) / EDGE;
      if (sp !== 0) { edgeScrolling = true; target = clamp(target + sp * Math.abs(sp) * .06); }
      else if (edgeScrolling) { edgeScrolling = false; target = Math.round(target); }
    }
    offset += (target - offset) * (reduced ? 1 : .22);
    var gap = Math.abs(target - offset), tg = Math.round(target), nowT = performance.now();
    if (tg !== lastTg && opened < 0) { var lo = Math.min(lastTg, tg), hi = Math.max(lastTg, tg); for (var li = lo; li <= hi; li++) items[li].loose = true; lastTg = tg; if (nowT - lastPeel > 220) { peelSound(); lastPeel = nowT; } }
    if (gap > .12) moving = true;
    else if (moving && gap < .03) { moving = false; for (var lj = 0; lj < n; lj++) items[lj].loose = false; stickSound(); }
    if (ptr && ptr.type !== 'touch' && !(drag && drag.moved) && opened < 0) setHover(hit({ clientX: ptr.cx, clientY: ptr.cy }));
    var el = opened >= 0 ? (performance.now() - openAt) / 1000 : 0;
    for (var i = 0; i < n; i++) {
      var c = items[i], d = i - offset, ad = Math.min(1, Math.abs(d)), sg = d < 0 ? -1 : 1;
      var x = sg * (Math.abs(d) < 1 ? Math.abs(d) * G : G + (Math.abs(d) - 1) * G2);
      var s = 1.06 - .36 * ad, z = .25 * (1 - ad), dimT = 1 - .5 * ad, ry = 0;
      if (i === opened) { var f = ease(el / .9); ry = Math.PI * f; z = .25 + .15 * f; s = 1.06 + .06 * f; dimT = 1; }
      else if (opened >= 0) dimT = .15;
      c.dim += (dimT - c.dim) * k;
      var bob = (i === hovered && ad < .5 && opened < 0 && !reduced) ? Math.sin(t / 420) * .012 : 0;
      c.z = z;
      c.holder.position.set(x, .17 + bob, .02 + z);
      c.peel += ((c.loose ? 1 : 0) - c.peel) * (reduced ? 1 : .3);
      c.sway += ((c.loose ? (offset - target) * .1 : 0) - c.sway) * (reduced ? 1 : .3);
      c.holder.position.z += .1 * c.peel;
      c.holder.rotation.set(0, ry, c.rz0 * ad + c.sway * (i === opened ? 0 : 1));
      for (var q = 0; q < c.tapes.length; q++) {
        var tp2 = c.tapes[q], pl = c.peel;
        tp2.m.position.set(tp2.x + tp2.s * .1 * pl, tp2.y + .22 * pl, .012 + .16 * pl);
        tp2.m.rotation.z = tp2.rz + tp2.s * 1.1 * pl;
        tp2.m.scale.set(1 - .25 * pl, 1, 1);
        tp2.mat.opacity = .8 * (1 - .92 * pl);
      }
      c.holder.scale.setScalar(s);
      c.fm.color.setScalar(c.dim); c.bm.color.setScalar(c.dim);
    }
    if (opened >= 0) {
      var tp = reduced ? (el > 1 ? 1 : 0) : ease((el - 1.7) / 1.0);
      var pz = .02 + items[opened].z;
      endCam.set(0, .17, pz + 2.1); endLook.set(0, .17, pz);
      camera.position.lerpVectors(baseCam, endCam, tp);
      camLook.lerpVectors(baseLook, endLook, tp);
      camera.lookAt(camLook);
      if (!fired && el > (reduced ? 1.2 : 2.5)) { fired = true; cb.onZoomed(opened); }
    } else if (closing > 0) {
      camera.position.lerp(baseCam, .12); camLook.lerp(baseLook, .12); camera.lookAt(camLook); closing--;
    }
    var center = Math.round(clamp(offset));
    if (center !== lastCenter && opened < 0) { lastCenter = center; cb.onCenter(center); }
    if (dead) return; /* dispose() can be called from inside a callback */
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  this.step = function (d) { audio(); if (opened < 0) target = clamp(Math.round(target) + d); };
  this.open = function (i) { if (opened >= 0 || !posters[i].jam) return; setHover(-1); target = clamp(i); opened = i; openAt = performance.now(); fired = false; cb.onOpen(i); };
  this.openCenter = function () { self.open(Math.round(clamp(target))); };
  this.close = function () { opened = -1; closing = 90; };
  this.dispose = function () {
    dead = true; cancelAnimationFrame(raf); ro.disconnect();
    items.forEach(function (c) { c.ftex.dispose(); c.btex.dispose(); c.fm.dispose(); c.bm.dispose(); });
    renderer.dispose(); try { renderer.forceContextLoss(); } catch (er) {}
  };
}

function loadWallAssets(posters) {
  var fonts = document.fonts ? Promise.all(THEME.fontLoads.map(function (f) { return document.fonts.load(f); })).catch(function () {}) : Promise.resolve();
  return Promise.all([loadImage(BRICK.diff), loadImage(BRICK.nor), fonts,
    Promise.all(posters.map(function (p) { return p.front ? loadImage(p.front) : null; })),
    Promise.all(posters.map(function (p) { return p.back ? loadImage(p.back).catch(function () { return null; }) : null; }))])
    .then(function (v) {
      var T = THREE;
      function tx(img, srgb) { var t = new T.Texture(img); if (srgb) t.encoding = T.sRGBEncoding; t.anisotropy = 8; t.needsUpdate = true; return t; }
      return { brickDiff: tx(v[0], true), brickNor: tx(v[1]), fronts: v[3], backs: v[4] };
    });
}

export { PosterWall, loadWallAssets };
