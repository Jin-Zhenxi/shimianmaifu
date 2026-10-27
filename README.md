# 项目初始化：基于 Codex 的纯代码动画 MV 创作系统

## 从 GitHub 获取与启动

本仓库包含本地 DeepSeek 工作台、MV 源码、四类项目 Skill、已确认的分镜草图与检查记录。原始音视频、视频导出、本机依赖与缓存、Windows 字体和工作台运行状态不进入 Git。

需要 Node.js 22 或以上。在项目根目录运行：

```powershell
npm.cmd ci
powershell -NoProfile -ExecutionPolicy Bypass -File .\start-workbench.ps1
```

工作台地址为 http://127.0.0.1:3210 ，API Key 在页面填写。凭证与制作流程见 [工作台说明](workbench/README.md)。本地自动化检查运行 `npm.cmd run test:workbench`。

需要重新分析或渲染时，先自行放回 `song.flac`（主音轨）及所需原始媒体，再按下文安装 Python/FFmpeg 环境。私人信件 `xin.md`、包含正文的编译数据和成片检查截图均保留在本地，不随仓库上传。

重新生成信件数据时，将 `ending-letter.example.json` 复制为 `ending-letter.json`，自行准备本地 `xin.md`，再依次运行 `prepare_letter.py`、`review_letter.mjs`、`finalize_letter_layout.py` 与 `prepare_full_mv.py`。这些脚本需要相应 Python、浏览器与 Node 环境。Windows 上运行 `prepare_full_mv.py` 会将主音轨、GSAP 与本机 `C:/Windows/Fonts/msyh.ttc` 复制到 `mv/assets/`。现有成片 `mv-r1.mp4` 和完整渲染检查帧保留在原本地目录，不随源码上传。

## 一、项目背景与目标

建立基于 **Codex + Agent Skills** 的高质量音乐 MV 创作项目。参考 TikTok、YouTube 等平台上的 AI Agent 代码动画 MV，通过 AI 编写和执行程序，绘制角色、场景、动画与视觉特效，并与音乐节奏结合，形成具有艺术表现力和叙事能力的完整音乐视频。

核心目标：**让 Codex 具备从理解音乐到组织视觉表达、生成代码动画、完成视频制作与反复优化的综合能力，逐步形成高质量、可扩展、可复用的 MV 创作系统。**

这不是简单的音乐可视化播放器，也不以传统文生视频模型批量生成镜头。

长期希望支持：

- 卡通人物、原创角色及角色动作。
- 具有连续性的故事叙事和分镜设计。
- 歌词动画、动态文字及艺术化排版。
- 抽象图形、粒子、程序化场景和视觉特效。
- 根据节拍、旋律、情绪及音乐结构驱动视觉变化。
- 不同镜头之间的风格统一与角色一致性。
- 可预览、可局部修改、可反复迭代的完整 MV。

以上是最终能力目标，不要求当前阶段全部实现。

## 二、确定的技术路线

**Route A：Pure Code-Driven Animated Music Video**，以代码绘制和程序化动画为主要画面生成方式。

允许研究和使用的技术包括：

- Canvas / SVG / CSS 动画。
- p5.js / p5.brush。
- React / TypeScript。
- Remotion。
- HyperFrames。
- Three.js / WebGL。
- Python 音频分析。
- FFmpeg 音视频处理。

这些是候选技术，并非必须全部采用。优先选择有助于动画表现、制作稳定性与可维护性的方案；不预先绑定单一渲染引擎；不以 AI 文生视频、图生视频模型作为主要生产方式。技术方案服务于作品的艺术表现。

## 三、Codex 的角色

Codex 是项目主控 Agent，承担以下长期职责：

1. **项目架构师**：规划项目结构、管理技术方案、协调工具与 Skill。
2. **MV 导演**：根据歌曲、创意和审美要求组织画面、情绪、节奏与叙事。
3. **动画工程师**：使用程序化绘制、动画算法和视频框架实现视觉内容。
4. **工作流协调者**：按阶段选择适当的 Skill 和工具，避免重复、冲突与不必要的复杂度。
5. **质量审核者**：通过预览、抽帧、音画同步检查和用户反馈持续改善作品。

长期职责不意味着当前阶段已经授权相应制作任务。

## 四、预定 Skill 架构

| Skill | 来源 | 预定职责 |
| --- | --- | --- |
| music-mv | https://github.com/Win-Hao/music-mv | 优先研究的核心制作工作流：音乐分析、艺术风格、角色与场景、分镜、程序化动画、渲染和迭代 |
| Remotion 官方 Skills | https://github.com/remotion-dev/skills | 可选的动画工程能力：代码动画、时间轴、React 组件、动态文字、音画同步、预览与渲染 |
| song-video-director | https://github.com/BuzyOwl/song-video-director | 补充音乐分析、镜头叙事和导演方法，避免重复核心工作流已有能力 |
| video-motion-craft | https://github.com/vibegameengine/video-motion-craft | 补充动画表现、镜头节奏、运动设计和成片质量检查原则 |

### Skill 组织原则

- Codex 负责总体规划与工作协调，music-mv 是核心候选，不必无条件遵循其全部实现方式。
- Remotion 是重要候选，但不是已确定的唯一渲染引擎。
- 两项辅助 Skill 按实际缺口选用，不要求同时启用全部 Skill。
- 对重叠或冲突能力进行分析和取舍，不叠加重复流程。
- 不假定第三方 Skill 能直接兼容 Codex；先检查真实流程、依赖和平台假设。
- Skill 的默认流程不得覆盖用户后续的具体要求。

### 待研究与验证

- 各仓库实际 Skill 入口、配套资源完整性、版本与许可。
- Codex 兼容性，以及对 Claude Code 专用工具、路径或指令的依赖。
- Windows 环境下的运行条件、外部服务和依赖安装要求。
- 音乐分析、导演规划和质量检查之间的重复与冲突。
- 候选引擎的确定性渲染、音画同步、预览效率及局部修改能力。

初步协作关系：用户提出目标与约束 → Codex 协调 → music-mv 提供核心工作流参考 → 按需使用动画工程、导演与质量 Skill → 预览和反馈迭代。这是可调整的关系，不是固定制作流水线。

## 五、项目设计原则

### 高质量优先

综合评价创意与视觉辨识度、风格一致性、动画流畅度、音乐与视觉协调、分镜与叙事、角色与场景稳定性，以及最终观感和用户审美需求。

### 模块化与可扩展

面向不同音乐、角色、场景、动画技术与视觉风格，避免将全部能力耦合进无法修改的流程。

### 持续迭代

采用多轮开发。用户逐步提供创作需求、技术要求、审美偏好、音乐素材、功能要求与测试反馈。后续工作在已确认目标和约束上继续，不每轮重新设计系统。

### 以用户要求为最高创作约束

Skill 是辅助能力。结合具体目标选择方案并说明技术取舍，不擅自添加大量未经确认的创作要求。

### 设计与实现分阶段进行

先明确问题和方案，再进入对应实现。不在需求未定时提前编写大量代码，不自行生成无关视频。

## 六、当前阶段与执行边界

当前处于项目初始化与理解阶段：明确目标、技术路线、Codex 与 Skill 的关系，以及需要验证的问题。架构保持简洁，不提前制定不可更改的完整流程。

原始初始化约定以只读检查 README、SKILL.md 和公开文档为主，不安装 Skill 或依赖、不创建或修改项目文件、不编写动画或渲染视频、不自行确定歌曲、画风、角色或故事、不进入实质开发。

**已明确授权：将项目约定写入本 README，下载、安装上述四类 Skill，在 Conda 隔离环境安装依赖，以及分析用户提供的歌曲并生成字幕、节拍和分析报告。** 动画开发和视频制作尚未启动。

Skill 的预定项目安装位置为 `.agents/skills/`。只有实际下载完整且验证入口与配套资源后，才可标记为已安装；下载失败不能视为安装成功。

## 七、后续协作方式

- 根据新要求补充和细化已有方案。
- 区分已确定的设计与尚未确定的选择。
- 发现潜在技术冲突时主动说明。
- 未获得明确执行授权时以分析和设计为主。
- 对已明确的目标保持连续理解，避免重复讨论。
- 通过多轮交流逐步完善系统，不一次性解决全部技术问题。

## 八、现有输入与待启动任务

目录已有 `song.mp3`、`song.flac` 和用户提供的粤语歌词 `script.txt`。音乐分析现已由用户明确启动，使用FLAC作为主分析源。

当前音乐分析任务：使用 Whisper 并参考 `script.txt` 生成带时间轴的 `lyrics.srt`；检索歌词解读、乐评与听众评论，归纳 3–5 种理解并附来源；总结主题、情绪走向、停顿及最后一个重音时间；使用 librosa 分析 BPM、节拍和歌曲结构；整理为 `song.md`。低置信度文字先与script.txt核对，仍不能确认的歌词与时间轴单列供用户确认。

## 九、环境安装

已找到现有 Miniconda：`C:/Users/18091/miniconda3`。使用它管理项目内独立环境 `.conda/mv`，不修改 base 或其他项目环境。音频分析采用 Python 3.11、Whisper、librosa、SoundFile、NumPy、SciPy、Matplotlib、Pillow 和 FFmpeg。Whisper 的 PyTorch 依赖由 pip 解析；是否支持 CUDA 以安装后检查结果为准，不改装其他环境已有的 Torch。

在本项目目录的 PowerShell 执行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\setup-mv.ps1
```

可分别执行 `-SkillsOnly` 或 `-DependenciesOnly`。四类 Skill 安装到 `.agents/skills/`；Remotion 首先安装与动画工程直接相关的 `remotion-best-practices`，其余专题 Skill 按需补充。安装器会下载对应 Skill 的配套文件，不只下载 SKILL.md。

首次自动安装未成功，之后用户已在正常终端完成安装。四类Skill现已被会话识别，配套入口引用检查通过；项目Conda环境的音频依赖导入、pip check、FFmpeg与FFprobe检查通过。Whisper small模型已由用户下载并在本地成功加载。详细环境结果见 `environment-check.json`。

安装完成后生成 `requirements-audio.installed.txt` 记录实际 Python 包版本。当前Torch为CPU版；Whisper使用 `.cache/whisper/small.pt`。React、Remotion、p5.js、Three.js 等渲染依赖待确定实现方案后按需安装。Puppeteer、GSAP与HyperFrames现已安装，Node已升级至22.23.4；无头Chrome152已可调用。

## 十、当前创作进度

- 歌词文字已确认以script.txt为准；lyrics.srt已有43条机器时间轴，尚未逐句听校。
- 用户已选择纸艺拼贴绘本collage，并确认character.js v1.1中的螃蟹角色造型。所有后续镜头统一调用该模块。
- 用户已指定本支MV采用HyperFrames。此选择适用于本作品，不改变系统未来可选其他引擎的原则。
- 用户已填写并确认lyrics-interpretation.md，storyboard.md已更新为v2：增加日常恩爱回忆、城市错身步伐，明确女主没有看见男主、双方无意识错过；分手原因保持留白。
- 片尾改用用户亲自提供正文的信，按行浮现；原曲结束且全文显现后保留30秒。正文已由xin.md提供，原文接入单页逐行显现；计划片长310.3秒，见ending-letter.md。
- 草图已根据本轮反馈修订为v3：L23男主独自全城反复寻找，L39／L40云朵标“1000天”，L41–L43以风吹侧帘形成最后错失，E2／E3背道而驰，并加入站台、副歌与末段夜景。现有49张主关键帧及3张L23过程帧共52张，见sketches/、storyboard.png及storyboard-revisions.png；用户已确认草图v3。已建立mv/中的HyperFrames L41–E1动作测试工程（15.233秒），整片尚未渲染。

## 转场与全片导出


用户确认保留当前计划片长310.3秒（约5:10），不因转场增加0.8秒。信件仍于03:08.633开始、04:40.3全文显示、05:10.3结束；纸边展开与显字并行，最后30秒静止阅读保留。

## 首版全片 mv-r1.mp4

用户已授权导出。首版为1920×1080、30fps、310.3秒（9309帧），歌曲完整播放，曲终后保留信件阅读；最后30秒静止。所有角色继续统一调用character.js。最终检查见review/r1-qa.json，解码接触表见review/r1-decoded-page-*.jpg。字幕仍为原机器时间轴，尚未逐句听校；后续按用户看片反馈迭代。

## MV 大纲工作流入口

现已加入本地交互工作台。运行 `powershell -NoProfile -ExecutionPolicy Bypass -File .\start-workbench.ps1`，浏览器里填写 DeepSeek API 即可使用卡片编辑、聊天局部修改、歌曲 Markdown prompt 保存、多 Skill 加载和后台阶段制作；无需 Codex 登录。临时/永久凭证、自动切卡和本地执行限制见 [工作台说明](workbench/README.md)。

新任务将大纲填写到 `mv-workflow/outline.md`，并按根目录 `AGENTS.md` 与 `mv-workflow/README.md` 驱动分阶段制作。运行 `py workflow_runner.py next` 只读取当前阶段所需资料；每阶段完成后运行 `py workflow_runner.py done <stage>`。中间样片位于 `workflow/previews/`，自动检查报告位于 `workflow/qa-report.md`。DeepSeek API 可按 `mv-workflow/README.md` 的官方 Codex 配置指南接入，不要把 API Key 写入仓库。
