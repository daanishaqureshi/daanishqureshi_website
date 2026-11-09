/* Home animation v4: each section heading gets a hairline and a small line
   drawing at its right end, drawn once when the heading scrolls into view.
   Research interests: a double helix. News: a damped oscillation.
   Publications: a cell. Nothing moves after it is drawn.
   prefers-reduced-motion shows the drawings already drawn. */
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ICONS = {
    'Research interests': helix,
    'News': damped,
    'Publications': cell
  };

  function helix() {
    var a = '', b = '', r = '', x;
    for (x = 0; x <= 60; x += 1) {
      var p = x / 60 * 3 * Math.PI;
      a += (x ? 'L' : 'M') + (x + 2) + ' ' + (12 + 8 * Math.sin(p)).toFixed(2);
      b += (x ? 'L' : 'M') + (x + 2) + ' ' + (12 + 8 * Math.sin(p + 0.78 * Math.PI)).toFixed(2);
    }
    for (x = 4; x < 60; x += 5) {
      var q = x / 60 * 3 * Math.PI, y1 = 12 + 8 * Math.sin(q), y2 = 12 + 8 * Math.sin(q + 0.78 * Math.PI);
      if (Math.abs(y1 - y2) > 3) r += 'M' + (x + 2) + ' ' + y1.toFixed(2) + 'V' + y2.toFixed(2);
    }
    return [[a, ''], [b, ''], [r, 'rung']];
  }

  function damped() {
    var d = '', x;
    for (x = 0; x <= 60; x += 1) {
      d += (x ? 'L' : 'M') + (x + 2) + ' ' + (12 - 9 * Math.exp(-x / 22) * Math.cos(x / 60 * 5 * Math.PI)).toFixed(2);
    }
    return [['M2 12H62', 'rung'], [d, '']];
  }

  function cell() {
    return [
      ['M32 3C48 3 61 7 61 12S48 21 32 21 3 17 3 12 16 3 32 3Z', ''],
      ['M36 12a5 5 0 1 0 -10 0a5 5 0 1 0 10 0Z', ''],
      ['M44 8.5c3 0 5 1 5 2s-2 2-5 2-5-1-5-2 2-2 5-2Z', 'rung'],
      ['M14 13c2.5 0 4 .8 4 1.6s-1.5 1.6-4 1.6-4-.8-4-1.6 1.5-1.6 4-1.6Z', 'rung']
    ];
  }

  function build(h2, parts) {
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 64 24');
    svg.setAttribute('class', 'h-icon');
    svg.setAttribute('aria-hidden', 'true');
    var rule = document.createElement('span');
    rule.className = 'h-rule';
    rule.setAttribute('aria-hidden', 'true');
    parts.forEach(function (pt, i) {
      var p = document.createElementNS(NS, 'path');
      p.setAttribute('d', pt[0]);
      if (pt[1]) p.setAttribute('class', pt[1]);
      p.style.transitionDelay = (0.5 + i * 0.25) + 's';
      svg.appendChild(p);
    });
    h2.appendChild(rule);
    h2.appendChild(svg);
    svg.querySelectorAll('path').forEach(function (p) {
      var L = Math.ceil(p.getTotalLength()) + 1;
      p.style.strokeDasharray = L; p.style.strokeDashoffset = still ? 0 : L;
    });
    return { h2: h2, svg: svg, rule: rule };
  }

  function placeRule(o) {
    /* hairline runs from the end of the heading text to the drawing */
    var r = document.createRange(), tn = o.h2.firstChild;
    r.selectNodeContents(tn);
    var tw = r.getBoundingClientRect().right - o.h2.getBoundingClientRect().left;
    o.rule.style.left = Math.round(tw + 14) + 'px';
  }

  var items = [];
  document.querySelectorAll('main h2').forEach(function (h2) {
    var fn = ICONS[h2.textContent.trim()];
    if (fn) items.push(build(h2, fn()));
  });
  if (!items.length) return;
  function placeAll() { items.forEach(placeRule); }
  placeAll();
  window.addEventListener('resize', placeAll);
  if (document.fonts) document.fonts.ready.then(placeAll);

  function show(o) {
    o.h2.classList.add('h-drawn');
    o.svg.querySelectorAll('path').forEach(function (p) { p.style.strokeDashoffset = 0; });
  }
  if (still) { items.forEach(function (o) { o.h2.classList.add('h-drawn', 'h-still'); }); return; }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      items.forEach(function (o) { if (o.h2 === e.target) show(o); });
    });
  }, { rootMargin: '0px 0px -12% 0px' });
  items.forEach(function (o) { io.observe(o.h2); });
})();
