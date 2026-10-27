# MV 工作流协作规则

当用户提供 MV 提示词大纲或要求继续制作时，读取 `mv-workflow/outline.md` 和 `mv-workflow/workflow.json`，再运行 `py workflow_runner.py next` 取得当前阶段的局部上下文。严格按 `.agents` 现有 Skills 与项目成果推进；每次聚焦一个阶段/场景，先产出可查看关键帧或短样片，检查后再扩大制作范围。保存阶段记录到 `workflow/stages/`，样片放 `workflow/previews/`，QA 结果写 `workflow/qa-report.md`。最终渲染需使用新版本名，不覆盖既有交付。交互工作台直接调用 DeepSeek API，并提供本地工具和多 Skill 加载，不要求经过 Codex；不得把密钥放进仓库。临时凭证只保留在后台内存，整首歌流程完成或后台退出后清除；永久凭证使用 Windows 用户加密保存到项目外，用户可主动清除。不要因大纲未提供而自行虚构创作主题；入口文件为空时先完成项目盘点并等待大纲。
