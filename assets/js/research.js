import { prefersReducedMotion } from './motion.js';

export function initScrollspy() {
  const sections = document.querySelectorAll('main section[id]');
  const subnavLinks = document.querySelectorAll('.research-subnav__link');
  if (!sections.length || !subnavLinks.length) return;

  function onScroll() {
    let current = '';
    sections.forEach(section => {
      const top = section.offsetTop;
      if (window.pageYOffset >= top - 150) current = section.id;
    });

    const atBottom = document.documentElement.scrollHeight - window.innerHeight - window.pageYOffset <= 2;
    if (atBottom) {
      current = sections[sections.length - 1].id;
    }

    subnavLinks.forEach(link => {
      link.classList.toggle('is-active', link.getAttribute('href') === `#${current}`);
    });
  }
  window.addEventListener('scroll', onScroll);
  onScroll();

  subnavLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    });
  });
}
