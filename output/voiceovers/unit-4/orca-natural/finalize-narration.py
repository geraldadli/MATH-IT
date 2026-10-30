import hashlib
import json
import shutil
import subprocess
import wave
from pathlib import Path

import imageio_ffmpeg
import numpy as np

WORK=Path(__file__).resolve().parent
DEST=WORK if (WORK/'source-original.mp3').exists() else WORK.parent.parent/'output'/'voiceovers'/'unit-4'/'orca-natural'
RATE=48000
FFMPEG=imageio_ffmpeg.get_ffmpeg_exe()
PREFIX='Unit 4 - Curious Chart Guide - Natural'

def ffmpeg(args):
    return subprocess.run([FFMPEG,'-nostdin','-hide_banner','-nostats',*map(str,args)],check=True,capture_output=True)

def loudness(path):
    result=ffmpeg(['-i',path,'-af','loudnorm=I=-16:TP=-1.5:LRA=7:print_format=json','-f','null','-'])
    log=result.stderr.decode('utf-8',errors='replace')
    return json.JSONDecoder().raw_decode(log[log.rfind('{'):])[0]

source_audio=WORK/'source-original.mp3' if (WORK/'source-original.mp3').exists() else WORK/'narration-original.wav'
audio=np.frombuffer(ffmpeg(['-v','error','-i',source_audio,'-ar',RATE,'-ac','1','-f','f32le','pipe:1']).stdout,dtype=np.float32)
edit=json.loads((WORK/'pause-edit.json').read_text(encoding='utf-8'))
start=round(edit['source_pause_start']*RATE)
end=round(edit['source_pause_end']*RATE)
assert 0<start<end<len(audio)
left=audio[:start].copy()
right=audio[end:].copy()
# Fade only the quiet boundary handles, preserving every spoken sample.
fade=round(.005*RATE)
assert np.max(np.abs(left[-fade:]))<.01
assert np.max(np.abs(right[:fade]))<.01
left[-fade:]*=np.linspace(1,0,fade)
right[:fade]*=np.linspace(0,1,fade)
prepared=np.concatenate([left,np.zeros(4*RATE,dtype=np.float32),right])
raw=WORK/'narration-prepared.wav'
with wave.open(str(raw),'wb') as f:
    f.setnchannels(1)
    f.setsampwidth(2)
    f.setframerate(RATE)
    f.writeframes((np.clip(prepared,-1,1)*32767).astype(np.int16).tobytes())
before=loudness(raw)
gain=min(-16-float(before['input_i']),-1.5-float(before['input_tp']))
wav=DEST/f'{PREFIX}.wav'
mp3=DEST/f'{PREFIX}.mp3'
ffmpeg(['-v','error','-y','-i',raw,'-af',f'volume={gain:.6f}dB','-ar',RATE,'-ac','1','-c:a','pcm_s16le',wav])
ffmpeg(['-v','error','-y','-i',wav,'-c:a','libmp3lame','-b:a','192k',mp3])
after=loudness(wav)
with wave.open(str(wav),'rb') as f:
    final=np.frombuffer(f.readframes(f.getnframes()),dtype=np.int16)
    assert f.getframerate()==RATE and f.getnchannels()==1
assert len(final)==len(prepared)
assert np.max(np.abs(final[start:start+4*RATE].astype(np.int32)))==0
assert len(final[start:start+4*RATE])==4*RATE
assert float(after['input_tp'])<=-1.45
ffmpeg(['-v','error','-i',mp3,'-f','null','-'])
meta=json.loads((WORK/'source-metadata.json').read_text(encoding='utf-8'))
delta=4-(end-start)/RATE
mapping=[{'source_in':0,'source_out':start/RATE,'final_in':0,'final_out':start/RATE,'playback_speed':1.0},
         {'source_in':end/RATE,'source_out':len(audio)/RATE,'final_in':start/RATE+4,'final_out':len(final)/RATE,'playback_speed':1.0}]
report={'voice':'Mike','voice_id':meta['request']['voiceId'],'engine_requested':'orca','engine_returned':meta['result']['engine'],
        'request_id':meta['result']['request_id'],'synthesis_speed':1.0,'playback_speed':1.0,'target_words_per_minute':None,
        'source_duration_seconds':len(audio)/RATE,'final_duration_seconds':len(final)/RATE,
        'thinking_pause':{'start':start/RATE,'end':start/RATE+4,'duration_seconds':4,'zero_pcm_samples':4*RATE},
        'constant_gain_db':gain,'integrated_loudness_lufs':float(after['input_i']),'true_peak_dbtp':float(after['input_tp']),
        'source_to_final':mapping,'post_pause_time_shift_seconds':delta,'source_sha256':hashlib.sha256((DEST/'source-original.mp3').read_bytes()).hexdigest(),
        'wav_sha256':hashlib.sha256(wav.read_bytes()).hexdigest(),'wav':wav.name,'mp3':mp3.name,
        'review':{'listening_review':'not_performed','pause_waveform_review':'performed','decode':'passed','independent_asr':'See transcription-check.json',
                  'returned_timestamps':'Not used for editing because they did not match the decoded waveform.',
                  'style':'The connected tool has no free-form style field. Directions are retained separately.'}}
(DEST/'narration-handoff.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
for name in ['transcription-check.json','pause-edit.json','source-metadata.json','finalize-narration.py']:
    source_file=WORK/name
    if source_file.resolve() != (DEST/name).resolve():
        shutil.copy2(source_file,DEST/name)
print(json.dumps(report,indent=2),flush=True)
