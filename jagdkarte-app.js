(function () {
  var retryCount = 0;
  function init() {
    var mount = document.getElementById('jagdkarte');
    if (!mount) return;
    if (!window.JAGDKARTE_DATA) {
        if (retryCount < 40) { retryCount++; setTimeout(init, 50); }
        return;
    }

    var DATA = window.JAGDKARTE_DATA;

    var hasEH = DATA.some(function(c) { return c.iso === 'EH'; });
    if (!hasEH) {
        DATA.push({ iso: 'EH', cont: 'AF', d: 'M422,191L423,190L425,190L426,190L427,190L428,190L429,189L430,188L430,187L430,186L430,185L431,184L432,184L433,182L434,182L435,180L436,179L436,180L436,181L436,183L436,184L436,185L434,185L433,186L433,188L433,189L433,191L432,191L431,191L429,191L427,191L425,191L423,191Z' });
    }
    var hasXS = DATA.some(function(c) { return c.iso === 'XS'; });
    if (!hasXS) {
        DATA.push({ iso: 'XS', cont: 'AF', d: 'M603,228L601,228L600,228L599,227L598,227L597,227L596,227L595,226L594,226L593,226L592,225L591,225L591,224L590,223L589,223L589,222L588,221L588,220L588,219L589,219L590,218L595,217L600,216L605,216L611,217L610,217L609,218L608,218L607,218L606,219L605,219L605,220L605,222L605,223L605,224L605,225L604,226L603,227Z' });
    }

    var SPARKS = window.JAGDKARTE_SPARKS || {};
    var names = {EU:'Europa',AS:'Asien',AF:'Afrika',NA:'Nordamerika',SA:'Südamerika',OC:'Ozeanien'};
    var NS = 'http://www.w3.org/2000/svg';

    var usIndex = DATA.findIndex(function(c) { return c.iso === 'US'; });
    var hasAk = DATA.findIndex(function(c) { return c.iso === 'US-AK'; });
    if (usIndex > -1 && hasAk === -1) {
        var usPath = DATA[usIndex].d;
        var subpaths = usPath.split('Z');
        var mainland = [], alaska = [];
        subpaths.forEach(function(sp) {
            if (!sp || sp.trim() === '') return;
            var match = sp.match(/[ML]\s*(-?\d+\.?\d*)/);
            if (match) {
                var x = parseFloat(match[1]);
                if (x < 115) alaska.push(sp + 'Z');
                else mainland.push(sp + 'Z');
            } else { mainland.push(sp + 'Z'); }
        });
        DATA[usIndex].d = mainland.join('');
        DATA.push({ iso: 'US-AK', cont: 'NA', d: alaska.join('') });
    }

    var maUnified = 'M422,191L422,189L423,189L424,188L424,187L424,186L425,185L425,184L426,183L427,183L427,182L428,182L428,181L428,179L429,178L429,178L430,177L431,176L432,175L432,174L433,173L433,173L434,172L436,172L438,171L438,171L440,170L440,169L441,169L442,168L442,167L443,166L442,165L442,164L442,163L443,162L443,161L444,161L444,160L444,159L445,158L446,158L447,157L448,157L449,156L450,156L450,155L451,154L452,153L453,151L453,151L454,150L455,151L455,152L456,152L457,152L458,152L460,152L461,152L462,152L463,152L464,153L464,153L465,155L465,156L465,157L465,158L465,159L467,160L466,160L465,161L464,161L462,161L461,161L461,162L459,162L459,163L459,164L459,165L458,165L457,166L456,166L455,167L454,168L453,168L451,168L450,168L449,168L448,169L447,169L446,170L445,170L445,172L445,173L445,174L445,176L445,177L445,178L443,178L442,178L441,178L439,178L438,178L436,178L436,179L436,180L436,181L436,183L436,184L436,185L434,185L433,186L433,188L433,189L433,191L432,191L431,191L429,191L427,191L425,191L423,191Z';
    var soUnified = 'M599,232L599,231L600,231L601,230L601,229L602,229L603,228L601,228L600,228L599,227L598,227L597,227L596,227L595,226L594,226L593,226L592,225L591,225L591,224L590,223L589,223L589,222L588,221L588,220L588,219L589,219L590,218L595,217L600,216L605,216L611,217L610,217L609,218L608,218L607,218L606,219L605,219L605,220L605,222L605,223L605,224L605,225L604,226L603,227Z';

    var BUSINESS = {
      'EU': [
        {name:'Bulgarien', iso:'BG', slug:'bulgarien', desc:'Rothirsch, Keiler, Rehwild'}, {name:'Europ. Russland', iso:'RU-EU', slug:'europ-russland', desc:'Braunbär, Elch, Auerhahn'},
        {name:'Frankreich', iso:'FR', slug:'frankreich', desc:'Gams, Rothirsch, Mufflon'}, {name:'Irland', iso:'IE', slug:'irland', desc:'Sikahirsch, Damhirsch'},
        {name:'Kroatien', iso:'HR', slug:'kroatien', desc:'Braunbär, Schwarzwild'}, {name:'Norwegen', iso:'NO', slug:'norwegen', desc:'Elch, Rentier, Schneehuhn'},
        {name:'Österreich', iso:'AT', slug:'oesterreich', desc:'Alpenmufflon, Gams, Hirsch'}, {name:'Polen', iso:'PL', slug:'polen', desc:'Rothirsch, Rehbock, Keiler'},
        {name:'Rumänien', iso:'RO', slug:'rumaenien', desc:'Braunbär, Gams, Karpatenhirsch'}, {name:'Schottland', iso:'GB-SCO', slug:'schottland', desc:'Rothirsch, Rehbock, Moorhuhn'},
        {name:'Schweden', iso:'SE', slug:'schweden', desc:'Elch, Bär, Auerhahn'}, {name:'Serbien', iso:'RS', slug:'serbien', desc:'Rehbock, Keiler, Wolf'},
        {name:'Slowakei', iso:'SK', slug:'slowakei', desc:'Hirsch, Wolf, Bär'}, {name:'Slowenien', iso:'SI', slug:'slowenien', desc:'Alpensteinbock, Gams'},
        {name:'Spanien', iso:'ES', slug:'spanien', desc:'Steinbock, Rothirsch, Mufflon'}, {name:'Südengland', iso:'GB-ENG', slug:'suedengland', desc:'Muntjak, Wasserreh'},
        {name:'Tschechien', iso:'CZ', slug:'tschechien', desc:'Sikahirsch, Mufflon'}, {name:'Türkei', iso:'TR', slug:'tuerkei', desc:'Bezoar-Steinbock, Keiler'},
        {name:'Ungarn', iso:'HU', slug:'ungarn', desc:'Kapitaler Rothirsch, Damhirsch'}, {name:'Weißrussland', iso:'BY', slug:'weissrussland', desc:'Wisent, Elch, Wolf'},
        {name:'Weitere Länder (Europa)…', iso:null}
      ],
      'AS': [
        {name:'Aserbaidschan', iso:'AZ', slug:'aserbaidschan', desc:'Dagestan-Tur'}, {name:'Iran', iso:'IR', slug:'iran', desc:'Bezoar-Steinbock, Urial'},
        {name:'Kasachstan', iso:'KZ', slug:'kasachstan', desc:'Maral, Sibirischer Steinbock'}, {name:'Kaukasus', iso:'GE', slug:'kaukasus', desc:'Kuban-Tur, Braunbär'},
        {name:'Kirgisien', iso:'KG', slug:'kirgisien', desc:'Marco-Polo-Argali, Ibex'}, {name:'Mongolei', iso:'MN', slug:'mongolei', desc:'Altai-Argali, Ibex, Maral'},
        {name:'Pakistan', iso:'PK', slug:'pakistan', desc:'Markhor, Urial, Ibex'}, {name:'Tadschikistan', iso:'TJ', slug:'tadschikistan', desc:'Marco-Polo-Argali, Markhor'},
        {name:'Asiat. Russland', iso:'RU', slug:'asiat-russland', desc:'Sibirisches Reh, Bär, Elch'},
        {name:'Weitere Länder (Asien)…', iso:null}
      ],
      'AF': [
        {name:'Äthiopien', iso:'ET', slug:'aethiopien', desc:'Bergnyala, Buschbock'}, {name:'Botswana', iso:'BW', slug:'botswana', desc:'Elefant, Leopard, Büffel'},
        {name:'Kamerun', iso:'CM', slug:'kamerun', desc:'Riesen-Eland, Bongo, Büffel'}, {name:'Kongo', iso:'CG', slug:'kongo', desc:'Bongo, Waldelefant, Sitatunga'},
        {name:'Mosambik', iso:'MZ', slug:'mosambik', desc:'Krokodil, Löwe, Büffel'}, {name:'Namibia', iso:'NA', slug:'namibia', desc:'Oryx, Kudu, Springbok, Leopard'},
        {name:'Simbabwe', iso:'ZW', slug:'simbabwe', desc:'Elefant, Büffel, Leopard'}, {name:'Südafrika', iso:'ZA', slug:'suedafrika', desc:'Nyala, Kudu, Breitmaulnashorn'},
        {name:'Sambia', iso:'ZM', slug:'sambia', desc:'Löwe, Leopard, Büffel'}, {name:'Sudan', iso:'SD', slug:'sudan', desc:'Nubischer Steinbock, Warzenschwein'},
        {name:'Tansania', iso:'TZ', slug:'tansania', desc:'Löwe, Leopard, Büffel, Elefant'}, {name:'Uganda', iso:'UG', slug:'uganda', desc:'Sitatunga, Nilbüffel'},
        {name:'Weitere Länder (Afrika)…', iso:null}
      ],
      'AMERIKA': [
        {name:'Alaska', iso:'US-AK', slug:'alaska', desc:'Elch, Karibu, Braunbär'}, {name:'Argentinien', iso:'AR', slug:'argentinien', desc:'Wasserbüffel, Hirsch, Flugwild'},
        {name:'Grönland', iso:'GL', slug:'groenland', desc:'Moschusochse, Rentier'}, {name:'Kanada', iso:'CA', slug:'kanada', desc:'Schwarzbär, Elch, Puma, Wapiti'},
        {name:'Mexiko', iso:'MX', slug:'mexiko', desc:'Dickhornschaf, Weißwedelhirsch'}, {name:'Peru', iso:'PE', slug:'peru', desc:'Puma, Weißwedelhirsch'},
        {name:'USA', iso:'US', slug:'usa', desc:'Wapiti, Puma, Pronghorn'}, {name:'Weitere Länder (Amerika)…', iso:null}
      ],
      'OC': [
        {name:'Australien', iso:'AU', slug:'australien', desc:'Wasserbüffel, Banteng'}, {name:'Neuseeland', iso:'NZ', slug:'neuseeland', desc:'Tahr, Gams, Rothirsch'},
        {name:'Weitere Länder (Ozeanien)…', iso:null}
      ]
    };

    // === Länderseiten-Navigation =========================================
    // Basis-Pfad zu den CMS-Länderseiten. Relativ -> funktioniert auf
    // Vorschau-Domain UND echter Domain.
    var LAENDER_BASE = '/laender/';
    // iso -> slug Karte (aus BUSINESS aufgebaut)
    var isoToSlug = {};
    Object.values(BUSINESS).forEach(function(list) {
        list.forEach(function(c) {
            if (c.iso && c.slug) isoToSlug[c.iso] = c.slug;
        });
    });
    function gotoCountry(iso) {
        if (!iso) return;
        var slug = isoToSlug[iso];
        if (!slug) return;
        // iOS-sicher: location.href statt window.open
        window.location.href = LAENDER_BASE + slug;
    }
    // =====================================================================

    var PLACEHOLDER_IMG = 'https://cdn.prod.website-files.com/6a031706a57be115a0a95741/6a031a630ef91eab1f78673f_Frame%201321316194.png';

    var isoDataMap = {};
    Object.values(BUSINESS).forEach(function(list) {
        list.forEach(function(c) {
            if(c.iso) isoDataMap[c.iso] = { name: c.name, desc: c.desc, img: PLACEHOLDER_IMG };
        });
    });

    function getBusinessList(cont) {
      if (cont === 'NA' || cont === 'SA') return BUSINESS['AMERIKA'];
      return BUSINESS[cont] || [];
    }
    function getServiceIsoSet(cont) {
      var list = getBusinessList(cont);
      var set = {};
      list.forEach(function(c){ if(c.iso) set[c.iso] = true; });
      return set;
    }

    var CONT_TITLE = {EU:'Europa', AS:'Asien', AF:'Afrika', NA:'Amerika', SA:'Amerika', OC:'Ozeanien'};

    var CAMERAS = {
      'EU': { cx: 580, cy: 120, scale: 1.4, dx: 0, dy: 0, pTop: '15%', pHeight: '88%' },
      'AF': { cx: 560, cy: 280, scale: 1.4, dx: 0, dy: 0, pTop: '22%', pHeight: '80%' },
      'NA': { cx: 240, cy: 250, scale: 1.0, dx: 0, dy: 0, pTop: '28%', pHeight: '65%' },
      'SA': { cx: 240, cy: 250, scale: 1.0, dx: 0, dy: 0, pTop: '28%', pHeight: '65%' },
      'AS': { cx: 780, cy: 180, scale: 1.1, dx: 0, dy: 0, pTop: '24%', pHeight: '65%' },
      'OC': { cx: 900, cy: 340, scale: 1.6, dx: 0, dy: 0, pTop: '30%', pHeight: '50%' }
    };
    var CAMERAS_PORTRAIT = {
      'EU': { focusX: 60, focusY: -10, scale: 2.3 },
      'AS': { focusX: 50, focusY: -15, scale: 1.7 },
      'AF': { focusX: 55, focusY: -10, scale: 2.0 },
      'NA': { focusX: 50, focusY: -15, scale: 1.2 },
      'SA': { focusX: 50, focusY: -15, scale: 1.2 },
      'OC': { focusX: 55, focusY: -20, scale: 2.3 }
    };
    var CONT_CENTER = {
      'EU': { cx: 530, cy: 150, name: 'Europa' },
      'AS': { cx: 760, cy: 175, name: 'Asien' },
      'AF': { cx: 520, cy: 250, name: 'Afrika' },
      'NA': { cx: 250, cy: 220, name: 'Amerika' },
      'SA': { cx: 250, cy: 220, name: 'Amerika' },
      'OC': { cx: 890, cy: 320, name: 'Ozeanien' }
    };

    mount.innerHTML =
      '<div class="jk-stage">' +
        '<div class="jk-eyebrow">— Die Welt ist weit —</div>' +
        '<div class="jk-headline">Wohin zieht es Sie?</div>' +
        '<div class="jk-sub">Wählen Sie Ihren Kontinent und starten Sie Ihre Reise</div>' +
        '<div class="jk-back">← Zurück zur Welt</div>' +
        '<div class="jk-viewport"><div class="jk-rotor">' +
          '<div class="jk-globe"><svg viewBox="0 0 1000 500" preserveAspectRatio="xMidYMid meet" class="jk-svg1"></svg></div>' +
          '<div class="jk-globe"><svg viewBox="0 0 1000 500" preserveAspectRatio="xMidYMid meet" class="jk-svg2"></svg></div>' +
        '</div></div>' +
        '<div class="jk-hint"></div>' +
        '<div class="jk-country-panel"></div>' +
        '<div class="jk-cont-label"><div class="jk-cl-name"></div></div>' +
        '<div class="jk-tooltip jk-hide"><div class="jk-tt-name"></div></div>' +
      '</div>';

    var stageEl = mount.querySelector('.jk-stage');
    var viewport = mount.querySelector('.jk-viewport');
    var rotor = mount.querySelector('.jk-rotor');
    var hint = mount.querySelector('.jk-hint');
    var back = mount.querySelector('.jk-back');
    var eyebrow = mount.querySelector('.jk-eyebrow');
    var headline = mount.querySelector('.jk-headline');
    var sub = mount.querySelector('.jk-sub');
    var panel = mount.querySelector('.jk-country-panel');
    var tooltip = mount.querySelector('.jk-tooltip');
    var contLabel = mount.querySelector('.jk-cont-label');
    var svg2 = mount.querySelector('.jk-svg2');

    var iso2cont = {};
    DATA.forEach(function(d) { iso2cont[d.iso] = d.cont; });

    var SIMPLIFY = (('ontouchstart' in window) || navigator.maxTouchPoints > 0) ? 0.8 : 0;
    function jkPerpSq(p, a, b) {
      var dx = b[0]-a[0], dy = b[1]-a[1];
      if (dx === 0 && dy === 0) { var ddx=p[0]-a[0], ddy=p[1]-a[1]; return ddx*ddx+ddy*ddy; }
      var t = ((p[0]-a[0])*dx + (p[1]-a[1])*dy) / (dx*dx+dy*dy);
      t = Math.max(0, Math.min(1, t));
      var px = a[0]+t*dx, py = a[1]+t*dy, ex = p[0]-px, ey = p[1]-py;
      return ex*ex+ey*ey;
    }
    function jkDP(pts, epsSq) {
      if (pts.length < 3) return pts;
      var dmax = 0, idx = 0;
      for (var i = 1; i < pts.length-1; i++) {
        var d = jkPerpSq(pts[i], pts[0], pts[pts.length-1]);
        if (d > dmax) { dmax = d; idx = i; }
      }
      if (dmax > epsSq) {
        return jkDP(pts.slice(0, idx+1), epsSq).slice(0, -1).concat(jkDP(pts.slice(idx), epsSq));
      }
      return [pts[0], pts[pts.length-1]];
    }
    function jkSimplify(d, eps) {
      if (!eps) return d;
      var epsSq = eps*eps, out = '';
      d.split('M').filter(function(s){ return s.trim() !== ''; }).forEach(function(part) {
        var hasZ = /Z\s*$/i.test(part.trim());
        var nums = part.replace(/Z/ig,'').split(/[ML]/i).filter(function(s){ return s.trim() !== ''; });
        var pts = [];
        nums.forEach(function(pair) {
          var xy = pair.split(',');
          if (xy.length === 2) { var x=parseFloat(xy[0]), y=parseFloat(xy[1]); if(!isNaN(x)&&!isNaN(y)) pts.push([x,y]); }
        });
        if (!pts.length) return;
        var s = jkDP(pts, epsSq);
        if (s.length < 2) s = pts;
        out += 'M' + s.map(function(p){ return p[0]+','+p[1]; }).join('L') + (hasZ ? 'Z' : '');
      });
      return out;
    }
    var SPARK_R = (('ontouchstart' in window) || navigator.maxTouchPoints > 0) ? 1.4 : 0.8;

    function fill(svg, drawSparks) {
      DATA.forEach(function (c) {
        var p = document.createElementNS(NS, 'path');
        var pathData = c.d;
        if (c.iso === 'MA') pathData = maUnified;
        if (c.iso === 'SO') pathData = soUnified;
        pathData = jkSimplify(pathData, SIMPLIFY);
        p.setAttribute('d', pathData);
        p.setAttribute('class', 'jk-country');
        p.dataset.cont = c.cont;
        p.dataset.iso = c.iso;
        svg.appendChild(p);
      });
      if (!drawSparks) return;
      var contSparks = {};
      Object.keys(SPARKS).forEach(function (iso) {
        var sc = iso2cont[iso];
        var key = (sc === 'NA' || sc === 'SA') ? 'AMERIKA' : sc;
        if (!key) return;
        if (!contSparks[key]) contSparks[key] = [];
        SPARKS[iso].forEach(function (pt) { contSparks[key].push({ pt: pt, iso: iso, cont: sc }); });
      });

      var ANCHOR_N = 4, ANCHOR_T = 24;
      var anchorSet = {};
      Object.keys(contSparks).forEach(function (key) {
        var arr = contSparks[key];
        var n = Math.min(ANCHOR_N, arr.length);
        for (var k = 0; k < n; k++) {
          var idx = Math.floor(arr.length * k / n);
          var o = arr[idx];
          anchorSet[o.iso + '|' + o.pt[0] + '|' + o.pt[1]] = k;
        }
      });

      Object.keys(SPARKS).forEach(function (iso) {
        var sparkCont = iso2cont[iso];
        SPARKS[iso].forEach(function (pt) {
          var d = document.createElementNS(NS, 'circle');
          d.setAttribute('cx', pt[0]); d.setAttribute('cy', pt[1]);
          d.setAttribute('class', 'jk-spark');
          if (sparkCont) d.dataset.cont = sparkCont;

          var anchorKey = iso + '|' + pt[0] + '|' + pt[1];
          if (anchorSet[anchorKey] !== undefined) {
            var k = anchorSet[anchorKey];
            var delay = -(ANCHOR_T * k / ANCHOR_N);
            d.setAttribute('r', SPARK_R);
            d.style.animation = 'jktw_anchor ' + ANCHOR_T + 's linear ' + delay.toFixed(2) + 's infinite';
          } else {
            d.setAttribute('r', SPARK_R);
            var dDur = (132 + Math.random() * 196);
            var del = (-Math.random() * dDur).toFixed(1);
            d.style.animation = 'jktw ' + dDur.toFixed(1) + 's ease-in-out ' + del + 's infinite';
          }
          svg.appendChild(d);
        });
      });
    }
    fill(mount.querySelector('.jk-svg1'), true);
    fill(mount.querySelector('.jk-svg2'), false);

    var zoomed = false, halfWidth = 0, offset = 0;
    var autoVel = 0, velocity = 0, userInertia = 0;
    var dragging = false, lastX = 0, lastT = 0, lastFrame = 0, activeSvg = null;
    var currentHoverIso = null, isHoveringCont = false, currentZoomCont = null;

    function isTouchLayout() {
      return (stageEl.offsetWidth <= 1024) || (stageEl.offsetHeight > stageEl.offsetWidth);
    }
    var noAutoSpin = isTouchLayout();
    function applyTouchLayout() {
      noAutoSpin = isTouchLayout();
      if (svg2) svg2.parentNode.style.display = noAutoSpin ? 'none' : '';
      if (hint) hint.textContent = noAutoSpin ? 'Tippen Sie auf einen Kontinent' : 'Fahren Sie über einen Kontinent';
    }
    applyTouchLayout();
    window.addEventListener('resize', applyTouchLayout);

    function allPaths() { return mount.querySelectorAll('.jk-country'); }

    function measure() {
      var sw = stageEl.offsetWidth, sh = stageEl.offsetHeight;
      var RATIO = 2.0;
      var isTabletOrMobile = (sw <= 1024) || (sh > sw);
      var tw, th;
      if (isTabletOrMobile) {
        tw = sw; th = sw / RATIO;
        if (th > sh) { th = sh; tw = sh * RATIO; }
      } else {
        tw = sw; th = sw / RATIO;
        if (th < sh) { th = sh; tw = sh * RATIO; }
      }
      mount.querySelectorAll('.jk-globe').forEach(function(g) {
        g.style.width = tw + 'px'; g.style.height = th + 'px';
      });
      rotor.style.width = (tw * 2) + 'px';
      rotor.style.height = th + 'px';
      rotor.style.top = ((sh - th) / 2) + 'px';
      halfWidth = tw;
      autoVel = -halfWidth / (360 * 1000);
      if (noAutoSpin) { offset = 0; rotor.style.transform = 'translateX(0px)'; }
    }
    function relayout() {
      var globes = mount.querySelectorAll('.jk-globe');
      globes.forEach(function(g){ g.style.transition = 'none'; });
      mount.querySelectorAll('svg').forEach(function(s){ s.style.transition = 'none'; });
      rotor.style.transition = 'none';

      measure();
      if (zoomed && currentZoomCont && activeSvg) {
        applyZoomTransform(currentZoomCont, activeSvg);
      }

      void mount.offsetWidth;
      requestAnimationFrame(function(){
        globes.forEach(function(g){ g.style.transition = ''; });
        rotor.style.transition = '';
        mount.querySelectorAll('svg').forEach(function(s){ s.style.transition = ''; });
      });
    }

    measure();
    window.addEventListener('resize', relayout);
    window.addEventListener('orientationchange', function() {
      relayout();
      setTimeout(relayout, 100);
      setTimeout(relayout, 300);
      setTimeout(relayout, 600);
      setTimeout(relayout, 1000);
    });
    function wrap(v) { while (v <= -halfWidth) v += halfWidth; while (v > 0) v -= halfWidth; return v; }

    function frame(t) {
      if (!lastFrame) lastFrame = t;
      var dt = t - lastFrame; lastFrame = t;
      if (dt > 100) dt = 16;

      if (!dragging && !zoomed) {
        if (noAutoSpin) {
        } else {
          userInertia *= 0.94;
          if (Math.abs(userInertia) < 0.001) userInertia = 0;
          var targetVel = isHoveringCont ? 0 : autoVel;
          velocity += (targetVel - velocity) * 0.15;
          offset += (velocity + userInertia) * dt;
          offset = wrap(offset);
          rotor.style.transform = 'translateX(' + offset + 'px)';
        }
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    function pointerDown(e) {
      if (zoomed || noAutoSpin) return;
      dragging = true; viewport.classList.add('jk-grabbing');
      hideContLabel();
      userInertia = 0;
      lastX = (e.touches ? e.touches[0].clientX : e.clientX); lastT = performance.now();
    }
    function pointerMove(e) {
      if (!dragging || zoomed || noAutoSpin) return;
      var x = (e.touches ? e.touches[0].clientX : e.clientX); var now = performance.now();
      var dx = (x - lastX) * 0.2;
      var dtm = now - lastT;
      offset = wrap(offset + dx); rotor.style.transform = 'translateX(' + offset + 'px)';
      if (dtm > 0) {
          var instantV = (dx / dtm) * 2.0;
          userInertia = userInertia * 0.4 + instantV * 0.6;
          var MAX_INERTIA = 1.5;
          if (userInertia > MAX_INERTIA) userInertia = MAX_INERTIA;
          if (userInertia < -MAX_INERTIA) userInertia = -MAX_INERTIA;
      }
      lastX = x; lastT = now;
      if (e.cancelable) e.preventDefault();
    }
    function pointerUp() { if (!dragging) return; dragging = false; viewport.classList.remove('jk-grabbing'); }
    viewport.addEventListener('mousedown', pointerDown); window.addEventListener('mousemove', pointerMove); window.addEventListener('mouseup', pointerUp);
    viewport.addEventListener('touchstart', pointerDown, {passive:true}); window.addEventListener('touchmove', pointerMove, {passive:false}); window.addEventListener('touchend', pointerUp);

    var downX = 0, moved = false;
    viewport.addEventListener('mousedown', function(e){ downX = e.clientX; moved = false; });
    viewport.addEventListener('mousemove', function(e){ if(dragging && Math.abs(e.clientX-downX)>5) moved = true; });
    viewport.addEventListener('touchstart', function(e){ if(e.touches[0]) { downX = e.touches[0].clientX; moved = false; } }, {passive:true});
    viewport.addEventListener('touchmove', function(e){ if(e.touches[0] && dragging && Math.abs(e.touches[0].clientX-downX)>5) moved = true; }, {passive:true});

    var labelCont = null;
    function showContLabel(cont, e) {
      var cfg = CONT_CENTER[cont];
      if (!cfg) return;
      var key = (cont === 'NA' || cont === 'SA') ? 'AMERIKA' : cont;

      var svg = e ? e.target.closest('svg') : mount.querySelector('.jk-svg1');
      if (!svg) svg = mount.querySelector('.jk-svg1');

      var svgRect = svg.getBoundingClientRect();
      var stageRect = stageEl.getBoundingClientRect();
      var px = svgRect.left + (cfg.cx / 1000) * svgRect.width - stageRect.left;
      var py = svgRect.top + (cfg.cy / 500) * svgRect.height - stageRect.top;

      contLabel.querySelector('.jk-cl-name').textContent = cfg.name || names[cont] || '';
      contLabel.style.left = px + 'px';
      contLabel.style.top = py + 'px';

      if (labelCont !== key) {
        contLabel.classList.remove('jk-show');
        void contLabel.offsetWidth;
      }
      contLabel.classList.add('jk-show');
      labelCont = key;
    }
    function hideContLabel() {
      contLabel.classList.remove('jk-show');
      labelCont = null;
    }

    var hoverTimeout;
    function hoverCont(cont, on, e) {
      if (zoomed) return;

      var isAm = (cont === 'NA' || cont === 'SA');
      if (on) {
        clearTimeout(hoverTimeout);
        isHoveringCont = true;

        allPaths().forEach(function (p) { p.classList.remove('jk-hover', 'jk-dim'); });
        allPaths().forEach(function (p) {
          var c = p.dataset.cont;
          var isTarget = isAm ? (c === 'NA' || c === 'SA') : (c === cont);
          p.classList.add(isTarget ? 'jk-hover' : 'jk-dim');
        });
        if (!noAutoSpin) showContLabel(cont, e);
      } else {
        clearTimeout(hoverTimeout);
        hoverTimeout = setTimeout(function() {
            isHoveringCont = false;
            hideContLabel();
            allPaths().forEach(function (p) { p.classList.remove('jk-hover', 'jk-dim'); });
        }, 120);
      }
    }

    function showMapTooltip(iso, centerX, topY) {
        var data = isoDataMap[iso];
        if (!data) return;
        tooltip.querySelector('.jk-tt-name').textContent = data.name;
        tooltip.style.left = centerX + 'px';
        tooltip.style.top = topY + 'px';
        tooltip.classList.remove('jk-hide');
        tooltip.classList.add('jk-show');
    }
    function hideMapTooltip() {
        tooltip.classList.remove('jk-show');
        tooltip.classList.add('jk-hide');
    }

    function renderAnimalInfo(iso) {
        if (('ontouchstart' in window) || navigator.maxTouchPoints > 0) return;
        var data = isoDataMap[iso];
        var animalInfo = panel.querySelector('.jk-animal-info');
        if (!animalInfo || !data) return;

        var animalNames = (data.desc || 'Premium Jagd').split(',').map(function(s){ return s.trim(); });
        var count = animalNames.length;

        var galleryHtml = '';
        animalNames.forEach(function(animalName) {
            galleryHtml += '<a class="jk-animal-item" href="#" data-iso="' + iso + '" data-animal="' + animalName + '">' +
                             '<img class="jk-animal-img" src="' + PLACEHOLDER_IMG + '" alt="' + animalName + '" />' +
                             '<div class="jk-animal-name">' + animalName + '</div>' +
                           '</a>';
        });

        var galleryEl = animalInfo.querySelector('.jk-animal-gallery');
        galleryEl.className = 'jk-animal-gallery jk-count-' + count;
        galleryEl.innerHTML = galleryHtml;
        animalInfo.classList.add('jk-show');
    }

    function applyZoomTransform(cont, clickedSvg) {
      var cam = CAMERAS[cont] || { cx: 550, cy: 250, scale: 1.5, dx: 0, dy: 0, pTop: '15%', pHeight: '70%' };
      var cx_pct = ((cam.cx + cam.dx) / 1000) * 100;
      var cy_pct = ((cam.cy + cam.dy) / 500) * 100;

      var isPortraitLayout = stageEl.offsetHeight > stageEl.offsetWidth;
      var focusX, focusY, finalScale;
      if (isPortraitLayout) {
        var pcam = CAMERAS_PORTRAIT[cont] || { focusX: 50, focusY: 25, scale: cam.scale * 1.1 };
        focusX = pcam.focusX;
        focusY = pcam.focusY;
        finalScale = pcam.scale;
      } else {
        focusX = 30;
        focusY = 50;
        finalScale = cam.scale;
      }

      clickedSvg.style.transformOrigin = '0 0';
      clickedSvg.style.transform = 'translate(' + focusX + '%, ' + focusY + '%) scale(' + finalScale + ') translate(-' + cx_pct + '%, -' + cy_pct + '%)';
      if (isPortraitLayout) {
        panel.style.top = '';
        panel.style.height = '';
      } else {
        panel.style.top = '0';
        panel.style.height = '100%';
      }
    }

    function zoomTo(cont, clickEvent) {
      clearTimeout(hoverTimeout);
      isHoveringCont = false;

      zoomed = true; dragging = false; moved = false; currentHoverIso = null; hideMapTooltip(); hideContLabel();
      viewport.classList.remove('jk-grabbing');
      stageEl.classList.add('jk-darken', 'jk-zoomed');

      var isAm = (cont === 'NA' || cont === 'SA');
      var serviceSet = getServiceIsoSet(cont);
      var clickedSvg = noAutoSpin ? mount.querySelector('.jk-svg1') : clickEvent.target.closest('svg');
      activeSvg = clickedSvg;

      allPaths().forEach(function (p) {
          p.classList.remove('jk-hover', 'jk-dim', 'jk-service', 'jk-nonservice', 'jk-active-hover');
          var c = p.dataset.cont;
          var keepVisible = isAm ? (c === 'NA' || c === 'SA') : (c === cont);

          if (!keepVisible) {
              p.style.opacity = 0; p.style.pointerEvents = 'none';
          } else {
              p.style.opacity = 1; p.style.pointerEvents = 'auto';
              if (p.closest('svg') === clickedSvg) {
                  if (serviceSet[p.dataset.iso]) { p.classList.add('jk-service'); }
                  else { p.classList.add('jk-nonservice'); }
              }
          }
      });

      mount.querySelectorAll('.jk-spark').forEach(function(s) {
          var c = s.dataset.cont;
          var keepVisible = isAm ? (c === 'NA' || c === 'SA') : (c === cont);
          s.style.display = keepVisible ? '' : 'none';
      });

      currentZoomCont = cont;
      clickedSvg.style.transition = 'transform 1.2s cubic-bezier(0.22, 1, 0.36, 1)';
      applyZoomTransform(cont, clickedSvg);

      var isSvg2 = clickedSvg.classList.contains('jk-svg2');
      var targetOffset = isSvg2 ? -halfWidth : 0;
      rotor.style.transition = 'transform 1.2s cubic-bezier(0.22, 1, 0.36, 1)';
      rotor.style.transform = 'translateX(' + targetOffset + 'px)';
      offset = targetOffset;

      eyebrow.style.opacity = 0; headline.style.opacity = 0; sub.style.opacity = 0;
      setTimeout(function () { back.classList.add('jk-show'); }, 700);

      var list = getBusinessList(cont);
      var listHtml = '<h3 class="jk-panel-title">' + (CONT_TITLE[cont] || names[cont]) + '</h3><div class="jk-list-area"><ul class="jk-country-list">';
      list.forEach(function(c) {
        var cls = c.iso ? '' : ' class="jk-more"';
        listHtml += '<li data-iso="' + (c.iso || '') + '"' + cls + '>' + c.name + '</li>';
      });
      listHtml += '</ul></div>';
      listHtml += '<div class="jk-animal-info"><div class="jk-animal-gallery"></div></div>';
      panel.innerHTML = listHtml;

      panel.querySelectorAll('li').forEach(function(li) {
        var iso = li.dataset.iso;
        if (!iso) {
          li.addEventListener('click', function() {
            console.log('Weitere Länder geklickt:', cont);
          });
          return;
        }
        function activateCountry() {
          currentHoverIso = iso;
          activeSvg.querySelectorAll('path.jk-active-hover').forEach(function(p){ p.classList.remove('jk-active-hover'); });
          panel.querySelectorAll('li.jk-active-hover').forEach(function(l){ l.classList.remove('jk-active-hover'); });
          li.classList.add('jk-active-hover');
          activeSvg.querySelectorAll('path[data-iso="'+iso+'"]').forEach(function(path){
              path.classList.add('jk-active-hover');
              if (path.nextElementSibling) path.parentNode.appendChild(path);
              var rect = path.getBoundingClientRect();
              var stageRect = stageEl.getBoundingClientRect();
              var centerX = rect.left + rect.width / 2 - stageRect.left;
              var topY = rect.top - stageRect.top - 15;
              if (topY < 35) topY = 35;
              showMapTooltip(iso, centerX, topY);
          });
          renderAnimalInfo(iso);
        }
        function deactivateCountry() {
          currentHoverIso = null; hideMapTooltip();
          li.classList.remove('jk-active-hover');
          activeSvg.querySelectorAll('path[data-iso="'+iso+'"]').forEach(function(path){
              path.classList.remove('jk-active-hover');
          });
          var animalInfo = panel.querySelector('.jk-animal-info');
          if (animalInfo) animalInfo.classList.remove('jk-show');
        }
        if (noAutoSpin) {
          // Touch: 1. Tap = direkt öffnen
          li.addEventListener('click', function(ev) {
            ev.stopPropagation();
            gotoCountry(iso);
          });
        } else {
          // Desktop: hover = Vorschau, Klick = öffnen
          li.addEventListener('mouseenter', activateCountry);
          li.addEventListener('click', function(ev) {
            ev.stopPropagation();
            gotoCountry(iso);
          });
        }
      });

      var zoomReady = false;
      setTimeout(function(){ zoomReady = true; }, 700);
      if (noAutoSpin) {
        activeSvg.querySelectorAll('path.jk-service').forEach(function(path) {
          path.addEventListener('click', function(ev) {
            ev.stopPropagation();
            if (!zoomReady) return;
            // Touch: 1. Tap auf ein Service-Land = direkt öffnen
            gotoCountry(path.dataset.iso);
          });
        });
      } else {
        // Desktop: Klick direkt auf ein Service-Land auf der Karte = öffnen
        activeSvg.querySelectorAll('path.jk-service').forEach(function(path) {
          path.addEventListener('click', function(ev) {
            ev.stopPropagation();
            if (!zoomReady) return;
            gotoCountry(path.dataset.iso);
          });
        });
      }
      [50, 200, 500, 900].forEach(function(delay) {
        setTimeout(function() {
          allPaths().forEach(function(p) { p.classList.remove('jk-active-hover'); });
          panel.querySelectorAll('li.jk-active-hover').forEach(function(li){ li.classList.remove('jk-active-hover'); });
          hideMapTooltip();
          currentHoverIso = null;
        }, delay);
      });
      setTimeout(function() { panel.classList.add('jk-show'); }, 500);
    }

    function reset() {
      zoomed = false; activeSvg = null; currentHoverIso = null; currentZoomCont = null; hideMapTooltip(); hideContLabel();
      dragging = false;
      userInertia = 0;
      velocity = autoVel;
      isHoveringCont = false;

      stageEl.classList.remove('jk-darken', 'jk-zoomed');

      panel.classList.remove('jk-show');

      allPaths().forEach(function (p) {
          p.style.opacity = ''; p.style.pointerEvents = '';
          p.classList.remove('jk-hover', 'jk-dim', 'jk-service', 'jk-nonservice', 'jk-active-hover');
      });
      mount.querySelectorAll('.jk-spark').forEach(function (s) { s.style.display = ''; });
      mount.querySelectorAll('svg').forEach(function(s) {
        s.style.transition = 'transform 0.8s cubic-bezier(0.22, 1, 0.36, 1)';
        s.style.transform = '';
      });
      rotor.style.transition = '';
      back.classList.remove('jk-show');

      eyebrow.style.opacity = '1'; headline.style.opacity = '1'; sub.style.opacity = '1';
      if (noAutoSpin) { offset = 0; setTimeout(function(){ rotor.style.transition=''; rotor.style.transform='translateX(0px)'; }, 820); }
      setTimeout(function() { panel.innerHTML = ''; panel.removeAttribute('style'); }, 450);
    }

    stageEl.addEventListener('mouseover', function(e) {
        if (!zoomed || !activeSvg) return;
        if (noAutoSpin) return;
        var isPath = e.target.tagName === 'path' && e.target.classList.contains('jk-service');

        if (isPath) {
            var iso = e.target.dataset.iso;
            var rect = e.target.getBoundingClientRect();
            var stageRect = stageEl.getBoundingClientRect();
            var centerX = rect.left + rect.width / 2 - stageRect.left;
            var topY = rect.top - stageRect.top - 15;
            if (topY < 35) topY = 35;
            showMapTooltip(iso, centerX, topY);

            if (currentHoverIso !== iso) {
                currentHoverIso = iso;
                panel.querySelectorAll('li.jk-active-hover').forEach(function(li) { li.classList.remove('jk-active-hover'); });
                activeSvg.querySelectorAll('path.jk-active-hover').forEach(function(p) { p.classList.remove('jk-active-hover'); });

                var li = panel.querySelector('li[data-iso="'+iso+'"]');
                if (li) li.classList.add('jk-active-hover');
                e.target.classList.add('jk-active-hover');
                if (e.target.nextElementSibling) e.target.parentNode.appendChild(e.target);

                renderAnimalInfo(iso);
            }
        }
    });

    allPaths().forEach(function (p) {
      var cont = p.dataset.cont;
      p.addEventListener('mouseenter', function (e) { if (!zoomed) hoverCont(cont, true, e); });
      p.addEventListener('mouseleave', function (e) { if (!zoomed) hoverCont(cont, false, e); });
      p.addEventListener('click', function (e) {
          if (!zoomed && !moved) { e.stopPropagation(); zoomTo(cont, e); }
      });
    });

    back.addEventListener('click', reset);
    stageEl.addEventListener('click', function (e) {
      if (!zoomed || moved) return;
      if (e.target.closest('.jk-country-list li') || e.target.closest('.jk-animal-info')) return;
      if (e.target.closest('.jk-back')) return;
      if (e.target.tagName === 'path' && e.target.classList.contains('jk-service')) return;
      reset();
    });
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();
