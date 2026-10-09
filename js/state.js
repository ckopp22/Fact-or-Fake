(function () {
  'use strict';
  var FoF = window.FoF = window.FoF || {};

  var KEY = 'fof.v1';
  var MAX_NAME = 12;
  var INKS = ['#c0392b', '#2c6fbb', '#2e8b57', '#7b4fa0', '#e0782a', '#1f9d9a', '#d6609a', '#7a5230'];
  var TARGETS = [5, 10, 15, 20];

  var saved = { names: [], count: 2, target: 10, muted: false, seen: [] };

  function load() {
    try {
      var raw = JSON.parse(window.localStorage.getItem(KEY) || '{}');
      if (Array.isArray(raw.names)) saved.names = raw.names.slice(0, 8).map(function (n) { return String(n).slice(0, MAX_NAME); });
      if (raw.count >= 2 && raw.count <= 8) saved.count = raw.count | 0;
      if (TARGETS.indexOf(raw.target) >= 0) saved.target = raw.target;
      saved.muted = !!raw.muted;
      if (Array.isArray(raw.seen)) saved.seen = raw.seen.filter(function (x) { return typeof x === 'string'; });
    } catch (e) { /* storage unavailable or corrupt: use defaults */ }
  }

  function save() {
    try { window.localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) { /* ignore */ }
  }

  var state = {
    screen: 'home',
    players: [],      // { id, name, color, score }
    target: 10,
    deck: [],         // statement IDs still to draw
    current: null,
    phase: 'question', // 'question' | 'reveal' | 'won'
    round: 1,
    muted: false,
    awarded: {}       // player id -> true, for the current card only
  };

  function defaultName(i) { return 'Player ' + (i + 1); }

  // Blank names fall back to the default; duplicates get a numeric suffix (all within 12 chars).
  function cleanNames(raw) {
    var used = {};
    return raw.map(function (r, i) {
      var base = String(r || '').trim().slice(0, MAX_NAME) || defaultName(i);
      var name = base, n = 1;
      while (used[name.toLowerCase()]) {
        n++;
        var suffix = ' ' + n;
        name = base.slice(0, MAX_NAME - suffix.length).trim() + suffix;
      }
      used[name.toLowerCase()] = true;
      return name;
    });
  }

  function newGame(rawNames, target) {
    var names = cleanNames(rawNames);
    state.players = names.map(function (name, i) {
      return { id: i, name: name, color: INKS[i], score: 0 };
    });
    state.target = target;
    saved.names = rawNames.map(function (n) { return String(n || '').trim().slice(0, MAX_NAME); });
    saved.count = names.length;
    saved.target = target;
    save();
    resetRound();
  }

  function resetRound() {
    state.round = 1;
    state.current = null;
    state.phase = 'question';
    state.awarded = {};
  }

  function replay() {
    state.players.forEach(function (p) { p.score = 0; });
    resetRound();
  }

  // Returns { ok, won }. Only allowed during REVEAL, once per player per card.
  function award(id) {
    if (state.phase !== 'reveal' || state.awarded[id]) return { ok: false, won: false };
    var p = state.players[id];
    if (!p || p.score >= state.target) return { ok: false, won: false };
    p.score++;
    state.awarded[id] = true;
    if (p.score >= state.target) {
      state.phase = 'won';
      return { ok: true, won: true, player: p };
    }
    return { ok: true, won: false, player: p };
  }

  function undo(id) {
    if (state.phase !== 'reveal' || !state.awarded[id]) return false;
    state.players[id].score--;
    delete state.awarded[id];
    return true;
  }

  function standings() {
    return state.players.slice().sort(function (a, b) { return b.score - a.score || a.id - b.id; });
  }

  function setMuted(m) { state.muted = saved.muted = !!m; save(); }

  load();
  state.muted = saved.muted;

  FoF.state = state;
  FoF.store = {
    saved: saved, save: save, INKS: INKS, TARGETS: TARGETS, MAX_NAME: MAX_NAME,
    defaultName: defaultName, cleanNames: cleanNames, newGame: newGame, replay: replay,
    award: award, undo: undo, standings: standings, setMuted: setMuted
  };
})();
