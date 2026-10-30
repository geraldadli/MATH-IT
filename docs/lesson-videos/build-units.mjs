import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { units, caseLevels } from '../../src/cases.ts';
import { videos } from './units.mjs';
import { voiceProfiles, sharedVoiceDirection } from './voices.mjs';

const wordCount = text => text.trim().split(/\s+/u).length;
const stamp = seconds => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
const escapeHtml = value => String(value).replace(/[&<>"']/gu, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const common = `VIDEO CREATION PROMPT
Create ONE finished two-minute educational video in English for Grade 3 children, approximately ages 8–9, for Math It! This is an introductory overview of the entire unit, watched before the children attempt that unit's quizzes. Use the timed storyboard below, with a few connected examples and one short thinking pause. Do not expand it into separate chapter videos.

VISUAL STYLE
Use a simple hand-drawn whiteboard animation with a hand writing and drawing on a warm white board. Format: 16:9 landscape, preferably 1920 × 1080. Use dark navy outlines and a few blue, teal, and amber highlights. Keep the same small friendly cat detective badge across all four unit videos. Use a fixed front-facing camera, clear handwriting, large numerals, and simple flat illustrations. Reveal one idea at a time; erase or fade the previous example before introducing the next. Move objects only to demonstrate the mathematics. Keep labels readable on a phone. No complex 3D, busy backgrounds, flashing, or rapid camera motion.

NARRATION AND PACING
Use the exact supplied English narration and the unit-specific voice profile below, spoken warmly and clearly at approximately 110 words per minute. Keep that unit's selected voice consistent in every scene. Use spare time within each scene for drawing and reading. Do not add filler speech. Preserve the stated scene durations and total of 120 seconds. On-screen text describes the final state of a scene: reveal it gradually in sync with the explanation. Do not reveal the answer to the practice question until after the explicitly marked four-second silent pause. Use large English captions below the drawing area, at most two short lines at once. Music is optional and very quiet. Keep the tone encouraging, with no countdown or pressure to answer quickly.

PRODUCTION RULES
Use the supplied example numbers, equations, units, and exact object counts. Draw equal parts and chart scales accurately. Worked examples teach a method; do not add the actual quiz's answer key. Finish with the unit quiz invitation in the script. If your generator makes only short clips, generate each timed scene consistently and assemble them into ONE unit video. Add precise text, equations, narration, and captions during editing if the generator cannot render them reliably.`;

if (videos.length !== units.length || new Set(videos.map(v => v.unitId)).size !== units.length) throw new Error('There must be exactly one video per unit.');
const records = units.map(unit => {
  const video = videos.find(v => v.unitId === unit.id);
  if (!video) throw new Error(`Missing unit ${unit.id}`);
  const voice = voiceProfiles.find(profile => profile.unitId === unit.id);
  if (!voice) throw new Error(`Missing voice profile for unit ${unit.id}`);
  const voiceText = `UNIT ${unit.id} VOICE PROFILE — ${unit.title.en}\nVoice: ${voice.gender}\nCharacter: ${voice.character}\n\nVOICE GENERATION PROMPT\n${voice.prompt}\n\n${sharedVoiceDirection}\n\nAUDITION LINE\n“${voice.audition}”\n`;
  const seconds = video.scenes.reduce((total, scene) => total + scene.seconds, 0);
  if (seconds !== 120) throw new Error(`Unit ${unit.id} is not 120 seconds`);
  if (video.scenes.filter(scene => scene.pauseAfter).length !== 1) throw new Error(`Unit ${unit.id} needs one thinking pause`);
  const topics = unit.cases.map(caseId => caseLevels.find(level => level.id === caseId).skill.en);
  let elapsed = 0;
  const scenes = video.scenes.map((scene, index) => {
    const slot = `${stamp(elapsed)}–${stamp(elapsed + scene.seconds)}`;
    elapsed += scene.seconds;
    const voiceSeconds = wordCount(scene.narration) / 110 * 60;
    if (voiceSeconds + (scene.pauseAfter ? 4 : 0) > scene.seconds) throw new Error(`Unit ${unit.id}, scene ${index + 1} needs more speaking time`);
    if (scene.pauseAfter && !scene.narration.includes(scene.pauseAfter)) throw new Error('Missing pause cue in narration');
    return `SCENE ${index + 1} · ${slot} · ${scene.title}\nVisual and animation: ${scene.visual}\nOn-screen text (reveal progressively):\n${scene.screen}\nNarration: “${scene.narration}”${scene.pauseAfter ? `\nPAUSE: Immediately after “${scene.pauseAfter}”, hold silently for 4 seconds. Then continue the remaining narration and reveal the answer. This pause is included in the scene time.` : ''}`;
  });
  const text = `MATH IT! — UNIT ${unit.id} VIDEO PROMPT\n${unit.title.en}\nDuration: 120 seconds (2:00)\nLanguage: English only\nNarrator: ${voice.gender} — ${voice.character}\nOne video for the whole unit\n\nUNIT TOPICS\n${topics.join('; ')}\n\nLEARNING GOAL\n${video.goal}\n\n${common}\n\n${voiceText}\nSETTING\n${video.setting}\n\nMATHEMATICAL ACCURACY\n${video.accuracy}\n\nTIMED STORYBOARD\n\n${scenes.join('\n\n')}\n\nFINAL PRODUCTION CHECK\nCheck the mathematical examples, narration and caption agreement, the selected unit voice, readable text, the four-second thinking pause, total duration of 120 seconds, and the closing invitation to this unit's quizzes.\n`;
  return { unitId: unit.id, title: unit.title.en, goal: video.goal, topics, voice, voiceText, scenes: scenes.length, words: video.scenes.reduce((n, scene) => n + wordCount(scene.narration), 0), filename: `unit-${unit.id}.txt`, text };
});

await mkdir(new URL('unit-prompts/', import.meta.url), { recursive: true });
for (const record of records) await writeFile(new URL(`unit-prompts/${record.filename}`, import.meta.url), record.text);
await writeFile(new URL('voice-profiles.txt', import.meta.url), `MATH IT! — FOUR NARRATOR VOICE PROFILES\n\n${records.map(record => `Unit ${record.unitId}: ${record.voice.gender} — ${record.voice.character}`).join('\n')}\n\nPaste each unit's voice prompt into your voice generator's style instructions. Use the matching unit script as the spoken text.\n\n${records.map(record => record.voiceText).join('\n' + '='.repeat(72) + '\n\n')}`);
const introduction = `MATH IT! — FOUR UNIT VIDEO PROMPTS

4 videos total: one two-minute English overview for each unit, followed by that unit's quizzes. Each prompt includes simple hand-writing-on-a-whiteboard animation, timed visual slides, exact narration, on-screen text, a distinct narrator profile, one four-second thinking pause, and a quiz invitation. Narrators: Unit 1 female, Unit 2 male, Unit 3 a different female, and Unit 4 a different male.

CONTENTS
${records.map(r => `Video ${r.unitId} — ${r.title} — 2:00`).join('\n')}

HOW TO USE
Copy one complete unit prompt into your video production workflow. Generate one finished video per unit. If your generator makes short clips, assemble that unit's scenes into its two-minute video. These are brief unit overviews using representative examples. Children can pause or replay before trying the quizzes.

`;
await writeFile(new URL('all-prompts.txt', import.meta.url), introduction + records.map(r => r.text).join('\n\n' + '='.repeat(72) + '\n\n'));

const navigation = `<div class="unit-nav"><h2>Four unit videos</h2>${records.map(r => `<a href="#unit-${r.unitId}"><span>0${r.unitId}</span>${escapeHtml(r.title)}</a>`).join('')}</div>`;
const cards = records.map(r => `<article id="unit-${r.unitId}" data-search="${escapeHtml(`Unit ${r.unitId} ${r.title} ${r.topics.join(' ')}`.toLowerCase())}">
<div class="eyebrow">Video ${r.unitId} · Unit ${r.unitId} <span>2:00 video</span></div><h2>${escapeHtml(r.title)}</h2><p class="case-title">${escapeHtml(r.topics.join(' · '))}</p><p>${escapeHtml(r.goal)}</p>
<section aria-label="Narrator profile"><h3>${escapeHtml(r.voice.gender)} voice · ${escapeHtml(r.voice.character)}</h3><p>${escapeHtml(r.voice.summary)}</p><div class="actions"><button type="button" data-copy="voice-${r.unitId}" data-kind="Voice profile">Copy voice prompt</button></div><details><summary>Read voice-generation directions</summary><pre id="voice-${r.unitId}">${escapeHtml(r.voiceText)}</pre></details></section>
<div class="actions"><button type="button" data-copy="prompt-${r.unitId}">Copy full unit prompt</button><a href="unit-prompts/${r.filename}" download>Download .txt</a></div>
<details><summary>Read storyboard and narration <span>${r.scenes} scenes · ${r.words} spoken words</span></summary><pre id="prompt-${r.unitId}">${escapeHtml(r.text)}</pre></details></article>`).join('');
const style = await readFile(new URL('viewer.css', import.meta.url), 'utf8');
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Math It! — Four unit video prompts</title><style>${style}</style></head><body>
<header class="masthead"><div class="brand">Math It! / Video production prompts</div><h1>One short video for each unit.</h1><p>Four English unit overviews with a hand drawing on a whiteboard, simple animations, and a friendly introduction to the quizzes.</p><div class="meta"><span>4 units · 4 videos total</span><span>2 minutes per video</span><span>Grade 3 · English only</span><span>Exact narration included</span></div></header>
<div class="layout"><aside aria-label="Unit navigation">${navigation}</aside><main>
<section class="intro"><h2>Choose a unit. Copy its prompt.</h2><p>Each prompt covers a whole unit through a few connected examples, timed slides, and one four-second thinking pause. Each unit has a distinct narrator: female, male, female, then male. Copy the voice directions into your voice generator's style field and the narration into its spoken-text field.</p><a class="download" href="all-prompts.txt" download>Download all 4 unit prompts as text</a><br><a class="download" href="voice-profiles.txt" download>Download the 4 voice profiles</a></section>
<label for="search">Find a unit or topic</label><input id="search" type="search" placeholder="Try Unit 4, fractions, or measurement…" autocomplete="off">
<p class="empty" id="empty" hidden>No matching units. Try a topic such as addition or charts.</p>${cards}
<footer>Four unit overviews, eight minutes in total. Unit names and topics follow Math It! These are video creation prompts; the videos have not been generated.</footer>
</main></div><div id="copy-status" role="status" aria-live="polite"></div>
<script>
const search=document.getElementById('search');const articles=[...document.querySelectorAll('article')];
search.addEventListener('input',()=>{const q=search.value.toLowerCase().trim();let found=0;for(const article of articles){article.hidden=!article.dataset.search.includes(q);if(!article.hidden)found++}document.getElementById('empty').hidden=found>0});
for(const link of document.querySelectorAll('aside a'))link.addEventListener('click',()=>{search.value='';search.dispatchEvent(new Event('input'))});
let feedbackTimer;
document.addEventListener('click',async event=>{const button=event.target.closest('[data-copy]');if(!button)return;const prompt=document.getElementById(button.dataset.copy);let copied=false;try{await navigator.clipboard.writeText(prompt.textContent);copied=true}catch{const helper=document.createElement('textarea');helper.value=prompt.textContent;helper.style.position='fixed';helper.style.left='-10000px';document.body.append(helper);helper.select();try{copied=document.execCommand('copy')}catch{}helper.remove();button.focus()}const status=document.getElementById('copy-status');status.textContent=copied?(button.dataset.kind||'Full unit prompt')+' copied.':'Copy unavailable here. Open the directions and select the text, or download the .txt file.';if(!copied)prompt.parentElement.open=true;clearTimeout(feedbackTimer);feedbackTimer=setTimeout(()=>status.textContent='',6000)});
window.addEventListener('beforeprint',()=>document.querySelectorAll('details').forEach(detail=>detail.open=true));
</script></body></html>`;
await writeFile(new URL('index.html', import.meta.url), html);
const exported = await readFile(new URL('all-prompts.txt', import.meta.url), 'utf8');
if ((exported.match(/MATH IT! — UNIT \d VIDEO PROMPT/g) || []).length !== 4) throw new Error('Expected four unit prompts in the export');
console.log(JSON.stringify({ videos: records.map(r => ({ unit: r.unitId, title: r.title, seconds: 120, scenes: r.scenes, spokenWords: r.words })), totalVideos: 4, totalMinutes: 8, language: 'English' }, null, 2));
