/* Home animation v2: scattered points settle into cell-type clusters, like a
   UMAP of single-cell data, hold, loosen, and settle into a new embedding.
   One canvas in .anim-strip. Pauses off screen and in a hidden tab.
   prefers-reduced-motion draws one settled frame. */
(function () {
  var host = document.querySelector('.anim-strip');
  if (!host) return;
  var c = host.querySelector('canvas'), g = c.getContext('2d');
  var W = 0, H = 0, last = 0, raf = 0, running = false, seen = true;
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var COLORS = ['#00356b', '#286dc0', '#7d9cc4', '#5f6368', '#9aa0a6', '#b4bec9'];
  var P = [], K = 6, phase = 0, clock = 0, seed = 7;
  var SETTLE = 5, HOLD = 6, LOOSEN = 2.5;   /* seconds */

  function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  function gauss() { return Math.sqrt(-2 * Math.log(rnd() + 1e-9)) * Math.cos(2 * Math.PI * rnd()); }

  function layout() {
    /* cluster centres spread across the strip, sizes uneven like real cell types */
    var cs = [], i, pad = 40, span = (W - 2 * pad) / K;
    for (i = 0; i < K; i++) {
      cs.push({
        x: pad + span * (i + 0.5) + (rnd() - 0.5) * span * 0.5,
        y: H * (0.25 + 0.5 * rnd()),
        sx: 8 + rnd() * Math.min(20, span * 0.24), sy: 5 + rnd() * H * 0.1,
        a: (rnd() - 0.5) * 1.2
      });
    }
    /* shuffle which colour lands where so each embedding looks new */
    for (i = 0; i < P.length; i++) {
      var q = cs[P[i].k], u = gauss() * q.sx, v = gauss() * q.sy;
      P[i].tx = q.x + u * Math.cos(q.a) - v * Math.sin(q.a);
      P[i].ty = Math.max(4, Math.min(H - 4, q.y + u * Math.sin(q.a) + v * Math.cos(q.a)));
    }
  }

  function scatter() {
    for (var i = 0; i < P.length; i++) { P[i].tx = rnd() * W; P[i].ty = 4 + rnd() * (H - 8); }
  }

  function init() {
    var n = Math.round(Math.max(110, Math.min(260, W * 0.38)));
    P = [];
    for (var i = 0; i < n; i++) {
      var k = Math.floor(Math.pow(rnd(), 1.4) * K);   /* uneven cluster sizes */
      P.push({ x: rnd() * W, y: 4 + rnd() * (H - 8), vx: 0, vy: 0, k: k, tx: 0, ty: 0 });
    }
    phase = 0; clock = 0; layout();
  }

  function size() {
    var d = Math.min(2, window.devicePixelRatio || 1), w = host.clientWidth;
    H = host.clientHeight; c.width = Math.round(w * d); c.height = Math.round(H * d);
    g.setTransform(d, 0, 0, d, 0, 0);
    if (Math.abs(w - W) > 1) { W = w; init(); if (still) settleNow(); }
    draw();
  }

  function settleNow() { for (var i = 0; i < P.length; i++) { P[i].x = P[i].tx; P[i].y = P[i].ty; } }

  function step(dt) {
    clock += dt;
    if (phase === 0 && clock > SETTLE + HOLD) { phase = 1; clock = 0; scatter(); }
    else if (phase === 1 && clock > LOOSEN) { phase = 0; clock = 0; layout(); }
    var kS = phase === 0 ? 2.2 : 0.9, damp = 2.6, jit = phase === 0 && clock > SETTLE ? 3 : 8;
    for (var i = 0; i < P.length; i++) {
      var p = P[i];
      p.vx += ((p.tx - p.x) * kS - p.vx * damp + gauss() * jit) * dt;
      p.vy += ((p.ty - p.y) * kS - p.vy * damp + gauss() * jit) * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
    }
  }

  function draw() {
    if (!W) return;
    g.clearRect(0, 0, W, H);
    for (var k = 0; k < K; k++) {
      g.fillStyle = COLORS[k];
      g.beginPath();
      for (var i = 0; i < P.length; i++) {
        var p = P[i]; if (p.k !== k) continue;
        g.moveTo(p.x + 1.7, p.y); g.arc(p.x, p.y, 1.7, 0, 6.2832);
      }
      g.globalAlpha = 0.8; g.fill(); g.globalAlpha = 1;
    }
    g.globalCompositeOperation = 'destination-in';
    var f = g.createLinearGradient(0, 0, W, 0);
    f.addColorStop(0, 'rgba(0,0,0,0)'); f.addColorStop(0.05, 'rgba(0,0,0,1)');
    f.addColorStop(0.95, 'rgba(0,0,0,1)'); f.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = f; g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'source-over';
  }

  function frame(now) {
    step(Math.min(0.05, (now - last) / 1000)); last = now;
    draw();
    raf = requestAnimationFrame(frame);
  }
  function update() {
    var go = seen && !document.hidden && !still;
    if (go && !running) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
    if (!go && running) { running = false; cancelAnimationFrame(raf); }
  }
  new ResizeObserver(size).observe(host);
  new IntersectionObserver(function (e) { seen = e[0].isIntersecting; update(); }).observe(host);
  document.addEventListener('visibilitychange', update);
  size(); update();
})();
