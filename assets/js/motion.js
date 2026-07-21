export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function initScrollReveal(selector = '.u-reveal') {
  const items = document.querySelectorAll(selector);
  if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
    items.forEach(el => el.classList.add('is-visible'));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  items.forEach(el => observer.observe(el));
}

export function initCounters(selector = '[data-counter-to]') {
  const items = document.querySelectorAll(selector);
  items.forEach(el => {
    const to = parseFloat(el.dataset.counterTo);
    const ms = parseInt(el.dataset.counterMs || '1200', 10);
    if (prefersReducedMotion() || Number.isNaN(to)) {
      el.textContent = String(to);
      return;
    }
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / ms, 1);
      el.textContent = Math.round(to * progress).toString();
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}

// Cursor-following grid glow: brightens the existing grid-line pattern near
// the pointer (via a masked duplicate layer) rather than washing a colored
// spotlight over the background, and eases toward the pointer with a lag
// instead of snapping to it. Container must have `position: relative` and a
// `.u-grid-bg` background; it must contain one `.u-cursor-glow` child.
export function initCursorGlow(containerSelector, glowSelector = '.u-cursor-glow') {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  const glow = container.querySelector(glowSelector);
  if (!glow) return;

  let targetX = 0, targetY = 0, currentX = 0, currentY = 0;
  let hasPointer = false;
  const reduced = prefersReducedMotion();
  const ease = reduced ? 1 : 0.08;

  container.addEventListener('pointermove', (e) => {
    const rect = container.getBoundingClientRect();
    targetX = e.clientX - rect.left;
    targetY = e.clientY - rect.top;
    if (!hasPointer) { currentX = targetX; currentY = targetY; }
  });
  container.addEventListener('pointerenter', () => {
    hasPointer = true;
    glow.classList.add('has-pointer');
  });
  container.addEventListener('pointerleave', () => {
    hasPointer = false;
    glow.classList.remove('has-pointer');
  });

  function tick() {
    currentX += (targetX - currentX) * ease;
    currentY += (targetY - currentY) * ease;
    glow.style.setProperty('--glow-x', `${currentX}px`);
    glow.style.setProperty('--glow-y', `${currentY}px`);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
