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
DEST = ROOT / 'output/videos/unit-2-natural'
SOURCE = Path(r'C:\Users\Asus\Downloads\Math It Unit 2 Video.mp4')
VOICE = ROOT / 'output/voiceovers/unit-2/microsoft-natural'
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
SR = 48000
PREFIX = 'Math It Unit 2 - Synced Natural Narration'
GROUPS = [[2],[3,4,5],[7],[8,9],[10,11],[12],[13,14],[16,17],[18],[19,20,21],
          [22,23],[26,27],[28,29,30,31],[32,33],[34,35],[37],[38,39],[40,41],
          [42,43],[46,47],[48,49],[51,52],[53],[54,55,56],[58,59],[60,61],[62,63]]


def ffmpeg(args, **kwargs):
    return subprocess.run([FFMPEG, '-nostdin', '-hide_banner', '-nostats', *map(str, args)],
                          capture_output=True, check=True, **kwargs)


def decode(path):
    return np.frombuffer(ffmpeg(['-v','error','-i',path,'-ar',SR,'-ac',1,
                                '-f','f32le','pipe:1']).stdout,dtype=np.float32).copy()


def normal(text):
    return re.sub('[^a-z0-9]', '', text.lower())


def boundary(audio, expected):
    # Search the expected sentence gap for a quiet 10 ms handle.
    radius = round(.09*SR)
    width = round(.01*SR)
    center = round(expected*SR)
    candidates = range(max(width,center-radius),min(len(audio)-width,center+radius),round(.002*SR))
    return min(candidates,key=lambda i:float(np.mean(np.square(audio[i-width//2:i+width//2]))))


def trim(audio, left, right):
    region = audio[left:right]
    active = np.flatnonzero(np.abs(region)>.0003)
    assert len(active)>100
    a = left+max(0,int(active[0])-round(.010*SR))
    b = left+min(len(region),int(active[-1])+round(.010*SR)+1)
    cut=audio[a:b].copy()
    fade=round(.002*SR)
    assert np.max(np.abs(cut[:fade]))<.003
    assert np.max(np.abs(cut[-fade:]))<.003
    cut[:fade]*=np.linspace(0,1,fade)
    cut[-fade:]*=np.linspace(1,0,fade)
    return cut,a,b


def save_wav(path,audio):
    with wave.open(str(path),'wb') as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(SR)
        f.writeframes((np.clip(audio,-1,1)*32767).astype('<i2').tobytes())


def main():
    DEST.mkdir(parents=True,exist_ok=True)
    handoff=json.loads((VOICE/'narration-handoff.json').read_text(encoding='utf-8'))
    assert hashlib.sha256(SOURCE.read_bytes()).hexdigest()==handoff['source_video_sha256']
    runs=json.loads((ROOT/'tmp/unit2-voiceover/caption-runs.json').read_text(encoding='utf-8'))
    by_id={r['id']:r for r in runs}
    pieces=[]
    for metadata in sorted((VOICE/'originals').glob('*.json')):
        part=json.loads(metadata.read_text(encoding='utf-8'))
        assert part['voice']=='en-US-AndrewNeural'
        assert part['settings']==dict(rate='+0%',pitch='+0Hz',volume='+0%')
        mp3=metadata.with_suffix('.mp3')
        assert hashlib.sha256(mp3.read_bytes()).hexdigest()==part['sha256']
        audio=decode(mp3)
        words=[event for event in part['events'] if event['type']=='WordBoundary']
        sentences=re.split(r'(?<=[.!?])\s+',part['text'])
        index=0
        groups=[]
        for sentence in sentences:
            first=index
            collected=''
            while len(collected)<len(normal(sentence)):
                collected+=normal(words[index]['text'])
                index+=1
            assert collected==normal(sentence),(sentence,collected)
            groups.append((sentence,first,index-1))
        assert index==len(words)
        # Edge word metadata is close to decoded audio. Gap searches tolerate
        # the small MP3 encoder delay, while preserving complete spoken words.
        cuts=[0]
        for previous,following in zip(groups,groups[1:]):
            last=words[previous[2]]
            next_word=words[following[1]]
            expected=((last['offset']+last['duration'])/1e7+next_word['offset']/1e7)/2+.04
            cut=boundary(audio,expected)
            assert np.max(np.abs(audio[cut-round(.002*SR):cut+round(.002*SR)]))<.003
            cuts.append(cut)
        cuts.append(len(audio))
        for i,(sentence,first,last) in enumerate(groups):
            samples,a,b=trim(audio,cuts[i],cuts[i+1])
            pieces.append(dict(text=sentence,source_file=str(mp3),source_in=a/SR,source_out=b/SR,
                               scene=part['scene'],samples=samples))

    assert len(pieces)==len(GROUPS)==27
    approved=' '.join((VOICE/'narration.txt').read_text(encoding='utf-8').split())
    assert ' '.join(p['text'] for p in pieces)==approved
    timeline=np.zeros(120*SR,dtype=np.float32)
    cues=[]
    for index,(piece,group) in enumerate(zip(pieces,GROUPS),1):
        caption_start=max(0,by_id[group[0]]['start']-.12)
        caption_end=min(120,by_id[group[-1]]['end']+.10)
        if index==22:
            # The answer starts fading in at 92.8 s; its first fully stable
            # crop is 93.0 s. Keep the established four-second thinking hold.
            caption_start=92.8
        samples=piece.pop('samples')
        start=caption_start
        if index==21:
            assert piece['text']=='What was missed?'
            start=88.8-len(samples)/SR
        if index==22:
            assert piece['text']=='The extra ten!'
            start=92.8
        a=round(start*SR)
        b=a+len(samples)
        assert a>=round(caption_start*SR),(index,'caption start',a/SR,caption_start)
        assert b<=round(caption_end*SR),(index,'caption end',b/SR,caption_end)
        assert not np.any(timeline[a:b])
        timeline[a:b]=samples
        cue=dict(id=index,**piece,caption_start=caption_start,caption_end=caption_end,
                 start=a/SR,end=b/SR,duration_seconds=len(samples)/SR,
                 playback_speed=1.0,time_stretch=False)
        cues.append(cue)
        print(f'{index:02} {a/SR:8.3f}-{b/SR:8.3f}: {piece["text"]}',flush=True)

    assert cues[20]['end']==88.8
    assert cues[21]['start']==92.8
    assert cues[21]['start']-cues[20]['end']==4
    assert np.max(np.abs(timeline[round(88.8*SR):round(92.8*SR)]))==0
    gain=handoff['constant_gain_db']
    wav=DEST/(PREFIX+'.wav')
    save_wav(wav,timeline*10**(gain/20))
    mp3=DEST/(PREFIX+'.mp3')
    ffmpeg(['-v','error','-y','-i',wav,'-c:a','libmp3lame','-b:a','192k',mp3])
    video=DEST/(PREFIX+'.mp4')
    ffmpeg(['-v','error','-y','-i',SOURCE,'-i',wav,'-map','0:v:0','-map','1:a:0',
            '-c:v','copy','-c:a','aac','-b:a','192k','-ar',SR,'-t',120,
            '-movflags','+faststart','-metadata:s:a:0','language=eng',
            '-metadata:s:a:0','title=Unit 2 - Andrew - natural speech',video])
    report=dict(source=str(SOURCE),source_sha256=handoff['source_video_sha256'],
                video=str(video),wav=str(wav),mp3=str(mp3),duration_seconds=120,
                voice='en-US-AndrewNeural',native_rate='+0%',native_pitch='+0Hz',
                playback_speed=1.0,time_stretch=False,constant_gain_db=gain,
                video_edit='Original H.264 stream copied; original burned-in captions retained.',
                timing_method='Natural sentence gaps split; each sentence placed inside its matching caption interval.',
                thinking_pause=dict(start=88.8,end=92.8,duration_seconds=4,zero_pcm_samples=4*SR),
                exact_input_script_verified=True,cues=cues,
                inherited_narration_review=handoff['review'],verification='pending')
    (DEST/'sync-report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    shutil.copy2(Path(__file__),DEST/'sync-video.py')
    print('VIDEO_CREATED '+str(video),flush=True)


if __name__=='__main__':
    main()
