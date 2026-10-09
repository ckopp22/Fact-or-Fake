# FACT OR FAKE: Master Design Document (MDD)

**Version:** 1.0
**Platform:** Web (HTML/CSS/JS), mobile-first, hosted on GitHub Pages
**Build tool:** Claude Code
**Play style:** Pass-and-play party game, 2 to 8 players, one shared device

---

## 1. Concept

Fact or Fake is a party game where a statement appears on a paper card and players decide whether it's true or made up. The statements lean hard into the "Wow, I can't believe that" factor: surprising truths and convincing lies, not trivia everyone already knows.

**Elevator pitch:** A tabletop trivia game that looks like a scrapbook of torn paper, paperclips and old books. Read the card, lock in your answer, reveal the truth, score points, and race to the target score.

### Design pillars
1. **Wow factor first.** Every card should provoke a reaction, and the reveal text should be the payoff.
2. **Fast and social.** A round takes under 30 seconds. The device is a prop on the table, not a screen to stare at.
3. **Tactile paper world.** Every surface looks handmade: rough edges, paperclips, tape, stacked books, ink stamps.
4. **Zero friction.** No accounts, no installs, no loading screens. Open the link and play.

---

## 2. Technical Requirements

| Item | Decision |
|---|---|
| Stack | Plain HTML, CSS, vanilla JavaScript. No framework, no build step. |
| Hosting | GitHub Pages, served from the `main` branch root |
| Structure | Single page app. Screens are `<section>` elements toggled by a tiny state machine. |
| Assets | No image files. All art is inline SVG or CSS. Paper texture uses an SVG `feTurbulence` filter. |
| Audio | Web Audio API synthesized sounds (no audio files) |
| Confetti | Custom `<canvas>` particle system (no library) |
| Fonts | Google Fonts with system fallbacks: **Special Elite** (typewriter, statements), **Caveat** (handwriting, labels), **Permanent Marker** (title and stamps) |
| Storage | `localStorage` for last player names, target score, mute setting and seen card IDs |
| Paths | All paths relative so it works at `username.github.io/fact-or-fake/` |
| Browsers | Current Safari (iOS), Chrome (Android and desktop), Firefox, Edge |
| Orientation | Portrait first. Landscape and tablet must remain usable. |
| Offline | Optional stretch: service worker and manifest so it installs as a PWA |

### File structure
```
fact-or-fake/
  index.html
  css/
    style.css          (theme, layout, screens)
    paper.css          (paper texture, torn edges, shadows)
  js/
    main.js            (init, screen routing)
    state.js           (game state, scoring, persistence)
    deck.js            (shuffle, draw, seen tracking)
    audio.js           (Web Audio sound effects)
    confetti.js        (canvas confetti)
    ui.js              (rendering, event handlers)
  data/
    statements.js      (window.STATEMENTS = [...], all 250 cards)
  .nojekyll
  README.md
  MDD.md
```
Use `statements.js` rather than a `.json` fetch so the game also runs when `index.html` is opened directly from disk.

---

## 3. Screen Flow

```
HOME  ->  HOW TO PLAY  ->  (back to HOME)
HOME  ->  PLAYER SETUP ->  GAMEPLAY LOOP  ->  WIN / SCOREBOARD  ->  REPLAY (Gameplay) or MENU (Home)
```

### 3.1 Home Screen
- **Title:** "FACT or FAKE" in a big marker/stamp style. "FACT" in green ink, "FAKE" in red ink, "or" in a handwritten scrawl between them. The title sits on a slightly rotated torn-paper banner.
- **Buttons (paper tags):** **PLAY** (largest, primary) and **HOW TO PLAY**.
- **Decor:** Paperclips clipping the title banner and corners, a stack of books along the bottom (colored spines, worn cloth look), tape strips, a coffee-ring stain, scattered torn note scraps. Subtle idle animation: a paperclip jiggles occasionally, and the books have a slight parallax tilt on device motion or mouse move (optional).
- **Mute toggle:** small speaker icon in the corner, present on every screen.

### 3.2 How to Play
A single "notebook page" card with a short handwritten-style list:
1. Pick who's playing and the score you're playing to.
2. A card shows a statement. Read it out loud.
3. Everyone locks in their answer: **Fact** or **Fake** (thumbs up or down, a hand signal, or write it down).
4. Tap the card to reveal the truth and the extra info.
5. Every player who was right taps their own name to add a point.
6. Tap anywhere else for the next card. First to the target score wins.

Includes a **Got it** button back to Home. Keep it to one screen with no scrolling on a phone.

### 3.3 Player Setup
- **Number of players:** stepper, 2 to 8 (default 2).
- **Names:** text inputs, one per player, default "Player 1", "Player 2" and so on. Max 12 characters. Pre-filled from the last game.
- **Each player gets a color ink dot** (assigned automatically, used on the name chips and scoreboard).
- **Play to:** chip selector `5 / 10 / 15 / 20` (default **10**).
- **Start Game** button. Validation: names can't be blank (fall back to the default) and duplicates get a numeric suffix.
- **Back** button to Home.

### 3.4 Gameplay Screen

**Layout (portrait):**
- Top bar: round number, "Playing to X", mute, and an Exit button (confirm dialog).
- Center: the **Card**, a large paper index card with a rough edge, slight random rotation, a paperclip, and the statement in typewriter font.
- Bottom: **Player name chips** in a row or wrap grid, each showing name, score and ink-color dot.

**States per card:**

| State | What the screen shows | Player action | Next |
|---|---|---|---|
| **A. QUESTION** | Card slides in with the statement. A handwritten hint reads "Lock in your answers!" and a pulsing "Tap card to reveal". Name chips are visible but inactive (greyed out). | Players lock in verbally or by hand signal. | Tap the card, then B |
| **B. REVEAL** | Card flips (or the paper peels). A big ink stamp slams down: **FACT** (green) or **FAKE** (red), with a thump sound and a screen-shake. The **reveal text** fades in under the stamp. Name chips activate and pulse softly. | Each player who answered correctly taps their name chip to add +1. Each tap gives a pop sound and a "+1" floating animation. A small "-" appears on a chip after it's tapped, to undo a mistake. | Tap anywhere outside the chips, then C (or D if a player has hit the target) |
| **C. NEXT** | Current card is dismissed (slides or crumples away), new card enters, back to A. | None | Loop |
| **D. WIN** | Triggered the instant a player's score reaches the target (see 3.5). | | Win screen |

**Interaction rules:**
- Tapping a name chip must **not** trigger "next card" (stop propagation).
- The "next" tap is ignored for ~400 ms after the reveal so a double-tap doesn't skip the reveal text.
- Tapping a chip is only allowed in the REVEAL state.
- A visible **Next Card →** handwritten label sits at the bottom as an affordance, since "tap anywhere" isn't obvious to new players.
- The game must not allow a score beyond the target. When the target is hit, the game ends immediately.

### 3.5 Win Screen and Scoreboard
- **Trigger:** the moment a name tap makes a score equal the target.
- **Celebration:** full-screen paper-colored confetti (canvas), triumphant synthesized fanfare, winner's name on a big "WINNER" stamp or rosette ribbon pinned with a paperclip.
- **Scoreboard:** a torn-paper leaderboard card listing all players sorted by score (rank, ink dot, name, score). Winner on top with a crown or star doodle.
- **Buttons:** **PLAY AGAIN** (same players, same target, scores reset, deck continues with unseen cards) and **MENU** (returns to Home).
- Confetti runs about 4 seconds, then settles to a light trickle. Respect `prefers-reduced-motion` (shorter, calmer burst).

---

## 4. Visual Design: "Paper World"

### 4.1 Palette
| Role | Color |
|---|---|
| Desk / background | Warm kraft brown `#c9a77c` with subtle noise |
| Paper | Cream `#f6efdc` (cards), aged `#efe3c4` (secondary) |
| Ink | Dark brown-black `#2b2118` |
| Fact | Green stamp `#2f7d4f` |
| Fake | Red stamp `#b8322a` |
| Accent | Mustard `#d9a441`, denim `#3e5c76` |
| Player inks | Red, blue, green, purple, orange, teal, pink, brown (all distinct and colorblind-friendly paired with the name text) |

### 4.2 Paper and rough-edge technique
- **Texture:** an inline SVG filter (`feTurbulence` plus `feColorMatrix`) used as a background layer for paper grain and fibers.
- **Rough or torn edges:** apply an SVG filter (`feTurbulence` plus `feDisplacementMap`) to the card's outline, or use a generated `clip-path: polygon()` with jittered points along each edge. A lighter paper-white "tear" strip can sit under the edge for the torn-fiber look.
- **Depth:** layered soft shadows, slight random rotation (-2° to +2°) per card, paper curl on one corner.
- **Ink:** stamp text uses a slight displacement and opacity variance to mimic uneven ink.

### 4.3 Decorative elements (all inline SVG)
- **Paperclips:** classic wire clip in silver and in colored plastic. Clipped over title banner, card corner and scoreboard.
- **Books:** a stack of 4 to 6 books on the Home screen with varied heights, colors, spine bands and title scribbles. A few books may lie flat with an open book as a background corner on other screens.
- **Extras:** masking tape, push pins, a coffee ring, doodle stars and arrows in the margins, a pencil.
- Decor must never overlap or block interactive controls, and uses `pointer-events: none`.

### 4.4 Motion
- Screen transitions: paper slide or page-flip (about 300 ms).
- Card entry: drops in with a small bounce. Reveal: stamp slam, with scale from 2x to 1x and a quick shake.
- Keep animation to transforms and opacity for 60 fps on older phones.

### 4.5 Responsiveness and accessibility
- Minimum tap target 48 px. Card text scales with `clamp()` and never overflows (longest statement is about 130 characters).
- Contrast of ink on paper must meet WCAG AA.
- Answers are never conveyed by color alone: stamps say **FACT** or **FAKE** in text.
- Buttons are real `<button>` elements with focus outlines. `aria-live="polite"` on the card so screen readers announce the statement and the reveal.
- Sound is optional and always has a visible mute toggle.

---

## 5. Audio Design (Web Audio API, synthesized)

Audio must be unlocked by the first user tap (iOS Safari requirement). Create the `AudioContext` on the first PLAY or button press.

| Event | Sound |
|---|---|
| Button / tap | Soft paper "tick" (short filtered noise burst) |
| Card enter | Light paper "whoosh" (noise sweep) |
| Reveal: FACT | Bright two-note rising chime plus stamp thump |
| Reveal: FAKE | Low buzzer-style "bonk" plus stamp thump |
| Name tap (+1) | Cheerful "pop" blip, pitch rises slightly with the player's score |
| Undo | Small descending blip |
| Win | Short fanfare (major arpeggio plus a sustained chord) layered with a confetti "pop" |

Master volume about 0.5, mute persisted in `localStorage`.

---

## 6. Game Logic

### 6.1 State model
```js
{
  screen: 'home' | 'how' | 'setup' | 'play' | 'win',
  players: [{ id, name, color, score }],
  target: 10,
  deck: [],            // shuffled statement IDs for the current session
  current: null,       // current statement object
  phase: 'question' | 'reveal',
  round: 1,
  muted: false
}
```

### 6.2 Deck and shuffling
- Combine all 250 statements (125 facts, 125 fakes) and shuffle with Fisher-Yates.
- **Anti-streak rule:** after shuffling, no more than 3 consecutive cards with the same answer (swap forward to break streaks).
- **No repeats:** store seen IDs in `localStorage`. New games draw from unseen cards first. When all 250 have been seen, clear the seen list and reshuffle.
- **Replay** keeps drawing from the remaining unseen deck.

### 6.3 Scoring
- +1 per correct player, awarded by that player tapping their own name chip during REVEAL.
- Win condition: `score >= target`. Evaluated on each tap. The first player to reach it wins.
- **Edge cases:** if two players need the same card to win, the first to tap wins (note this in How to Play: "tap fast!"). Undo is allowed until the next card is requested. A win cannot be undone once the Win screen is shown.

### 6.4 Persistence
Saved: player names, player count, target, mute, seen IDs. Not saved: mid-game scores (a refresh returns to Home).

---

## 7. Content Design

### 7.1 Statement schema
```js
{
  id: "F001",           // F### for facts, X### for fakes
  text: "…",            // statement shown on the card
  answer: true | false, // true = FACT, false = FAKE
  reveal: "…",          // extra info shown after the stamp
  cat: "ANI" | "SCI" | "HIS" | "LIFE" | "TECH"
}
```
Convert the tables in the appendix into `data/statements.js`: facts become `answer: true`, fakes `answer: false`. Category comes from the section heading.

### 7.2 Content rules
- **250 total, 125 Fact and 125 Fake.** Roughly 50/50 overall and within each category.
- **Wow factor:** lean on surprising truths and convincing myths over common knowledge.
- **Fakes must be false but believable.** The reveal always gives the true version, so a fake card never leaves a player with wrong information.
- **Tone:** punchy and family-friendly (suitable for teens and up). No politics, no gore, no real tragedies played for laughs.
- **Length:** statements under 130 characters, reveals under 220 characters.
- **Accuracy:** the content below was drafted from general knowledge. Before publishing, spot-check anything you plan to rely on, especially numbers (the reveals use approximate figures where sources vary). If a card is disputed, edit or drop it. The game works fine with fewer cards.

---

## 8. Build Plan for Claude Code

**Phase 1: Skeleton.** Create the file structure, `index.html` with all screens, the screen router and base CSS. Home to Setup to Play to Win navigation works with placeholder content.

**Phase 2: Data and logic.** Generate `data/statements.js` from the appendix, with a script or manual conversion and a count check (exactly 125 true, 125 false, unique IDs). Implement the deck, scoring and win detection. Verify the full game loop with plain styling.

**Phase 3: Paper theme.** Paper texture filter, torn edges, SVG paperclips, books, tape, stamps, typography, card and chip styling, and transitions.

**Phase 4: Audio and confetti.** Web Audio sound effects, mute toggle, confetti canvas and Win screen polish.

**Phase 5: Polish and QA.** Responsive pass (small phone, large phone, tablet, desktop), accessibility pass, reduced-motion handling, the test checklist below, README and deploy.

### Starter prompt for Claude Code
> Read MDD.md fully. Build the Fact or Fake game described in it as a static site using plain HTML, CSS and vanilla JS with the file structure in section 2. Start with Phase 1 and 2, convert the statement tables in the appendix into `data/statements.js` (125 facts, 125 fakes), and confirm the counts. Then continue through the remaining phases. Use only relative paths so it works on GitHub Pages. No external images or JS libraries. Commit after each phase.

---

## 9. Deployment (GitHub Pages)

1. Create a repo (for example `fact-or-fake`) and push the project to `main`.
2. Add an empty `.nojekyll` file at the root.
3. In the repo go to **Settings → Pages**, set Source to **Deploy from a branch**, Branch **main**, folder **/ (root)**, then Save.
4. After a minute the game is live at `https://<username>.github.io/fact-or-fake/`.
5. Test on a real phone. Check that audio works after the first tap and that fonts load.

---

## 10. QA Checklist

- [ ] Home, How to Play, Setup and Gameplay all reachable and the Back button works everywhere
- [ ] 2 to 8 players: names saved, defaults and duplicate handling correct
- [ ] Every target option (5, 10, 15, 20) triggers the win at the exact score
- [ ] Tapping a name chip never advances the card, and the double-tap guard works
- [ ] Undo works until the next card is requested
- [ ] Reveal stamp matches the card's `answer` for all 250 cards (automated check)
- [ ] No repeats within a game and no streak longer than 3 of the same answer
- [ ] Confetti and fanfare fire once on win, and Replay and Menu both work
- [ ] Mute toggle works and persists, and iOS plays audio after the first tap
- [ ] Layout intact on 320 px wide screens with the longest statement and 8 players
- [ ] Reduced-motion setting respected
- [ ] Works from the GitHub Pages URL with no console errors or 404s

---

## 11. Future Ideas (out of scope for v1)
- Digital lock-in mode where each player secretly picks Fact or Fake on the device and the game auto-awards points
- Category filters and difficulty levels
- Timer mode and "streak bonus" points
- Team mode, daily card, shareable winner screenshot
- More card packs (seasonal, kids, history-only)

---

# Appendix: Statement Bank (250)

**Facts (answer: FACT), 125 cards.** IDs `F001` to `F125`.

## Facts: Animals (ANI)

| ID | Statement | Reveal |
|---|---|---|
| F001 | Octopuses have three hearts and blue blood. | Two hearts feed the gills and one feeds the body. Copper-based hemocyanin makes the blood blue. |
| F002 | Wombats poop in cubes. | Their intestines stretch unevenly, forming cube-shaped droppings that stack and don't roll away. |
| F003 | Sharks existed before trees did. | Sharks date back about 450 million years. The first true trees came roughly 385 million years ago. |
| F004 | Hippos produce their own natural sunscreen. | A red-orange fluid on their skin absorbs UV light and fights bacteria. It's nicknamed "blood sweat" but isn't blood. |
| F005 | Crows can remember a human face for years and hold grudges. | In a University of Washington study, crows scolded people wearing a "dangerous" mask, and other crows who never saw the original event joined in. |
| F006 | Sea otters keep a favorite rock in a pouch of skin under their arm. | They tuck it into a loose skin pocket and use it to crack open shellfish. |
| F007 | Some turtles can breathe through their butts. | Certain species absorb oxygen through the cloaca, which helps them survive underwater while hibernating. |
| F008 | A mantis shrimp punches with the acceleration of a bullet. | Its club accelerates about as fast as a .22 caliber bullet and can smash shells and aquarium glass. |
| F009 | Dolphins sleep with half of their brain awake. | One half rests while the other keeps them surfacing to breathe and watching for danger. |
| F010 | Koalas have fingerprints almost identical to human fingerprints. | They're so similar that they could, in theory, confuse investigators at a crime scene. |
| F011 | Sloths can hold their breath longer than dolphins. | By slowing their heart rate, sloths can stay under for up to about 40 minutes. |
| F012 | Cows have best friends and get stressed when separated from them. | Studies found cows' heart rates and stress hormones rise when they're apart from a preferred companion. |
| F013 | A cockroach can live for about a week without its head. | It breathes through small holes in its body and doesn't need its mouth or head to survive for a while. |
| F014 | Rats laugh when they're tickled. | They make ultrasonic chirps humans can't hear, and they'll even chase the tickling hand. |
| F015 | Most of an octopus's neurons are in its arms, not its head. | About two thirds of its neurons are in the arms, so each arm can act semi-independently. |
| F016 | Butterflies taste with their feet. | They have taste sensors on their feet, so they know right away if a leaf is a good place to lay eggs. |
| F017 | Starfish have no brain and no blood. | They use seawater pumped through their bodies instead of blood, and a nerve ring instead of a brain. |
| F018 | Tardigrades have survived the vacuum of outer space. | In a 2007 experiment these "water bears" were exposed to open space and some survived and reproduced. |
| F019 | Pigeons can tell a Monet painting from a Picasso. | In a Japanese study, trained pigeons learned to distinguish the two styles and even generalized to new paintings. |
| F020 | Gentoo penguins propose to their mates with pebbles. | A male presents a carefully chosen pebble, and if the female accepts it, it goes into their nest. |
| F021 | Male seahorses are the ones that give birth. | The female deposits eggs into the male's pouch, and he carries them and delivers the babies. |
| F022 | The Greenland shark can live around 400 years. | It's the longest-lived vertebrate known, growing only about a centimeter a year. |
| F023 | The pistol shrimp snaps its claw so fast it creates a bubble hotter than the sun's surface. | The collapsing bubble produces a shockwave louder than a gunshot and stuns its prey. |
| F024 | A giraffe has the same number of neck bones as you do. | Both have seven neck vertebrae. A giraffe's are just enormously stretched. |
| F025 | Dolphins call each other by name. | Each dolphin develops a signature whistle that works like a name, and others use it to call that individual. |

## Facts: Science and Space (SCI)

| ID | Statement | Reveal |
|---|---|---|
| F026 | A day on Venus is longer than its year. | Venus spins once every 243 Earth days but orbits the Sun in about 225. |
| F027 | Russia is bigger than Pluto in surface area. | Russia covers about 17.1 million square kilometers and Pluto about 16.7 million. |
| F028 | Pluto hasn't completed a single orbit around the Sun since it was discovered. | Pluto takes about 248 Earth years to orbit, and it was discovered in 1930. |
| F029 | A teaspoon of neutron star material would weigh about a billion tons. | Neutron stars are so dense that matter is crushed to nuclear density. |
| F030 | A bolt of lightning is hotter than the surface of the Sun. | Lightning reaches about 30,000 K, while the Sun's surface is about 5,800 K. |
| F031 | Sunsets on Mars are blue. | Martian dust scatters light differently than Earth's atmosphere, so the sky around the setting Sun glows blue. |
| F032 | There are more possible chess games than atoms in the observable universe. | Estimates run around 10^120 possible games versus roughly 10^80 atoms. |
| F033 | There are more trees on Earth than stars in the Milky Way. | Earth has about 3 trillion trees. The Milky Way has an estimated 100 to 400 billion stars. |
| F034 | The farthest point on Earth's surface from Earth's center is not Mount Everest. | It's the summit of Chimborazo in Ecuador, because Earth bulges at the equator. |
| F035 | Bananas are berries, but strawberries aren't. | Botanically, a berry develops from a single ovary with seeds inside. Strawberries are "aggregate accessory fruits." |
| F036 | Humans glow in the dark, but too faintly to see. | Our bodies emit ultra-weak light as a byproduct of metabolism, about 1,000 times dimmer than our eyes can detect. |
| F037 | Honey can last thousands of years without spoiling. | Edible honey has been found in ancient Egyptian tombs. Its low moisture and acidity keep microbes from growing. |
| F038 | Hawaii is slowly moving toward Japan. | The Pacific Plate carries the islands northwest at roughly 7 to 10 cm a year. |
| F039 | Antarctica is the largest desert on Earth. | A desert is defined by low precipitation, and Antarctica gets very little. |
| F040 | Bamboo can grow more than three feet in a single day. | Some giant species grow up to about 91 cm in 24 hours. |
| F041 | A Venus flytrap counts. | It snaps shut only after two touches within about 20 seconds, which helps it ignore raindrops. |
| F042 | In the tropics, ripe oranges are often still green. | Warm nights prevent the fruit from losing chlorophyll, so the skin stays green though the fruit inside is ripe. |
| F043 | Nutmeg can cause hallucinations in large doses. | It contains myristicin. Large amounts cause unpleasant effects and can be dangerous. |
| F044 | There's a natural lake in Australia that is bubblegum pink. | Lake Hillier gets its color from salt-loving algae and bacteria. It's safe to swim in. |
| F045 | A pineapple takes about two years to grow. | It's one plant producing one fruit slowly, which is why pineapples were once luxury items. |
| F046 | Saturn is less dense than water, so it would float in a big enough bathtub. | Saturn's average density is about 0.69 g/cm³, lower than water's 1. |
| F047 | The Moon is slowly drifting away from Earth. | It recedes about 3.8 cm a year, roughly the speed your fingernails grow. |
| F048 | The Sun contains about 99.86% of all the mass in our solar system. | Everything else, including every planet, shares the remaining 0.14%. |
| F049 | Bananas are slightly radioactive. | They contain potassium-40, a natural radioactive isotope. The dose is tiny and harmless. |
| F050 | Astronomers think it may rain glass sideways on a planet called HD 189733b. | Silicate particles in its atmosphere, whipped by winds of thousands of miles per hour, are believed to form glass rain. |

## Facts: History (HIS)

| ID | Statement | Reveal |
|---|---|---|
| F051 | Oxford University is older than the Aztec Empire. | Teaching at Oxford began around 1096. The Aztecs founded Tenochtitlan in 1325. |
| F052 | Cleopatra lived closer in time to the Moon landing than to the building of the Great Pyramid. | The Great Pyramid was built about 2,500 years before Cleopatra, and she lived about 2,000 years before 1969. |
| F053 | Nintendo was founded in 1889, and it sold playing cards. | The company started making hanafuda cards in Kyoto and moved into video games about 90 years later. |
| F054 | The shortest war in history lasted under an hour. | The 1896 Anglo-Zanzibar War ended after about 38 to 45 minutes. |
| F055 | Sweden once had a February 30th. | In 1712 Sweden was switching calendars and added the extra date to fix its schedule. |
| F056 | Abraham Lincoln is in the National Wrestling Hall of Fame. | As a young man he was a standout wrestler and lost only one match in about 300. |
| F057 | Australia once sent soldiers with machine guns to fight emus, and mostly lost. | In the 1932 "Great Emu War", the birds proved too fast and scattered for the soldiers to stop. |
| F058 | The Great Pyramid of Giza was the tallest man-made structure on Earth for nearly 3,800 years. | It held the title until Lincoln Cathedral in England was completed around 1311. |
| F059 | The Eiffel Tower was only supposed to stand for 20 years. | It was built as a temporary exhibit for the 1889 World's Fair and saved because it was useful as a radio antenna. |
| F060 | Ancient Romans used urine to clean clothes. | Launderers collected it for its ammonia, which broke down grease in wool. |
| F061 | In 1983, one Soviet officer ignored a missile alarm and likely prevented nuclear war. | Stanislav Petrov judged the alert to be a false alarm, and he was right. |
| F062 | In 1962, one Soviet submarine officer refused to approve a nuclear torpedo launch. | Vasili Arkhipov's refusal during the Cuban Missile Crisis is credited with averting disaster. |
| F063 | In 1919, a wave of molasses flooded the streets of Boston. | A storage tank burst, sending about 2 million gallons rolling through at roughly 35 mph and killing 21 people. |
| F064 | A flood of beer once swept through a London neighborhood. | In 1814 a burst vat at a brewery released about 1.4 million liters and killed eight people. |
| F065 | In 1518, people in Strasbourg danced for days and couldn't stop. | The "Dancing Plague" affected dozens and possibly hundreds of people. Its cause is still debated. |
| F066 | 1816 was known as "the year without a summer," and it helped inspire Frankenstein. | The eruption of Mount Tambora darkened skies worldwide, and Mary Shelley wrote her story during the gloomy summer. |
| F067 | Harvard University is older than the mathematics of calculus. | Harvard was founded in 1636, and calculus was developed in the late 1600s. |
| F068 | Peter the Great of Russia once taxed men for wearing beards. | He wanted Russia to look more European, and men who kept beards had to pay and carry a token. |
| F069 | Pyramid builders in ancient Egypt were paid partly in beer. | Workers received rations of bread and beer, and they were skilled laborers, not slaves. |
| F070 | Before alarm clocks, people in Britain paid someone to shoot peas at their windows to wake them up. | These "knocker-uppers" used pea shooters or long poles to wake workers. |
| F071 | Mickey Mouse was almost named Mortimer. | Walt Disney's wife Lillian reportedly said "Mortimer" sounded too pompous and suggested "Mickey." |
| F072 | The inventor of the Pringles can was buried in one. | Fredric Baur's ashes were reportedly placed in a Pringles can, per his request. |
| F073 | The first product ever scanned with a barcode was a pack of gum. | A pack of Wrigley's Juicy Fruit was scanned at an Ohio supermarket in 1974. |
| F074 | The first computer "bug" was an actual moth. | In 1947 operators found a moth stuck in a Harvard Mark II relay and taped it in the logbook. |
| F075 | A Game Boy survived a bombing during the Gulf War. | The battered Game Boy was found in a destroyed barracks and still worked. It was sent to Nintendo, which replaced it. |

## Facts: Life, World, Food and Body (LIFE)

| ID | Statement | Reveal |
|---|---|---|
| F076 | The Hawaiian alphabet has only 13 letters. | It has five vowels, seven consonants and the ʻokina, a glottal stop. |
| F077 | Alaska is the northernmost, westernmost and easternmost state at the same time. | The Aleutian Islands cross the 180° line, so part of Alaska lies in the Eastern Hemisphere. |
| F078 | In Longyearbyen, Norway, burials are banned. | Bodies don't decompose in the permafrost, and the dead have to be buried elsewhere. |
| F079 | Scotland's national animal is the unicorn. | It's been a Scottish symbol since the 12th century and appears on the royal coat of arms. |
| F080 | There's a town called Boring in Oregon, and it has sister communities named Dull and Bland. | Boring, Oregon is partnered with Dull in Scotland and Bland Shire in Australia. |
| F081 | Dr. Seuss wrote Green Eggs and Ham using only 50 different words. | It was the result of a bet with his publisher, and it became one of his best-selling books. |
| F082 | Bob Ross usually painted three copies of every painting. | He made a backup before filming, painted one on camera, then made another for his books. |
| F083 | The first cultivated carrots were purple and yellow, not orange. | Orange carrots became popular in the Netherlands in the 1600s. |
| F084 | In the 1830s, ketchup was sold as medicine. | A doctor promoted tomato ketchup as a remedy for indigestion, and it was sold as pills. |
| F085 | Fortune cookies were invented in California, not China. | They most likely came from Japanese-American bakeries in the early 1900s. |
| F086 | The Caesar salad was invented in Tijuana, Mexico. | Restaurateur Caesar Cardini created it in the 1920s. It isn't named after Julius Caesar. |
| F087 | The "wasabi" served at most restaurants is actually horseradish dyed green. | Real wasabi is rare and expensive, so most places use horseradish, mustard and coloring. |
| F088 | Almonds aren't true nuts. | They're the seeds of a fruit related to peaches and plums. |
| F089 | Cashews grow outside the fruit they come from. | The cashew hangs from the bottom of a fleshy "cashew apple," in a shell. |
| F090 | Birds can't feel the heat of chili peppers. | Birds lack the receptor that responds to capsaicin, so they spread the seeds without discomfort. |
| F091 | Your stomach lining is replaced every few days. | It renews itself roughly every three to four days so stomach acid doesn't digest it. |
| F092 | You're about a centimeter taller in the morning than at night. | Your spinal discs compress during the day and re-expand while you sleep. |
| F093 | Fingernails grow faster than toenails. | Fingernails grow around 3 mm a month, toenails closer to 1 mm. |
| F094 | Babies are born with more bones than adults have. | A baby has about 300 bones, and many fuse together until an adult has 206. |
| F095 | Your brain uses about 20% of your body's energy. | It makes up only about 2% of your body's weight. |
| F096 | In Japan there are more pets than children. | Estimates suggest more dogs and cats than children under 15, because of the country's low birth rate. |
| F097 | Peanuts aren't actually nuts. | They're legumes, related to beans and lentils, and they grow underground. |
| F098 | Bolivia has two capital cities. | La Paz is the seat of government and Sucre is the constitutional capital. |
| F099 | South Africa has three capital cities. | Pretoria is the executive capital, Cape Town is the legislative capital and Bloemfontein is the judicial capital. |
| F100 | Africa is the only continent that lies in all four hemispheres. | It spans the equator and the prime meridian, so it covers north, south, east and west. |

## Facts: Tech and Pop Culture (TECH)

| ID | Statement | Reveal |
|---|---|---|
| F101 | The first 1 GB hard drive weighed over 500 pounds. | IBM's 1980 drive was about the size of a refrigerator and cost around $40,000. |
| F102 | The PlayStation began as a Nintendo project. | Sony was originally developing a CD add-on for Nintendo's console, then built its own system after the deal fell apart. |
| F103 | Each ghost in Pac-Man has its own personality. | Blinky chases, Pinky ambushes, Inky is unpredictable and Clyde wanders away. |
| F104 | The Tetris music is a Russian folk song. | It's based on "Korobeiniki," a 19th-century folk tune. |
| F105 | LEGO is one of the world's largest tire makers by number of tires. | The company produces hundreds of millions of tiny rubber tires a year for its sets. |
| F106 | Mario was originally named Jumpman. | He debuted in Donkey Kong in 1981 and was renamed after Nintendo's landlord, Mario Segale. |
| F107 | The Windows 95 startup sound was composed by Brian Eno on a Mac. | Microsoft asked him for something "inspiring" and "optimistic" in about 3.25 seconds. |
| F108 | A standard Rubik's Cube has over 43 quintillion possible positions. | That's 43,252,003,274,489,856,000 arrangements. |
| F109 | A well-shuffled deck of 52 cards has almost certainly never existed in that order before. | There are about 8 × 10^67 possible orders, which is far more than the number of decks shuffled in history. |
| F110 | Wi-Fi doesn't stand for anything. | The name was made up by a branding firm. "Wireless Fidelity" was a later invention. |
| F111 | The first webcam was pointed at a coffee pot. | In 1991 Cambridge researchers streamed a coffee machine so they wouldn't walk to an empty pot. |
| F112 | The first domain name ever registered was symbolics.com. | It was registered in 1985, and it still exists. |
| F113 | Google was originally called BackRub. | It was named for the backlinks it analyzed, before it became Google in 1997. |
| F114 | Amazon was originally called Cadabra. | Jeff Bezos changed it after a lawyer misheard it as "cadaver." |
| F115 | The first Apple logo showed Isaac Newton sitting under a tree. | The 1976 logo was a detailed pen drawing, replaced a year later by the simple apple. |
| F116 | In Super Mario Bros, the clouds and the bushes are the same sprite in different colors. | Nintendo reused it to save precious memory on the cartridge. |
| F117 | Minecraft is the best-selling video game of all time. | It has sold well over 300 million copies. |
| F118 | The "Wilhelm scream" sound effect has been used in hundreds of movies. | It's a stock scream first used in 1951 and reused by sound editors ever since. |
| F119 | The shortest scheduled flight in the world takes about a minute and a half. | The hop between Westray and Papa Westray in Scotland's Orkney Islands covers about 1.7 miles. |
| F120 | The oldest known musical instrument is a flute carved from a bird bone about 40,000 years old. | It was found in a cave in Germany and made from a vulture's wing bone. |
| F121 | Peeling sticky tape in a vacuum can produce X-rays. | A 2008 study found that unrolling Scotch tape in a vacuum emitted enough X-rays to image a finger. |
| F122 | Bubble wrap was originally invented as wallpaper. | The inventors couldn't sell it as wall covering, and then found its packaging use. |
| F123 | The Popsicle was invented by an 11-year-old. | Frank Epperson accidentally left a soda drink with a stick outside overnight in 1905. |
| F124 | Play-Doh started as a wallpaper cleaner. | It was repurposed as a modeling compound after people stopped heating homes with coal. |
| F125 | The Slinky was invented by accident. | In 1943 naval engineer Richard James knocked a spring off a shelf and watched it "walk" down. |

---

**Fakes (answer: FAKE), 125 cards.** IDs `X001` to `X125`. The reveal states the truth.

## Fakes: Animals (ANI)

| ID | Statement | Reveal |
|---|---|---|
| X001 | Goldfish have a memory of only three seconds. | Goldfish remember things for months and can be trained to respond to signals and navigate mazes. |
| X002 | Bats are blind. | All bat species can see, and many see well. Some also use echolocation. |
| X003 | Ostriches bury their heads in the sand when scared. | They don't. They lie flat on the ground, which can look like hiding their heads from a distance. |
| X004 | Lemmings leap off cliffs in mass suicide. | A 1958 Disney documentary staged it by throwing lemmings off a cliff. Real lemmings only migrate. |
| X005 | Camels store water in their humps. | Humps are fat reserves, which can be converted into energy and water when needed. |
| X006 | Bulls charge because the color red makes them angry. | Bulls are red-green colorblind. They react to the movement of the cape. |
| X007 | Dogs see the world only in black and white. | Dogs see blues and yellows but have trouble with reds and greens. |
| X008 | Chameleons change color mainly to blend into their surroundings. | Mostly they shift color to communicate mood and regulate temperature. |
| X009 | Elephants are terrified of mice. | There's no evidence. Elephants might be startled by sudden movement, but they aren't specifically scared of mice. |
| X010 | If you touch a baby bird, its mother will reject it. | Most birds have a poor sense of smell and won't abandon a chick over human scent. |
| X011 | Polar bears have white skin. | Their skin is black, which helps absorb heat. Their fur is transparent and only looks white. |
| X012 | The platypus gives birth to live young. | It's a mammal that lays eggs, one of only a few egg-laying mammals. |
| X013 | Baby flamingos are born bright pink. | Flamingos are born gray and turn pink from carotenoids in the food they eat. |
| X014 | Owls can rotate their heads a full 360 degrees. | They can turn about 270 degrees, thanks to extra neck vertebrae and flexible blood vessels. |
| X015 | Male lions do most of the hunting for the pride. | Lionesses usually do most of the hunting. The males defend the territory. |
| X016 | Penguins don't have knees. | They do have knees, hidden inside their bodies under feathers and fat. |
| X017 | Monarch butterflies live for only a single day. | Adults live weeks, and the migrating generation can live around eight months. |
| X018 | Sea otters stay warm with a thick layer of blubber. | They have no blubber. They rely on the densest fur of any animal, with up to a million hairs per square inch. |
| X019 | Snails have no teeth. | A snail's tongue-like radula can have thousands of microscopic teeth. |
| X020 | A honeybee dies after every sting, no matter what it stings. | A bee's barbed stinger gets stuck in thick skin like ours. On other insects it can pull free and survive. |
| X021 | Hummingbirds live for only a few weeks. | Many live three to five years, and some live more than a decade. |
| X022 | Blue whales mainly eat small fish. | The largest animal on Earth lives mostly on tiny krill, eating millions a day. |
| X023 | A tarantula's bite is deadly to humans. | Their bites are usually no worse than a bee sting. |
| X024 | Cats always land on their feet and are never hurt from any height. | Cats can and do get seriously injured in falls, including from high windows. |
| X025 | All sharks must swim constantly or they suffocate. | Some, like nurse sharks, can pump water over their gills while resting. |

## Fakes: Science and Space (SCI)

| ID | Statement | Reveal |
|---|---|---|
| X026 | You can easily see the Great Wall of China from the Moon with the naked eye. | It's far too narrow to see from the Moon, and it's hard to spot even from low orbit. |
| X027 | Lightning never strikes the same place twice. | It often does. The Empire State Building is hit about 20 to 25 times a year. |
| X028 | Mercury is the hottest planet because it's closest to the Sun. | Venus is hotter, because its thick atmosphere traps heat. |
| X029 | A day on Mars lasts exactly 24 hours. | A Martian day, called a sol, is about 24 hours and 37 minutes. |
| X030 | Humans only use 10% of their brains. | Brain imaging shows we use virtually all of it. Different areas are active at different times. |
| X031 | Old windows are thicker at the bottom because glass slowly flows downhill. | Glass doesn't flow at room temperature. Old panes were uneven from the manufacturing process. |
| X032 | The Amazon rainforest produces 20% of the world's oxygen. | It uses nearly as much oxygen as it makes. Most of our oxygen comes from the ocean's plankton. |
| X033 | Earth has summer because it's closer to the Sun in that season. | The seasons come from Earth's tilt. Earth is actually closest to the Sun in early January. |
| X034 | Diamonds are made from compressed coal. | Most diamonds formed deep in the mantle, long before land plants existed. |
| X035 | Water always drains in opposite directions in the Northern and Southern Hemispheres. | The Coriolis effect is too weak to affect a sink. The shape of the basin decides the swirl. |
| X036 | Sound travels faster through air than through water. | Sound moves about four times faster in water than in air. |
| X037 | The Moon's gravity is about half of Earth's. | It's only about one sixth, which is why astronauts bounced across its surface. |
| X038 | A day on Jupiter lasts about 24 hours. | Jupiter is the fastest-spinning planet, with a day of about 10 hours. |
| X039 | The Sun is the largest star in the universe. | The Sun is average. Stars like UY Scuti are hundreds of times wider. |
| X040 | Peanuts grow on trees. | They grow on low plants, and the pods develop underground. |
| X041 | A banana plant is a tree. | It's the world's largest herb. What looks like a trunk is tightly packed leaf stalks. |
| X042 | About 90% of an iceberg is above the water. | About 90% is below the surface. |
| X043 | Thunder is the sound of clouds colliding. | Thunder is the shockwave produced when lightning rapidly heats the air. |
| X044 | Mount Everest is the tallest mountain on Earth when measured from base to peak. | Mauna Kea in Hawaii is taller from its base on the ocean floor, at about 10,000 meters. |
| X045 | The Pacific is the saltiest ocean. | The Atlantic is saltier than the Pacific. |
| X046 | The Sahara is the largest desert in the world. | It's the largest hot desert, but Antarctica is the largest desert overall. |
| X047 | A penny dropped from the Empire State Building could kill someone. | A penny is too light and tumbles, so it'd hit with a sting at most. |
| X048 | Pluto is still officially classified as a planet. | In 2006 the International Astronomical Union reclassified it as a dwarf planet. |
| X049 | Earth's core is much cooler than the surface of the Sun. | The inner core is about as hot as the Sun's surface, around 5,200 °C. |
| X050 | A year on Mercury is longer than a year on Earth. | Mercury orbits the Sun in just 88 Earth days. |

## Fakes: History (HIS)

| ID | Statement | Reveal |
|---|---|---|
| X051 | Albert Einstein failed math in school. | He excelled at math and had mastered calculus by about age 15. |
| X052 | Marie Antoinette said "Let them eat cake." | There's no evidence she said it. The line appeared in writing before she arrived in France. |
| X053 | In Columbus's time, most educated people thought the Earth was flat. | Educated Europeans knew the Earth was round. The dispute was about its size. |
| X054 | The Salem witch trials ended with the accused being burned at the stake. | Those found guilty were hanged. One man was pressed to death, and none were burned. |
| X055 | Vikings wore horned helmets into battle. | There's no evidence they did. The image came from 19th-century opera costumes. |
| X056 | Napoleon was unusually short. | He was about 5'6" or 5'7", average for his time. The myth came from confusion between units and British propaganda. |
| X057 | Medieval knights commonly forced their wives to wear chastity belts. | Historians find little evidence they were used in the Middle Ages. Most are later inventions. |
| X058 | Napoleon's army shot the nose off the Great Sphinx. | Drawings from before Napoleon's time already show the nose missing. |
| X059 | George Washington had wooden teeth. | His dentures were made of ivory, metal and human and animal teeth, but not wood. |
| X060 | Ancient Roman "vomitoriums" were rooms where people threw up so they could keep eating. | A vomitorium was a passage through which crowds exited a stadium. |
| X061 | The Egyptian pyramids were built by slaves. | Evidence shows they were built by paid, fed and housed workers. |
| X062 | The Great Wall of China is one single continuous wall. | It's a network of many walls built by different dynasties across centuries. |
| X063 | Paul Revere rode through the night shouting "The British are coming!" | The colonists still considered themselves British. He warned that "the Regulars" were coming, and quietly. |
| X064 | Thomas Edison invented the first electric light bulb. | Others made bulbs earlier. Edison perfected a practical, long-lasting one. |
| X065 | Cinco de Mayo is Mexico's Independence Day. | It marks the 1862 Battle of Puebla. Mexican Independence Day is September 16. |
| X066 | The Declaration of Independence was signed by all delegates on July 4, 1776. | It was adopted on July 4, but most delegates signed on August 2. |
| X067 | The Statue of Liberty was a gift from Britain. | It was a gift from France, designed by Frédéric Bartholdi. |
| X068 | Julius Caesar was born by C-section, which is how the surgery got its name. | It's a myth. Caesar's mother lived long after his birth, and the operation then nearly always killed the mother. |
| X069 | Albert Einstein won the Nobel Prize for his theory of relativity. | He won for explaining the photoelectric effect. |
| X070 | Benjamin Franklin served as a U.S. president. | He never did, but he was a Founding Father, diplomat, inventor and writer. |
| X071 | Abraham Lincoln was born in a log cabin in Illinois. | He was born in Kentucky and grew up in Indiana before moving to Illinois. |
| X072 | The Great Fire of London in 1666 killed thousands of people. | Only a handful of deaths are verified, though the fire destroyed about 13,000 houses. |
| X073 | Roman gladiator fights always ended in death. | Gladiators were expensive to train, and many fights ended when one fighter gave up. |
| X074 | Cleopatra was ethnically Egyptian. | She was of Macedonian Greek descent, from the Ptolemaic dynasty. |
| X075 | The Hundred Years' War lasted exactly 100 years. | It lasted 116 years, from 1337 to 1453. |

## Fakes: Body, Food and World (LIFE)

| ID | Statement | Reveal |
|---|---|---|
| X076 | Shaving makes hair grow back thicker and darker. | It only looks that way. The blunt tip of cut hair feels coarser, but the growth rate and thickness don't change. |
| X077 | Cracking your knuckles gives you arthritis. | Studies found no link between knuckle cracking and arthritis. |
| X078 | You lose most of your body heat through your head. | The head loses heat in proportion to its surface area, about 10%. |
| X079 | Swallowed gum stays in your stomach for seven years. | Gum passes through your digestive system like other food, in a few days. |
| X080 | Different parts of your tongue taste different flavors. | Every taste can be detected across the tongue. The "tongue map" came from a mistranslated study. |
| X081 | Sugar makes children hyperactive. | Controlled studies found no link. Parents expect it, so they notice it more. |
| X082 | Reading in dim light permanently damages your eyes. | It can cause tired eyes, but it doesn't cause lasting damage. |
| X083 | Humans have only five senses. | We have many more, including balance, temperature, pain and body position. |
| X084 | Hair and fingernails keep growing after you die. | The skin dehydrates and retracts, which makes them look longer. |
| X085 | Eating carrots gives you night vision. | It was WWII propaganda that hid British radar. Carrots help eye health but don't give night vision. |
| X086 | You must wait 30 minutes after eating before swimming or you'll cramp and drown. | There's no evidence of this. |
| X087 | Microwave ovens cook food from the inside out. | Microwaves heat the outer layer of food and the heat spreads inward. |
| X088 | MSG is proven to be harmful to most people. | Research hasn't confirmed this. Glutamate also occurs naturally in tomatoes and cheese. |
| X089 | The tryptophan in turkey is what makes you sleepy after Thanksgiving dinner. | Turkey has about as much tryptophan as chicken. The sleepiness comes from a big meal. |
| X090 | Searing meat "seals in the juices." | Searing browns the meat for flavor, but it doesn't seal anything in. |
| X091 | Mushrooms are plants. | They're fungi, a separate kingdom, and are more closely related to animals than to plants. |
| X092 | Botanically, tomatoes are classified as vegetables. | They're fruits. In 1893 the U.S. Supreme Court ruled them vegetables for tariffs. |
| X093 | Coffee beans are the beans of a bean plant. | They're the seeds of a cherry-like fruit. |
| X094 | Rhubarb leaves make a tasty salad green. | The leaves contain oxalic acid and are poisonous. Only the stalks are eaten. |
| X095 | A small amount of chocolate is toxic to humans. | Chocolate is toxic to dogs, not to humans. |
| X096 | Scientists have proven the human appendix has no function. | It may help the immune system and store helpful gut bacteria. |
| X097 | Logical people are left-brained and creative people are right-brained. | Brain scans show both hemispheres work together on almost every task. |
| X098 | You blink about once an hour. | You blink about 15 to 20 times a minute. |
| X099 | The adult human body has 106 bones. | It has 206. |
| X100 | Going out in cold weather gives you a cold. | Colds are caused by viruses. People catch more of them in winter because they spend more time indoors together. |
| X101 | Rhode Island is the smallest U.S. state by population. | Wyoming has the smallest population. Rhode Island is the smallest by area. |
| X102 | Russia has more time zones than any other country. | France has more, counting its overseas territories (12, or 13 with Antarctica). Russia has 11. |
| X103 | Mount Rushmore is in Wyoming. | It's in the Black Hills of South Dakota. |
| X104 | Greenland is about the same size as Africa. | Africa is about 14 times bigger. Many maps stretch the area near the poles. |
| X105 | Istanbul is the capital of Turkey. | The capital is Ankara. Istanbul is the largest city. |
| X106 | Australia has a larger population than Canada. | Canada has about 40 million people versus Australia's roughly 27 million. |
| X107 | Pizza was invented in Rome. | Modern pizza comes from Naples, Italy. |
| X108 | Sushi originally started as fresh raw fish served on rice in Japan. | It began as a way of preserving fish by fermenting it in rice, and it came from Southeast Asia and China. |
| X109 | Hawaiian pizza was invented in Hawaii. | It was invented in Canada in 1962 by Sam Panopoulos. |
| X110 | Canada's red maple leaf flag has been the same since 1867. | The maple leaf flag was introduced in 1965. |
| X111 | "Big Ben" is the name of the famous clock tower in London. | Big Ben is the bell inside. The tower is called Elizabeth Tower. |
| X112 | The Pacific entrance of the Panama Canal is west of the Atlantic entrance. | The canal runs northwest to southeast, so the Pacific entrance is actually east of the Atlantic one. |

## Fakes: Tech and Pop Culture (TECH)

| ID | Statement | Reveal |
|---|---|---|
| X113 | Walt Disney's body was frozen after his death. | It's a myth. He was cremated, and his ashes are at Forest Lawn Memorial Park in California. |
| X114 | The hero of The Legend of Zelda is named Zelda. | The hero is Link. Zelda is the princess. |
| X115 | Super Mario Bros was first released on the Game Boy. | It came out on the Nintendo Entertainment System in 1985. The Game Boy came in 1989. |
| X116 | Tetris was created by Nintendo. | It was created in 1984 by Soviet engineer Alexey Pajitnov. |
| X117 | Microsoft was founded in 1995. | Microsoft was founded in 1975 by Bill Gates and Paul Allen. |
| X118 | Wikipedia launched before Google existed. | Google launched in 1998 and Wikipedia in 2001. |
| X119 | The first text message ever sent said "Hello." | It said "Merry Christmas," sent in December 1992. |
| X120 | The first iPhone was released in 2005. | It was announced and released in 2007. |
| X121 | The first video uploaded to YouTube was of a cat. | It was "Me at the zoo," a short clip of co-founder Jawed Karim at the San Diego Zoo. |
| X122 | The inventor of the World Wide Web patented it and became a billionaire. | Tim Berners-Lee chose not to patent it, so everyone could use it for free. |
| X123 | Bluetooth is named after a Swedish king. | It's named after Harald "Bluetooth" Gormsson, a Danish king who united tribes. |
| X124 | The QWERTY keyboard layout was designed to make typing faster. | A common explanation is that it was designed to keep typewriter keys from jamming, and historians still debate the details. |
| X125 | The Mona Lisa is a huge painting, about eight feet tall. | It's surprisingly small, only about 30 by 21 inches. |
