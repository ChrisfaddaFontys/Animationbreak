// Basic config
const MAX_CLICKS = 3;
const SHARD_TEMPLATES = [
  [[0,0],[0.2,0.025],[0.15,0.45],[0,0.5]],
  [[0.2,0.025],[0.4,0.05],[0.3,0.4],[0.15,0.45]],
  [[0.4,0.05],[0.55,0.035],[0.725,0.265],[0.6,0.35],[0.3,0.4]],
  [[0.55,0.035],[0.7,0.02],[0.85,0.18],[0.725,0.265]],
  [[0.85,0.18],[0.915,0.215],[0.795,0.475],[0.6,0.35]],
  [[0.915,0.215],[0.98,0.25],[0.99,0.6],[0.795,0.475]],
  [[0,0.5],[0.15,0.45],[0.365,0.65],[0.23,0.78]],
  [[0.15,0.45],[0.3,0.4],[0.5,0.52],[0.365,0.65]],
  [[0.23,0.78],[0.365,0.65],[0.465,0.95],[0.28,0.98]],
  [[0.365,0.65],[0.5,0.52],[0.65,0.92],[0.465,0.95]],
  [[0.65,0.92],[0.775,0.87],[0.63,0.98],[0.28,0.98]],
  [[0.775,0.87],[0.9,0.82],[0.98,0.98],[0.63,0.98]],
  [[0.5,0.52],[0.55,0.435],[0.885,0.575],[0.78,0.55]],
  [[0.55,0.435],[0.6,0.35],[0.99,0.6],[0.885,0.575]],
  [[0.6,0.35],[0.69,0.45],[0.875,0.29],[0.85,0.18]],
  [[0.69,0.45],[0.78,0.55],[0.9,0.4],[0.875,0.29]],
  [[0.3,0.4],[0.4,0.3],[0.6,0.35]],
  [[0.4,0.3],[0.5,0.2],[0.6,0.35]],
  [[0.5,0.2],[0.6,0.16],[0.85,0.18]],
  [[0.6,0.16],[0.7,0.12],[0.85,0.18]],
  [[0.5,0.52],[0.5,0.36],[0.3,0.4]],
  [[0.5,0.36],[0.5,0.2],[0.3,0.4]],
  [[0.28,0.98],[0.39,0.75],[0.65,0.92]],
  [[0.39,0.75],[0.5,0.52],[0.65,0.92]]
];

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
    crackLayer.style.pointerEvents = shadowLayer.style.pointerEvents = 'none'; // text styling safety override
    shardLayer.style.pointerEvents = 'none';
  }

  function updateProgress() {
    const pct = Math.min(100, (clicks / MAX_CLICKS) * 100);
    if(progressFill) progressFill.style.width = pct + '%';
  }

  function drawCrack(x, y) {
    const ns = 'http://www.w3.org/2000/svg';
    const branches = 4 + Math.floor(Math.random() * 3); 
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

      crackLayer.appendChild(path);

      requestAnimationFrame(() => {
        setTimeout(() => {
          path.style.opacity = 1;
          path.style.strokeDashoffset = 0;
        }, b * 60 + Math.random() * 80);
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

    const INFLATION_BASE = 1.16; 

    SHARD_TEMPLATES.forEach((poly, i) => {
      const id = `clip-${i}-${Date.now()}`;

      let cx = 0, cy = 0;
      poly.forEach(p => { cx += p[0]; cy += p[1]; });
      cx /= poly.length;
      cy /= poly.length;

      const inflation = INFLATION_BASE * (1 + (Math.random() - 0.5) * 0.08);

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
      const tx = (Math.random() - 0.5) * imgSize.w * 0.6;
      const ty = (Math.random() - 0.5) * imgSize.h * 0.6;
      const r = (Math.random() - 0.5) * 70;
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

  function triggerBlackHole() {
    triggerSwirlRings();

    const wrapper = document.getElementById('shardWrapper');
    if (wrapper) {
      wrapper.style.transition = 'transform 1200ms cubic-bezier(0.5, 0, 0.2, 1)';
      wrapper.style.transform = 'rotate(-540deg)';
    }

    shards.forEach((node, index) => {
      setTimeout(() => {
        node.style.transition = 'transform 1200ms cubic-bezier(0.5, 0, 0.2, 1), opacity 1000ms ease-in';
        const spin = 1080 + (Math.random() * 360);
        node.style.transform = `translate(0px, 0px) rotate(${spin}deg) scale(0)`;
        node.style.opacity = '0';
      }, index * 25); 
    });
  }

  function triggerGreenBall(onComplete) {
    const ns = 'http://www.w3.org/2000/svg';
    const ball = document.createElementNS(ns, 'circle');
    
    ball.setAttribute('cx', imgSize.w / 2);
    ball.setAttribute('cy', imgSize.h / 2);
    ball.setAttribute('r', '2'); 
    ball.setAttribute('fill', '#00ff66'); 
    
    ball.style.filter = 'drop-shadow(0px 0px 15px rgba(0, 255, 102, 0.95))';
    ball.style.opacity = '1';
    
    shardLayer.appendChild(ball);
    ball.getBoundingClientRect();
    
    ball.style.transition = 'r 700ms cubic-bezier(0.34, 1.56, 0.64, 1)';
    
    requestAnimationFrame(() => {
      const maxGrownRadius = Math.min(imgSize.w, imgSize.h) * 0.12;
      ball.setAttribute('r', maxGrownRadius);
    });
    
    setTimeout(() => {
      if (ball.parentNode) ball.parentNode.removeChild(ball);
      if (onComplete) onComplete();
    }, 700);
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
    flash.style.transition = 'r 450ms cubic-bezier(0.1, 0.8, 0.3, 1), opacity 650ms ease-in';
    
    requestAnimationFrame(() => {
      flash.setAttribute('r', maxRadius);
      flash.style.opacity = '0';
    });
    
    // Hand over to the spotlight callback mid-fade for a cleaner visual blend
    setTimeout(() => {
      if (onComplete) onComplete();
    }, 350);
    
    setTimeout(() => {
      if (flash.parentNode) flash.parentNode.removeChild(flash);
    }, 700);
  }

  // Phase 3: Reveal the glowing reward area at the epicenter
  function triggerRewardSpotlight() {
    const ns = 'http://www.w3.org/2000/svg';
    const spotlightGroup = document.createElementNS(ns, 'g');
    spotlightGroup.id = 'rewardSpotlight';
    
    // Smooth spotlight ring and fill
    const circle = document.createElementNS(ns, 'circle');
    circle.setAttribute('cx', imgSize.w / 2);
    circle.setAttribute('cy', imgSize.h / 2);
    circle.setAttribute('r', Math.min(imgSize.w, imgSize.h) * 0.22); 
    circle.setAttribute('fill', 'rgba(255, 255, 255, 0.12)'); 
    circle.setAttribute('stroke', '#ffffff');
    circle.setAttribute('stroke-width', '2.5');
    
    // Volumetric glow look
    circle.style.filter = 'drop-shadow(0px 0px 25px rgba(255, 255, 255, 0.85))';
    
    // Anchor placeholder text for rewards display
    const text = document.createElementNS(ns, 'text');
    text.setAttribute('x', imgSize.w / 2);
    text.setAttribute('y', imgSize.h / 2);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('fill', '#ffffff');
    text.style.fontFamily = 'system-ui, sans-serif';
    text.style.fontWeight = '800';
    text.style.fontSize = `${Math.min(imgSize.w, imgSize.h) * 0.045}px`;
    text.style.letterSpacing = '1px';
    text.textContent = 'REWARD UNLOCKED';
    text.style.filter = 'drop-shadow(0px 0px 8px rgba(255, 255, 255, 0.6))';

    spotlightGroup.appendChild(circle);
    spotlightGroup.appendChild(text);
    
    // Prep initial micro-states for elastic pop animation
    spotlightGroup.style.opacity = '0';
    spotlightGroup.style.transformOrigin = `${imgSize.w / 2}px ${imgSize.h / 2}px`;
    spotlightGroup.style.transform = 'scale(0.65)';
    
    shardLayer.appendChild(spotlightGroup);
    spotlightGroup.getBoundingClientRect(); 
    
    // Pop onto screen with a slight elastic overshoot bounce
    spotlightGroup.style.transition = 'transform 650ms cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 500ms ease-out';
    
    requestAnimationFrame(() => {
      spotlightGroup.style.opacity = '1';
      spotlightGroup.style.transform = 'scale(1)';
    });
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
        
        setTimeout(() => {
          triggerGreenBall(() => {
            // Chains down perfectly into the spotlight reveal sequence
            triggerFlash(() => {
              triggerRewardSpotlight();
            });
          });
        }, 1100);
        
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