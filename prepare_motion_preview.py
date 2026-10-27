"""Build a self-contained HyperFrames motion test from approved canonical assets."""
from pathlib import Path
import json,shutil,subprocess
ROOT=Path(__file__).resolve().parent
assets=ROOT/'mv/assets';assets.mkdir(exist_ok=True)
for name,src in [('character.js','character.js'),('paper.js','sketches/paper.js'),('scenes.js','sketches/scenes.js'),('revisions.js','sketches/revisions.js'),('gsap.min.js','node_modules/gsap/dist/gsap.min.js')]:
 shutil.copyfile(ROOT/src,assets/name)
shutil.copyfile(Path('C:/Windows/Fonts/msyh.ttc'),assets/'msyh.ttc')
d=json.loads((ROOT/'storyboard-timing.json').read_text('utf-8'))
start=4628/30;end=5085/30
rows=[row for row in d['lyrics'] if row['end']>start and row['start']<end]
(assets/'preview-data.js').write_text('window.PREVIEW_DATA='+json.dumps({'start':start,'end':end,'duration':end-start,'lyrics':rows},ensure_ascii=False)+';\n','utf-8')
ffmpeg=ROOT/'.conda/mv/Library/bin/ffmpeg.exe'
subprocess.run([str(ffmpeg),'-v','error','-y','-ss',str(start),'-i',str(ROOT/'song.flac'),'-t',str(end-start),'-c:a','flac',str(assets/'excerpt.flac')],check=True)
print('Built canonical assets and lossless music excerpt for 15.2333s motion test.')
