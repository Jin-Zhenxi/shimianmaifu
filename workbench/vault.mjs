import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {atomic} from './store.mjs';

// Only this module handles the secret. Nothing returned to the browser contains the key.
export class Vault {
  constructor({file, crypt} = {}) {
    this.file = file || path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), '.local/share'), 'MVWorkbench', 'deepseek.dpapi');
    this.crypt = crypt || dpapi; this.key = ''; this.mode = 'temporary'; this.model = 'deepseek-flash'; this.notice = '';
  }
  status() { return {configured: Boolean(this.key), mode: this.mode, model: this.model, notice: this.notice}; }
  async init() {
    try {
      const data = JSON.parse(await this.crypt('decrypt', await fs.readFile(this.file, 'utf8')));
      this.key = data.key; this.model = data.model; this.mode = 'permanent';
    } catch (e) { if (e.code !== 'ENOENT') this.notice = '保存的凭证无法读取，请重新填写或清除。'; }
  }
  async set(key, mode, model) {
    if (typeof key !== 'string' || !/^sk-[A-Za-z0-9_-]{8,300}$/.test(key)) throw Error('请填写有效的 DeepSeek API Key（以 sk- 开头）');
    if (!['temporary', 'permanent'].includes(mode)) throw Error('请选择临时或永久');
    if (!['deepseek-flash', 'deepseek-v4-pro'].includes(model)) throw Error('请选择支持的 DeepSeek 模型');
    if (mode === 'permanent') {
      const encrypted = await this.crypt('encrypt', JSON.stringify({key, model}));
      await atomic(this.file, encrypted);
    } else {
      // Changing from permanent to temporary must remove the previous saved copy.
      await fs.rm(this.file, {force: true});
    }
    this.key = key; this.mode = mode; this.model = model; this.notice = '';
  }
  async clear() { await fs.rm(this.file, {force: true}); this.key = ''; this.mode = 'temporary'; this.notice = ''; }
  complete() { if (this.mode === 'temporary') this.key = ''; }
  dispose() { this.key = ''; }
  redact(value) {
    let s = String(value); if (this.key) s = s.split(this.key).join('[已隐藏凭证]');
    return s.replace(/sk-[A-Za-z0-9_-]{8,}/g, '[已隐藏凭证]');
  }
}
export function dpapi(action, input) {
  if (process.platform !== 'win32') return Promise.reject(Error('永久保存需要 Windows 用户加密功能；请使用临时模式'));
  return new Promise((resolve, reject) => {
    const child = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File',
      fileURLToPath(new URL('./credential.ps1', import.meta.url)), '-Action', action], {windowsHide: true, stdio: ['pipe','pipe','pipe']});
    let output = ''; const timer = setTimeout(() => { child.kill(); reject(Error('本机加密操作超时')); }, 15000);
    child.stdout.on('data', b => output += b); child.stderr.resume();
    child.on('error', () => { clearTimeout(timer); reject(Error('无法调用 Windows 凭证加密功能')); });
    child.on('close', code => { clearTimeout(timer); code === 0 ? resolve(output.trim()) : reject(Error('本机凭证加密失败')); });
    child.stdin.on('error', () => {}); child.stdin.end(Buffer.from(input, 'utf8').toString('base64'));
  });
}
