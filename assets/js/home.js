export function initParticles(canvasSelector) {
  const canvas = document.querySelector(canvasSelector);
  if (!canvas) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const ctx = canvas.getContext('2d');
  let particles = [];

  function resize() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  class Particle {
    constructor() { this.init(); }
    init() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 2;
      this.speedX = Math.random() * 0.5 - 0.25;
      this.speedY = Math.random() * 0.5 - 0.25;
      this.opacity = Math.random();
    }
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
      if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
    }
    draw() {
      ctx.fillStyle = `rgba(200, 198, 199, ${this.opacity * 0.2})`;
      ctx.fillRect(this.x, this.y, this.size, this.size);
    }
  }

  for (let i = 0; i < 80; i++) particles.push(new Particle());

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animate);
  }
  animate();
}

// Terminal-style boot overlay shown before the hero content reveals. Types
// each line character-by-character, then removes itself and un-hides the
// (pre-hidden, via `.home-hero__content--pending`) hero content. Skipped
// entirely under reduced motion — content reveals immediately instead.
export function initBootSequence(bootSelector, contentSelector, lines, opts = {}) {
  const boot = document.querySelector(bootSelector);
  const content = document.querySelector(contentSelector);
  if (!boot || !content) return;

  const reveal = () => {
    content.classList.remove('home-hero__content--pending');
    if (opts.onDone) opts.onDone();
  };

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    boot.remove();
    reveal();
    return;
  }

  const charDelay = opts.charDelay ?? 8;
  const lineDelay = opts.lineDelay ?? 110;
  const holdMs = opts.holdMs ?? 150;
  let lineEl = null;
  let li = 0;
  let ci = 0;

  function typeStep() {
    if (li >= lines.length) {
      setTimeout(() => {
        boot.classList.add('is-done');
        reveal();
        setTimeout(() => boot.remove(), 500);
      }, holdMs);
      return;
    }
    if (ci === 0) {
      lineEl = document.createElement('div');
      lineEl.className = 'home-boot__line';
      boot.appendChild(lineEl);
    }
    const line = lines[li];
    if (ci < line.length) {
      lineEl.textContent = `> ${line.slice(0, ci + 1)}`;
      ci++;
      setTimeout(typeStep, charDelay);
    } else {
      li++;
      ci = 0;
      setTimeout(typeStep, lineDelay);
    }
  }
  typeStep();
}

// Makes a counted-up value (e.g. LATENCY_INDEX) drift slightly around its
// base value on an ongoing basis, instead of settling to a fixed number —
// suggests live measurement rather than a one-time animation. No-op under
// reduced motion (value stays at whatever initCounters left it at).
export function initLatencyJitter(selector) {
  const el = document.querySelector(selector);
  if (!el) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const base = parseFloat(el.dataset.jitterBase || el.dataset.counterTo || '14');
  const range = parseFloat(el.dataset.jitterRange || '4');
  const initialMs = parseInt(el.dataset.counterMs || '1500', 10);

  function schedule() {
    const delay = 1200 + Math.random() * 900;
    setTimeout(() => {
      const jitter = (Math.random() - 0.5) * 2 * range;
      el.textContent = Math.max(1, Math.round(base + jitter));
      schedule();
    }, delay);
  }
  setTimeout(schedule, initialMs + 300);
}
