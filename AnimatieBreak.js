// Basic config
const MAX_CLICKS = 3;

// Programmatically generate high-density, interlocking organic micro-shards (10x20 grid with jittered vertices)
const SHARD_TEMPLATES = (() => {
  const templates = [];
  const cols = 10;
  const rows = 20;
  const jitterFactor = 0.01; // Controls how jagged/organic the shard shapes are
  
  // Create a grid of points with randomized inner intersections
  const points = [];
  for (let r = 0; r <= rows; r++) {
    points[r] = [];
    for (let c = 0; c <= cols; c++) {
      let x = c / cols;
      let y = r / rows;
      
      // Jitter the internal vertices but lock the outer borders cleanly to [0,1]
      if (c > 0 && c < cols) x += (Math.random() - 0.5) * jitterFactor;
      if (r > 0 && r < rows) y += (Math.random() - 0.5) * jitterFactor;
      
      points[r][c] = [Math.max(0, Math.min(1, x)), Math.max(0, Math.min(1, y))];
    }
  }
  
  // Assemble the coordinates into interlocking quadrilaterals
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      templates.push([
        points[r][c],       // Top-Left
        points[r][c+1],     // Top-Right
        points[r+1][c+1],   // Bottom-Right
        points[r+1][c]      // Bottom-Left
      ]);
    }
  }
  return templates;
})();

document.addEventListener('DOMContentLoaded', () => {
  const img = document.getElementById('target');
  const stage = document.getElementById('stage');
  const crackLayer = document.getElementById('crackLayer');
  const shardLayer = document.getElementById('shardLayer');
  const progressFill = document.getElementById('progressFill');

  let clicks = 0;
  let shards = []; 
  let imgSize = { w: 0, h: 0 };

  function syncOverlaySize() {
    const rect = img.getBoundingClientRect();
    imgSize.w = img.naturalWidth || rect.width;
    imgSize.h = img.naturalHeight || rect.height;

    crackLayer.setAttribute('viewBox', `0 0 ${imgSize.w} ${imgSize.h}`);
    shardLayer.setAttribute('viewBox', `0 0 ${imgSize.w} ${imgSize.h}`);

    const w = img.clientWidth;
    const h = img.clientHeight;
    crackLayer.setAttribute('width', w);
    crackLayer.setAttribute('height', h);
    shardLayer.setAttribute('width', w);
    shardLayer.setAttribute('height', h);
    crackLayer.style.width = shardLayer.style.width = w + 'px';
    crackLayer.style.height = shardLayer.style.height = h + 'px';

    crackLayer.setAttribute('overflow', 'hidden');
    crackLayer.style.overflow = 'hidden';

    shardLayer.setAttribute('overflow', 'visible');
    shardLayer.style.overflow = 'visible';

    crackLayer.style.position = 'absolute';
    shardLayer.style.position = 'absolute';
    crackLayer.style.left = shardLayer.style.left = '0';
    crackLayer.style.top = shardLayer.style.top = '0';
    crackLayer.style.pointerEvents = shardLayer.style.pointerEvents = 'none';
  }

  function updateProgress() {
    const pct = Math.min(100, (clicks / MAX_CLICKS) * 100);
    if(progressFill) progressFill.style.width = pct + '%';
  }

  function drawCrack(x, y) {
    const ns = 'http://www.w3.org/2000/svg';
    const branches = 8 + Math.floor(Math.random() * 1); 
    const maxDim = Math.max(imgSize.w, imgSize.h);
    const baseLen = Math.max(60, maxDim * 0.45); 

    for (let b = 0; b < branches; b++) {
      const path = document.createElementNS(ns, 'path');
      const angle = (Math.PI * 2) * (b / branches + (Math.random() - 0.5) * 0.08);
      const len = baseLen * (0.8 + Math.random() * 0.6); 

      const ex = x + Math.cos(angle) * len;
      const ey = y + Math.sin(angle) * len;
      const segments = [];
      const steps = 4 + Math.floor(Math.random() * 3); 
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const px = x + (ex - x) * t;
        const py = y + (ey - y) * t;
        const jitter = (1 - Math.abs(0.5 - t) * 2) * (maxDim * 0.025); 
        const perp = (Math.random() - 0.5) * jitter;
        const perpX = -Math.sin(angle) * perp;
        const perpY = Math.cos(angle) * perp;
        segments.push([px + perpX, py + perpY]);
      }

      const d = segments.map((s, i) => (i === 0 ? 'M' : 'L') + s[0] + ' ' + s[1]).join(' ');
      path.setAttribute('d', d);
      path.classList.add('crack');

      const approxLen = len * 1.2 + steps * 6;
      path.style.strokeDasharray = approxLen;
      path.style.strokeDashoffset = approxLen;
      path.style.opacity = 0;
      
      // Accelerated branch drawing profile
      path.style.transition = 'stroke-dashoffset 100ms ease-out, opacity 50ms linear';

      crackLayer.appendChild(path);

        requestAnimationFrame(() => {
        // All branches trigger simultaneously after a tiny 10ms layout delay
        setTimeout(() => {
          path.style.opacity = 1;
          path.style.strokeDashoffset = 0;
        }, 10); 
      });
    }
  }

  function createShards() {
    const ns = 'http://www.w3.org/2000/svg';
    shardLayer.innerHTML = ''; 
    
    const defs = document.createElementNS(ns, 'defs');
    shardLayer.appendChild(defs);
    
    const wrapper = document.createElementNS(ns, 'g');
    wrapper.id = 'shardWrapper';
    wrapper.style.transformOrigin = `${imgSize.w / 2}px ${imgSize.h / 2}px`;
    shardLayer.appendChild(wrapper);

    const INFLATION_BASE = 1.03; 

    SHARD_TEMPLATES.forEach((poly, i) => {
      const id = `clip-${i}-${Date.now()}`;

      let cx = 0, cy = 0;
      poly.forEach(p => { cx += p[0]; cy += p[1]; });
      cx /= poly.length;
      cy /= poly.length;

      const inflation = INFLATION_BASE * (1 + (Math.random() - 0.5) * 0.02);

      const inflatedPoints = poly.map(p => {
        const dx = p[0] - cx;
        const dy = p[1] - cy;
        const px = cx + dx * inflation;
        const py = cy + dy * inflation;
        return `${Math.round(px * imgSize.w)},${Math.round(py * imgSize.h)}`;
      }).join(' ');

      const clip = document.createElementNS(ns, 'clipPath');
      clip.setAttribute('id', id);
      const polygon = document.createElementNS(ns, 'polygon');
      polygon.setAttribute('points', inflatedPoints);
      clip.appendChild(polygon);
      defs.appendChild(clip);

      const imgElem = document.createElementNS(ns, 'image');
      imgElem.setAttributeNS('http://www.w3.org/1999/xlink', 'href', img.getAttribute('src') || '');
      imgElem.setAttribute('width', imgSize.w);
      imgElem.setAttribute('height', imgSize.h);
      imgElem.setAttribute('clip-path', `url(#${id})`);
      imgElem.classList.add('shard');
      
      imgElem.style.transformOrigin = `${imgSize.w / 2}px ${imgSize.h / 2}px`;

      wrapper.appendChild(imgElem);
      shards.push(imgElem);
    });
  }

  function animateShards() {
    shards.forEach(node => {
      node.style.transition = 'transform 900ms cubic-bezier(.2,.9,.2,1), opacity 900ms linear';
      node.style.opacity = '1';
      const tx = (Math.random() - 0.5) * imgSize.w * 0.75;
      const ty = (Math.random() - 0.5) * imgSize.h * 0.75;
      const r = (Math.random() - 0.5) * 90;
      node.style.transform = `translate(${tx}px, ${ty}px) rotate(${r}deg) scale(1)`;
    });
  }

  function triggerSwirlRings() {
    const ns = 'http://www.w3.org/2000/svg';
    const swirlGroup = document.createElementNS(ns, 'g');
    swirlGroup.style.transformOrigin = `${imgSize.w / 2}px ${imgSize.h / 2}px`;
    
    const maxR = Math.max(imgSize.w, imgSize.h) * 0.6;
    
    for(let i = 0; i < 4; i++) {
      const ring = document.createElementNS(ns, 'circle');
      ring.setAttribute('cx', imgSize.w / 2);
      ring.setAttribute('cy', imgSize.h / 2);
      ring.setAttribute('r', maxR * (0.25 + (i * 0.2)));
      ring.setAttribute('fill', 'none');
      ring.setAttribute('stroke', '#00ff66');
      ring.setAttribute('stroke-width', 3 - (i * 0.5));
      ring.setAttribute('stroke-dasharray', `${15 + i*20} ${15 + i*10}`);
      swirlGroup.appendChild(ring);
    }
    
    shardLayer.insertBefore(swirlGroup, shardLayer.firstChild);
    
    swirlGroup.style.transform = 'rotate(0deg) scale(1)';
    swirlGroup.style.opacity = '0';
    
    requestAnimationFrame(() => {
      swirlGroup.style.transition = 'transform 1200ms cubic-bezier(0.5, 0, 0.2, 1), opacity 1000ms ease-out';
      swirlGroup.style.transform = 'rotate(-1080deg) scale(0)';
      swirlGroup.style.opacity = '0.7';
    });
    
    setTimeout(() => {
      if (swirlGroup.parentNode) swirlGroup.parentNode.removeChild(swirlGroup);
    }, 1200);
  }

  // Spawns immediately and expands dynamically over 1200ms alongside shard swirl with a native premium glow filter
  function triggerDynamicGreenBall(onComplete) {
    const ns = 'http://www.w3.org/2000/svg';
    
    // 1. Grab or create standard defs layout pool to house our filter blueprints
    let defs = shardLayer.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS(ns, 'defs');
      shardLayer.appendChild(defs);
    }

    // 2. Build out our unique, high-intensity reusable glow blueprint wrapper
    const filterId = 'vortexCoreGlow';
    if (!document.getElementById(filterId)) {
      const filter = document.createElementNS(ns, 'filter');
      filter.setAttribute('id', filterId);
      filter.setAttribute('x', '-100%');
      filter.setAttribute('y', '-100%');
      filter.setAttribute('width', '300%');
      filter.setAttribute('height', '300%');

      const blur = document.createElementNS(ns, 'feGaussianBlur');
      blur.setAttribute('stdDeviation', '100'); 
      blur.setAttribute('result', 'heavyBlur');

      const colorMatrix = document.createElementNS(ns, 'feColorMatrix');
      colorMatrix.setAttribute('type', 'matrix');
      colorMatrix.setAttribute('values', `
        0 0 0 0 0.0
        0 1 0 0 1.0
        0 0 0 0 0.4
        0 0 0 1 0
      `);
      colorMatrix.setAttribute('result', 'neonGreenGlow');

      const merge = document.createElementNS(ns, 'feMerge');
      const node1 = document.createElementNS(ns, 'feMergeNode');
      node1.setAttribute('in', 'neonGreenGlow');
      const node2 = document.createElementNS(ns, 'feMergeNode');
      node2.setAttribute('in', 'SourceGraphic'); 

      merge.appendChild(node1);
      merge.appendChild(node2);
      filter.appendChild(blur);
      filter.appendChild(colorMatrix);
      filter.appendChild(merge);
      defs.appendChild(filter);
    }

    // 3. Construct the Core Ball Element
    const ball = document.createElementNS(ns, 'circle');
    ball.setAttribute('cx', imgSize.w / 2);
    ball.setAttribute('cy', imgSize.h / 2);
    ball.setAttribute('r', '0'); 
    
    ball.setAttribute('fill', '#d1ff00'); 
    
    ball.setAttribute('filter', `url(#${filterId})`);
    ball.style.opacity = '1';
    
    shardLayer.appendChild(ball);
    ball.getBoundingClientRect(); 
    
    ball.style.transition = 'r 3000ms cubic-bezier(0.4, 0, 0.2, 1)';
    
    requestAnimationFrame(() => {
      const maxGrownRadius = Math.min(imgSize.w, imgSize.h) * 0.77;
      ball.setAttribute('r', maxGrownRadius);
    });
    
    setTimeout(() => {
      if (ball.parentNode) ball.parentNode.removeChild(ball);
      if (onComplete) onComplete();
    }, 1250);
  }

  function triggerBlackHole() {
    triggerSwirlRings();

    const wrapper = document.getElementById('shardWrapper');
    if (wrapper) {
      wrapper.style.transition = 'transform 3000ms cubic-bezier(0.5, 0, 0.2, 1)';
      wrapper.style.transform = 'rotate(-540deg)';
    }

    shards.forEach((node, index) => {
      setTimeout(() => {
        node.style.transition = 'transform 1200ms cubic-bezier(0.5, 0, 0.2, 1), opacity 1000ms ease-in';
        const spin = 1080 + (Math.random() * 360);
        node.style.transform = `translate(0px, 0px) rotate(${spin}deg) scale(0)`;
        node.style.opacity = '0';
      }, index * 4); 
    });
  }

  function triggerFlash(onComplete) {
    const ns = 'http://www.w3.org/2000/svg';
    const flash = document.createElementNS(ns, 'circle');
    
    flash.setAttribute('cx', imgSize.w / 2);
    flash.setAttribute('cy', imgSize.h / 2);
    flash.setAttribute('r', '0');
    flash.setAttribute('fill', '#ffffff');
    
    flash.style.filter = 'drop-shadow(0px 0px 20px rgba(255, 255, 255, 0.8))';
    flash.style.opacity = '1';
    
    shardLayer.appendChild(flash);
    flash.getBoundingClientRect();
    
    const maxRadius = Math.max(imgSize.w, imgSize.h) * 1.5;
    flash.style.transition = 'r 1500ms cubic-bezier(0.1, 0.8, 0.3, 1), opacity 3000ms ease-in';
    
    requestAnimationFrame(() => {
      flash.setAttribute('r', maxRadius);
      flash.style.opacity = '0';
    });
    
    setTimeout(() => {
      if (onComplete) onComplete();
    }, 350);
    
    setTimeout(() => {
      if (flash.parentNode) flash.parentNode.removeChild(flash);
    }, 700);
  }

  function triggerRewardSpotlight() {
    const ns = 'http://www.w3.org/2000/svg';
    const spotlightGroup = document.createElementNS(ns, 'g');
    spotlightGroup.id = 'rewardSpotlight';
    
    const spotSize = Math.min(imgSize.w, imgSize.h) * 2; 
    const iconSize = Math.min(imgSize.w, imgSize.h) * 1.2; 
    const centerX = imgSize.w / 2;
    const centerY = imgSize.h / 2;

    // 1. Grab or create standard defs pool for the premium item glow filter
    let defs = shardLayer.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS(ns, 'defs');
      shardLayer.appendChild(defs);
    }

    // 2. Build the unique high-intensity ITEM GLOW filter blueprint
    const itemFilterId = 'rewardItemGlow';
    if (!document.getElementById(itemFilterId)) {
      const filter = document.createElementNS(ns, 'filter');
      filter.setAttribute('id', itemFilterId);
      filter.setAttribute('x', '-50%');
      filter.setAttribute('y', '-50%');
      filter.setAttribute('width', '200%');
      filter.setAttribute('height', '200%');

      const blur = document.createElementNS(ns, 'feGaussianBlur');
      blur.setAttribute('stdDeviation', '100'); 
      blur.setAttribute('result', 'blurOut');

      const colorMatrix = document.createElementNS(ns, 'feColorMatrix');
      colorMatrix.setAttribute('type', 'matrix');
      // Vibrant gold channel configuration rules
      colorMatrix.setAttribute('values', `
        1 0 0 0 1.23 
        0 1 0 0 2 
        0 0 1 0 0.00  
        0 0 0 1 0
      `);
      colorMatrix.setAttribute('result', 'coloredGlow');

      const merge = document.createElementNS(ns, 'feMerge');
      const node1 = document.createElementNS(ns, 'feMergeNode');
      node1.setAttribute('in', 'coloredGlow');
      const node2 = document.createElementNS(ns, 'feMergeNode');
      node2.setAttribute('in', 'SourceGraphic'); 

      merge.appendChild(node1);
      merge.appendChild(node2);
      filter.appendChild(blur);
      filter.appendChild(colorMatrix);
      filter.appendChild(merge);
      defs.appendChild(filter);
    }

    // 3. Structural Backdrop Image Layer
    const backdropImg = document.createElementNS(ns, 'image');
    backdropImg.setAttributeNS('http://www.w3.org/1999/xlink', 'href', 'vuurwerkshow.gif');
    backdropImg.setAttribute('width', spotSize);
    backdropImg.setAttribute('height', spotSize);
    backdropImg.setAttribute('x', centerX - (spotSize / 2));
    backdropImg.setAttribute('y', centerY - (spotSize / 2));
    backdropImg.style.filter = 'drop-shadow(0px 0px 25px rgba(255, 255, 255, 0.85))';
    
    // 4. Foreground Reward Gift layer (with our custom glow filter blueprint applied)
    const rewardImg = document.createElementNS(ns, 'image');
    rewardImg.setAttributeNS('http://www.w3.org/1999/xlink', 'href', 'tennagif.gif');
    rewardImg.setAttribute('width', iconSize);
    rewardImg.setAttribute('height', iconSize);
    rewardImg.setAttribute('x', centerX - (iconSize / 2));
    rewardImg.setAttribute('y', centerY - (iconSize * 0.55)); 
    
    // Hook up our newly created gold glow filter
    rewardImg.setAttribute('filter', `url(#${itemFilterId})`);

    // 5. Text Label Layer
    const text = document.createElementNS(ns, 'text');
    text.setAttribute('x', centerX);
    text.setAttribute('y', centerY + (iconSize * 0.55));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('fill', '#ffffff');
    text.style.fontFamily = "'Grandia', system-ui, sans-serif";
    text.style.fontWeight = '900';
    text.style.fontSize = `${Math.min(imgSize.w, imgSize.h) * 0.07}px`;
    text.style.letterSpacing = '2px';
    text.textContent = 'Je cadeau is onderweg !';
    text.style.filter = 'drop-shadow(0px 0px 8px rgba(255, 255, 255, 0.6))';

    spotlightGroup.appendChild(backdropImg); 
    spotlightGroup.appendChild(rewardImg); 
    text.style.pointerEvents = 'none'; // Ensure text elements maintain transparent pointer safety overlays
    spotlightGroup.appendChild(text);
    
    spotlightGroup.style.opacity = '0';
    spotlightGroup.style.transformOrigin = `${imgSize.w / 2}px ${imgSize.h / 2}px`;
    spotlightGroup.style.transform = 'scale(0.65)';
    
    shardLayer.appendChild(spotlightGroup);
    spotlightGroup.getBoundingClientRect(); 
    
    spotlightGroup.style.transition = 'transform 3000ms cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 500ms ease-out';
    
    requestAnimationFrame(() => {
      spotlightGroup.style.opacity = '1';
      spotlightGroup.style.transform = 'scale(1)';
    });

    setTimeout(() => {
      if (typeof gifshot === 'undefined') {
        console.warn("GIFShot library not detected.");
        return;
      }

      const svgString = new XMLSerializer().serializeToString(shardLayer);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const URL = window.URL || window.webkitURL || window;
      const blobURL = URL.createObjectURL(svgBlob);
      
      const captureCanvas = document.createElement('canvas');
      captureCanvas.width = imgSize.w;
      captureCanvas.height = imgSize.h;
      const ctx = captureCanvas.getContext('2d');
      
      const renderVehicle = new Image();
      renderVehicle.onload = function() {
        ctx.clearRect(0, 0, imgSize.w, imgSize.h);
        ctx.drawImage(renderVehicle, 0, 0);
        const dataFrameUrl = captureCanvas.toDataURL('image/png');
        
        gifshot.createGIF({
          gifWidth: imgSize.w,
          gifHeight: imgSize.h,
          transparent: 'rgba(0,0,0,0)', 
          images: [dataFrameUrl],
          interval: 0.1
        }, function (obj) {
          if (!obj.error) {
            console.log("%c Transparent Reward GIF Ready!", "color: #00ff66; font-weight: bold; font-size: 14px;");
            console.log("Copy-paste this base64 link into a new browser tab to download your gif:", obj.image);
          }
          URL.revokeObjectURL(blobURL);
        });
      };
      renderVehicle.src = blobURL;
    }, 800); 
  }

  function resetShards() {
    shardLayer.innerHTML = '';
    shards = [];
    crackLayer.innerHTML = '';
  }

  function replayShards() {
    if (!shards.length) return;
    
    const wrapper = document.getElementById('shardWrapper');
    if (wrapper) {
      wrapper.style.transition = 'none';
      wrapper.style.transform = 'rotate(0deg)';
    }

    shards.forEach(n => {
      n.style.transition = 'none';
      n.style.transform = 'translate(0,0) rotate(0deg) scale(1)';
      n.style.opacity = '0';
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(animateShards);
    });
  }

  function shatter() {
    createShards();
    crackLayer.innerHTML = '';
    img.style.visibility = 'hidden';
    
    requestAnimationFrame(() => {
      animateShards();
      
      setTimeout(() => {
        triggerBlackHole();
        
        triggerDynamicGreenBall(() => {
          triggerFlash(() => {
            triggerRewardSpotlight();
          });
        });
        
      }, 1000);
    });
  }

  function handlePointer(e) {
    const rect = img.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * imgSize.w;
    const y = ((e.clientY - rect.top) / rect.height) * imgSize.h;

    clicks = Math.min(MAX_CLICKS, clicks + 1);
    updateProgress();

    if (clicks < MAX_CLICKS) {
      drawCrack(x, y);
    } else {
      shatter();
      stage.removeEventListener('pointerdown', handlePointer);
    }
  }

  if (img.complete) {
    syncOverlaySize();
  } else {
    img.addEventListener('load', syncOverlaySize);
  }

  window.addEventListener('resize', syncOverlaySize);
  stage.addEventListener('pointerdown', handlePointer);
});