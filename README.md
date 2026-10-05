# Math It!

Crack the Clue, Math It Through! A bilingual, pressure-free mathematics casebook for Grade 3 (Phase B).

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

Share 12 biscuits equally between three bags to unlock the number case. Sort 8, 9, 12, 15, 16, and 7 into multiples of 3, multiples of 4, and neither. The number 12 has two copies so it can belong to both groups. Each first completion earns 100 points; replays do not award additional points.

The ID/EN switch translates the interface, instructions, hints, and feedback. The profile button edits the detective card. The footer sound toggle enables gentle Web Audio music and feedback during gameplay.

## Files

- `src/types.ts`: strict player, avatar, case, and drop-zone types.
- `src/i18n.ts`: English and Indonesian dictionaries.
- `src/GameContext.tsx`: profile, language, sound preference, score, and linear progress saved in localStorage.
- `src/gameLogic.ts`: immutable clue movement and case validation.
- `src/GameBoard.tsx`: @dnd-kit/core workspace, history, feedback, and native hint dialog.
- `src/App.tsx`: onboarding, dashboard, gameplay navigation, and profile editor.
- `src/Illustrations.tsx`: original vector artwork and icons.
- `src/useAudio.ts`: optional synthesized music and sound effects.
- `scripts/check-game.mjs`: dependency-free checks for scoring prerequisites, strict case validation, copy behavior, and undo snapshots.

Profiles and completed cases stay on this browser/device; in-progress clue placements reset when leaving a case. Storage failures do not interrupt play. No backend or account is required. Google Fonts are optional; system fonts are the fallback.
