"""Build full HyperFrames inputs without changing the approved music/SRT timeline."""
from pathlib import Path
import shutil,json,re
r=Path(__file__).resolve().parent;a=r/'mv/assets';a.mkdir(exist_ok=True)
for name,src in [('character.js','character.js'),('paper.js','sketches/paper.js'),('scenes.js','sketches/scenes.js'),('revisions.js','sketches/revisions.js'),('gsap.min.js','node_modules/gsap/dist/gsap.min.js'),('song.flac','song.flac')]:shutil.copyfile(r/src,a/name)
shutil.copyfile('C:/Windows/Fonts/msyh.ttc',a/'msyh.ttc')
d=json.loads((r/'storyboard-timing.json').read_text('utf-8'));letter=json.loads((r/'ending-letter.json').read_text('utf-8'))
assert letter['planned_video_end_frame']==9309
trans=[]
for line in (r/'storyboard.md').read_text('utf-8').splitlines():
 if re.match(r'\| T\d\d ',line):
  col=[c.strip() for c in line.split('|')[1:-1]]
  trans.append({'name':col[0],'duration_frames':int(re.match(r'(\d+)',col[2])[1]),'medium':col[3]})
assert len(trans)==48
data={'timeline':d['timeline'],'lyrics':d['lyrics'],'transitions':trans,'duration':310.3,'fps':30,'letter':letter}
(a/'full-data.js').write_text('window.MV_DATA='+json.dumps(data,ensure_ascii=False)+';\n','utf-8')
p=r/'mv/index.html';backup=r/'mv/motion-test.html.bak'
if not backup.exists():shutil.copyfile(p,backup)
shutil.copyfile(r/'mv/full-index.template.txt',p)
print('Full data: 48 music shots, 43 original lyric cues, 310.3 seconds.')
