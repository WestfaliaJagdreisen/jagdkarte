/* Westfalia Jagdreisen – Interaktive Weltkarte
   依赖 window.JAGDKARTE_DATA 和 window.JAGDKARTE_SPARKS (由 jagdkarte-data.js 提供)
   用法：页面放一个 <div id="jagdkarte"></div>，再引入本脚本
   v2.1: 修复裁切问题，强制 2:1 原生比例，完美无缝循环
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

    // 自转速度：360秒转一个屏宽。换算成 px/ms 在运行时按容器宽度计算
    var AUTO_SECONDS = 360;
    var DRAG_DAMP = 0.55;

    var css = `
    .jk-stage{position:relative;width:100%;height:100%;min-height:600px;display:flex;align-items:center;justify-content:center;overflow:hidden;
      background:radial-gradient(ellipse 90% 85% at 50% 38%, #3a4a4e 0%, #2a3236 45%, #211e22 100%)}
    .jk-eyebrow{position:absolute;top:7%;left:50%;transform:translateX(-50%);text-align:center;z-index:10;letter-spacing:.45em;font-size:.72rem;color:#c9a961;font-weight:500;text-transform:uppercase;transition:opacity .8s;font-family:'Raleway',sans-serif;pointer-events:none}
    .jk-headline{position:absolute;top:11%;left:50%;transform:translateX(-50%);text-align:center;z-index:10;font-family:'Oswald',sans-serif;font-weight:600;font-size:3.6rem;letter-spacing:.04em;text-transform:uppercase;color:#F5F1E8;text-shadow:0 2px 24px rgba(0,0,0,.55);white-space:nowrap;transition:opacity .8s;pointer-events:none}
    .jk-sub{position:absolute;top:22%;left:50%;transform:translateX(-50%);text-align:center;z-index:10;font-size:.82rem;color:#dfd8cd;letter-spacing:.08em;font-weight:300;transition:opacity .8s;font-family:'Raleway',sans-serif;pointer-events:none}
    
    /* 修改视口 (Viewport) 设定 */
    .jk-viewport{position:absolute;inset:0;overflow:hidden;cursor:grab;}
    .jk-viewport.jk-grabbing{cursor:grabbing}
    
    /* 移除转子 (Rotor) 和地球 (Globe) 的强硬百分比限制 */
    .jk-rotor{position:absolute;top:0;left:0;display:flex;will-change:transform}
    .jk-globe{flex-shrink:0;}
    
    .jk-stage svg{width:100%;height:100%;display:block}
    .jk-country{transition:fill .5s ease,stroke .5s ease,opacity .6s ease;cursor:pointer;fill:#5a4a3a;stroke:#3f3025;stroke-width:.4;vector-effect:non-scaling-stroke}
    .jk-country.jk-hover{fill:#6e5a40!important;stroke:#c9a961!important;stroke-width:1!important;vector-effect:non-scaling-stroke;filter:drop-shadow(0 0 4px rgba(201,169,97,.7))}
    .jk-country.jk-dim{opacity:.28}
    .jk-spark{fill:#f2dca0;pointer-events:none}
    @keyframes jktw{0%,49.28%{opacity:0}50%{opacity:0.85}50.72%,100%{opacity:0}}
    .jk-label{position:absolute;z-index:20;pointer-events:none;font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-size:2.1rem;color:#c9a961;opacity:0;transition:opacity .4s;text-shadow:0 2px 16px rgba(0,0,0,.85);letter-spacing:.05em;top:50%;left:50%;transform:translate(-50%,-50%)}
    .jk-hint{position:absolute;bottom:7%;left:50%;transform:translateX(-50%);z-index:10;font-size:.7rem;color:#b0bdb6;letter-spacing:.3em;text-transform:uppercase;animation:jkpulse 2.4s ease-in-out infinite;font-family:'Raleway',sans-serif;pointer-events:none}
    @keyframes jkpulse{0%,100%{opacity:.5}50%{opacity:1}}
    .jk-back{position:absolute;top:7%;left:5%;z-index:30;color:#c9a961;font-size:.75rem;letter-spacing:.2em;text-transform:uppercase;cursor:pointer;opacity:0;transition:opacity .5s;border-bottom:1px solid #c9a961;padding-bottom:3px;font-family:'Raleway',sans-serif}
    .jk-back.jk-show{opacity:1}
    `;
    var styleEl = document.createElement('style');
    styleEl.textContent = css;
    document.head.appendChild(styleEl);

    // 将 SVG 的 slice 改为 meet，配合精确的 2:1 容器实现零裁切
    mount.innerHTML =
      '<div class="jk-stage">' +
        '<div class="jk-eyebrow">— Die Welt ist weit —</div>' +
        '<div class="jk-headline">Wohin zieht es Sie?</div>' +
        '<div class="jk-sub">Wählen Sie einen Kontinent und beginnen Sie Ihre Reise</div>' +
        '<div class="jk-back">← Zurück zur Welt</div>' +
        '<div class="jk-viewport"><div class="jk-rotor">' +
          '<div class="jk-globe"><svg viewBox="0 0 1000 500" preserveAspectRatio="xMidYMid meet" class="jk-svg1"></svg></div>' +
          '<div class="jk-globe"><svg viewBox="0 0 1000 500" preserveAspectRatio="xMidYMid meet" class="jk-svg2"></svg></div>' +
        '</div></div>' +
        '<div class="jk-label"></div>' +
        '<div class="jk-hint">Fahren Sie über einen Kontinent</div>' +
      '</div>';

    var viewport = mount.querySelector('.jk-viewport');
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

    var halfWidth = 0;            
    var offset = 0;              
    var autoVel = 0;             
    var velocity = 0;            
    var dragging = false;
    var lastX = 0, lastT = 0;
    var lastFrame = 0;

    // 核心重写：精准接管尺寸运算 (Maßberechnung)
    function measure() {
      var stage = mount.querySelector('.jk-stage');
      var sw = stage.offsetWidth;
      var sh = stage.offsetHeight;

      // 强制按照 1000:500 (2:1) 的原生比例计算
      var targetWidth = sw;
      var targetHeight = sw / 2;

      // 如果宽度适配导致高度不足以铺满屏幕，则改用高度适配
      if (targetHeight < sh) {
        targetHeight = sh;
        targetWidth = sh * 2;
      }

      var globes = mount.querySelectorAll('.jk-globe');
      globes.forEach(function(g) {
        g.style.width = targetWidth + 'px';
        g.style.height = targetHeight + 'px';
      });

      // 设置 rotor 的宽度，并使其垂直居中 (Vertikale Zentrierung)
      rotor.style.width = (targetWidth * 2) + 'px';
      rotor.style.height = targetHeight + 'px';
      rotor.style.top = ((sh - targetHeight) / 2) + 'px';

      halfWidth = targetWidth;
      autoVel = -halfWidth / (AUTO_SECONDS * 1000);
    }
    
    measure();
    window.addEventListener('resize', measure);

    function wrap(v) {
      while (v <= -halfWidth) v += halfWidth;
      while (v > 0) v -= halfWidth;
      return v;
    }

    function frame(t) {
      if (!lastFrame) lastFrame = t;
      var dt = t - lastFrame;
      lastFrame = t;
      if (dt > 100) dt = 16;

      if (!dragging && !zoomed) {
        velocity += (autoVel - velocity) * 0.03;
        offset += velocity * dt;
        offset = wrap(offset);
        rotor.style.transform = 'translateX(' + offset + 'px)';
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    function pointerDown(e) {
      if (zoomed) return;
      dragging = true;
      viewport.classList.add('jk-grabbing');
      lastX = (e.touches ? e.touches[0].clientX : e.clientX);
      lastT = performance.now();
      velocity = 0;
    }
    function pointerMove(e) {
      if (!dragging) return;
      var x = (e.touches ? e.touches[0].clientX : e.clientX);
      var now = performance.now();
      var dx = (x - lastX) * DRAG_DAMP;   
      var dtm = now - lastT;
      offset = wrap(offset + dx);
      rotor.style.transform = 'translateX(' + offset + 'px)';
      if (dtm > 0) velocity = dx / dtm; 
      lastX = x; lastT = now;
      if (e.cancelable) e.preventDefault();
    }
    function pointerUp() {
      if (!dragging) return;
      dragging = false;
      viewport.classList.remove('jk-grabbing');
    }
    viewport.addEventListener('mousedown', pointerDown);
    window.addEventListener('mousemove', pointerMove);
    window.addEventListener('mouseup', pointerUp);
    viewport.addEventListener('touchstart', pointerDown, {passive:true});
    window.addEventListener('touchmove', pointerMove, {passive:false});
    window.addEventListener('touchend', pointerUp);

    var downX = 0, moved = false;
    function markDown(x){ downX = x; moved = false; }
    function markMove(x){ if(dragging && Math.abs(x-downX)>5) moved = true; }
    viewport.addEventListener('mousedown', function(e){ markDown(e.clientX); });
    viewport.addEventListener('mousemove', function(e){ markMove(e.clientX); });
    viewport.addEventListener('touchstart', function(e){ if(e.touches[0]) markDown(e.touches[0].clientX); }, {passive:true});
    viewport.addEventListener('touchmove', function(e){ if(e.touches[0]) markMove(e.touches[0].clientX); }, {passive:true});

    function hoverCont(cont, on) {
      if (zoomed || dragging) return;
      allPaths().forEach(function (p) { p.classList.remove('jk-hover', 'jk-dim'); });
      if (on) {
        allPaths().forEach(function (p) {
          p.classList.add(p.dataset.cont === cont ? 'jk-hover' : 'jk-dim');
        });
        label.textContent = names[cont];
        label.style.opacity = 1; hint.style.opacity = 0;
      } else {
        label.style.opacity = 0; hint.style.opacity = '';
      }
    }
    function zoomTo(cont) {
      zoomed = true;
      allPaths().forEach(function (p) { if (p.dataset.cont !== cont) p.style.opacity = 0; });
      label.style.opacity = 0; hint.style.opacity = 0;
      eyebrow.style.opacity = 0; headline.style.opacity = 0; sub.style.opacity = 0;
      setTimeout(function () { back.classList.add('jk-show'); }, 700);
    }
    function reset() {
      zoomed = false;
      allPaths().forEach(function (p) { p.style.opacity = ''; p.classList.remove('jk-hover', 'jk-dim'); });
      back.classList.remove('jk-show');
      eyebrow.style.opacity = ''; headline.style.opacity = ''; sub.style.opacity = '';
      hint.style.opacity = '';
      velocity = autoVel; 
    }
    allPaths().forEach(function (p) {
      var cont = p.dataset.cont;
      p.addEventListener('mouseenter', function () { hoverCont(cont, true); });
      p.addEventListener('mouseleave', function () { hoverCont(cont, false); });
      p.addEventListener('click', function () { if (!zoomed && !moved) zoomTo(cont); });
    });
    back.addEventListener('click', reset);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
