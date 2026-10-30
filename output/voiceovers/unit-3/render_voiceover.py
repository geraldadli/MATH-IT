"""Assemble approved existing Aria takes at 1.0x and caption the supplied video."""
import hashlib
import html
import json
import re
import shutil
import subprocess
import wave
from pathlib import Path

import cv2
import imageio_ffmpeg
import numpy as np
from PIL import ImageFont

ROOT = Path(r'D:\Project-Website\math-it')
WORK = ROOT / 'tmp/unit3-patient-explorer'
OUT = ROOT / 'output/voiceovers/unit-3'
OUT.mkdir(parents=True, exist_ok=True)
SOURCE = Path(r'C:\Users\Asus\Downloads\Math It Unit 3.mp4')
FF = imageio_ffmpeg.get_ffmpeg_exe()
SR = 48000
VOICE = 'en-US-AriaNeural'
NAME = 'Math It Unit 3 - Patient Explorer'

def ff(args, **kwargs):
    return subprocess.run([FF, '-nostdin', '-hide_banner', '-loglevel', 'error', *map(str,args)], check=True, **kwargs)

def decode(p):
    return np.frombuffer(ff(['-i',p,'-ac','1','-ar',SR,'-f','f32le','pipe:1'], capture_output=True).stdout,dtype=np.float32).copy()

def norm(s):
    return re.sub(r'[^a-z0-9]', '', html.unescape(s).lower())

def stamp(t, ass=False):
    n=round(t*(100 if ass else 1000))
    if ass:
        return f'{n//360000:01}:{n//6000%60:02}:{n//100%60:02}.{n%100:02}'
    return f'{n//3600000:02}:{n//60000%60:02}:{n//1000%60:02},{n%1000:03}'

capture=cv2.VideoCapture(str(SOURCE))
fps=capture.get(cv2.CAP_PROP_FPS)
frames=round(capture.get(cv2.CAP_PROP_FRAME_COUNT))
width=round(capture.get(cv2.CAP_PROP_FRAME_WIDTH)); height=round(capture.get(cv2.CAP_PROP_FRAME_HEIGHT))
duration=frames/fps
capture.set(cv2.CAP_PROP_POS_MSEC,1000)
ok,frame=capture.read(); assert ok
bar_color=tuple(int(x) for x in frame[1030,1800][::-1])
capture.release()
assert (width,height,frames,fps)==(1920,1080,3600,30)
assessment=json.loads((WORK/'existing-source-assessment.json').read_text(encoding='utf-8'))
scene_texts=json.loads((WORK/'scenes.json').read_text(encoding='utf-8'))
plan=json.loads((WORK/'scene-plan.json').read_text(encoding='utf-8'))
rows=assessment['cues']
assert all(Path(c['source']).stem==f"voice-{c['id']:02}" for c in rows)
assert all(c['generation_rate']=='-20%' for c in rows)
assert ' '.join(c['text'] for c in rows)==' '.join(scene_texts)

# Existing storyboard speech anchors; reading/drawing continues after each natural take.
starts=[.5,7.6,11.8,15.6,20,32.6,36.5,40.6,46.2,54.6,57.6,61.2,66.8,71.8,78.6,85.8,90,None,102.4,105.5,113.8]
mix=np.zeros(round(SR*duration),dtype=np.float32)
placed=[]
for c,start in zip(rows,starts):
    c=dict(c)
    p=Path(c['source'])
    samples=decode(p)[c['trim_start_sample']:c['trim_end_sample']]
    if c['id']==18:
        first_sample=round(98.4*SR)-len(samples)
    else:
        first_sample=round(start*SR)
    last_sample=first_sample+len(samples)
    assert not np.any(mix[first_sample:last_sample])
    # Fades remain in the retained edge padding and do not change elapsed time.
    fade=min(144,len(samples)//2)
    samples[:fade]*=np.linspace(0,1,fade)
    samples[-fade:]*=np.linspace(1,0,fade)
    mix[first_sample:last_sample]=samples
    scene=next(s for s in plan['scenes'] if c['id'] in s['sentence_ids'])
    assert first_sample>=round(scene['start']*SR) and last_sample<=round(scene['end']*SR)
    meta=json.loads(p.with_suffix('.json').read_text(encoding='utf-8'))
    boundaries=meta['boundaries']
    assert norm(''.join(w['text'] for w in boundaries))==norm(c['text']),c['id']
    c.update(scene=scene['scene'],start_sample=first_sample,end_sample=last_sample,
             speech_start=first_sample/SR,speech_end=last_sample/SR,
             source_sha256=hashlib.sha256(p.read_bytes()).hexdigest(),playback_rate=1.0,
             source_in=c['trim_start_sample']/SR,source_out=c['trim_end_sample']/SR,
             boundary_data=boundaries)
    placed.append(c)

q,a=placed[17:19]
assert a['start_sample']-q['end_sample']==4*SR
assert not np.any(mix[q['end_sample']:a['start_sample']])
raw=WORK/'narration-natural-raw.wav'
with wave.open(str(raw),'wb') as w:
    w.setnchannels(1);w.setsampwidth(2);w.setframerate(SR)
    w.writeframes((np.clip(mix,-1,1)*32767).astype(np.int16).tobytes())

analysis=subprocess.run([FF,'-hide_banner','-i',str(raw),'-af','loudnorm=I=-16:TP=-1.5:LRA=7:print_format=json','-f','null','-'],capture_output=True,text=True,check=True)
stats=json.JSONDecoder().raw_decode(analysis.stderr[analysis.stderr.rfind('{'):])[0]
normalizer=(f"loudnorm=I=-16:TP=-1.5:LRA=7:measured_I={stats['input_i']}:measured_TP={stats['input_tp']}:"
            f"measured_LRA={stats['input_lra']}:measured_thresh={stats['input_thresh']}:offset={stats['target_offset']}:linear=true")
wav=OUT/(NAME+'.wav');mp3=wav.with_suffix('.mp3');video=wav.with_suffix('.mp4')
ff(['-y','-i',raw,'-af',normalizer,'-ar',SR,'-c:a','pcm_s16le',wav])
ff(['-y','-i',wav,'-c:a','libmp3lame','-b:a','192k',mp3])

# Caption groups inherit real synthesizer boundary offsets, anchored to observed audio onset.
# Whole-sentence timings remain the measured retained phrase interval.
groups={
 1:['Our toolkit measures length, mass, and time,','and helps us investigate shapes.'],
 5:['Two meters and thirty centimeters becomes two hundred plus thirty:','two hundred thirty centimeters.'],
 9:['One kilogram plus two hundred fifty grams','makes one thousand two hundred fifty grams.'],
 15:['A square has four equal sides and right angles,','even when turned.'],
 20:['Match your units, count time carefully,','and check shape properties instead of guessing from appearance.']
}
font=ImageFont.truetype(r'C:\Windows\Fonts\arialbd.ttf',44)
def wrap(text):
    if font.getlength(text)<=1400:return text
    words=text.split(); choices=[]
    for i in range(1,len(words)):
        left=' '.join(words[:i]);right=' '.join(words[i:])
        if max(font.getlength(left),font.getlength(right))<=1400:
            choices.append((max(font.getlength(left),font.getlength(right)) + (500 if i==1 or i==len(words)-1 else 0),left,right))
    assert choices,text
    _,left,right=min(choices)
    return left+'\n'+right

captions=[]
for index,c in enumerate(placed):
    texts=groups.get(c['id'],[c['text']])
    assert norm(''.join(texts))==norm(c['text'])
    b=c['boundary_data']; word_index=0
    for gi,text in enumerate(texts):
        start_word=word_index
        accum=''
        while len(accum)<len(norm(text)):
            accum+=norm(b[word_index]['text']);word_index+=1
        assert accum==norm(text),(c['id'],text,accum)
        onset=(b[start_word]['offset']-b[0]['offset'])/1e7
        begin=c['speech_start']+(.025 if gi else 0)+onset
        # Keep the question readable throughout the explicitly authored thinking pause.
        if c['id']==18:
            end=a['speech_start']-.02
        elif gi+1<len(texts):
            end=c['speech_start']+.025+(b[word_index]['offset']-b[0]['offset'])/1e7
        else:
            next_onset=placed[index+1]['speech_start'] if index+1<len(placed) else duration
            scene_end=next(s['end'] for s in plan['scenes'] if s['scene']==c['scene'])
            end=min(c['speech_end']+.65,next_onset-.04,scene_end-.05)
        captions.append(dict(id=len(captions)+1,sentence_id=c['id'],start=begin,end=end,text=wrap(text),mode='subtitle'))
    assert word_index==len(b)
assert all(c['end']>c['start'] for c in captions)
assert all(c['end']<=n['start']+1e-6 for c,n in zip(captions,captions[1:]))
assert next(c['start'] for c in captions if c['sentence_id']==19)>=a['speech_start']

srt='\n\n'.join(f"{c['id']}\n{stamp(c['start'])} --> {stamp(c['end'])}\n{c['text']}" for c in captions)+'\n'
wav.with_suffix('.srt').write_text(srt,encoding='utf-8')
ass='''[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Subtitle,Arial,44,&H004D2A20,&H004D2A20,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,0,0,5,220,140,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
'''
for c in captions:
    text=c['text'].replace('\n',r'\N')
    ass+=f"Dialogue: 0,{stamp(c['start'],True)},{stamp(c['end'],True)},Subtitle,,0,0,0,,{{\\pos(1025,978)}}{text}\n"
(WORK/'captions.ass').write_text(ass,encoding='utf-8-sig')
color='0x'+''.join(f'{n:02x}' for n in bar_color)
filter_video=f'drawbox=x=210:y=900:w=1710:h=160:color={color}:t=fill,ass=captions.ass'
print('Rendering synchronized 1080p video.',flush=True)
ff(['-y','-i',SOURCE,'-i',wav,'-map','0:v:0','-map','1:a:0','-vf',filter_video,
    '-c:v','libx264','-preset','veryfast','-crf','18','-pix_fmt','yuv420p',
    '-c:a','aac','-b:a','192k','-ar',SR,'-movflags','+faststart',
    '-metadata:s:a:0','language=eng','-metadata:s:a:0','title=English female narration - Aria',video],cwd=WORK)

style=(WORK/'voice-style-instructions.txt').read_text(encoding='utf-8')
style=re.sub(r'at approximately 110 words per minute','at a natural conversational pace',style)
style=re.sub(r'Target speaking naturally at a natural speed, with approximately 110 words per minute as a guide so the existing two-minute storyboards remain usable\.',
             'Speak at a natural pace. Do not use a words-per-minute target or stretch the audio to fill a scene.',style)
(OUT/'voice-style-instructions.txt').write_text(style,encoding='utf-8')
shutil.copy2(WORK/'narration.txt',OUT/'narration.txt')
shutil.copy2(WORK/'captions.ass',OUT/'captions.ass')
shutil.copy2(__file__,OUT/'render_voiceover.py')
report=dict(source=str(SOURCE),source_sha256=hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
    voice=VOICE,unit_1_voice='en-US-JennyNeural',engine='Existing Microsoft Edge neural speech recordings',
    reused_existing_recordings=True,new_synthesis_performed=False,
    source_voice_controls=dict(rate='-20%',pitch='-3Hz'),playback_rate=1.0,words_per_minute_target=None,
    sequence=dict(width=width,height=height,fps=fps,frames=frames,duration_seconds=duration,sample_rate=SR,channels=1),
    thinking_pause=dict(start=q['speech_end'],end=a['speech_start'],seconds=4.0),
    audition_line_occurrences=scene_texts.count(scene_texts[0]),
    loudness_normalization=stats,caption_bar_color=bar_color,
    caption_timing_source='Original synthesizer word offsets, first word anchored to measured onset; phrase end measured from audio',
    listening_review='not_performed: audio perception is unavailable',
    style_control_limitation='Existing engine recordings have fixed voice/rate/pitch and no free-form acting control.',
    transcript_review='All existing synthesizer boundary tokens match the exact approved text; no independent ASR or listening review.',
    render_command='python tmp/unit3-patient-explorer/build_output.py',
    cues=placed,captions=captions,scenes=plan['scenes'],
    outputs=dict(wav=str(wav),mp3=str(mp3),video=str(video),subtitles=str(wav.with_suffix('.srt'))))
(OUT/'production-check.json').write_text(json.dumps(report,indent=2,ensure_ascii=False),encoding='utf-8')
print(json.dumps(dict(outputs=report['outputs'],duration_seconds=duration,thinking_pause=report['thinking_pause'],playback_rate=1.0),indent=2),flush=True)
