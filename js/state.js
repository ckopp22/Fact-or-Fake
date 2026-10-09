(function () {
  'use strict';
  var FoF = window.FoF = window.FoF || {};

  FoF.state = {
    screen: 'home',
    players: [],
    target: 10,
    deck: [],
    current: null,
    phase: 'question',
    round: 1,
    muted: false
  };
})();
