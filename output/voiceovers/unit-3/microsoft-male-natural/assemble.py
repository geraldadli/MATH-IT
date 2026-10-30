import hashlib
import json
import re
import shutil
import subprocess
import wave
from pathlib import Path

import imageio_ffmpeg
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
WORK = Path(__file__).resolve().parent
DEST = ROOT/'output/voiceovers/unit-3/microsoft-male-natural'
PREFIX = 'Unit 3 - Warm Male Detective - Natural'
SR = 48000
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()


def ffmpeg(args):
    return subprocess.run([FFMPEG, '-nostdin', '-hide_banner', '-nostats', *map(str,args)],
                          check=True, capture_output=True)


def decode(path):
    return np.frombuffer(ffmpeg(['-v','error','-i',path,'-ar',SR,'-ac',1,
                                 '-f','f32le','pipe:1']).stdout,dtype=np.float32).copy()


def write_wav(path, data):
    with wave.open(str(path),'wb') as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(SR)
        f.writeframes((np.clip(data,-1,1)*32767).astype('<i2').tobytes())


def loudness(path):
    log=ffmpeg(['-i',path,'-af','loudnorm=I=-16:TP=-1.5:LRA=7:print_format=json',
                '-f','null','-']).stderr.decode('utf-8',errors='replace')
    return json.JSONDecoder().raw_decode(log[log.rfind('{'):])[0]


def normal(text):
    return ''.join(re.findall('[a-z0-9]',text.lower()))


def stamp(t):
    ms=round(t*1000)
    return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'


def main():
    plan=json.loads((WORK/'generation-plan.json').read_text(encoding='utf-8'))
    originals=DEST/'originals'
    originals.mkdir(parents=True,exist_ok=True)
    rows=[]
    clips={}
    for part in plan['parts']:
        path=WORK/(part['id']+'.mp3')
        meta=json.loads(path.with_suffix('.json').read_text(encoding='utf-8'))
        events=[e for e in meta['events'] if e['type']=='WordBoundary']
        assert normal(''.join(e['text'] for e in events))==normal(part['text']),part['id']
        original=decode(path)
        active=np.flatnonzero(np.abs(original)>.0003)
        assert len(active)>100
        a=max(0,int(active[0])-round(.010*SR))
        b=min(len(original),int(active[-1])+round(.010*SR)+1)
        clip=original[a:b].copy()
        fade=round(.002*SR)
        assert max(np.max(np.abs(clip[:fade])),np.max(np.abs(clip[-fade:])))<.003
        clip[:fade]*=np.linspace(0,1,fade)
        clip[-fade:]*=np.linspace(1,0,fade)
        clips[part['id']]=clip
        row=dict(id=part['id'],scene=part['scene'],text=part['text'],
                 source_in_seconds=a/SR,source_out_seconds=b/SR,source_duration_seconds=len(original)/SR,
                 retained_seconds=len(clip)/SR,playback_speed=1.0,
                 sha256=hashlib.sha256(path.read_bytes()).hexdigest(),
                 word_boundary_tokens_match_exact_script=True)
        rows.append(row)
        shutil.copy2(path,originals/path.name)
        shutil.copy2(path.with_suffix('.json'),originals/path.with_suffix('.json').name)

    # Compact edition retains natural prosody within each coherent scene.
    # The question and answer are separated by exactly 192000 zero samples.
    pieces=[np.zeros(round(.2*SR),dtype=np.float32)]
    cursor=len(pieces[0])
    compact_pause=None
    for i,(part,row) in enumerate(zip(plan['parts'],rows)):
        row['continuous_start_seconds']=cursor/SR
        clip=clips[part['id']]
        pieces.append(clip)
        cursor+=len(clip)
        row['continuous_end_seconds']=cursor/SR
        if part['pause_after_seconds']==4:
            compact_pause=dict(start=cursor/SR,end=cursor/SR+4,duration_seconds=4)
            gap=4
        else:
            gap=.75 if i<len(rows)-1 else .2
        pieces.append(np.zeros(round(gap*SR),dtype=np.float32))
        cursor+=round(gap*SR)
    continuous=np.concatenate(pieces)

    # Add drawing/reading time in the 120-second edition without changing speech speed.
    timed=np.zeros(120*SR,dtype=np.float32)
    starts={1:.5,2:7.6,3:32.6,4:54.6,6:105.5}
    for row in rows:
        clip=clips[row['id']]
        if row['id']=='scene-05-1':
            a=round(98.4*SR)-len(clip)
        elif row['id']=='scene-05-2':
            a=round(102.4*SR)
        else:
            a=round(starts[row['scene']]*SR)
        b=a+len(clip)
        window=plan['scene_windows'][row['scene']-1]
        assert a>=round(window['start']*SR) and b<=round(window['end']*SR),(row['id'],a/SR,b/SR)
        assert not np.any(timed[a:b])
        timed[a:b]=clip
        row.update(timed_start_seconds=a/SR,timed_end_seconds=b/SR,
                   scene_start_seconds=window['start'],scene_end_seconds=window['end'],fits_original_scene=True)
    raw=WORK/'timed-before-gain.wav'
    write_wav(raw,timed)
    measured=loudness(raw)
    gain=min(-16-float(measured['input_i']),-1.5-float(measured['input_tp']))
    gain_linear=10**(gain/20)
    editions={}
    for label,data,pause in [
        ('Continuous',continuous,compact_pause),
        ('120s',timed,dict(start=98.4,end=102.4,duration_seconds=4))]:
        wav=DEST/(PREFIX+' - '+label+'.wav')
        mp3=wav.with_suffix('.mp3')
        write_wav(wav,data*gain_linear)
        ffmpeg(['-v','error','-y','-i',wav,'-c:a','libmp3lame','-b:a','192k',mp3])
        with wave.open(str(wav),'rb') as f:
            pcm=np.frombuffer(f.readframes(f.getnframes()),dtype='<i2')
            assert f.getframerate()==SR and f.getnchannels()==1
            length=f.getnframes()/SR
        a=round(pause['start']*SR)
        b=a+4*SR
        assert len(pcm[a:b])==4*SR and not np.any(pcm[a:b])
        assert np.max(np.abs(pcm.astype(np.int32)))<32767
        ffmpeg(['-v','error','-i',mp3,'-f','null','-'])
        stats=loudness(wav)
        assert float(stats['input_tp'])<=-1.45
        editions[label]=dict(wav=wav.name,mp3=mp3.name,duration_seconds=length,
                            integrated_loudness_lufs=float(stats['input_i']),
                            true_peak_dbtp=float(stats['input_tp']),
                            thinking_pause=dict(**pause,verified_zero_pcm_samples=4*SR),
                            wav_sha256=hashlib.sha256(wav.read_bytes()).hexdigest())
        srt=[]
        for i,row in enumerate(rows,1):
            prefix='continuous' if label=='Continuous' else 'timed'
            srt.append(f"{i}\n{stamp(row[prefix+'_start_seconds'])} --> {stamp(row[prefix+'_end_seconds'])}\n{row['text']}\n")
        wav.with_suffix('.srt').write_text('\n'.join(srt),encoding='utf-8')
    assert editions['120s']['duration_seconds']==120

    report=dict(provider=plan['provider'],tool=plan['tool'],tool_version=plan['tool_version'],
                voice=plan['voice'],gender='Male',locale='en-US',character='Warm male detective',
                synthesis_settings=plan['settings'],playback_speed=1.0,time_stretch=False,
                fixed_words_per_minute=None,script_word_count=172,audition_line_occurrences=1,
                new_synthesis=True,constant_gain_db=gain,
                editions=editions,source_to_final=rows,original_scene_windows=plan['scene_windows'],
                style_limitation=plan['style_limitation'],
                review=dict(decode='Passed',script_boundary_tokens='All match',
                            every_part_fits_original_scene=True,thinking_pause='Four seconds of zero PCM samples in both editions',
                            clipping='Passed',listening='Not performed; automated checks only.',
                            independent_transcription='Pending.'))
    (DEST/'narration-handoff.json').write_text(json.dumps(report,indent=2,ensure_ascii=False),encoding='utf-8')
    directions=('Warm male detective, American English, respectful and encouraging to one child aged eight or nine.\n'
                'Clear numbers and units, calm attention to discoveries, distinct sentence endings.\n'
                'Microsoft AndrewNeural, native rate +0%, pitch +0Hz, playback speed 1.0.\n'
                'No spoken production notes, added words, music, sound effects, or fixed WPM target.\n'
                'A four-second silent thinking pause follows Does it fit either rule? and precedes Neither.\n'
                'Free-form style prompts are not supported by this provider; catalog voice selection controls personality.\n')
    (DEST/'voice-direction.txt').write_text(directions,encoding='utf-8')
    for name in ['generate.py','assemble.py','voice-catalog.json','generation-plan.json']:
        shutil.copy2(WORK/name,DEST/name)
    print(json.dumps(dict(voice=report['voice'],editions=editions,
                          all_scenes_fit=True,boundary_tokens_match=True),indent=2),flush=True)


if __name__=='__main__':
    main()

