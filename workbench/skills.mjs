import fs from 'node:fs/promises';
import path from 'node:path';

const info = {
  'music-mv': {label:'音乐 MV 主流程', role:'歌曲理解、画风、角色、分镜和制作流程', stages:['inventory','analysis','story','scenes','render','qa']},
  'song-video-director': {label:'歌曲影像导演', role:'叙事、镜头调度、情绪节奏与质量复核', stages:['analysis','story','scenes','qa']},
  'video-motion-craft': {label:'动画与运动设计', role:'动作节奏、镜头运动、转场及 FFmpeg 处理', stages:['scenes','render','qa']},
  'remotion-best-practices': {label:'Remotion 动画工程', role:'Remotion 专题规范；当前 HyperFrames 工程按需调用', stages:[]},
};
export async function discoverSkills(root) {
  const base = path.join(root,'.agents/skills'); const skills=[];
  async function visit(dir, depth=0) {
    if(depth > 6 || skills.length >= 100)return;
    const entries=await fs.readdir(dir,{withFileTypes:true}).catch(e=>{if(e.code==='ENOENT')return [];throw e;});
    if(entries.some(e=>e.name==='SKILL.md'&&e.isFile())) {
      const rel=path.relative(base,dir).replaceAll('\\','/');
      const text=await fs.readFile(path.join(dir,'SKILL.md'),'utf8');
      const name=text.match(/^name:\s*["']?([^\r\n"']+)/m)?.[1].trim() || rel;
      const description=text.match(/^description:\s*(.+)$/m)?.[1].replace(/^["']|["']$/g,'') || '';
      const metadata=info[name] || {label:name,role:description,stages:[]};
      skills.push({id:rel,name,description,...metadata,entry:`.agents/skills/${rel}/SKILL.md`});
    }
    for(const e of entries)if(e.isDirectory()&&!e.name.startsWith('.')&&e.name!=='node_modules')await visit(path.join(dir,e.name),depth+1);
  }
  await visit(base);return skills.sort((a,b)=>a.id.localeCompare(b.id));
}
export function enabledSkills(registry,song) {
  return registry.filter(s=>song.enabledSkills == null || song.enabledSkills.includes(s.id));
}
export function recommendedSkills(registry,song,card) {
  const enabled=enabledSkills(registry,song);
  const remotion= /\bremotion\b/i.test([song.outline,card.goal,card.instructions].join('\n'));
  return enabled.filter(s=>s.stages.includes(card.id) || (remotion && s.name==='remotion-best-practices'));
}
