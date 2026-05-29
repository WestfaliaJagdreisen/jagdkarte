/* Westfalia Jagdreisen – Interaktive Weltkarte
   依赖 window.JAGDKARTE_DATA 和 window.JAGDKARTE_SPARKS (由 jagdkarte-data.js 提供)
   用法：页面放一个 <div id="jagdkarte"></div>，再引入本脚本
*/
(function () {
  function init() {
    var mount = document.getElementById('jagdkarte');
    if (!mount) { console.warn('[Jagdkarte] 找不到 #jagdkarte 容器'); return; }
    if (!window.JAGDKARTE_DATA) { console.warn('[Jagdkarte] 数据未加载'); return; }

    var DATA = window.JAGDKARTE_DATA;
    var SPARKS = window.JAGDKARTE_SPARKS || {};
    var names = {EU:'Europa',AS:'Asien',AF:'Afrika',NA:'Nordamerika',SA:'Südamerika',OC:'Ozeanien'};
    var NS = 'http://www.w3.org/2000/svg';

    // ---- 样式注入 ----
    var css = `
    .jk-stage{position:relative;width:100%;height:100%;min-height:600px;display:flex;align-items:center;justify-content:center;overflow:hidden;
      background:radial-gradient(ellipse 80% 80% at 50% 42%, #335256 0%, #25403f 55%, #1a2e2c 100%)}
    .jk-eyebrow{position:absolute;top:9%;left:50%;transform:translateX(-50%);text-align:center;z-index:10;letter-spacing:.45em;font-size:.72rem;color:#c9a961;font-weight:500;text-transform:uppercase;transition:opacity .8s;font-family:'Raleway',sans-serif}
    .jk-headline{position:absolute;top:12.5%;left:50%;transform:translateX(-50%);text-align:center;z-index:10;font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-size:2.9rem;color:#F5F1E8;font-weight:400;text-shadow:0 2px 24px rgba(0,0,0,.55);white-space:nowrap;transition:opacity .8s}
    .jk-sub{position:absolute;top:24%;left:50%;transform:translateX(-50%);text-align:center;z-index:10;font-size:.82rem;color:#dfd8cd;letter-spacing:.08em;font-weight:300;transition:opacity .8s;font-family:'Raleway',sans-serif}
    .jk-viewport{position:absolute;inset:0;overflow:hidden}
    .jk-rotor{position:absolute;top:0;left:0;height:100%;width:200%;display:flex;animation:jkspin 360s linear infinite}
    .jk-rotor.jk-paused{animation-play-state:paused}
    @keyframes jkspin{from{transform:translateX(0)}to{transform:translateX(-50%)}}
    .jk-globe{width:50%;height:100%}
    .jk-stage svg{width:100%;height:100%;display:block}
    .jk-country{transition:fill .5s ease,stroke .5s ease,opacity .6s ease;cursor:pointer;fill:#56493c;stroke:#3d3228;stroke-width:.4;vector-effect:non-scaling-stroke}
    .jk-country.jk-hover{fill:#6a5a44!important;stroke:#c9a961!important;stroke-width:1!important;vector-effect:non-scaling-stroke;filter:drop-shadow(0 0 4px rgba(201,169,97,.7))}
    .jk-country.jk-dim{opacity:.28}
    .jk-spark{fill:#f0d89a;pointer-events:none}
    @keyframes jktw{0%,49.5%{opacity:0}50%{opacity:0.85}50.5%,100%{opacity:0}}
    .jk-label{position:absolute;z-index:20;pointer-events:none;font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-size:2.1rem;color:#c9a961;opacity:0;transition:opacity .4s;text-shadow:0 2px 16px rgba(0,0,0,.85);letter-spacing:.05em;top:50%;left:50%;transform:translate(-50%,-50%)}
    .jk-hint{position:absolute;bottom:7%;left:50%;transform:translateX(-50%);z-index:10;font-size:.7rem;color:#b0bdb6;letter-spacing:.3em;text-transform:uppercase;animation:jkpulse 2.4s ease-in-out infinite;font-family:'Raleway',sans-serif}
    @keyframes jkpulse{0%,100%{opacity:.5}50%{opacity:1}}
    .jk-back{position:absolute;top:7%;left:5%;z-index:30;color:#c9a961;font-size:.75rem;letter-spacing:.2em;text-transform:uppercase;cursor:pointer;opacity:0;transition:opacity .5s;border-bottom:1px solid #c9a961;padding-bottom:3px;font-family:'Raleway',sans-serif}
    .jk-back.jk-show{opacity:1}
    `;
    var styleEl = document.createElement('style');
    styleEl.textContent = css;
    document.head.appendChild(styleEl);

    // ---- DOM 结构 ----
    mount.innerHTML =
      '<div class="jk-stage">' +
        '<div class="jk-eyebrow">— Die Welt ist weit —</div>' +
        '<div class="jk-headline">Wohin zieht es Sie?</div>' +
        '<div class="jk-sub">Wählen Sie einen Kontinent und beginnen Sie Ihre Reise</div>' +
        '<div class="jk-back">← Zurück zur Welt</div>' +
        '<div class="jk-viewport"><div class="jk-rotor">' +
          '<div class="jk-globe"><svg viewBox="0 0 1000 500" preserveAspectRatio="xMidYMid slice" class="jk-svg1"></svg></div>' +
          '<div class="jk-globe"><svg viewBox="0 0 1000 500" preserveAspectRatio="xMidYMid slice" class="jk-svg2"></svg></div>' +
        '</div></div>' +
        '<div class="jk-label"></div>' +
        '<div class="jk-hint">Fahren Sie über einen Kontinent</div>' +
      '</div>';

    var stage = mount.querySelector('.jk-stage');
    var rotor = mount.querySelector('.jk-rotor');
    var label = mount.querySelector('.jk-label');
    var hint = mount.querySelector('.jk-hint');
    var back = mount.querySelector('.jk-back');
    var eyebrow = mount.querySelector('.jk-eyebrow');
    var headline = mount.querySelector('.jk-headline');
    var sub = mount.querySelector('.jk-sub');

    function fill(svg) {
      DATA.forEach(function (c) {
        var p = document.createElementNS(NS, 'path');
        p.setAttribute('d', c.d);
        p.setAttribute('class', 'jk-country');
        p.dataset.cont = c.cont;
        p.dataset.iso = c.iso;
        svg.appendChild(p);
      });
      Object.keys(SPARKS).forEach(function (iso) {
        SPARKS[iso].forEach(function (pt) {
          var d = document.createElementNS(NS, 'circle');
          d.setAttribute('cx', pt[0]); d.setAttribute('cy', pt[1]);
          d.setAttribute('r', (0.5 + Math.random() * 0.7).toFixed(2));
          d.setAttribute('class', 'jk-spark');
          var dur = (132 + Math.random() * 196);
          var del = (-Math.random() * dur).toFixed(1);
          d.style.animation = 'jktw ' + dur.toFixed(1) + 's ease-in-out ' + del + 's infinite';
          svg.appendChild(d);
        });
      });
    }
    fill(mount.querySelector('.jk-svg1'));
    fill(mount.querySelector('.jk-svg2'));

    var zoomed = false;
    function allPaths() { return mount.querySelectorAll('.jk-country'); }

    function hoverCont(cont, on) {
      if (zoomed) return;
      allPaths().forEach(function (p) { p.classList.remove('jk-hover', 'jk-dim'); });
      if (on) {
        allPaths().forEach(function (p) {
          p.classList.add(p.dataset.cont === cont ? 'jk-hover' : 'jk-dim');
        });
        label.textContent = names[cont];
        label.style.opacity = 1;
        hint.style.opacity = 0;
      } else {
        label.style.opacity = 0;
        hint.style.opacity = '';
      }
    }

    function zoomTo(cont) {
      zoomed = true;
      rotor.classList.add('jk-paused');
      allPaths().forEach(function (p) { if (p.dataset.cont !== cont) p.style.opacity = 0; });
      label.style.opacity = 0; hint.style.opacity = 0;
      eyebrow.style.opacity = 0; headline.style.opacity = 0; sub.style.opacity = 0;
      setTimeout(function () { back.classList.add('jk-show'); }, 700);
      // ★ 这里以后接：飞入该洲的下一层 / 或跳转到洲页面
      // window.location.href = '/kontinent/' + cont.toLowerCase();
    }

    function reset() {
      zoomed = false;
      rotor.classList.remove('jk-paused');
      allPaths().forEach(function (p) { p.style.opacity = ''; p.classList.remove('jk-hover', 'jk-dim'); });
      back.classList.remove('jk-show');
      eyebrow.style.opacity = ''; headline.style.opacity = ''; sub.style.opacity = '';
      hint.style.opacity = '';
    }

    allPaths().forEach(function (p) {
      var cont = p.dataset.cont;
      p.addEventListener('mouseenter', function () { hoverCont(cont, true); });
      p.addEventListener('mouseleave', function () { hoverCont(cont, false); });
      p.addEventListener('click', function () { if (!zoomed) zoomTo(cont); });
    });
    back.addEventListener('click', reset);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
