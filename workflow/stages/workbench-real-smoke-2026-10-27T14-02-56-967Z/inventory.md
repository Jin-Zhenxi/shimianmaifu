# 盘点记录（inventory）

日期：本次会话；歌曲：001 十面埋伏（隔离 smoke 项目）

## 现有文件
- 根目录：`AGENTS.md`、`README.md`、`song.md`、`workflow_runner.py`。
- `mv-workflow/`：`outline.md`（仅模板，"大纲（等待用户提供）"、"约束"两节，无正文）、`workflow.json`（6 阶段：inventory→analysis→story→scenes→render→qa）。
- `mv/`：仅 `README.md`（描述 HyperFrames 整片工程、character.js、mv-r1.mp4 等），工程文件与 `song.mp3` 等素材在本次隔离目录中未出现。
- `workflow/`：仅 `stages/`、`prompts/`；无 `previews/`、`qa-report.md`、`state.json`。

## 脚本结果
`py workflow_runner.py status` 退出码 0：completed=[]，active=null，remaining=[inventory, analysis, story, scenes, render, qa]。

## 缺失／待补充
1. 创意大纲为空（情绪、画风、必留内容、时长、交付格式均未定）。
2. 音频、歌词、角色、分镜等既有成果不在当前目录。
3. 待用户提供大纲后再进入 analysis。

本次未制作、未分析、未渲染。
