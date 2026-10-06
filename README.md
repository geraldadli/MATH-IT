# Math It!

Crack the Clue, Math It Through! Twelve bilingual, pressure-free mathematics cases for Grade 3 (Phase B).

## Run

Use Node.js 24 or newer.

```sh
npm install
npm run dev
```

## Verify

```sh
npm test
npm run lint
npm run build
```

## Play

Create a detective name, pick an animal partner and coat color, then open the first case. Drag clues with a mouse or touch, or select a clue and choose its destination. Keyboard users can press Enter to select, Tab to a destination button, and Enter to place; Space and arrow keys also support dragging. Undo, reset, and illustrated hints are always available without penalties.

Each case has three destinations and unlocks the next case when solved. Start with sharing 12 biscuits and sorting multiples, then investigate addition, subtraction, comparisons, multiplication, division, place value, fractions, length, elapsed time, and two-step calculations. The first two cases preserve existing players’ progress.

In the multiples case, 12 has two copies so it can belong to both groups. Move either copy to change its group, or return it to the tray. Each first completion earns 100 points, up to 1,200 points; replays do not award additional points. Saved progress keeps only the uninterrupted sequence of solved cases.

The ID/EN switch translates the interface, instructions, hints, and feedback. The profile button edits the detective card. The top-bar Sound button enables bubbly click, pickup, drop, hint, and success sounds alongside an original, softly layered music loop. Audio continues across the welcome screen, dashboard, and cases, pauses when the tab is hidden, and stops when muted. The sound preference is saved; browsers may require a click or keypress before playback begins. All audio is synthesized locally with Web Audio, with no downloaded tracks or new audio dependencies.

Hints offer one short thinking prompt at a time, with optional next/back controls and unfinished visual examples. They guide a method without revealing card answers. Lenis gives mouse-wheel and trackpad scrolling a gentle coast after input stops; touch keeps the device’s native momentum. Clicking, keyboard input, and changing cases stop the coast so controls and draggable clues stay stable. Dialogs and nested scroll areas scroll natively. Reduced-motion preferences disable inertia and decorative motion. Dashboard and welcome sections also glide into view in browsers with CSS view-timeline support.

## Files

- `src/types.ts`: strict player, avatar, case, and drop-zone types.
- `src/i18n.ts`: English and Indonesian dictionaries.
- `src/cases.ts`: the twelve cases, bilingual missions, token labels, accepted groups, and visual hints.
- `src/GameContext.tsx`: profile, language, sound preference, score, and linear progress saved in localStorage.
- `src/gameLogic.ts`: immutable clue movement and case validation.
- `src/GameBoard.tsx`: @dnd-kit/core workspace, history, feedback, and native hint dialog.
- `src/App.tsx`: onboarding, dashboard, gameplay navigation, and profile editor.
- `src/Illustrations.tsx`: original vector artwork and icons.
- `src/audio.ts`: bubble sound synthesis and the original 64-step melody.
- `src/useAudio.ts`: shared playback, click sounds, muting, and tab visibility handling.
- `scripts/check-game.mjs`: dependency-free checks solving all twelve cases, rejecting invalid solutions, enforcing progression, normalizing saved progress, and verifying copies and undo snapshots.
- `scripts/check-audio.mjs`: checks sound envelopes, pitch glides, volume bounds, oscillator cleanup, and melody looping.

Profiles and completed cases stay on this browser/device; in-progress clue placements reset when leaving a case. Storage failures do not interrupt play. No backend or account is required. Google Fonts are optional; system fonts are the fallback.
