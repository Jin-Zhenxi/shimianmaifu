"""Browser-render keyframe sketches and build review contact sheets (no video)."""
from pathlib import Path
import argparse
import base64,hashlib,html,json,re,subprocess,time
from PIL import Image,ImageDraw,ImageFont,ImageStat

ROOT=Path(__file__).resolve().parent
parser=argparse.ArgumentParser()
parser.add_argument('--only',nargs='*')
args=parser.parse_args()
OUT=ROOT/'sketches';REVIEW=ROOT/'review'
OUT.mkdir(exist_ok=True);REVIEW.mkdir(exist_ok=True)
d=json.loads((ROOT/'storyboard-timing.json').read_text(encoding='utf-8'))
lyrics={f"L{r['id']:02d}":r for r in d['lyrics']}
timeline=d['timeline']+[{'id':'E5','start_frame':6964,'end_frame':None}]
shots=[]
for i,t in enumerate(timeline,1):
    sid=t['id'];raw=lyrics.get(sid,{})
    shots.append({**t,'number':i,'filename':f'{i:02d}-{sid}.png','caption':raw.get('text',{'I1':'间奏：建立站台位置','E1':'错过后收回钳子','E2':'原来都在同一个街区','E3':'墙两侧的无意识错过','E4':'信纸展开，正文暂空','E5':'曲终继续显字，全文后停留30秒'}[sid] if sid not in lyrics else '')})

main_count=len(shots)
search=next(r for r in shots if r['id']=='L23')
extras=[{**search,'id':f'L23-{phase}','number':f'24{phase.lower()}',
         'filename':f'24{phase.lower()}-L23-{phase}.png','caption':caption,'supplemental':True,
         'same_shot_as':'L23'} for phase,caption in [
         ('A','全城寻找·过程A：邮局街区'),('B','全城寻找·过程B：站口折返'),('C','全城寻找·过程C：另一街区继续找')]]
pos=shots.index(search)+1
shots[pos:pos]=extras
for row in shots:
    if row['id']=='E2':row['caption']='夜色分岔路：背道而驰'
    if row['id']=='E3':row['caption']='各自走远，距离继续拉开'

chrome=r'C:/Program Files/Google/Chrome/Application/chrome.exe'
profile=ROOT/'.cache/chrome-storyboard-sketches';profile.mkdir(parents=True,exist_ok=True)
selected=[r for r in shots if not args.only or r['id'] in args.only or r['id'].split('-')[0] in args.only]
for begin in range(0,len(selected),7):
    batch=selected[begin:begin+7];ids=','.join(r['id'] for r in batch)
    cmd=[chrome,'--headless=new','--no-first-run','--no-default-browser-check','--no-sandbox',
         '--disable-gpu-sandbox','--in-process-gpu','--disable-background-networking','--disable-component-update',
         '--allow-file-access-from-files','--force-device-scale-factor=1','--window-size=1920,1080',
         '--user-data-dir='+str(profile),'--virtual-time-budget=20000','--dump-dom',
         (OUT/'index.html').as_uri()+'?ids='+ids]
    print(f'Rendering keyframes {begin+1}-{begin+len(batch)} / {len(shots)}',flush=True)
    r=subprocess.run(cmd,capture_output=True,timeout=120)
    dom=r.stdout.decode('utf-8',errors='replace')
    (ROOT/f'.cache/sketch-batch-{begin//7:02d}.log').write_text(r.stderr.decode('utf-8',errors='replace'),encoding='utf-8')
    match=re.search(r'<script[^>]*id="artifacts"[^>]*>(.*?)</script>',dom,re.S)
    if r.returncode or not match or 'data-ready="true"' not in dom:
        (ROOT/'.cache/sketch-error.html').write_text(dom,encoding='utf-8')
        raise RuntimeError('Browser keyframe capture failed; inspect .cache/sketch-error.html')
    artifacts=json.loads(html.unescape(match.group(1)))
    assert [a['id'] for a in artifacts]==[s['id'] for s in batch]
    for item,shot in zip(artifacts,batch):
        target=OUT/shot['filename'];target.write_bytes(base64.b64decode(item['png'].split(',',1)[1]))
        with Image.open(target) as im:
            assert im.size==(1920,1080)
            # Letter previews are intentionally mostly empty; do not invent words
            # just to satisfy an image-variance heuristic.
            assert max(ImageStat.Stat(im.convert('RGB')).stddev)>(5 if shot['id'] in ('E4','E5') else 15)
        shot['sha256']=hashlib.sha256(target.read_bytes()).hexdigest()
    print(f'Saved {len(batch)} full-resolution PNGs',flush=True)

for shot in shots:
    shot['sha256']=hashlib.sha256((OUT/shot['filename']).read_bytes()).hexdigest()

def font(size):return ImageFont.truetype('C:/Windows/Fonts/msyh.ttc',size)
def clock(t):
    if t is None:return '待正文确定'
    m,s=divmod(t,60);return f'{int(m):02}:{s:05.2f}'
def wrapped(draw,text,f,width):
    result=[];line=''
    for c in text:
        if draw.textlength(line+c,font=f)>width:result.append(line);line=c
        else:line+=c
    if line:result.append(line)
    return result
def sheet(items,path,cols=4,width=480,title='分镜关键帧草图 · 等待草图确认'):
    pad=18;h=round(width*9/16);label=104;head=108;rows=(len(items)+cols-1)//cols
    im=Image.new('RGB',(pad+cols*(width+pad),head+pad+rows*(h+label+pad)), '#eee4cf')
    dr=ImageDraw.Draw(im);f=font(23 if width<600 else 27);small=font(20 if width<600 else 24)
    dr.text((pad,15),title,fill='#485c4d',font=font(33));dr.text((pad,62),'纸艺拼贴 / 统一 character.js / 静态关键帧，不代表连续动作已验收',fill='#8a876f',font=small)
    for i,item in enumerate(items):
        x=pad+(i%cols)*(width+pad);y=head+pad+(i//cols)*(h+label+pad)
        with Image.open(OUT/item['filename']) as pic:im.paste(pic.resize((width,h),Image.Resampling.LANCZOS),(x,y))
        start=item['start_frame']/30;end=None if item['end_frame'] is None else item['end_frame']/30
        titleline=f"{item['id']}  {clock(start)}–{clock(end)}"
        dr.text((x+5,y+h+7),titleline,fill='#426150',font=f)
        for j,line in enumerate(wrapped(dr,item['caption'],small,width-12)[:2]):dr.text((x+5,y+h+42+j*(small.size+4)),line,fill='#796c56',font=small)
    im.save(path)
sheet(shots,ROOT/'storyboard.png')
for p in range(0,len(shots),18):sheet(shots[p:p+18],REVIEW/f'storyboard-page-{p//18+1:02d}.png',cols=3,width=640,title=f'分镜草图 / 第{p//18+1}页')
highlight_ids=['L23-A','L23-B','L23-C','L39','L40','L41','L42','L43','E2','E3','L17','L25']
byid={r['id']:r for r in shots};sheet([byid[k] for k in highlight_ids],ROOT/'storyboard-highlights.png',cols=3,width=640,title='分镜修订重点 / 全城找寻、1000天、缘尽错过与夜色')
sheet([byid[k] for k in highlight_ids],ROOT/'storyboard-revisions.png',cols=3,width=640,title='本轮修订 / L23、L39–43、E2–3与夜景')
manifest={'stage':'keyframe_sketch_review_pending','source_storyboard':'storyboard.md v3','source_srt_unchanged':True,'width':1920,'height':1080,'character_module':'character.js','letter_content_present':False,'shots':shots,'total_images':len(shots),'main_keyframes':main_count,'supplemental_keyframes':3,'final_video_duration_locked':False}
(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
print(f'Finished {len(shots)} sketches, storyboard.png, highlights and 3 review pages.',flush=True)
