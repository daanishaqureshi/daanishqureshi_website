/* Home animation v1: a sine wave that opens into a double helix and closes again.
   One canvas in .anim-strip. Pauses off screen and in a hidden tab.
   prefers-reduced-motion draws one still frame. */
(function () {
  var host = document.querySelector('.anim-strip');
  if (!host) return;
  var c = host.querySelector('canvas'), g = c.getContext('2d');
  var W = 0, H = 0, t = 0, last = 0, raf = 0, running = false, seen = true;
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var BLUE = '0,53,107', GREY = '154,160,166';

  function size() {
    var d = Math.min(2, window.devicePixelRatio || 1);
    W = host.clientWidth; H = host.clientHeight;
    c.width = Math.round(W * d); c.height = Math.round(H * d);
    g.setTransform(d, 0, 0, d, 0, 0);
    draw();
  }

  function smooth(a, b, v) { v = Math.max(0, Math.min(1, (v - a) / (b - a))); return v * v * (3 - 2 * v); }

  function draw() {
    if (!W) return;
    g.clearRect(0, 0, W, H);
    var mid = H / 2, A = H * 0.34, lam = Math.max(96, Math.min(150, W / 5)), k = 2 * Math.PI / lam;
    var ph = t * 0.9;                       /* phase speed: one turn every ~7 s */
    var gap = 0.78 * Math.PI;               /* strand offset gives a major and a minor groove */
    var step = 2, x, h, p1, p2, y1, y2;
    var front = [new Path2D(), new Path2D()], back = [new Path2D(), new Path2D()];
    var prev = [null, null];
    for (x = 0; x <= W + step; x += step) {
      h = smooth(0.18, 0.4, x / W) * (1 - smooth(0.6, 0.82, x / W));
      p1 = k * x - ph; p2 = p1 + gap * h;
      y1 = mid + A * Math.sin(p1); y2 = mid + A * Math.sin(p2);
      var pts = [[y1, Math.cos(p1)], [y2, Math.cos(p2)]];
      for (var s = 0; s < 2; s++) {
        var y = pts[s][0], z = pts[s][1];
        if (prev[s]) {
          var path = z > 0 ? front[s] : back[s];
          path.moveTo(x - step, prev[s]); path.lineTo(x, y);
        }
        prev[s] = y;
      }
    }
    /* rungs: base pairs, only where the strands have separated */
    var rungs = new Path2D(), rungsBack = new Path2D(), n = Math.ceil(W / (lam / 10));
    for (var i = 0; i <= n; i++) {
      var xr = i * lam / 10 + ((ph / k) % (lam / 10));
      h = smooth(0.18, 0.4, xr / W) * (1 - smooth(0.6, 0.82, xr / W));
      if (h < 0.35) continue;
      p1 = k * xr - ph; p2 = p1 + gap * h;
      y1 = mid + A * Math.sin(p1); y2 = mid + A * Math.sin(p2);
      if (Math.abs(y1 - y2) < 3) continue;
      var r = (Math.cos(p1) + Math.cos(p2)) > 0 ? rungs : rungsBack;
      r.moveTo(xr, y1); r.lineTo(xr, y2);
    }
    g.lineCap = 'round';
    g.lineWidth = 1;
    g.strokeStyle = 'rgba(' + GREY + ',0.35)'; g.stroke(rungsBack);
    g.strokeStyle = 'rgba(' + GREY + ',0.7)'; g.stroke(rungs);
    g.lineWidth = 1.2;
    g.strokeStyle = 'rgba(' + BLUE + ',0.28)'; g.stroke(back[0]); g.stroke(back[1]);
    g.lineWidth = 1.5;
    g.strokeStyle = 'rgba(' + BLUE + ',0.9)'; g.stroke(front[0]);
    g.strokeStyle = 'rgba(' + BLUE + ',0.75)'; g.stroke(front[1]);
    /* soft ends */
    g.globalCompositeOperation = 'destination-in';
    var f = g.createLinearGradient(0, 0, W, 0);
    f.addColorStop(0, 'rgba(0,0,0,0)'); f.addColorStop(0.08, 'rgba(0,0,0,1)');
    f.addColorStop(0.92, 'rgba(0,0,0,1)'); f.addColorStop(1, 'rgba(0,0,0,0)');
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
  t = 1.3;
  new ResizeObserver(size).observe(host);
  new IntersectionObserver(function (e) { seen = e[0].isIntersecting; update(); }).observe(host);
  document.addEventListener('visibilitychange', update);
  size(); update();
})();
