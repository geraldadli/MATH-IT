# Math It!

Crack the Clue, Math It Through! Twenty-seven bilingual, pressure-free mathematics cases for Grade 3 (Phase B).

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

A player's first case opens a short drag/tap demonstration. Dismiss it with “Let me try”, the close button, or Escape; dismissal is remembered on this device. “How to move” reopens it from any case. The demonstration never moves real clues and respects reduced-motion preferences. The dashboard starts with a unit picker showing each unit's progress. For the chosen unit, it features the current case, previews the next two, and keeps solved cases in an expandable replay section.

The cases are grouped into four units. They follow the TIMSS Grade 4 content domains, with algebra and reasoning split out of Number to keep the units balanced:

| Unit | Cases |
|---|---|
| 1 · Numbers & operations | sharing, multiples, addition, subtraction, comparing, multiplication, division, place value, fractions, money |
| 2 · Algebra & reasoning | two-step problems, missing numbers, estimation, word problems, spotting mistakes |
| 3 · Measurement & geometry | length, elapsed time, 2D shapes, mass |
| 4 · Data analysis | pictographs, bar charts, line charts, pictograph keys, pie charts, interactive dashboards (filter, sort, group & view) |

Every unit is open from the start. Within a unit, cases are numbered from 1 and each solved case unlocks the next. Case IDs stay fixed for saved progress, and new cases join the end of their unit.

Each clue case has three destinations. Start with sharing 12 biscuits and sorting multiples, then investigate addition, subtraction, comparisons, multiplication, division, place value, fractions, length, elapsed time, and two-step calculations. Cases 13–17 fill the remaining Phase B curriculum areas: sorting 2D shapes by equal sides and right angles (geometry), missing numbers (early algebra), estimating by rounding, Rupiah prices and change, and grams and kilograms. Their answer groups hold different numbers of clues, so the last clues cannot be placed by elimination. Cases 18–22 target the weakest areas in Indonesia's PISA and TIMSS results: reading, applying, and reasoning. Players choose the operation a short story needs (including a "how many more" story that needs subtraction), check the answers in a suspect's notebook (drawn as lined paper, with the suspect's answer in red pen) and decide whether each is correct, forgot to carry or borrow, or used the wrong sign, and answer questions from a pictograph, a bar chart, and a line chart of a growing bean sprout. Unit 4 continues with a reading-corner pictograph, where each book icon is 10 books and half an icon is 5, and a pie chart of how 24 students get to school. Its slices are halves, quarters, and eighths, with faint white guides marking each eighth so children can count equal parts.

Unit 4 ends with three interactive dashboard cases, where students learn real data tools instead of sorting clues. Each case adds one tool: the canteen dashboard has a **Filter** (which day sold the most milk?), the library dashboard adds **Sort** (line up the classes, fewest science books first), and the sports day dashboard adds **Bars show** and **View** (in which event did Blue team score most?). Every tool card names the tool and says what it does in one line. Controls are radio chips, so they work with a tap, a click, or the arrow keys. The bar chart redraws instantly, rescales to the data on show, and a "Showing" line spells out the current setup (bars, filter, order). Students tap a bar, or a table row in the table view, to choose an answer.

The answer counts only with the right combination: the tools set up the way the question needs, and the right bar chosen. The data is built so the starting view, and every other filter, points to a different bar, which makes exploring the tools necessary rather than optional; `npm test` enforces this. Checking highlights only the tools that need another look, with the same "Look again" label as clue groups, and never says which option to choose. A tool is never blamed for a wrong bar: once every tool fits, the chart itself is flagged. Changing what the bars show resets the filter and the chosen answer, since both belong to the old bars. Bars run sideways so long names fit on phones. On phones, the two-option tools share a row so the chart stays close to the controls, and narrow scales label every other gridline. Values stay off the bars, because reading the scale is still the skill; screen readers hear each bar's value, and the table view shows exact numbers.

Charts are drawn as inline SVG that fits its container. Values are deliberately unlabeled, because reading them from the scale is the skill being practised, and unnumbered half-step gridlines support reading between labels. On narrow screens, two-word axis labels stack onto two lines. Screen readers get each chart as a data table. The first two cases preserve existing players’ progress.

Checking an incorrect arrangement highlights only the groups needing review, using a warm border and a “Look again” label without identifying individual answers or destinations. Remaining clues highlight the tray. Moving a clue, undoing, or resetting clears this feedback. On screens up to 650px wide, groups stack vertically and clues have touch targets of at least 52px.

In the multiples case, 12 has two copies so it can belong to both groups; in the shapes case, the square does the same. Move either copy to change its group, or return it to the tray. Each first completion earns 100 XP, up to 2,700 XP; replays do not award more. Saved progress keeps each unit's uninterrupted run of solved cases, so progress saved before units existed carries over.

XP raises the detective's level. Early levels come quickly and later ones need a few more cases, and the top rank needs every case:

| Level | Rank (EN / ID) | XP |
|---|---|---|
| 1 | Rookie / Detektif Pemula | 0 |
| 2 | Clue Spotter / Pencari Petunjuk | 100 |
| 3 | Junior Detective / Detektif Junior | 300 |
| 4 | Puzzle Solver / Pemecah Teka-teki | 500 |
| 5 | Detective / Detektif | 800 |
| 6 | Senior Detective / Detektif Senior | 1,100 |
| 7 | Inspector / Inspektur | 1,500 |
| 8 | Chief Inspector / Kepala Inspektur | 1,900 |
| 9 | Master Detective / Detektif Ulung | 2,300 |
| 10 | Legendary Detective / Detektif Legendaris | 2,700 |

The dashboard shows the current rank with an XP bar and the XP left to the next level, and the profile avatar carries a level chip. A solve that crosses a threshold adds a "Level up!" callout with the new rank and plays a brighter fanfare. XP and level are always recalculated from solved cases, so they cannot drift from saved progress. When cases are added, thresholds only ever move down, so no saved detective loses a rank: Master Detective moved from 2,400 to 2,300 XP when the dashboards arrived, and anyone who had finished all 24 earlier cases keeps that rank, with Legendary Detective as their next goal.

The app uses the Night Desk theme: a navy dark mode (the default) and a warm-paper Day Desk light mode, both with amber accents. Headings use Short Stack and body text uses Onest. The sun/moon button at the top right switches modes in one click. The choice is saved on this device, and a small script in `index.html` applies it before first paint so the page never flashes the wrong colours. Every colour is a token defined twice in `src/index.css`, once per mode. Charts use their own `--chart-*` tokens: the pie keeps the validated categorical order, with steps re-chosen for the dark surface. The avatar colour swatches keep each partner's real coat colour in both modes. On screens up to 520px wide the top-bar controls shrink so all five fit. The wordmark gets smaller from 400px and hides at 350px, leaving the brand mark as the home button. It is also the only top-bar item allowed to give way, so the controls always stay on screen. The page never grows wider than the phone: anything that pokes out sideways is clipped, and iOS landscape text enlargement is turned off. Without this, zooming out on a phone would show an empty strip on the right.

The ID/EN switch translates the interface, instructions, hints, and feedback. The profile button edits the detective card. The top-bar Sound button enables bubbly click, pickup, drop, hint, and success sounds alongside an original, softly layered music loop. Audio continues across the welcome screen, dashboard, and cases, pauses when the tab is hidden, and stops when muted. The sound preference is saved; browsers may require a click or keypress before playback begins. All audio is synthesized locally with Web Audio, with no downloaded tracks or new audio dependencies.

Hints offer one short thinking prompt at a time, with optional next/back controls and unfinished visual examples. They guide a method without revealing card answers. Lenis gives mouse-wheel and trackpad scrolling a gentle coast after input stops; touch keeps the device’s native momentum. Clicking, keyboard input, and changing cases stop the coast so controls and draggable clues stay stable. Dialogs and nested scroll areas scroll natively. Reduced-motion preferences disable inertia and decorative motion. Dashboard and welcome sections also glide into view in browsers with CSS view-timeline support.

## Files

- `src/types.ts`: strict player, avatar, case, and drop-zone types.
- `src/i18n.ts`: English and Indonesian dictionaries.
- `src/cases.ts`: the four units, the twenty-seven cases, bilingual missions, token labels, accepted groups, dashboard data and goals, and visual hints.
- `src/GameContext.tsx`: profile, language, sound preference, XP, and per-unit progress saved in localStorage.
- `src/levels.ts`: XP per case, the ten bilingual detective ranks, and level progress.
- `src/gameLogic.ts`: immutable clue movement, case validation, and unit progression.
- `src/GameBoard.tsx`: picks the right board for a case; the clue board's @dnd-kit/core workspace, history, and feedback.
- `src/DashboardBoard.tsx`: dashboard tool cards, sideways bar chart, table view, answer choice, and tool feedback.
- `src/dashboard.ts`: dashboard views (grouping, filtering, sorting), the answer, tool review, and chart scales.
- `src/CaseParts.tsx`: the briefing, solve celebration, and hint dialog both boards share; `src/useCaseSolve.ts` records a solve and its reward.
- `src/EvidenceChart.tsx`: responsive SVG bar, line, pictograph, and pie charts with a screen-reader table, coloured by theme tokens.
- `src/index.css`: fonts, base styles, and the light and dark colour tokens.
- `src/InteractionDemo.tsx`: dismissible, replayable drag/tap demonstration.
- `src/App.tsx`: onboarding, dashboard, gameplay navigation, and profile editor.
- `src/Illustrations.tsx`: original vector artwork and icons.
- `src/audio.ts`: bubble sound synthesis and the original 64-step melody.
- `src/useAudio.ts`: shared playback, click sounds, muting, and tab visibility handling.
- `scripts/check-game.mjs`: dependency-free checks solving all twenty-seven cases, proving each dashboard needs its tools and has one clear answer, validating chart data, rejecting invalid solutions, enforcing per-unit progression, normalizing saved progress, verifying copies and undo snapshots, and checking the level curve.
- `scripts/check-audio.mjs`: checks sound envelopes, pitch glides, volume bounds, oscillator cleanup, and melody looping.

Profiles and completed cases stay on this browser/device; in-progress clue placements reset when leaving a case. Storage failures do not interrupt play. No backend or account is required. Google Fonts are optional; system fonts are the fallback.
