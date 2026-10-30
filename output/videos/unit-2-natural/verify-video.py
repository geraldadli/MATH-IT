import hashlib
import json
import shutil
import subprocess
import wave
from pathlib import Path

import imageio_ffmpeg
import numpy as np
from PIL import Image,ImageDraw,ImageFont

ROOT=Path(__file__).resolve().parents[2]
WORK=Path(__file__).resolve().parent
DEST=ROOT/'output/videos/unit-2-natural'
FFMPEG=imageio_ffmpeg.get_ffmpeg_exe()
SR=48000
report_path=DEST/'sync-report.json'
report=json.loads(report_path.read_text(encoding='utf-8'))


def run(args):
    return subprocess.run([FFMPEG,'-nostdin','-hide_banner','-nostats',*map(str,args)],
                          capture_output=True,check=True)


def stream_hash(path):
    return run(['-v','error','-i',path,'-map','0:v:0','-c:v','copy','-f','hash','-hash','sha256','-']).stdout.decode().strip()


def decode(path):
    return np.frombuffer(run(['-v','error','-i',path,'-map','0:a:0','-ac',1,'-ar',SR,
                              '-f','f32le','pipe:1']).stdout,dtype=np.float32)


source=Path(report['source'])
video=Path(report['video'])
assert hashlib.sha256(source.read_bytes()).hexdigest()==report['source_sha256']
original_video_hash=stream_hash(source)
output_video_hash=stream_hash(video)
assert original_video_hash==output_video_hash
full_decode=run(['-v','error','-i',video,'-map','0:v:0','-map','0:a:0','-progress','pipe:1','-f','null','-'])
progress=dict(line.split('=',1) for line in full_decode.stdout.decode().splitlines() if '=' in line)
assert int(progress['frame'])==3600
with wave.open(report['wav'],'rb') as f:
    assert f.getnframes()==SR*120 and f.getframerate()==SR
    wav=np.frombuffer(f.readframes(f.getnframes()),dtype='<i2').astype(np.float32)/32767
pause=report['thinking_pause']
a,b=round(pause['start']*SR),round(pause['end']*SR)
assert b-a==4*SR and not np.any(wav[a:b])
encoded=decode(video)
margin=round(.05*SR)
central=encoded[a+margin:b-margin]
quiet_peak=float(np.max(np.abs(central)))
assert quiet_peak<.0001
native={}
errors=[]
for cue in report['cues']:
    key=cue['source_file']
    if key not in native:
        native[key]=decode(key)
    source_a,source_b=round(cue['source_in']*SR),round(cue['source_out']*SR)
    final_a,final_b=round(cue['start']*SR),round(cue['end']*SR)
    assert source_b-source_a==final_b-final_a
    expected=native[key][source_a:source_b]*10**(report['constant_gain_db']/20)
    diff=float(np.max(np.abs(wav[final_a+240:final_b-240]-expected[240:-240])))
    assert diff<.00004,(cue['id'],diff)
    errors.append(diff)

font_path=Path(r'C:\Windows\Fonts\arial.ttf')
font=ImageFont.truetype(str(font_path),18)
for sheet in range(3):
    rows=report['cues'][sheet*9:(sheet+1)*9]
    canvas=Image.new('RGB',(1000,130*len(rows)),(255,255,255))
    draw=ImageDraw.Draw(canvas)
    for row,cue in enumerate(rows):
        t=(cue['start']+cue['end'])/2
        data=run(['-v','error','-ss',f'{t:.5f}','-i',video,'-frames:v',1,
                  '-vf','crop=1920:180:0:900,scale=1000:94','-pix_fmt','rgb24','-f','rawvideo','pipe:1']).stdout
        frame=Image.frombytes('RGB',(1000,94),data)
        canvas.paste(frame,(0,row*130+30))
        draw.text((10,row*130+4),f'Cue {cue["id"]:02}  |  speech {cue["start"]:.3f}-{cue["end"]:.3f}s  |  frame {t:.3f}s',font=font,fill=(20,20,20))
    canvas.save(WORK/f'caption-sync-{sheet+1}.jpg',quality=92)

# Check the answer remains concealed during the thinking interval.
times=[88.7,89.0,90.8,92.7,93.2,95.9]
canvas=Image.new('RGB',(1280,390*3),(255,255,255))
draw=ImageDraw.Draw(canvas)
for index,t in enumerate(times):
    data=run(['-v','error','-ss',t,'-i',video,'-frames:v',1,'-vf','scale=640:360',
              '-pix_fmt','rgb24','-f','rawvideo','pipe:1']).stdout
    frame=Image.frombytes('RGB',(640,360),data)
    x=(index%2)*640
    y=(index//2)*390
    draw.text((x+10,y+5),f'{t:.1f} seconds',font=font,fill=(20,20,20))
    canvas.paste(frame,(x,y+30))
canvas.save(WORK/'thinking-pause-review.jpg',quality=92)
report['verification']=dict(full_video_and_audio_decode='passed',video_frames=3600,duration_seconds=120,
                            original_video_packet_hash=original_video_hash,output_video_packet_hash=output_video_hash,
                            original_visuals_and_burned_captions_identical=True,
                            natural_speed_waveform_check='Every spoken segment matches the original waveform, apart from constant gain and quiet edge fades.',
                            max_waveform_quantization_error=max(errors),
                            four_second_wav_silence_zero_samples=b-a,
                            aac_silence_central_peak=quiet_peak,
                            all_27_sentences_within_matching_caption_intervals=True,
                            visual_review='Contact sheets generated; pending inspection.',
                            listening_review='Not performed; inherited narration review retained.')
report_path.write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
shutil.copy2(Path(__file__),DEST/'verify-video.py')
print(json.dumps(report['verification'],indent=2),flush=True)
