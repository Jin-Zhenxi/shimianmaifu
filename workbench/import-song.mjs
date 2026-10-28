import fs from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {safeName, textValue} from './store.mjs';
import {LocalTools} from './tools.mjs';

const audioExtensions = new Set(['.mp3','.wav','.flac','.m4a','.aac','.ogg','.opus','.webm','.aiff','.aif']);
export async function importSong(req, store, redact) {
  const chunks = []; let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 120 * 1024 * 1024) throw Error('上传总大小不能超过 120MB');
    chunks.push(chunk);
  }
  const form = await new Response(Buffer.concat(chunks), {headers:{'Content-Type':req.headers['content-type']}}).formData();
  const title = safeName(redact(textValue(form.get('title'),70)).trim());
  const audio = form.get('audio'), lyrics = form.get('lyrics');
  if (!audio || typeof audio === 'string' || !audio.size) throw Error('请选择非空歌曲文件');
  const ext = path.extname(audio.name).toLowerCase();
  if (!audioExtensions.has(ext)) throw Error('请选择 MP3、WAV、FLAC、M4A、AAC、OGG、OPUS、WEBM 或 AIFF 音频');
  let lyricText = '', lyricExt = '';
  if (lyrics && typeof lyrics !== 'string' && lyrics.name) {
    lyricExt = path.extname(lyrics.name).toLowerCase();
    if (!['.txt','.lrc','.srt'].includes(lyricExt) || !lyrics.size || lyrics.size > 1024 * 1024) throw Error('歌词请选择非空 TXT、LRC 或 SRT 文件，大小不超过 1MB');
    const bytes = await lyrics.arrayBuffer();
    try { lyricText = new TextDecoder('utf-8',{fatal:true}).decode(bytes); }
    catch { lyricText = new TextDecoder('gb18030',{fatal:true}).decode(bytes); }
    if (!lyricText.trim() || lyricText.includes('\0')) throw Error('歌词必须是文本文件');
    lyricText = redact(lyricText);
  }
  const id = randomUUID(), directory = `workflow/songs/${id}`;
  const full = await new LocalTools(store.root).resolve(directory,{write:true});
  await fs.mkdir(full,{recursive:true});
  await fs.writeFile(path.join(full,`audio${ext}`),Buffer.from(await audio.arrayBuffer()),{flag:'wx'});
  if (lyricText) await fs.writeFile(path.join(full,`lyrics${lyricExt}`),lyricText,{flag:'wx'});
  const song = store.newSong({id,title,source:{audio:{path:`${directory}/audio${ext}`,name:redact(path.basename(audio.name)),size:audio.size},
    lyrics:lyricText ? {path:`${directory}/lyrics${lyricExt}`,name:redact(path.basename(lyrics.name))} : null}});
  // Replacement is a fresh session; retain old inputs and session records on disk.
  await store.export(song);
  const {atomic} = await import('./store.mjs');
  await atomic(path.join(store.root,`workflow/history/song-sessions/${randomUUID()}.json`),JSON.stringify(store.state,null,2));
  store.state.songs = [song]; await store.save();
  await atomic(path.join(store.root,'workflow/state.json'),JSON.stringify({completed:[],active:song.active},null,2));
  return song.id;
}
