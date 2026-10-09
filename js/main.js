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
    if (FoF.ui && FoF.ui.onEnter) FoF.ui.onEnter(name);
    var h = next.querySelector('h1, h2');
    if (h && name !== 'play') h.focus({ preventScroll: true });
    next.scrollTop = 0;
  };

  document.addEventListener('DOMContentLoaded', function () {
    FoF.ui.init();
    FoF.go('home');
  });
})();
