import difflib
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WORK = Path(__file__).resolve().parent
DEST = ROOT/'output/voiceovers/unit-2/microsoft-natural'
ASR = ROOT/'tmp/unit4-orca'
sys.path.insert(0, str(ASR/'asr-packages'))
from faster_whisper import WhisperModel
import imageio_ffmpeg
import numpy as np


def number_words(number):
    small = ['zero','one','two','three','four','five','six','seven','eight','nine','ten',
             'eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen']
    tens = ['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety']
    if number < 20:
        return small[number]
    if number < 100:
        return tens[number//10] + (' '+small[number%10] if number%10 else '')
    return str(number)


def normalize(text):
    text = re.sub(r'\d+', lambda m:number_words(int(m[0])), text.lower())
    return re.findall(r'[a-z]+', text)


model = WhisperModel(str(ASR/'asr-models/base-en'), device='cpu', compute_type='int8', cpu_threads=4)
parts = json.loads((WORK/'generation-plan.json').read_text(encoding='utf-8'))
rows = []
for part in parts:
    path = WORK/(part['id']+'.mp3')
    decoded = subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(),'-nostdin','-v','error','-i',str(path),
                              '-ar','16000','-ac','1','-f','f32le','pipe:1'], check=True,capture_output=True).stdout
    segments, info = model.transcribe(np.frombuffer(decoded,dtype=np.float32),language='en',beam_size=5,
                                      word_timestamps=True,vad_filter=False,condition_on_previous_text=False)
    segments = list(segments)
    actual = ' '.join(s.text.strip() for s in segments)
    expected_words = normalize(part['text'])
    actual_words = normalize(actual)
    differences = []
    for tag,a,b,c,d in difflib.SequenceMatcher(a=expected_words,b=actual_words,autojunk=False).get_opcodes():
        if tag != 'equal':
            differences.append(dict(type=tag, expected=expected_words[a:b], recognized=actual_words[c:d]))
    row = dict(id=part['id'], expected_text=part['text'], recognized_text=actual,
               normalized_exact_match=expected_words==actual_words, differences=differences,
               segments=[dict(start=s.start,end=s.end,text=s.text,
                              words=[dict(word=w.word,start=w.start,end=w.end,probability=w.probability)
                                     for w in s.words]) for s in segments])
    rows.append(row)
    print(json.dumps({key:row[key] for key in ['id','recognized_text','normalized_exact_match','differences']}),flush=True)
report = dict(model='faster-whisper base.en, CPU int8',scope='Every original synthesized segment',
              all_normalized_words_match=all(row['normalized_exact_match'] for row in rows),
              normalization='Numbers converted to words; capitalization and punctuation ignored.',
              limitation='Independent ASR check, not a listening review.',parts=rows)
WORK.joinpath('transcription-check.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
if DEST.exists():
    DEST.joinpath('transcription-check.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print('TRANSCRIPTION_SAVED',flush=True)
