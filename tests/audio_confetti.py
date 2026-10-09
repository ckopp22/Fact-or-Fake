"""Audio + confetti checks (Playwright + system Chrome)."""
import sys, pathlib
from playwright.sync_api import sync_playwright
root = pathlib.Path(__file__).resolve().parent.parent

INIT = """
window.__a = {ctx: 0, starts: 0, errors: []};
const AC = window.AudioContext;
window.AudioContext = function () {
  window.__a.ctx++;
  const c = new AC();
  for (const m of ['createOscillator', 'createBufferSource']) {
    const orig = c[m].bind(c);
    c[m] = function () { const n = orig(); const s = n.start.bind(n); n.start = function (...a) { window.__a.starts++; return s(...a); }; return n; };
  }
  return c;
};
window.addEventListener('error', e => window.__a.errors.push(String(e.message)));
"""
fails = []
def check(c, m):
    print(('ok   ' if c else 'FAIL ') + m)
    if not c: fails.append(m)

with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome', args=['--autoplay-policy=no-user-gesture-required'])
    page = b.new_context(viewport={'width': 390, 'height': 780}).new_page()
    page.add_init_script(INIT)
    errs = []
    page.on('pageerror', lambda e: errs.append(str(e)))
    page.goto(f'file://{root}/index.html'); page.wait_for_selector('#screen-home.active')
    page.evaluate("""() => { window.__conf = 0; const s = FoF.confetti.start; FoF.confetti.start = function () { window.__conf++; return s.apply(this, arguments); }; }""")
    check(page.evaluate('window.__a.ctx') == 0, 'no AudioContext before first tap')
    page.click('text=PLAY'); page.wait_for_selector('#screen-setup.active')
    check(page.evaluate('window.__a.ctx') == 1, 'AudioContext created on first tap')
    page.click('[data-target="5"]'); page.click('#btn-start'); page.wait_for_selector('#screen-play.active'); page.wait_for_timeout(600)
    n0 = page.evaluate('window.__a.starts'); check(n0 > 0, f'sounds scheduled (button tick + card whoosh): {n0}')
    page.click('#card'); page.wait_for_timeout(500)
    n1 = page.evaluate('window.__a.starts'); check(n1 > n0, 'reveal sound plays')
    page.click('.chip[data-id="0"] .chip-main', force=True)
    n2 = page.evaluate('window.__a.starts'); check(n2 > n1, 'pop sound plays on +1')
    # mute: nothing more is scheduled
    page.click('#btn-mute'); n3 = page.evaluate('window.__a.starts')
    page.click('.chip[data-id="0"] .chip-undo', force=True); page.click('.chip[data-id="1"] .chip-main', force=True)
    page.click('#card-area', position={'x': 5, 'y': 5}); page.wait_for_timeout(700)
    check(page.evaluate('window.__a.starts') == n3, 'muted: no sounds scheduled')
    page.click('#btn-mute')  # unmute
    # play to a win for player 0
    for _ in range(10):
        if page.evaluate('FoF.state.phase') == 'won': break
        if page.evaluate('FoF.state.phase') == 'question': page.click('#card'); page.wait_for_timeout(450)
        page.click('.chip[data-id="0"] .chip-main', force=True)
        if page.evaluate('FoF.state.phase') == 'won': break
        page.click('#card-area', position={'x': 5, 'y': 5}); page.wait_for_timeout(700)
    page.wait_for_selector('#screen-win.active', timeout=3000)
    pre = page.evaluate('window.__a.starts')
    page.wait_for_timeout(1200)
    check(page.evaluate('window.__conf') == 1, 'confetti started exactly once')
    drawn = page.evaluate("""() => { const c = document.getElementById('confetti'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++; return n; }""")
    check(drawn > 500, f'confetti pixels drawn: {drawn}')
    check(pre > n3, 'fanfare scheduled on win')
    if len(sys.argv) > 1: page.screenshot(path=sys.argv[1])
    page.wait_for_timeout(4500)
    after = page.evaluate("""() => { const c = document.getElementById('confetti'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++; return n; }""")
    check(0 < after < drawn, f'settles to a light trickle after burst: {after} px (was {drawn})')
    page.click('#btn-menu'); page.wait_for_selector('#screen-home.active'); page.wait_for_timeout(200)
    gone = page.evaluate("""() => { const c = document.getElementById('confetti'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; return d.some((v, i) => i % 4 === 3 && v > 0); }""")
    check(not gone, 'confetti cleared when leaving win screen')
    check(not errs and not page.evaluate('window.__a.errors.length'), f'no page errors {errs}')
    b.close()
print('AUDIO/CONFETTI OK' if not fails else f'{len(fails)} FAILED'); sys.exit(1 if fails else 0)
