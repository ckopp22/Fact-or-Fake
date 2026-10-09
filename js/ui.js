(function () {
  'use strict';
  var FoF = window.FoF = window.FoF || {};
  var state = FoF.state, store = FoF.store;

  var NEXT_GUARD_MS = 400;
  var CATS = { ANI: 'Animals', SCI: 'Science & Space', HIS: 'History', LIFE: 'Life & World', TECH: 'Tech & Pop Culture' };
  var CROWN = '<svg class="crown" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 18l-1-11 5.5 4L12 4l4.5 7L22 7l-1 11z" fill="#d9a441" stroke="#2b2118" stroke-width="1.5" stroke-linejoin="round"/></svg>';

  var $ = function (id) { return document.getElementById(id); };
  var els = {};
  var setup = { count: 2, names: [], target: 10 };
  var revealAt = 0;
  var busy = false;
  var timers = [];

  function reduced() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  function later(fn, ms) {
    var t = setTimeout(function () { timers = timers.filter(function (x) { return x !== t; }); fn(); }, ms);
    timers.push(t);
  }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }
  function audio(name) {
    var a = FoF.audio;
    if (a && a[name]) a[name].apply(a, Array.prototype.slice.call(arguments, 1));
  }
  function restartClass(el, cls) {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  /* ---------------- setup screen ---------------- */

  function renderSetup() {
    $('count-val').textContent = setup.count;
    $('count-dec').disabled = setup.count <= 2;
    $('count-inc').disabled = setup.count >= 8;
    var list = els.nameList;
    list.innerHTML = '';
    for (var i = 0; i < setup.count; i++) {
      var li = document.createElement('li');
      li.style.setProperty('--ink-color', store.INKS[i]);
      li.innerHTML = '<span class="dot" aria-hidden="true"></span>';
      var input = document.createElement('input');
      input.type = 'text';
      input.maxLength = store.MAX_NAME;
      input.value = setup.names[i];
      input.placeholder = store.defaultName(i);
      input.autocomplete = 'off';
      input.autocapitalize = 'words';
      input.spellcheck = false;
      input.setAttribute('aria-label', 'Name for player ' + (i + 1));
      input.dataset.i = i;
      li.appendChild(input);
      list.appendChild(li);
    }
    Array.prototype.forEach.call(els.targetChips.children, function (b) {
      b.setAttribute('aria-checked', String(+b.dataset.target === setup.target));
    });
  }

  function initSetup() {
    var s = store.saved;
    setup.count = s.count;
    setup.target = s.target;
    for (var i = 0; i < 8; i++) setup.names[i] = s.names[i] || store.defaultName(i);
    renderSetup();
  }

  function bindSetup() {
    function step(d) {
      setup.count = Math.max(2, Math.min(8, setup.count + d));
      renderSetup();
    }
    $('count-dec').addEventListener('click', function () { step(-1); });
    $('count-inc').addEventListener('click', function () { step(1); });
    els.nameList.addEventListener('input', function (e) {
      if (e.target.dataset && e.target.dataset.i != null) setup.names[+e.target.dataset.i] = e.target.value;
    });
    els.nameList.addEventListener('focusin', function (e) {
      if (e.target.select) e.target.select();
    });
    els.targetChips.addEventListener('click', function (e) {
      var b = e.target.closest('.target-chip');
      if (!b) return;
      setup.target = +b.dataset.target;
      renderSetup();
    });
    $('btn-start').addEventListener('click', startGame);
  }

  /* ---------------- gameplay ---------------- */

  function startGame() {
    store.newGame(setup.names.slice(0, setup.count), setup.target);
    FoF.deck.refill();
    beginPlay();
  }

  function beginPlay() {
    clearTimers();
    busy = false;
    buildChips();
    $('target-label').textContent = 'Playing to ' + state.target;
    FoF.go('play');
    showCard(false);
  }

  function buildChips() {
    var box = els.chips;
    box.innerHTML = '';
    state.players.forEach(function (p) {
      var chip = document.createElement('div');
      chip.className = 'chip inactive';
      chip.dataset.id = p.id;
      chip.style.setProperty('--ink-color', p.color);
      chip.innerHTML =
        '<button class="chip-main" type="button" data-silent aria-disabled="true">' +
        '<span class="dot" aria-hidden="true"></span><span class="name"></span><span class="score"></span></button>' +
        '<button class="chip-undo" type="button" data-silent hidden>&minus;</button>';
      chip.querySelector('.name').textContent = p.name;
      chip.querySelector('.chip-undo').setAttribute('aria-label', 'Undo point for ' + p.name);
      box.appendChild(chip);
    });
    updateChips();
  }

  function updateChips() {
    var active = state.phase === 'reveal';
    Array.prototype.forEach.call(els.chips.children, function (chip) {
      var id = +chip.dataset.id, p = state.players[id], got = !!state.awarded[id];
      chip.classList.toggle('inactive', !active && !got);
      chip.classList.toggle('awarded', got);
      chip.querySelector('.score').textContent = p.score;
      var main = chip.querySelector('.chip-main');
      main.setAttribute('aria-disabled', String(!active || got));
      main.setAttribute('aria-label', p.name + ', ' + p.score + (p.score === 1 ? ' point' : ' points') + (active && !got ? '. Tap to add a point' : ''));
      chip.querySelector('.chip-undo').hidden = !got;
    });
  }

  function showCard(animate) {
    var card = FoF.deck.draw();
    state.phase = 'question';
    state.awarded = {};
    var el = els.card, wrap = els.cardWrap;
    el.classList.remove('revealed');
    wrap.classList.remove('leaving', 'flipping', 'entering');
    wrap.style.setProperty('--rot', (Math.random() * 4 - 2).toFixed(2) + 'deg');
    el.setAttribute('role', 'button');
    el.tabIndex = 0;
    $('card-cat').textContent = CATS[card.cat] || '';
    $('card-text').textContent = card.text;
    $('card-reveal').hidden = true;
    $('card-hint').hidden = false;
    $('stamp').className = 'stamp';
    $('lock-hint').textContent = 'Lock in your answers!';
    $('round-label').textContent = 'Round ' + state.round;
    els.next.disabled = true;
    els.cardArea.classList.remove('shake');
    if (!reduced()) restartClass(wrap, 'entering');
    audio('whoosh');
    updateChips();
  }

  function reveal() {
    if (state.phase !== 'question' || busy) return;
    state.phase = 'reveal';
    revealAt = performance.now();
    var card = state.current;
    els.next.disabled = false;
    $('lock-hint').textContent = 'Who got it right? Tap your name!';
    updateChips();
    if (reduced()) { showReveal(card); return; }
    els.cardWrap.classList.remove('entering');
    restartClass(els.cardWrap, 'flipping');
    later(function () { showReveal(card); }, 240);
  }

  function showReveal(card) {
    var stamp = $('stamp');
    var word = card.answer ? 'FACT' : 'FAKE';
    stamp.textContent = word;
    stamp.className = 'stamp ' + (card.answer ? 'is-fact' : 'is-fake');
    $('reveal-text').innerHTML = '<span class="sr-only">' + word + '. </span>';
    $('reveal-text').appendChild(document.createTextNode(card.reveal));
    $('card-reveal').hidden = false;
    $('card-hint').hidden = true;
    els.card.classList.add('revealed');
    els.card.removeAttribute('role');
    els.card.tabIndex = -1;
    if (!reduced()) {
      restartClass(stamp, 'slam');
      restartClass($('reveal-text'), 'fade');
      restartClass(els.cardArea, 'shake');
    }
    audio('reveal', card.answer);
    if (document.activeElement === els.card) els.next.focus({ preventScroll: true });
  }

  function nextCard() {
    if (state.phase !== 'reveal' || busy) return;
    if (performance.now() - revealAt < NEXT_GUARD_MS) return;
    busy = true;
    var go = function () {
      state.round++;
      showCard(true);
      later(function () { busy = false; }, reduced() ? 0 : 350);
    };
    if (reduced()) { go(); return; }
    els.cardWrap.classList.remove('entering', 'flipping');
    els.cardWrap.classList.add('leaving');
    later(go, 280);
  }

  function award(id, chip) {
    var res = store.award(id);
    if (!res.ok) return;
    updateChips();
    var f = document.createElement('span');
    f.className = 'float';
    f.textContent = '+1';
    chip.appendChild(f);
    f.addEventListener('animationend', function () { f.remove(); });
    later(function () { f.remove(); }, 1000);
    audio('pop', res.player.score);
    if (res.won) later(function () { showWin(res.player); }, reduced() ? 100 : 700);
  }

  function undo(id) {
    if (store.undo(id)) {
      updateChips();
      audio('undo');
    }
  }

  function bindPlay() {
    var play = $('screen-play');
    play.addEventListener('click', function (e) {
      if (e.target.closest('.topbar')) return;
      if (state.phase === 'question') {
        if (e.target.closest('#card')) reveal();
      } else if (state.phase === 'reveal') {
        nextCard();
      }
    });
    els.card.addEventListener('keydown', function (e) {
      if ((e.key === 'Enter' || e.key === ' ') && state.phase === 'question') {
        e.preventDefault();
        reveal();
      }
    });
    // Chip taps never advance the card.
    els.chips.addEventListener('click', function (e) {
      e.stopPropagation();
      var chip = e.target.closest('.chip');
      if (!chip) return;
      var id = +chip.dataset.id;
      if (e.target.closest('.chip-undo')) undo(id); else award(id, chip);
    });
    ['animationend'].forEach(function (ev) {
      els.cardWrap.addEventListener(ev, function (e) {
        if (e.target !== els.cardWrap) return;
        if (e.animationName === 'cardIn') els.cardWrap.classList.remove('entering');
        if (e.animationName === 'flip') els.cardWrap.classList.remove('flipping');
      });
      els.cardArea.addEventListener(ev, function (e) {
        if (e.animationName === 'shake') els.cardArea.classList.remove('shake');
      });
    });

    var dlg = $('dlg-exit');
    $('btn-exit').addEventListener('click', function () {
      if (dlg.showModal) dlg.showModal();
      else if (window.confirm('Leave this game? Scores will be lost.')) exitToMenu();
    });
    $('exit-cancel').addEventListener('click', function () { dlg.close(); });
    $('exit-confirm').addEventListener('click', function () { dlg.close(); exitToMenu(); });
  }

  function exitToMenu() {
    clearTimers();
    busy = false;
    state.phase = 'question';
    FoF.go('home');
  }

  /* ---------------- win screen ---------------- */

  function showWin(winner) {
    state.phase = 'won';
    $('win-title').textContent = winner.name;
    var board = $('board');
    board.innerHTML = '';
    store.standings().forEach(function (p, i) {
      var li = document.createElement('li');
      li.style.setProperty('--ink-color', p.color);
      if (p.id === winner.id) li.className = 'is-winner';
      li.innerHTML = '<span class="rank"></span><span class="dot" aria-hidden="true"></span><span class="name"></span><span class="pts"></span>';
      if (p.id === winner.id) li.querySelector('.rank').innerHTML = CROWN; else li.querySelector('.rank').textContent = i + 1;
      li.querySelector('.name').textContent = p.name;
      li.querySelector('.pts').textContent = p.score;
      board.appendChild(li);
    });
    FoF.go('win');
    if (FoF.confetti) FoF.confetti.start();
    audio('fanfare');
  }

  function bindWin() {
    $('btn-again').addEventListener('click', function () {
      store.replay();
      beginPlay();
    });
    $('btn-menu').addEventListener('click', function () {
      state.phase = 'question';
      FoF.go('home');
    });
  }

  /* ---------------- global ---------------- */

  function syncMute() {
    var b = $('btn-mute');
    b.setAttribute('aria-pressed', String(state.muted));
    b.setAttribute('aria-label', state.muted ? 'Unmute sound' : 'Mute sound');
    audio('setMuted', state.muted);
  }

  function init() {
    els.nameList = $('name-list');
    els.targetChips = $('target-chips');
    els.chips = $('chips');
    if (FoF.paper) FoF.paper.init();
    els.card = $('card');
    els.cardWrap = els.card.parentNode.classList.contains('sheet') ? els.card.parentNode : els.card;
    els.cardArea = $('card-area');
    els.next = $('btn-next');

    document.addEventListener('click', function (e) {
      var go = e.target.closest('[data-go]');
      if (go) FoF.go(go.getAttribute('data-go'));
    });
    // Browsers only allow audio after a gesture.
    ['pointerdown', 'keydown'].forEach(function (ev) {
      document.addEventListener(ev, function () { audio('unlock'); }, { capture: true, passive: true });
    });
    document.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (b && !b.disabled && !b.hasAttribute('data-silent')) audio('tick');
    }, true);
    $('btn-mute').addEventListener('click', function () {
      store.setMuted(!state.muted);
      syncMute();
    });

    // Gentle parallax on the book stack (mouse only).
    var books = document.querySelector('.books');
    document.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse' || !books || state.screen !== 'home') return;
      books.style.setProperty('--px', (e.clientX / window.innerWidth * 2 - 1).toFixed(2));
    });

    bindSetup();
    bindPlay();
    bindWin();
    initSetup();
    syncMute();
  }

  function onEnter(name) {
    if (name !== 'win' && FoF.confetti) FoF.confetti.stop();
    if (name === 'setup') initSetup();
  }

  FoF.ui = { init: init, onEnter: onEnter };
})();
