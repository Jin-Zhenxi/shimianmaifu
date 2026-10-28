# 真实 DeepSeek 最简流程 smoke（2026-10-28）

最终结果：通过。真实模型 deepseek-flash，最终轮 9 次 API 请求，累计 total_tokens=73138（接口统计，不是费用估算）。实际加载 music-mv 与 song-video-director，执行 write_file → run_script（Python）→ read_file → finish_stage。

链路：HTTP 上传一秒静音 WAV + 人工测试 SRT → 盘点卡实际生成报告 → 等待确认且下一步被拒绝 → 确认后执行字幕卡 → 实际生成新 SRT 与说明报告 → 结果填入可编辑歌词框对应数据 → 编辑保存写回真实文件但后续仍锁定 → 确认后开启 story，后续四卡均保持 pending。实际声明产物可通过 artifact 接口下载，内容与磁盘一致。关闭清除临时 Key；重新初始化恢复已确认结果和歌词编辑，不恢复 Key。

成功证据：`workbench-real-flow-smoke-2026-10-28T03-19-14-453Z/report.json`；实际产物在同目录 smoke-inventory.md、smoke-song.md、smoke-lyrics.srt、smoke_subtitles.py。

本次过程中修正了测试脚本的请求上限、写死产物文件名和 Windows CRLF 比较问题，并收紧 smoke 提示词以减少无关资料读取。先前各轮失败报告保留，不能视为通过。包含排查复测，合计实际请求 71 次，total_tokens=596445；第一轮报告 apiRequests=13 包含一次在发请求前触及旧上限的计数，实际发出12次，后续已修正计数逻辑。最终轮只用了9次请求。

范围：真实 API、工具执行、两张卡的产物与人工确认门控；非完整歌曲制作。测试字幕是明确标注的人工样本，不是识别证据；未运行 Whisper、librosa、网页乐评检索、分镜制作或视频渲染。浏览器分镜展示与反馈重做由此前真实 Chrome + 模拟 Agent smoke 覆盖，不等同于本次真实模型生成分镜。

凭证只经关闭回显的 stdin 或本机 HTTP 传入后台内存，没有放入命令行参数或仓库。每轮退出清除凭证并删除隔离目录；成功轮扫描隔离项目确认无提供的 Key。正式工作台状态、大纲、动画入口、引擎和角色文件 SHA-256 前后不变。
