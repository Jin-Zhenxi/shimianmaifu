"""Restore the original audio, verify the encoded file and extract review evidence."""
from pathlib import Path
import hashlib,json,subprocess,re
import numpy as np
from PIL import Image,ImageDraw,ImageFont

r=Path(__file__).resolve().parent
bin_dir=r/'.conda/mv/Library/bin';ff=str(bin_dir/'ffmpeg.exe');fp=str(bin_dir/'ffprobe.exe')
raw=r/'review/mv-r1-render.mp4';out=r/'mv-r1.mp4';duration=310.3
if out.exists():raise RuntimeError('mv-r1.mp4 already exists; preserve existing revision')
def run(args):return subprocess.run(args,check=True,capture_output=True)
# Match the coded paper reveal against the outgoing decoded frame. This finishing
# wipe runs in-place in time, never extends the film or delays the letter schedule.
edge=r/'review/letter-entry-outgoing.png'
run([ff,'-v','error','-y','-ss',str(5658/30),'-i',str(raw),'-frames:v','1',str(edge)])
wipe=("[0:v]split=3[before][entry][after];"
      "[before]trim=end_frame=5659,setpts=PTS-STARTPTS[p0];"
      "[entry]trim=start_frame=5659:end_frame=5683,setpts=PTS-STARTPTS[p1];"
      "[after]trim=start_frame=5683:end_frame=9309,setpts=PTS-STARTPTS[p2];"
      "[2:v]fps=30,trim=end_frame=24,setpts=PTS-STARTPTS[old];"
      "[p1][old]blend=all_expr='if(gt(X,W*max(0,N-1)/23),B,A)'[middle];"
      "[p0][middle][p2]concat=n=3:v=1:a=0[picture]")
run([ff,'-v','error','-y','-i',str(raw),'-i',str(r/'song.flac'),'-loop','1','-i',str(edge),'-filter_complex',wipe,'-map','[picture]','-map','1:a:0','-c:v','libx264','-preset','fast','-crf','17','-pix_fmt','yuv420p','-c:a','aac','-b:a','320k','-ar','48000','-af','apad','-t',str(duration),'-movflags','+faststart',str(out)])
meta=json.loads(run([fp,'-v','error','-show_streams','-show_format','-of','json',str(out)]).stdout)
video=next(s for s in meta['streams'] if s['codec_type']=='video')
assert video['width']==1920 and video['height']==1080 and video['r_frame_rate']=='30/1'
assert int(video['nb_frames'])==9309 and abs(float(meta['format']['duration'])-duration)<.04
# Compare decoded song and encoded video over a stable 10-second music window.
def pcm(source,start,length):return np.frombuffer(run([ff,'-v','error','-ss',str(start),'-i',str(source),'-t',str(length),'-vn','-ac','1','-ar','8000','-f','f32le','-']).stdout,dtype=np.float32)
a=pcm(r/'song.flac',30,10);b=pcm(out,30,10);n=min(len(a),len(b));a=a[:n];b=b[:n]
from scipy.signal import correlate,correlation_lags
c=correlate(b,a,mode='full',method='fft');lags=correlation_lags(len(b),len(a));ok=np.abs(lags)<=1600;lag=int(lags[ok][np.argmax(c[ok])]);gain=20*np.log10(np.sqrt(np.mean(b*b))/np.sqrt(np.mean(a*a)))
silence=pcm(out,240,5);assert np.max(np.abs(silence))<1e-5
assert abs(lag)/8000<=1/30 and abs(gain)<1
data=json.loads((r/'storyboard-timing.json').read_text('utf-8'));items=[(s['id'],(s['start_frame']+s['end_frame'])/60) for s in data['timeline']]
items += [('letter-audio-end',232.133492),('letter-complete',281),('last-frame',310.266667)]
directory=r/'review/r1-decoded';directory.mkdir(exist_ok=True)
frames=[]
for name,t in items:
 target=directory/(name+'.png');run([ff,'-v','error','-y','-ss',str(t),'-i',str(out),'-frames:v','1',str(target)]);frames.append((name,t,target))
font=ImageFont.truetype('C:/Windows/Fonts/msyh.ttc',20)
for base in range(0,len(frames),18):
 batch=frames[base:base+18];sheet=Image.new('RGB',(1920,((len(batch)+2)//3)*395),'#eee4cf');draw=ImageDraw.Draw(sheet)
 for i,(name,t,p)in enumerate(batch):
  x=i%3*640;y=i//3*395
  with Image.open(p)as pic:sheet.paste(pic.resize((640,360)),(x,y))
  draw.text((x+10,y+364),f'{name} / {t:.2f}s',font=font,fill='#344d56')
 sheet.save(r/f'review/r1-decoded-page-{base//18+1:02d}.jpg',quality=90)
# The encoded freeze can vary slightly with inter-frame compression; compare pixels.
f1=np.asarray(Image.open(directory/'letter-complete.png').convert('RGB'),dtype=float);f2=np.asarray(Image.open(directory/'last-frame.png').convert('RGB'),dtype=float)
hold_mae=float(np.mean(np.abs(f1-f2)));assert hold_mae<1.5
qa={'output':'mv-r1.mp4','duration_seconds':float(meta['format']['duration']),'width':1920,'height':1080,'fps':30,'frames':9309,'bytes':out.stat().st_size,'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'source_audio':'song.flac','audio_window_gain_difference_db':float(gain),'audio_offset_ms':lag/8,'post_music_silence_peak':float(np.max(np.abs(silence))),'final_hold_pixel_mae':hold_mae,'decoded_shot_samples':len(frames),'lyrics_srt_sha256':hashlib.sha256((r/'lyrics.srt').read_bytes()).hexdigest(),'letter_source_sha256':hashlib.sha256((r/'xin.md').read_bytes()).hexdigest(),'lyric_timing_ear_checked':False}
(r/'review/r1-qa.json').write_text(json.dumps(qa,ensure_ascii=False,indent=2)+'\n','utf-8')
print(json.dumps(qa,ensure_ascii=True,indent=2),flush=True)
