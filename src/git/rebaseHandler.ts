import { execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as vscode from 'vscode';
import type { Commit } from './gitService';

const execFileAsync = promisify(execFile);
const writeFileAsync = promisify(fs.writeFile);
const mkdtempAsync = promisify(fs.mkdtemp);
const unlinkAsync = promisify(fs.unlink);
const rmdirAsync = promisify(fs.rmdir);

export type RebaseAction = 'pick' | 'reword' | 'edit' | 'squash' | 'fixup' | 'drop';

export interface RebaseTodoItem {
  action: RebaseAction;
  hash: string;
  message: string;
}

export class RebaseHandler {
  constructor(private cwd: string) {}

  /**
   * Execute an interactive rebase using a custom GIT_SEQUENCE_EDITOR
   * that writes the todo list we provide.
   */
  async executeRebase(base: string, todoItems: RebaseTodoItem[]): Promise<{ success: boolean; error?: string }> {
    // Build the todo file content
    const todoContent = todoItems
      .map(item => `${item.action} ${item.hash} ${item.message}`)
      .join('\n') + '\n';

    // Create a temp directory for the script
    const tmpDir = await mkdtempAsync(path.join(os.tmpdir(), 'ijgit-rebase-'));
    const todoPath = path.join(tmpDir, 'todo');
    const scriptPath = path.join(tmpDir, 'editor.sh');

    try {
      // Write the todo content
      await writeFileAsync(todoPath, todoContent, 'utf-8');

      // Write a shell script that copies our todo into the git-rebase-todo file
      // The sequence editor receives the todo file path as $1
      await writeFileAsync(scriptPath, `#!/bin/sh\ncp "${todoPath}" "$1"\n`, {
        mode: 0o755,
        encoding: 'utf-8',
      });

      const { stdout, stderr } = await execFileAsync('git', ['rebase', '-i', base], {
        cwd: this.cwd,
        env: {
          ...process.env,
          GIT_SEQUENCE_EDITOR: scriptPath,
        },
        maxBuffer: 5 * 1024 * 1024,
      });

      return { success: true };
    } catch (err: any) {
      const stderr = err.stderr || err.message || String(err);
      // Check if it's a conflict
      if (stderr.includes('CONFLICT') || stderr.includes('could not apply')) {
        return { success: false, error: 'conflict' };
      }
      return { success: false, error: stderr };
    } finally {
      // Clean up temp files
      try {
        await unlinkAsync(todoPath);
        await unlinkAsync(scriptPath);
        await rmdirAsync(tmpDir);
      } catch {
        // Ignore cleanup errors
      }
    }
  }

  async abortRebase(): Promise<void> {
    await execFileAsync('git', ['rebase', '--abort'], { cwd: this.cwd });
  }

  async continueRebase(): Promise<{ success: boolean; error?: string }> {
    try {
      await execFileAsync('git', ['rebase', '--continue'], {
        cwd: this.cwd,
        env: {
          ...process.env,
          GIT_EDITOR: 'true', // Accept default message
        },
      });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.stderr || err.message };
    }
  }

  async isRebaseInProgress(): Promise<boolean> {
    try {
      const rebaseMergePath = path.join(this.cwd, '.git', 'rebase-merge');
      const rebaseApplyPath = path.join(this.cwd, '.git', 'rebase-apply');
      return fs.existsSync(rebaseMergePath) || fs.existsSync(rebaseApplyPath);
    } catch {
      return false;
    }
  }
}
