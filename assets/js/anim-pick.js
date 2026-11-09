/* Variant switcher for the Home animations, shown only with ?pick in the URL. */
(function () {
  var names = ['none', 'helix', 'cells', 'pendulum', 'headings'];
  var nav = document.createElement('nav');
  nav.className = 'anim-pick';
  nav.setAttribute('aria-label', 'Animation variant');
  names.forEach(function (n, i) {
    var a = document.createElement('a');
    a.href = '?v=' + i + '&pick';
    a.textContent = i + ' ' + n;
    if (i === window.ANIM_V) a.setAttribute('aria-current', 'true');
    nav.appendChild(a);
  });
  document.body.appendChild(nav);
})();
