"""Double-tap guard, keyboard play, name persistence and duplicate handling."""
import sys, pathlib
from playwright.sync_api import sync_playwright
root = pathlib.Path(__file__).resolve().parent.parent
fails = []
def check(c, m):
    print(('ok   ' if c else 'FAIL ') + m)
    if not c: fails.append(m)
with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome')
    page = b.new_context(viewport={'width': 390, 'height': 780}).new_page()
    page.goto(f'file://{root}/index.html'); page.wait_for_selector('#screen-home.active')
    page.click('text=PLAY'); page.wait_for_selector('#screen-setup.active'); page.wait_for_timeout(350)
    page.click('#count-inc'); page.click('#count-inc')
    page.fill('#name-list input >> nth=0', 'Ana'); page.fill('#name-list input >> nth=1', ''); page.fill('#name-list input >> nth=2', 'ana'); page.fill('#name-list input >> nth=3', 'Ana')
    page.click('#btn-start'); page.wait_for_selector('#screen-play.active'); page.wait_for_timeout(700)
    names = page.eval_on_selector_all('.chip .name', 'e => e.map(x => x.textContent)')
    check(names == ['Ana', 'Player 2', 'ana 2', 'Ana 3'], f'blank -> default, duplicates suffixed: {names}')
    check(page.evaluate('FoF.state.phase') == 'question' and page.get_attribute('.chip-main', 'aria-disabled') == 'true', 'chips inactive in QUESTION')
    page.evaluate("document.querySelector('.chip[data-id=\"0\"] .chip-main').click()")
    check(page.evaluate('FoF.state.players[0].score') == 0, 'chip tap ignored in QUESTION')
    # keyboard reveal
    page.focus('#card'); page.keyboard.press('Enter'); page.wait_for_timeout(450)
    check(page.evaluate('FoF.state.phase') == 'reveal', 'Enter on card reveals')
    # double-tap guard: immediate next tap is ignored, later one works
    page.evaluate("""() => { window.__r = FoF.state.round; document.getElementById('card-area').click(); }""")
    check(page.evaluate('FoF.state.round') == page.evaluate('__r'), 'next tap ignored right after reveal (<400ms)')
    page.wait_for_timeout(500)
    page.keyboard.press('Tab'); 
    page.focus('#btn-next'); page.keyboard.press('Enter'); page.wait_for_timeout(900)
    check(page.evaluate('FoF.state.round') == 2 and page.evaluate('FoF.state.phase') == 'question', 'Next Card button (keyboard) advances')
    # name persistence
    page.click('#btn-exit'); page.click('#exit-confirm'); page.wait_for_selector('#screen-home.active'); page.reload(); page.wait_for_selector('#screen-home.active')
    page.click('text=PLAY'); page.wait_for_timeout(350)
    vals = page.eval_on_selector_all('#name-list input', 'e => e.map(x => x.value)')
    check(vals[0] == 'Ana' and len(vals) == 4, f'names/count restored after reload: {vals}')
    check(page.get_attribute('[data-target="10"]', 'aria-checked') == 'true', 'target restored')
    b.close()
print('INTERACTION OK' if not fails else f'{len(fails)} FAILED'); sys.exit(1 if fails else 0)
