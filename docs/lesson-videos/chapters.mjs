// Production directions, exact screen text, and exact English voiceover.
// Scene fields: visual, screen, narration. Case IDs map to src/cases.ts.
export const chapters = [
  {
    caseId: 1, seconds: 90,
    goal: 'Share a collection equally, one object per group each round, and check that no objects remain.',
    accuracy: 'Keep exactly 9 buttons and 3 bowls in the worked example. Equal means the same number in every bowl. The practice uses 8 buttons and 2 bowls.',
    scenes: [
      ['Draw a detective badge, nine buttons, and three empty bowls. The hand circles all nine buttons.', 'Fair shares', 'Hello, detective! Can we share these nine buttons fairly among three bowls?'],
      ['Draw one arrow to each bowl. Move one button into each bowl, then stop with three buttons placed and six waiting.', 'One in each bowl', 'Equal sharing means every bowl gets the same number. Give each bowl one button before starting the next round. Keep going around in the same order.'],
      ['Animate two more rounds. Stop with three buttons in each bowl. Circle the empty starting area, then write the equation.', '9 ÷ 3 = 3', 'After three rounds, each bowl has three buttons. Nothing is left. Nine shared equally among three gives three in each bowl. Check by counting every bowl. They all match!'],
      ['Replace the example with eight stars and two boxes. Ask the question, hold silently for four seconds, then deal four stars into each box.', '8 shared between 2 → 4 each', 'Your turn: share eight stars equally between two boxes. How many go in each? Think for a moment. Each box gets four. Four and four make eight.'],
      ['Draw three ticks beside the checks. End on a small detective badge and quiz invitation.', 'Share → Count → Check', 'Share one at a time. Check every group is equal and nothing is left. Now try your quiz!'],
    ],
  },
  {
    caseId: 2, seconds: 105,
    goal: 'Recognize multiples through equal jumps and classify a number as a multiple of 3, of 4, of both, or of neither.',
    accuracy: 'Show number lines with equal spacing. Use new cards 18, 20, 24, and 11. A number that fits both rules needs a copy in each of the two quiz groups.',
    scenes: [
      ['Draw two code paths, one with hops of three and one with hops of four.', 'Number jumps', 'Detective, these number codes follow a pattern. Let us uncover their equal jumps.'],
      ['Draw equally spaced ticks from zero to twenty-four. Trace jumps of three on the first path and four on the second, labeling each landing.', '3, 6, 9, 12, …\n4, 8, 12, 16, …', 'Multiples are totals we reach by adding the same number again and again. Count in threes for multiples of three. Count in fours for multiples of four.'],
      ['Test cards 18, 20, 24, and 11 against the two paths. Put 18 with threes, 20 with fours, two copies of 24 in both groups, and 11 in neither.', '18: threes\n20: fours\n24: both\n11: neither', 'Eighteen is six groups of three. Twenty is five groups of four. Twenty-four appears on both paths, so it fits both rules. Eleven appears on neither. Check both rules before choosing a group.'],
      ['Draw a fresh card labeled 36. Hold for four silent seconds, then write both multiplication checks and duplicate the card.', '36 = 3 × 12 = 4 × 9', 'Try thirty-six. Does it fit threes, fours, both, or neither? It fits both! Three times twelve and four times nine both make thirty-six.'],
      ['Circle the two checking paths and finish with a quiz invitation.', 'Check both rules', 'A clue can fit two rules. Use both copies when needed. Ready to investigate your quiz?'],
    ],
  },
  {
    caseId: 3, seconds: 100,
    goal: 'Add two-digit numbers by combining ones, regrouping ten ones as one ten, and then combining tens.',
    accuracy: 'Draw a ten rod as exactly ten unit squares. Align tens and ones. In 27 + 15, twelve ones become one ten and two ones; the total is 42.',
    scenes: [
      ['Draw two parcels labeled 27 and 15, then an empty total box.', '27 + 15 = ?', 'Two parcels contain twenty-seven and fifteen stickers. How many stickers are there altogether?'],
      ['Draw labeled tens and ones columns. Show 27 as two rods and seven dots, and 15 as one rod and five dots.', 'Tens | Ones', 'Break each number into tens and ones. Twenty-seven has two tens and seven ones. Fifteen has one ten and five ones. Keep matching places together.'],
      ['Combine the twelve dots. Loop ten dots and exchange them for a rod. Move the new rod into the tens column and write the column sum.', '7 + 5 = 12\n30 + 10 + 2 = 42', 'Add the ones first. Seven plus five makes twelve. Exchange ten ones for one ten, leaving two ones. Now count four tens and two ones. The total is forty-two. The new ten must be counted too.'],
      ['Write 36 + 16 with aligned columns. Hold for four seconds, then draw one exchanged ten and reveal the result.', '36 + 16 = 52', 'Try thirty-six plus sixteen. What happens to the ones? Six plus six makes twelve. Regroup one ten. Five tens and two ones make fifty-two.'],
      ['Underline the exchanged ten once and draw a three-step reminder.', 'Ones → Regroup → Tens', 'Add the ones, regroup if needed, then add the tens. Take this method into your quiz!'],
    ],
  },
  {
    caseId: 4, seconds: 110,
    goal: 'Subtract two-digit numbers by exchanging one ten for ten ones and verify the result with addition.',
    accuracy: 'In 64 − 27, exchange 6 tens 4 ones for 5 tens 14 ones. Remove 2 tens 7 ones, leaving 37. Also demonstrate a zero in the ones place with 70 − 26 = 44.',
    scenes: [
      ['Draw a stamp album labeled 64 and a small envelope labeled 27 sent.', '64 − 27 = ?', 'We have sixty-four stamps and send twenty-seven. Let us find how many remain.'],
      ['Draw six ten rods and four dots in aligned columns. Exchange one rod for ten dots without changing the total.', '64 = 50 + 14', 'Four ones are not enough to take away seven ones. Exchange one ten for ten ones. We still have sixty-four: five tens and fourteen ones.'],
      ['Cross out seven ones and two rods. Count three rods and seven dots. Write the subtraction, then its addition check.', '64 − 27 = 37\n37 + 27 = 64', 'Fourteen minus seven leaves seven ones. Five tens minus two tens leaves three tens. Thirty-seven stamps remain. Add twenty-seven back to thirty-seven. We return to sixty-four, so our answer checks out.'],
      ['Write 70 − 26. Hold for four seconds. Exchange one of seven rods for ten dots; remove two rods and six dots.', '70 = 60 + 10\n70 − 26 = 44', 'Try seventy minus twenty-six. Even zero ones can become ten ones when we exchange a ten. Ten minus six is four. Six tens minus two tens is four tens. Forty-four remain.'],
      ['Circle the reduced tens digit and draw the inverse arrow.', 'Exchange → Subtract → Check', 'When you exchange a ten, reduce the tens count too. Subtract, then check by adding. Your quiz is next!'],
    ],
  },
  {
    caseId: 5, seconds: 95,
    goal: 'Evaluate a calculation before comparing its result with a reference number using less than, equal to, or greater than.',
    accuracy: 'Use 50 as the teaching reference, distinct from the quiz reference of 40. The open side of < or > faces the larger value; number-line spacing must be equal.',
    scenes: [
      ['Draw a number checkpoint labeled 50 and a clue labeled 32 + 15.', 'Calculate, then compare', 'This checkpoint compares answers with fifty. First we must solve the clue.'],
      ['Write 32 + 15 = 47. Draw a number line from forty to sixty, mark forty-seven and fifty, and trace left to right.', '47 < 50', 'Thirty-two plus fifteen makes forty-seven. Forty-seven is left of fifty on the number line, so it is less than fifty. Compare the answer, not just one number in the clue.'],
      ['Add clue 68 − 18 = 50 and clue 29 + 24 = 53. Mark both results and draw three comparison signs.', '50 = 50\n53 > 50', 'Sixty-eight minus eighteen equals fifty, so the values are equal. Twenty-nine plus twenty-four makes fifty-three, which is greater than fifty. The open side of the comparison sign faces the larger number.'],
      ['Write 61 − 13 beside a checkpoint of fifty. Hold for four seconds, then mark forty-eight to the left.', '61 − 13 = 48\n48 < 50', 'Try sixty-one minus thirteen. Is the answer less than, equal to, or greater than fifty? It is forty-eight, so it is less than fifty.'],
      ['Draw a calculator pencil icon followed by a number line icon.', 'Solve → Compare', 'Solve first. Read the checkpoint number carefully, then compare. You are ready for your quiz!'],
    ],
  },
  {
    caseId: 6, seconds: 95,
    goal: 'Interpret multiplication as equal groups and repeated addition, distinguishing group count from items per group.',
    accuracy: 'The worked example is 4 groups of 5 flowers, 20 total. The practice is 3 groups of 7, 21 total. Keep all groups equal.',
    scenes: [
      ['Draw four garden pots, each with five simple flowers.', 'Equal groups', 'Our garden has four pots with five flowers in each. How many flowers altogether?'],
      ['Circle each pot once, then point to the five flowers in a single pot. Write labels beside the two factors.', '4 groups × 5 each', 'Multiplication counts equal groups. One number tells us how many groups. The other tells us how many things are in each group. Every pot here has five flowers.'],
      ['Highlight pots one by one while building repeated addition. Then arrange the flowers as four rows of five.', '5 + 5 + 5 + 5 = 20\n4 × 5 = 20', 'Count five, ten, fifteen, twenty. Adding five four times is the same as four times five. There are twenty flowers. A neat array helps us check that we included every group.'],
      ['Draw three baskets, each holding seven seeds. Hold for four seconds, then count the three equal groups.', '7 + 7 + 7 = 21\n3 × 7 = 21', 'Now imagine three baskets with seven seeds in each. How many seeds? Seven, fourteen, twenty-one. Three times seven is twenty-one.'],
      ['Draw a group-count label and an each-group label joining at a multiplication sign.', 'Groups × Each = Total', 'Count the groups and the number in each. Multiply to find the total. Try your quiz!'],
    ],
  },
  {
    caseId: 7, seconds: 95,
    goal: 'Use division to find the amount per group in equal sharing and use multiplication to check the result.',
    accuracy: 'Use 15 parcels shared among 3 teams, then 28 shared among 4 teams. The divisor counts teams and the quotient counts parcels per team.',
    scenes: [
      ['Draw fifteen small parcels and three team circles.', '15 ÷ 3 = ?', 'Fifteen parcels need to go equally to three teams. How many will each team receive?'],
      ['Circle the fifteen-parcel total, then the three teams. Deal one parcel to each team in sequence.', 'Total ÷ Teams = Each share', 'Division can tell us the size of an equal share. Start with the total number of parcels. Share them one at a time among the teams, keeping each round fair.'],
      ['Complete five rounds. Count five parcels inside each circle and write a multiplication check.', '15 ÷ 3 = 5\n3 × 5 = 15', 'Each team receives five parcels. Fifteen divided by three equals five. To check, multiply three teams by five parcels each. That makes fifteen parcels again. All parcels have been shared.'],
      ['Draw four boxes and write 28 parcels. Hold for four seconds, then show seven tally marks inside each box.', '28 ÷ 4 = 7\n4 × 7 = 28', 'Try twenty-eight parcels shared among four teams. How many per team? Seven. Four groups of seven make twenty-eight, so our share is correct.'],
      ['Draw a sharing arrow and a reverse multiplication arrow.', 'Share equally → Check by multiplying', 'Find each equal share, then multiply to check the total. Use the same idea in your quiz!'],
    ],
  },
  {
    caseId: 8, seconds: 110,
    goal: 'Combine hundreds, tens, and ones, including nonstandard partitions that require regrouping.',
    accuracy: 'A hundred flat represents 100, a ten rod 10, and a dot 1. Show 300 + 60 + 7 = 367; 200 + 160 + 7 = 367; and 300 + 50 + 17 = 367.',
    scenes: [
      ['Draw a vault with three labeled columns and number parts waiting outside.', 'Hundreds | Tens | Ones', 'This vault opens when we put number parts together. Each place has its own value.'],
      ['Place three hundred flats, six rods, and seven dots in their columns. Write the expanded form and total.', '300 + 60 + 7 = 367', 'Three hundreds, six tens, and seven ones make three hundred sixty-seven. The digit three means three hundred here, because it sits in the hundreds place.'],
      ['Replace the parts with two hundred flats, sixteen rods, and seven dots. Trade ten rods for a flat. Then briefly show seventeen ones regrouping.', '200 + 160 + 7 = 367\n300 + 50 + 17 = 367', 'Different parts can make the same number. One hundred sixty is one hundred and sixty. Combine it with two hundred and seven to make three hundred sixty-seven. Seventeen ones can also become one ten and seven ones.'],
      ['Write 400 + 130 + 6. Hold for four seconds, then exchange ten tens for one hundred.', '400 + 130 + 6 = 536', 'Try four hundred plus one hundred thirty plus six. Which parts can you combine? Five hundreds, three tens, and six ones make five hundred thirty-six.'],
      ['Circle the three place headings and draw exchange arrows labeled ten.', '10 ones = 1 ten\n10 tens = 1 hundred', 'Group matching places and exchange when needed. Check all three digits, then start your quiz!'],
    ],
  },
  {
    caseId: 9, seconds: 100,
    goal: 'Recognize one quarter, one half, and three quarters from equal-area models, including two quarters as one half.',
    accuracy: 'Use same-size rectangular wholes partitioned into four equal-area parts. Never imply that unequal pieces are quarters. Fraction equivalences are required concepts shared with the quiz.',
    scenes: [
      ['Draw a treasure map as a rectangle. Divide it into four equal-width sections.', 'Equal parts of one whole', 'Our map is one whole. Fractions help us describe part of that whole.'],
      ['Shade one section blue. Write a large stacked fraction with arrows to numerator and denominator.', '1/4\n1 shaded / 4 equal parts', 'The bottom number counts all the equal parts. The top number counts the shaded parts. One shaded part out of four equal parts is one quarter.'],
      ['Draw two more identical maps. Shade two sections in one and three in the other. Outline two equal halves on the middle map.', '2/4 = 1/2\n3/4', 'Two shaded quarters cover half the map, so two quarters equals one half. Three shaded quarters means three quarters. Always count all the parts, including the parts that are not shaded.'],
      ['Draw a fresh rectangle with four equal parts; shade three. Hold for four seconds, then trace the shaded pieces and reveal the fraction.', '3 shaded out of 4 = 3/4', 'Your turn. Three of four equal parts are shaded. What fraction is shaded? Three quarters. The whole still has four parts, even though one is empty.'],
      ['Show a whole rectangle with arrows toward the total and shaded counts.', 'Equal parts → Count all → Count shaded', 'Check the parts are equal. Count the whole and the shaded parts. Now investigate your fraction quiz!'],
    ],
  },
  {
    caseId: 16, seconds: 110,
    goal: 'Add Rupiah prices, multiply repeated prices, and subtract a total cost from the amount paid to find change.',
    accuracy: 'Use Indonesian Rupiah notation in the English video: Rp 3.000 means three thousand rupiah, not three rupiah. Do not draw realistic banknotes. The purchase total is Rp 7.000 and change from Rp 10.000 is Rp 3.000.',
    scenes: [
      ['Draw a small warung stall with a pencil priced Rp 3.000 and an eraser priced Rp 4.000.', 'Prices and change', 'Welcome to the warung, detective. Let us work out a total price and the change.'],
      ['Write the two prices on a simple receipt. Represent each thousand with a plain labeled token and combine three with four.', 'Rp 3.000 + Rp 4.000 = Rp 7.000', 'A pencil costs three thousand rupiah. An eraser costs four thousand. Add the prices: three thousand plus four thousand is seven thousand rupiah altogether.'],
      ['Draw payment of Rp 10.000, subtract the receipt total, and return three thousand-tokens. Then show three identical pencil price tags.', 'Rp 10.000 − Rp 7.000 = Rp 3.000\n3 × Rp 3.000 = Rp 9.000', 'If we pay ten thousand rupiah, subtract the seven-thousand cost. Our change is three thousand rupiah. Buying three identical pencils? Multiply three by three thousand. Their total is nine thousand rupiah.'],
      ['Draw a new price tag Rp 6.000 and payment Rp 10.000. Hold for four seconds, then animate four thousand-tokens returning.', 'Rp 10.000 − Rp 6.000 = Rp 4.000', 'An item costs six thousand rupiah. You pay ten thousand. How much change comes back? Four thousand rupiah. Six thousand plus four thousand makes the payment.'],
      ['Write three short operation cues beside the receipt.', 'Total: add\nSame price: multiply\nChange: subtract', 'Read what the question asks: total, repeated price, or change. Then choose your operation in the quiz!'],
    ],
  },
];
