# MV 本地工作台

在项目根目录启动：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\start-workbench.ps1
```

或者直接运行 `node workbench/server.mjs`，打开 http://127.0.0.1:3210 。需要 Node.js 22 或以上，不新增 npm 依赖，不需要 Codex 登录或 Codex CLI。

首次打开填写 DeepSeek API Key，选择模型和临时/永久模式。Key 只发送给本机后台及固定的 `https://api.deepseek.com`，不会写入 prompt、聊天记录或浏览器存储。凭证保存不代表已验证余额和网络；首次聊天或制作时返回实际连接错误。

- 临时：只在后台内存保留，当前歌曲全部卡片完成或后台进程退出时清除。刷新和关掉浏览器不会停止后台，也不会清除正在使用的 Key。再次启动后台需要重新填写。
- 永久：Windows DPAPI 按当前用户加密保存到 `%LOCALAPPDATA%/MVWorkbench/deepseek.dpapi`；下次启动自动读取。流程完成后保留，可在 API 设置中清除。切回临时模式也会删除此前的永久副本。其他系统仅支持临时模式。

上方卡片可直接编辑；下方聊天支持针对原文的局部替换，未涉及字段保持不变。点“保存修改”将当前所有卡片导出为 `workflow/prompts/编号-歌曲名.md`；聊天修改成功后自动保存。开始制作前也会保存修改。编号和名称表示当前项目歌曲，更改后另存对应 prompt，旧文件保留；本版不在同一工程并行混用不同歌曲的音频和画面资产。

后台通过 DeepSeek Chat Completions 的 tool calls 驱动本地工具，不经过 Codex。每次只处理当前卡：项目盘点 → 歌曲理解 → 故事分镜 → 场景样片 → 版本渲染 → 成片 QA。成功后自动选择下一卡；新样片需要查看时留在当前卡展示，点击确认后进入下一卡。失败、取消或条件缺失时不前进。重新制作之前的卡会撤销其后各卡的完成状态，保留已有文件。

“歌曲与大纲”里可编辑本次大纲、查看 Skill 能力库和启用开关。后台自动发现 `.agents/skills/**/SKILL.md`；新增 Skill 后点击刷新即可。默认自动加载当前阶段相关的主流程、导演和运动设计，模型还可调用 `list_skills`、`read_skill` 加载其他已启用 Skill；参考文档和脚本可以继续读取、运行。Remotion 规范可用，但不会自动替换本工程选定的 HyperFrames。

模型的能力与工具共同决定可完成的工作。DeepSeek Flash 支持 `inspect_image` 的图片检查；当前 Pro 路径只启用文本和工具，不能宣称已看过图片。模型不会实际听音频，机器时间轴和听校限制必须保留。外部资料可以通过 `fetch_page` 读取公开 HTTPS 页面，当前没有通用搜索引擎工具。

工具支持项目文本读取与写入、Python/Node/PowerShell 脚本、FFprobe 和图片检查；工具会检查项目路径并隐藏凭证目录。**脚本以当前用户权限运行，没有操作系统级沙箱**，只对受信任项目及 Skill 使用。已有文本修改前自动备份到 `workflow/history/`；模型必须先做关键帧/短样片、按需停下来确认，并为最终视频使用新版本名。本地后台无法保证任意生成脚本的行为，因此不应让它处理不受信任代码。

状态持久化到 `workflow/workbench/state.json`，包括各卡聊天、任务与实际 Skill 加载记录。刷新页面能恢复；后台重启时将未完成任务标记中断，保留文件供检查和重试。阶段完成同步 `workflow/state.json`，供原命令行脚本查询。阶段记录在 `workflow/stages/<歌曲内部ID>/`，预览在 `workflow/previews/`，QA 在 `workflow/qa-report.md`。

端口默认 3210，启动脚本支持 `-Port 3211` 和 `-NoBrowser`。服务只监听 127.0.0.1，同源请求与页面随机 token 用于限制浏览器跨站写入，不是供公网部署的服务。

运行验证：`npm.cmd run test:workbench`。测试在隔离目录使用假 Key 和模拟模型响应，不消耗真实 API，也不更改歌曲资产；Windows DPAPI 测试仅在内存中往返验证。

可选真实 smoke：`node workbench-tests/real-smoke.mjs` 从标准输入接收一行临时 Key，不接受命令行密钥，也不写入文件。它复制说明和 Skill 到系统临时目录，检查真实聊天局部修改、跨 Skill 加载、Python 工具执行、盘点报告下载和自动切卡，然后停止；最多 8 次真实 API 请求，不渲染歌曲。退出会清除凭证、删除隔离目录，报告保存在 `workflow/stages/workbench-real-smoke-<时间>/`。这项检查会消耗实际 API 用量，不属于默认测试。

协议依据：[DeepSeek Tool Calls](https://api-docs.deepseek.com/guides/tool_calls/)、[Chat Completions](https://api-docs.deepseek.com/api/create-chat-completion/)。
