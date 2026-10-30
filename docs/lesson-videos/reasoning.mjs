export const chapters = [
  {
    caseId: 12, seconds: 100,
    goal: 'Solve a bracketed operation first, replace it with its result, and complete the remaining operation.',
    accuracy: 'Use (5 + 4) × 3 = 27, (20 ÷ 5) + 7 = 11, and (18 − 6) ÷ 3 = 4. Explain the priority of brackets without claiming that addition always comes first.',
    scenes: [
      ['Draw a safe with a two-step path and the expression (5 + 4) × 3.', 'Two steps to the code', 'This safe needs two calculation steps. The brackets tell us where to begin.'],
      ['Circle only (5 + 4) in blue. Fade the multiplication temporarily. Replace the bracketed part with nine while preserving the rest.', '(5 + 4) × 3\n9 × 3', 'Work inside the brackets first. Five plus four equals nine. Replace that part with nine. The times-three instruction is still waiting, so we are not finished yet.'],
      ['Draw three groups of nine dots and write the final result. Then introduce the division-first example and simplify it on separate lines.', '9 × 3 = 27\n(20 ÷ 5) + 7 = 4 + 7 = 11', 'Nine times three makes twenty-seven. In our next clue, twenty divided by five is inside the brackets. That makes four. Then add seven to get eleven. The brackets can contain different operations.'],
      ['Write (18 − 6) ÷ 3. Hold for four seconds. Circle the subtraction, write twelve, then divide it into three equal groups.', '(18 − 6) ÷ 3 = 12 ÷ 3 = 4', 'Try eighteen minus six, in brackets, divided by three. What happens first? Eighteen minus six makes twelve. Then twelve divided by three makes four.'],
      ['Draw a two-step arrow that keeps the outer operation visible until completed.', 'Brackets → Replace → Finish', 'Find the brackets, replace them with their result, and finish the remaining step. Now try your quiz!'],
    ],
  },
  {
    caseId: 14, seconds: 120,
    goal: 'Find missing numbers in different positions using inverse relationships, including missing subtrahends and divisors, then substitute to check.',
    accuracy: 'Do not teach a blanket rule that every missing number is found by subtracting. Show □ + 9 = 23 → 14; 31 − □ = 12 → 19; □ ÷ 4 = 5 → 20; 35 ÷ □ = 7 → 5; and 6 × □ = 30 → 5.',
    scenes: [
      ['Draw a lock and an empty square in the equation □ + 9 = 23.', 'What belongs in the box?', 'A number is hiding in this box. We can find it by checking how the numbers fit together.'],
      ['Use a part-whole bar: total twenty-three, known part nine, unknown part. Then draw total thirty-one with twelve remaining and an unknown removed part.', '□ + 9 = 23 → 23 − 9 = 14\n31 − □ = 12 → 31 − 12 = 19', 'Something plus nine makes twenty-three. Undo adding nine: twenty-three minus nine is fourteen. Now, thirty-one minus something leaves twelve. The missing part is nineteen, because nineteen and twelve make thirty-one.'],
      ['Draw four groups of five for the missing-total example. Then draw thirty-five objects grouped into sevens to find how many groups. Use separate clear boards.', '□ ÷ 4 = 5 → 4 × 5 = 20\n35 ÷ □ = 7 → 35 ÷ 7 = 5', 'If a total shared among four groups gives five each, multiply four by five. The total is twenty. If thirty-five shared among some groups gives seven each, count groups of seven. There are five groups, so five belongs in the box.'],
      ['Write 6 × □ = 30. Hold silently for four seconds, then show six groups of five and substitute five in the original equation.', '6 × □ = 30\n30 ÷ 6 = 5\n6 × 5 = 30', 'Try six times something equals thirty. Which number fits? Divide thirty by six to get five. Put five back in the box. Six times five is thirty, so it works.'],
      ['Underline the box position in three different equations, then draw a check mark after substitution.', 'Read → Find → Put it back', 'Notice where the box is. Use the number relationship, then check the original equation. Try your quiz!'],
    ],
  },
  {
    caseId: 15, seconds: 105,
    goal: 'Round each operand to the nearest ten, estimate a sum or difference, and distinguish an estimate from an exact answer.',
    accuracy: 'For positive whole numbers halfway between tens, round up. Use 37 + 24 ≈ 40 + 20 = 60; 183 − 62 ≈ 180 − 60 = 120; and 66 + 13 ≈ 70 + 10 = 80. Keep ≈ distinct from =.',
    scenes: [
      ['Draw two stacks labeled 37 and 24 beside a magnifying glass.', 'About how many?', 'Sometimes a quick estimate is enough. We can use nearby tens to make the calculation easier.'],
      ['Draw separate equally spaced number lines from thirty to forty and twenty to thirty. Mark thirty-seven and twenty-four, then animate each moving to the closest ten.', '37 → 40\n24 → 20', 'Thirty-seven is closer to forty than thirty. Twenty-four is closer to twenty than thirty. When a whole number is exactly halfway, such as thirty-five, we round up to the next ten.'],
      ['Combine the rounded values, using an approximate-equality symbol. Wipe the board and show a subtraction example with both operands rounded.', '37 + 24 ≈ 60\n183 − 62 ≈ 120', 'Forty plus twenty is sixty, so our first total is about sixty. For one hundred eighty-three minus sixty-two, use one hundred eighty minus sixty. That estimate is one hundred twenty. An estimate is close, not necessarily exact.'],
      ['Write 66 + 13. Hold for four seconds, then show each rounding arrow before the estimated sum.', '66 → 70\n13 → 10\n66 + 13 ≈ 80', 'Try estimating sixty-six plus thirteen. Round each number to a nearby ten. Seventy plus ten makes eighty, so the total is about eighty.'],
      ['Circle the approximately-equal sign and write a short reminder.', 'Round each → Calculate → About', 'Round the numbers, calculate with the rounded values, and say about. Use this shortcut in your quiz!'],
    ],
  },
  {
    caseId: 18, seconds: 115,
    goal: 'Choose addition, subtraction, or multiplication from the structure of a word problem, including comparisons phrased as how many more.',
    accuracy: 'Use new stories. Joining 7 and 5 gives 12; removing 4 from 16 leaves 12; 3 equal bags of 5 hold 15; comparing 17 with 11 gives a difference of 6. Never teach keyword-only operation rules.',
    scenes: [
      ['Draw three market clues: two joining baskets, a basket with some items leaving, and repeated equal bags.', 'What is happening?', 'A story hides a math operation. Picture what happens before choosing a sign.'],
      ['Move seven oranges and five oranges into one basket. Next, show sixteen oranges with four removed.', 'Join: 7 + 5 = 12\nTake away: 16 − 4 = 12', 'Seven oranges join five more. We add to find the total. Sixteen oranges with four sold means some leave. We subtract to find what remains. Read the whole situation.'],
      ['Draw three identical bags with five apples each. Then draw bars for seventeen and eleven stickers, align their starts, and circle only the extra length.', 'Equal groups: 3 × 5 = 15\nCompare: 17 − 11 = 6', 'Three bags with five apples each are equal groups, so we multiply. Now compare seventeen stickers with eleven. How many more? Find the gap by subtracting. The word more does not always mean add.'],
      ['Draw Rani with fourteen ribbons and Dika with nine, using aligned bars. Hold for four seconds, then highlight the five extra ribbons.', '14 − 9 = 5', 'Rani has fourteen ribbons. Dika has nine. How many more does Rani have? Choose the operation first. Subtract to compare. Fourteen minus nine is five.'],
      ['Write three operation symbols beside their matching picture patterns.', 'Join +\nTake away or compare −\nEqual groups ×', 'Picture the story, find the relationship, then choose the operation. You are ready for your story quiz!'],
    ],
  },
  {
    caseId: 19, seconds: 120,
    goal: 'Recalculate a proposed answer and identify correct work, a regrouping mistake, or use of the wrong operation.',
    accuracy: 'Mistaken results must be labeled as claims, never presented as correct equalities without qualification. Use 23 + 14 = 37 as correct; 27 + 18 claimed 35, correct 45; 64 − 27 claimed 47 after forgetting to reduce the tens, correct 37; 5 × 4 claimed 9, correct 20.',
    scenes: [
      ['Draw an open notebook labeled Check the claim, with a friendly pencil character.', 'Mistakes are clues', 'Detectives check their work. A mistake can show us which step needs another look.'],
      ['Write 23 + 14 = 37 and check it with tens and ones. Then show 27 + 18 with a clearly boxed claimed answer of 35.', 'Correct: 23 + 14 = 37\nClaim: 27 + 18 gives 35', 'First, solve the calculation yourself. Twenty-three plus fourteen is thirty-seven, so that claim is correct. For twenty-seven plus eighteen, the ones make fifteen. We must include the extra ten.'],
      ['Correct the addition to forty-five. Next, animate a ten exchange for 64 − 27, showing the tens decrease. Finally contrast five groups of four with five plus four.', '27 + 18 = 45\n64 − 27 = 37\n5 × 4 = 20', 'The sum is forty-five, not thirty-five. In subtraction, exchanging a ten also reduces the tens count. Sixty-four minus twenty-seven is thirty-seven. Another claim says five times four gives nine. Nine comes from adding; multiplication gives twenty. That claim used the wrong operation.'],
      ['Write 36 + 27 with a boxed claimed answer of 53. Hold for four seconds, then exchange thirteen ones into one ten and three ones.', 'Claim: 53\n36 + 27 = 63\nMissing regrouped ten', 'A notebook claims thirty-six plus twenty-seven is fifty-three. What went wrong? The ones make thirteen. The extra ten was forgotten. The correct total is sixty-three.'],
      ['Draw three labeled folders for the quiz categories. Keep the tone friendly and avoid alarm sounds.', 'Correct / Regrouping / Wrong operation', 'Recalculate, compare, and explain the step that changed the answer. Mistakes help us learn. Now try your quiz!'],
    ],
  },
];
