#!/bin/sh
# Runs every check. Browser tests need: pip install playwright (uses system Chrome).
cd "$(dirname "$0")/.." || exit 1
set -e
set -o pipefail 2>/dev/null || true
node tests/check-data.js | tail -1
node tests/check-logic.js | tail -1
python3 tests/smoke.py | tail -1
python3 tests/interaction.py | tail -1
python3 tests/audio_confetti.py | tail -1
python3 tests/layout.py | tail -1
python3 tests/all_cards.py | tail -1
