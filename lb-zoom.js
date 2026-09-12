/*! lb-zoom.js v1.0.0 — Westfalia Jagdreisen
 *  Pinch-Zoom, Doppeltipp und Ziehen für BILDER in der Webflow-Lightbox.
 *
 *  Koexistenz mit dem vorhandenen Wisch-Blättern (Site-Footer):
 *    - bei Zoom = 1 wird nichts angefasst; Blättern, Pfeile und
 *      horizontales Wischen verhalten sich unverändert.
 *    - bei Zoom > 1 wird `data-pull-ready` vom View entfernt — das ist
 *      genau das Gate, das onScroll() dort bereits abfragt. Der fremde
 *      Code bleibt unverändert.
 *    - Touch-Events werden in der CAPTURE-Phase auf der Figure gestoppt,
 *      damit der jQuery-'swipe'-Handler auf .w-lightbox-content beim
 *      Ziehen nicht auslöst.
 *
 *  Videos werden bewusst übersprungen: Touch-Events erreichen ein
 *  cross-origin iframe nicht. Dafür kommt v2 (Pseudo-Vollbild).
 *
 *  Transform liegt auf .w-lightbox-img, NICHT auf .w-lightbox-frame —
 *  dessen transform wird von pin() im Blätter-Skript benutzt.
 *
 *  中文：图片双指缩放 / 双击 / 拖动。1× 时完全不干预现有手势；
 *  >1× 时摘掉 data-pull-ready 关掉翻页，捕获阶段拦住横滑。
 *  视频不做（跨域 iframe 收不到 touch），留给 v2 的伪全屏。
 */
(function () {
  'use strict';
  if (window.__wfLbZoom) return;
  window.__wfLbZoom = '1.0.0';

  var MAX_SCALE = 4;      // 最大倍数
  var DBL_SCALE = 2.5;    // 双击放大到
  var SNAP_BACK = 1.05;   // 松手后低于此值直接回到 1×
  var RUBBER    = 0.35;   // 边缘阻尼系数
  var DBL_MS    = 300;    // 双击判定：两次间隔
  var DBL_PX    = 30;     // 双击判定：两次位移
  var ANIM_MS   = 220;

  var st = document.createElement('style');
  st.setAttribute('data-lb-zoom', '1');
  st.textContent =
    '.w-lightbox-figure > .w-lightbox-img{transform-origin:0 0}' +
    '.lb-z-on .w-lightbox-figure{position:relative;z-index:2}' +
    '.lb-z-on .w-lightbox-figure > .w-lightbox-img{will-change:transform}' +
    '.lb-z-anim > .w-lightbox-img{transition:transform ' + ANIM_MS +
    'ms cubic-bezier(.22,.61,.36,1)}';
  document.head.appendChild(st);

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function dist(t) {
    var dx = t[0].clientX - t[1].clientX, dy = t[0].clientY - t[1].clientY;
    return Math.sqrt(dx * dx + dy * dy) || 1;
  }
  function mid(t) {
    return { x: (t[0].clientX + t[1].clientX) / 2, y: (t[0].clientY + t[1].clientY) / 2 };
  }
  function rubber(v, lo, hi) {
    if (v < lo) return lo + (v - lo) * RUBBER;
    if (v > hi) return hi + (v - hi) * RUBBER;
    return v;
  }

  function setup(view) {
    document.documentElement.classList.remove('lb-z-on');

    var fig = view.querySelector('.w-lightbox-figure');
    if (!fig) return;
    if (fig.querySelector('.w-lightbox-embed')) return;   // Video -> überspringen
    var img = fig.querySelector('.w-lightbox-img');
    if (!img) return;

    var s = 1, tx = 0, ty = 0;
    var base = null, pinch = null, drag = null;
    var lastTap = 0, lastX = 0, lastY = 0, animTimer = null;

    function vw() { return document.documentElement.clientWidth; }
    function vh() {
      return (window.visualViewport && window.visualViewport.height) || window.innerHeight;
    }

    function measure() {
      var prev = img.style.transform;
      img.style.transform = 'none';
      base = img.getBoundingClientRect();
      img.style.transform = prev;
    }

    function bounds() {
      var W = base.width * s, H = base.height * s;
      var ax = -base.left, bx = vw() - W - base.left;
      var ay = -base.top,  by = vh() - H - base.top;
      return {
        xlo: Math.min(ax, bx), xhi: Math.max(ax, bx),
        ylo: Math.min(ay, by), yhi: Math.max(ay, by)
      };
    }

    function apply() {
      img.style.transform = (s === 1 && !tx && !ty)
        ? ''
        : 'translate(' + tx + 'px,' + ty + 'px) scale(' + s + ')';
    }

    function anim(on) {
      clearTimeout(animTimer);
      fig.classList.toggle('lb-z-anim', !!on);
      if (on) animTimer = setTimeout(function () {
        fig.classList.remove('lb-z-anim');
      }, ANIM_MS + 40);
    }

    function lock() {
      document.documentElement.classList.add('lb-z-on');
      view.removeAttribute('data-pull-ready');   // Blättern aus
      view.style.touchAction = 'none';
    }

    function unlock() {
      document.documentElement.classList.remove('lb-z-on');
      view.style.touchAction = '';
      var b = parseFloat(view.getAttribute('data-base') || '0');
      if (b || b === 0) { try { view.scrollTop = b; } catch (e) {} }
      view.setAttribute('data-pull-ready', '1');  // Blättern an
    }

    function reset(animate) {
      s = 1; tx = 0; ty = 0;
      anim(!!animate);
      apply();
      unlock();
    }

    function zoomTo(ns, px, py) {
      if (!base) measure();
      ns = clamp(ns, 1, MAX_SCALE);
      var lx = (px - base.left - tx) / s;
      var ly = (py - base.top  - ty) / s;
      s = ns;
      tx = px - base.left - lx * s;
      ty = py - base.top  - ly * s;
      var b = bounds();
      tx = clamp(tx, b.xlo, b.xhi);
      ty = clamp(ty, b.ylo, b.yhi);
    }

    function onStart(e) {
      var t = e.touches;

      if (t.length === 2) {
        if (!base) measure();
        lock();
        anim(false);
        pinch = { d0: dist(t), s0: s };
        drag = null;
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      if (t.length !== 1) return;
      var x = t[0].clientX, y = t[0].clientY, now = Date.now();

      var isDbl = (now - lastTap < DBL_MS) &&
                  Math.abs(x - lastX) < DBL_PX && Math.abs(y - lastY) < DBL_PX;

      if (isDbl) {
        lastTap = 0;
        if (!base) measure();
        if (s > 1) {
          reset(true);
        } else {
          lock();
          anim(true);
          zoomTo(DBL_SCALE, x, y);
          apply();
        }
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      lastTap = now; lastX = x; lastY = y;

      if (s > 1) {
        drag = { x: x, y: y, tx: tx, ty: ty };
        anim(false);
        e.stopPropagation();
      }
    }

    function onMove(e) {
      var t = e.touches;

      if (pinch && t.length === 2) {
        var m = mid(t);
        zoomTo(pinch.s0 * (dist(t) / pinch.d0), m.x, m.y);
        apply();
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      if (drag && t.length === 1) {
        var b = bounds();
        tx = rubber(drag.tx + (t[0].clientX - drag.x), b.xlo, b.xhi);
        ty = rubber(drag.ty + (t[0].clientY - drag.y), b.ylo, b.yhi);
        apply();
        e.preventDefault();
        e.stopPropagation();
      }
    }

    function onEnd(e) {
      if (e.touches.length === 1 && pinch) {
        pinch = null;
        if (s > 1) {
          drag = { x: e.touches[0].clientX, y: e.touches[0].clientY, tx: tx, ty: ty };
        }
        return;
      }
      if (e.touches.length !== 0) return;

      pinch = null; drag = null;

      if (s < SNAP_BACK) { reset(true); return; }

      var b = bounds();
      var cx = clamp(tx, b.xlo, b.xhi), cy = clamp(ty, b.ylo, b.yhi);
      if (cx !== tx || cy !== ty) {
        tx = cx; ty = cy;
        anim(true);
        apply();
      }
    }

    var opt = { passive: false, capture: true };
    fig.addEventListener('touchstart',  onStart, opt);
    fig.addEventListener('touchmove',   onMove,  opt);
    fig.addEventListener('touchend',    onEnd,   opt);
    fig.addEventListener('touchcancel', onEnd,   opt);
  }

  new MutationObserver(function (muts) {
    for (var i = 0; i < muts.length; i++) {
      var a = muts[i].addedNodes;
      for (var k = 0; k < a.length; k++) {
        if (a[k].nodeType === 1 && a[k].classList.contains('w-lightbox-view')) setup(a[k]);
      }
    }
  }).observe(document.body, { childList: true, subtree: true });

  // Lightbox geschlossen -> Zustandsklasse sicher entfernen
  new MutationObserver(function () {
    if (!document.documentElement.classList.contains('w-lightbox-noscroll')) {
      document.documentElement.classList.remove('lb-z-on');
    }
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
})();
