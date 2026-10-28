# MV 自动工作流入口

## 交互工作台（推荐入口）

运行 `powershell -NoProfile -ExecutionPolicy Bypass -File .\start-workbench.ps1`，先上传当前歌曲、填写歌名，可选上传辅助歌词；在 API 设置中选择临时或永久凭证。每次只制作一首歌，更换歌曲时统一更新所有卡片并重置进度。卡片只展示可自主编辑的任务内容；歌词结果可编辑确认，分镜和样片下可发送修改意见。结果必须查看并确认后，下一步才可启动。歌曲编号和通用聊天区已移除；prompt 按歌曲名保存。全部已安装 Skill 可从能力库启用并按需读取。

该路径直接调用 DeepSeek，**不依赖 Codex**。临时 Key 只保存在后台内存，整首流程完成或服务退出后清除；永久 Key 用 Windows 用户加密保存在项目外。操作和限制见 [workbench/README.md](../workbench/README.md)。

## 原命令行方式

1. 将创意大纲填入 `outline.md`。
2. 在仓库内启动 Codex（可将模型配置为 DeepSeek），要求按 `AGENTS.md` 完成大纲。
3. Agent 执行 `py workflow_runner.py next`。脚本每次只输出当前阶段所需的文本文件，单文件最多 3200 字符；完成阶段后运行 `py workflow_runner.py done <stage>`，然后 `next` 进入下一阶段。
4. 中间关键帧/短样片保存在 `workflow/previews/`，阶段过程保存在 `workflow/stages/`，自动检查结果写入 `workflow/qa-report.md`。完成状态可用 `py workflow_runner.py status` 查看。

项目现有 HyperFrames 构建/渲染、预检与音轨封装脚本由 Agent 按阶段调用。脚本负责限定上下文和记录状态；创作决策、代码修改、视觉检查由具备本地文件/终端能力的 Agent 执行。仅在 DeepSeek 网页聊天里粘贴大纲不能操作本地仓库。

## 可选：在 Codex 中接入 DeepSeek

DeepSeek 官方提供 Codex 接入流程：[官方指南](https://api-docs.deepseek.com/quick_start/agent_integrations/codex/)。在 Windows 按官方说明配置 `~/.codex/config.toml` 和模型目录，按提示输入 API Key；配置后 Codex CLI、桌面端和 VS Code 扩展读取同一配置。不要把 Key 保存到项目仓库。官方示例使用 `https://api.deepseek.com/` 和 Responses 协议；可选 `deepseek-flash` / `deepseek-v4-pro`，具体遵循官方当期文档。联网搜索只在支持的模型和配置下可用。

Agent Skills 使用开放的 `SKILL.md` 文件/资源格式，不要求模型专用替代品；是否能自动发现和调用，取决于 Agent harness。Codex 是当前推荐的执行外壳。
