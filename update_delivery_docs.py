from pathlib import Path
import json
r=Path(__file__).resolve().parent
qa=json.loads((r/'review/r1-qa.json').read_text('utf-8'))
p=r/'README.md';s=p.read_text('utf-8').replace('Puppeteer尚未安装，不影响音频分析。','Puppeteer、GSAP与HyperFrames现已安装，Node已升级至22.23.4；无头Chrome152已可调用。').replace('## ???????','## 转场与全片导出')
s+='\n## 首版全片 mv-r1.mp4\n\n用户已授权导出。首版为1920×1080、30fps、310.3秒（9309帧），歌曲完整播放，曲终后保留信件阅读；最后30秒静止。所有角色继续统一调用character.js。最终检查见review/r1-qa.json，解码接触表见review/r1-decoded-page-*.jpg。字幕仍为原机器时间轴，尚未逐句听校；后续按用户看片反馈迭代。\n'
p.write_text(s,'utf-8')
(r/'mv/README.md').write_text('''# HyperFrames 全片工程

`index.html`现为310.3秒整片，1920×1080、30fps。入口加载`assets/full-data.js`、`actor-tracks.js`与`full-engine.js`；角色唯一编辑源是根目录`character.js`，构建时复制到assets。

根目录`mv-r1.mp4`为封回原音轨的首版。`review/mv-r1-render.mp4`是HyperFrames中间输出，不作为最终交付。FFmpeg完成原音轨封装、曲终静音与0.8秒信纸入场遮挡修整，均不增加片长。旧15秒测试入口保存在motion-test.html.bak，仅作历史记录。

在项目根目录运行`npx hyperframes preview ./mv --port 3017`可预览完整时间轴。重建输入运行`.\\.conda\\mv\\python.exe prepare_full_mv.py`。`render-full.ps1`记录当前导出方式，最终文件存在时不会覆盖旧版；下一版应使用r2名称。

正文使用xin.md原文；03:08.633开始逐行显现、04:40.3全文显示、05:10.3结束。最后30秒静止及逐行淡入来自用户要求，覆盖辅助动画Skill的默认持续运动／禁止单独淡入建议。

详细验证见review/r1-qa.json，制作取舍与已知限制见review/r1-production-notes.md。歌词机器时间轴未逐句听校。
''','utf-8')
d=json.loads((r/'storyboard-timing.json').read_text('utf-8'));d['status']='full_r1_exported_for_user_review';(r/'storyboard-timing.json').write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n','utf-8')
p=r/'review/transition-plan-qa.json';d=json.loads(p.read_text('utf-8'));d.update(stage='implemented_in_full_r1_for_review',animation_implemented=True,render_attempted_this_turn=True,full_export='mv-r1.mp4');p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n','utf-8')
p=r/'storyboard.md';s=p.read_text('utf-8');s+='\n## 首版全片导出记录\n\n用户已要求导出全片，转场随首版实施，详见review/r1-production-notes.md与mv/full-engine.js。成片为mv-r1.mp4，310.3秒、1920×1080、30fps；源歌词与信件未改写。上文“待确认”是转场设计时的历史状态，当前以用户看片反馈进行下一轮迭代。\n';p.write_text(s,'utf-8')
print('Delivery documentation synchronized with verified mv-r1.mp4.')
