/*! Westfalia pdf-modal v1.0.5
 *  PDF-Links oeffnen in einem Overlay statt in einem neuen Tab.
 *  Blaettern, Zoomen, Download, Teilen. Rendert mit PDF.js auf Canvas,
 *  damit auch iOS/Android anzeigen koennen (iframe-PDF ist dort kaputt).
 *
 *  - Klick-Delegation in der BUBBLE-Phase. Der bestehende Tracking-Listener
 *    haengt in der CAPTURE-Phase und laeuft damit immer zuerst:
 *    download_klick feuert unveraendert weiter.
 *  - Kein stopPropagation, nur preventDefault.
 *  - PDF.js wird erst beim ersten Oeffnen geladen (~0,4 MB + Worker).
 *
 *  v1.0.1: disableStream + disableAutoFetch. Ohne das laedt PDF.js die ganze
 *  Datei, bevor Seite 1 erscheint - beim 10,2-MB-Katalog gemessene 23,6 s auf
 *  4 Mbit. Mit Range-Requests sind es 2,5 s und rund 0,6 MB. Dazu ein
 *  unbestimmter Ladebalken: bei Range-Laden ist ein Prozentwert bedeutungslos.
 *
 *  v1.0.2: Doppelseite fuer Katalog und Preisliste. Umschlag allein, danach
 *  2|3, 4|5 - bei der Preisliste durch die gedruckten Folios belegt (PDF-Seite 3
 *  traegt "Seite 3", ungerade Folios liegen im Druck rechts), beim Katalog durch
 *  die Zeitleiste, die ueber 2|3 durchlaeuft. Broschueren bleiben einseitig.
 *  Umschaltbar; unter 1024 px oder im Hochformat faellt alles auf Einzelseite.
 *
 *  v1.0.3: gestrichelter Bund in der Doppelseite. Die Linie sitzt als
 *  border-left auf der rechten Seite, nicht bei 50% der Buehne - die Seiten
 *  sind nicht immer gleich breit (Katalog S. 91 misst 635 pt statt 638),
 *  bei 50% laege der Strich dann neben der Naht statt darauf.
 *
 *  v1.0.4: Blaetteranimation. Die alte Seite schiebt sich raus und bleibt per
 *  fill-mode dort liegen, bis die neue fertig gerendert ist - sonst schnappt
 *  die Buehne nach dem Auslaufen kurz auf die alte Seite zurueck. Gearbeitet
 *  wird mit CSS-Animationen statt inline-transform, weil der Pinch-Zoom
 *  dasselbe Attribut belegt. prefers-reduced-motion schaltet sie ab.
 *
 *  v1.0.5: echtes Blaettern statt Querschieben. Das umschlagende Blatt ist eine
 *  Kopie der alten Seite (drawImage aus dem noch stehenden Canvas), die per
 *  rotateY um den Bund kippt; die neue Seite wird darunter gerendert. Ein
 *  zweites Overlay haelt die andere Haelfte der alten Doppelseite fest, bis das
 *  Blatt die 90 Grad passiert - sonst springt sie schon beim Start um.
 *  Nach jedem Rendern werden die Seiten des naechsten Schritts vorgeholt,
 *  damit unter dem kippenden Blatt nicht kurz nichts steht.
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
  var SPREAD_RE = /(katalog|preisliste)/i;   /* Dateiname entscheidet, kein Markup noetig */
  var SPREAD_MIN_W = 1024;                   /* darunter wird eine Doppelseite unleserlich */
  var ANIM_MS = 420;

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
      page: 'Seite',
      twoPage: 'Doppelseite',
      onePage: 'Einzelseite'
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
      page: 'Page',
      twoPage: 'Two pages',
      onePage: 'Single page'
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
  var renderTasks = [];
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
  var spreadDoc = false;   /* darf dieses Dokument ueberhaupt als Doppelseite? */
  var spreadPref = null;   /* null = automatisch, true/false = vom Nutzer gesetzt */
  var animSeq = 0;         /* schnelles Durchklicken darf nicht rueckwaerts landen */
  var holdTimer = null;

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
      '#wf-pdf-prog{position:absolute;left:0;top:0;height:2px;width:100%;opacity:0;',
      'background:linear-gradient(90deg,transparent,#C9A961 45%,#C9A961 55%,transparent);',
      'transform:translateX(-100%);transition:opacity .2s ease}',
      '#wf-pdf-prog.is-on{opacity:1;animation:wf-pdf-slide 1.15s linear infinite}',
      '@keyframes wf-pdf-slide{from{transform:translateX(-100%)}to{transform:translateX(100%)}}',
      '#wf-pdf-view{flex:1 1 auto;overflow:auto;-webkit-overflow-scrolling:touch;',
      'display:flex;touch-action:pan-x pan-y;padding:1rem .5rem}',
      '#wf-pdf-stage{margin:auto;position:relative;display:flex;transform-origin:center center;',
      'box-shadow:0 10px 40px rgba(0,0,0,.5)}',
      '#wf-pdf-canvas,#wf-pdf-canvas2{display:block;background:#fff;max-width:none}',
      '#wf-pdf-canvas2{display:none}',
      /* Blaettern: Perspektive sitzt auf der Buehne, das Blatt kippt darin */
      '#wf-pdf-stage{perspective:2000px}',
      '#wf-pdf-hold,#wf-pdf-flip{position:absolute;top:0;display:none;z-index:2}',
      '#wf-pdf-hold{z-index:1}',
      '#wf-pdf-flip{transform-style:preserve-3d;will-change:transform}',
      '#wf-pdf-flip-face,#wf-pdf-flip-back{position:absolute;left:0;top:0;',
      'width:100%;height:100%;backface-visibility:hidden;-webkit-backface-visibility:hidden}',
      '#wf-pdf-flip-back{transform:rotateY(180deg);background:#fbfaf6;',
      'box-shadow:inset 0 0 60px rgba(62,53,48,.09)}',
      '#wf-pdf-hold canvas,#wf-pdf-flip canvas{display:block;width:100%;height:100%}',
      '@keyframes wf-pdf-turn-f{from{transform:rotateY(0)}to{transform:rotateY(-180deg)}}',
      '@keyframes wf-pdf-turn-b{from{transform:rotateY(0)}to{transform:rotateY(180deg)}}',
      '#wf-pdf-flip.wf-turn-f{animation:wf-pdf-turn-f .42s cubic-bezier(.4,.05,.3,1) forwards}',
      '#wf-pdf-flip.wf-turn-b{animation:wf-pdf-turn-b .42s cubic-bezier(.4,.05,.3,1) forwards}',
      '@media(prefers-reduced-motion:reduce){#wf-pdf-flip{animation:none!important}}',
      /* Bund: sitzt exakt auf der Naht, weil er an der rechten Seite haengt */
      '#wf-pdf-stage.is-spread #wf-pdf-canvas2{border-left:1px dashed rgba(62,53,48,.38)}',
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
        '<button class="wf-pdf-btn" data-act="spread" style="display:none"></button>' +
        '<button class="wf-pdf-btn wf-pdf-zoom" data-act="out">' + icon('<circle cx="11" cy="11" r="7"/><path d="M8 11h6M20 20l-4.4-4.4"/>') + '</button>' +
        '<button class="wf-pdf-btn wf-pdf-zoom" data-act="in">' + icon('<circle cx="11" cy="11" r="7"/><path d="M8 11h6M11 8v6M20 20l-4.4-4.4"/>') + '</button>' +
        '<button class="wf-pdf-btn" data-act="dl">' + icon('<path d="M12 3v12M7.5 10.5 12 15l4.5-4.5M4 20h16"/>') + '</button>' +
        '<button class="wf-pdf-btn" data-act="share">' + icon('<path d="M12 15V4M8 7.5 12 3.5l4 4M5 13v6.5h14V13"/>') + '</button>' +
        '<button class="wf-pdf-btn" data-act="close">' + icon('<path d="M6 6l12 12M18 6 6 18"/>') + '</button>' +
      '</div>' +
      '<div id="wf-pdf-view"><div id="wf-pdf-stage"><canvas id="wf-pdf-canvas"></canvas>' +
        '<canvas id="wf-pdf-canvas2"></canvas>' +
        '<div id="wf-pdf-hold"><canvas id="wf-pdf-hold-c"></canvas></div>' +
        '<div id="wf-pdf-flip"><canvas id="wf-pdf-flip-face"></canvas>' +
        '<div id="wf-pdf-flip-back"></div></div>' +
        '</div><div id="wf-pdf-msg"></div></div>' +
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
      canvas2: o.querySelector('#wf-pdf-canvas2'),
      hold: o.querySelector('#wf-pdf-hold'),
      holdC: o.querySelector('#wf-pdf-hold-c'),
      flip: o.querySelector('#wf-pdf-flip'),
      flipC: o.querySelector('#wf-pdf-flip-face'),
      msg: o.querySelector('#wf-pdf-msg'),
      foot: o.querySelector('#wf-pdf-foot'),
      pageno: o.querySelector('#wf-pdf-pageno'),
      toast: toast
    };
    el.ctx = el.canvas.getContext('2d', { alpha: false });
    el.ctx2 = el.canvas2.getContext('2d', { alpha: false });

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

  /* ---------- Doppelseite ---------- */
  function roomForSpread() {
    return window.innerWidth >= SPREAD_MIN_W && window.innerWidth > window.innerHeight;
  }

  function spreadNow() {
    if (!spreadDoc || !roomForSpread()) return false;
    return spreadPref === null ? true : spreadPref;
  }

  function leftOf(n) { return n === 1 ? 1 : (n % 2 === 0 ? n : n - 1); }

  function twoUp() { return spreadNow() && pageNo > 1 && pageNo + 1 <= pageCount; }

  function nextPage() { return spreadNow() ? (pageNo === 1 ? 2 : pageNo + 2) : pageNo + 1; }
  function prevPage() { return spreadNow() ? (pageNo <= 2 ? 1 : pageNo - 2) : pageNo - 1; }

  function syncSpread() {
    var btn = el.root.querySelector('[data-act="spread"]');
    if (!btn) return;
    btn.style.display = (spreadDoc && roomForSpread()) ? 'flex' : 'none';
    var on = spreadNow();
    btn.innerHTML = icon(on
      ? '<rect x="6.5" y="4" width="11" height="16" rx="1"/>'
      : '<rect x="3" y="4" width="8" height="16" rx="1"/><rect x="13" y="4" width="8" height="16" rx="1"/>');
    btn.setAttribute('aria-label', t(on ? 'onePage' : 'twoPage'));
    btn.setAttribute('title', t(on ? 'onePage' : 'twoPage'));
    if (on && pageNo > 1) pageNo = leftOf(pageNo);
  }

  function reducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function clearAnim() {
    animSeq++;
    if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
    el.flip.classList.remove('wf-turn-f', 'wf-turn-b');
    el.flip.style.display = 'none';
    el.hold.style.display = 'none';
  }

  /* Kopiert das stehende Bild eines Canvas in ein Overlay, samt CSS-Groesse
     und Position. Muss vor dem Neurendern laufen - render() setzt canvas.width
     und loescht damit das alte Bild. */
  function snap(target, src, leftPx) {
    if (!src || !src.width) return false;
    var c = target === el.flip ? el.flipC : el.holdC;
    c.width = src.width;
    c.height = src.height;
    c.getContext('2d').drawImage(src, 0, 0);
    target.style.left = leftPx + 'px';
    target.style.width = src.style.width;
    target.style.height = src.style.height;
    target.style.display = 'block';
    return true;
  }

  /* Blaettert: altes Blatt kippt um den Bund, neue Seite entsteht darunter.
     fin laeuft ueber animationend, der Timeout ist die Rueckfallebene fuer
     Hintergrundtabs, in denen animationend ausbleibt. */
  function turn(fwd, after) {
    if (reducedMotion() || !doc) { clearAnim(); after(); return; }

    var two = twoUp();
    var lw = el.canvas.offsetWidth;
    /* Vorwaerts kippt die rechte Seite um ihre linke Kante (den Bund),
       rueckwaerts die linke Seite um ihre rechte Kante. Einzelseitig ist
       es jeweils die ganze Seite. */
    var sheet = two ? (fwd ? el.canvas2 : el.canvas) : el.canvas;
    var sheetLeft = (two && fwd) ? lw : 0;
    var keep = two ? (fwd ? el.canvas : el.canvas2) : null;
    var keepLeft = (two && fwd) ? 0 : lw;

    var okSheet = snap(el.flip, sheet, sheetLeft);
    if (!okSheet) { clearAnim(); after(); return; }
    if (keep) snap(el.hold, keep, keepLeft);

    el.flip.style.transformOrigin = fwd ? 'left center' : 'right center';
    clearAnim();                       /* erhoeht animSeq */
    var mine = ++animSeq;
    el.flip.style.display = 'block';
    if (keep) el.hold.style.display = 'block';
    void el.flip.offsetWidth;
    el.flip.classList.add(fwd ? 'wf-turn-f' : 'wf-turn-b');

    /* Die festgehaltene Haelfte darf weg, sobald das Blatt darueber liegt */
    holdTimer = setTimeout(function () {
      if (mine === animSeq) el.hold.style.display = 'none';
    }, ANIM_MS / 2);

    var done = false;
    var fin = function () {
      if (done) return;
      done = true;
      el.flip.removeEventListener('animationend', fin, false);
      if (mine !== animSeq) return;
      el.flip.classList.remove('wf-turn-f', 'wf-turn-b');
      el.flip.style.display = 'none';
      el.hold.style.display = 'none';
    };
    el.flip.addEventListener('animationend', fin, false);
    setTimeout(fin, ANIM_MS + 160);

    after();                           /* neue Seite sofort darunter rendern */
  }

  /* Seiten des naechsten Schritts vorholen, damit unter dem kippenden Blatt
     nicht kurz eine leere Flaeche steht (disableAutoFetch holt sonst erst
     beim Rendern). */
  function prefetch() {
    if (!doc) return;
    var ns = spreadNow() ? (pageNo === 1 ? 2 : pageNo + 2) : pageNo + 1;
    var list = [ns];
    if (spreadNow() && ns > 1) list.push(ns + 1);
    for (var i = 0; i < list.length; i++) {
      var k = list[i];
      if (k >= 1 && k <= pageCount) doc.getPage(k)['catch'](function () {});
    }
  }

  function cancelRender() {
    for (var i = 0; i < renderTasks.length; i++) {
      try { renderTasks[i].cancel(); } catch (e) {}
    }
    renderTasks = [];
  }

  /* ---------- Oeffnen / Schliessen ---------- */
  function openUrl(url, title, view) {
    if (!el) build();
    curUrl = url;
    curTitle = title;
    curFile = fileName(url);
    spreadPref = null;
    spreadDoc = view === 'spread' ? true : (view === 'single' ? false : SPREAD_RE.test(curFile));
    pageNo = 1;
    zoom = 1;
    pageCount = 0;
    seq++;

    el.title.textContent = title;
    el.canvas.style.display = 'none';
    el.canvas2.style.display = 'none';
    clearAnim();
    el.stage.classList.remove('is-spread');
    el.stage.style.transform = '';
    el.foot.style.visibility = 'hidden';
    el.pageno.textContent = '';
    msg(t('loading'));
    label();
    syncSpread();

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
      busy(true);
      loadingTask = p.getDocument({
        url: curUrl,
        isEvalSupported: false,           /* Gegenmassnahme zu CVE-2024-4367 */
        disableStream: true,              /* nicht die ganze Datei streamen ... */
        disableAutoFetch: true,           /* ... sondern nur die Bytes der Seite */
        cMapUrl: PDFJS + 'cmaps/',
        cMapPacked: true,
        standardFontDataUrl: PDFJS + 'standard_fonts/'
      });
      return loadingTask.promise;
    }).then(function (d) {
      if (my !== seq || !d) return;
      doc = d;
      pageCount = d.numPages;
      msg('');
      el.canvas.style.display = 'block';
      el.foot.style.visibility = pageCount > 1 ? 'visible' : 'hidden';
      render(my);
    })['catch'](function (e) {
      if (my !== seq) return;
      busy(false);
      fail();
      if (window.console) console.warn('[pdf-modal]', e);
    });
  }

  /* Unbestimmter Balken: beim Range-Laden weiss niemand, wie viel noch fehlt.
     Laeuft auch beim Blaettern, weil jede Seite ihre Bytes selbst holt. */
  function busy(on) {
    if (!el) return;
    el.prog.classList.toggle('is-on', !!on);
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
    cancelRender();
    clearAnim();
    if (loadingTask) { try { loadingTask.destroy(); } catch (e) {} loadingTask = null; }
    if (doc) { try { doc.destroy(); } catch (e) {} doc = null; }
    el.canvas.width = el.canvas.height = 0;
    el.canvas2.width = el.canvas2.height = 0;
    busy(false);
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
  function fitScale(vp1, cols) {
    cols = cols || 1;
    var availW = el.view.clientWidth - 16;
    var availH = el.view.clientHeight - 32;
    if (availW < 80 || availH < 80) return 1;
    var byW = availW / (vp1.width * cols);
    var byH = availH / vp1.height;
    /* Doppelseite immer ganz sichtbar - halb abgeschnitten waere sie sinnlos */
    if (cols > 1) return Math.min(byW, byH);
    /* Schmal/Touch: Breite fuellen, vertikal scrollen. Desktop: ganze Seite. */
    var narrow = window.innerWidth <= 768 || window.matchMedia('(pointer: coarse)').matches;
    return narrow ? byW : Math.min(byW, byH);
  }

  function render(my) {
    if (!doc || my !== seq) return;
    cancelRender();
    busy(true);
    var n = pageNo;
    var nums = twoUp() ? [n, n + 1] : [n];
    var jobs = [];
    for (var j = 0; j < nums.length; j++) jobs.push(doc.getPage(nums[j]));

    Promise.all(jobs).then(function (pages) {
      if (my !== seq || n !== pageNo) return;
      var vp1 = pages[0].getViewport({ scale: 1 });
      var cols = pages.length;
      var scale = fitScale(vp1, cols) * zoom;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      /* Pixelbudget gilt fuer die ganze Buehne, nicht je Canvas - sonst
         sprengt die Doppelseite auf Retina den iOS-Canvasspeicher. */
      var w = vp1.width * scale * cols, h = vp1.height * scale;
      if (w * h * dpr * dpr > MAX_PIXELS) dpr = Math.max(1, Math.sqrt(MAX_PIXELS / (w * h)));
      el.stage.style.transform = '';
      el.stage.classList.toggle('is-spread', cols > 1);

      var cvs = [el.canvas, el.canvas2];
      var proms = [];
      for (var i = 0; i < cvs.length; i++) {
        if (i >= cols) {
          cvs[i].style.display = 'none';
          cvs[i].width = cvs[i].height = 0;
          continue;
        }
        var vp = pages[i].getViewport({ scale: scale * dpr });
        cvs[i].width = Math.max(1, Math.floor(vp.width));
        cvs[i].height = Math.max(1, Math.floor(vp.height));
        cvs[i].style.width = Math.floor(vp.width / dpr) + 'px';
        cvs[i].style.height = Math.floor(vp.height / dpr) + 'px';
        cvs[i].style.display = 'block';
        var task = pages[i].render({ canvasContext: i === 0 ? el.ctx : el.ctx2, viewport: vp });
        renderTasks.push(task);
        proms.push(task.promise);
      }
      return Promise.all(proms);
    }).then(function () {
      if (my !== seq) return;
      renderTasks = [];
      busy(false);
      pager();
      prefetch();
    })['catch'](function (e) {
      if (e && e.name === 'RenderingCancelledException') return;
      if (my !== seq) return;
      busy(false);
      if (window.console) console.warn('[pdf-modal] render', e);
    });
  }

  function pager() {
    el.pageno.textContent = (twoUp() ? pageNo + '\u2013' + (pageNo + 1) : pageNo) + ' / ' + pageCount;
    var p = el.root.querySelector('[data-act="prev"]');
    var n = el.root.querySelector('[data-act="next"]');
    if (p) p.disabled = pageNo <= 1;
    if (n) n.disabled = nextPage() > pageCount;
  }

  function go(d) {
    if (!doc) return;
    var n = d > 0 ? nextPage() : prevPage();
    if (n < 1 || n > pageCount) return;
    var fwd = d > 0;
    var my = seq;
    turn(fwd, function () {
      if (my !== seq) return;
      /* Seitenstand erst hier, aber synchron: das kippende Blatt zeigt noch
         die alte Seite, darunter entsteht schon die neue. Schnelles
         Durchklicken summiert sich trotzdem, weil turn() sofort zurueckkehrt. */
      pageNo = n;
      zoom = 1;
      el.view.scrollTop = 0;
      el.view.scrollLeft = 0;
      pager();
      render(seq);
    });
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
    else if (a === 'spread') {
      spreadPref = !spreadNow();
      if (spreadPref && pageNo > 1) pageNo = leftOf(pageNo);
      zoom = 1;
      syncSpread();
      render(seq);
    }
  }

  function onDblClick(e) {
    if (!el.stage.contains(e.target)) return;
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
    rerenderTimer = setTimeout(function () { syncSpread(); render(seq); }, 180);
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
    openUrl(a.href, titleFrom(a, href), a.getAttribute('data-pdf-view'));
  }, false);
})();
