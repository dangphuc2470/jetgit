import * as fs from 'fs';
import * as path from 'path';
import { execFile } from 'child_process';
import { StatusEntry } from '../gitTypes';

export interface StagingExecContext {
  cwd: string;
  exec(args: string[], maxBuffer?: number, retries?: number): Promise<string>;
  getStatus(): Promise<StatusEntry[]>;
}

export async function getStatus(ctx: StagingExecContext): Promise<StatusEntry[]> {
  const output = await ctx.exec(['status', '--porcelain=v1', '-uall']);
  const entries: StatusEntry[] = [];
  for (const line of output.split('\n')) {
    if (!line) continue;
    const x = line[0];
    const y = line[1];
    const rest = line.slice(3);
    const arrowIdx = rest.indexOf(' -> ');
    if (arrowIdx !== -1) {
      entries.push({
        x, y,
        origPath: rest.slice(0, arrowIdx),
        path: rest.slice(arrowIdx + 4),
      });
    } else {
      entries.push({ x, y, path: rest });
    }
  }
  return entries;
}

export async function stageFiles(ctx: StagingExecContext, paths: string[]): Promise<void> {
  if (!paths || paths.length === 0) return;
  const existing: string[] = [];
  const missing: string[] = [];
  for (const p of paths) {
    const full = path.isAbsolute(p) ? p : path.join(ctx.cwd, p);
    if (fs.existsSync(full)) {
      existing.push(p);
    } else {
      missing.push(p);
    }
  }
  if (existing.length > 0) {
    await ctx.exec(['add', '--', ...existing]);
  }
  if (missing.length > 0) {
    await ctx.exec(['rm', '--cached', '--ignore-unmatch', '--', ...missing]);
  }
}

export async function stageFileContent(ctx: StagingExecContext, filePath: string, content: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = execFile('git', ['hash-object', '-w', '--stdin'], { cwd: ctx.cwd }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || err.message));
      const sha = stdout.trim();
      ctx.exec(['update-index', '--cacheinfo', `100644,${sha},${filePath}`])
        .then(() => resolve())
        .catch(reject);
    });
    proc.stdin?.write(content);
    proc.stdin?.end();
  });
}

export async function unstageFiles(ctx: StagingExecContext, paths: string[]): Promise<void> {
  await ctx.exec(['reset', 'HEAD', '--', ...paths]);
}

export async function rollbackFiles(ctx: StagingExecContext, paths: string[]): Promise<void> {
  const status = await ctx.getStatus();
  const untracked = new Set(status.filter(s => s.x === '?' && s.y === '?').map(s => s.path));
  const toClean: string[] = [];
  const toRestore: string[] = [];
  for (const p of paths) {
    if (untracked.has(p)) {
      toClean.push(p);
    } else {
      toRestore.push(p);
    }
  }
  if (toRestore.length > 0) {
    try {
      await ctx.exec(['checkout', 'HEAD', '--', ...toRestore]);
    } catch {
      await ctx.exec(['restore', '--staged', '--worktree', '--', ...toRestore]);
    }
  }
  for (const p of toClean) {
    try {
      const fullPath = path.join(ctx.cwd, p);
      if (fs.existsSync(fullPath)) {
        if (fs.statSync(fullPath).isDirectory()) {
          fs.rmSync(fullPath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(fullPath);
        }
      }
    } catch {}
  }
}

export async function getFileDiff(ctx: StagingExecContext, filePath: string): Promise<string> {
  const status = await ctx.getStatus();
  const entry = status.find(s => s.path === filePath);
  if (entry && entry.x === '?' && entry.y === '?') {
    try {
      const fullPath = path.join(ctx.cwd, filePath);
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      const diffHeader = `--- /dev/null\n+++ b/${filePath}\n@@ -0,0 +1,${lines.length} @@\n`;
      return diffHeader + lines.map(l => `+${l}`).join('\n');
    } catch {
      return '';
    }
  }
  try {
    const diff = await ctx.exec(['diff', 'HEAD', '--', filePath]);
    if (diff.trim()) return diff;
    return await ctx.exec(['diff', '--', filePath]);
  } catch {
    return await ctx.exec(['diff', '--', filePath]);
  }
}

export async function applyHunkPatch(ctx: StagingExecContext, patchContent: string, reverse = false): Promise<string> {
  return new Promise((resolve, reject) => {
    const args = ['apply', '--cached', '--recount', '--whitespace=nowarn'];
    if (reverse) args.push('--reverse');
    args.push('-');
    const proc = execFile('git', args, { cwd: ctx.cwd }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || err.message));
      resolve(stdout);
    });
    proc.stdin?.write(patchContent);
    proc.stdin?.end();
  });
}
