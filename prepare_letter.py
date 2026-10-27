"""Preserve the user's letter verbatim and compile local browser input."""
from pathlib import Path
import hashlib,json

ROOT=Path(__file__).resolve().parent
source=ROOT/'xin.md'
text=source.read_text(encoding='utf-8-sig')
data=json.loads((ROOT/'ending-letter.json').read_text(encoding='utf-8'))
data.update(status='user_content_received_layout_pending',content=text,
            source='xin.md',source_sha256=hashlib.sha256(source.read_bytes()).hexdigest(),
            recipient=text.splitlines()[0],signature=text.splitlines()[-1],
            preview_policy='exact user text; automatic line wrapping only',
            line_interval_seconds='max(2.2, visual_line_character_count / 7)',
            line_fade_seconds=.4,pagination='single page, 32-36px font at 1920x1080')
(ROOT/'ending-letter.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(ROOT/'mv/letter-data.js').write_text('window.LETTER_DATA='+json.dumps(data,ensure_ascii=False)+';\n',encoding='utf-8')
timing=json.loads((ROOT/'storyboard-timing.json').read_text(encoding='utf-8'))
timing['status']='v3_sketches_approved_letter_received_animation_preview_in_progress'
timing['letter_extension']['content_source']='xin.md'
(ROOT/'storyboard-timing.json').write_text(json.dumps(timing,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
qa=json.loads((ROOT/'review/storyboard-qa.json').read_text(encoding='utf-8'))
qa['stage']='static_keyframes_approved_by_user'
(ROOT/'review/storyboard-qa.json').write_text(json.dumps(qa,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('User letter compiled without editing source text.')
