import asyncio
import hashlib
import json
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parents[2]
WORK = Path(__file__).resolve().parent
PLAN = ROOT / 'output/voiceovers/unit-2/natural-2026-10-30/production-plan.json'
VOICE = 'en-US-AndrewNeural'
SETTINGS = dict(rate='+0%', pitch='+0Hz', volume='+0%')


async def main():
    plan = json.loads(PLAN.read_text(encoding='utf-8'))
    voices = await edge_tts.list_voices()
    voice = next(v for v in voices if v['ShortName'] == VOICE)
    (WORK / 'voice-catalog.json').write_text(json.dumps(voice, indent=2), encoding='utf-8')
    parts = []
    for scene in plan['scenes']:
        texts = [scene['text']]
        if scene['id'] == 6:
            before, after = scene['text'].split('What was missed?', 1)
            texts = [before + 'What was missed?', after.strip()]
        for index, text in enumerate(texts):
            parts.append(dict(id=f"scene-{scene['id']:02}-{index+1}", scene=scene['id'],
                              text=text, voice=VOICE, settings=SETTINGS,
                              pause_after_seconds=4 if scene['id'] == 6 and index == 0 else 0))
    assert len(parts) == 8
    assert ' '.join(p['text'] for p in parts) == ' '.join(s['text'] for s in plan['scenes'])
    (WORK / 'generation-plan.json').write_text(json.dumps(parts, indent=2), encoding='utf-8')
    for part in parts:
        audio = WORK / (part['id'] + '.mp3')
        metadata = WORK / (part['id'] + '.json')
        if audio.exists() and metadata.exists():
            previous = json.loads(metadata.read_text(encoding='utf-8'))
            assert all(previous[key] == part[key] for key in ['text', 'voice', 'settings'])
            print('Retained ' + part['id'], flush=True)
            continue
        events = []
        speech = edge_tts.Communicate(part['text'], VOICE, boundary='WordBoundary', **SETTINGS)
        with audio.open('wb') as output:
            async for chunk in speech.stream():
                if chunk['type'] == 'audio':
                    output.write(chunk['data'])
                else:
                    events.append(chunk)
        assert audio.stat().st_size > 1000
        assert any(event['type'] == 'WordBoundary' for event in events)
        part['events'] = events
        part['sha256'] = hashlib.sha256(audio.read_bytes()).hexdigest()
        metadata.write_text(json.dumps(part, indent=2), encoding='utf-8')
        print('Generated ' + part['id'] + ': ' + part['text'], flush=True)


if __name__ == '__main__':
    asyncio.run(main())
