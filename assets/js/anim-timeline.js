/* CV page accent: a dotted timeline, 2018 to 2026, that draws itself in the
   first time it scrolls into view. Stops pop in as the line reaches them,
   then a soft pulse travels the line now and then and the last stop breathes.
   Pauses off screen and in a hidden tab. prefers-reduced-motion draws it finished. */
(function () {
  var host = document.querySelector('.anim-strip');
  if (!host) return;
  var c = host.querySelector('canvas'), g = c.getContext('2d');
  var W = 0, H = 0, t = 0, last = 0, raf = 0, running = false, seen = false;
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var BLUE = '0,53,107', GREY = '154,160,166', MUTED = '95,99,104';
  var Y0 = 2018, Y1 = 2026, KEY = { 2018: 1, 2021: 1, 2022: 1, 2024: 1, 2025: 1, 2026: 1 };
  var DRAW = 2.6, PULSE = 7;

  function size() {
    var d = Math.min(2, window.devicePixelRatio || 1);
    W = host.clientWidth; H = host.clientHeight;
    c.width = Math.round(W * d); c.height = Math.round(H * d);
    g.setTransform(d, 0, 0, d, 0, 0);
    draw();
  }

  function ease(v) { v = Math.max(0, Math.min(1, v)); return 1 - Math.pow(1 - v, 3); }

  function draw() {
    if (!W) return;
    g.clearRect(0, 0, W, H);
    var pad = Math.min(28, W * 0.05), x0 = pad, x1 = W - pad, y = Math.round(H * 0.62) + 0.5;
    var span = x1 - x0, p = still ? 1 : ease(t / DRAW), head = x0 + span * p;
    var small = W < 480;

    /* the dotted line, drawn up to the head */
    g.strokeStyle = 'rgba(' + GREY + ',0.8)'; g.lineWidth = 1; g.lineCap = 'round';
    g.setLineDash([1, 5]);
    g.beginPath(); g.moveTo(x0, y); g.lineTo(head, y); g.stroke();
    g.setLineDash([]);

    /* the pulse: a short bright run of line that sweeps left to right */
    var since = t - DRAW, px = -1;
    if (!still && since > 1) {
      var q = ((since - 1) % PULSE) / 2.4;          /* sweep takes 2.4 s, then rests */
      if (q <= 1) {
        px = x0 + span * q;
        var gr = g.createLinearGradient(px - 60, 0, px, 0);
        gr.addColorStop(0, 'rgba(' + BLUE + ',0)'); gr.addColorStop(1, 'rgba(' + BLUE + ',0.7)');
        g.strokeStyle = gr; g.lineWidth = 1.5;
        g.beginPath(); g.moveTo(Math.max(x0, px - 60), y); g.lineTo(px, y); g.stroke();
      }
    }

    /* stops, one per year */
    g.font = (small ? 11 : 12) + 'px "Source Sans 3", -apple-system, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    for (var yr = Y0; yr <= Y1; yr++) {
      var x = x0 + span * (yr - Y0) / (Y1 - Y0);
      var at = still ? 9 : (t - DRAW * ((x - x0) / span)) * 4;   /* time since the line reached it, x4 */
      if (!still && head < x - 0.5) continue;
      var pop = still ? 1 : ease(at), key = KEY[yr];
      var r = (key ? 3.2 : 1.6) * pop;
      if (px >= 0) r += (key ? 1.6 : 0.8) * Math.max(0, 1 - Math.abs(px - x) / 26);
      if (yr === Y1 && pop >= 1 && !still) r += 0.6 * Math.sin(t * 1.6) + 0.6;
      if (yr === Y1) {
        g.strokeStyle = 'rgba(' + BLUE + ',' + (0.25 * pop) + ')'; g.lineWidth = 1;
        g.beginPath(); g.arc(x, y, r + 4, 0, 6.2832); g.stroke();
      }
      g.fillStyle = key ? 'rgba(' + BLUE + ',' + (0.9 * pop) + ')' : 'rgba(' + GREY + ',' + pop + ')';
      g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.fill();
      if (key) {
        g.fillStyle = 'rgba(' + MUTED + ',' + (0.9 * pop) + ')';
        g.fillText(small ? "'" + String(yr).slice(2) : String(yr), x, y - 13);
      }
    }
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
  new ResizeObserver(size).observe(host);
  new IntersectionObserver(function (e) { seen = e[0].isIntersecting; update(); }).observe(host);
  document.addEventListener('visibilitychange', update);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
  size(); update();
})();
