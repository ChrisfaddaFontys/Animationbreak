// Basic config
const MAX_CLICKS = 4;

// Programmatically generate high-density, interlocking organic micro-shards (10x20 grid with jittered vertices)
const SHARD_TEMPLATES = (() => {
  const templates = [];
  const cols = 5;
  const rows = 20;
  const jitterFactor = 0.2; // Controls how jagged/organic the shard shapes are

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
        points[r][c + 1],     // Top-Right
        points[r + 1][c + 1],   // Bottom-Right
        points[r + 1][c]      // Bottom-Left
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
  // Audio for hammer taps and final cinematic hit
  const tapSounds = [
    new Audio('glas crack 2.mp3'),
    new Audio('glas crack 3.mp3')
  ];
  tapSounds.forEach(s => { s.preload = 'auto'; s.volume = 0.85; });
  const finalHit = new Audio('lordsonny-glass-cinematic-hit-161212.mp3');
  finalHit.preload = 'auto'; finalHit.volume = 1.0;
  const warningScreen = document.getElementById('warning-screen');
  const warningContinue = document.getElementById('warning-continue');
  const ftbOverlay = document.getElementById('ftb-overlay');

  let clicks = 0;
  let shards = [];
  let imgSize = { w: 0, h: 0 };
  let experienceActive = false;
  let warningDismissed = false;

  let persistentGlitch = null;

  function hideWarningScreen() {
    if (warningDismissed) return;
    warningDismissed = true;

    document.body.classList.add('warning-dismissed');
    if (warningScreen) {
      warningScreen.classList.add('is-hiding');
      warningScreen.classList.remove('is-visible');
    }

    if (ftbOverlay) {
      ftbOverlay.classList.add('is-clear');
      setTimeout(() => {
        ftbOverlay.style.display = 'none';
      }, 320);
    }

    window.removeEventListener('keydown', handleWarningDismiss);
    if (warningContinue) {
      warningContinue.removeEventListener('click', hideWarningScreen);
    }

    enableExperience();
  }

  function handleWarningDismiss() {
    hideWarningScreen();
  }

  function enableExperience() {
    if (experienceActive) return;
    experienceActive = true;
    document.body.classList.remove('warning-active');
    if (stage) stage.addEventListener('pointerdown', handlePointer);
  }

  function showWarningScreen() {
    document.body.classList.add('warning-active');
    if (warningScreen) {
      warningScreen.classList.add('is-visible');
      warningScreen.classList.remove('is-hiding');
    }

    if (warningContinue) {
      warningContinue.addEventListener('click', hideWarningScreen);
      warningContinue.focus({ preventScroll: true });
    }

    window.addEventListener('keydown', handleWarningDismiss, { once: true });
  }

  function placePersistentGlitch(e) {
    const container = stage || document.body;
    const rect = container.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;

    if (persistentGlitch && persistentGlitch.parentNode) return;

    const g = document.createElement('img');
    g.src = 'GlitchEffect.png';
    g.style.position = 'absolute';
    g.style.left = `${cursorX}px`;
    g.style.top = `${cursorY}px`;
    g.style.transform = 'translate(-50%, -50%)';
    g.style.pointerEvents = 'none';
    g.style.zIndex = 9999;

    container.appendChild(g);
    persistentGlitch = g;

    g.onload = () => {
      const gh = g.naturalHeight || g.height;
      const gw = g.naturalWidth || g.width;
      let top = cursorY - gh / 2;
      let left = cursorX - gw / 2;
      top = Math.max(0, Math.min(top, rect.height - gh));
      left = Math.max(0, Math.min(left, rect.width - gw));
      g.style.top = `${top}px`;
      g.style.left = `${left + (gw / 2)}px`;
      g.style.transform = 'translateX(-50%)';
    };
  }

  function removePersistentGlitch() {
    if (persistentGlitch && persistentGlitch.parentNode) {
      persistentGlitch.parentNode.removeChild(persistentGlitch);
    }
    persistentGlitch = null;
  }

  // Plaatst een afbeelding op de exacte coördinaten van de laatste klik
  function placeFinalImage(e) {
    const container = stage || document.body;
    const rect = container.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;

    const finalImg = document.createElement('img');
    finalImg.src = 'crackedglass3.png'; // Pas deze bestandsnaam aan naar jouw afbeelding!
    finalImg.style.position = 'absolute';
    finalImg.style.left = `${cursorX}px`;
    finalImg.style.top = `${cursorY}px`;
    
    // Begin klein met scale(0) voor het zoom-effect
    finalImg.style.transformOrigin = 'center center'; // Zorgt dat de zoom exact vanuit het middelpunt start
    finalImg.style.transform = 'translate(-50%, -50%) scale(0)'; 
    // Voeg de zoom-in animatie (transitie) toe
    finalImg.style.transition = 'transform 1000ms cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    finalImg.style.pointerEvents = 'none';
    finalImg.style.zIndex = 4; // Plaats hem boven de shardLayer (z-index 3)

    // Pas de grootte hier aan. Je kunt pixels ('300px'), of view width ('30vw') gebruiken.
    finalImg.style.width = '1000px';

    container.appendChild(finalImg);

    // Activeer de animatie zodra de afbeelding in de DOM is geladen
    requestAnimationFrame(() => {
      finalImg.style.transform = 'translate(-50%, -50%) scale(1)';

      // Blijf na de snelle 'pop' langzaam verder inzoomen naar het middelpunt
      setTimeout(() => {
        finalImg.style.transition = 'transform 4s ease-in'; // 4 seconden lang inzoomen
        finalImg.style.transform = 'translate(-50%, -50%) scale(15)'; // Zoom veel dieper in (pas getal aan naar wens)
      }, 900); // Wacht tot de eerste animatie (300ms) klaar is
    });
  }

  function spawnClickSparks(e) {
    const container = stage || document.body;
    const rect = container.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    ['spark STICKER.gif', 'SparkingGif.gif'].forEach((src, idx) => {
      const s = document.createElement('img');
      s.src = src;
      s.style.position = 'absolute';
      s.style.left = `${cx}px`;
      s.style.top = `${cy}px`;
      s.style.transform = 'translate(-50%, -50%)';
      s.style.pointerEvents = 'none';
      s.style.zIndex = 10000 + idx;
      s.style.willChange = 'opacity, transform';
      container.appendChild(s);

      setTimeout(() => {
        if (s.parentNode) s.parentNode.removeChild(s);
      }, 900);
    });
  }

  function triggerFullScreenFlash() {
    const container = stage || document.body;
    const rect = container.getBoundingClientRect();
    const flash = document.createElement('div');
    flash.style.position = 'absolute';
    flash.style.left = '0';
    flash.style.top = '0';
    flash.style.width = rect.width + 'px';
    flash.style.height = rect.height + 'px';
    flash.style.background = '#fff';
    flash.style.opacity = '0';
    flash.style.pointerEvents = 'none';
    flash.style.zIndex = 2147483647;
    flash.style.transition = 'opacity 200ms ease-out';
    container.appendChild(flash);

    requestAnimationFrame(() => {
      flash.style.opacity = '0.9';
      setTimeout(() => {
        flash.style.opacity = '0';
        setTimeout(() => { if (flash.parentNode) flash.parentNode.removeChild(flash); }, 220);
      }, 60);
    });
  }

  // Speciale, intensere flash specifiek voor de laatste klik (breek moment)
  function triggerFinalFlash() {
    const container = stage || document.body;
    const rect = container.getBoundingClientRect();
    const flash = document.createElement('div');
    flash.style.position = 'absolute';
    flash.style.left = '0';
    flash.style.top = '0';
    flash.style.width = rect.width + 'px';
    flash.style.height = rect.height + 'px';
    flash.style.background = '#fff';
    flash.style.opacity = '1'; // Begint direct volledig wit
    flash.style.pointerEvents = 'none';
    flash.style.zIndex = 2147483647; // Helemaal bovenaan
    flash.style.transition = 'opacity 2000ms ease-out'; // Nog langzamere fade-out (2 seconden)
    container.appendChild(flash);

    requestAnimationFrame(() => {
      setTimeout(() => {
        flash.style.opacity = '0';
        setTimeout(() => { if (flash.parentNode) flash.parentNode.removeChild(flash); }, 2200); // Verwijder nadat de transitie klaar is
      }, 200); // Blijft iets langer (200ms) op volle sterkte fel wit staan
    });
  }


  // Background images (cycle through these)
  const backgroundImages = ['Visual update 1.png', '1Click.png', '2Clicks.png', '3Clicks.png',];
  let clickIndex = 0; // start at NoClick

  function syncOverlaySize() {
    const rect = img.getBoundingClientRect();
    imgSize.w = img.naturalWidth || rect.width;
    imgSize.h = img.naturalHeight || rect.height;

    if (crackLayer) {
      crackLayer.setAttribute('viewBox', `0 0 ${imgSize.w} ${imgSize.h}`);
      crackLayer.setAttribute('width', img.clientWidth);
      crackLayer.setAttribute('height', img.clientHeight);
      crackLayer.style.width = img.clientWidth + 'px';
      crackLayer.style.height = img.clientHeight + 'px';
    }

    if (shardLayer) {
      shardLayer.setAttribute('viewBox', `0 0 ${imgSize.w} ${imgSize.h}`);
      shardLayer.setAttribute('width', img.clientWidth);
      shardLayer.setAttribute('height', img.clientHeight);
      shardLayer.style.width = img.clientWidth + 'px';
      shardLayer.style.height = img.clientHeight + 'px';
    }

    if (crackLayer) {
      crackLayer.setAttribute('overflow', 'hidden');
      crackLayer.style.overflow = 'hidden';
      crackLayer.style.position = 'absolute';
      crackLayer.style.left = shardLayer.style.left = '0';
      crackLayer.style.top = shardLayer.style.top = '0';
      crackLayer.style.pointerEvents = shardLayer.style.pointerEvents = 'none';
    }

    if (shardLayer) {
      shardLayer.setAttribute('overflow', 'visible');
      shardLayer.style.overflow = 'visible';
      shardLayer.style.position = 'absolute';
    }
  }

  function updateProgress() {
    const pct = Math.min(100, (clicks / MAX_CLICKS) * 100);
    if (progressFill) progressFill.style.width = pct + '%';
  }

  function createShards() {
    const ns = 'http://www.w3.org/2000/svg';
    if (!shardLayer) return;
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
      node.style.opacity = '0'; // Verbergt de shards zodat de focus op de inzoomende barst ligt
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

    const maxR = Math.max(imgSize.w, imgSize.h) * 1;

    for (let i = 0; i < 4; i++) {
      const ring = document.createElementNS(ns, 'circle');
      ring.setAttribute('cx', imgSize.w / 2);
      ring.setAttribute('cy', imgSize.h / 2);
      ring.setAttribute('r', maxR * (0.25 + (i * 0.2)));
      ring.setAttribute('fill', 'none');
      ring.setAttribute('stroke', '#00ff66');
      ring.setAttribute('stroke-width', 3 - (i * 0.5));
      ring.setAttribute('stroke-dasharray', `${15 + i * 20} ${15 + i * 10}`);
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
    }, 400);
  }

  function triggerDynamicGreenBall(onComplete) {
    const ns = 'http://www.w3.org/2000/svg';
    let defs = shardLayer.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS(ns, 'defs');
      shardLayer.appendChild(defs);
    }

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
      wrapper.style.transition = 'transform 5000ms cubic-bezier(0.5, 0, 0.2, 1)';
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

    const spotSize = Math.min(imgSize.w, imgSize.h) * 3.5;
    const iconSize = Math.min(imgSize.w, imgSize.h) * 0.8;
    const centerX = imgSize.w / 2;
    const centerY = imgSize.h / 2;

    let defs = shardLayer.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS(ns, 'defs');
      shardLayer.appendChild(defs);
    }

    // Maak een SVG radial gradient aan als vervanger voor de swirl.gif
    const gradId = 'rewardSpotlightGradient';
    if (!document.getElementById(gradId)) {
      const radialGrad = document.createElementNS(ns, 'radialGradient');
      radialGrad.setAttribute('id', gradId);
      radialGrad.setAttribute('cx', '50%');
      radialGrad.setAttribute('cy', '50%');
      radialGrad.setAttribute('r', '50%');

      const stop1 = document.createElementNS(ns, 'stop');
      stop1.setAttribute('offset', '0%');
      stop1.setAttribute('stop-color', '#a6ff00'); // Binnenste kleur (nu wit, pas aan naar wens)

      const stopMiddle = document.createElementNS(ns, 'stop');
      stopMiddle.setAttribute('offset', '33%');
      stopMiddle.setAttribute('stop-color', '#d1ff00'); // Tweede kleur

      const stopMiddle2 = document.createElementNS(ns, 'stop');
      stopMiddle2.setAttribute('offset', '66%');
      stopMiddle2.setAttribute('stop-color', '#d0ff007f'); // Derde (nieuwe) overgangskleur

      const stop2 = document.createElementNS(ns, 'stop');
      stop2.setAttribute('offset', '100%');
      stop2.setAttribute('stop-color', '#d0ff0007'); // Buitenste rand (transparant)

      // Animatie voor de X-positie (lichtpunt beweegt naar links en rechts)
      const animFx = document.createElementNS(ns, 'animate');
      animFx.setAttribute('attributeName', 'fx');
      animFx.setAttribute('values', '40%; 60%; 40%');
      animFx.setAttribute('dur', '8s');
      animFx.setAttribute('repeatCount', 'indefinite');

      // Animatie voor de Y-positie (lichtpunt beweegt op en neer)
      const animFy = document.createElementNS(ns, 'animate');
      animFy.setAttribute('attributeName', 'fy');
      animFy.setAttribute('values', '40%; 60%; 40%');
      animFy.setAttribute('dur', '5.5s'); // Iets andere tijdsduur voor een organisch en onregelmatig patroon
      animFy.setAttribute('repeatCount', 'indefinite');

      // Animatie voor de grootte (radius) zodat de gloed lichtjes pulseert / ademt
      const animR = document.createElementNS(ns, 'animate');
      animR.setAttribute('attributeName', 'r');
      animR.setAttribute('values', '25%; 40%; 25%'); // Verlaag de percentages hier om de hele gradient kleiner te maken
      animR.setAttribute('dur', '3s');
      animR.setAttribute('repeatCount', 'indefinite');

      radialGrad.appendChild(animFx);
      radialGrad.appendChild(animFy);
      radialGrad.appendChild(animR);

      radialGrad.appendChild(stop1);
      radialGrad.appendChild(stopMiddle);
      radialGrad.appendChild(stopMiddle2);
      radialGrad.appendChild(stop2);
      defs.appendChild(radialGrad);
    }

    const backdropImg = document.createElementNS(ns, 'circle');
    backdropImg.setAttribute('cx', centerX);
    backdropImg.setAttribute('cy', centerY);
    backdropImg.setAttribute('r', spotSize / 2);
    backdropImg.setAttribute('fill', `url(#${gradId})`);
    backdropImg.style.filter = 'drop-shadow(0px 0px 25px rgba(255, 255, 255, 0.85))';

    // Voeg een GIF toe achter het 3D-model, maar voor de gradient
    const gifBackground = document.createElementNS(ns, 'image');
    gifBackground.setAttributeNS('http://www.w3.org/1999/xlink', 'href', 'sparky.gif'); // Pas de bestandsnaam aan naar jouw GIF!
    const gifSize = iconSize * 0.8; // Pas '1.5' aan om de GIF groter of kleiner te maken ten opzichte van het 3D model
    gifBackground.setAttribute('x', centerX - (gifSize / 2));
    gifBackground.setAttribute('y', centerY - (gifSize / 1.5));
    gifBackground.setAttribute('width', gifSize);
    gifBackground.setAttribute('height', gifSize);
    gifBackground.style.pointerEvents = 'none'; // Voorkomt dat de GIF muisinteracties voor het 3D-model blokkeert

    // --- GEWIJZIGDE CODE VOOR HET GLB MODEL ---
    const foreignObject = document.createElementNS(ns, 'foreignObject');
    foreignObject.setAttribute('x', centerX - (iconSize / 2));
    foreignObject.setAttribute('y', centerY - (iconSize * 0.55));
    foreignObject.setAttribute('width', iconSize);
    foreignObject.setAttribute('height', iconSize);

    const modelContainer = document.createElement('div');
    modelContainer.style.width = '100%';
    modelContainer.style.height = '100%';

    // VERVANG "pad/naar/jouw-model.glb" MET JE EIGEN BESTAND / URL
    modelContainer.innerHTML = `
      <model-viewer 
        src="Actie_Figuur.glb" 
        auto-rotate 
        rotation-per-second="20deg"
        camera-controls 
        disable-zoom
        interaction-prompt="none"
        environment-image="neutral"
        style="width: 100%; height: 100%; background-color: transparent; outline: none;">
        <div slot="progress-bar"></div>
      </model-viewer>
    `;
    foreignObject.appendChild(modelContainer);
    // ------------------------------------------

    const text = document.createElementNS(ns, 'text');
    text.setAttribute('x', centerX);
    text.setAttribute('y', centerY + (iconSize * 0.50));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('fill', '#160606');
    text.style.fontFamily = "'Grandia', system-ui, sans-serif";
    text.style.fontWeight = '900';
    text.style.fontSize = `${Math.min(imgSize.w, imgSize.h) * 0.07}px`;
    text.style.letterSpacing = '5px';
    text.textContent = 'Je cadeau is onderweg !';
    text.style.filter = 'drop-shadow(0px 0px 8px rgb(17, 14, 14))';

    spotlightGroup.appendChild(backdropImg);
    spotlightGroup.appendChild(gifBackground); // Plaats de GIF tussen de backdrop en het 3D model in
    spotlightGroup.appendChild(foreignObject);
    text.style.pointerEvents = 'none';
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
      renderVehicle.onload = function () {
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
    if (shardLayer) shardLayer.innerHTML = '';
    shards = [];
    if (crackLayer) crackLayer.innerHTML = '';
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
    if (crackLayer) crackLayer.innerHTML = '';
    img.style.visibility = 'hidden';

    requestAnimationFrame(() => {
      animateShards();

      // Start de Swirl Rings en het Black Hole effect tegelijkertijd tijdens de inzoom-animatie
      setTimeout(() => {
        triggerSwirlRings();
        triggerBlackHole(); // Speel het black hole effect af

        // Maak de shards direct weer zichtbaar, zodat we ze daadwerkelijk de black hole in zien vliegen
        shards.forEach(node => {
          node.style.transition = 'none'; // Voorkom oude transities
          
          // Bepaal een willekeurige positie ver buiten het scherm (in een grote cirkel rond het midden)
          const angle = Math.random() * Math.PI * 2;
          const distance = Math.max(imgSize.w, imgSize.h) * 1.5; // Ruim buiten beeld
          const startX = Math.cos(angle) * distance;
          const startY = Math.sin(angle) * distance;
          
          // Vergroot de scale (bijv. scale(3) of scale(5)) om de scherven veel groter in beeld te laten komen
          node.style.transform = `translate(${startX}px, ${startY}px) rotate(${Math.random() * 360}deg) scale(2.5)`;
          node.style.opacity = '1';
          
          node.getBoundingClientRect(); // Forceer een 'reflow' zodat de browser deze nieuwe startpositie direct registreert
        });

        // Activeer de dynamische groene bal en toon daarna de flits en beloning
        triggerDynamicGreenBall(() => {
          triggerFlash(() => {
            triggerRewardSpotlight();
          });
        });
      }, 3300); // Nu speelt dit alles af op 2000ms (halverwege de zoom)
    });
  }

  function swapBackgroundInstant(url) {
    const pre = new Image();
    function apply() {
      img.style.transition = 'none';
      img.src = url;
      if (img.complete) syncOverlaySize();
      img.addEventListener('load', function onLoad() {
        img.removeEventListener('load', onLoad);
        syncOverlaySize();
      });
    }
    pre.onload = apply;
    pre.src = url;
    if (pre.complete) apply();
  }

  function handlePointer(e) {
    if (!experienceActive) return;

    // Calculate pointer coordinates (kept for potential later use)
    const rect = img.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * imgSize.w;
    const y = ((e.clientY - rect.top) / rect.height) * imgSize.h;

    clicks = Math.min(MAX_CLICKS, clicks + 1);
    updateProgress();

    // play hammer tap sound for non-final clicks (only if experience is active and stage is clicked)
    if (clickIndex < backgroundImages.length - 1) {
      try {
        const snd = tapSounds[clickIndex % tapSounds.length];
        snd.currentTime = 0;
        snd.play();
      } catch (err) {
        // autoplay or play errors are ignored
      }
    }

    spawnClickSparks(e);
    triggerFullScreenFlash();

    // Cycle backgrounds until last image is visible.
    if (clickIndex < backgroundImages.length - 1) {
      clickIndex += 1;
      swapBackgroundInstant(backgroundImages[clickIndex]);

      placePersistentGlitch(e);
      if (clickIndex === backgroundImages.length - 1) {
        removePersistentGlitch();
      }

      return;
    }

    // If the final background is already visible and user clicks, remove glitch then shatter.
    removePersistentGlitch();

    // Play cinematic final hit (before final visuals)
    try {
      finalHit.currentTime = 0;
      finalHit.play();
    } catch (err) {
      // ignore
    }

    placeFinalImage(e); // Plaats de afbeelding exact op de klik
    triggerFinalFlash(); // Voeg de speciale extra witte flits toe

    shatter();
    stage.removeEventListener('pointerdown', handlePointer);
  }

  // Ensure initial background is set
  if (img) {
    img.src = backgroundImages[clickIndex];
  }

  if (img.complete) {
    syncOverlaySize();
  } else {
    img.addEventListener('load', syncOverlaySize);
  }

  window.addEventListener('resize', syncOverlaySize);
  showWarningScreen();
});