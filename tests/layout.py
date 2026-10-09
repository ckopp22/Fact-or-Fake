"""Responsive checks across viewports, incl. worst case: 8 players with 12-char names + the longest statement and reveal."""
import sys, pathlib
from playwright.sync_api import sync_playwright
root = pathlib.Path(__file__).resolve().parent.parent
shots = sys.argv[sys.argv.index('--shots') + 1] if '--shots' in sys.argv else None
VIEWPORTS = {'se1-320x568': (320, 568), 'iphone-390x780': (390, 780), 'landscape-667x375': (667, 375), 'tablet-820x1180': (820, 1180), 'desktop-1440x900': (1440, 900)}
fails = []
def check(c, m):
    if not c: fails.append(m); print('FAIL', m)

# every interactive/text element of the active screen must be inside the viewport horizontally
INSIDE = """() => [...document.querySelectorAll('.screen.active button, .screen.active input, .screen.active .sheet-paper, .screen.active .chip, .screen.active h1, .screen.active h2, #btn-mute')]
  .filter(e => e.offsetParent !== null || e.id === 'btn-mute')
  .filter(e => { const r = e.getBoundingClientRect(); return r.width && (r.left < -1 || r.right > innerWidth + 1); })
  .map(e => (e.className || e.tagName) + ' ' + Math.round(e.getBoundingClientRect().left) + '..' + Math.round(e.getBoundingClientRect().right))"""

with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome')
    for name, (w, h) in VIEWPORTS.items():
        page = b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=1).new_page()
        errs = []; page.on('pageerror', lambda e: errs.append(str(e)))
        page.goto(f'file://{root}/index.html'); page.wait_for_selector('#screen-home.active'); page.wait_for_timeout(300)
        def inside(tag):
            bad = page.evaluate(INSIDE); check(not bad, f'{name} {tag}: outside viewport {bad}')
        def shot(n):
            if shots: page.screenshot(path=f'{shots}/{name}-{n}.png')
        inside('home'); shot('1home')
        # the whole title banner and both buttons reachable (not hidden under the books) without overlap
        page.click('text=HOW TO PLAY'); page.wait_for_timeout(450); inside('how'); shot('2how')
        if w < 600 and not (w > h):
            fits = page.evaluate('(() => { const s = document.querySelector("#screen-how"); return s.scrollHeight <= s.clientHeight + 1; })()')
            check(fits, f'{name}: how-to-play fits without scrolling')
        page.click('#screen-how >> text=GOT IT'); page.wait_for_timeout(450)
        page.click('text=PLAY'); page.wait_for_timeout(450)
        for _ in range(6): page.click('#count-inc')
        for i in range(8): page.fill(f'#name-list input >> nth={i}', 'WWWWWWWWWWWW')
        inside('setup'); shot('3setup8')
        page.click('#btn-start'); page.wait_for_selector('#screen-play.active'); page.wait_for_timeout(800)
        page.evaluate("""() => { const S = window.STATEMENTS; const L = S.reduce((a, s) => (s.text.length + s.reveal.length > a.text.length + a.reveal.length ? s : a));
          FoF.state.deck.unshift(L.id); window.__L = L; }""")
        page.click('#card'); page.wait_for_timeout(500)                      # reveal the first card
        page.click('#card-area', position={'x': 3, 'y': 3}); page.wait_for_timeout(900)   # next -> longest card
        check(page.inner_text('#card-text') == page.evaluate('__L.text'), f'{name}: longest card is showing')
        shot('4play-question')
        page.click('#card'); page.wait_for_timeout(1000); inside('play'); shot('5play-reveal')
        g = page.evaluate("""() => { const R = s => document.querySelector(s).getBoundingClientRect(); const c = document.getElementById('card');
          return { overflow: c.scrollHeight - c.clientHeight, fit: getComputedStyle(c).getPropertyValue('--fit'), cardTop: R('#card').top, cardBottom: R('#card').bottom,
                   areaTop: R('#card-area').top, areaBottom: R('#card-area').bottom, topbarBottom: R('.topbar').bottom, vh: innerHeight, nextBottom: R('#btn-next').bottom,
                   minTap: Math.min(...[...document.querySelectorAll('.chip-main, .chip-undo, #btn-next, #btn-exit, #btn-mute')].filter(e => e.offsetParent).map(e => Math.min(e.getBoundingClientRect().height, e.getBoundingClientRect().width))) }; }""")
        print(name, g)
        check(g['cardTop'] >= g['topbarBottom'] - 8 or g['cardTop'] >= g['areaTop'] - 8, f'{name}: card overlaps top bar')
        check(g['nextBottom'] <= g['vh'] + 1, f'{name}: next button on screen')
        check(g['overflow'] <= 1, f'{name}: worst-case card fits without scrolling (overflow {g["overflow"]}, fit {g["fit"]})')
        check(g['minTap'] >= 44, f'{name}: tap targets >= 44px ({g["minTap"]})')
        check(not errs, f'{name}: page errors {errs}')
        page.context.close()
    b.close()
print('LAYOUT OK' if not fails else f'{len(fails)} FAILED'); sys.exit(1 if fails else 0)
