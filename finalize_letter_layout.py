from pathlib import Path
import json,hashlib
from PIL import Image,ImageDraw,ImageFont
r=Path(__file__).resolve().parent
layout=json.loads((r/'review/letter-layout.json').read_text('utf-8'))
data=json.loads((r/'ending-letter.json').read_text('utf-8'))
assert data['content']==(r/'xin.md').read_text('utf-8-sig')
assert layout['text_roundtrip'] and layout['final_hold_identical_pixels']
data.update(status='user_text_integrated_layout_verified',visual_lines=layout['rows'],
 font_size_px=layout['size'],last_line_fully_visible_seconds=layout['last_line_fully_visible'],
 final_hold_start_seconds=layout['hold_start'],planned_video_duration_seconds=layout['duration'],
 planned_video_end_frame=layout['end_frame'])
(r/'ending-letter.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n','utf-8')
d=json.loads((r/'storyboard-timing.json').read_text('utf-8'))
d['duration_video']=layout['duration'];d['letter_extension'].update(end_frame=layout['end_frame'],last_line_fully_visible_seconds=layout['last_line_fully_visible'],hold_start_seconds=layout['hold_start'])
d['validated']['final_video_duration_locked']=True
(r/'storyboard-timing.json').write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n','utf-8')
doc=f'''# 片尾信件：正文已接入

用户于草图v3通过后提供`xin.md`。文件原文完整保留，称呼和署名均使用用户原文；没有纠错、润色或补写。配置见`ending-letter.json`，浏览器预览见`mv/letter-preview.html`。

- 1920×1080，单页暖白信纸；36px字体，共{len(layout['rows'])}行，不分页，不滚走早期文字。
- 03:08.633进入信纸；逐行淡入0.4秒，行间隔按每秒7字符估算，最少2.2秒。
- 原曲完整播放到03:52.133；其后继续显现尚未显示的行，不循环音乐。
- 全文于{layout['last_line_fully_visible']:.3f}秒（约04:40.3）显示完毕。
- 全文出现且歌曲结束后，画面完全静止30秒；计划片长{layout['duration']:.3f}秒（05:10.3），30fps共{layout['end_frame']}帧。
- 逐行拼回原文的校验通过；阅读停留起点后与最后一帧逐像素一致。

该片长是当前信件版式的计划长度，尚未生成整片。正文或字号改变时运行prepare_letter.py、review_letter.mjs、finalize_letter_layout.py重新计算。
'''
(r/'ending-letter.md').write_text(doc,'utf-8')
p=r/'README.md';text=p.read_text('utf-8');text=text.replace('正文尚未提供，ending-letter.json保持空内容，最终片长待正文确定。','正文已由xin.md提供，原文接入单页逐行显现；计划片长310.3秒，见ending-letter.md。');text=text.replace('等待修订草图确认。没有启动HyperFrames整片工程或MV渲染。','用户已确认草图v3。已建立mv/中的HyperFrames L41–E1动作测试工程（15.233秒），整片尚未渲染。');p.write_text(text,'utf-8')
for target in ['storyboard.md','song.md']:
 p=r/target;text=p.read_text('utf-8');marker='\n## 信件正文接入（草图v3通过后）\n';text=text.split(marker)[0]+marker+'\n用户已确认草图v3，并提供xin.md。正文不改写；单页36px、18行，03:08.633开始逐行显现，约04:40.3全文显示，静止30秒后于05:10.3结束。详细时间和版式以ending-letter.json及ending-letter.md为准；此处更新取代先前“正文待提供／片长待定”的状态。\n';p.write_text(text,'utf-8')
print('Letter schedule and documentation synchronized; source text unchanged.')
