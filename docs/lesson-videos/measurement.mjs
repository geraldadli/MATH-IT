export const chapters = [
  {
    caseId: 10, seconds: 100,
    goal: 'Convert meters and half meters into centimeters before adding lengths or combining repeated pieces.',
    accuracy: '1 m = 100 cm and 1/2 m = 50 cm. Work 2 m + 30 cm = 230 cm and practice 3 × 40 cm = 120 cm. Ruler divisions and strip lengths must be proportional.',
    scenes: [
      ['Draw a ribbon trail beside a meter strip with centimeter markings.', 'One unit for every piece', 'Our ribbons use meters and centimeters. Let us measure them using the same unit.'],
      ['Draw a full meter strip marked zero, fifty, and one hundred centimeters. Fold it at the midpoint without stretching it.', '1 m = 100 cm\n1/2 m = 50 cm', 'One meter is one hundred centimeters. Half a meter is half of one hundred centimeters, which is fifty centimeters. The length stays the same when we change its unit.'],
      ['Join two one-meter strips and a thirty-centimeter strip on a continuous scale. Write the conversion first, then the sum.', '2 m = 200 cm\n200 cm + 30 cm = 230 cm', 'A ribbon is two meters plus thirty centimeters long. Change the two meters into two hundred centimeters. Then add thirty centimeters. The total length is two hundred thirty centimeters.'],
      ['Draw three equal strips, each marked forty centimeters. Hold for four seconds, then join them end to end and reveal the total.', '3 × 40 cm = 120 cm', 'Try three pieces of ribbon, each forty centimeters long. How long are they together? Forty plus forty plus forty is one hundred twenty centimeters.'],
      ['Underline cm on both addends and the answer.', 'Convert → Add or multiply → Label', 'Use the same unit for every piece, calculate, and include the unit in your answer. Try your quiz!'],
    ],
  },
    {
    caseId: 11, seconds: 105,
    goal: 'Find elapsed time by counting forward in minutes, including intervals that cross an hour.',
    accuracy: 'A clock has 60 minutes per hour; adjacent numbered positions are five minutes apart. Use 09:40 to 10:05 = 25 minutes and 10:50 to 11:10 = 20 minutes. Move both hands correctly or use a labeled timeline.',
    scenes: [
      ['Draw a clock tower and two time cards, 09:40 and 10:05.', 'How much time passed?', 'We start at nine forty and finish at ten oh five. How many minutes have passed?'],
      ['Draw a clock face with five-minute marks. Pair it with a timeline that crosses ten o’clock.', '1 hour = 60 minutes\nCount forward', 'An hour has sixty minutes. Each step between clock numbers is five minutes. To find elapsed time, start at the first time and count forward to the second.'],
      ['Animate four five-minute hops from 09:40 to 10:00, then one hop to 10:05. Label the two durations and add them.', '09:40 → 10:00 → 10:05\n20 min + 5 min = 25 min', 'From nine forty to ten o’clock is twenty minutes. From ten o’clock to ten oh five is five more. Twenty plus five makes twenty-five minutes. Stopping at the hour helps us keep track.'],
      ['Write 10:50 and 11:10 on a fresh timeline. Hold for four seconds, then show two ten-minute jumps via 11:00.', '10:50 → 11:00 → 11:10\n10 min + 10 min = 20 min', 'Try ten fifty to eleven ten. First reach eleven o’clock, then continue. Ten minutes plus ten minutes makes twenty minutes altogether.'],
      ['Draw a forward arrow with a marked hour boundary.', 'Start → Next hour → Finish', 'Count forward, split at the hour if needed, and add the minutes. Now solve your time quiz!'],
    ],
  },
  {
    caseId: 13, seconds: 110,
    goal: 'Classify shapes by four equal sides and the presence of a right angle, including overlapping properties and neither.',
    accuracy: 'Use a rotated square, a visibly non-square rhombus, a non-square rectangle, a right triangle, an equilateral triangle, and a slanted non-rhombus parallelogram. Equal-length tick marks and square right-angle markers must be geometrically correct. Orientation does not change properties.',
    scenes: [
      ['Draw two magnifying glasses labeled sides and corners beside a shape outline.', 'Look at properties', 'Shapes leave clues in their sides and corners. Let us check two different rules.'],
      ['Draw a rotated square with four equal-length ticks and four right-angle marks. Beside it draw a non-square rhombus with equal ticks but no right angles.', '4 equal sides\nA right angle = a square corner', 'Four equal sides means all four sides have the same length. A right angle is a square corner, like a book corner. Turning a shape does not change its sides or angles.'],
      ['Draw two overlapping sorting circles. Put the square in the overlap, the non-square rhombus in equal sides, a rectangle and right triangle in right angle, and the two neither examples outside.', 'One shape can fit both rules', 'A square has four equal sides and right angles, so it fits both rules. A rectangle has right angles, even when its four sides are not all equal. A right triangle also has a right angle. Check each property separately.'],
      ['Draw an equilateral triangle with three equal side ticks and no right-angle marker. Hold for four seconds, then move it outside both circles.', '3 equal sides ≠ 4 equal sides\nNeither rule', 'This triangle has three equal sides and no right angle. Does it fit either rule? No. Three equal sides are not four equal sides, so choose neither.'],
      ['Return to the two property labels. Briefly show duplicate cards for a shape fitting both.', 'Check sides AND corners', 'Count sides and inspect corners. Some shapes fit both groups, so use both copies when needed. Try your quiz!'],
    ],
  },
  {
    caseId: 17, seconds: 105,
    goal: 'Convert kilograms to grams, recognize half a kilogram, and add or multiply masses in a common unit.',
    accuracy: '1 kg = 1000 g and 1/2 kg = 500 g. Use 1 kg + 250 g = 1250 g and 3 × 200 g = 600 g. A balanced scale must show equal mass, not equal-looking volume.',
    scenes: [
      ['Draw a lab balance, a one-kilogram mass, and gram-labeled packets.', 'Grams and kilograms', 'The lab uses grams and kilograms. We can change units to compare the masses fairly.'],
      ['Balance a one-kilogram mass against two packets labeled five hundred grams. Then write the equivalent amounts.', '1 kg = 1000 g\n1/2 kg = 500 g', 'One kilogram is one thousand grams. Half a kilogram is five hundred grams. Two halves make one kilogram. These are different ways to describe the same mass.'],
      ['Place a one-kilogram packet and a two-hundred-fifty-gram packet together. Rewrite both in grams and add.', '1 kg + 250 g\n1000 g + 250 g = 1250 g', 'Before adding, use the same unit. One kilogram and two hundred fifty grams becomes one thousand grams plus two hundred fifty grams. The total is one thousand two hundred fifty grams.'],
      ['Draw three equal packets, each labeled two hundred grams. Hold for four seconds, then combine their mass labels.', '3 × 200 g = 600 g', 'Try three packets of two hundred grams each. What is their total mass? Three times two hundred is six hundred grams. Keep the unit with the answer.'],
      ['Circle the unit on every packet and draw a conversion arrow.', 'Convert → Calculate → Compare', 'Change everything to grams, add or multiply, then compare the masses. You are ready for your quiz!'],
    ],
  },
];
