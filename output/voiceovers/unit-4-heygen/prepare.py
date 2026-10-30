"""Prepare the existing HeyGen take at 1x for the supplied Unit 4 picture."""
from pathlib import Path
import hashlib
import json
import re
import shutil
import subprocess

import cv2
import imageio_ffmpeg
import numpy as np
import soundfile as sf

OUT = Path(__file__).resolve().parent
ROOT = OUT.parents[2]
TAKE = OUT.parent / 'unit-4' / 'orca-natural'
SOURCE_VIDEO = Path(r'C:\Users\Asus\Downloads\Unit 4 Data Analysis.mp4')
SOURCE_AUDIO = TAKE / 'Unit 4 - Curious Chart Guide - Natural.wav'
STEM = 'Unit 4 - Curious Chart Guide - HeyGen'
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
SR = 48000

def run(*args):
    return subprocess.run([FFMPEG, '-nostdin', '-hide_banner', '-nostats', *map(str, args)],
                          check=True, capture_output=True)

def loudness(path):
    log = run('-i', path, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=7:print_format=json',
              '-f', 'null', '-').stderr.decode('utf-8', errors='replace')
    return json.JSONDecoder().raw_decode(log[log.rfind('{'):])[0]

audio, rate = sf.read(SOURCE_AUDIO, dtype='float32')
assert rate == SR and audio.ndim == 1
assert not np.any(audio[round(65.88 * SR):round(69.88 * SR)])
meta = json.loads((TAKE / 'source-metadata.json').read_text(encoding='utf-8'))
script = (TAKE / 'narration.txt').read_text(encoding='utf-8')
prompt = (ROOT / 'docs/lesson-videos/unit-prompts/unit-4.txt').read_text(encoding='utf-8')
scenes = re.findall(r'^Narration: “(.*?)”', prompt, flags=re.M)
norm = lambda text: re.sub(r'\W+', '', text, flags=re.U).casefold()
assert len(scenes) == 7 and norm(' '.join(scenes)) == norm(script)
spoken_request = re.sub(r'<[^>]+>', ' ', meta['request']['text'])
assert norm(spoken_request) == norm(script)
assert script.count('Charts turn information into clues. Let us read them!') == 1
assert meta['request']['voiceId'] == '3ae75279043648ce8f96310333c9288f'
assert meta['request']['speed'] == 1
unit2 = json.loads((OUT.parent / 'unit-2/production-plan.json').read_text(encoding='utf-8'))
assert unit2['voice']['id'] != meta['request']['voiceId']

# Each cut sits in a low-energy handle between complete thoughts or chart cues.
# The original speech, pitch, and internal prosody stay at 1x. Spare picture time
# is reserved for the child's drawing/reading, as in the supplied storyboard.
plan = [
    (1, [1], 0, 2.145, .65),
    (1, [2], 2.145, 3.5, 2.85),
    (2, [3], 3.5, 5.8, 4.75),
    (2, [4, 5], 5.8, 10.145, 8.05),
    (2, [6], 10.145, 13.02, 15.85),
    (2, [7], 13.02, 15.65, 21.3),
    (3, [8], 15.65, 18.49, 25.35),
    (3, [9], 18.49, 21.345, 28.35),
    (3, [10], 21.345, 23.76, 32.6),
    (3, [11], 23.76, 25.02, 35.35),
    (3, [12], 25.02, 28.6, 37.35),
    (4, [13], 28.6, 31.55, 43.0),
    (4, [14], 31.55, 33.8, 47.1),
    (4, [15], 33.8, 36.58, 51.1),
    (4, [16], 36.58, 38.585, 54.9),
    (4, [17], 38.585, 41.65, 57.5),
    (5, [18], 41.65, 44.15, 61.25),
    (5, [19, 20], 44.15, 47.89, 65.0),
    (5, [21, 22], 47.89, 51.95, 70.6),
    (6, [23], 51.95, 54.13, 77.95),
    (6, [24], 54.13, 56.22, 80.65),
    (6, [25], 56.22, 57.765, 84.5),
    (6, [26], 57.765, 60.81, 87.15),
    (6, [27], 60.81, 63.25, 93.15),
    (6, [28], 63.25, 64.465, 96.5),
    (6, [29], 64.465, 65.88, 100.185),
    (6, [30], 69.88, 71.69, 105.6),
    (7, [31], 71.69, 74.2, 109.8),
    (7, [32], 74.2, 75.66, 113.35),
    (7, [33], 75.66, len(audio) / SR, 116.1),
]
source_cues = json.loads((ROOT / 'tmp/unit4-voiceover/narration-timing.json').read_text(encoding='utf-8'))['cues']
mix = np.zeros(120 * SR, dtype='float32')
owned = np.zeros(len(mix), dtype=bool)
retained = np.zeros(len(audio), dtype=bool)
edits = []
for scene, ids, source_in, source_out, destination in plan:
    a, b, d = round(source_in * SR), round(source_out * SR), round(destination * SR)
    samples = audio[a:b].copy()
    n = 48  # one ms, only in quiet source handles
    edge_peak = float(max(np.max(np.abs(samples[:n])), np.max(np.abs(samples[-n:]))))
    assert edge_peak < .015, (ids, 'cut handle is not quiet', edge_peak)
    samples[:n] *= np.linspace(0, 1, n)
    samples[-n:] *= np.linspace(1, 0, n)
    assert d >= 0 and d + len(samples) <= len(mix)
    assert not np.any(owned[d:d + len(samples)])
    assert not np.any(retained[a:b])
    mix[d:d + len(samples)] = samples
    owned[d:d + len(samples)] = True
    retained[a:b] = True
    active = np.flatnonzero(np.abs(samples) > .002)
    edits.append({'scene': scene, 'cue_ids': ids, 'text': ' '.join(source_cues[i-1]['text'] for i in ids),
                  'source_in_sample': a, 'source_out_sample': b,
                  'sequence_start_sample': d, 'sequence_end_sample': d + len(samples),
                  'active_start_seconds': (d + int(active[0])) / SR,
                  'active_end_seconds': (d + int(active[-1]) + 1) / SR,
                  'speed': 1.0, 'pitch': 1.0, 'edge_peak_before_fade': edge_peak})
assert not np.any(audio[~retained])  # no nonzero speech sample is omitted
pause_a, pause_b = round(101.6 * SR), round(105.6 * SR)
assert pause_b - pause_a == 4 * SR and not np.any(mix[pause_a:pause_b])
assert edits[25]['sequence_end_sample'] == pause_a
assert edits[26]['sequence_start_sample'] == pause_b
edges = [0, 5, 25, 43, 61, 77, 110, 120]
scene_checks = []
for i in range(1, 8):
    selected = [e for e in edits if e['scene'] == i]
    speech_start = min(e['active_start_seconds'] for e in selected)
    speech_end = max(e['active_end_seconds'] for e in selected)
    assert edges[i-1] <= speech_start < speech_end <= edges[i]
    scene_checks.append({'scene': i, 'start': edges[i-1], 'end': edges[i],
                         'speech_start': speech_start, 'speech_end': speech_end, 'fits': True})

wav, mp3, video = [OUT / f'{STEM}.{extension}' for extension in ['wav', 'mp3', 'mp4']]
sf.write(wav, mix, SR, subtype='PCM_16')
run('-y', '-i', wav, '-c:a', 'libmp3lame', '-b:a', '192k', mp3)
# The input is the supplied silent, captioned whiteboard movie. Stream-copy its
# picture so that no drawing, chart, caption, frame rate, or speed is altered.
run('-y', '-i', SOURCE_VIDEO, '-i', wav, '-map', '0:v:0', '-map', '1:a:0',
    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', SR,
    '-metadata:s:a:0', 'language=eng', '-metadata:s:a:0', 'title=HeyGen Mike - Curious Chart Guide',
    '-movflags', '+faststart', video)
for path in [wav, mp3, video]:
    run('-v', 'error', '-i', path, '-f', 'null', '-')
final, rate = sf.read(wav, dtype='float32')
assert rate == SR and len(final) == 120 * SR and not np.any(final[pause_a:pause_b])
cap = cv2.VideoCapture(str(video))
assert cap.get(cv2.CAP_PROP_FPS) == 30 and cap.get(cv2.CAP_PROP_FRAME_COUNT) == 3600
width, height = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
cap.release()
shutil.copy2(SOURCE_AUDIO, OUT / 'HeyGen Mike - Continuous Natural Take.wav')
(OUT / 'narration.txt').write_text(script, encoding='utf-8')

report = {'source_video': str(SOURCE_VIDEO), 'source_video_sha256': hashlib.sha256(SOURCE_VIDEO.read_bytes()).hexdigest(),
          'existing_take_reused': True, 'new_synthesis_requests': 0,
          'voice_name': 'Mike', 'voice_id': meta['request']['voiceId'],
          'engine_requested_on_source': meta['request']['engine'], 'engine_returned_on_source': meta['result']['engine'],
          'source_speech_request_id': meta['result']['request_id'],
          'unit_2_voice_name': unit2['voice']['name'], 'different_from_unit_2': True,
          'source_audio': str(SOURCE_AUDIO), 'source_audio_sha256': hashlib.sha256(SOURCE_AUDIO.read_bytes()).hexdigest(),
          'source_duration_seconds': len(audio) / SR, 'final_duration_seconds': len(final) / SR,
          'sample_rate': SR, 'channels': 1, 'synthesis_speed': 1.0, 'playback_speed': 1.0,
          'target_words_per_minute': None, 'script_matches_storyboard': True,
          'audition_line_occurrences': 1, 'all_nonzero_source_samples_retained': True,
          'thinking_pause': {'start': 101.6, 'end': 105.6, 'seconds': 4.0, 'zero_pcm_samples': 4 * SR},
          'scene_checks': scene_checks, 'edits': edits,
          'wav_loudness_measurement': loudness(wav), 'mp4_loudness_measurement': loudness(video),
          'video': {'width': width, 'height': height, 'fps': 30, 'frames': 3600,
                    'source_picture_stream_copied': True, 'full_decode': 'passed'},
          'review': {'script_and_pcm_timing': 'passed', 'independent_asr': str(TAKE / 'transcription-check.json'),
                     'asr_limitations': 'Source ASR has minor recognition errors; it is not a listening review.',
                     'listening_review': 'not_performed', 'expressive_delivery': 'requires listening review',
                     'free_form_style_field_available': False, 'style_directions_spoken': False},
          'wav': wav.name, 'mp3': mp3.name, 'video_preview': video.name}
(OUT / 'production-check.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print(json.dumps({k: report[k] for k in ['existing_take_reused', 'new_synthesis_requests', 'voice_name',
      'source_duration_seconds', 'final_duration_seconds', 'thinking_pause', 'scene_checks', 'video']}, indent=2))
