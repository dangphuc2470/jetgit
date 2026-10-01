import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { GitService } from '../git/gitService';

export class CommitReviewPanel {
  public static currentPanel: CommitReviewPanel | undefined;
  public static readonly viewType = 'intellij-git.commitReview';
  public static onFileNavigateListener?: (filePath: string) => void;

  private panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];
  private currentFilePath = '';
  private filesList: string[] = [];
  private isReadOnly = false;
  private lastLoadedState?: {
    filePath: string;
    diff: string;
    stagedDiff: string;
    baseContent: string;
    currentContent: string;
    readOnly: boolean;
  };

  private constructor(
    panel: vscode.WebviewPanel,
    private extensionUri: vscode.Uri,
    private gitService: GitService,
    private onStageChange?: () => void,
    readOnly = false,
  ) {
    this.panel = panel;
    this.isReadOnly = readOnly;
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

  static createOrShow(
    extensionUri: vscode.Uri,
    gitService: GitService,
    filePath: string,
    filesList: string[] = [],
    onStageChange?: () => void,
    readOnly = false,
  ): CommitReviewPanel {
    const fileName = path.basename(filePath);
    if (CommitReviewPanel.currentPanel) {
      if (onStageChange) {
        CommitReviewPanel.currentPanel.onStageChange = onStageChange;
      }
      CommitReviewPanel.currentPanel.isReadOnly = readOnly;
      CommitReviewPanel.currentPanel.panel.title = `Diff: ${fileName}`;
      CommitReviewPanel.currentPanel.panel.reveal(vscode.ViewColumn.Active, true);
      CommitReviewPanel.currentPanel.loadFile(filePath, filesList, readOnly);
      return CommitReviewPanel.currentPanel;
    }

    const panel = vscode.window.createWebviewPanel(
      CommitReviewPanel.viewType,
      `Diff: ${fileName}`,
      vscode.ViewColumn.Active,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'dist', 'webview'),
        ],
      },
    );

    CommitReviewPanel.currentPanel = new CommitReviewPanel(
      panel,
      extensionUri,
      gitService,
      onStageChange,
      readOnly,
    );
    CommitReviewPanel.currentPanel.loadFile(filePath, filesList, readOnly);
    return CommitReviewPanel.currentPanel;
  }

  public focusAndJumpDiff(direction = 1, fromFileList = false): void {
    this.panel.reveal(vscode.ViewColumn.Active, false);
    this.panel.webview.postMessage({
      type: 'jumpDiff',
      payload: { direction, fromFileList },
    });
  }

  async loadFile(
    filePath: string,
    filesList?: string[],
    readOnly?: boolean,
    focusTarget?: { focusLine: number; focusOffset: number },
  ): Promise<void> {
    this.currentFilePath = filePath;
    if (filesList) this.filesList = filesList;
    if (readOnly !== undefined) this.isReadOnly = readOnly;
    const fileName = path.basename(filePath);
    this.panel.title = `Diff: ${fileName}`;
    if (CommitReviewPanel.onFileNavigateListener) {
      CommitReviewPanel.onFileNavigateListener(filePath);
    }

    try {
      const fullPath = path.join(this.gitService.getCwd(), filePath);
      const [diff, baseContent, currentContent, stagedDiff] = await Promise.all([
        this.gitService.getFileDiff(filePath).catch(() => ''),
        this.gitService.exec(['show', `HEAD:${filePath}`]).catch(() => ''),
        (async () => {
          try {
            if (fs.existsSync(fullPath)) {
              return fs.readFileSync(fullPath, 'utf8');
            }
          } catch {}
          return '';
        })(),
        this.gitService.exec(['diff', '--cached', '--', filePath]).catch(() => '')
      ]);
      const isSameFile = this.lastLoadedState && this.lastLoadedState.filePath === filePath;
      const isUnchanged = isSameFile &&
        this.lastLoadedState!.diff === diff &&
        this.lastLoadedState!.stagedDiff === stagedDiff &&
        this.lastLoadedState!.baseContent === baseContent &&
        this.lastLoadedState!.currentContent === currentContent &&
        this.lastLoadedState!.readOnly === this.isReadOnly &&
        !focusTarget;

      if (isUnchanged) {
        return;
      }

      this.lastLoadedState = {
        filePath,
        diff,
        stagedDiff,
        baseContent,
        currentContent,
        readOnly: this.isReadOnly,
      };

      const currentFileIndex = this.filesList.indexOf(filePath);
      this.panel.webview.postMessage({
        type: 'fileDiff',
        payload: {
          path: filePath,
          fileName,
          fileDir: path.dirname(filePath) === '.' ? '' : path.dirname(filePath),
          diff,
          stagedDiff,
          baseContent,
          currentContent,
          filesList: this.filesList,
          currentFileIndex: currentFileIndex !== -1 ? currentFileIndex : 0,
          readOnly: this.isReadOnly,
          focusTarget,
        },
      });
    } catch (err: any) {
      vscode.window.showErrorMessage(`Failed to load diff: ${err.message}`);
    }
  }

  private async handleMessage(msg: { type: string; payload?: any }): Promise<void> {
    switch (msg.type) {
      case 'ready': {
        this.sendThemeTokens();
        if (this.currentFilePath) {
          this.loadFile(this.currentFilePath, this.filesList);
        }
        break;
      }
      case 'refreshDiff': {
        const filePath = msg.payload || this.currentFilePath;
        this.loadFile(filePath, this.filesList);
        break;
      }
      case 'navigateFile': {
        const newIndex = msg.payload as number;
        if (newIndex >= 0 && newIndex < this.filesList.length) {
          const newPath = this.filesList[newIndex];
          this.loadFile(newPath, this.filesList);
        }
        break;
      }
      case 'updateBlockStage': {
        const { filePath, stagedContent, stagedCount, totalCount } = msg.payload;
        try {
          if (stagedCount === 0) {
            await this.gitService.unstageFile(filePath);
          } else if (stagedCount === totalCount) {
            await this.gitService.stageFile(filePath);
          } else {
            await this.gitService.stageFileContent(filePath, stagedContent);
          }
          if (this.onStageChange) this.onStageChange();
          let stagedDiff = '';
          try {
            stagedDiff = await this.gitService.exec(['diff', '--cached', '--', filePath]);
          } catch {
            stagedDiff = '';
          }
          this.panel.webview.postMessage({
            type: 'stagedDiffUpdated',
            payload: { stagedDiff },
          });
        } catch (err: any) {
          vscode.window.showErrorMessage(`Update stage failed: ${err.message}`);
        }
        break;
      }
      case 'revertBlockContent': {
        const { filePath, newContent } = msg.payload;
        try {
          const fullPath = path.join(this.gitService.getCwd(), filePath);
          fs.writeFileSync(fullPath, newContent, 'utf8');
          if (this.onStageChange) this.onStageChange();
          await this.loadFile(this.currentFilePath, this.filesList, this.isReadOnly);
        } catch (err: any) {
          vscode.window.showErrorMessage(`Revert failed: ${err.message}`);
        }
        break;
      }
      case 'saveFileContent': {
        const { filePath, content, focusLine, focusOffset } = msg.payload;
        try {
          const fullPath = path.join(this.gitService.getCwd(), filePath);
          fs.writeFileSync(fullPath, content, 'utf8');
          if (this.onStageChange) this.onStageChange();
          await this.loadFile(this.currentFilePath, this.filesList, this.isReadOnly, { focusLine, focusOffset });
        } catch (err: any) {
          vscode.window.showErrorMessage(`Save failed: ${err.message}`);
        }
        break;
      }
      case 'applyHunkPatch': {
        const { patch, reverse } = msg.payload;
        try {
          await this.gitService.applyHunkPatch(patch, reverse);
          if (this.onStageChange) this.onStageChange();
          this.loadFile(this.currentFilePath, this.filesList);
        } catch (err: any) {
          vscode.window.showErrorMessage(`Apply patch failed: ${err.message}`);
        }
        break;
      }
      case 'openFile': {
        const filePath = msg.payload as string;
        if (filePath) {
          const fullPath = path.join(this.gitService.getCwd(), filePath);
          vscode.commands.executeCommand('vscode.open', vscode.Uri.file(fullPath));
        }
        break;
      }
      case 'rollbackHunk': {
        const { patch } = msg.payload;
        try {
          await this.gitService.applyHunkPatch(patch, true);
          if (this.onStageChange) this.onStageChange();
          this.loadFile(this.currentFilePath, this.filesList);
          vscode.window.showInformationMessage('Hunk rolled back.');
        } catch (err: any) {
          vscode.window.showErrorMessage(`Rollback hunk failed: ${err.message}`);
        }
        break;
      }
    }
  }

  public getCurrentFilePath(): string {
    return this.currentFilePath;
  }

  public refresh(): void {
    if (this.currentFilePath) {
      this.loadFile(this.currentFilePath, this.filesList);
    }
  }

  private sendThemeTokens(): void {
    const tokens = this.getThemeTokens();
    this.panel.webview.postMessage({
      type: 'themeTokens',
      payload: tokens,
    });
  }

  private getThemeTokens(): Record<string, string> {
    const defaultTokens: Record<string, string> = {
      kwd: '#fd6883',
      type: '#85dacc',
      fn: '#adda78',
      str: '#f9cc6c',
      num: '#a8a9eb',
      constVal: '#a8a9eb',
      varVal: '#fff1f3',
      comment: '#72696a',
      anno: '#85dacc',
      punct: '#948a8b',
    };
    try {
      const activeThemeName = vscode.workspace.getConfiguration('workbench').get<string>('colorTheme');
      if (!activeThemeName) return defaultTokens;

      for (const ext of vscode.extensions.all) {
        const themes = ext.packageJSON?.contributes?.themes;
        if (!Array.isArray(themes)) continue;
        const matched = themes.find((t: any) => t.label === activeThemeName || t.id === activeThemeName);
        if (!matched || !matched.path) continue;

        const themePath = path.join(ext.extensionPath, matched.path);
        if (!fs.existsSync(themePath)) continue;

        let content = fs.readFileSync(themePath, 'utf8');
        content = content.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1');
        const themeJson = JSON.parse(content);
        const tc = themeJson.tokenColors || [];

        const findColor = (targetScopes: string[]): string | null => {
          for (const target of targetScopes) {
            for (const rule of tc) {
              if (!rule.settings || !rule.settings.foreground) continue;
              const scopes = Array.isArray(rule.scope) ? rule.scope : (typeof rule.scope === 'string' ? rule.scope.split(',').map((s: string) => s.trim()) : []);
              if (scopes.includes(target)) return rule.settings.foreground;
            }
          }
          for (const target of targetScopes) {
            for (const rule of tc) {
              if (!rule.settings || !rule.settings.foreground) continue;
              const scopes = Array.isArray(rule.scope) ? rule.scope : (typeof rule.scope === 'string' ? rule.scope.split(',').map((s: string) => s.trim()) : []);
              for (const s of scopes) {
                if (!s.includes(' ') && s.startsWith(target + '.')) return rule.settings.foreground;
              }
            }
          }
          return null;
        };

        const kwd = findColor(['keyword']) || defaultTokens.kwd;
        const type = findColor(['entity.name.type', 'support.type', 'storage.type']) || defaultTokens.type;
        const fn = findColor(['entity.name.function', 'support.function']) || defaultTokens.fn;
        const str = findColor(['string']) || defaultTokens.str;
        const num = findColor(['constant.numeric']) || defaultTokens.num;
        const constVal = findColor(['constant.language']) || defaultTokens.constVal;
        const comment = findColor(['comment']) || defaultTokens.comment;
        const varVal = findColor(['variable']) || defaultTokens.varVal;
        const anno = findColor(['punctuation.definition.annotation', 'meta.annotation']) || type;
        const punct = findColor(['punctuation']) || defaultTokens.punct;

        return { kwd, type, fn, str, num, constVal, varVal, comment, anno, punct };
      }
    } catch {
      // Fall back to defaults
    }
    return defaultTokens;
  }

  private getHtml(): string {
    const scriptUri = this.panel.webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview', 'commit', 'review.js'),
    );
    const styleUri = this.panel.webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview', 'commit', 'commit.css'),
    );
    const nonce = getNonce();
    const tokens = this.getThemeTokens();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none'; style-src 'unsafe-inline' ${this.panel.webview.cspSource}; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="${styleUri}">
  <style id="dynamic-syntax-tokens">
    :root {
      --syn-kwd: ${tokens.kwd} !important;
      --syn-type: ${tokens.type} !important;
      --syn-fn: ${tokens.fn} !important;
      --syn-str: ${tokens.str} !important;
      --syn-num: ${tokens.num} !important;
      --syn-const: ${tokens.constVal} !important;
      --syn-var: ${tokens.varVal} !important;
      --syn-comment: ${tokens.comment} !important;
      --syn-anno: ${tokens.anno} !important;
      --syn-punct: ${tokens.punct} !important;
    }
  </style>
  <title>Code Review</title>
</head>
<body>
  <div id="app"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }

  private dispose(): void {
    CommitReviewPanel.currentPanel = undefined;
    for (const d of this.disposables) d.dispose();
  }
}

function getNonce(): string {
  let text = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}
