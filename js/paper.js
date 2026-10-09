(function () {
  'use strict';
  var FoF = window.FoF = window.FoF || {};

  var AMP = 3.5;   // max inward jitter of a torn edge, px
  var CORNER = 22; // cut-off corner (folded flap), px
  var STEP = 12;   // distance between edge points, px
  var seedCounter = 11;

  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // A clip-path polygon whose edges wander like torn paper (random walk, inward only).
  function polygon(w, h, amp, step, rnd, cut) {
    cut = cut || 0;
    var v = rnd() * amp, pts = [], i;
    function walk() {
      v += (rnd() - 0.5) * amp * 1.1;
      if (v < 0) v = 0; else if (v > amp) v = amp;
      return v;
    }
    var nx = Math.max(2, Math.round(w / step)), ny = Math.max(2, Math.round(h / step));
    for (i = 0; i < nx; i++) pts.push([w * i / nx, walk()]);
    for (i = 0; i < ny; i++) if (h * i / ny < h - cut) pts.push([w - walk(), h * i / ny]);
    if (cut) { pts.push([w, h - cut]); pts.push([w - cut, h]); }
    for (i = 0; i < nx; i++) if (w - w * i / nx < w - cut) pts.push([w - w * i / nx, h - walk()]);
    for (i = 0; i < ny; i++) pts.push([walk(), h - h * i / ny]);
    return 'polygon(' + pts.map(function (p) { return p[0].toFixed(1) + 'px ' + p[1].toFixed(1) + 'px'; }).join(',') + ')';
  }

  function decoration(spec) {
    var parts = spec.split(':'), pos = parts[0], kind = parts[1];
    var span = document.createElement('span');
    span.setAttribute('aria-hidden', 'true');
    span.className = 'deco deco-' + pos;
    if (kind === 'tape') {
      span.className += ' tape';
    } else if (kind === 'pin') {
      span.className += ' pin';
      span.innerHTML = '<svg viewBox="0 0 32 44"><use href="#pin"/></svg>';
    } else {
      span.className += ' clip clip-' + kind;
      span.innerHTML = '<svg viewBox="0 0 48 100"><use href="#clip"/></svg>';
    }
    return span;
  }

  function roughen(el) {
    if (el.parentNode && el.parentNode.classList.contains('sheet')) return el.parentNode;
    var wrap = document.createElement('div');
    wrap.className = 'sheet' + (el.getAttribute('data-sheet') ? ' ' + el.getAttribute('data-sheet') : '');
    el.parentNode.insertBefore(wrap, el);
    wrap.appendChild(el);
    el.classList.add('sheet-paper');
    (el.getAttribute('data-clips') || '').split(/\s+/).filter(Boolean).forEach(function (spec) {
      wrap.appendChild(decoration(spec));
    });
    var seed = seedCounter++ * 7919;

    function apply() {
      var w = el.offsetWidth, h = el.offsetHeight;
      if (!w || !h) return;
      el.style.clipPath = polygon(w, h, AMP, STEP, rng(seed), CORNER);
      // lighter "torn fiber" layer peeking out around the edge
      wrap.style.setProperty('--tear', polygon(w + 8, h + 8, AMP + 1.5, STEP * 0.8, rng(seed + 99), CORNER + 6));
    }
    var queued = false;
    function schedule() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; apply(); });
    }
    if (window.ResizeObserver) new ResizeObserver(schedule).observe(el);
    else window.addEventListener('resize', schedule);
    apply();
    return wrap;
  }

  function init() {
    document.querySelectorAll('[data-rough]').forEach(roughen);
  }

  FoF.paper = { init: init, roughen: roughen, polygon: polygon };
})();
