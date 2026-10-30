import difflib
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

import imageio_ffmpeg
import numpy as np

ROOT=Path(__file__).resolve().parents[2]
WORK=Path(__file__).resolve().parent
DEST=ROOT/'output/voiceovers/unit-3/microsoft-male-natural'
ASR=ROOT/'tmp/unit4-orca'
sys.path.insert(0,str(ASR/'asr-packages'))
from faster_whisper import WhisperModel


def number_words(n):
    small=['zero','one','two','three','four','five','six','seven','eight','nine','ten',
           'eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen']
    tens=['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety']
    if n<20:
        return small[n]
    if n<100:
        return tens[n//10]+(' '+small[n%10] if n%10 else '')
    if n<1000:
        return small[n//100]+' hundred'+(' '+number_words(n%100) if n%100 else '')
    if n<10000:
        return small[n//1000]+' thousand'+(' '+number_words(n%1000) if n%1000 else '')
    return str(n)


def normalize(text):
    def clock(m):
        hour=number_words(int(m[1]))
        minute=int(m[2])
        return hour+(' o clock' if minute==0 else ' oh '+number_words(minute) if minute<10 else ' '+number_words(minute))
    text=re.sub(r'(?<=\d),(?=\d{3}\b)','',text.lower())
    text=re.sub(r'\b(\d{1,2})[:.](\d{2})\b',clock,text)
    text=re.sub(r'\bkg\b','kilogram',text)
    text=re.sub(r'\d+',lambda m:number_words(int(m[0])),text)
    text=text.replace('centimetres','centimeters').replace('metres','meters')
    return re.findall(r'[a-z]+',text)


model=WhisperModel(str(ASR/'asr-models/base-en'),device='cpu',compute_type='int8',cpu_threads=4)
plan=json.loads((WORK/'generation-plan.json').read_text(encoding='utf-8'))
handoff=json.loads((DEST/'narration-handoff.json').read_text(encoding='utf-8'))
rows=[]
for part in plan['parts']:
    path=WORK/(part['id']+'.mp3')
    raw=subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(),'-nostdin','-v','error','-i',str(path),
                        '-ar','16000','-ac','1','-f','f32le','pipe:1'],check=True,capture_output=True).stdout
    mapping=next(r for r in handoff['source_to_final'] if r['id']==part['id'])
    samples=np.frombuffer(raw,dtype=np.float32)
    samples=samples[round(mapping['source_in_seconds']*16000):round(mapping['source_out_seconds']*16000)]
    segments,info=model.transcribe(samples,language='en',beam_size=5,temperature=0.0,
                                   word_timestamps=True,vad_filter=len(samples)>16000,
                                   condition_on_previous_text=False)
    segments=list(segments)
    actual=' '.join(s.text.strip() for s in segments)
    expected_words=normalize(part['text'])
    actual_words=normalize(actual)
    differences=[]
    for tag,a,b,c,d in difflib.SequenceMatcher(a=expected_words,b=actual_words,autojunk=False).get_opcodes():
        if tag!='equal':
            differences.append(dict(type=tag,expected=expected_words[a:b],recognized=actual_words[c:d]))
    row=dict(id=part['id'],expected_text=part['text'],recognized_text=actual,
             normalized_exact_match=expected_words==actual_words,differences=differences,
             segments=[dict(start=s.start,end=s.end,text=s.text,
                            words=[dict(word=w.word,start=w.start,end=w.end,probability=w.probability) for w in s.words])
                       for s in segments])
    rows.append(row)
    print(json.dumps({k:row[k] for k in ['id','recognized_text','normalized_exact_match','differences']}),flush=True)
report=dict(model='faster-whisper base.en CPU int8',scope='All seven original synthesized parts',
            all_normalized_words_match=all(r['normalized_exact_match'] for r in rows),
            normalization='Numbers and clock notation expanded to words; thousands separators removed; kg expanded; punctuation and capitalization ignored; UK unit spellings normalized.',
            source_region='Retained spoken samples only, excluding provider padding; timestamp coordinates are relative to retained samples.',
            decoder='Temperature 0.0, VAD for clips over one second, no transcription prompt.',
            listening_review='Not performed.',parts=rows)
(DEST/'transcription-check.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
(WORK/'transcription-check.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
if (DEST/'narration-handoff.json').exists():
    handoff=json.loads((DEST/'narration-handoff.json').read_text(encoding='utf-8'))
    handoff['review']['independent_transcription']=dict(all_normalized_words_match=report['all_normalized_words_match'],
                                                     report='transcription-check.json')
    (DEST/'narration-handoff.json').write_text(json.dumps(handoff,indent=2,ensure_ascii=False),encoding='utf-8')
shutil.copy2(Path(__file__),DEST/Path(__file__).name)
print('TRANSCRIPTION_SAVED',flush=True)

