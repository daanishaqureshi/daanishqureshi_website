import { prefersReducedMotion, initCursorGlow } from './motion.js';

// x/y are percentages of the desktop canvas (.journey-canvas). The canvas is
// a single fixed-height "screen" (see journey.css — no page scroll at
// desktop widths), so nodes are spread left-to-right across x with y
// alternating between a top and bottom band, and cardOffset is a fixed
// pixel offset (from the dot) where the floating info card rests at rest —
// dragging adds to this via a runtime translate, never mutating it.
const NODE_DATA = [
  { id: 'BROWN', title: 'Brown University', subtitle: 'Sc.B. Applied Math-Bio', icon: 'school',
    desc: 'Sc.B. with Honors in Applied Mathematics-Biology and Engineering, studying at the boundary of quantitative methods and biological systems.',
    items: [
      'Sc.B. with Honors in Applied Mathematics-Biology and Engineering (2021-25).',
      'Coursework spanning Numerical Optimization, Fluid Mechanics, Biomaterials, and Biomechanics.',
      'Coursework spanning Deep Learning, Statistical Inference, Computational Molecular Biology, and Accelerated Differential Equations.',
    ],
    x: 8, y: 32, cardOffset: { x: 0, y: -95 } },
  { id: 'NASA', title: 'NASA Space Grant', subtitle: 'Novel Geometric Structure', icon: 'rocket_launch',
    desc: "Invented a novel geometric structure. Used mechanics and statistics to study how it behaves under stress, for NASA's space exploration research.",
    items: [
      'NASA Space Grant Awardee, 2022.',
      'Invented a novel geometric structure to study material behavior under stress.',
      "Supported NASA's space exploration technology research.",
    ],
    x: 22, y: 68, cardOffset: { x: 0, y: 95 },
    link: { href: 'research.html#nasa', label: 'NASA Research →' } },
  { id: 'NVIDIA', title: 'NVIDIA Deep Learning Institute', subtitle: 'Brown University Collaboration', icon: 'memory',
    desc: 'Collaborated with NVIDIA\'s Deep Learning Institute while at Brown, working with Prof. George Em Karniadakis and Dr. Khemraj Shukla on physics-informed modeling.',
    items: ['Developed Physics-Informed Neural Networks (PINNs) for drug-delivery prediction.', 'Built models in PyTorch and JAX for fluid dynamics, biomedicine, and mechanics.', 'Work featured in Brown University News, July 2026.'],
    x: 36, y: 32, cardOffset: { x: 0, y: -95 },
    link: { href: 'research.html#applied-ml', label: 'ML Research →' } },
  { id: 'LITGRAB', title: 'LitGrab (Acquired)', subtitle: 'Co-Founder & Tech Lead', icon: 'token',
    desc: 'Co-Founder and Technical Lead of the first AI-native platform for medical literature synthesis.',
    items: [
      'Built proprietary RAG (Retrieval Augmented Generation) pipeline for peer-reviewed papers.',
      'Managed full-stack development and cloud infrastructure.',
      'Orchestrated a successful acquisition by Impiricus.',
      'Prior venture: co-founded Sehat Systems, an Arabic-language AI medical scribe (family/friends-funded); wound down after validating limited product-market fit.',
    ],
    x: 50, y: 68, cardOffset: { x: 0, y: 95 },
    link: { href: 'leadership.html#litgrab', label: 'Leadership Page →' } },
  { id: 'FIDELITY', title: 'Fidelity Investments', subtitle: 'Data Engineer', icon: 'account_balance',
    desc: 'Data Engineer on the brokerage team, optimizing OLTP trading data pipelines.',
    items: ['Optimized data pipelines for real-time OLTP trading systems.', 'Designed algorithms to improve data purging and operational efficiency.', 'Applied production-scale data engineering practices in a regulated financial environment.'],
    x: 64, y: 32, cardOffset: { x: 0, y: -95 } },
  { id: 'YALE', title: 'Yale PhD', subtitle: 'Computational Biology', icon: 'science',
    desc: 'PhD research at Yale in Computational Biology and Biomedical Informatics, exploring the intersection of AI, healthcare, and biology.',
    items: [
      'PhD student in Computational Biology and Biomedical Informatics at Yale.',
      'Research focus still being determined. Exploring possibilities spanning medical imaging, genomics, and other directions at the intersection of AI and biology.',
      'Building on a foundation in applied mathematics, deep learning, and biomedical research.',
    ],
    x: 78, y: 68, cardOffset: { x: 0, y: 95 }, current: true },
  { id: 'IMPIRICUS', title: 'Impiricus', subtitle: 'VP, AI Engineering', icon: 'groups',
    desc: 'VP of AI Engineering leading mission-critical product development for healthcare enterprises.',
    items: [
      'Lead efforts across predictive modeling of provider behavior, voice-based clinical workflow automation, and intelligent content systems for physician education.',
      'Drive product innovation, operational efficiency, and cross-functional team growth.',
      'Ranked #1 in Deloitte Fast 500 for rapid technical scale.',
    ],
    x: 92, y: 32, cardOffset: { x: 0, y: -95 },
    link: { href: 'leadership.html#impiricus', label: 'Leadership Page →' } },
];

// Runtime-only offsets for the draggable curve control points (one between
// each consecutive node pair, so NODE_DATA.length - 1 of them). Percentage
// units, same space as node x/y. Reset to { dx: 0, dy: 0 } on reload —
// persistence is intentionally not implemented.
const controlPointOffsets = NODE_DATA.slice(0, -1).map(() => ({ dx: 0, dy: 0 }));

function defaultControlPointPos(i) {
  const a = NODE_DATA[i];
  const b = NODE_DATA[i + 1];
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function controlPointPos(i) {
  const base = defaultControlPointPos(i);
  const off = controlPointOffsets[i];
  return { x: base.x + off.dx, y: base.y + off.dy };
}

const VIEWBOX_W = 1000;
const VIEWBOX_H = 2000;
const GLIDE_FRICTION = 0.92;
const GLIDE_STOP_THRESHOLD = 0.05;
const CLICK_DISTANCE_THRESHOLD = 6;
const CLICK_TIME_THRESHOLD = 300;

// ---------- Detail modal ----------

function renderPanel(node) {
  const panel = document.getElementById('journey-panel');
  const backdrop = document.getElementById('journey-backdrop');
  panel.querySelector('.journey-panel__title').textContent = node.title;
  panel.querySelector('.journey-panel__desc').textContent = node.desc;
  const list = panel.querySelector('.journey-panel__items');
  list.innerHTML = '';
  node.items.forEach(item => {
    const li = document.createElement('li');
    li.className = 'journey-panel__item';
    li.textContent = item;
    list.appendChild(li);
  });

  const footer = panel.querySelector('.journey-panel__footer');
  let linkBtn = footer.querySelector('.journey-panel__link-btn');
  if (node.link) {
    if (!linkBtn) {
      linkBtn = document.createElement('a');
      linkBtn.className = 'btn btn--ghost journey-panel__link-btn';
      footer.appendChild(linkBtn);
    }
    linkBtn.href = node.link.href;
    linkBtn.textContent = node.link.label;
    footer.style.display = '';
  } else {
    footer.style.display = 'none';
  }

  panel.classList.add('is-open');
  panel.setAttribute('aria-hidden', 'false');
  panel.removeAttribute('inert');
  backdrop.classList.add('is-open');
  backdrop.setAttribute('aria-hidden', 'false');
  backdrop.removeAttribute('inert');

  flashBoot(panel, node);
}

// Small joke: type out a fake "cat <file>.txt" terminal line before the
// real content settles in, like the panel is loading a file. Runs even
// under reduced motion (just skips the character-by-character typing and
// shows the full line immediately) since it's a brief, harmless flourish
// rather than continuous motion.
function flashBoot(panel, node) {
  const boot = panel.querySelector('.journey-panel__boot');
  if (!boot) return;
  const text = `> cat ${node.id.toLowerCase()}.txt`;
  boot.classList.add('is-active');

  if (prefersReducedMotion()) {
    boot.textContent = text;
    setTimeout(() => boot.classList.remove('is-active'), 1000);
    return;
  }

  // Typing + hold totals ~1s regardless of filename length: shorter
  // filenames (e.g. "cat yale.txt") type a bit slower, longer ones
  // (e.g. "cat impiricus.txt") type a bit faster, so every node feels
  // the same duration.
  const charDelay = 700 / text.length;
  let i = 0;
  function typeStep() {
    boot.textContent = text.slice(0, i + 1);
    i++;
    if (i < text.length) {
      setTimeout(typeStep, charDelay);
    } else {
      setTimeout(() => boot.classList.remove('is-active'), 300);
    }
  }
  typeStep();
}

function closePanel() {
  const panel = document.getElementById('journey-panel');
  const backdrop = document.getElementById('journey-backdrop');
  panel.classList.remove('is-open');
  panel.setAttribute('aria-hidden', 'true');
  panel.setAttribute('inert', '');
  backdrop.classList.remove('is-open');
  backdrop.setAttribute('aria-hidden', 'true');
  backdrop.setAttribute('inert', '');
}

// ---------- Path generation (Catmull-Rom -> cubic Bezier) ----------

function buildSmoothPath(points) {
  if (points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x} ${p2.y}`;
  }
  return d;
}

function toViewBox(pct) {
  return { x: (pct.x / 100) * VIEWBOX_W, y: (pct.y / 100) * VIEWBOX_H };
}

// Interleaves each node with the (possibly user-displaced) control point
// that follows it, so the Catmull-Rom curve is recomputed to pass through
// dragged control points instead of the original midpoints.
function buildPathPoints() {
  const points = [];
  NODE_DATA.forEach((node, i) => {
    points.push(toViewBox({ x: node.x, y: node.y }));
    if (i < NODE_DATA.length - 1) {
      points.push(toViewBox(controlPointPos(i)));
    }
  });
  // Extend the line past the last node, continuing its direction, so it
  // trails off the edge instead of stopping dead. Suggests there's more
  // to come.
  const last = NODE_DATA[NODE_DATA.length - 1];
  const prev = NODE_DATA[NODE_DATA.length - 2];
  const dx = last.x - prev.x;
  const dy = last.y - prev.y;
  points.push(toViewBox({ x: last.x + dx * 1.6, y: last.y + dy * 1.6 }));
  return points;
}

function drawPath() {
  const pathEl = document.getElementById('journey-path-line');
  if (!pathEl) return;
  pathEl.setAttribute('d', buildSmoothPath(buildPathPoints()));
  // Size the dash pattern to the path's actual measured length. A fixed
  // number here would silently truncate the visible line once the real
  // path (7 nodes across a wide layout, or a user-reshaped curve) grows
  // past it.
  const length = pathEl.getTotalLength();
  pathEl.style.strokeDasharray = String(length);
  pathEl.style.setProperty('--path-length', String(length));
}

// ---------- Physics: velocity-tracked momentum glide ----------

function createDragController({ onMove, onSettle, reducedMotion }) {
  const samples = [];
  let dragging = false;
  let startX = 0;
  let startY = 0;
  let startTime = 0;
  let glideId = null;

  function pushSample(x, y, t) {
    samples.push({ x, y, t });
    if (samples.length > 3) samples.shift();
  }

  function stopGlide() {
    if (glideId !== null) {
      cancelAnimationFrame(glideId);
      glideId = null;
    }
  }

  function begin(x, y) {
    stopGlide();
    dragging = true;
    startX = x;
    startY = y;
    startTime = performance.now();
    samples.length = 0;
    pushSample(x, y, startTime);
  }

  function move(dx, dy, x, y) {
    if (!dragging) return;
    onMove(dx, dy);
    pushSample(x, y, performance.now());
  }

  function end(x, y) {
    if (!dragging) return;
    dragging = false;
    const elapsed = performance.now() - startTime;
    const dist = Math.hypot(x - startX, y - startY);
    const isClick = dist < CLICK_DISTANCE_THRESHOLD && elapsed < CLICK_TIME_THRESHOLD;

    if (isClick) {
      if (onSettle) onSettle(true);
      return;
    }

    if (reducedMotion() || samples.length < 2) {
      if (onSettle) onSettle(false);
      return;
    }

    const first = samples[0];
    const last = samples[samples.length - 1];
    const dt = Math.max(last.t - first.t, 1);
    let vx = (last.x - first.x) / dt * 16; // px per ~frame (16ms)
    let vy = (last.y - first.y) / dt * 16;

    function tick() {
      vx *= GLIDE_FRICTION;
      vy *= GLIDE_FRICTION;
      if (Math.hypot(vx, vy) < GLIDE_STOP_THRESHOLD) {
        glideId = null;
        return;
      }
      onMove(vx, vy);
      glideId = requestAnimationFrame(tick);
    }
    glideId = requestAnimationFrame(tick);
    if (onSettle) onSettle(false);
  }

  return { begin, move, end, stopGlide, isDragging: () => dragging };
}

// ---------- Desktop canvas ----------

function buildDesktopCanvas() {
  const canvas = document.getElementById('journey-canvas');
  const inner = document.getElementById('journey-canvas-inner');
  const reducedMotion = prefersReducedMotion;

  initCursorGlow('#journey-canvas');

  drawPath();

  // canvas pan state
  let panX = 0;
  let panY = 0;
  const panController = createDragController({
    onMove: (dx, dy) => {
      panX += dx;
      panY += dy;
      inner.style.transform = `translate(${panX}px, ${panY}px)`;
      NODE_DATA.forEach(n => n._updateConnector && n._updateConnector());
    },
    reducedMotion,
  });

  NODE_DATA.forEach(node => {
    const dot = document.createElement('div');
    dot.className = 'journey-dot' + (node.current ? ' journey-dot--current' : '');
    dot.style.left = `${node.x}%`;
    dot.style.top = `${node.y}%`;
    inner.appendChild(dot);

    const connector = document.createElement('div');
    connector.className = 'journey-connector';
    inner.appendChild(connector);

    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'journey-node' + (node.current ? ' journey-node--current' : '');
    el.style.left = `${node.x}%`;
    el.style.top = `${node.y}%`;
    el.innerHTML = `<span class="journey-node__icon material-symbols-outlined">${node.icon}</span><h2 class="journey-node__title">${node.title}</h2><p class="journey-node__subtitle">${node.subtitle}</p>`;
    inner.appendChild(el);

    const offset = { x: node.cardOffset.x, y: node.cardOffset.y };

    function applyTransform() {
      el.style.transform = `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px)`;
      updateConnector();
    }

    function updateConnector() {
      // offsetWidth/offsetHeight (layout size, unaffected by the canvas's
      // CSS scale-down transform) — not getBoundingClientRect (post-scale
      // rendered size). These styles are local pixel values inside the
      // scaled canvas, so they get scaled once by the ancestor transform;
      // computing them from an already-scaled size would scale them twice.
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      const dotX = (node.x / 100) * w + panX;
      const dotY = (node.y / 100) * h + panY;
      const cardX = dotX + offset.x;
      const cardY = dotY + offset.y;
      const dx = cardX - dotX;
      const dy = cardY - dotY;
      const length = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      connector.style.left = `${(node.x / 100) * w}px`;
      connector.style.top = `${(node.y / 100) * h}px`;
      connector.style.width = `${Math.max(length - 14, 0)}px`;
      connector.style.transform = `rotate(${angle}deg)`;
    }

    applyTransform();

    const cardController = createDragController({
      onMove: (dx, dy) => {
        offset.x += dx;
        offset.y += dy;
        applyTransform();
      },
      onSettle: (wasClick) => {
        el.classList.remove('is-dragging');
        if (wasClick) {
          renderPanel(node);
        } else {
          // Drop the lingering focus ring a real drag leaves behind.
          el.blur();
        }
      },
      reducedMotion,
    });

    el.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      try { el.setPointerCapture(e.pointerId); } catch (err) { /* no active pointer (e.g. synthetic event) — drag still works via document-level move/up */ }
      el.classList.add('is-dragging');
      cardController.begin(e.clientX, e.clientY);
    });
    el.addEventListener('pointermove', (e) => {
      if (!cardController.isDragging()) return;
      cardController.move(e.movementX, e.movementY, e.clientX, e.clientY);
    });
    el.addEventListener('pointerup', (e) => {
      try { if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId); } catch (err) { /* no-op */ }
      cardController.end(e.clientX, e.clientY);
    });
    el.addEventListener('pointercancel', (e) => {
      el.classList.remove('is-dragging');
      cardController.end(e.clientX, e.clientY);
    });

    window.addEventListener('resize', updateConnector);
    node._updateConnector = updateConnector;
  });

  buildControlPoints(inner, canvas);

  // Background pan gesture — only when the pointerdown target is not a
  // node/card or a control-point handle.
  canvas.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.journey-node') || e.target.closest('.journey-control-point')) return;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* no active pointer (e.g. synthetic event) */ }
    canvas.classList.add('is-panning');
    panController.begin(e.clientX, e.clientY);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (panController.isDragging()) {
      panController.move(e.movementX, e.movementY, e.clientX, e.clientY);
    }
  });
  canvas.addEventListener('pointerup', (e) => {
    try { if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId); } catch (err) { /* no-op */ }
    canvas.classList.remove('is-panning');
    panController.end(e.clientX, e.clientY);
  });
  canvas.addEventListener('pointercancel', (e) => {
    canvas.classList.remove('is-panning');
    panController.end(e.clientX, e.clientY);
  });
}

// ---------- Draggable path control points ----------
// One handle per gap between consecutive nodes, defaulting to the segment
// midpoint. Dragging a handle displaces it (in canvas-percentage space) and
// the path is recomputed through the new position. No momentum/glide here —
// reshaping a curve is a direct, settled action, not a flung object — but
// the event wiring (pointerdown/move/up + capture) mirrors the rest of the
// page for consistency.
function buildControlPoints(inner, canvas) {
  controlPointOffsets.forEach((off, i) => {
    const handle = document.createElement('div');
    handle.className = 'journey-control-point';
    handle.setAttribute('aria-hidden', 'true');
    inner.appendChild(handle);

    function applyPos() {
      const pos = controlPointPos(i);
      handle.style.left = `${pos.x}%`;
      handle.style.top = `${pos.y}%`;
    }
    applyPos();

    let dragging = false;
    handle.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      try { handle.setPointerCapture(e.pointerId); } catch (err) { /* no active pointer (e.g. synthetic event) */ }
      dragging = true;
      handle.classList.add('is-dragging');
    });
    handle.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const rect = canvas.getBoundingClientRect();
      off.dx += (e.movementX / rect.width) * 100;
      off.dy += (e.movementY / rect.height) * 100;
      applyPos();
      drawPath();
    });
    function stopDrag(e) {
      if (!dragging) return;
      dragging = false;
      handle.classList.remove('is-dragging');
      try { if (handle.hasPointerCapture(e.pointerId)) handle.releasePointerCapture(e.pointerId); } catch (err) { /* no-op */ }
    }
    handle.addEventListener('pointerup', stopDrag);
    handle.addEventListener('pointercancel', stopDrag);
  });
}

function buildMobileStack() {
  const stack = document.getElementById('journey-stack');
  NODE_DATA.forEach(node => {
    const li = document.createElement('li');
    li.className = 'journey-stack__item';
    li.innerHTML = `<button type="button" class="journey-stack__button"><span class="material-symbols-outlined">${node.icon}</span><span><strong>${node.title}</strong><br><small>${node.subtitle}</small></span></button>`;
    li.querySelector('button').addEventListener('click', () => renderPanel(node));
    stack.appendChild(li);
  });
}

export function initJourney() {
  buildDesktopCanvas();
  buildMobileStack();
  document.querySelector('.journey-panel__close')?.addEventListener('click', closePanel);
  document.getElementById('journey-backdrop')?.addEventListener('click', closePanel);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePanel();
  });
}
