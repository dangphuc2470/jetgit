import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { GitService } from '../git/gitService';
import { ConflictsDialogPanel } from './conflictsDialogPanel';
import { getThemeTokens, getNonce } from '../utils/themeTokens';
import { getMergeEditorHtml } from './mergeEditorHtml';

interface ConflictHunk {
  id: number;
  type: 'common' | 'conflict';
  commonLines?: string[];
  yoursLines?: string[];
  theirsLines?: string[];
  resolved?: boolean;
  chosen?: 'yours' | 'theirs' | 'custom' | 'ignored' | null;
  resultLines?: string[];
}

export class MergeEditorPanel {
  public static currentPanel: MergeEditorPanel | undefined;
  public static readonly viewType = 'intellij-git.mergeEditor';

  private panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];
  private currentFilePath = '';

  private constructor(
    panel: vscode.WebviewPanel,
    private extensionUri: vscode.Uri,
    private gitService: GitService,
    filePath: string,
  ) {
    this.panel = panel;
    this.currentFilePath = filePath;
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    vscode.window.onDidChangeActiveColorTheme(
      () => this.sendThemeTokens(),
      null,
      this.disposables,
    );
    this.panel.webview.html = this.getHtml();
    this.panel.webview.onDidReceiveMessage(
      msg => this.handleMessage(msg),
      null,
      this.disposables,
    );
  }

  static async createOrShow(
    extensionUri: vscode.Uri,
    gitService: GitService,
    filePath: string,
  ): Promise<MergeEditorPanel> {
    const fileName = path.basename(filePath);
    if (MergeEditorPanel.currentPanel) {
      MergeEditorPanel.currentPanel.currentFilePath = filePath;
      MergeEditorPanel.currentPanel.panel.title = `Merge: ${fileName}`;
      MergeEditorPanel.currentPanel.panel.reveal(vscode.ViewColumn.Active, true);
      await MergeEditorPanel.currentPanel.loadConflictData(filePath);
      return MergeEditorPanel.currentPanel;
    }

    const panel = vscode.window.createWebviewPanel(
      MergeEditorPanel.viewType,
      `Merge: ${fileName}`,
      vscode.ViewColumn.Active,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'dist', 'webview'),
        ],
      },
    );

    MergeEditorPanel.currentPanel = new MergeEditorPanel(
      panel,
      extensionUri,
      gitService,
      filePath,
    );
    return MergeEditorPanel.currentPanel;
  }

  private async loadConflictData(filePath: string): Promise<void> {
    try {
      const fullPath = path.join(this.gitService.getCwd(), filePath);
      let fileOnDisk = '';
      if (fs.existsSync(fullPath)) {
        fileOnDisk = fs.readFileSync(fullPath, 'utf8');
      }

      let baseContent = '';
      let yoursContent = '';
      let theirsContent = '';

      try {
        baseContent = await this.gitService.exec(['show', `:1:${filePath}`]);
      } catch {}
      try {
        yoursContent = await this.gitService.exec(['show', `:2:${filePath}`]);
      } catch {}
      try {
        theirsContent = await this.gitService.exec(['show', `:3:${filePath}`]);
      } catch {}

      const conflictInfo = await this.gitService.getConflictInfo().catch(() => ({
        yoursBranch: 'HEAD',
        theirsBranch: 'Incoming',
      }));

      const hunks = this.parseConflictHunks(fileOnDisk, yoursContent, theirsContent, baseContent);

      this.panel.webview.postMessage({
        type: 'loadMergeData',
        payload: {
          filePath,
          fileName: path.basename(filePath),
          yoursBranch: conflictInfo.yoursBranch || 'Current version',
          theirsBranch: conflictInfo.theirsBranch || 'Incoming version',
          hunks,
          baseContent,
          yoursContent,
          theirsContent,
        },
      });
    } catch (err: any) {
      vscode.window.showErrorMessage(`Failed to load merge conflict data: ${err.message || err}`);
    }
  }

  private parseConflictHunks(
    fileOnDisk: string,
    yoursContent: string,
    theirsContent: string,
    baseContent: string,
  ): ConflictHunk[] {
    const hunks: ConflictHunk[] = [];
    let hunkId = 1;

    // Check if working copy on disk has conflict markers
    if (fileOnDisk.includes('<<<<<<<') && fileOnDisk.includes('=======')) {
      const lines = fileOnDisk.split(/\r?\n/);
      let currentCommon: string[] = [];
      let currentYours: string[] = [];
      let currentTheirs: string[] = [];
      let inOurs = false;
      let inTheirs = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('<<<<<<<')) {
          if (currentCommon.length > 0) {
            hunks.push({
              id: hunkId++,
              type: 'common',
              commonLines: currentCommon,
            });
            currentCommon = [];
          }
          inOurs = true;
          inTheirs = false;
          currentYours = [];
        } else if (inOurs && line.startsWith('=======')) {
          inOurs = false;
          inTheirs = true;
          currentTheirs = [];
        } else if (inTheirs && line.startsWith('>>>>>>>')) {
          inTheirs = false;
          hunks.push({
            id: hunkId++,
            type: 'conflict',
            yoursLines: currentYours,
            theirsLines: currentTheirs,
            resolved: false,
            chosen: null,
            resultLines: [],
          });
          currentYours = [];
          currentTheirs = [];
        } else {
          if (inOurs) {
            currentYours.push(line);
          } else if (inTheirs) {
            currentTheirs.push(line);
          } else {
            currentCommon.push(line);
          }
        }
      }

      if (currentCommon.length > 0) {
        hunks.push({
          id: hunkId++,
          type: 'common',
          commonLines: currentCommon,
        });
      }
      return hunks;
    }

    // Fallback: If both added or no markers, create a single conflict hunk if different
    const yLines = yoursContent ? yoursContent.split(/\r?\n/) : [];
    const tLines = theirsContent ? theirsContent.split(/\r?\n/) : [];

    if (yoursContent === theirsContent && yoursContent.length > 0) {
      return [{
        id: 1,
        type: 'common',
        commonLines: yLines,
      }];
    }

    return [{
      id: 1,
      type: 'conflict',
      yoursLines: yLines,
      theirsLines: tLines,
      resolved: false,
      chosen: null,
      resultLines: [],
    }];
  }

  private async handleMessage(msg: { type: string; payload?: any }): Promise<void> {
    switch (msg.type) {
      case 'ready': {
        this.sendThemeTokens();
        if (this.currentFilePath) {
          await this.loadConflictData(this.currentFilePath);
        }
        break;
      }
      case 'applyMerge': {
        const { filePath, content } = msg.payload;
        try {
          const fullPath = path.join(this.gitService.getCwd(), filePath);
          fs.writeFileSync(fullPath, content, 'utf8');
          await this.gitService.stageFile(filePath);

          if (ConflictsDialogPanel.currentPanel) {
            await ConflictsDialogPanel.currentPanel.refresh();
          }

          vscode.window.showInformationMessage(`Successfully resolved and staged '${path.basename(filePath)}'`);
          this.panel.dispose();
        } catch (err: any) {
          vscode.window.showErrorMessage(`Failed to apply merge: ${err?.message || err}`);
        }
        break;
      }
      case 'cancelMerge': {
        this.panel.dispose();
        break;
      }
    }
  }

  private sendThemeTokens(): void {
    const tokens = getThemeTokens();
    this.panel.webview.postMessage({
      type: 'themeTokens',
      payload: tokens,
    });
  }

  private getHtml(): string {
    const nonce = getNonce();
    const tokens = getThemeTokens();
    return getMergeEditorHtml(this.panel.webview.cspSource, nonce, tokens);
  }

  public dispose(): void {
    MergeEditorPanel.currentPanel = undefined;
    this.panel.dispose();
    while (this.disposables.length) {
      const d = this.disposables.pop();
      if (d) d.dispose();
    }
  }
}
