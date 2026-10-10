// Verifies data/statements.js: counts, unique IDs, lengths and (if MDD.md is present) a match against the appendix tables.
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
const ctx = { window: {} };
['statements', 'easy', 'hard'].forEach(f => vm.runInNewContext(fs.readFileSync(path.join(root, `data/${f}.js`), 'utf8'), ctx));
const ALL = ctx.window.STATEMENTS;
let bad = 0;
let S = ALL;
const fail = m => { bad++; console.log('FAIL:', m); };

['easy', 'medium', 'hard'].forEach(d => {
  const L = ALL.filter(s => s.diff === d);
  const t = L.filter(s => s.answer).length;
  console.log(d, L.length, 'facts', t);
  if (L.length !== 250 || t !== 125) fail(d + ' counts');
});
if (new Set(ALL.map(s => s.id)).size !== ALL.length) fail('duplicate ids across levels');
S = ALL.filter(s => s.diff === 'medium');

const facts = S.filter(s => s.answer === true), fakes = S.filter(s => s.answer === false);
console.log(`total ${S.length}, facts ${facts.length}, fakes ${fakes.length}`);
if (S.length !== 250 || facts.length !== 125 || fakes.length !== 125) fail('counts');
if (new Set(S.map(s => s.id)).size !== S.length) fail('duplicate ids');
S.forEach(s => {
  if ((s.answer ? 'F' : 'X') !== s.id[0]) fail('id/answer mismatch ' + s.id);
  if (s.text.length >= 130) console.log('note: statement', s.id, s.text.length, 'chars');
  if (s.reveal.length >= 220) console.log('note: reveal', s.id, s.reveal.length, 'chars');
});
const cats = {};
S.forEach(s => { const k = s.cat + (s.answer ? ' fact' : ' fake'); cats[k] = (cats[k] || 0) + 1; });
console.log(cats);

const mddPath = path.join(root, 'MDD.md');
if (fs.existsSync(mddPath)) {
  const rows = {};
  fs.readFileSync(mddPath, 'utf8').split('\n').forEach(l => {
    const m = l.match(/^\| ([FX]\d{3}) \| (.*) \| (.*) \|$/);
    if (m) rows[m[1]] = { text: m[2], reveal: m[3] };
  });
  console.log('appendix rows parsed:', Object.keys(rows).length);
  S.forEach(s => {
    const r = rows[s.id];
    if (!r) return fail('not in MDD ' + s.id);
    if (r.text !== s.text) fail(s.id + ' text differs\n  mdd: ' + r.text + '\n  js:  ' + s.text);
    if (r.reveal !== s.reveal) fail(s.id + ' reveal differs\n  mdd: ' + r.reveal + '\n  js:  ' + s.reveal);
  });
}
console.log(bad ? bad + ' problem(s)' : 'OK');
process.exit(bad ? 1 : 0);
