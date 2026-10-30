"""Rebuild the Unit 1 narration edit without requesting additional synthesis.
Run: python output/voiceovers/unit-1-heygen/render.py
Requires numpy, soundfile, imageio-ffmpeg, opencv-python, and Pillow.
"""
import hashlib
import json
import re
import shutil
import subprocess
import textwrap
import wave
from pathlib import Path

import cv2
import imageio_ffmpeg
import numpy as np
import soundfile as sf

OUT = Path(__file__).resolve().parent
ROOT = OUT.parents[2]
WORK = ROOT / 'tmp' / 'unit1-heygen'
SOURCE = Path(r'C:\Users\Asus\Downloads\Math It Unit 1.mp4')
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
SR = 48000
EDGES = [0, 6, 21, 43, 63, 76, 90, 112, 120]
STEM = 'Math It Unit 1 - HeyGen Cheerful Guide'


def run(*args, capture=False):
    return subprocess.run([FFMPEG, '-nostdin', '-hide_banner', '-loglevel', 'error',
                           *map(str, args)], check=True, capture_output=capture)


def stamp(seconds):
    ms = round(seconds * 1000)
    return f'{ms // 3600000:02}:{ms // 60000 % 60:02}:{ms // 1000 % 60:02},{ms % 1000:03}'


def tokens(text):
    return re.findall(r"[a-z]+(?:'[a-z]+)?", text.lower())


OUT.mkdir(parents=True, exist_ok=True)
for name in ['heygen-original.wav', 'speech-result.json', 'submitted-narration.txt']:
    if not (OUT / name).exists():
        shutil.copyfile(WORK / name, OUT / name)
result = json.loads((OUT / 'speech-result.json').read_text(encoding='utf-8'))
script = (OUT / 'submitted-narration.txt').read_text(encoding='utf-8')
script_scenes = script.strip().split('\n\n')
caption_source = OUT / 'source-caption-timing.json'
if not caption_source.exists():
    shutil.copyfile(ROOT / 'tmp' / 'unit1-voiceover' / 'narration-timing.json', caption_source)
source_cues = json.loads(caption_source.read_text())['cues']
words = [w for w in result['word_timestamps'] if not w['word'].startswith('<')]
assert tokens(' '.join(w['word'] for w in words)) == tokens(script)
assert script.count('Welcome, detective!') == 1
assert len(script_scenes) == 8

# Match returned word timing to the exact 28 visible sentence captions.
cues, word_index = [], 0
for source_cue in source_cues:
    selected, matched = [], []
    expected = tokens(source_cue['text'])
    while len(matched) < len(expected):
        word = dict(words[word_index])
        selected.append(word)
        matched.extend(tokens(word['word']))
        word_index += 1
    assert matched == expected
    cues.append({'id': source_cue['id'], 'text': source_cue['text'],
                 'source_caption_start': source_cue['start'],
                 'source_caption_end': source_cue['caption_end'],
                 'raw_start': selected[0]['start'], 'raw_end': selected[-1]['end'],
                 'words': selected})
assert word_index == len(words)

scene_sizes = [1, 3, 6, 5, 3, 4, 4, 2]
scene_groups, index = [], 0
for size in scene_sizes:
    scene_groups.append(cues[index:index + size])
    index += size
raw_edges = [0.0] + [(a[-1]['raw_end'] + b[0]['raw_start']) / 2
                    for a, b in zip(scene_groups, scene_groups[1:])] + [result['duration']]

decoded = WORK / 'original-48k.wav'
run('-y', '-i', OUT / 'heygen-original.wav', '-ar', SR, '-ac', 1, '-c:a', 'pcm_f32le', decoded)
source_audio, rate = sf.read(decoded, dtype='float32')
assert rate == SR
mix = np.zeros(EDGES[-1] * SR, dtype=np.float32)
edits, scenes, mapped_words = [], [], []


def place(source_in, source_out, destination, label):
    a, b, d = round(source_in * SR), round(source_out * SR), round(destination * SR)
    samples = source_audio[a:b].copy()
    # Only 5 ms edge fades on cut handles; preserve pace, pitch and breaths.
    n = min(240, len(samples) // 2)
    samples[:n] *= np.linspace(0, 1, n)
    samples[-n:] *= np.linspace(1, 0, n)
    assert d >= 0 and d + len(samples) <= len(mix)
    assert not np.any(mix[d:d + len(samples)])
    mix[d:d + len(samples)] = samples
    edits.append({'label': label, 'source_in_sample': a, 'source_out_sample': b,
                  'sequence_start_sample': d, 'sequence_end_sample': d + len(samples),
                  'speed': 1.0, 'pitch': 1.0})
    return (d - a) / SR, (d + len(samples)) / SR


for scene_id, group in enumerate(scene_groups, 1):
    source_in, source_out = raw_edges[scene_id - 1:scene_id + 1]
    offset = group[0]['source_caption_start'] - group[0]['raw_start']
    if scene_id == 7:
        # The timestamp's end precedes a short audible release. Preserve it.
        question_end_source = 65.50
        answer_start_source = group[-1]['raw_start']
        offset, pause_start = place(source_in, question_end_source, source_in + offset, 'scene-7-question')
        pause_end = pause_start + 4.0
        answer_offset, segment_end = place(answer_start_source, source_out, pause_end, 'scene-7-answer')
        thinking_pause = {'start': pause_start, 'end': pause_end, 'seconds': 4.0}
    else:
        offset, segment_end = place(source_in, source_out, source_in + offset, f'scene-{scene_id}')
    assert segment_end < EDGES[scene_id]
    for cue in group:
        cue_offset = answer_offset if scene_id == 7 and cue['id'] == 26 else offset
        cue.update(scene=scene_id, start=cue['raw_start'] + cue_offset, end=cue['raw_end'] + cue_offset)
        cue['caption_start'] = cue['start']
        for word in cue['words']:
            mapped_words.append({'word': word['word'], 'source_start': word['start'], 'source_end': word['end'],
                                 'start': word['start'] + cue_offset, 'end': word['end'] + cue_offset})
    scenes.append({'scene': scene_id, 'start': EDGES[scene_id-1], 'end': EDGES[scene_id],
                   'speech_start': group[0]['start'], 'speech_end': group[-1]['end'],
                   'retained_audio_end': segment_end, 'fits': True})

# Retiming belongs only to the supplied silent drawing layer. Keep every
# original scene edge and let each final explanation remain visible for reading.
mapping = {float(t): float(t) for t in EDGES}
for group in scene_groups:
    for i, cue in enumerate(group):
        if cue['id'] == 26:
            cue['caption_start'] += 0.12  # do not pre-reveal the answer during silence
        mapping[float(cue['source_caption_start'])] = cue['caption_start']
        if cue['id'] == 25:
            cue['caption_end'] = thinking_pause['end'] - 0.07
        elif i == len(group) - 1:
            cue['caption_end'] = float(cue['source_caption_end'])
        else:
            cue['caption_end'] = min(cue['end'] + 0.1, group[i + 1]['start'] - 0.06)
        assert cue['caption_end'] > cue['caption_start']
        mapping[float(cue['source_caption_end'])] = cue['caption_end']
mapping[103.2] = thinking_pause['end'] + 0.04
points = sorted(mapping.items())
assert all(a[0] < b[0] and a[1] < b[1] for a, b in zip(points, points[1:]))
slopes = [(b[1]-a[1])/(b[0]-a[0]) for a,b in zip(points, points[1:])]
expression = f'{slopes[0]:.12f}*T'
for i in range(1, len(slopes)):
    expression += f'+({slopes[i]-slopes[i-1]:.12f})*max(0,T-{points[i][0]:.6f})'
video_filter = f"settb=AVTB,setpts='round(({expression})/TB)',fps=30:eof_action=pass"
(OUT / 'drawing-filter.txt').write_text(video_filter, encoding='utf-8')

pause_a, pause_b = [round(thinking_pause[k] * SR) for k in ('start', 'end')]
assert pause_b - pause_a == SR * 4 and not np.any(mix[pause_a:pause_b])
sf.write(WORK / 'edit-float.wav', mix, SR, subtype='FLOAT')

# A constant gain sets level consistently without compression or vocal effects.
analysis = subprocess.run([FFMPEG, '-nostdin', '-hide_banner', '-i', str(WORK / 'edit-float.wav'),
                           '-af', 'loudnorm=I=-16:TP=-1.5:LRA=7:print_format=json', '-f', 'null', '-'],
                          capture_output=True, text=True, check=True)
measure = json.JSONDecoder().raw_decode(analysis.stderr[analysis.stderr.rfind('{'):])[0]
gain_db = min(-16 - float(measure['input_i']), -1.5 - float(measure['input_tp']))
wav, mp3, video = [OUT / f'{STEM}.{ext}' for ext in ('wav','mp3','mp4')]
run('-y', '-i', WORK / 'edit-float.wav', '-af', f'volume={gain_db:.8f}dB', '-ar', SR, '-c:a', 'pcm_s24le', wav)
run('-y', '-i', wav, '-c:a', 'libmp3lame', '-b:a', '192k', mp3)
run('-y', '-i', SOURCE, '-i', wav, '-map', '0:v:0', '-map', '1:a:0', '-vf', video_filter,
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', 18, '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '192k', '-ar', SR, '-movflags', '+faststart',
    '-metadata:s:a:0', 'language=eng', '-metadata:s:a:0', 'title=HeyGen Melissa - Friendly', video)

srt = '\n\n'.join(f"{c['id']}\n{stamp(c['caption_start'])} --> {stamp(c['caption_end'])}\n"
                    + '\n'.join(textwrap.wrap(c['text'], width=62)) for c in cues) + '\n'
(OUT / f'{STEM}.srt').write_text(srt, encoding='utf-8')
(OUT / 'alignment.json').write_text(json.dumps({'clock': 'seconds from final sequence start',
    'sample_rate': SR, 'edits': edits, 'scenes': scenes, 'thinking_pause': thinking_pause,
    'cues': cues, 'words': mapped_words, 'drawing_source_to_sequence': points}, indent=2), encoding='utf-8')

# Check the encoded deliverables and preserve honest review limits.
final, final_rate = sf.read(wav, dtype='float32')
assert final_rate == SR and len(final) == 120 * SR
assert not np.any(final[pause_a:pause_b])
cap = cv2.VideoCapture(str(video))
frames, fps = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)), cap.get(cv2.CAP_PROP_FPS)
assert frames == 3600 and fps == 30
assert cap.get(cv2.CAP_PROP_FRAME_WIDTH) == 1920 and cap.get(cv2.CAP_PROP_FRAME_HEIGHT) == 1080
cap.release()
run('-i', video, '-f', 'null', '-')
report = {'source_video': str(SOURCE), 'source_sha256': hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
          'voice_id': '1776ddbd05374fa480e92f0297bbc67e', 'voice_name': 'Melissa - Friendly',
          'requested_engine': 'heygen_voice', 'returned_engine': result['engine'],
          'request_id': result['request_id'], 'requested_speed': 1.0, 'post_speed': 1.0,
          'source_take_seconds': result['duration'], 'final_seconds': len(final) / SR,
          'language': 'en', 'style_field_available': False,
          'style_limitation': 'Connected synthesis has no free-form voice/style field; no style instructions were spoken.',
          'returned_alignment_matches_submitted_script': True, 'independent_transcription': 'not_performed',
          'listening_review': 'not_performed', 'audible_quality': 'not_checked',
          'thinking_pause': {**thinking_pause, 'samples': pause_b-pause_a, 'lossless_peak': 0},
          'welcome_line_occurrences': 1, 'scene_checks': scenes, 'audio_gain_db': gain_db,
          'loudness_before_gain': measure, 'music': False, 'sfx': False,
          'video': {'width': 1920, 'height': 1080, 'fps': fps, 'frames': frames, 'full_decode': 'passed'},
          'caption_reading_speed_flags': [{'id': c['id'], 'characters_per_second':
                                          round(len(c['text'])/(c['caption_end']-c['caption_start']), 2)}
                                         for c in cues if len(c['text'])/(c['caption_end']-c['caption_start']) > 17]}
(OUT / 'production-check.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print(json.dumps({'video': str(video), 'wav': str(wav), 'seconds': report['final_seconds'],
                  'thinking_pause': report['thinking_pause'], 'caption_flags': report['caption_reading_speed_flags']}, indent=2))
