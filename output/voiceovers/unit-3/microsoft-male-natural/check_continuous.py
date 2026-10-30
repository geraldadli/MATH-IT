import difflib
import json
import re
import subprocess
import sys
from pathlib import Path

import imageio_ffmpeg
import numpy as np

ROOT=Path(__file__).resolve().parents[2]
WORK=Path(__file__).resolve().parent
DEST=ROOT/'output/voiceovers/unit-3/microsoft-male-natural'
sys.path.insert(0,str(ROOT/'tmp/unit4-orca/asr-packages'))
from faster_whisper import WhisperModel


def numbers(n):
    small=['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven',
           'twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen']
    tens=['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety']
    if n<20:return small[n]
    if n<100:return tens[n//10]+(' '+small[n%10] if n%10 else '')
    if n<1000:return small[n//100]+' hundred'+(' '+numbers(n%100) if n%100 else '')
    if n<10000:return small[n//1000]+' thousand'+(' '+numbers(n%1000) if n%1000 else '')
    return str(n)


def normalize(s):
    def clock(m):
        minute=int(m[2])
        return numbers(int(m[1]))+(' o clock' if minute==0 else ' oh '+numbers(minute) if minute<10 else ' '+numbers(minute))
    s=re.sub(r'(?<=\d),(?=\d{3}\b)','',s.lower())
    s=re.sub(r'\b(\d{1,2})[:.](\d{2})\b',clock,s)
    s=re.sub(r'\bkg\b','kilogram',s)
    s=re.sub(r'\d+',lambda m:numbers(int(m[0])),s)
    s=s.replace('centimetres','centimeters').replace('metres','meters')
    return re.findall('[a-z]+',s)


model=WhisperModel(str(ROOT/'tmp/unit4-orca/asr-models/base-en'),device='cpu',compute_type='int8',cpu_threads=4)
handoff=json.loads((DEST/'narration-handoff.json').read_text(encoding='utf-8'))
path=DEST/handoff['editions']['Continuous']['wav']
raw=subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(),'-nostdin','-v','error','-i',str(path),
                    '-ar','16000','-ac','1','-f','f32le','pipe:1'],capture_output=True,check=True).stdout
segments,info=model.transcribe(np.frombuffer(raw,dtype=np.float32),language='en',beam_size=5,
                               temperature=0.0,word_timestamps=True,vad_filter=True,
                               condition_on_previous_text=False)
segments=list(segments)
actual=' '.join(s.text.strip() for s in segments)
expected=(DEST/'narration.txt').read_text(encoding='utf-8')
a,b=normalize(expected),normalize(actual)
differences=[]
for tag,i,j,k,l in difflib.SequenceMatcher(a=a,b=b,autojunk=False).get_opcodes():
    if tag!='equal':differences.append(dict(type=tag,expected=a[i:j],recognized=b[k:l]))
report=dict(model='faster-whisper base.en CPU int8',scope='Final continuous WAV, all spoken material',
            recognized_text=actual,normalized_exact_match=a==b,differences=differences,
            normalization='Numbers and clock notation expanded; kg expanded; punctuation and case ignored.',
            listening_review='Not performed.',
            segments=[dict(start=s.start,end=s.end,text=s.text,
                           words=[dict(word=w.word,start=w.start,end=w.end,probability=w.probability) for w in s.words])
                      for s in segments])
(DEST/'continuous-transcription-check.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps({k:report[k] for k in ['recognized_text','normalized_exact_match','differences']},indent=2),flush=True)

