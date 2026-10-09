(function () {
  'use strict';
  var FoF = window.FoF = window.FoF || {};

  function init() {
    document.addEventListener('click', function (e) {
      var go = e.target.closest('[data-go]');
      if (go) FoF.go(go.getAttribute('data-go'));
    });
  }

  FoF.ui = { init: init };
})();
