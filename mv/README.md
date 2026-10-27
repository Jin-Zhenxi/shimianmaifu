# HyperFrames 全片工程

`index.html`现为310.3秒整片，1920×1080、30fps。入口加载`assets/full-data.js`、`actor-tracks.js`与`full-engine.js`；角色唯一编辑源是根目录`character.js`，构建时复制到assets。

根目录`mv-r1.mp4`为封回原音轨的首版。`review/mv-r1-render.mp4`是HyperFrames中间输出，不作为最终交付。FFmpeg完成原音轨封装、曲终静音与0.8秒信纸入场遮挡修整，均不增加片长。旧15秒测试入口保存在motion-test.html.bak，仅作历史记录。

在项目根目录运行`npx hyperframes preview ./mv --port 3017`可预览完整时间轴。重建输入运行`.\.conda\mv\python.exe prepare_full_mv.py`。`render-full.ps1`记录当前导出方式，最终文件存在时不会覆盖旧版；下一版应使用r2名称。

正文使用xin.md原文；03:08.633开始逐行显现、04:40.3全文显示、05:10.3结束。最后30秒静止及逐行淡入来自用户要求，覆盖辅助动画Skill的默认持续运动／禁止单独淡入建议。

详细验证见review/r1-qa.json，制作取舍与已知限制见review/r1-production-notes.md。歌词机器时间轴未逐句听校。
