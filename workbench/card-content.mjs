// User-facing task cards; internal execution rules remain in store/agent.
export function cardContent(id, source, fallback) {
  const audio = source?.audio.path || 'song.mp3';
  const lyrics = source?.lyrics;
  const cards = {
    inventory: `<task>确认当前歌曲文件、可用工具与已有资料，列出缺失信息。仅盘点当前歌曲，不沿用上一首歌的歌词、分析或完成状态。尚未填写创意大纲时，不编造故事主题。</task>`,
    analysis: `<role>你是 MV 的音乐分析师。</role>
<task>分析文件夹中的 ${audio}：
1. 使用 Whisper 将歌词转写为带时间轴的字幕 lyrics.srt；当前歌曲已有 lyrics.srt 则直接使用。${lyrics ? `本次上传的歌词：${lyrics.path}，${/\.srt$/i.test(lyrics.path) ? '直接使用并核对时间轴。' : '作为转写纠错与时间对齐的参考。'}` : ''}
2. 使用 WebSearch 检索这首歌的歌词解读、乐评和听众评论，归纳出 3–5 种主流理解，逐条附上来源链接。
3. 综合上述理解，概括歌曲的主题与情绪走向。
4. 使用 librosa 测出 BPM 与节拍点，标注前奏、主歌、副歌、停顿以及最后一个重音的时间点。
结果整理为 song.md。</task>
<check>将识别置信度低、可能有误的歌词单独列出，等我确认。</check>`,
    story: `<role>你是 MV 导演。</role>
<task>使用 HyperFrames 制作这支 MV，先基于当前歌曲的 song.md、lyrics.srt 与已确认的创意大纲输出 storyboard.md：
1. 以歌词时间轴为准，每句歌词对应一个镜头，画面直接表现这句歌词的含义。
2. 抽象歌词拆解为观众看得懂的连续动作。
3. 每个镜头标注起止时间、场景、角色动作、运镜与相邻镜头衔接，切换对齐节拍点。
4. 保留已确认的画风与角色；缺少关键设定时列出待确认内容。
先输出可查看的关键帧或分镜总览，完成后暂停，等我确认。</task>
<avoid>单句歌词安排多个动作；无信息量的过场；观众无法理解的情节；无衔接的硬切。</avoid>`,
    scenes: `<task>分镜确认后，先为每个镜头绘制一张关键帧草图，拼接为 storyboard.png 供我检查。每次聚焦一个重点场景，制作可查看的短样片，确认后再扩大制作范围。</task>
<check>角色造型与道具保持一致；动作与歌词、节拍对应；衔接帧前后角色的大小、位置、姿态一致，不发生瞬移。</check>`,
    render: `<task>草图与样片确认后，制作完整 MV，并导出新的 MP4 版本。</task>
<specs>背景、角色、道具在同一画布中统一绘制，随镜头推拉同步运动。歌词读取当前歌曲的 lyrics.srt，置于画面下方，不随镜头运动。配上 ${audio}，按确认的画幅与帧率导出；使用新的 mv-rN.mp4 文件名。</specs>
<check>使用 ffmpeg 抽帧核对歌词时间与演唱是否对齐；测量导出音轨与原曲的响度（LUFS），两者保持一致。</check>`,
    qa: `<task>查看当前歌曲的成片，抽帧检查静止段落、运镜、情绪表现、手持道具、歌词与画面对应。记录需要修改的时间点，修正后再次检查，整理交付文件与 QA 报告。</task>
<check>将无法自动确认的听校与画面问题单独列出，等我确认；修改后的成片使用新版本名。</check>`,
  };
  return cards[id] || `<task>${fallback || id}</task>`;
}
