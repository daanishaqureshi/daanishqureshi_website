/* Research page accent: the heat (diffusion) equation u_t = D u_xx on a line,
   solved as a Fourier sine series. A few sharp blocks of "drug" relax into
   one smooth hump while faint copies of earlier moments trail behind, then a
   new start fades in. Same Fick's law the PINN work builds in.
   Pauses off screen and in a hidden tab. prefers-reduced-motion draws one still frame. */
(function () {
  var host = document.querySelector('.anim-strip');
  if (!host) return;
  var c = host.querySelector('canvas'), g = c.getContext('2d');
  var W = 0, H = 0, t = 0, last = 0, raf = 0, running = false, seen = true;
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var BLUE = '0,53,107', GREY = '154,160,166';
  var N = 48, K = 0.00042, CYCLE = 12, GHOSTS = 7, GAP = 0.6;
  var b = [], scale = 1, cycle = -1, seed = 3;

  function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }

  /* a new initial condition: two or three blocks, as if films were placed on the line */
  function reset() {
    var n, k, a, w, h, blocks = 2 + (rnd() < 0.5 ? 1 : 0);
    for (n = 1; n <= N; n++) b[n] = 0;
    for (k = 0; k < blocks; k++) {
      w = 0.06 + rnd() * 0.12; a = 0.08 + rnd() * (0.84 - w); h = 0.5 + rnd() * 0.5;
      for (n = 1; n <= N; n++) b[n] += 2 * h / (n * Math.PI) * (Math.cos(n * Math.PI * a) - Math.cos(n * Math.PI * (a + w)));
    }
    var m = 0;
    decay(0.6);
    for (var i = 0; i <= 100; i++) m = Math.max(m, Math.abs(sum(i / 100)));
    scale = m > 0 ? 1 / m : 1;
  }

  var e = [];
  /* model time runs as K s^2, a time-lapse that starts slow so the sharp blocks are seen */
  function decay(s) { var tau = K * s * s; for (var n = 1; n <= N; n++) e[n] = b[n] * Math.exp(-n * n * Math.PI * Math.PI * tau); }
  /* sum of e[n] sin(n pi x), with sin(n pi x) from the Chebyshev recurrence */
  function sum(x) {
    var c2 = 2 * Math.cos(Math.PI * x), s0 = 0, s1 = Math.sin(Math.PI * x), v = 0, s2;
    for (var n = 1; n <= N; n++) { v += e[n] * s1; s2 = c2 * s1 - s0; s0 = s1; s1 = s2; }
    return v;
  }

  function size() {
    var d = Math.min(2, window.devicePixelRatio || 1);
    W = host.clientWidth; H = host.clientHeight;
    c.width = Math.round(W * d); c.height = Math.round(H * d);
    g.setTransform(d, 0, 0, d, 0, 0);
    draw();
  }

  function curve(s, alpha, width, color) {
    var base = H - 8, amp = H - 16, step = Math.max(2, W / 240), x, y;
    g.beginPath();
    decay(s);
    for (x = 0; x <= W + 0.5; x += step) {
      y = base - amp * scale * sum(Math.min(1, x / W));
      if (x === 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.lineWidth = width; g.strokeStyle = 'rgba(' + color + ',' + alpha + ')'; g.stroke();
  }

  function draw() {
    if (!W) return;
    var k = Math.floor(t / CYCLE);
    if (k !== cycle) { cycle = k; seed = 3 + k * 7919; reset(); }
    var s = t - k * CYCLE + 0.15;                 /* time inside this cycle */
    var fade = Math.min(1, s / 0.6) * Math.min(1, (CYCLE - s + 0.15) / 0.9);
    g.clearRect(0, 0, W, H);
    g.lineCap = 'round'; g.lineJoin = 'round';
    /* the line itself */
    g.fillStyle = 'rgba(' + GREY + ',0.45)'; g.fillRect(0, H - 8, W, 1);
    g.globalAlpha = Math.max(0, fade);
    /* ghosts: earlier moments, snapped to a fixed grid so they do not slide */
    var g0 = Math.floor(s / GAP) * GAP;
    for (var i = GHOSTS; i >= 1; i--) {
      var sg = g0 - (i - 1) * GAP;
      if (sg < 0.15) continue;
      curve(sg, 0.07 + 0.22 * (1 - i / (GHOSTS + 1)), 1, BLUE);
    }
    curve(s, 0.9, 1.5, BLUE);
    g.globalAlpha = 1;
    /* soft ends */
    g.globalCompositeOperation = 'destination-in';
    var f = g.createLinearGradient(0, 0, W, 0);
    f.addColorStop(0, 'rgba(0,0,0,0)'); f.addColorStop(0.06, 'rgba(0,0,0,1)');
    f.addColorStop(0.94, 'rgba(0,0,0,1)'); f.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = f; g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'source-over';
  }

  function frame(now) {
    t += Math.min(0.05, (now - last) / 1000); last = now;
    draw();
    raf = requestAnimationFrame(frame);
  }
  function update() {
    var go = seen && !document.hidden && !still;
    if (go && !running) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
    if (!go && running) { running = false; cancelAnimationFrame(raf); }
  }
  t = still ? 2.5 : 0;
  new ResizeObserver(size).observe(host);
  new IntersectionObserver(function (e) { seen = e[0].isIntersecting; update(); }).observe(host);
  document.addEventListener('visibilitychange', update);
  size(); update();
})();
