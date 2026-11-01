import * as fs from 'fs';
import * as path from 'path';
import { exec, execFile } from 'child_process';
import type { StatusEntry } from '../gitTypes';

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
  const status = await ctx.getStatus().catch(() => []);
  const entry = status.find(s => s.path === filePath || s.path.endsWith('/' + filePath) || filePath.endsWith('/' + s.path));
  if (entry && entry.x === '?' && entry.y === '?') {
    try {
      const fullPath = path.isAbsolute(filePath)
        ? filePath
        : (fs.existsSync(path.join(ctx.cwd, filePath)) ? path.join(ctx.cwd, filePath) : path.join(ctx.cwd, entry.path));
      if (fs.existsSync(fullPath) && !fs.statSync(fullPath).isDirectory()) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split('\n');
        const diffHeader = `--- /dev/null\n+++ b/${filePath}\n@@ -0,0 +1,${lines.length} @@\n`;
        return diffHeader + lines.map(l => `+${l}`).join('\n');
      }
    } catch {
      return '';
    }
  }
  try {
    const diff = await ctx.exec(['diff', 'HEAD', '--', filePath]);
    if (diff.trim()) return diff;
    const diffRel = await ctx.exec(['diff', 'HEAD', '--', `./${filePath}`]).catch(() => '');
    if (diffRel.trim()) return diffRel;
    return await ctx.exec(['diff', '--', filePath]);
  } catch {
    try {
      return await ctx.exec(['diff', '--', `./${filePath}`]);
    } catch {
      return '';
    }
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

export interface SkippedFileEntry {
  path: string;
  name: string;
  dir: string;
  mode: 'skip-worktree' | 'assume-unchanged';
  hasLocalChanges: boolean;
  repoName?: string;
  repoPath?: string;
}

export async function getSkippedFiles(
  ctx: StagingExecContext,
  repoName?: string,
  repoPath?: string
): Promise<SkippedFileEntry[]> {
  try {
    let out = '';
    const isWin = process.platform === 'win32';
    const shellCmd = isWin
      ? `git ls-files -v | findstr /R "^[Shm]"`
      : `git ls-files -v | grep -E '^[Shm]'`;

    try {
      out = await new Promise<string>((resolve) => {
        exec(shellCmd, { cwd: ctx.cwd, maxBuffer: 10 * 1024 * 1024 }, (err, stdout) => {
          // grep / findstr returns exit code 1 if no match is found; this is normal
          if (err && (!err.code || (err.code !== 1 && !stdout))) {
            resolve('');
          } else {
            resolve(stdout || '');
          }
        });
      });
    } catch {
      out = '';
    }

    // Fallback: If shell pipe produced nothing (or failed due to missing grep/findstr),
    // fetch only if ctx.exec works
    if (!out) {
      try {
        const raw = await ctx.exec(['ls-files', '-v']);
        const matched: string[] = [];
        for (const l of raw.split('\n')) {
          if (l.startsWith('S ') || l.startsWith('h ') || l.startsWith('m ')) {
            matched.push(l);
          }
        }
        out = matched.join('\n');
      } catch {
        out = '';
      }
    }

    const lines = out.split('\n').filter((l) => l.trim().length > 0);
    if (lines.length === 0) {
      return [];
    }

    const dirtyFiles = new Set<string>();
    const filePathsToInspect: string[] = [];
    for (const line of lines) {
      const p = line.slice(2).trim();
      if (p) filePathsToInspect.push(p);
    }

    if (filePathsToInspect.length > 0) {
      try {
        const stageOut = await ctx.exec(['ls-files', '-s', '--', ...filePathsToInspect]);
        const indexShaMap = new Map<string, string>();
        for (const sLine of stageOut.split('\n')) {
          const tabIdx = sLine.indexOf('\t');
          if (tabIdx !== -1) {
            const meta = sLine.slice(0, tabIdx).trim().split(/\s+/);
            const pathName = sLine.slice(tabIdx + 1).trim();
            if (meta[1]) {
              indexShaMap.set(pathName, meta[1]);
            }
          }
        }

        for (const fp of filePathsToInspect) {
          const fullPath = path.resolve(ctx.cwd, fp);
          if (!fs.existsSync(fullPath)) {
            dirtyFiles.add(fp);
            continue;
          }
          const indexSha = indexShaMap.get(fp);
          if (indexSha) {
            try {
              const diskSha = (await ctx.exec(['hash-object', '--', fp])).trim();
              if (diskSha && diskSha !== indexSha) {
                dirtyFiles.add(fp);
              }
            } catch {
              dirtyFiles.add(fp);
            }
          }
        }
      } catch {}
    }

    const results: SkippedFileEntry[] = [];
    for (const line of lines) {
      const flag = line[0];
      const filePath = line.slice(2).trim();
      if (!filePath) continue;

      if (flag === 'S' || flag === 'h' || flag === 'm') {
        const mode = flag === 'S' ? 'skip-worktree' : 'assume-unchanged';
        const p = filePath.replace(/\\/g, '/');
        const lastSlash = p.lastIndexOf('/');
        const name = lastSlash !== -1 ? p.slice(lastSlash + 1) : p;
        const dir = lastSlash !== -1 ? p.slice(0, lastSlash) : '';

        results.push({
          path: p,
          name,
          dir,
          mode,
          hasLocalChanges: dirtyFiles.has(filePath) || dirtyFiles.has(p),
          repoName,
          repoPath: repoPath || ctx.cwd,
        });
      }
    }
    return results;
  } catch {
    return [];
  }
}

export async function unskipFile(
  ctx: StagingExecContext,
  filePath: string
): Promise<void> {
  await ctx.exec(['update-index', '--no-skip-worktree', '--', filePath]);
  await ctx.exec(['update-index', '--no-assume-unchanged', '--', filePath]);
}

export async function skipFile(
  ctx: StagingExecContext,
  filePath: string
): Promise<void> {
  await ctx.exec(['update-index', '--skip-worktree', '--', filePath]);
}
