import * as vscode from 'vscode';
import { GitService } from '../git/gitService';

export interface AuthorStyle {
  type: 'imperative' | 'conventional';
  hasScope?: boolean;
  endsWithPeriod?: boolean;
}

export function detectAuthorStyle(messages: string[]): AuthorStyle {
  if (!messages || messages.length === 0) {
    return { type: 'imperative', endsWithPeriod: false };
  }

  let conventionalCount = 0;
  let imperativeCount = 0;
  let periodCount = 0;
  let scopeCount = 0;

  const conventionalRegex = /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([a-zA-Z0-9_\-\.\/]+\))?:\s*(.+)/i;

  for (const msg of messages) {
    if (msg.endsWith('.')) periodCount++;
    const convMatch = msg.match(conventionalRegex);
    if (convMatch) {
      conventionalCount++;
      if (convMatch[2]) scopeCount++;
    } else if (/^[A-Z][a-zA-Z0-9_\-]*\s+/.test(msg)) {
      imperativeCount++;
    }
  }

  return {
    type: conventionalCount > imperativeCount ? 'conventional' : 'imperative',
    hasScope: scopeCount > conventionalCount / 2,
    endsWithPeriod: periodCount > messages.length / 2,
  };
}

export function adaptCommitMessageStyle(raw: string, samples: string[]): string {
  if (!raw) return raw;
  const style = detectAuthorStyle(samples);
  let msg = raw.trim();

  if (style.type === 'imperative') {
    msg = msg.replace(/^(?:feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(?:\([^\)]+\))?!?:\s*/i, '');
    msg = msg.charAt(0).toUpperCase() + msg.slice(1);
    if (!style.endsWithPeriod) {
      msg = msg.replace(/\.+$/, '');
    } else if (!msg.endsWith('.')) {
      msg += '.';
    }
    return msg;
  } else {
    const convRegex = /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([a-zA-Z0-9_\-\.\/]+\))?!?:\s*(.+)/i;
    const match = msg.match(convRegex);
    if (match) {
      const type = match[1].toLowerCase();
      const scope = match[2] ? match[2].toLowerCase() : '';
      let desc = match[3].trim();
      desc = desc.charAt(0).toLowerCase() + desc.slice(1);
      desc = desc.replace(/\.+$/, '');
      return `${type}${scope}: ${desc}`;
    }

    let type = 'feat';
    if (/^(fix|resolve|prevent|handle|correct)\b/i.test(msg)) type = 'fix';
    else if (/^(refactor|clean|simplify)\b/i.test(msg)) type = 'refactor';
    else if (/^(doc|document|docs)\b/i.test(msg)) type = 'docs';
    else if (/^(test|tests)\b/i.test(msg)) type = 'test';
    else if (/^(chore|build|ci)\b/i.test(msg)) type = 'chore';

    let desc = msg.charAt(0).toLowerCase() + msg.slice(1);
    desc = desc.replace(/\.+$/, '');
    return `${type}: ${desc}`;
  }
}

async function getDiffForFiles(gitService: GitService, files: string[]): Promise<string> {
  const allStatus = await gitService.getStatus().catch(() => []);
  const untrackedSet = new Set(allStatus.filter(s => s.x === '?' && s.y === '?').map(s => s.path));

  const targetFiles = files && files.length > 0 ? files : allStatus.map(s => s.path);
  
  // Prioritize source files over lockfiles/data files so LLM prompt gets the most meaningful changes
  const sortedFiles = [...targetFiles].sort((a, b) => {
    const isLockA = /lock|\.json$|\.der$/i.test(a) ? 1 : 0;
    const isLockB = /lock|\.json$|\.der$/i.test(b) ? 1 : 0;
    return isLockA - isLockB;
  });

  let combinedDiff = '';
  const perFileLimit = Math.max(1500, Math.floor(10000 / (sortedFiles.length || 1)));

  for (const f of sortedFiles) {
    if (combinedDiff.length >= 10000) break;
    try {
      let diff = '';
      if (untrackedSet.has(f)) {
        diff = await gitService.getFileDiff(f);
      } else {
        diff = await gitService.exec(['diff', 'HEAD', '--', f]).catch(async () => {
          return await gitService.exec(['diff', '--', f]).catch(() => '');
        });
      }
      if (diff && diff.trim()) {
        const trimmedDiff = diff.length > perFileLimit ? diff.slice(0, perFileLimit) + '\n... (truncated)' : diff;
        combinedDiff += (combinedDiff ? '\n' : '') + trimmedDiff;
      }
    } catch {}
  }

  if (!combinedDiff.trim()) {
    try {
      combinedDiff = await gitService.getStagedDiff();
    } catch {}
  }

  return combinedDiff;
}

export async function generateAiCommitMessage(
  gitService: GitService,
  checkedFiles: string[]
): Promise<string> {
  const authorSamples = await gitService.getAuthorRecentCommitMessages(10).catch(() => []);
  const repoRoot = gitService.getCwd();
  const gitExt = vscode.extensions.getExtension('vscode.git');
  let gitRepo: any;
  if (gitExt) {
    const gitApi = gitExt.exports.getAPI(1);
    gitRepo = gitApi.repositories.find((r: any) => r.rootUri.fsPath === repoRoot || r.rootUri.path === repoRoot) || gitApi.repositories[0];
  }

  const restoreFocus = () => {
    vscode.commands.executeCommand('workbench.view.extension.intellij-git-commit');
    vscode.commands.executeCommand('intellij-git.commitView.focus');
  };
  setTimeout(restoreFocus, 30);
  setTimeout(restoreFocus, 80);

  let aiMsg = '';

  try {
    const targetDiff = await getDiffForFiles(gitService, checkedFiles);
    if (targetDiff && targetDiff.trim()) {
      if ((vscode as any).lm && typeof (vscode as any).lm.selectChatModels === 'function') {
        const models = await (vscode as any).lm.selectChatModels({ family: 'gemini-1.5-pro' }).catch(() => []);
        const model = models[0] || (await (vscode as any).lm.selectChatModels().catch(() => []))[0];
        if (model) {
          const prompt = [
            'You are an expert Git commit message generator.',
            authorSamples.length > 0
              ? `Follow the exact style, tone, and conventions of the author's recent commit messages below:\n${authorSamples.map(s => `- ${s}`).join('\n')}`
              : 'Write a concise, high quality commit message.',
            'Generate ONLY a single-line commit summary with no markdown, quotes, backticks, or extra explanation.',
            `Git diff:\n${targetDiff.slice(0, 8000)}`
          ].join('\n\n');

          const response = await model.sendRequest([
            (vscode as any).LanguageModelChatMessage.User(prompt)
          ]);
          let accumulated = '';
          for await (const chunk of response.text) {
            accumulated += chunk;
          }
          if (accumulated.trim()) {
            aiMsg = accumulated.trim().replace(/^[`'"]+|[`'"]+$/g, '');
          }
        }
      }
    }
  } catch {}

  if (!aiMsg) {
    try {
      aiMsg = (await vscode.commands.executeCommand<string>('antigravity.generateCommitMessage', repoRoot)) || '';
    } catch {}
  }

  if (!aiMsg && gitRepo?.inputBox?.value) {
    aiMsg = gitRepo.inputBox.value;
  }

  restoreFocus();

  if (aiMsg && typeof aiMsg === 'string') {
    return adaptCommitMessageStyle(aiMsg, authorSamples).trim();
  }
  return '';
}
