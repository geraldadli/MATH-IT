import asyncio
import hashlib
import json
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parents[2]
WORK = Path(__file__).resolve().parent
DEST = ROOT / 'output/voiceovers/unit-3/microsoft-male-natural'
VOICE = 'en-US-AndrewNeural'
SETTINGS = dict(rate='+0%', pitch='+0Hz', volume='+0%')


async def main():
    DEST.mkdir(parents=True, exist_ok=True)
    script = (ROOT / 'output/voiceovers/unit-3-heygen/narration.txt').read_text(encoding='utf-8').strip()
    scenes = script.split('\n\n')
    assert len(scenes) == 6
    assert len(script.split()) == 172
    assert script.count('Our toolkit measures length, mass, and time, and helps us investigate shapes.') == 1
    voices = await edge_tts.list_voices()
    voice = next(v for v in voices if v['ShortName'] == VOICE)
    assert voice['Gender'] == 'Male' and voice['Locale'] == 'en-US'
    (WORK/'voice-catalog.json').write_text(json.dumps(voice, indent=2), encoding='utf-8')
    bounds = [(0,7), (7,32), (32,54), (54,78), (78,105), (105,120)]
    parts = []
    for number, (text, (start, end)) in enumerate(zip(scenes, bounds), 1):
        texts = [text]
        if number == 5:
            before, after = text.split('Does it fit either rule?', 1)
            texts = [before+'Does it fit either rule?', after.strip()]
        for index, spoken in enumerate(texts, 1):
            parts.append(dict(id=f'scene-{number:02}-{index}', scene=number, text=spoken,
                              voice=VOICE, settings=SETTINGS,
                              pause_after_seconds=4 if number == 5 and index == 1 else 0))
    assert len(parts) == 7
    assert ' '.join(p['text'] for p in parts) == ' '.join(scenes)
    plan = dict(provider='Microsoft Edge online neural speech', tool='edge-tts',
                tool_version=edge_tts.__version__, voice=VOICE, settings=SETTINGS,
                intent='Warm male detective voice, natural rate; latest user direction overrides earlier female casting.',
                playback_speed=1.0, fixed_wpm=None, time_stretch=False,
                source_script=str(ROOT/'output/voiceovers/unit-3-heygen/narration.txt'),
                source_video='C:/Users/Asus/Downloads/Math It Unit 3.mp4',
                scene_windows=[dict(scene=i+1,start=a,end=b) for i,(a,b) in enumerate(bounds)],
                parts=parts, target_seconds=120, thinking_pause_seconds=4,
                style_field_available=False,
                style_limitation='Voice is selected for its catalog Warm personality. This tool has no free-form acting field.')
    (WORK/'generation-plan.json').write_text(json.dumps(plan, indent=2, ensure_ascii=False), encoding='utf-8')
    (DEST/'production-plan.json').write_text(json.dumps(plan, indent=2, ensure_ascii=False), encoding='utf-8')
    (DEST/'narration.txt').write_text(script+'\n', encoding='utf-8')
    for part in parts:
        audio = WORK/(part['id']+'.mp3')
        metadata = audio.with_suffix('.json')
        if audio.exists() and metadata.exists():
            saved = json.loads(metadata.read_text(encoding='utf-8'))
            assert all(saved[k] == part[k] for k in ['text','voice','settings'])
            print('Retained '+part['id'], flush=True)
            continue
        events = []
        communicator = edge_tts.Communicate(part['text'], VOICE, boundary='WordBoundary', **SETTINGS)
        with audio.open('wb') as output:
            async for chunk in communicator.stream():
                if chunk['type'] == 'audio':
                    output.write(chunk['data'])
                else:
                    events.append(chunk)
        assert audio.stat().st_size > 1000 and any(e['type']=='WordBoundary' for e in events)
        metadata.write_text(json.dumps(dict(**part, events=events,
                            sha256=hashlib.sha256(audio.read_bytes()).hexdigest()),
                            indent=2, ensure_ascii=False), encoding='utf-8')
        print('Generated '+part['id'], flush=True)


if __name__ == '__main__':
    asyncio.run(main())

