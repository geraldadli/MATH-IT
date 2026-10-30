import hashlib
import json
import re
import shutil
import subprocess
import wave
from pathlib import Path

import cv2
import imageio_ffmpeg
import numpy as np

ROOT=Path(__file__).resolve().parents[2]
WORK=Path(__file__).resolve().parent
DEST=ROOT/'output/voiceovers/unit-3/microsoft-male-natural'
SOURCE=Path(r'C:\Users\Asus\Downloads\Math It Unit 3.mp4')
FF=imageio_ffmpeg.get_ffmpeg_exe()
SR=48000
PREFIX='Math It Unit 3 - Warm Male Detective - Finished'
SLOTS=[
('scene-01-1',[
(.5,'Our toolkit measures length, mass, and time,'),
(4.1,'and helps us investigate shapes.')]),
('scene-02-1',[
(7.6,'One meter is one hundred centimeters.'),
(11.8,'Half a meter is fifty centimeters.'),
(15.6,'Before adding lengths, use the same unit.'),
(20.,'Two meters and thirty centimeters becomes two hundred plus thirty:'),
(25.7,'two hundred thirty centimeters.')]),
('scene-03-1',[
(32.6,'One kilogram is one thousand grams.'),
(36.6,'Half a kilogram is five hundred grams.'),
(40.6,'Change kilograms into grams before combining them.'),
(45.2,'One kilogram plus two hundred fifty grams'),
(48.6,'makes one thousand two hundred fifty grams.')]),
('scene-04-1',[
(54.6,'An hour has sixty minutes.'),
(57.6,'Count forward to find elapsed time.'),
(61.2,'From nine forty to ten o’clock is twenty minutes.'),
(66.8,'Continue five more minutes to ten oh five.'),
(71.8,'Twenty plus five makes twenty-five minutes.')]),
('scene-05-1',[
(78.6,'A square has four equal sides and right angles,'),
(83.4,'even when turned.'),
(85.8,'A right angle is a square corner.'),
(90.,'This triangle has three equal sides and no right angle.'),
(None,'Does it fit either rule?')]),
('scene-05-2',[(102.4,'Neither.')]),
('scene-06-1',[
(105.5,'Match your units, count time carefully,'),
(108.8,'and check shape properties instead of guessing from appearance.'),
(113.8,'Take your time, and try the Unit Three quizzes!')]),
]


def ff(args):
    return subprocess.run([FF,'-nostdin','-hide_banner','-nostats',*map(str,args)],
                          check=True,capture_output=True)


def decode(path):
    return np.frombuffer(ff(['-v','error','-i',path,'-ar',SR,'-ac',1,'-f','f32le','pipe:1']).stdout,
                         dtype=np.float32).copy()


def norm(text):
    return re.sub('[^a-z0-9]','',text.lower())


def quiet_cut(audio,target):
    half=round(.005*SR)
    a=max(half,round((target-.30)*SR))
    b=min(len(audio)-half,round((target+.30)*SR))
    indices=np.arange(a,b)
    noisy=(np.abs(audio)>.0003).astype(np.int32)
    cumulative=np.concatenate(([0],np.cumsum(noisy,dtype=np.int64)))
    quiet=(cumulative[indices+half]-cumulative[indices-half])==0
    options=indices[quiet]
    assert len(options),f'No quiet join near {target:.4f}s'
    cut=int(options[np.argmin(np.abs(options-target*SR))])
    assert np.max(np.abs(audio[cut-half:cut+half]))<=.0003
    return cut


def stamp(t):
    ms=round(t*1000)
    return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'


def video_hash(path):
    return ff(['-v','error','-i',path,'-map','0:v:0','-c:v','copy','-f','hash',
               '-hash','sha256','-']).stdout.decode().strip()


def main():
    handoff=json.loads((DEST/'narration-handoff.json').read_text(encoding='utf-8'))
    reference=' '.join((DEST/'narration.txt').read_text(encoding='utf-8').split())
    assert reference==' '.join(text for _,phrases in SLOTS for _,text in phrases)
    assert handoff['voice']=='en-US-AndrewNeural' and handoff['playback_speed']==1
    mix=np.zeros(120*SR,dtype=np.float32)
    rows=[]
    for part_id,phrases in SLOTS:
        original=DEST/'originals'/(part_id+'.mp3')
        meta=json.loads(original.with_suffix('.json').read_text(encoding='utf-8'))
        assert meta['voice']==handoff['voice']
        assert meta['settings']==dict(rate='+0%',pitch='+0Hz',volume='+0%')
        assert ' '.join(text for _,text in phrases)==meta['text']
        events=[e for e in meta['events'] if e['type']=='WordBoundary']
        audio=decode(original)
        active=np.flatnonzero(np.abs(audio)>.0003)
        shift=(active[0]/SR)-(events[0]['offset']/10000000)
        cursor=0
        ranges=[]
        for target_start,text in phrases:
            first=cursor
            token=''
            while norm(token)!=norm(text):
                assert cursor<len(events),(part_id,text,token)
                token+=events[cursor]['text']
                assert norm(text).startswith(norm(token)),(part_id,text,token)
                cursor+=1
            ranges.append((first,cursor))
        assert cursor==len(events)
        cuts=[0]
        for (_,end),_ in zip(ranges,ranges[1:]):
            previous=events[end-1]
            following=events[end]
            previous_end=(previous['offset']+previous['duration'])/10000000
            following_start=following['offset']/10000000
            cuts.append(quiet_cut(audio,(previous_end+following_start)/2+shift))
        cuts.append(len(audio))
        for i,((target_start,text),(first,end)) in enumerate(zip(phrases,ranges)):
            section=audio[cuts[i]:cuts[i+1]]
            active=np.flatnonzero(np.abs(section)>.0003)
            assert len(active)>100
            left=max(0,int(active[0])-round(.010*SR))
            right=min(len(section),int(active[-1])+round(.010*SR)+1)
            clip=section[left:right].copy()
            fade=round(.002*SR)
            assert max(np.max(np.abs(clip[:fade])),np.max(np.abs(clip[-fade:])))<.003
            clip[:fade]*=np.linspace(0,1,fade)
            clip[-fade:]*=np.linspace(1,0,fade)
            start=round(98.4*SR)-len(clip) if target_start is None else round(target_start*SR)
            finish=start+len(clip)
            assert start>=0 and finish<=len(mix)
            assert not np.any(mix[start:finish]),(text,'Overlap')
            mix[start:finish]=clip
            row=dict(id=len(rows)+1,text=text,original=original.name,
                     source_in_sample=cuts[i]+left,source_out_sample=cuts[i]+right,
                     start_sample=start,end_sample=finish,start=start/SR,end=finish/SR,
                     playback_speed=1.0,word_records_match=True)
            rows.append(row)
            print(f"Aligned {row['id']:02}: {row['start']:.3f}-{row['end']:.3f} {text}",flush=True)
    assert ' '.join(row['text'] for row in rows)==reference
    assert all(rows[i]['end_sample']<=rows[i+1]['start_sample'] for i in range(len(rows)-1))
    q=next(row for row in rows if row['text']=='Does it fit either rule?')
    a=next(row for row in rows if row['text']=='Neither.')
    assert a['start_sample']-q['end_sample']==4*SR
    assert not np.any(mix[q['end_sample']:a['start_sample']])
    # Match the previously accepted track's gain and native playback speed.
    mix*=10**(handoff['constant_gain_db']/20)
    wav=DEST/(PREFIX+'.wav')
    with wave.open(str(wav),'wb') as w:
        w.setnchannels(1);w.setsampwidth(2);w.setframerate(SR)
        w.writeframes((np.clip(mix,-1,1)*32767).astype('<i2').tobytes())
    final=DEST/(PREFIX+'.mp4')
    ff(['-v','error','-y','-i',SOURCE,'-i',wav,'-map','0:v:0','-map','1:a:0',
        '-c:v','copy','-c:a','aac','-b:a','192k','-ar',SR,
        '-t','120','-movflags','+faststart','-metadata','title=Math It Unit 3 - Warm Male Detective',
        '-metadata:s:a:0','language=eng','-disposition:a:0','default',final])
    srt='\n'.join(f"{i}\n{stamp(row['start'])} --> {stamp(row['end'])}\n{row['text']}\n"
                  for i,row in enumerate(rows,1))
    final.with_suffix('.srt').write_text(srt,encoding='utf-8')
    before=video_hash(SOURCE)
    after=video_hash(final)
    assert before==after,'Video stream changed'
    ff(['-v','error','-i',final,'-f','null','-'])
    cap=cv2.VideoCapture(str(final))
    geometry=dict(width=round(cap.get(cv2.CAP_PROP_FRAME_WIDTH)),height=round(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)),
                  fps=cap.get(cv2.CAP_PROP_FPS),frames=round(cap.get(cv2.CAP_PROP_FRAME_COUNT)))
    cap.release()
    assert geometry==dict(width=1920,height=1080,fps=30.,frames=3600)
    decoded=decode(final)
    # AAC can add imperceptible quantization residue at silence edges.
    # Check both the exact lossless interval and the exported quiet interval.
    pause=decoded[q['end_sample']:a['start_sample']]
    peak=float(np.max(np.abs(pause)))
    assert peak<.0003,(peak,'AAC pause is not quiet')
    assert np.max(np.abs(decoded))<1
    info=subprocess.run([FF,'-hide_banner','-i',str(final)],capture_output=True,text=True).stderr
    assert 'Duration: 00:02:00.00' in info and 'Audio: aac' in info and 'Video: h264' in info
    report=dict(source=str(SOURCE),source_sha256=hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
                output=str(final),output_sha256=hashlib.sha256(final.read_bytes()).hexdigest(),
                bytes=final.stat().st_size,duration_seconds=120,**geometry,
                video_stream_preserved_exactly=True,video_stream_hash=after,
                audio_provider=handoff['provider'],voice=handoff['voice'],playback_speed=1.0,
                speech_regenerated=False,script_word_count=172,exact_script_tokens_verified=True,
                source_audio='Previously generated seven original Andrew recordings; phrase placement follows original caption onsets.',
                audio_format='AAC 192 kbps mono 48 kHz',constant_gain_db=handoff['constant_gain_db'],
                thinking_pause=dict(start=q['end'],end=a['start'],seconds=4,
                                    zero_pcm_samples=4*SR,aac_decoded_peak=peak,
                                    aac_quiet_threshold_dbfs=-70.46),
                verification=dict(full_decode='passed',resolution_and_frame_count='passed',
                                  video_stream_identity='passed',no_audio_overlap='passed',
                                  voice_and_script_metadata='passed',pause='passed',
                                  listening_review='Not performed. Prior ASR limitations are in narration-handoff.json.'),
                cues=rows)
    (DEST/'finished-video-check.json').write_text(json.dumps(report,indent=2,ensure_ascii=False),encoding='utf-8')
    (WORK/'export-log.txt').write_text(info,encoding='utf-8')
    shutil.copy2(Path(__file__),DEST/Path(__file__).name)
    print(json.dumps({k:report[k] for k in ['output','duration_seconds','width','height','frames',
                                           'bytes','video_stream_preserved_exactly','thinking_pause']},indent=2),flush=True)


if __name__=='__main__':
    main()

