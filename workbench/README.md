# MV 本地工作台

启动：`powershell -NoProfile -ExecutionPolicy Bypass -File .\start-workbench.ps1`，或运行 `node workbench/server.mjs` 后打开 http://127.0.0.1:3210 。需要 Node.js 22 或以上。

每次只制作一首歌。首次打开选择本机音频、填写歌名，可选上传 TXT / LRC / SRT 辅助歌词。音频及歌词上传总大小不超过 120MB，歌词不超过 1MB，支持 UTF-8 / GB18030。「更换当前歌曲」会统一更新输入与所有卡片，并重置大纲、结果和进度；旧输入及会话保存到历史目录，不删除已有交付。旧版多歌曲状态迁移时先备份，再取最后一首作为当前歌曲。

不显示歌曲编号，不提供歌曲切换。卡片只显示一个「这一步要做什么」任务编辑区，提示可自主编辑。「理解音乐」使用用户提供的角色、Whisper、歌词解读、librosa 和人工确认任务。编辑后的 content 保存到状态和 `workflow/prompts/歌曲名.md`，实际传入模型作为当前任务。内部制作规则与检查约束保留在后台，不在界面提供三个独立编辑区。

上传和保存不调用模型；点击「开始这一步」后，DeepSeek 通过工具循环驱动本地文件、脚本和媒体工具。每次只执行当前卡。阶段产出后统一等待用户查看并确认，确认后才开启下一步，不自动启动下一步；前置卡未确认时，界面禁用启动按钮，后台也拒绝跳步。

歌词识别结果以文本编辑框展示，可修改并保存；保存歌词不会完成当前卡，仍需点击确认。确认前保存编辑内容，旧歌词自动备份。分镜/样片直接展示图片或视频，结果下方提供修改意见框；发送后实际重新制作当前阶段，不修改任务卡原文，不推进后续阶段，重做后再次等待确认。没有通用卡片聊天区。

当前 DeepSeek 文本接口不直接听音频。歌曲输入路径和辅助歌词进入任务上下文，Whisper 转写及 librosa 节拍分析由本地工具完成；歌曲理解必须提供 SRT 供确认。WebSearch 是任务需求描述，后台目前有公开页面获取工具，没有通用搜索引擎；缺少搜索、转写等能力时必须如实报告限制，不能编造结果或听校记录。

API 设置支持临时和永久凭证。临时 Key 仅存在后台内存，整首歌最后一张卡确认完成或后台退出后清除；浏览器刷新不会清除。永久 Key 使用 Windows DPAPI 保存在项目外的 `%LOCALAPPDATA%/MVWorkbench/deepseek.dpapi`，可主动清除。凭证不会写入 prompt、聊天、浏览器存储或仓库；保存凭证不代表已验证余额和网络。

后台发现 `.agents/skills/**/SKILL.md`，可在能力库启用或刷新。制作代码工程仍共用，新歌曲任务需检查旧脚本的音轨、时长等，不能直接复用旧歌结果。脚本以本机用户权限运行；终稿使用新的 mv-rN.mp4，不覆盖旧交付。

分镜和样片每次任务最多进行三次图片检查（优先使用接触表），之后后台只开放结果提交，停止重绘并等待人工确认；未解决的问题必须如实列出。修改意见应复用未涉及镜头，并检查局部修改是否影响了其他镜头。

状态：`workflow/workbench/state.json`；上传输入：`workflow/songs/<UUID>/`；历史会话：`workflow/history/song-sessions/`；阶段记录：`workflow/stages/`；预览：`workflow/previews/`；QA：`workflow/qa-report.md`。

验证：`npm run test:workbench`；浏览器隔离检查：`node workbench-tests/import-ui-smoke.mjs`。检查使用模拟 Agent，不消耗真实 API；歌词与分镜结果区使用测试产物验证交互，不代表实际完成了歌曲制作。

真实 API 最简 smoke：`node workbench-tests/real-smoke.mjs`（转发至 real-flow-smoke.mjs）。脚本在系统临时目录建立隔离项目，监听 http://127.0.0.1:3213 。关闭上传窗口后，在 API 设置填写临时 Key；保存后自动执行项目盘点和测试字幕两张卡，并验证人工确认、歌词编辑落盘、下载和重启恢复。输入是一秒静音及明确标注的人工测试 SRT，不做真实 ASR、网络乐评检索或 MV 渲染；最多 24 次真实 API 请求。也可用 `--stdin` 从标准输入传入 Key，禁止放在命令行参数。等待凭证最多 10 分钟，结束清除临时 Key 并删除隔离项目，报告和实际产物保存在 workflow/stages/workbench-real-flow-smoke-<时间>/。

真实分镜测试：`node workbench-tests/real-story-smoke.mjs`，从不回显的标准输入接收临时 Key。依赖本机 Chrome、项目 `.conda/mv/python.exe` 中的 Pillow 和 Windows 字体，复用已确认镜头测试出图、视觉检查和反馈；不渲染视频。预览及详细 API smoke 输出保留本地，已通过 `.gitignore` 排除，仓库保留脚本和阶段总结。上传歌曲、歌词、运行状态与当前 prompt 同样不提交。
