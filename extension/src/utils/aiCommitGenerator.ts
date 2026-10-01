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

export async function generateAiCommitMessage(
  gitService: GitService,
  checkedFiles: string[]
): Promise<string> {
  const assumedFiles: string[] = [];
  const temporarilyUnstaged: string[] = [];

  try {
    const allStatus = await gitService.getStatus();
    const trackedToMask: string[] = [];

    for (const s of allStatus) {
      const isUntracked = s.x === '?' && s.y === '?';
      const isChecked = checkedFiles.includes(s.path);

      if (isChecked) {
        if (s.y !== ' ' && s.x === ' ') {
          await gitService.stageFiles([s.path]);
        } else if (isUntracked) {
          await gitService.stageFiles([s.path]);
        }
        if (s.y !== ' ' && s.x !== ' ') {
          trackedToMask.push(s.path);
        }
      } else {
        if (s.x !== ' ' && s.x !== '?') {
          temporarilyUnstaged.push(s.path);
          await gitService.unstageFile(s.path);
        }
        if (!isUntracked) {
          trackedToMask.push(s.path);
        }
      }
    }

    if (trackedToMask.length > 0) {
      await gitService.setAssumeUnchanged(trackedToMask, true);
      assumedFiles.push(...trackedToMask);
    }

    const authorSamples = await gitService.getAuthorRecentCommitMessages(10);
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
    setTimeout(restoreFocus, 180);
    setTimeout(restoreFocus, 350);

    let aiMsg = '';

    try {
      if ((vscode as any).lm && typeof (vscode as any).lm.selectChatModels === 'function') {
        const models = await (vscode as any).lm.selectChatModels({ family: 'gemini-1.5-pro' }).catch(() => []);
        const model = models[0] || (await (vscode as any).lm.selectChatModels().catch(() => []))[0];
        if (model) {
          const stagedDiff = await gitService.getStagedDiff();
          if (stagedDiff && stagedDiff.trim()) {
            const prompt = [
              'You are an expert Git commit message generator.',
              authorSamples.length > 0
                ? `Follow the exact style, tone, and conventions of the author's recent commit messages below:\n${authorSamples.map(s => `- ${s}`).join('\n')}`
                : 'Write a concise, high quality commit message.',
              'Generate ONLY a single-line commit summary with no markdown, quotes, backticks, or extra explanation.',
              `Git diff:\n${stagedDiff.slice(0, 8000)}`
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
      aiMsg = (await vscode.commands.executeCommand<string>('antigravity.generateCommitMessage', repoRoot)) || '';
    }

    if (!aiMsg && gitRepo?.inputBox?.value) {
      aiMsg = gitRepo.inputBox.value;
    }

    restoreFocus();

    if (aiMsg && typeof aiMsg === 'string') {
      return adaptCommitMessageStyle(aiMsg, authorSamples).trim();
    }
    return '';
  } finally {
    if (assumedFiles.length > 0) {
      await gitService.setAssumeUnchanged(assumedFiles, false);
    }
    if (temporarilyUnstaged.length > 0) {
      await gitService.stageFiles(temporarilyUnstaged);
    }
  }
}
