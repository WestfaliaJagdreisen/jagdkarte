/* Westfalia Jagdreisen – Interaktive Weltkarte
   依赖 window.JAGDKARTE_DATA 和 window.JAGDKARTE_SPARKS
   v2.4: 增加动态 BBox 居中缩放、背景暗化遮罩、国家德文名浮现
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

    // 狩猎目的地国家字典 (Dictionary für Jagdländer)
    // 只有在这里配置了名字的国家，放大后才会显示文字，避免小岛屿文字重叠
    var COUNTRY_NAMES = {
      'DE': 'Deutschland', 'FR': 'Frankreich', 'ES': 'Spanien', 'GB': 'Großbritannien', 'IT': 'Italien', 'RO': 'Rumänien', 'BG': 'Bulgarien', 'HU': 'Ungarn', 'HR': 'Kroatien',
      'NA': 'Namibia', 'ZA': 'Südafrika', 'TZ': 'Tansania', 'ZW': 'Simbabwe', 'MZ': 'Mosambik', 'CM': 'Kamerun', 'CF': 'ZAR', 'ET': 'Äthiopien', 'UG': 'Uganda',
      'AR': 'Argentinien', 'CL': 'Chile', 'PE': 'Peru', 'BO': 'Bolivien',
      'NZ': 'Neuseeland', 'AU': 'Australien',
      'CA': 'Kanada', 'US': 'USA', 'MX': 'Mexiko',
      'RU': 'Russland', 'MN': 'Mongolei', 'KZ': 'Kasachstan', 'TJ': 'Tadschikistan', 'KG': 'Kirgisistan', 'TR': 'Türkei'
    };

    var AUTO_SECONDS = 360;
    var DRAG_DAMP = 0.55;

    var css = `
    .jk-stage{position:relative;width:100%;height:100%;min-height:600px;display:flex;align-items:center;justify-content:center;overflow:hidden;
      background:radial-gradient(ellipse 90% 85% at 50% 38%, #3a4a4e 0%, #2a3236 45%, #211e22 100%)}
    
    /* 暗化遮罩层 (Dimming Overlay) */
    .jk-stage::after {content:'';position:absolute;inset:0;background:rgba(18, 22, 23, 0.85);opacity:0;transition:opacity 1.2s ease;pointer-events:none;z-index:1;}
    .jk-stage.jk-darken::after {opacity:1;}

    /* Webflow CSS 覆盖备用 (Fallback) */
    .jk-eyebrow{position:absolute;top:22%;left:50%;transform:translateX(-50%);text-align:center;z-index:10;letter-spacing:.45em;font-size:.72rem;color:#c9a961;font-weight:500;text-transform:uppercase;transition:opacity .8s;font-family:'Raleway',sans-serif;pointer-events:none}
    .jk-headline{position:absolute;top:26%;left:50%;transform:translateX(-50%);text-align:center;z-index:10;font-family:'Oswald',sans-serif;font-weight:600;font-size:3.6rem;letter-spacing:.04em;text-transform:uppercase;color:#F5F1E8;text-shadow:0 2px 24px rgba(0,0,0,.55);white-space:nowrap;transition:opacity .8s;pointer-events:none}
    .jk-sub{position:absolute;top:35%;left:50%;transform:translateX(-50%);text-align:center;z-index:10;font-size:.82rem;color:#dfd8cd;letter-spacing:.08em;font-weight:300;transition:opacity .8s;font-family:'Raleway',sans-serif;pointer-events:none}
    .jk-back{position:absolute;top:15%;left:5%;z-index:30;color:#c9a961;font-size:.75rem;letter-spacing:.2em;text-transform:uppercase;cursor:pointer;opacity:0;transition:opacity .5s;border-bottom:1px solid #c9a961;padding-bottom:3px;font-family:'Raleway',sans-serif}
    .jk-back.jk-show{opacity:1}

    .jk-viewport{position:absolute;inset:0;overflow:hidden;cursor:grab;z-index:5;}
    .jk-viewport.jk-grabbing{cursor:grabbing}
    .jk-rotor{position:absolute;top:0;left:0;display:flex;will-change:transform}
    .jk-globe{flex-shrink:0;}
    
    .jk-stage svg{width:100%;height:100%;display:block;overflow:visible!important;}
    .jk-country{transition:fill .5s ease,stroke .5s ease,opacity .6s ease;cursor:pointer;fill:#5a4a3a;stroke:#3f3025;stroke-width:.4;vector-effect:non-scaling-stroke}
    .jk-country.jk-hover{fill:#6e5a40!important;stroke:#c9a961!important;stroke-width:1!important;vector-effect:non-scaling-stroke;filter:drop-shadow(0 0 4px rgba(201,169,97,.7))}
    .jk-country.jk-dim{opacity:.28}
    .jk-spark{fill:#f2dca0;pointer-events:none}

    /* 国家文字样式 (Länderbeschriftungen) */
    .jk-country-lbl {font-family:'Raleway',sans-serif;font-size:12px;fill:#c9a961;opacity:0;transition:opacity 0.8s ease 0.4s;pointer-events:none;letter-spacing:.1em;text-transform:uppercase;}
    .jk-countries-text.jk-show .jk-country-lbl {opacity:1;}

    @keyframes jktw{0%,49.28%{opacity:0}50%{opacity:0.85}50.72%,100%{opacity:0}}
    .jk-label{position:absolute;z-index:20;pointer-events:none;font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-size:2.1rem;color:#c9a961;opacity:0;transition:opacity .4s;text-shadow:0 2px 16px rgba(0,0,0,.85);letter-spacing:.05em;top:50%;left:50%;transform:translate(-50%,-50%)}
    .jk-hint{position:absolute;bottom:7%;left:50%;transform:translateX(-50%);z-index:10;font-size:.7rem;color:#b0bdb6;letter-spacing:.3em;text-transform:uppercase;animation:jkpulse 2.4s ease-in-out infinite;font-family:'Raleway',sans-serif;pointer-events:none}
    @keyframes jkpulse{0%,100%{opacity:.5}50%{opacity:1}}
    `;
    var styleEl = document.createElement('style');
    styleEl.textContent = css;
    document.head.appendChild(styleEl);

    mount.innerHTML =
      '<div class="jk-stage">' +
        '<div class="jk-eyebrow">— Die Welt ist weit —</div>' +
        '<div class="jk-headline">Wohin zieht es Sie?</div>' +
        '<div class="jk-sub">Wählen Sie einen Kontinent und beginnen Sie Ihre Reise</div>' +
        '<div class="jk-back">← Zurück zur Welt</div>' +
        '<div class="jk-viewport"><div class="jk-rotor">' +
          '<div class="jk-globe"><svg viewBox="0 0 1100 500" preserveAspectRatio="xMidYMid meet" class="jk-svg1"></svg></div>' +
          '<div class="jk-globe"><svg viewBox="0 0 1100 500" preserveAspectRatio="xMidYMid meet" class="jk-svg2"></svg></div>' +
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

    function measure() {
      var stage = mount.querySelector('.jk-stage');
      var sw = stage.offsetWidth;
      var sh = stage.offsetHeight;
      var RATIO = 2.2; 
      var targetWidth = sw;
      var targetHeight = sw / RATIO;

      if (targetHeight < sh) {
        targetHeight = sh;
        targetWidth = sh * RATIO;
      }

      var globes = mount.querySelectorAll('.jk-globe');
      globes.forEach(function(g) {
        g.style.width = targetWidth + 'px';
        g.style.height = targetHeight + 'px';
      });

      var VERTICAL_OFFSET = 80; // 之前的向下偏移
      rotor.style.width = (targetWidth * 2) + 'px';
      rotor.style.height = targetHeight + 'px';
      rotor.style.top = (((sh - targetHeight) / 2) + VERTICAL_OFFSET) + 'px';

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

    // 核心引擎升级：居中、缩放、显示文字 (Kamerafahrt & Beschriftung)
    function zoomTo(cont, clickEvent) {
      zoomed = true;
      moved = false;

      // 1. 背景暗化，隐藏其他大洲
      mount.querySelector('.jk-stage').classList.add('jk-darken');
      allPaths().forEach(function (p) { if (p.dataset.cont !== cont) p.style.opacity = 0; });

      // 2. 获取当前点击的是哪个 SVG 副本
      var clickedSvg = clickEvent.target.closest('svg');

      // 3. 计算选中大洲的边界盒子 (Bounding Box)
      var minX = 1100, minY = 500, maxX = 0, maxY = 0;
      clickedSvg.querySelectorAll('path[data-cont="' + cont + '"]').forEach(function(p) {
        var b = p.getBBox();
        if(b.width === 0 || b.height === 0) return;
        if(b.x < minX) minX = b.x;
        if(b.y < minY) minY = b.y;
        if(b.x + b.width > maxX) maxX = b.x + b.width;
        if(b.y + b.height > maxY) maxY = b.y + b.height;
      });

      var cx = minX + (maxX - minX) / 2;
      var cy = minY + (maxY - minY) / 2;
      var cw = maxX - minX;
      var ch = maxY - minY;

      // 4. 自适应计算缩放比例 (使其占据屏幕大约 50% 空间)
      var fitRatio = Math.max(cw / 1100, ch / 500);
      var scale = 0.50 / fitRatio;
      if (scale > 4) scale = 4; // 限制最大放大倍数
      if (scale < 1.2) scale = 1.2;

      // 转化为百分比偏移量，保证所有屏幕尺寸响应完美
      var cx_pct = (cx / 1100) * 100;
      var cy_pct = (cy / 500) * 100;

      // 5. 对 SVG 进行平滑的 CSS Transform 居中与放大
      clickedSvg.style.transition = 'transform 1.2s cubic-bezier(0.22, 1, 0.36, 1)';
      clickedSvg.style.transform = 'translate(50%, 50%) scale(' + scale + ') translate(-' + cx_pct + '%, -' + cy_pct + '%)';

      // 6. 转子 (Rotor) 就位，确保我们放大的 SVG 正好处在屏幕中心
      var isSvg2 = clickedSvg.classList.contains('jk-svg2');
      var targetOffset = isSvg2 ? -halfWidth : 0;
      rotor.style.transition = 'transform 1.2s cubic-bezier(0.22, 1, 0.36, 1)';
      rotor.style.transform = 'translateX(' + targetOffset + 'px)';
      offset = targetOffset; 

      label.style.opacity = 0; hint.style.opacity = 0;
      eyebrow.style.opacity = 0; headline.style.opacity = 0; sub.style.opacity = 0;
      setTimeout(function () { back.classList.add('jk-show'); }, 700);

      // 7. 注入国家文字 (Länder-Tags injizieren)
      var textGroup = document.createElementNS(NS, 'g');
      textGroup.setAttribute('class', 'jk-countries-text');
      
      clickedSvg.querySelectorAll('path[data-cont="' + cont + '"]').forEach(function(p) {
         var iso = p.dataset.iso;
         var name = COUNTRY_NAMES[iso];
         if(!name) return; // 只有字典里配置了的核心国家才会显示文字
         
         var b = p.getBBox();
         var ctx = b.x + b.width/2;
         var cty = b.y + b.height/2;
         
         var txt = document.createElementNS(NS, 'text');
         txt.setAttribute('x', ctx);
         txt.setAttribute('y', cty);
         txt.setAttribute('text-anchor', 'middle');
         txt.setAttribute('dominant-baseline', 'central');
         txt.setAttribute('class', 'jk-country-lbl');
         
         // 修正部分特殊形状国家的物理中心点偏差（例如智利狭长，中心点可能偏移）
         if(iso === 'CL') txt.setAttribute('dx', '5');
         if(iso === 'HR') txt.setAttribute('dy', '2');
         if(iso === 'CA') { txt.setAttribute('dx', '15'); txt.setAttribute('dy', '15'); }

         txt.textContent = name;
         textGroup.appendChild(txt);
      });
      clickedSvg.appendChild(textGroup);
      
      // 延迟平滑显示文字
      setTimeout(function() { textGroup.classList.add('jk-show'); }, 500);
    }

    function reset() {
      zoomed = false;
      // 移除暗化遮罩
      mount.querySelector('.jk-stage').classList.remove('jk-darken');
      allPaths().forEach(function (p) { p.style.opacity = ''; p.classList.remove('jk-hover', 'jk-dim'); });

      // 重置 SVG 的缩放矩阵
      var svgs = mount.querySelectorAll('svg');
      svgs.forEach(function(s) {
         s.style.transition = 'transform 0.8s ease';
         s.style.transform = '';
         // 销毁生成的文字组
         var textGroup = s.querySelector('.jk-countries-text');
         if (textGroup) s.removeChild(textGroup);
      });

      rotor.style.transition = ''; 
      velocity = autoVel; 

      back.classList.remove('jk-show');
      eyebrow.style.opacity = ''; headline.style.opacity = ''; sub.style.opacity = '';
      hint.style.opacity = '';
    }

    allPaths().forEach(function (p) {
      var cont = p.dataset.cont;
      p.addEventListener('mouseenter', function () { hoverCont(cont, true); });
      p.addEventListener('mouseleave', function () { hoverCont(cont, false); });
      // 关键传递 event，让引擎知道点击的是哪个副本
      p.addEventListener('click', function (e) { if (!zoomed && !moved) zoomTo(cont, e); });
    });
    back.addEventListener('click', reset);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
