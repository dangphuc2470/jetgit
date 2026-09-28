import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { GitService } from '../git/gitService';

export class CommitReviewPanel {
  public static currentPanel: CommitReviewPanel | undefined;
  public static readonly viewType = 'intellij-git.commitReview';

  private panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];
  private currentFilePath = '';
  private filesList: string[] = [];

  private constructor(
    panel: vscode.WebviewPanel,
    private extensionUri: vscode.Uri,
    private gitService: GitService,
    private onStageChange?: () => void,
  ) {
    this.panel = panel;
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
  ): CommitReviewPanel {
    const fileName = path.basename(filePath);
    if (CommitReviewPanel.currentPanel) {
      CommitReviewPanel.currentPanel.panel.title = `Diff: ${fileName}`;
      CommitReviewPanel.currentPanel.panel.reveal(vscode.ViewColumn.Active, true);
      CommitReviewPanel.currentPanel.loadFile(filePath, filesList);
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
    );
    CommitReviewPanel.currentPanel.loadFile(filePath, filesList);
    return CommitReviewPanel.currentPanel;
  }

  async loadFile(filePath: string, filesList?: string[]): Promise<void> {
    this.currentFilePath = filePath;
    if (filesList) this.filesList = filesList;
    const fileName = path.basename(filePath);
    this.panel.title = `Diff: ${fileName}`;

    try {
      const diff = await this.gitService.getFileDiff(filePath);
      let baseContent = '';
      try {
        baseContent = await this.gitService.exec(['show', `HEAD:${filePath}`]);
      } catch {
        baseContent = '';
      }
      let currentContent = '';
      try {
        const fullPath = path.join(this.gitService.getCwd(), filePath);
        if (require('fs').existsSync(fullPath)) {
          currentContent = require('fs').readFileSync(fullPath, 'utf8');
        }
      } catch {
        currentContent = '';
      }
      const currentFileIndex = this.filesList.indexOf(filePath);
      this.panel.webview.postMessage({
        type: 'fileDiff',
        payload: {
          path: filePath,
          fileName,
          fileDir: path.dirname(filePath) === '.' ? '' : path.dirname(filePath),
          diff,
          baseContent,
          currentContent,
          filesList: this.filesList,
          currentFileIndex: currentFileIndex !== -1 ? currentFileIndex : 0,
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
