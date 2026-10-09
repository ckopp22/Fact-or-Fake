// Headless checks for deck + scoring logic (state.js, deck.js).
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
const store = {};
const win = { localStorage: { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = v; } } };
win.window = win;
const ctx = vm.createContext(win);
['data/statements.js', 'js/state.js', 'js/deck.js'].forEach(f => vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx));
const FoF = win.FoF;
let bad = 0;
const ok = (c, m) => { if (!c) { bad++; console.log('FAIL:', m); } };

// names
const n = FoF.store.cleanNames(['Sam', 'sam', '', '', 'Sam', 'Abcdefghijkl', 'Abcdefghijkl']);
console.log(n);
ok(n[0] === 'Sam' && n[1] === 'sam 2' && n[2] === 'Player 3' && n[3] === 'Player 4' && n[4] === 'Sam 3', 'name cleanup');
ok(n.every(x => x.length <= 12) && new Set(n.map(x => x.toLowerCase())).size === n.length, 'name length/uniqueness');

// deck: 250 draws with no repeats, no streak > 3, across several shuffles
for (let r = 0; r < 200; r++) {
  const ids = win.STATEMENTS.map(s => s.id);
  const d = FoF.deck.build(ids);
  ok(new Set(d).size === 250, 'deck has all 250 unique');
  const map = Object.fromEntries(win.STATEMENTS.map(s => [s.id, s.answer]));
  let run = 1, max = 1;
  for (let i = 1; i < d.length; i++) { run = map[d[i]] === map[d[i - 1]] ? run + 1 : 1; max = Math.max(max, run); }
  ok(max <= 3, 'streak ' + max);
}

// drawing everything: no repeats, then auto reshuffle
FoF.store.newGame(['A', 'B'], 5);
FoF.deck.refill();
const seen = new Set();
for (let i = 0; i < 250; i++) { const c = FoF.deck.draw(); ok(!seen.has(c.id), 'repeat ' + c.id); seen.add(c.id); }
ok(FoF.store.saved.seen.length === 250, 'seen tracked');
const c251 = FoF.deck.draw();
ok(FoF.store.saved.seen.length === 1 && c251, 'seen cleared and reshuffled after 250');

// scoring + win at exactly target, for every target
for (const t of [5, 10, 15, 20]) {
  FoF.store.newGame(['A', 'B', 'C'], t);
  const S = FoF.state;
  ok(!FoF.store.award(0).ok, 'no award in question phase');
  let won = false;
  for (let card = 0; card < t; card++) {
    S.phase = 'reveal'; S.awarded = {};
    const r = FoF.store.award(0);
    ok(r.ok, 'award ok');
    ok(!FoF.store.award(0).ok, 'no double award per card');
    if (card === 0) { ok(FoF.store.undo(0) && S.players[0].score === 0, 'undo'); ok(FoF.store.award(0).ok, 're-award after undo'); }
    if (card < t - 1) ok(!r.won, 'early win'); else won = r.won;
  }
  ok(won && S.players[0].score === t && S.phase === 'won', 'win at exactly ' + t);
  ok(!FoF.store.award(1).ok && !FoF.store.undo(0), 'no changes after win');
  FoF.store.replay();
  ok(S.players.every(p => p.score === 0) && S.phase === 'question', 'replay resets');
}
console.log(bad ? bad + ' problem(s)' : 'OK');
process.exit(bad ? 1 : 0);
