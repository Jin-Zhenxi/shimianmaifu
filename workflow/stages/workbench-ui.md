# 交互工作台实现记录

日期：2026-10-27。

用户要求卡片上方编辑、下方聊天局部修改、按歌曲编号与名称保存 Markdown prompt、后台加载状态与成功后自动下一卡。后续明确改为直接接 DeepSeek，不依赖 Codex；凭证分临时与永久，必须支持全部项目 Skill。

已实现 `workbench/` 本地服务和页面、`start-workbench.ps1` 启动入口，无新增 npm 依赖。模型经 Chat Completions tool calls 调用本地工具。四类现有 Skill 被自动发现，支持启用开关、阶段自动加载、按需读取入口及参考资源；新增入口可刷新发现。现有 HyperFrames 选择保留。

卡片、聊天、任务和实际 Skill 加载记录保存到 `workflow/workbench/state.json`；prompt 保存到 `workflow/prompts/编号-歌曲名.md`，文本改动留历史副本。阶段成功后切换下一卡，并同步原命令行状态。新预览等待用户查看，失败或取消不推进。

临时 Key 仅在后台内存保存，全部卡完成或后台退出后清除；永久凭证由 Windows DPAPI 加密保存到项目外。Key 不返回页面、不出现在 prompt，模型与本地脚本也不接收 Key。用户需在页面自行填写真实 Key。

限制：脚本运行没有操作系统级沙箱；仅使用可信项目与 Skill。模型质量取决于任务、模型和执行结果，安装多 Skill 不等于成片必然通过审美验收。当前没有通用网页搜索工具，仅有公开 HTTPS 页面读取。当前模型路由中 Flash 提供图片检查，Pro 路径仅文本与工具。

本轮未修改动画、歌词、角色、故事板或已有成片，没有填造创作大纲。真实 API 和浏览器视觉验收情况详见 `workflow/qa-report.md`。
