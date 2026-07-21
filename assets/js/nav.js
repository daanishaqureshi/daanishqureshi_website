import { prefersReducedMotion } from './motion.js';

export function initSiteNav() {
  const page = document.body.dataset.page;
  const links = document.querySelectorAll('.site-nav__link, .site-drawer__link');
  const underline = document.querySelector('.site-nav__underline');
  const activeLink = document.querySelector(`.site-nav__link[data-page="${page}"]`);

  links.forEach(link => {
    link.classList.toggle('is-active', link.dataset.page === page);
  });

  function positionUnderline() {
    if (!underline || !activeLink) return;
    const navRect = activeLink.parentElement.getBoundingClientRect();
    const linkRect = activeLink.getBoundingClientRect();
    underline.style.width = `${linkRect.width}px`;
    underline.style.transform = `translateX(${linkRect.left - navRect.left}px)`;
  }
  positionUnderline();
  window.addEventListener('resize', positionUnderline);

  const toggle = document.querySelector('.site-nav__toggle');
  const drawer = document.querySelector('.site-drawer');
  const drawerClose = document.querySelector('.site-drawer__close');
  if (toggle && drawer) {
    toggle.addEventListener('click', () => {
      drawer.classList.add('is-open');
      drawer.removeAttribute('inert');
      toggle.setAttribute('aria-expanded', 'true');
    });
  }
  if (drawerClose && drawer) {
    drawerClose.addEventListener('click', () => {
      drawer.classList.remove('is-open');
      drawer.setAttribute('inert', '');
      toggle?.setAttribute('aria-expanded', 'false');
    });
  }

  document.body.classList.add('is-loaded');
  document.querySelectorAll('a[data-internal]').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (!href || link.target === '_blank') return;
      e.preventDefault();
      document.body.classList.add('is-leaving');
      const delay = prefersReducedMotion() ? 0 : 250;
      setTimeout(() => { window.location.href = href; }, delay);
    });
  });
}
