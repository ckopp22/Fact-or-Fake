"""End-to-end smoke test (Playwright + system Chrome). Usage: python3 tests/smoke.py [--shots DIR]"""
import sys, os, pathlib
from playwright.sync_api import sync_playwright

root = pathlib.Path(__file__).resolve().parent.parent
shots = sys.argv[sys.argv.index('--shots') + 1] if '--shots' in sys.argv else None
errors = []

def shot(page, name):
    if shots:
        os.makedirs(shots, exist_ok=True)
        page.screenshot(path=f'{shots}/{name}.png')

with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome')
    ctx = b.new_context(viewport={'width': 390, 'height': 780}, device_scale_factor=2, has_touch=True)
    page = ctx.new_page()
    page.on('pageerror', lambda e: errors.append(f'pageerror: {e}'))
    page.on('console', lambda m: errors.append(f'console.{m.type}: {m.text}') if m.type == 'error' and 'fonts.g' not in m.text and 'ERR_' not in m.text else None)
    page.goto(f'file://{root}/index.html')
    page.wait_for_selector('#screen-home.active')
    shot(page, '1-home')

    page.click('text=HOW TO PLAY'); page.wait_for_selector('#screen-how.active'); page.wait_for_timeout(350); shot(page, '2-how')
    page.click('#screen-how >> text=GOT IT'); page.wait_for_selector('#screen-home.active')

    page.click('text=PLAY'); page.wait_for_selector('#screen-setup.active'); page.wait_for_timeout(350)
    for _ in range(6): page.click('#count-inc')
    assert page.inner_text('#count-val') == '8'
    assert page.is_disabled('#count-inc')
    for _ in range(6): page.click('#count-dec')
    page.fill('#name-list input >> nth=0', 'Sam'); page.fill('#name-list input >> nth=1', 'sam')
    page.click('[data-target="5"]')
    shot(page, '3-setup')
    page.click('#btn-start'); page.wait_for_selector('#screen-play.active'); page.wait_for_timeout(700)
    names = page.eval_on_selector_all('.chip .name', 'e => e.map(x => x.textContent)')
    assert names == ['Sam', 'sam 2'], names
    shot(page, '4-question')

    cards = 0
    while True:
        cards += 1
        assert page.evaluate('FoF.state.phase') == 'question'
        # chips inactive in QUESTION
        ans = page.evaluate('FoF.state.current.answer')
        page.click('#card'); page.wait_for_timeout(450)
        stamp = page.inner_text('#stamp')
        assert stamp == ('FACT' if ans else 'FAKE'), (stamp, ans)
        if cards == 1:
            shot(page, '5-reveal')
            # chip tap must not advance; undo works; double award blocked
            page.click('.chip[data-id="0"] .chip-main', force=True)
            assert page.evaluate('FoF.state.players[0].score') == 1
            assert page.evaluate('FoF.state.phase') == 'reveal'
            page.click('.chip[data-id="0"] .chip-main', force=True); assert page.evaluate('FoF.state.players[0].score') == 1
            page.click('.chip[data-id="0"] .chip-undo', force=True); assert page.evaluate('FoF.state.players[0].score') == 0
        page.click('.chip[data-id="0"] .chip-main', force=True)
        if page.evaluate('FoF.state.phase') == 'won': break
        page.click('#card-area', position={'x': 5, 'y': 5}); page.wait_for_timeout(700)
        assert page.evaluate('FoF.state.round') == cards + 1
    page.wait_for_selector('#screen-win.active', timeout=3000); page.wait_for_timeout(1500)
    assert cards == 5, cards
    assert page.evaluate('FoF.state.players[0].score') == 5
    assert page.inner_text('#win-title') == 'Sam'
    shot(page, '6-win')
    page.click('#btn-again'); page.wait_for_selector('#screen-play.active'); page.wait_for_timeout(700)
    assert page.evaluate('FoF.state.players.every(p => p.score === 0)')
    page.click('#btn-exit'); page.click('#exit-confirm'); page.wait_for_selector('#screen-home.active')
    # mute persists
    page.click('#btn-mute'); page.reload(); page.wait_for_selector('#screen-home.active')
    assert page.get_attribute('#btn-mute', 'aria-pressed') == 'true'
    b.close()

print('\n'.join(errors) if errors else 'no console errors')
print('SMOKE OK' if not errors else 'SMOKE FAILED'); sys.exit(1 if errors else 0)
