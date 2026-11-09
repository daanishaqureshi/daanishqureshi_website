/* Industry page accent: a network that grows one node at a time by
   preferential attachment (Barabasi-Albert): each newcomer links to one or two
   existing nodes, picked in proportion to how connected they already are, so a
   few hubs emerge. A light force layout keeps it spread along the strip. When
   it is full it fades and starts again.
   Pauses off screen and in a hidden tab. prefers-reduced-motion draws one grown network. */
(function () {
  var host = document.querySelector('.anim-strip');
  if (!host) return;
  var c = host.querySelector('canvas'), g = c.getContext('2d');
  var W = 0, H = 0, last = 0, raf = 0, running = false, seen = true;
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var BLUE = '0,53,107', GREY = '154,160,166';
  var EVERY = 0.75, HOLD = 3, FADE = 1.2;
  var nodes, edges, clock, phase, seed = 11, max = 30;

  function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }

  function start() {
    nodes = []; edges = []; clock = 0; phase = 0;
    max = Math.max(12, Math.min(30, Math.round(W / 26)));
    add(W * 0.5, H * 0.5); add(W * 0.5 + 24, H * 0.4); link(0, 1);
  }
  function add(x, y) { nodes.push({ x: x, y: y, vx: 0, vy: 0, d: 0, age: 0, hy: 12 + rnd() * (H - 24) }); return nodes.length - 1; }
  function link(a, b) { edges.push({ a: a, b: b, age: 0 }); nodes[a].d++; nodes[b].d++; }

  /* pick an existing node with probability proportional to its degree */
  function pick(skip) {
    var tot = 0, i, r;
    for (i = 0; i < nodes.length; i++) if (i !== skip) tot += nodes[i].d;
    r = rnd() * tot;
    for (i = 0; i < nodes.length; i++) { if (i === skip) continue; r -= nodes[i].d; if (r <= 0) return i; }
    return 0;
  }

  function grow() {
    var a = pick(-1), t = nodes[a], ang = rnd() * 6.2832;
    var n = add(t.x + 18 * Math.cos(ang), t.y + 12 * Math.sin(ang));
    link(n, a);
    if (nodes.length > 4 && rnd() < 0.45) { var b = pick(a); if (b !== n) link(n, b); }
  }

  function physics(dt) {
    var i, j, a, b, dx, dy, d2, f, L = Math.max(22, Math.min(40, W / 22)), k = Math.min(1, W / 640), rep = 240 * k * k;
    for (i = 0; i < nodes.length; i++) {
      a = nodes[i];
      for (j = i + 1; j < nodes.length; j++) {
        b = nodes[j]; dx = a.x - b.x; dy = a.y - b.y; d2 = dx * dx + dy * dy + 1;
        if (d2 > 25600) continue;
        f = rep / d2; a.vx += dx * f; a.vy += dy * f * 0.08; b.vx -= dx * f; b.vy -= dy * f * 0.08;
      }
    }
    for (i = 0; i < edges.length; i++) {
      a = nodes[edges[i].a]; b = nodes[edges[i].b]; dx = b.x - a.x; dy = b.y - a.y;
      var d = Math.sqrt(dx * dx + dy * dy) + 0.01; f = (d - L) * 0.04 / d;
      a.vx += dx * f; a.vy += dy * f; b.vx -= dx * f; b.vy -= dy * f;
    }
    for (i = 0; i < nodes.length; i++) {
      a = nodes[i];
      a.vx += (W / 2 - a.x) * 0.003; a.vy += (a.hy - a.y) * 0.03;
      a.vx *= 0.82; a.vy *= 0.82;
      a.x += a.vx * dt * 60; a.y += a.vy * dt * 60;
      a.x = Math.max(14, Math.min(W - 14, a.x)); a.y = Math.max(7, Math.min(H - 7, a.y));
      a.age += dt;
    }
    for (i = 0; i < edges.length; i++) edges[i].age += dt;
  }

  function step(dt) {
    clock += dt;
    if (phase === 0 && clock > EVERY) { clock = 0; grow(); if (nodes.length >= max) phase = 1; }
    else if (phase === 1 && clock > HOLD) { clock = 0; phase = 2; }
    else if (phase === 2 && clock > FADE) { start(); }
    physics(dt);
  }

  function size() {
    var d = Math.min(2, window.devicePixelRatio || 1), first = !W;
    W = host.clientWidth; H = host.clientHeight;
    c.width = Math.round(W * d); c.height = Math.round(H * d);
    g.setTransform(d, 0, 0, d, 0, 0);
    if (first && W) {
      start();
      if (still) { while (nodes.length < max) { grow(); for (var k = 0; k < 8; k++) physics(1 / 60); } for (k = 0; k < 400; k++) physics(1 / 60); }
      else { for (var i = 0; i < 6; i++) { grow(); for (var k2 = 0; k2 < 30; k2++) physics(1 / 60); } }
    }
    draw();
  }

  function draw() {
    if (!W || !nodes) return;
    g.clearRect(0, 0, W, H);
    var fade = phase === 2 ? Math.max(0, 1 - clock / FADE) : 1, i, e, a, b, p;
    g.lineCap = 'round';
    for (i = 0; i < edges.length; i++) {
      e = edges[i]; a = nodes[e.a]; b = nodes[e.b];
      p = Math.min(1, e.age / 0.5);                     /* new edges draw out from the newcomer */
      g.strokeStyle = 'rgba(' + BLUE + ',' + (0.35 * fade) + ')'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(a.x + (b.x - a.x) * p, a.y + (b.y - a.y) * p); g.stroke();
    }
    for (i = 0; i < nodes.length; i++) {
      a = nodes[i]; p = Math.min(1, a.age / 0.4);
      var r = (1.6 + 1.1 * Math.sqrt(a.d)) * p, hub = a.d >= 4;
      g.fillStyle = '#fff';
      g.beginPath(); g.arc(a.x, a.y, r + 1, 0, 6.2832); g.fill();
      if (hub) { g.fillStyle = 'rgba(' + BLUE + ',' + (0.9 * fade) + ')'; g.fill(); }
      else { g.strokeStyle = 'rgba(' + (a.d > 1 ? BLUE : GREY) + ',' + (0.85 * fade) + ')'; g.lineWidth = 1.2; g.stroke(); }
    }
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
