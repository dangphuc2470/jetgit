import { execFile } from 'child_process';
import { promisify } from 'util';
import { LRUCache } from '../cache';

const execFileAsync = promisify(execFile);

export interface BlameLine {
  hash: string;
  author: string;
  authorEmail: string;
  authorDate: string; // ISO timestamp
  summary: string;
  lineNumber: number;
  content: string;
}

export interface BlameResult {
  lines: BlameLine[];
  file: string;
}

const blameCache = new LRUCache<string, BlameResult>(200);

export function invalidateBlameCache(file: string): void {
  blameCache.delete(file);
}

export function clearBlameCache(): void {
  blameCache.clear();
}

export async function getBlame(cwd: string, file: string): Promise<BlameResult> {
  const cacheKey = `${cwd}:${file}`;
  const cached = blameCache.get(cacheKey);
  if (cached) return cached;

  const { stdout } = await execFileAsync('git', [
    'blame', '--line-porcelain', file,
  ], {
    cwd,
    maxBuffer: 10 * 1024 * 1024,
  });

  const lines = parseLinePorcelain(stdout);
  const result: BlameResult = { lines, file };
  blameCache.set(cacheKey, result);
  return result;
}

function parseLinePorcelain(output: string): BlameLine[] {
  const results: BlameLine[] = [];
  const rawLines = output.split('\n');
  let i = 0;

  while (i < rawLines.length) {
    const headerLine = rawLines[i];
    if (!headerLine || !headerLine.match(/^[0-9a-f]{40}\s/)) {
      i++;
      continue;
    }

    const headerParts = headerLine.split(' ');
    const hash = headerParts[0];
    const lineNumber = parseInt(headerParts[2], 10);

    let author = '';
    let authorEmail = '';
    let authorDate = '';
    let summary = '';
    let content = '';
    i++;

    // Read key-value pairs until we hit a tab-prefixed content line
    while (i < rawLines.length) {
      const line = rawLines[i];
      if (line.startsWith('\t')) {
        content = line.slice(1);
        i++;
        break;
      }
      const spaceIdx = line.indexOf(' ');
      if (spaceIdx !== -1) {
        const key = line.slice(0, spaceIdx);
        const value = line.slice(spaceIdx + 1);
        switch (key) {
          case 'author': author = value; break;
          case 'author-mail': authorEmail = value.replace(/[<>]/g, ''); break;
          case 'author-time': {
            const ts = parseInt(value, 10);
            authorDate = new Date(ts * 1000).toISOString();
            break;
          }
          case 'summary': summary = value; break;
        }
      }
      i++;
    }

    results.push({ hash, author, authorEmail, authorDate, summary, lineNumber, content });
  }

  return results;
}
