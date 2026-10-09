(function () {
  'use strict';
  var FoF = window.FoF = window.FoF || {};

  var COLORS = ['#f6efdc', '#efe3c4', '#fbf7ea', '#d9a441', '#3e5c76', '#2f7d4f', '#b8322a', '#2c6fbb', '#e0782a', '#d6609a', '#7b4fa0'];
  var MAX_PARTS = 420;
  var BURST_MS = 4000;    // heavy emission, then it settles into a light trickle

  var canvas, g, w = 0, h = 0, dpr = 1;
  var parts = [], raf = 0, running = false, startedAt = 0, last = 0, trickleAcc = 0, small = false;

  function reducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function resize() {
    if (!canvas) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function rand(a, b) { return a + Math.random() * (b - a); }

  function spawn(x, y, vx, vy) {
    if (parts.length >= MAX_PARTS) return;
    var strip = Math.random() < 0.3;
    parts.push({
      x: x, y: y, vx: vx, vy: vy,
      w: strip ? rand(3, 5) : rand(6, 11),
      h: strip ? rand(12, 18) : rand(7, 12),
      rot: rand(0, Math.PI * 2),
      vr: rand(-6, 6),
      fp: rand(0, Math.PI * 2),
      fs: rand(4, 10),
      color: COLORS[(Math.random() * COLORS.length) | 0]
    });
  }

  function cannon(side, count) {
    var x = side < 0 ? -10 : w + 10;
    for (var i = 0; i < count; i++) {
      var ang = rand(-1.25, -0.6);                                  // up and inward
      var speed = rand(520, 980) * (small ? 0.8 : 1);
      spawn(x, h * rand(0.55, 0.85), Math.cos(ang) * speed * -side, Math.sin(ang) * speed);
    }
  }

  function rain(count) {
    for (var i = 0; i < count; i++) spawn(rand(0, w), -14, rand(-40, 40), rand(40, 160));
  }

  function frame(now) {
    if (!running) return;
    var dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    var elapsed = now - startedAt;

    if (elapsed < BURST_MS) {
      var rate = (reducedMotion() ? 18 : 60) * (1 - elapsed / BURST_MS);  // particles per second, fading out
      trickleAcc += rate * dt;
    } else {
      trickleAcc += 5 * dt;                                            // light trickle
    }
    while (trickleAcc >= 1) { rain(1); trickleAcc -= 1; }

    g.clearRect(0, 0, w, h);
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i];
      p.vy = Math.min(p.vy + 900 * dt, 260);                          // gravity with terminal velocity
      p.vx *= Math.pow(0.35, dt);                                      // air drag
      p.x += p.vx * dt + Math.sin(p.fp) * 18 * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      p.fp += p.fs * dt;
      if (p.y > h + 24) { parts.splice(i, 1); continue; }
      g.save();
      g.translate(p.x, p.y);
      g.rotate(p.rot);
      g.scale(1, Math.cos(p.fp));                                      // flutter
      g.fillStyle = p.color;
      g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      g.strokeStyle = 'rgba(43,33,24,.28)';
      g.lineWidth = 1;
      g.strokeRect(-p.w / 2, -p.h / 2, p.w, p.h);
      g.restore();
    }
    raf = requestAnimationFrame(frame);
  }

  function start() {
    canvas = canvas || document.getElementById('confetti');
    if (!canvas) return;
    g = g || canvas.getContext('2d');
    stop();
    resize();
    small = reducedMotion();
    running = true;
    trickleAcc = 0;
    var count = small ? 40 : 110;
    if (small) rain(count);              // calmer: a soft fall instead of cannons
    else { cannon(-1, count / 2); cannon(1, count / 2); rain(40); }
    startedAt = last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(raf);
    parts = [];
    if (g) g.clearRect(0, 0, w, h);
  }

  window.addEventListener('resize', function () { if (running) resize(); });
  FoF.confetti = { start: start, stop: stop };
})();
