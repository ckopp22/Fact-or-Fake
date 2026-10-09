"""Plays all 250 cards through the real UI with prefers-reduced-motion on. Checks stamp == answer, reveal text shown,
no repeats, no streak > 3, and that reduced motion skips the flip/slam animations."""
import sys, pathlib
from playwright.sync_api import sync_playwright
root = pathlib.Path(__file__).resolve().parent.parent
with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome')
    page = b.new_context(viewport={'width': 390, 'height': 780}, reduced_motion='reduce').new_page()
    errs = []; page.on('pageerror', lambda e: errs.append(str(e)))
    page.goto(f'file://{root}/index.html'); page.wait_for_selector('#screen-home.active')
    page.evaluate('localStorage.clear()'); page.reload(); page.wait_for_selector('#screen-home.active')
    page.click('text=PLAY'); page.click('[data-target="20"]'); page.click('#btn-start'); page.wait_for_selector('#screen-play.active')
    page.wait_for_timeout(300)
    result = page.evaluate("""async () => {
      const wait = ms => new Promise(r => setTimeout(r, ms));
      const seen = [], bad = [];
      const card = document.getElementById('card');
      for (let i = 0; i < 250; i++) {
        const cur = FoF.state.current; seen.push(cur);
        card.click(); await wait(10);
        const stamp = document.getElementById('stamp').textContent;
        const reveal = document.getElementById('reveal-text').textContent;
        if (stamp !== (cur.answer ? 'FACT' : 'FAKE')) bad.push(cur.id + ' stamp ' + stamp);
        if (!reveal.includes(cur.reveal)) bad.push(cur.id + ' reveal text');
        if (document.getElementById('card').parentNode.classList.contains('flipping')) bad.push('flip animation ran under reduced motion');
        if (i < 249) { await wait(420); document.getElementById('card-area').dispatchEvent(new MouseEvent('click', {bubbles: true})); await wait(20); }
      }
      let run = 1, max = 1;
      for (let i = 1; i < seen.length; i++) { run = seen[i].answer === seen[i - 1].answer ? run + 1 : 1; max = Math.max(max, run); }
      return { n: seen.length, unique: new Set(seen.map(s => s.id)).size, maxRun: max, bad, seenSaved: JSON.parse(localStorage.getItem('fof.v1')).seen.length };
    }""")
    print(result)
    ok = result['n'] == 250 and result['unique'] == 250 and result['maxRun'] <= 3 and not result['bad'] and result['seenSaved'] == 250 and not errs
    print('ALL CARDS OK' if ok else f'FAILED {errs}'); b.close(); sys.exit(0 if ok else 1)
