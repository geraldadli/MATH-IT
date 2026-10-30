import hashlib
import json
import shutil
import subprocess
import wave
from pathlib import Path

import imageio_ffmpeg
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
WORK = Path(__file__).resolve().parent
DEST = ROOT / 'output/voiceovers/unit-2/microsoft-natural'
SR = 48000
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
PREFIX = 'Unit 2 - Thoughtful Detective - Natural'


def ffmpeg(args, **kwargs):
    return subprocess.run([FFMPEG, '-nostdin', '-hide_banner', '-nostats', *map(str, args)],
                          capture_output=True, check=True, **kwargs)


def decode(path):
    return np.frombuffer(ffmpeg(['-v', 'error', '-i', path, '-ac', 1, '-ar', SR,
                                '-f', 'f32le', 'pipe:1']).stdout, dtype=np.float32).copy()


def write_wav(path, audio):
    with wave.open(str(path), 'wb') as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(SR)
        f.writeframes((np.clip(audio, -1, 1) * 32767).astype('<i2').tobytes())


def loudness(path):
    result = ffmpeg(['-i', path, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=7:print_format=json', '-f', 'null', '-'])
    log = result.stderr.decode('utf-8', errors='replace')
    return json.JSONDecoder().raw_decode(log[log.rfind('{'):])[0]


def main():
    DEST.mkdir(parents=True, exist_ok=True)
    originals = DEST / 'originals'
    originals.mkdir(exist_ok=True)
    plan = json.loads((ROOT/'output/voiceovers/unit-2/natural-2026-10-30/production-plan.json').read_text(encoding='utf-8'))
    parts = json.loads((WORK/'generation-plan.json').read_text(encoding='utf-8'))
    source = {}
    report = []
    for part in parts:
        path = WORK/(part['id']+'.mp3')
        meta = json.loads(path.with_suffix('.json').read_text(encoding='utf-8'))
        audio = decode(path)
        active = np.flatnonzero(np.abs(audio) > 0.0003)
        assert len(active) > 100
        # Remove only the service's leading/trailing quiet padding.
        # Retain 10 ms at each edge to preserve consonant and breath tails.
        left = max(0, int(active[0]) - round(.010 * SR))
        right = min(len(audio), int(active[-1]) + round(.010 * SR) + 1)
        cut = audio[left:right].copy()
        fade = round(.002 * SR)
        assert np.max(np.abs(cut[:fade])) < .003
        assert np.max(np.abs(cut[-fade:])) < .003
        cut[:fade] *= np.linspace(0, 1, fade)
        cut[-fade:] *= np.linspace(1, 0, fade)
        source[part['id']] = cut
        report.append(dict(id=part['id'], scene=part['scene'], text=part['text'],
                           original_duration_seconds=len(audio)/SR,
                           source_in=left/SR, source_out=right/SR,
                           spoken_clip_seconds=len(cut)/SR, playback_speed=1.0,
                           source_sha256=hashlib.sha256(path.read_bytes()).hexdigest()))
        shutil.copy2(path, originals/path.name)
        shutil.copy2(path.with_suffix('.json'), originals/path.with_suffix('.json').name)

    timed = np.zeros(120 * SR, dtype=np.float32)
    scene_starts = {1:.2, 2:6.35, 3:26.15, 4:44.2, 5:62.25, 7:106.1}
    pause_start = 88.8
    pause_end = pause_start + 4
    for row in report:
        audio = source[row['id']]
        if row['id'] == 'scene-06-1':
            start = pause_start - len(audio)/SR
        elif row['id'] == 'scene-06-2':
            start = pause_end
        else:
            start = scene_starts[row['scene']]
        a = round(start*SR)
        b = a+len(audio)
        scene = plan['scenes'][row['scene']-1]
        assert a >= round(scene['start']*SR)
        assert b <= round(scene['end']*SR), (row['id'], b/SR, scene['end'])
        assert not np.any(timed[a:b])
        timed[a:b] = audio
        row.update(timed_start_seconds=a/SR, timed_end_seconds=b/SR)

    # Also retain a continuous take for editors who prefer to set drawing time.
    continuous = []
    cursor = 0
    compact_pause = None
    for index, row in enumerate(report):
        row['continuous_start_seconds'] = cursor/SR
        clip = source[row['id']]
        continuous.append(clip)
        cursor += len(clip)
        row['continuous_end_seconds'] = cursor/SR
        if row['id'] == 'scene-06-1':
            compact_pause = dict(start=cursor/SR, end=cursor/SR+4, duration_seconds=4)
            gap = 4
        elif index < len(report)-1:
            gap = .75
        else:
            gap = 0
        continuous.append(np.zeros(round(gap*SR), dtype=np.float32))
        cursor += round(gap*SR)
    compact = np.concatenate(continuous)
    raw = WORK/'timed-before-gain.wav'
    write_wav(raw, timed)
    measured = loudness(raw)
    gain = min(-16-float(measured['input_i']), -1.5-float(measured['input_tp']))
    wav = DEST/(PREFIX+' - 120s.wav')
    mp3 = wav.with_suffix('.mp3')
    compact_wav = DEST/(PREFIX+' - Continuous.wav')
    write_wav(wav, timed * 10**(gain/20))
    write_wav(compact_wav, compact * 10**(gain/20))
    ffmpeg(['-v', 'error', '-y', '-i', wav, '-c:a', 'libmp3lame', '-b:a', '192k', mp3])
    ffmpeg(['-v', 'error', '-y', '-i', compact_wav, '-c:a', 'libmp3lame', '-b:a', '192k', compact_wav.with_suffix('.mp3')])
    for path in [wav, mp3, compact_wav, compact_wav.with_suffix('.mp3')]:
        ffmpeg(['-v', 'error', '-i', path, '-f', 'null', '-'])
    with wave.open(str(wav), 'rb') as f:
        data = np.frombuffer(f.readframes(f.getnframes()), dtype='<i2')
        assert f.getnframes() == 120*SR
        assert np.max(np.abs(data[round(pause_start*SR):round(pause_end*SR)].astype(np.int32))) == 0
    final_loudness = loudness(wav)
    assert float(final_loudness['input_tp']) <= -1.45
    text = '\n\n'.join(s['text'] for s in plan['scenes'])+'\n'
    (DEST/'narration.txt').write_text(text, encoding='utf-8')
    direction = (ROOT/'output/voiceovers/unit-2/natural-2026-10-30/voice-style-instructions.txt').read_text(encoding='utf-8')
    direction = direction.split('PRODUCTION SETTINGS', 1)[0]
    direction += ('PRODUCTION SETTINGS\nProvider: Microsoft Edge online neural speech, via edge-tts.\n'
                  'Voice: en-US-AndrewNeural, male, American English.\n'
                  'Natural rate +0%, native pitch +0Hz, volume +0%, playback speed 1.0.\n'
                  'No fixed WPM target and no time stretching.\n'
                  'Catalog personality: Warm, Confident, Authentic, Honest.\n'
                  'Free-form style directions are not supported by this tool; no directions were spoken.\n'
                  'One exact four-second digital silent interval follows What was missed?.\n'
                  'The 120-second edition adds quiet drawing time within each original scene.\n')
    (DEST/'voice-direction.txt').write_text(direction, encoding='utf-8')
    summary = dict(provider='Microsoft Edge online neural speech', tool='edge-tts',
                   voice='en-US-AndrewNeural', rate='+0%', pitch='+0Hz', volume='+0%',
                   playback_speed=1.0, time_stretch=False, fixed_words_per_minute=None,
                   duration_seconds=120, continuous_duration_seconds=len(compact)/SR,
                   thinking_pause=dict(start=pause_start, end=pause_end, duration_seconds=4,
                                       verified_zero_pcm_samples=4*SR),
                   continuous_thinking_pause=compact_pause,
                   constant_gain_db=gain, integrated_loudness_lufs=float(final_loudness['input_i']),
                   true_peak_dbtp=float(final_loudness['input_tp']),
                   spoken_text_matches_script='Exact submitted text verified; independent ASR pending.',
                   audition_line_occurrences=1,
                   source_video=plan['source'], source_video_sha256=plan['source_sha256'],
                   files=dict(timed_wav=wav.name, timed_mp3=mp3.name,
                              continuous_wav=compact_wav.name, continuous_mp3=compact_wav.with_suffix('.mp3').name),
                   scene_windows=[dict(scene=s['id'],start=s['start'],end=s['end']) for s in plan['scenes']],
                   source_to_final=report,
                   review=dict(decode='passed', every_part_within_original_scene='passed',
                               four_second_silence='passed', clipping='passed',
                               listening='Not performed; automated speech and waveform checks only.'))
    (DEST/'narration-handoff.json').write_text(json.dumps(summary, indent=2), encoding='utf-8')
    for name in ['generate.py', 'assemble.py', 'voice-catalog.json', 'generation-plan.json']:
        shutil.copy2(WORK/name, DEST/name)
    print(json.dumps(summary, indent=2), flush=True)


if __name__ == '__main__':
    main()
