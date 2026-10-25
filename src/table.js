/* ============================================================
   CARTRIDGE TABLE ENGINE (three.js)
   GameTable(canvas, games, assets, callbacks) draws a wooden table with one cartridge per game.
   Pointer: hover near the left or right edge slides the row, hover a cartridge to tilt it,
   click to open (camera dollies toward it and pushes into the label), drag or touch to slide.
   Callbacks: onHover(i) onCenter(i) onOpen(i) onZoomed(i).
   Methods: down move up leave step(d) open(i) openCenter() close() isOpen() dispose()
   The view that owns it is table-view.js.
   ============================================================ */
import * as THREE from 'three';
import { ASSETS } from './data.js';
import { ease, getJSON, loadImage } from './util.js';

var PLASTIC = ['#cfccc4', '#002fa7', '#0a0f26', '#f6f4ef', '#6b6f80', '#002fa7', '#cfccc4', '#1d2342', '#ebe8e1', '#002fa7', '#6b6f80', '#f6f4ef'];
var LABEL = { x: 520, y: 520, w: 352, h: 334 };

function drawCropped(ctx, img, x, y, w, h) {
  var s = Math.max(w / img.width, h / img.height), sw = w / s, sh = h / s;
  ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h);
}

function makeCartCanvas(base, color, img) {
  var c = document.createElement('canvas'); c.width = c.height = 1024;
  var x = c.getContext('2d');
  x.drawImage(base, 0, 0, 1024, 1024);
  x.globalCompositeOperation = 'overlay'; x.fillStyle = color; x.fillRect(0, 0, 1024, 1024);
  x.globalCompositeOperation = 'source-over';
  x.drawImage(base, 520, 268, 400, 70, 520, 268, 400, 70);
  x.drawImage(base, 196, 742, 52, 52, 196, 742, 52, 52);
  x.save(); x.font = '24px Silkscreen, monospace'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.globalAlpha = .3; x.fillStyle = '#000'; x.fillText('UMASS GAME DEV', 698, 450);
  x.globalAlpha = .22; x.fillStyle = '#fff'; x.fillText('UMASS GAME DEV', 696, 448); x.restore();
  x.fillStyle = '#f6f4ef'; x.fillRect(LABEL.x, LABEL.y, LABEL.w, LABEL.h);
  if (img) drawCropped(x, img, LABEL.x + 8, LABEL.y + 8, LABEL.w - 16, LABEL.h - 16);
  else {
    x.strokeStyle = '#cfccc4'; x.lineWidth = 3; x.setLineDash([10, 8]);
    x.strokeRect(LABEL.x + 18, LABEL.y + 18, LABEL.w - 36, LABEL.h - 36); x.setLineDash([]);
    x.font = '20px Silkscreen, monospace'; x.fillStyle = '#6b6f80'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText('COVER ART', LABEL.x + LABEL.w / 2, LABEL.y + LABEL.h / 2);
  }
  return c;
}

function makeSpineCanvas(title, color) {
  title = String(title).toUpperCase();
  var c = document.createElement('canvas'); c.width = 64; c.height = 512;
  var x = c.getContext('2d');
  x.fillStyle = '#f6f4ef'; x.fillRect(0, 0, 64, 512);
  x.fillStyle = color; x.fillRect(0, 0, 64, 8); x.fillRect(0, 504, 64, 8);
  x.save(); x.translate(32, 24); x.rotate(Math.PI / 2);
  x.font = '24px Silkscreen, monospace'; x.fillStyle = '#0a0f26'; x.textBaseline = 'middle';
  var t = title; if (x.measureText(t).width > 460) { while (x.measureText(t + '...').width > 460 && t.length > 3) t = t.slice(0, -1); t += '...'; }
  x.fillText(t, 0, 0); x.restore();
  return c;
}

function GameTable(canvas, games, A, cb) {
  var T = THREE, self = this;
  var SP = .22, BASE = Math.PI / 2, n = games.length;
  var renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.outputEncoding = T.sRGBEncoding;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
  var scene = new T.Scene();
  scene.fog = new T.Fog(0xebe8e1, 6, 14);
  var camera = new T.PerspectiveCamera(30, 2, .05, 60);
  scene.add(new T.HemisphereLight(0xf6f4ef, 0x8f8f9c, 1));
  var key = new T.DirectionalLight(0xffffff, 1.5); key.position.set(-2, 3.2, 3.2); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); var sc = key.shadow.camera; sc.left = -5; sc.right = 5; sc.top = 3; sc.bottom = -3; sc.near = .5; sc.far = 14; key.shadow.bias = -.0006;
  scene.add(key);
  var rim = new T.DirectionalLight(0x002fa7, .7); rim.position.set(3, 1.5, -2.5); scene.add(rim);

  var world = new T.Group(); scene.add(world);

  // table, stretched to fit the row of cartridges
  var rowLen = (n - 1) * SP, S = 2.6, tableLen = Math.max(5.4, rowLen + 2.2);
  var tGeo = new T.BufferGeometry();
  tGeo.setAttribute('position', new T.Float32BufferAttribute(A.table.p, 3));
  tGeo.setAttribute('normal', new T.Float32BufferAttribute(A.table.n, 3));
  tGeo.setAttribute('uv', new T.Float32BufferAttribute(A.table.u, 2));
  tGeo.setIndex(A.table.i);
  var table = new T.Mesh(tGeo, new T.MeshStandardMaterial({ map: A.tableDiff, normalMap: A.tableNormal, roughness: .75 }));
  table.scale.set(tableLen / 1.8, S, S);
  table.position.set(rowLen / 2, -.5 - .5489 * S, -.1);
  table.castShadow = true; table.receiveShadow = true;
  world.add(table);
  var floor = new T.Mesh(new T.PlaneGeometry(40, 20), new T.ShadowMaterial({ opacity: .35 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -.5 - .5489 * S; floor.receiveShadow = true; scene.add(floor);

  var pick = [], carts = [];
  /* the cartridge's real height, for framing the camera */
  A.cartGeo.computeBoundingBox();
  var cartTop = A.cartGeo.boundingBox.max.y, cartH = cartTop - A.cartGeo.boundingBox.min.y;
  var spineGeo = new T.PlaneGeometry(.118, .64);
  games.forEach(function (g, i) {
    var color = g.color || PLASTIC[i % PLASTIC.length];
    var tex = new T.CanvasTexture(makeCartCanvas(A.cartBase, color, A.covers[i])); tex.encoding = T.sRGBEncoding; tex.anisotropy = 8;
    var mesh = new T.Mesh(A.cartGeo, new T.MeshStandardMaterial({ map: tex, normalMap: A.cartNormal, roughness: .45 }));
    mesh.castShadow = true; mesh.receiveShadow = true; mesh.userData.i = i;
    var stex = new T.CanvasTexture(makeSpineCanvas(g.title, color)); stex.encoding = T.sRGBEncoding; stex.anisotropy = 8;
    var spine = new T.Mesh(spineGeo, new T.MeshStandardMaterial({ map: stex, roughness: .7 }));
    spine.position.set(-.4445, -.1, 0); spine.rotation.y = -Math.PI / 2; spine.userData.i = i;
    var holder = new T.Group(); holder.add(mesh); holder.add(spine); world.add(holder);
    pick.push(mesh, spine);
    carts.push({ holder: holder, mesh: mesh, tex: tex, stex: stex, rot: BASE, z: 0, y: 0, dx: 0 });
  });

  /* target and offset are the camera position along the row, kept inside [lo, hi] so the row never slides past its
     first or last cartridge. sel is the cartridge the info text shows when nothing is hovered. */
  var offset = Math.min(3, n - 1), target = offset, hovered = -1, lastCenter = -1, sel = offset, follow = true, lo = 0, hi = n - 1, fits = false, sized = false;
  var opened = -1, openAt = 0, fired = false, closing = 0;
  var ray = new T.Raycaster(), ndc = new T.Vector2(), drag = null, raf = 0;
  var baseCam = new T.Vector3(), baseLook = new T.Vector3(0, .11, 0), camLook = new T.Vector3(0, .11, 0), baseFov = 30;
  var labelLocal = new T.Vector3(0, -.08, .07), labelW = new T.Vector3(), zoomPos = new T.Vector3(), tmp = new T.Vector3(), midCam = new T.Vector3(), midLook = new T.Vector3();

  function resize() {
    var w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    var tanH = Math.tan(baseFov * Math.PI / 360), dist = 2.9 * Math.max(1, 1.9 / camera.aspect);
    var band = cb.band ? cb.band() : .3;
    /* few games: come in closer so the row fills the screen instead of sitting on empty table.
       Portrait screens show about three and a half cartridges and slide, instead of shrinking the whole row. */
    dist = Math.min(dist, (rowLen + 1.1) / (2 * tanH * camera.aspect));
    if (camera.aspect < 1) dist = Math.min(dist, (3.5 * SP + .5) / (2 * tanH * camera.aspect));
    /* never so close that a lifted cartridge cannot fit between the text band and the bottom bar */
    dist = Math.max(dist, cartH * 1.3 / (Math.max(.3, 1 - band - .12) * 2 * tanH));
    baseCam.set(0, .24, dist);
    /* how far the row may slide, in cartridges: half the visible width less a margin past the end cartridges */
    var half = dist * tanH * camera.aspect / SP - 1.4;
    fits = half * 2 >= n - 1;
    lo = fits ? (n - 1) / 2 : half; hi = fits ? (n - 1) / 2 : n - 1 - half;
    target = clampC(target); if (!sized) { offset = target; sized = true; }
    /* aim higher until a lifted cartridge clears the text band at the top (band comes from the view) */
    camera.updateProjectionMatrix();
    baseLook.y = .11;
    for (var k = 0; k < 40; k++) {
      camera.position.copy(baseCam); camera.lookAt(baseLook); camera.updateMatrixWorld();
      var top = tmp.set(0, cartTop + .04, .5).project(camera).y, bottom = tmp.set(0, cartTop - cartH, 0).project(camera).y;
      if ((1 - top) / 2 >= band || (1 - bottom) / 2 > .93) break;
      baseLook.y += .008;
    }
    if (opened < 0) { camera.position.copy(baseCam); camLook.copy(baseLook); camera.lookAt(baseLook); }
  }
  function clampC(v) { return Math.max(lo, Math.min(hi, v)); }
  function unitsPerPx() { var vh = 2 * baseCam.z * Math.tan(baseFov * Math.PI / 360); return vh / canvas.clientHeight; }
  function hit(e) {
    var r = canvas.getBoundingClientRect();
    ndc.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    var h = ray.intersectObjects(pick, false);
    return h.length ? h[0].object.userData.i : -1;
  }
  function clamp(v) { return Math.max(0, Math.min(n - 1, v)); }
  function setHover(i) { if (i !== hovered) { hovered = i; cb.onHover(i); } }

  // input arrives through the component's handlers (React props on the canvas)
  // mouse: hover near the left or right edge to slide the row, hover a cartridge to tilt it, click to open
  // touch: drag to slide, tap to open
  var ptr = null, edgeScrolling = false, EDGE = .2;
  function local(e) { var r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height, cx: e.clientX, cy: e.clientY, type: e.pointerType || 'mouse' }; }
  this.down = function (e) {
    if (opened >= 0) return;
    ptr = local(e);
    drag = { x: e.clientX, t: target, moved: false, id: e.pointerId, type: ptr.type };
  };
  this.move = function (e) {
    if (opened >= 0) return;
    ptr = local(e);
    if (drag && (e.buttons || drag.type === 'touch')) {
      var dx = e.clientX - drag.x;
      if (Math.abs(dx) > 6) { drag.moved = true; setHover(-1); try { canvas.setPointerCapture(drag.id); } catch (er) {} }
      if (drag.moved) { target = clampC(drag.t - dx * unitsPerPx() / SP); follow = true; }
    }
  };
  this.up = function (e) {
    if (opened >= 0) { drag = null; return; }
    if (drag && !drag.moved) { var i = hit(e); if (i >= 0) self.open(i); }
    else if (drag) target = clampC(Math.round(target));
    drag = null;
    if ((e.pointerType || 'mouse') === 'touch') { ptr = null; setHover(-1); }
  };
  this.leave = function () { if (!drag) { ptr = null; setHover(-1); if (edgeScrolling) { edgeScrolling = false; target = clampC(Math.round(target)); } } };
  var ro = new ResizeObserver(resize); ro.observe(canvas); resize();

  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var dead = false;
  function frame(t) {
    var k = reduced ? 1 : .14;
    // edge hover scroll (mouse only, not while dragging or open)
    if (ptr && ptr.type !== 'touch' && !drag && opened < 0 && !fits) {
      var ex = ptr.x / ptr.w, sp = 0;
      if (ex < EDGE) sp = -(1 - ex / EDGE); else if (ex > 1 - EDGE) sp = (ex - (1 - EDGE)) / EDGE;
      if (sp !== 0) { edgeScrolling = true; follow = true; target = clampC(target + sp * Math.abs(sp) * .16); }
      else if (edgeScrolling) { edgeScrolling = false; target = clampC(Math.round(target)); }
    }
    offset += (target - offset) * (reduced ? 1 : .12);
    // hover follows the cursor even while the row slides under it
    if (ptr && ptr.type !== 'touch' && !(drag && drag.moved) && opened < 0) setHover(hit({ clientX: ptr.cx, clientY: ptr.cy }));
    world.position.x = -offset * SP;
    var act = opened >= 0 ? -1 : hovered;
    var el = opened >= 0 ? (performance.now() - openAt) / 1000 : 0;
    for (var i = 0; i < n; i++) {
      var c = carts[i], rot = BASE, z = 0, y = 0, dx = 0;
      if (act >= 0 && i !== act) { var d = i - act, ad = Math.abs(d); if (ad <= 3) dx = Math.sign(d) * (.16 - (ad - 1) * .045); }
      if (i === hovered && opened < 0) { rot = BASE - .62; z = .5; y = .02; }
      if (i === opened) {
        var p1 = ease(el / .9);
        rot = BASE * (1 - p1); z = .55 + .75 * p1; y = .02 + .12 * Math.sin(Math.min(1, el / .9) * Math.PI);
      } else if (opened >= 0) { var dd = i - opened; if (Math.abs(dd) <= 2) dx = Math.sign(dd) * .1; }
      var kk = (i === opened) ? 1 : k;
      c.rot += (rot - c.rot) * kk; c.z += (z - c.z) * kk; c.y += (y - c.y) * kk; c.dx += (dx - c.dx) * k;
      var bob = (i === hovered && opened < 0 && !reduced) ? Math.sin(t / 260) * .006 : 0;
      c.holder.position.set(i * SP + c.dx, c.y + bob, c.z);
      c.holder.rotation.y = c.rot;
    }
    // camera
    if (opened >= 0) {
      var zp = reduced ? (el > .9 ? 1 : 0) : ease((el - 1.5) / 1.0);
      var pa = reduced ? 1 : ease(el / 1.1);
      world.updateMatrixWorld(true);
      labelW.copy(labelLocal); carts[opened].holder.localToWorld(labelW);
      zoomPos.copy(labelW); zoomPos.z += .8;
      // first a dolly toward the cartridge, then the push into the label
      midCam.set(labelW.x, .02, baseCam.z * .78);
      midLook.set(labelW.x, -.1, labelW.z);
      tmp.lerpVectors(baseCam, midCam, pa);
      camera.position.lerpVectors(tmp, zoomPos, zp);
      tmp.lerpVectors(baseLook, midLook, pa);
      camLook.lerpVectors(tmp, labelW, zp);
      camera.lookAt(camLook);
      if (!fired && el > (reduced ? 1 : 2.35)) { fired = true; cb.onZoomed(opened); }
    } else if (closing > 0) {
      camera.position.lerp(baseCam, .12); camLook.lerp(baseLook, .12); camera.lookAt(camLook);
      closing--;
    }
    if (follow) sel = Math.round(clamp(offset));
    if (sel !== lastCenter && opened < 0) { lastCenter = sel; cb.onCenter(sel); }
    if (dead) return; /* dispose() can be called from inside a callback */
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  /* keys walk every cartridge, the camera follows as far as the row allows */
  this.step = function (d) { if (opened < 0) { follow = false; sel = clamp(sel + d); target = clampC(sel); } };
  this.isOpen = function () { return opened >= 0; };
  this.open = function (i) {
    if (opened >= 0) return;
    setHover(-1); target = clampC(i); opened = i; openAt = performance.now(); fired = false;
    carts[i].z = Math.max(carts[i].z, .5);
    cb.onOpen(i);
  };
  this.openCenter = function () { self.open(sel); };
  this.close = function () { opened = -1; closing = 90; };
  this.dispose = function () {
    dead = true; cancelAnimationFrame(raf); ro.disconnect();
    carts.forEach(function (c) { c.tex.dispose(); c.stex.dispose(); c.mesh.material.dispose(); });
    renderer.dispose(); try { renderer.forceContextLoss(); } catch (er) {}
  };
}

function loadTableAssets(games) {
  var AS = ASSETS.table;
  var fonts = document.fonts ? Promise.all([document.fonts.load('24px Silkscreen'), document.fonts.load('20px Goethe')]).catch(function () {}) : Promise.resolve();
  return Promise.all([getJSON(AS.cart), getJSON(AS.table), loadImage(AS.cartBase), loadImage(AS.cartNormal), loadImage(AS.tableDiff), loadImage(AS.tableNormal), fonts,
    Promise.all(games.map(function (g) { return g.cover ? loadImage(g.cover).catch(function () { return null; }) : null; }))])
    .then(function (v) {
      var T = THREE;
      var geo = new T.BufferGeometry();
      geo.setAttribute('position', new T.Float32BufferAttribute(v[0].p, 3));
      geo.setAttribute('uv', new T.Float32BufferAttribute(v[0].u, 2));
      geo.computeVertexNormals();
      function tx(img, srgb) { var t = new T.Texture(img); if (srgb) t.encoding = T.sRGBEncoding; t.anisotropy = 8; t.needsUpdate = true; return t; }
      return { cartGeo: geo, table: v[1], cartBase: v[2], cartNormal: tx(v[3]), tableDiff: tx(v[4], true), tableNormal: tx(v[5]), covers: v[7] };
    });
}

var CELLS = ['#ebe8e1', '#f6f4ef', '#002fa7', '#0a0f26']; /* colours of the pixel dissolve on the loading screen */
export { GameTable, loadTableAssets, CELLS as TABLE_CELLS };
