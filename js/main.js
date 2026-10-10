(function () {
  'use strict';
  var FoF = window.FoF = window.FoF || {};

  // Tiny screen router: one .screen is .active, the rest are inert.
  FoF.go = function (name) {
    var next = document.getElementById('screen-' + name);
    if (!next) return;
    document.querySelectorAll('.screen').forEach(function (s) {
      var on = s === next;
      s.classList.toggle('active', on);
      s.setAttribute('aria-hidden', on ? 'false' : 'true');
      if (on) s.removeAttribute('inert'); else s.setAttribute('inert', '');
    });
    FoF.state.screen = name;
    document.body.setAttribute('data-screen', name);
    if (FoF.ui && FoF.ui.onEnter) FoF.ui.onEnter(name);
    var h = next.querySelector('h1, h2');
    if (h && name !== 'play') h.focus({ preventScroll: true });
    next.scrollTop = 0;
    FoF.fit();
  };

  // Last-resort no-scroll guarantee: shrink a screen's content to fit the viewport.
  FoF.fit = function () {
    var screen = document.querySelector('.screen.active');
    var inner = screen && screen.querySelector('.screen-inner');
    if (!inner) return;
    inner.style.zoom = '';
    var over = screen.scrollHeight - screen.clientHeight;
    if (over > 1) inner.style.zoom = Math.max(0.55, (screen.clientHeight - 2) / screen.scrollHeight).toFixed(3);
  };
  window.addEventListener('resize', function () { FoF.fit(); });
  window.addEventListener('orientationchange', function () { setTimeout(FoF.fit, 250); });

  document.addEventListener('DOMContentLoaded', function () {
    FoF.ui.init();
    FoF.go('home');
  });

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
  }
})();
