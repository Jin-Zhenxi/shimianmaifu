import fs from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';

export const fields = ['goal', 'instructions', 'checks'];
const templates = {
  inventory: ['项目盘点', '确认歌曲、创意大纲与现有成果', '读取项目说明和本次大纲，列出可复用成果、待修改项及缺失信息。大纲为空时只盘点，不编造创意。', '写出盘点记录；注明待补充内容。'],
  analysis: ['歌曲理解', '核对音乐、歌词与情绪走向', '复用已确认的歌曲与歌词，检查时间轴、节拍和段落。区分事实、候选分析与用户意图。', '保存分析记录；列出需要人工听校的时间点，不伪称已听校。'],
  story: ['故事与分镜', '把大纲落实成可查看的分镜', '保留已确认画风、角色和故事事实。按歌词与节拍修订分镜，先出关键帧供检查。', '提供可查看的关键帧或接触表，并记录改动。'],
  scenes: ['场景样片', '先完成一个重点场景的短样片', '每次聚焦一个场景，复用统一角色模块，用确定性时间轴实现动作与转场。先出短样片，再扩大范围。', '提供短样片或关键帧，检查画面和节奏，记录剩余问题。'],
  render: ['版本渲染', '按确认内容导出新版本', '检查前置样片与确认记录，使用下一个可用版本名导出，保留原音轨与已确认时长。不得覆盖已有交付。', '提供新的 mv-rN.mp4，记录参数、时长和音轨检查。'],
  qa: ['成片检查', '检查成片并整理交付', '抽帧检查画面，运行音画、时长和节奏检查；如实记录人工听校等限制，整理成片和检查报告。', '更新 workflow/qa-report.md，列出交付文件、检查证据与已知限制。'],
};

export async function readJSON(file, fallback) {
  try { return JSON.parse((await fs.readFile(file, 'utf8')).replace(/^\uFEFF/, '')); }
  catch (e) { if (e.code === 'ENOENT') return fallback; throw e; }
}
export async function atomic(file, content) {
  await fs.mkdir(path.dirname(file), {recursive: true});
  const tmp = `${file}.${randomUUID()}.tmp`;
  await fs.writeFile(tmp, content, 'utf8');
  await fs.rename(tmp, file);
}
export function safeName(s) {
  const name = String(s).normalize('NFC').replace(/[<>:"/\\|?*\x00-\x1f]/g, '-').replace(/[. ]+$/g, '').trim().slice(0, 75);
  if (!name || /^(con|prn|aux|nul|com\d|lpt\d)(\.|$)/i.test(name)) throw Error('请输入有效的歌曲编号和名称');
  return name;
}
export function promptPath(song) { return `workflow/prompts/${safeName(song.number)}-${safeName(song.title)}.md`; }
export function markdown(song) {
  return `# ${song.number} · ${song.title}\n\n## 本次大纲\n\n${song.outline || '（等待填写）'}\n\n` + song.cards.map((c, i) =>
    `## ${String(i + 1).padStart(2, '0')} · ${c.title}\n\n### 目标\n\n${c.goal}\n\n### 制作要求\n\n${c.instructions}\n\n### 完成检查\n\n${c.checks}\n`).join('\n');
}
export class Store {
  constructor(root) { this.root = root; this.file = path.join(root, 'workflow/workbench/state.json'); }
  async init() {
    this.manifest = await readJSON(path.join(this.root, 'mv-workflow/workflow.json'));
    this.state = await readJSON(this.file, null);
    if (!this.state) {
      let outline = await fs.readFile(path.join(this.root, 'mv-workflow/outline.md'), 'utf8');
      if (outline.includes('（等待用户提供）')) outline = '';
      const songText = await fs.readFile(path.join(this.root, 'song.md'), 'utf8').catch(() => '');
      const title = songText.match(/《([^》]+)》/)?.[1] || '未命名歌曲';
      this.state = {version: 1, songs: [{id: randomUUID(), number: '001', title, outline, revision: 0,
        active: this.manifest.stages[0].id, cards: this.manifest.stages.map(s => {
          const [title, goal, instructions, checks] = templates[s.id] || [s.id, '', '', ''];
          return {id: s.id, title, goal, instructions, checks, status: 'pending', chat: [], result: null};
        }), jobs: [], updatedAt: new Date().toISOString()}]};
    }
    // An old process cannot still own a job after restart. Never silently mark it complete.
    for (const s of this.state.songs) for (const j of s.jobs) if (j.status === 'running') {
      j.status = 'interrupted'; j.error = '后台服务已重启，任务中断。请检查已有文件后重试。';
      s.cards.find(c => c.id === j.cardId).status = 'pending';
    }
    await this.save();
  }
  song(id) { const s = this.state.songs.find(s => s.id === id); if (!s) throw Error('歌曲不存在'); return s; }
  card(song, id) { const c = song.cards.find(c => c.id === id); if (!c) throw Error('卡片不存在'); return c; }
  async save() { await atomic(this.file, JSON.stringify(this.state, null, 2) + '\n'); }
  async export(song) {
    const rel = promptPath(song); await atomic(path.join(this.root, rel), markdown(song)); return rel;
  }
  async update(song, changes) {
    if (changes.revision !== song.revision) throw Error('内容已在其他页面更新，请刷新后再保存');
    if (changes.number !== undefined) song.number = safeName(changes.number);
    if (changes.title !== undefined) song.title = safeName(changes.title);
    if (changes.outline !== undefined) song.outline = textValue(changes.outline);
    if (this.state.songs.some(s => s.id !== song.id && promptPath(s) === promptPath(song))) throw Error('已有相同编号和名称的歌曲');
    if (changes.card) {
      const c = this.card(song, changes.card.id);
      if (c.status === 'completed') throw Error('已完成的卡片请先点“重新制作”');
      for (const field of fields) if (field in changes.card) c[field] = textValue(changes.card[field]);
    }
    song.revision++; song.updatedAt = new Date().toISOString();
    await this.export(song); await this.save();
  }
}
export function textValue(v, max = 30000) {
  if (typeof v !== 'string' || v.length > max) throw Error(`文本格式错误或超过 ${max} 字符`);
  return v;
}
