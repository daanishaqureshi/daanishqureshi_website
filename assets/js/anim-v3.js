/* Home animation v3: the phase portrait of a pendulum, theta'' = -sin(theta).
   Points flow along its trajectories: closed orbits (swinging) between the
   separatrices, open ones (spinning over the top) above and below them.
   One canvas in .anim-strip. Pauses off screen and in a hidden tab.
   prefers-reduced-motion draws one still frame. */
(function () {
  var me = document.currentScript, host = document.querySelector((me && me.dataset.host) || '.anim-strip');
  if (!host) return;
  var c = host.querySelector('canvas'), g = c.getContext('2d');
  var W = 0, H = 0, last = 0, raf = 0, running = false, seen = true;
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var TRAIL = 24, P = [], seed = 11, sx = 1, sy = 1, OM = 2.6;
  var SPEED = 0.55;   /* model time per second: slow on purpose */

  function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }

  /* screen x <-> theta: one period (2 pi) every ~150 px, theta = 0 at a well */
  function px(th) { return W / 2 + th * sx; }
  function py(om) { return H / 2 - om * sy; }

  function spawn(p) {
    p.th = (rnd() - 0.5) * (W / sx + 2);
    p.om = (rnd() * 2 - 1) * OM;
    p.age = 0; p.life = 4 + rnd() * 6; p.n = 0; p.acc = 0;
  }

  function init() {
    sx = Math.max(96, Math.min(150, W / 5)) / (2 * Math.PI);
    sy = (H / 2 - 4) / OM;
    var n = Math.round(Math.max(50, Math.min(110, W * 0.15)));
    P = [];
    for (var i = 0; i < n; i++) {
      var p = { hx: new Float32Array(TRAIL), hy: new Float32Array(TRAIL) };
      spawn(p); p.age = rnd() * p.life; P.push(p);
    }
  }

  function size() {
    var d = Math.min(2, window.devicePixelRatio || 1), w = host.clientWidth;
    H = host.clientHeight; c.width = Math.round(w * d); c.height = Math.round(H * d);
    g.setTransform(d, 0, 0, d, 0, 0);
    if (Math.abs(w - W) > 1) { W = w; init(); if (still) for (var k = 0; k < 40; k++) step(0.05); }
    draw();
  }

  function f(th, om) { return [om, -Math.sin(th)]; }

  function step(dt) {
    var h = dt * SPEED;
    for (var i = 0; i < P.length; i++) {
      var p = P[i];
      /* RK2 midpoint */
      var a = f(p.th, p.om), b = f(p.th + a[0] * h / 2, p.om + a[1] * h / 2);
      p.th += b[0] * h; p.om += b[1] * h; p.age += dt;
      var x = px(p.th);
      if (p.age > p.life || x < -20 || x > W + 20) { spawn(p); continue; }
      p.acc += dt;
      if (p.acc >= 0.05 || p.n === 0) {   /* a trail point every 50 ms, so trails are ~1.2 s long */
        p.acc = 0;
        for (var j = TRAIL - 1; j > 0; j--) { p.hx[j] = p.hx[j - 1]; p.hy[j] = p.hy[j - 1]; }
        if (p.n < TRAIL) p.n++;
      }
      p.hx[0] = x; p.hy[0] = py(p.om);
    }
  }

  function separatrix() {
    /* om = +-2 cos(theta / 2), the orbits through the unstable tops */
    var s = new Path2D(), x, th, y;
    for (var sgn = -1; sgn <= 1; sgn += 2) {
      for (x = 0; x <= W; x += 3) {
        th = (x - W / 2) / sx;
        y = py(sgn * 2 * Math.abs(Math.cos(th / 2)));
        if (x === 0) s.moveTo(x, y); else s.lineTo(x, y);
      }
    }
    return s;
  }

  function draw() {
    if (!W) return;
    g.clearRect(0, 0, W, H);
    g.lineWidth = 1; g.strokeStyle = 'rgba(154,160,166,0.35)';
    g.setLineDash([2, 4]); g.stroke(separatrix()); g.setLineDash([]);
    g.lineCap = 'round';
    for (var j = 0; j < TRAIL - 1; j++) {
      var path = new Path2D(), any = false;
      for (var i = 0; i < P.length; i++) {
        var p = P[i]; if (j + 1 >= p.n) continue;
        if (Math.abs(p.hx[j] - p.hx[j + 1]) > 30) continue;
        path.moveTo(p.hx[j], p.hy[j]); path.lineTo(p.hx[j + 1], p.hy[j + 1]); any = true;
      }
      if (!any) continue;
      g.lineWidth = 1.2 - j * 0.025;
      g.strokeStyle = 'rgba(0,53,107,' + (0.6 * (1 - j / TRAIL)).toFixed(3) + ')';
      g.stroke(path);
    }
    g.globalCompositeOperation = 'destination-in';
    var fd = g.createLinearGradient(0, 0, W, 0);
    fd.addColorStop(0, 'rgba(0,0,0,0)'); fd.addColorStop(0.07, 'rgba(0,0,0,1)');
    fd.addColorStop(0.93, 'rgba(0,0,0,1)'); fd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = fd; g.fillRect(0, 0, W, H);
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
