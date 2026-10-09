(function () {
  'use strict';
  var FoF = window.FoF = window.FoF || {};

  var MAX_RUN = 3;

  function byId() {
    var map = {};
    window.STATEMENTS.forEach(function (s) { map[s.id] = s; });
    return map;
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // No more than MAX_RUN consecutive cards with the same answer: whenever the last MAX_RUN
  // placed cards agree, pull the next card with the opposite answer forward.
  function breakStreaks(cards) {
    var rest = cards.slice(), out = [];
    while (rest.length) {
      var pick = 0, n = out.length;
      if (n >= MAX_RUN) {
        var last = out[n - 1].answer, run = true;
        for (var k = 2; k <= MAX_RUN; k++) if (out[n - k].answer !== last) { run = false; break; }
        if (run) {
          for (var j = 0; j < rest.length; j++) if (rest[j].answer !== last) { pick = j; break; }
        }
      }
      out.push(rest.splice(pick, 1)[0]);
    }
    return out;
  }

  function longestRun(cards) {
    var run = 1, max = cards.length ? 1 : 0;
    for (var i = 1; i < cards.length; i++) {
      run = cards[i].answer === cards[i - 1].answer ? run + 1 : 1;
      if (run > max) max = run;
    }
    return max;
  }

  // Shuffle, then enforce the streak rule. A greedy pass can strand a run at the very end when one
  // answer type runs out first, so retry until the whole deck passes (or keep the best attempt).
  function build(ids) {
    var map = byId();
    var cards = ids.map(function (id) { return map[id]; });
    var best = null, bestRun = Infinity;
    for (var tries = 0; tries < 200; tries++) {
      var attempt = breakStreaks(shuffle(cards));
      var run = longestRun(attempt);
      if (run < bestRun) { best = attempt; bestRun = run; }
      if (run <= MAX_RUN) break;
    }
    return best.map(function (s) { return s.id; });
  }

  // Unseen cards first. When all have been seen, clear the seen list and reshuffle everything.
  function refill() {
    var saved = FoF.store.saved;
    var seen = {};
    saved.seen.forEach(function (id) { seen[id] = true; });
    var unseen = window.STATEMENTS.map(function (s) { return s.id; }).filter(function (id) { return !seen[id]; });
    if (!unseen.length) {
      saved.seen = [];
      FoF.store.save();
      unseen = window.STATEMENTS.map(function (s) { return s.id; });
    }
    FoF.state.deck = build(unseen);
  }

  function draw() {
    if (!FoF.state.deck.length) refill();
    var id = FoF.state.deck.shift();
    var saved = FoF.store.saved;
    if (saved.seen.indexOf(id) < 0) saved.seen.push(id);
    FoF.store.save();
    var card = byId()[id];
    FoF.state.current = card;
    return card;
  }

  FoF.deck = { shuffle: shuffle, breakStreaks: breakStreaks, build: build, refill: refill, draw: draw, MAX_RUN: MAX_RUN };
})();
