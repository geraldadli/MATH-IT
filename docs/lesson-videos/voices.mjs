// Casting and voice-generation directions; these are not spoken narration.
export const voiceProfiles = [
  {
    unitId: 1,
    gender: 'Female',
    character: 'The cheerful guide',
    summary: 'A bright adult female voice with a medium-high pitch, a warm smile, and gentle enthusiasm.',
    prompt: 'Use an adult female narrator with a bright, warm voice and a comfortable medium-high pitch. She sounds like a friendly teacher welcoming children to an activity: cheerful, curious, and encouraging. Let a slight smile come through in her voice. Give counting a gentle rhythm and make each number easy to distinguish. Use clear, lightly American-accented English at approximately 110 words per minute. Keep the energy lively but controlled; avoid squeaky delivery, baby talk, exaggerated excitement, and a singsong reading of every sentence. Give questions a small lift in pitch, then sound reassuring when explaining the answer. Keep this same female voice throughout Unit 1.',
    audition: 'Welcome, detective! Let us use numbers to prepare our school fair.',
  },
  {
    unitId: 2,
    gender: 'Male',
    character: 'The thoughtful detective',
    summary: 'An adult male voice with a warm medium-low pitch and a calm, thoughtful, reassuring delivery.',
    prompt: 'Use an adult male narrator with a warm, smooth voice and a comfortable medium-low pitch. He sounds like a patient detective helping a child think through a puzzle: thoughtful, curious, and quietly confident. Use clear, lightly American-accented English at approximately 110 words per minute. Gently emphasize reasoning words such as first, then, compare, and check. Make questions sound inviting, and corrections sound kind and matter-of-fact. Keep the rhythm steady, allowing the existing script pauses to do their work. Avoid a booming bass, stern teacher voice, suspenseful whisper, or crime-trailer performance. Keep this same male voice throughout Unit 2.',
    audition: 'Good detectives explain their thinking. Let us investigate five useful strategies.',
  },
  {
    unitId: 3,
    gender: 'Female',
    character: 'The patient explorer',
    summary: 'A distinct adult female voice with a fuller middle pitch, gentle warmth, and precise pronunciation.',
    prompt: 'Use a different adult female narrator from Unit 1. Give her a fuller middle-pitched voice with a gentle, grounded warmth. She sounds like a patient science teacher demonstrating tools beside a child: calm, attentive, and interested in small discoveries. Use clear, lightly American-accented English at approximately 110 words per minute. Articulate centimeters, meters, grams, kilograms, and minutes carefully, keeping each number naturally connected to its unit. Use modest pitch changes and clear sentence endings. Sound encouraging without breathiness, whispering, or a sleepy pace. Keep this same female voice throughout Unit 3.',
    audition: 'Our toolkit measures length, mass, and time, and helps us investigate shapes.',
  },
  {
    unitId: 4,
    gender: 'Male',
    character: 'The curious chart guide',
    summary: 'A distinct adult male voice with a lighter middle pitch, crisp clarity, and friendly curiosity.',
    prompt: 'Use a different adult male narrator from Unit 2. Give him a lighter middle-pitched voice with a clear, crisp tone. He sounds like a friendly museum guide helping children discover patterns: curious, engaged, and gently animated. Use clear, lightly American-accented English at approximately 110 words per minute. Lightly emphasize key, scale, filter, sort, and table so children notice the tools. Introduce a question with a small rise in pitch, and explain the result with a confident, relaxed finish. Create energy through expression rather than faster speech. Avoid a sports-commentator delivery, advertising hype, robotic rhythm, or excessive pitch changes. Keep this same male voice throughout Unit 4.',
    audition: 'Charts turn information into clues. Let us read them!',
  },
];

export const sharedVoiceDirection = `SHARED VOICE DIRECTION
Cast four distinct adult voices: female for Unit 1, male for Unit 2, a different female for Unit 3, and a different male for Unit 4. Keep the accent style, recording clarity, and perceived loudness consistent across the series. Address one curious child of about eight or nine, warmly and respectfully.

Target approximately 110 spoken words per minute so the existing two-minute storyboards remain usable. Distinguish the characters through pitch, tone, and expression rather than large speed changes. Speak numbers, operation names, and measurement units distinctly. Do not rush the ends of sentences or add extra words. Follow the exact narration and preserve the marked four-second silent thinking pause before the answer. Keep the same selected voice in every scene within its unit.

Use clean, close, natural speech with no room echo, background noise, or added vocal effects. Generate the narration as a separate voice track; music and drawing sounds belong in the video edit. These directions belong in the voice or style instructions field, not in the text to be spoken. The audition line is for comparing voice candidates; it is already part of the script and must not be added a second time. Timing is a production target: check each generated scene against its allotted time before assembling the video.`;
