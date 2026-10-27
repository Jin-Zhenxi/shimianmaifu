"""Whisper transcription and auditable monotonic alignment to user lyrics.

Run with the project's Conda Python. No transcription is claimed until inference
actually succeeds. Original script.txt is never modified.
"""
import argparse
import difflib
import json
import os
from pathlib import Path
import re


def stamp(seconds):
    ms = round(max(0, seconds) * 1000)
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return f'{h:02}:{m:02}:{s:02},{ms:03}'


def chars(text):
    return ''.join(c for c in text if re.match(r'[\u3400-\u9fffA-Za-z0-9]', c))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--model', default='small')
    ap.add_argument('--audio', default='song.flac')
    ap.add_argument('--chunked', action='store_true')
    ap.add_argument('--reuse-result', action='store_true')
    a = ap.parse_args()
    root = Path(__file__).resolve().parent
    os.chdir(root)
    os.environ['PATH'] = str(root / '.conda/mv/Library/bin') + os.pathsep + os.environ['PATH']
    import torch
    import whisper
    torch.set_num_threads(min(8, os.cpu_count() or 4))
    lines = [s.strip() for s in Path('script.txt').read_text(encoding='utf-8-sig').splitlines() if s.strip()]
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    if a.reuse_result:
        result = json.loads(Path('lyrics.whisper.json').read_text(encoding='utf-8'))
    else:
        model = whisper.load_model(a.model, device=device, download_root=str(root / '.cache/whisper'))
        if a.chunked:
            audio = whisper.load_audio(a.audio)
            chunks = [(0,30,0,8),(30,65,8,16),(65,93,16,24),(93,121,24,32),
                      (121,134.5,32,36),(134.5,169,36,43),(169,len(audio)/16000,43,43)]
            result = {'segments':[], 'language':'zh','method':'section-guided Whisper with user lyrics; not forced alignment','chunks':[]}
            for start,end,l0,l1 in chunks:
                print(f'Transcribing {start:.2f}-{end:.2f}s, script lines {l0+1}-{l1}',flush=True)
                part = model.transcribe(audio[round(start*16000):round(end*16000)], language='zh', task='transcribe',
                    fp16=device=='cuda', word_timestamps=True, condition_on_previous_text=False,
                    initial_prompt='，'.join(lines[l0:l1]) or None, temperature=0, beam_size=5,
                    no_speech_threshold=None if l1>l0 else .6, verbose=False)
                result['chunks'].append({'start':start,'end':end,'script_lines':[l0+1,l1],'recognized_segments':len(part['segments'])})
                for seg in part['segments']:
                    seg['start'] += start
                    seg['end'] += start
                    seg['id'] = len(result['segments'])
                    for word in seg.get('words',[]):
                        word['start'] += start
                        word['end'] += start
                    result['segments'].append(seg)
            result['text'] = ''.join(s['text'] for s in result['segments'])
        else:
            result = model.transcribe(a.audio, language='zh', task='transcribe', fp16=device == 'cuda',
                                  word_timestamps=True, initial_prompt='以下是粤语歌曲，歌词参考：' + '，'.join(lines)[:180],
                                  verbose=False)
    Path('lyrics.whisper.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
    raw_srt = []
    observed, timing = [], []
    for seg in result['segments']:
        raw_srt.append(f"{len(raw_srt)+1}\n{stamp(seg['start'])} --> {stamp(seg['end'])}\n{seg['text'].strip()}\n")
        for word in seg.get('words', []):
            text = chars(word['word'])
            # Preserve actual word intervals; never invent per-character timing.
            for c in text:
                observed.append(c)
                timing.append((word['start'], word['end'], word.get('probability'), seg.get('avg_logprob'), seg.get('no_speech_prob')))
    Path('lyrics.whisper.srt').write_text('\n'.join(raw_srt), encoding='utf-8')
    target = ''.join(chars(line) for line in lines)
    source = ''.join(observed)
    mapping, exact = {}, set()
    for tag, i0, i1, j0, j1 in difflib.SequenceMatcher(None, target, source, autojunk=False).get_opcodes():
        if tag == 'equal':
            for i, j in zip(range(i0, i1), range(j0, j1)):
                mapping[i] = j
                exact.add(i)
        elif tag == 'replace':
            for i, j in zip(range(i0, i1), range(j0, j1)):
                mapping[i] = j
    rows, aligned, offset = [], [], 0
    for number, line in enumerate(lines, 1):
        clean = chars(line)
        indices = list(range(offset, offset + len(clean)))
        mapped = [mapping[i] for i in indices if i in mapping]
        coverage = len(mapped) / max(1, len(indices))
        agreement = sum(i in exact for i in indices) / max(1, len(indices))
        row = {'script_line': number, 'text_from_script': line, 'mapped_fraction': coverage,
               'exact_match_fraction': agreement, 'ear_checked': False}
        flags = []
        if mapped:
            values = [timing[j] for j in mapped]
            start, end = min(v[0] for v in values), max(v[1] for v in values)
            probabilities = [v[2] for v in values if v[2] is not None]
            row.update(start=start, end=end, min_word_probability=min(probabilities) if probabilities else None,
                       whisper_correspondence=''.join(observed[min(mapped):max(mapped)+1]))
            if coverage < .8 or agreement < .65: flags.append('歌词与识别文本匹配不足，需核对时间轴')
            if probabilities and min(probabilities) < .5: flags.append('至少一个词概率低于0.5；仅作筛查，并非准确率')
            if any(v[3] is not None and v[3] < -1 for v in values): flags.append('段平均logprob低于-1')
            if any(v[4] is not None and v[4] > .6 for v in values): flags.append('段no_speech_prob高于0.6')
            if end <= start: flags.append('时间长度异常')
            if end > start:
                aligned.append((start, end, line, number))
        else:
            flags.append('未对齐，不生成猜测时间')
        row['review_flags'] = flags
        rows.append(row)
        offset += len(clean)
    overlaps = set()
    for prev, cur in zip(aligned, aligned[1:]):
        if cur[0] < prev[1]: overlaps.update((prev[3], cur[3]))
    for row in rows:
        if row['script_line'] in overlaps: row['review_flags'].append('相邻行共用词时间区间，需人工细分')
    complete = len(aligned) == len(lines) and not overlaps
    output = Path('lyrics.srt' if complete else 'lyrics.draft.srt')
    output.write_text('\n'.join(f'{i}\n{stamp(s)} --> {stamp(e)}\n{text}\n' for i, (s,e,text,_) in enumerate(aligned,1)), encoding='utf-8')
    Path('lyrics-review.json').write_text(json.dumps({'model':a.model,'device':device,'status':'machine_aligned_not_ear_checked',
        'script_modified':False,'subtitle_file':str(output),'all_lines_aligned_without_overlap':complete,'lines':rows},ensure_ascii=False,indent=2),encoding='utf-8')
    review = ['# 歌词待核对项', '', '文字取自 script.txt；Whisper 只提供识别证据和机器时间轴。尚未经逐句听校。', '']
    for row in rows:
        if row['review_flags']:
            review.append(f"- 第 {row['script_line']} 行，{row.get('start','未对齐')}–{row.get('end','未对齐')} 秒：" + '；'.join(row['review_flags']))
    review.extend(['', '文本来源差异：第41行“只怕使你”与部分来源“只怕是你”不同；保留用户原文，需确认。'])
    Path('lyrics-review.md').write_text('\n'.join(review)+'\n',encoding='utf-8')
    print(f'Whisper done. {output}; {len(aligned)}/{len(lines)} lines aligned. See lyrics-review.md.')


if __name__ == '__main__':
    main()
