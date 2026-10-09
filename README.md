# Fact or Fake

A pass-and-play party game of surprising truths and convincing lies. Read the card, lock in your answer, reveal the truth, and race to the target score. 2 to 8 players, one shared device, no accounts, no installs.

Plain HTML, CSS and vanilla JavaScript. No framework, no build step, no image files, no libraries. All art is inline SVG/CSS, sounds are synthesized with the Web Audio API, and confetti is a small canvas particle system. The full design is in [MDD.md](MDD.md).

## Play

Open `index.html` in a browser (it also works straight from disk), or visit the GitHub Pages URL below.

1. Pick the players and the score you're playing to (5, 10, 15 or 20).
2. A card shows a statement. Read it out loud.
3. Everyone locks in **Fact** or **Fake** (thumbs, hand signal, or write it down).
4. Tap the card to reveal the truth.
5. Everyone who was right taps their own name for a point. Tap fast!
6. Tap anywhere else for the next card. First to the target wins.

## Deploy to GitHub Pages

1. Push this project to the `main` branch of the repo.
2. In the repo go to **Settings → Pages**, set Source to **Deploy from a branch**, Branch **main**, folder **/ (root)**, and save.
3. After a minute the game is live at `https://<username>.github.io/<repo>/`.

All paths are relative and `.nojekyll` is included, so it works from any sub-path.

## Project layout

```
index.html            all screens (sections toggled by a tiny router)
css/style.css         tokens, layout, screens, animations
css/paper.css         paper/kraft textures (SVG feTurbulence data URIs), torn edges, clips, decor
js/state.js           game state, scoring, persistence (localStorage)
js/deck.js            shuffle, anti-streak rule, draw, seen-card tracking
js/audio.js           synthesized sound effects
js/confetti.js        canvas confetti
js/paper.js           torn-edge clip-paths and paperclip/tape/pin decoration
js/ui.js              rendering and event handlers
js/main.js            init and screen routing
data/statements.js    the 250 cards (125 facts, 125 fakes)
tests/                checks (see below)
```

`js/paper.js` is not in the MDD's file list. It holds the rough-edge helper so `ui.js` stays about game UI.

## Tests

Node checks need no dependencies. Browser checks use Python Playwright with system Chrome.

```
./tests/run-all.sh
```

| Check | What it covers |
|---|---|
| `check-data.js` | 250 cards, 125/125 split, unique IDs, text matches the MDD appendix exactly |
| `check-logic.js` | name cleanup, no repeats, no streak over 3, seen-list reset, win at exactly 5/10/15/20, undo, replay |
| `smoke.py` | full game through the UI, no console errors, mute persists |
| `all_cards.py` | all 250 cards: stamp matches the answer (reduced motion on) |
| `interaction.py` | double-tap guard, keyboard play, name persistence |
| `audio_confetti.py` | audio unlocks on first tap, mute silences, confetti fires once and settles |
| `layout.py` | 320 to 1440 px wide, portrait and landscape, 8 players with the longest card |

## Content

The cards were drafted from general knowledge, and numbers are approximate where sources vary. Spot-check anything you plan to rely on before sharing widely. To drop or edit a card, change its row in `data/statements.js` (the game works with fewer cards, but keep the 125/125 balance for `check-data.js`).
