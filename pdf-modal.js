/*! Westfalia pdf-modal v1.0.0
 *  PDF-Links oeffnen in einem Overlay statt in einem neuen Tab.
 *  Blaettern, Zoomen, Download, Teilen. Rendert mit PDF.js auf Canvas,
 *  damit auch iOS/Android anzeigen koennen (iframe-PDF ist dort kaputt).
 *
 *  - Klick-Delegation in der BUBBLE-Phase. Der bestehende Tracking-Listener
 *    haengt in der CAPTURE-Phase und laeuft damit immer zuerst:
 *    download_klick feuert unveraendert weiter.
 *  - Kein stopPropagation, nur preventDefault.
 *  - PDF.js wird erst beim ersten Oeffnen geladen (~0,4 MB + Worker).
 */
(function () {
  'use strict';

  if (window.__wfPdfModal) return;
  window.__wfPdfModal = true;

  var PDFJS = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/';
  var LIB = PDFJS + 'legacy/build/pdf.min.mjs';
  var WORKER = PDFJS + 'legacy/build/pdf.worker.min.mjs';

  var MAX_ZOOM = 4;
  var MIN_ZOOM = 1;
  var DBL_ZOOM = 2.2;
  var MAX_PIXELS = 12e6;   /* Canvas-Obergrenze, iOS kippt darueber */
  var SWIPE_PX = 60;
  var SWIPE_MAX_Y = 45;

  var T = {
    de: {
      loading: 'Broschüre wird geladen …',
      fail: 'Die Broschüre kann hier nicht angezeigt werden.',
      openTab: 'In neuem Tab öffnen',
      download: 'Herunterladen',
      share: 'Teilen',
      close: 'Schließen',
      prev: 'Vorherige Seite',
      next: 'Nächste Seite',
      zoomIn: 'Vergrößern',
      zoomOut: 'Verkleinern',
      copied: 'Link kopiert',
      page: 'Seite'
    },
    en: {
      loading: 'Loading brochure …',
      fail: 'This brochure cannot be displayed here.',
      openTab: 'Open in new tab',
      download: 'Download',
      share: 'Share',
      close: 'Close',
      prev: 'Previous page',
      next: 'Next page',
      zoomIn: 'Zoom in',
      zoomOut: 'Zoom out',
      copied: 'Link copied',
      page: 'Page'
    }
  };

  function lang() {
    var l = (document.documentElement && document.documentElement.lang || '').toLowerCase();
    return l.indexOf('en') === 0 ? 'en' : 'de';
  }
  function t(k) { return T[lang()][k]; }

  /* ---------- State ---------- */
  var el = null;          /* DOM-Referenzen, erst beim ersten Oeffnen gebaut */
  var pdfjsLib = null;
  var libPromise = null;
  var doc = null;
  var loadingTask = null;
  var renderTask = null;
  var seq = 0;            /* Generationszaehler: alle spaeten Callbacks steigen aus */
  var pageNo = 1;
  var pageCount = 0;
  var zoom = 1;
  var curUrl = '';
  var curTitle = '';
  var curFile = '';
  var scrollY = 0;
  var open = false;
  var histPushed = false;
  var rerenderTimer = null;

  /* ---------- Helfer ---------- */
  function isPdfHref(h) { return /\.pdf(\?|#|$)/i.test(h || ''); }

  function fileName(href) {
    var f = href.split('?')[0].split('#')[0].split('/').pop();
    try { f = decodeURIComponent(f); } catch (e) {}
    return f.replace(/^([0-9a-f]{20,}_)+/i, '');
  }

  function titleFrom(a, href) {
    var n = a.querySelector('.broschuere-name, .brosch-t');
    var s = (n ? n.textContent : a.textContent || '').replace(/\s+/g, ' ').trim();
    if (!s || /herunterladen|download/i.test(s)) {
      s = fileName(href).replace(/\.pdf$/i, '').replace(/[_-]+/g, ' ').trim();
    }
    return s;
  }

  function css() {
    var s = document.createElement('style');
    s.id = 'wf-pdf-css';
    s.textContent = [
      '.wf-pdf-lock{overflow:hidden!important;height:100%!important}',
      '#wf-pdf{position:fixed;inset:0;z-index:2147483000;display:none;flex-direction:column;',
      'background:rgba(33,30,34,.94);opacity:0;transition:opacity .18s ease;',
      'font-family:Raleway,Inter,system-ui,sans-serif;-webkit-tap-highlight-color:transparent}',
      '#wf-pdf.is-on{display:flex;opacity:1}',
      '#wf-pdf-bar{flex:0 0 auto;display:flex;align-items:center;gap:.25rem;',
      'padding:.55rem .6rem;background:rgba(33,30,34,.88);border-bottom:1px solid rgba(245,241,232,.14)}',
      '#wf-pdf-title{flex:1 1 auto;min-width:0;color:#F5F1E8;font-family:Oswald,"Oswald Local",sans-serif;',
      'font-size:.82rem;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap;',
      'overflow:hidden;text-overflow:ellipsis;padding-left:.35rem}',
      '#wf-pdf .wf-pdf-btn{flex:0 0 auto;width:2.5rem;height:2.5rem;display:flex;align-items:center;',
      'justify-content:center;border:0;background:transparent;color:#F5F1E8;opacity:.82;cursor:pointer;',
      'border-radius:50%;padding:0;transition:opacity .15s,background .15s}',
      '#wf-pdf .wf-pdf-btn:hover{opacity:1;background:rgba(245,241,232,.1)}',
      '#wf-pdf .wf-pdf-btn:active{background:rgba(245,241,232,.18)}',
      '#wf-pdf .wf-pdf-btn:disabled{opacity:.28;cursor:default;background:transparent}',
      '#wf-pdf .wf-pdf-btn svg{width:1.25rem;height:1.25rem;fill:none;stroke:currentColor;',
      'stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}',
      '#wf-pdf-prog{position:absolute;left:0;top:0;height:2px;width:0;background:#C9A961;',
      'transition:width .2s ease;opacity:0}',
      '#wf-pdf-prog.is-on{opacity:1}',
      '#wf-pdf-view{flex:1 1 auto;overflow:auto;-webkit-overflow-scrolling:touch;',
      'display:flex;touch-action:pan-x pan-y;padding:1rem .5rem}',
      '#wf-pdf-stage{margin:auto;position:relative;transform-origin:center center}',
      '#wf-pdf-canvas{display:block;background:#fff;box-shadow:0 10px 40px rgba(0,0,0,.5);max-width:none}',
      '#wf-pdf-msg{color:#F5F1E8;text-align:center;font-size:.92rem;line-height:1.7;padding:2rem 1.5rem}',
      '#wf-pdf-msg a{color:#C9A961;text-decoration:underline;display:inline-block;margin-top:.6rem}',
      '#wf-pdf-foot{flex:0 0 auto;display:flex;align-items:center;justify-content:center;gap:.5rem;',
      'padding:.5rem .6rem calc(.5rem + env(safe-area-inset-bottom,0px));',
      'background:rgba(33,30,34,.88);border-top:1px solid rgba(245,241,232,.14)}',
      '#wf-pdf-pageno{color:#F5F1E8;font-family:Oswald,"Oswald Local",sans-serif;font-size:.82rem;',
      'letter-spacing:.08em;min-width:4.5rem;text-align:center;opacity:.9}',
      '#wf-pdf-toast{position:fixed;left:50%;bottom:5.5rem;transform:translateX(-50%);z-index:2147483001;',
      'background:#3E3530;color:#F5F1E8;border:1px solid rgba(201,169,97,.5);border-radius:2rem;',
      'padding:.5rem 1.1rem;font-size:.82rem;opacity:0;pointer-events:none;transition:opacity .2s}',
      '#wf-pdf-toast.is-on{opacity:1}',
      '@media(max-width:600px){#wf-pdf-title{font-size:.72rem}#wf-pdf-view{padding:.5rem .25rem}}',
      '@media(pointer:coarse){#wf-pdf .wf-pdf-zoom{display:none}}'
    ].join('');
    document.head.appendChild(s);
  }

  function icon(d) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true">' + d + '</svg>';
  }

  function build() {
    css();
    var o = document.createElement('div');
    o.id = 'wf-pdf';
    o.setAttribute('role', 'dialog');
    o.setAttribute('aria-modal', 'true');
    o.innerHTML =
      '<div id="wf-pdf-prog"></div>' +
      '<div id="wf-pdf-bar">' +
        '<div id="wf-pdf-title"></div>' +
        '<button class="wf-pdf-btn wf-pdf-zoom" data-act="out">' + icon('<circle cx="11" cy="11" r="7"/><path d="M8 11h6M20 20l-4.4-4.4"/>') + '</button>' +
        '<button class="wf-pdf-btn wf-pdf-zoom" data-act="in">' + icon('<circle cx="11" cy="11" r="7"/><path d="M8 11h6M11 8v6M20 20l-4.4-4.4"/>') + '</button>' +
        '<button class="wf-pdf-btn" data-act="dl">' + icon('<path d="M12 3v12M7.5 10.5 12 15l4.5-4.5M4 20h16"/>') + '</button>' +
        '<button class="wf-pdf-btn" data-act="share">' + icon('<path d="M12 15V4M8 7.5 12 3.5l4 4M5 13v6.5h14V13"/>') + '</button>' +
        '<button class="wf-pdf-btn" data-act="close">' + icon('<path d="M6 6l12 12M18 6 6 18"/>') + '</button>' +
      '</div>' +
      '<div id="wf-pdf-view"><div id="wf-pdf-stage"><canvas id="wf-pdf-canvas"></canvas></div><div id="wf-pdf-msg"></div></div>' +
      '<div id="wf-pdf-foot">' +
        '<button class="wf-pdf-btn" data-act="prev">' + icon('<path d="M14.5 5 8 12l6.5 7"/>') + '</button>' +
        '<div id="wf-pdf-pageno"></div>' +
        '<button class="wf-pdf-btn" data-act="next">' + icon('<path d="M9.5 5 16 12l-6.5 7"/>') + '</button>' +
      '</div>';
    document.body.appendChild(o);

    var toast = document.createElement('div');
    toast.id = 'wf-pdf-toast';
    document.body.appendChild(toast);

    el = {
      root: o,
      bar: o.querySelector('#wf-pdf-bar'),
      title: o.querySelector('#wf-pdf-title'),
      prog: o.querySelector('#wf-pdf-prog'),
      view: o.querySelector('#wf-pdf-view'),
      stage: o.querySelector('#wf-pdf-stage'),
      canvas: o.querySelector('#wf-pdf-canvas'),
      msg: o.querySelector('#wf-pdf-msg'),
      foot: o.querySelector('#wf-pdf-foot'),
      pageno: o.querySelector('#wf-pdf-pageno'),
      toast: toast
    };
    el.ctx = el.canvas.getContext('2d', { alpha: false });

    o.addEventListener('click', onUiClick, false);
    o.addEventListener('dblclick', onDblClick, false);
    el.view.addEventListener('wheel', onWheel, { passive: false });
    el.view.addEventListener('touchstart', onTouchStart, { passive: false });
    el.view.addEventListener('touchmove', onTouchMove, { passive: false });
    el.view.addEventListener('touchend', onTouchEnd, false);
    label();
  }

  function label() {
    var m = { out: 'zoomOut', 'in': 'zoomIn', dl: 'download', share: 'share', close: 'close', prev: 'prev', next: 'next' };
    var b = el.root.querySelectorAll('[data-act]');
    for (var i = 0; i < b.length; i++) {
      var k = m[b[i].getAttribute('data-act')];
      if (k) { b[i].setAttribute('aria-label', t(k)); b[i].setAttribute('title', t(k)); }
    }
  }

  function toast(text) {
    el.toast.textContent = text;
    el.toast.classList.add('is-on');
    setTimeout(function () { el.toast.classList.remove('is-on'); }, 1800);
  }

  /* ---------- PDF.js nachladen ---------- */
  function lib() {
    if (libPromise) return libPromise;
    libPromise = new Promise(function (res, rej) {
      var imp;
      try { imp = new Function('u', 'return import(u)'); }
      catch (e) { rej(e); return; }
      try {
        imp(LIB).then(function (m) {
          m.GlobalWorkerOptions.workerSrc = WORKER;
          pdfjsLib = m;
          res(m);
        }, rej);
      } catch (e2) { rej(e2); }
    });
    return libPromise;
  }

  /* ---------- Oeffnen / Schliessen ---------- */
  function openUrl(url, title) {
    if (!el) build();
    curUrl = url;
    curTitle = title;
    curFile = fileName(url);
    pageNo = 1;
    zoom = 1;
    pageCount = 0;
    seq++;

    el.title.textContent = title;
    el.canvas.style.display = 'none';
    el.stage.style.transform = '';
    el.foot.style.visibility = 'hidden';
    el.pageno.textContent = '';
    msg(t('loading'));
    label();

    lockScroll();
    el.root.classList.add('is-on');
    open = true;
    document.addEventListener('keydown', onKey, false);

    if (window.history && history.pushState) {
      try { history.pushState({ wfPdf: 1 }, ''); histPushed = true; } catch (e) { histPushed = false; }
      window.addEventListener('popstate', onPop, false);
    }

    load(seq);
  }

  function load(my) {
    lib().then(function (p) {
      if (my !== seq) return;
      progress(0.02);
      loadingTask = p.getDocument({
        url: curUrl,
        isEvalSupported: false,           /* Gegenmassnahme zu CVE-2024-4367 */
        cMapUrl: PDFJS + 'cmaps/',
        cMapPacked: true,
        standardFontDataUrl: PDFJS + 'standard_fonts/'
      });
      loadingTask.onProgress = function (d) {
        if (my !== seq || !d || !d.total) return;
        progress(Math.max(0.02, d.loaded / d.total));
      };
      return loadingTask.promise;
    }).then(function (d) {
      if (my !== seq || !d) return;
      doc = d;
      pageCount = d.numPages;
      progress(1);
      msg('');
      el.canvas.style.display = 'block';
      el.foot.style.visibility = pageCount > 1 ? 'visible' : 'hidden';
      render(my);
    })['catch'](function (e) {
      if (my !== seq) return;
      progress(0);
      fail();
      if (window.console) console.warn('[pdf-modal]', e);
    });
  }

  function progress(p) {
    el.prog.classList.toggle('is-on', p > 0 && p < 1);
    el.prog.style.width = Math.round(p * 100) + '%';
    if (p >= 1) setTimeout(function () { el.prog.classList.remove('is-on'); el.prog.style.width = '0'; }, 260);
  }

  function msg(text) {
    el.msg.textContent = text || '';
    el.msg.style.display = text ? 'block' : 'none';
  }

  function fail() {
    el.canvas.style.display = 'none';
    el.msg.innerHTML = '';
    el.msg.style.display = 'block';
    el.msg.appendChild(document.createTextNode(t('fail')));
    el.msg.appendChild(document.createElement('br'));
    var a = document.createElement('a');
    a.href = curUrl;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = t('openTab');
    el.msg.appendChild(a);
  }

  function close() {
    if (!open) return;
    open = false;
    seq++;
    if (renderTask) { try { renderTask.cancel(); } catch (e) {} renderTask = null; }
    if (loadingTask) { try { loadingTask.destroy(); } catch (e) {} loadingTask = null; }
    if (doc) { try { doc.destroy(); } catch (e) {} doc = null; }
    el.canvas.width = el.canvas.height = 0;
    el.root.classList.remove('is-on');
    document.removeEventListener('keydown', onKey, false);
    window.removeEventListener('popstate', onPop, false);
    unlockScroll();
    if (histPushed) {
      histPushed = false;
      try { history.back(); } catch (e) {}
    }
  }

  function onPop() {
    histPushed = false;
    close();
  }

  function lockScroll() {
    scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
    var h = document.documentElement;
    if (!h.classList.contains('wf-pdf-lock')) h.classList.add('wf-pdf-lock');
    document.body.style.position = 'fixed';
    document.body.style.top = (-scrollY) + 'px';
    document.body.style.left = '0';
    document.body.style.right = '0';
  }

  function unlockScroll() {
    var h = document.documentElement;
    if (h.classList.contains('wf-pdf-lock')) h.classList.remove('wf-pdf-lock');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    window.scrollTo(0, scrollY);
  }

  /* ---------- Rendern ---------- */
  function fitScale(vp1) {
    var availW = el.view.clientWidth - 16;
    var availH = el.view.clientHeight - 32;
    if (availW < 80 || availH < 80) return 1;
    var byW = availW / vp1.width;
    var byH = availH / vp1.height;
    /* Schmal/Touch: Breite fuellen, vertikal scrollen. Desktop: ganze Seite. */
    var narrow = window.innerWidth <= 768 || window.matchMedia('(pointer: coarse)').matches;
    return narrow ? byW : Math.min(byW, byH);
  }

  function render(my) {
    if (!doc || my !== seq) return;
    if (renderTask) { try { renderTask.cancel(); } catch (e) {} renderTask = null; }
    var n = pageNo;
    doc.getPage(n).then(function (page) {
      if (my !== seq || n !== pageNo) return;
      var vp1 = page.getViewport({ scale: 1 });
      var scale = fitScale(vp1) * zoom;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = vp1.width * scale, h = vp1.height * scale;
      if (w * h * dpr * dpr > MAX_PIXELS) dpr = Math.max(1, Math.sqrt(MAX_PIXELS / (w * h)));
      var vp = page.getViewport({ scale: scale * dpr });

      el.canvas.width = Math.max(1, Math.floor(vp.width));
      el.canvas.height = Math.max(1, Math.floor(vp.height));
      el.canvas.style.width = Math.floor(vp.width / dpr) + 'px';
      el.canvas.style.height = Math.floor(vp.height / dpr) + 'px';
      el.stage.style.transform = '';

      renderTask = page.render({ canvasContext: el.ctx, viewport: vp });
      return renderTask.promise;
    }).then(function () {
      if (my !== seq) return;
      renderTask = null;
      pager();
    })['catch'](function (e) {
      if (e && e.name === 'RenderingCancelledException') return;
      if (my !== seq) return;
      if (window.console) console.warn('[pdf-modal] render', e);
    });
  }

  function pager() {
    el.pageno.textContent = pageNo + ' / ' + pageCount;
    var p = el.root.querySelector('[data-act="prev"]');
    var n = el.root.querySelector('[data-act="next"]');
    if (p) p.disabled = pageNo <= 1;
    if (n) n.disabled = pageNo >= pageCount;
  }

  function go(d) {
    if (!doc) return;
    var n = pageNo + d;
    if (n < 1 || n > pageCount) return;
    pageNo = n;
    zoom = 1;
    el.view.scrollTop = 0;
    el.view.scrollLeft = 0;
    render(seq);
  }

  function setZoom(z, ax, ay) {
    z = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z));
    if (Math.abs(z - zoom) < 0.01) return;
    var old = zoom;
    zoom = z;
    /* Scrollposition um den Zoompunkt halten */
    var r = z / old;
    var cx = (ax == null ? el.view.clientWidth / 2 : ax);
    var cy = (ay == null ? el.view.clientHeight / 2 : ay);
    var sl = (el.view.scrollLeft + cx) * r - cx;
    var st = (el.view.scrollTop + cy) * r - cy;
    clearTimeout(rerenderTimer);
    rerenderTimer = setTimeout(function () {
      render(seq);
      el.view.scrollLeft = Math.max(0, sl);
      el.view.scrollTop = Math.max(0, st);
    }, 90);
  }

  /* ---------- Download / Teilen ---------- */
  function download() {
    function fallback() { window.open(curUrl, '_blank', 'noopener'); }
    if (!doc || !doc.getData) return fallback();
    doc.getData().then(function (data) {
      var blob = new Blob([data], { type: 'application/pdf' });
      var u = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = u;
      a.download = curFile || 'broschuere.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(u); }, 4000);
    })['catch'](fallback);
  }

  function share() {
    var data = { title: curTitle || document.title, url: curUrl };
    if (navigator.share) {
      navigator.share(data)['catch'](function () {});
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(curUrl).then(function () { toast(t('copied')); },
        function () { window.open(curUrl, '_blank', 'noopener'); });
      return;
    }
    window.open(curUrl, '_blank', 'noopener');
  }

  /* ---------- Events ---------- */
  function onUiClick(e) {
    var b = e.target.closest ? e.target.closest('[data-act]') : null;
    if (!b) {
      /* Klick auf den Hintergrund schliesst, Klick auf die Seite nicht */
      if (e.target === el.view || e.target === el.root) close();
      return;
    }
    e.preventDefault();
    var a = b.getAttribute('data-act');
    if (a === 'close') close();
    else if (a === 'prev') go(-1);
    else if (a === 'next') go(1);
    else if (a === 'in') setZoom(zoom * 1.35);
    else if (a === 'out') setZoom(zoom / 1.35);
    else if (a === 'dl') download();
    else if (a === 'share') share();
  }

  function onDblClick(e) {
    if (!el.canvas.contains(e.target)) return;
    e.preventDefault();
    var r = el.view.getBoundingClientRect();
    setZoom(zoom > 1.05 ? 1 : DBL_ZOOM, e.clientX - r.left, e.clientY - r.top);
  }

  function onWheel(e) {
    if (!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    var r = el.view.getBoundingClientRect();
    setZoom(zoom * (e.deltaY < 0 ? 1.12 : 1 / 1.12), e.clientX - r.left, e.clientY - r.top);
  }

  function onKey(e) {
    if (!open) return;
    var k = e.key;
    if (k === 'Escape') { e.preventDefault(); close(); }
    else if (k === 'ArrowRight' || k === 'PageDown') { e.preventDefault(); go(1); }
    else if (k === 'ArrowLeft' || k === 'PageUp') { e.preventDefault(); go(-1); }
    else if (k === '+' || k === '=') { e.preventDefault(); setZoom(zoom * 1.35); }
    else if (k === '-') { e.preventDefault(); setZoom(zoom / 1.35); }
  }

  /* Touch: 2 Finger = Pinch (Live-Transform, danach scharf neu rendern),
     1 Finger bei Zoom 1 = horizontal wischen blaettert. */
  var tState = null;

  function dist(a, b) {
    var dx = a.clientX - b.clientX, dy = a.clientY - b.clientY;
    return Math.sqrt(dx * dx + dy * dy) || 1;
  }

  function onTouchStart(e) {
    if (e.touches.length === 2) {
      e.preventDefault();
      tState = { mode: 'pinch', d0: dist(e.touches[0], e.touches[1]), k: 1 };
    } else if (e.touches.length === 1) {
      tState = { mode: 'swipe', x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }

  function onTouchMove(e) {
    if (!tState) return;
    if (tState.mode === 'pinch' && e.touches.length === 2) {
      e.preventDefault();
      var k = dist(e.touches[0], e.touches[1]) / tState.d0;
      k = Math.max(MIN_ZOOM / zoom, Math.min(MAX_ZOOM / zoom, k));
      tState.k = k;
      el.stage.style.transform = 'scale(' + k + ')';
    }
  }

  function onTouchEnd(e) {
    if (!tState) return;
    if (tState.mode === 'pinch') {
      var k = tState.k;
      el.stage.style.transform = '';
      tState = null;
      if (Math.abs(k - 1) > 0.02) setZoom(zoom * k);
      return;
    }
    if (tState.mode === 'swipe' && zoom <= 1.05 && e.changedTouches && e.changedTouches.length === 1) {
      var dx = e.changedTouches[0].clientX - tState.x;
      var dy = e.changedTouches[0].clientY - tState.y;
      if (Math.abs(dx) > SWIPE_PX && Math.abs(dy) < SWIPE_MAX_Y) go(dx < 0 ? 1 : -1);
    }
    tState = null;
  }

  window.addEventListener('resize', function () {
    if (!open || !doc) return;
    clearTimeout(rerenderTimer);
    rerenderTimer = setTimeout(function () { render(seq); }, 180);
  }, false);

  /* ---------- Klick-Delegation (Bubble-Phase!) ---------- */
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented) return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a || a.hasAttribute('data-no-pdf-modal')) return;
    var href = a.getAttribute('href') || '';
    if (!isPdfHref(href)) return;
    if (!('Promise' in window) || !document.body.closest) return;   /* zu alt: Neuer Tab bleibt */
    e.preventDefault();
    openUrl(a.href, titleFrom(a, href));
  }, false);
})();
