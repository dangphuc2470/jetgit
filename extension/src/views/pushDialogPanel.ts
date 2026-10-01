import * as vscode from 'vscode';
import * as path from 'path';
import { GitService } from '../git/gitService';
import { CommitReviewPanel } from './commitReviewPanel';

export class PushDialogPanel {
  public static currentPanel: PushDialogPanel | undefined;
  public static readonly viewType = 'intellij-git.pushDialogWindow';

  private panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];

  private constructor(
    panel: vscode.WebviewPanel,
    private extensionUri: vscode.Uri,
    private gitService: GitService,
    private pushInfo: any,
  ) {
    this.panel = panel;
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
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
    targetBranch?: string,
  ): Promise<PushDialogPanel | undefined> {
    try {
      const pushInfo = await gitService.getPushInfo(targetBranch);
      if (!pushInfo) {
        vscode.window.showInformationMessage('No branch or commits found to push.');
        return undefined;
      }

      if (PushDialogPanel.currentPanel) {
        PushDialogPanel.currentPanel.panel.reveal();
        PushDialogPanel.currentPanel.update(pushInfo);
        return PushDialogPanel.currentPanel;
      }

      const panel = vscode.window.createWebviewPanel(
        PushDialogPanel.viewType,
        `Push Commits - ${pushInfo.currentBranch}`,
        vscode.ViewColumn.Active,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
          localResourceRoots: [
            vscode.Uri.joinPath(extensionUri, 'dist', 'webview'),
            vscode.Uri.joinPath(extensionUri, 'resources'),
          ],
        },
      );

      PushDialogPanel.currentPanel = new PushDialogPanel(
        panel,
        extensionUri,
        gitService,
        pushInfo,
      );

      // Move Webview to its own floating auxiliary window
      try {
        await vscode.commands.executeCommand('workbench.action.moveEditorToNewWindow');
      } catch {
        // Fallback gracefully if auxiliary windows are disabled or not supported
      }

      return PushDialogPanel.currentPanel;
    } catch (err: any) {
      vscode.window.showErrorMessage(`Failed to open Push dialog: ${err?.message || err}`);
      return undefined;
    }
  }

  public update(pushInfo: any): void {
    this.pushInfo = pushInfo;
    this.panel.title = `Push Commits - ${pushInfo.currentBranch}`;
    this.panel.webview.postMessage({
      type: 'updatePushInfo',
      payload: pushInfo,
    });
  }

  private async handleMessage(msg: any): Promise<void> {
    switch (msg.type) {
      case 'close': {
        this.dispose();
        break;
      }
      case 'openReviewInCenter': {
        const { filePath, commitHash, filesList } = msg.payload || {};
        if (filePath) {
          let revisions: any = undefined;
          if (commitHash && commitHash !== 'ALL') {
            revisions = {
              baseRef: `${commitHash}~1`,
              targetRef: commitHash,
              baseTitle: `Parent (${commitHash.slice(0, 7)}~1)`,
              targetTitle: `Commit (${commitHash.slice(0, 7)})`,
            };
          } else {
            const commits = this.pushInfo.commits || [];
            if (commits.length > 0) {
              const oldestHash = commits[commits.length - 1].hash;
              revisions = {
                baseRef: `${oldestHash}~1`,
                targetRef: 'HEAD',
                baseTitle: `${this.pushInfo.remote}/${this.pushInfo.remoteBranch || this.pushInfo.currentBranch}`,
                targetTitle: `${this.pushInfo.currentBranch} (HEAD)`,
              };
            }
          }

          CommitReviewPanel.createOrShow(
            this.extensionUri,
            this.gitService,
            filePath,
            filesList || [],
            undefined,
            true, // readOnly
            revisions,
          );
        }
        break;
      }
      case 'executePush': {
        const payload = msg.payload || {};
        try {
          await this.gitService.push(
            payload.branch,
            payload.force,
            payload.setUpstream,
            payload.remote,
            payload.tags,
            payload.targetBranch,
          );
          vscode.window.showInformationMessage(
            `Pushed branch '${payload.branch}' to ${payload.remote}/${payload.targetBranch || payload.branch} successfully!`,
          );
          this.dispose();
        } catch (err: any) {
          this.panel.webview.postMessage({
            type: 'pushFailed',
            error: err?.message || String(err),
          });
          vscode.window.showErrorMessage(`Push failed: ${err?.message || err}`);
        }
        break;
      }
    }
  }

  public dispose(): void {
    PushDialogPanel.currentPanel = undefined;
    this.panel.dispose();
    while (this.disposables.length) {
      const x = this.disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  private getHtml(): string {
    const rawPushInfo = JSON.stringify(this.pushInfo);
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Push Commits</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: var(--vscode-editor-background, #1e1f22);
      color: var(--vscode-editor-foreground, #dfe1e5);
      font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif);
      font-size: var(--vscode-font-size, 13px);
      user-select: none;
    }
    .as-push-card {
      width: 100vw;
      height: 100vh;
      display: flex;
      flex-direction: column;
      background: var(--vscode-editor-background, #1e1f22);
    }
    .as-body {
      display: flex;
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }
    .as-col-left {
      width: 45%;
      border-right: 1px solid var(--vscode-panel-border, #323438);
      display: flex;
      flex-direction: column;
      background: var(--vscode-sideBar-background, var(--vscode-editor-background, #1e1f22));
      overflow: visible;
      position: relative;
    }
    .as-col-right {
      width: 55%;
      display: flex;
      flex-direction: column;
      background: var(--vscode-editor-background, #1e1f22);
      overflow: hidden;
    }
    .as-branch-header {
      display: flex;
      align-items: center;
      padding: 7px 12px;
      background: var(--vscode-button-background, #2675bf);
      color: var(--vscode-button-foreground, #ffffff);
      font-size: 12.5px;
      font-weight: 500;
      cursor: pointer;
      gap: 4px;
      overflow: visible;
      position: relative;
      z-index: 100;
      flex-shrink: 0;
    }
    .as-commit-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px 6px 26px;
      cursor: pointer;
      font-size: 12.5px;
      color: var(--vscode-editor-foreground, #dfe1e5);
    }
    .as-commit-item:hover {
      background: var(--vscode-list-hoverBackground, rgba(255, 255, 255, 0.05));
    }
    .as-commit-item.selected {
      background: var(--vscode-list-activeSelectionBackground, #2e436e) !important;
      color: var(--vscode-list-activeSelectionForeground, #ffffff) !important;
    }
    .as-file-item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 8px 4px 24px;
      font-size: 12.5px;
      color: var(--vscode-editor-foreground, #dfe1e5);
      cursor: pointer;
      border-radius: 3px;
    }
    .as-file-item:hover {
      background: var(--vscode-list-hoverBackground, rgba(255, 255, 255, 0.05));
    }
    .as-file-item.selected {
      background: var(--vscode-list-activeSelectionBackground, #2e436e) !important;
      color: var(--vscode-list-activeSelectionForeground, #ffffff) !important;
    }
    .as-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 16px;
      background: var(--vscode-editorGroupHeader-tabsBackground, var(--vscode-sideBar-background, #2b2d30));
      border-top: 1px solid var(--vscode-panel-border, #323438);
      height: 48px;
      flex-shrink: 0;
    }
    .as-btn {
      background: var(--vscode-button-secondaryBackground, #2b2d30);
      color: var(--vscode-button-secondaryForeground, #dfe1e5);
      border: 1px solid var(--vscode-button-border, #4e5157);
      border-radius: 4px;
      padding: 6px 16px;
      font-size: 12.5px;
      cursor: pointer;
      transition: background 0.15s;
    }
    .as-btn:hover {
      background: var(--vscode-button-secondaryHoverBackground, #35373b);
    }
    .as-btn-primary {
      background: var(--vscode-button-background, #3574f0);
      color: var(--vscode-button-foreground, #ffffff);
      border: none;
      padding: 6px 18px;
      font-size: 12.5px;
      font-weight: 600;
      cursor: pointer;
    }
    .as-btn-primary:hover {
      background: var(--vscode-button-hoverBackground, #3068d8);
    }
    .as-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .as-dropdown {
      position: absolute;
      background: var(--vscode-menu-background, #2b2d30);
      border: 1px solid var(--vscode-menu-border, #43454a);
      border-radius: 4px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.6);
      z-index: 999;
      min-width: 140px;
      padding: 4px 0;
    }
    .as-dropdown-item {
      padding: 6px 12px;
      font-size: 12px;
      color: var(--vscode-menu-foreground, #dfe1e5);
      cursor: pointer;
    }
    .as-dropdown-item:hover {
      background: var(--vscode-menu-selectionBackground, #3574f0);
      color: var(--vscode-menu-selectionForeground, #ffffff);
    }
  </style>
</head>
<body>
  <div class="as-push-card">
    <div class="as-body">
      <!-- Left Column: Commits -->
      <div class="as-col-left">
        <div id="push-branch-header" class="as-branch-header">
          <span id="push-current-branch" style="font-weight:600;white-space:nowrap;"></span>
          <span style="opacity:0.7;margin:0 2px;">&rarr;</span>
          <div style="display:inline-flex;align-items:center;gap:2px;position:relative;">
            <span id="push-remote-label" title="Click to change remote" style="color:#ffffff;font-weight:600;cursor:pointer;border-bottom:1px dashed rgba(255,255,255,0.7);padding:0 2px;">origin</span>
            <div id="push-remote-dropdown" class="as-dropdown" style="display:none;top:26px;left:0;"></div>
          </div>
          <span style="opacity:0.7;margin:0 2px;">:</span>
          <span id="push-target-branch-display" title="Click to edit remote branch name" style="color:#d0e3ff;text-decoration:underline;cursor:pointer;font-weight:500;white-space:nowrap;padding:1px 4px;border-radius:3px;"></span>
          <input id="push-target-branch-input" type="text" style="display:none;background:var(--vscode-input-background, #1e1f22);color:var(--vscode-input-foreground, #ffffff);border:1.5px solid var(--vscode-focusBorder, #3574f0);border-radius:3px;padding:2px 6px;font-size:12px;outline:none;width:150px;">
          <span id="push-new-badge" style="background:rgba(255,255,255,0.22);color:#ffffff;font-size:10.5px;padding:1px 5px;border-radius:3px;margin-left:auto;white-space:nowrap;display:none;">New</span>
        </div>
        <div id="push-commits-container" style="flex:1;min-height:0;overflow-y:auto;padding:4px 0;"></div>
      </div>

      <!-- Right Column: Files -->
      <div class="as-col-right">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:7px 12px;background:var(--vscode-sideBarSectionHeader-background, var(--vscode-sideBar-background, #26282b));border-bottom:1px solid var(--vscode-panel-border, #323438);flex-shrink:0;">
          <div style="display:flex;align-items:center;gap:6px;font-size:12.5px;font-weight:600;color:var(--vscode-editor-foreground, #dfe1e5);">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="#c49000"><path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h3.879a1.5 1.5 0 0 1 1.06.44l1.122 1.12A.5.5 0 0 0 8.92 4H13.5A1.5 1.5 0 0 1 15 5.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 12.5v-9z"/></svg>
            <span id="push-repo-name">Repository</span>
            <span id="push-files-count" style="color:var(--vscode-descriptionForeground, #808080);font-size:11.5px;font-weight:normal;"></span>
          </div>
        </div>
        <div id="push-files-container" style="flex:1;min-height:0;overflow-y:auto;padding:6px 8px;"></div>
      </div>
    </div>

    <!-- Footer -->
    <div class="as-footer">
      <div style="display:flex;align-items:center;gap:12px;">
        <label style="display:inline-flex;align-items:center;gap:6px;font-size:12.5px;color:var(--vscode-editor-foreground, #dfe1e5);cursor:pointer;">
          <input type="checkbox" id="chk-push-tags" style="accent-color:var(--vscode-focusBorder, #3574f0);width:14px;height:14px;cursor:pointer;">
          <span>Push tags:</span>
        </label>
        <select id="sel-push-tags" style="background:var(--vscode-dropdown-background, #1e1f22);color:var(--vscode-dropdown-foreground, #dfe1e5);border:1px solid var(--vscode-dropdown-border, #4e5157);border-radius:3px;padding:3px 6px;font-size:12px;outline:none;">
          <option value="all">All</option>
          <option value="current">Current branch</option>
        </select>
      </div>

      <div style="display:flex;align-items:center;gap:10px;position:relative;">
        <button id="btn-push-cancel" class="as-btn">Cancel</button>
        <div style="display:inline-flex;border-radius:4px;overflow:hidden;box-shadow:0 2px 6px rgba(0,0,0,0.3);">
          <button id="btn-push-submit" class="as-btn-primary">Push</button>
          <button id="btn-push-menu-trigger" class="as-btn-primary" style="border-left:1px solid rgba(255,255,255,0.25);padding:6px 8px;font-size:11px;" title="Push Options">▼</button>
        </div>
        <div id="push-dropdown-menu" class="as-dropdown" style="display:none;bottom:36px;right:0;min-width:180px;">
          <div id="btn-force-push-opt" class="as-dropdown-item">Force Push (no-verify)...</div>
        </div>
      </div>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    let pushInfo = ${rawPushInfo};

    let selectedCommitHash = 'ALL';
    let currentRemote = pushInfo.remote;
    let currentTargetBranch = pushInfo.remoteBranch || pushInfo.currentBranch;
    const availableRemotes = (pushInfo.remotes && pushInfo.remotes.length > 0) ? pushInfo.remotes : [currentRemote];

    const titleEl = document.getElementById('push-dialog-title');
    const branchHeader = document.getElementById('push-branch-header');
    const currentBranchEl = document.getElementById('push-current-branch');
    const remoteLabel = document.getElementById('push-remote-label');
    const remoteDropdown = document.getElementById('push-remote-dropdown');
    const branchDisplay = document.getElementById('push-target-branch-display');
    const branchInput = document.getElementById('push-target-branch-input');
    const newBadge = document.getElementById('push-new-badge');
    const commitsContainer = document.getElementById('push-commits-container');
    const filesContainer = document.getElementById('push-files-container');
    const filesCountEl = document.getElementById('push-files-count');
    const repoNameEl = document.getElementById('push-repo-name');
    const btnCancel = document.getElementById('btn-push-cancel');
    const btnSubmit = document.getElementById('btn-push-submit');
    const btnMenuTrigger = document.getElementById('btn-push-menu-trigger');
    const dropdownMenu = document.getElementById('push-dropdown-menu');
    const btnForcePush = document.getElementById('btn-force-push-opt');
    const chkTags = document.getElementById('chk-push-tags');

    function escapeHtml(str) {
      if (!str) return '';
      return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    function escapeAttr(str) {
      return escapeHtml(str);
    }

    function initUI() {
      if (titleEl) titleEl.textContent = 'Push Commits to ' + currentRemote;
      currentBranchEl.textContent = pushInfo.currentBranch;
      remoteLabel.textContent = currentRemote;
      branchDisplay.textContent = currentTargetBranch;
      branchInput.value = currentTargetBranch;
      repoNameEl.textContent = pushInfo.repoName;
      newBadge.style.display = pushInfo.isNew ? 'inline-block' : 'none';

      // Setup remotes dropdown
      remoteDropdown.innerHTML = '';
      availableRemotes.forEach(r => {
        const item = document.createElement('div');
        item.className = 'as-dropdown-item';
        item.textContent = r;
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          currentRemote = r;
          remoteLabel.textContent = r;
          if (titleEl) titleEl.textContent = 'Push Commits to ' + r;
          remoteDropdown.style.display = 'none';
        });
        remoteDropdown.appendChild(item);
      });

      renderCommits();
      renderFiles();
    }

    function renderCommits() {
      const commits = pushInfo.commits || [];
      if (commits.length === 0) {
        commitsContainer.innerHTML = '<div style="padding:16px;text-align:center;color:#808080;font-size:12px;">No unpushed commits found.</div>';
        return;
      }
      let html = '';
      commits.forEach(c => {
        const isSel = selectedCommitHash === c.hash;
        html += '<div class="as-commit-item' + (isSel ? ' selected' : '') + '" data-hash="' + escapeAttr(c.hash) + '">';
        html += '<span style="font-family:monospace;font-size:11.5px;color:#a9b7c6;font-weight:600;">' + escapeHtml(c.shortHash) + '</span>';
        html += '<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;">' + escapeHtml(c.message) + '</span>';
        html += '</div>';
      });
      commitsContainer.innerHTML = html;

      commitsContainer.querySelectorAll('.as-commit-item').forEach(el => {
        el.addEventListener('click', () => {
          selectedCommitHash = el.getAttribute('data-hash');
          branchHeader.style.background = 'var(--vscode-list-inactiveSelectionBackground, #203248)';
          renderCommits();
          renderFiles();
        });
      });
    }

    function getFileIcon(filename) {
      const ext = filename.split('.').pop().toLowerCase();
      if (ext === 'dart') {
        return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M4.5 12L12 4.5L19.5 12L12 19.5L4.5 12Z" stroke="#4fc3f7" stroke-width="2.5" fill="#0288d1"/><circle cx="12" cy="12" r="3" fill="#ffffff"/></svg>';
      }
      if (ext === 'ts' || ext === 'js' || ext === 'tsx' || ext === 'jsx') {
        return '<svg width="14" height="14" viewBox="0 0 16 16" fill="#64b5f6"><rect x="2" y="2" width="12" height="12" rx="2" fill="#1565c0"/><text x="4" y="11" fill="#ffffff" font-size="8" font-weight="bold">TS</text></svg>';
      }
      return '<svg width="14" height="14" viewBox="0 0 16 16" fill="#90a4ae"><path d="M3 2h7l3 3v9H3V2z" fill="#37474f" stroke="#78909c" stroke-width="1.2"/><path d="M10 2v3h3" fill="none" stroke="#78909c" stroke-width="1.2"/></svg>';
    }

    function renderFiles() {
      let currentFiles = [];
      const commits = pushInfo.commits || [];
      const totalFiles = pushInfo.totalFiles || [];
      if (selectedCommitHash === 'ALL') {
        currentFiles = totalFiles;
      } else {
        const c = commits.find(x => x.hash === selectedCommitHash);
        currentFiles = c ? c.files : [];
      }

      filesCountEl.textContent = currentFiles.length + ' file' + (currentFiles.length > 1 ? 's' : '');

      if (currentFiles.length === 0) {
        filesContainer.innerHTML = '<div style="padding:20px;text-align:center;color:#808080;font-size:12px;">No files changed.</div>';
        return;
      }

      const groups = new Map();
      currentFiles.forEach(f => {
        const d = f.dir || '';
        if (!groups.has(d)) groups.set(d, []);
        groups.get(d).push(f);
      });

      let html = '';
      for (const [dir, fList] of groups.entries()) {
        html += '<div style="display:flex;align-items:center;gap:6px;padding:3px 6px;color:#9aa0a6;font-size:11.5px;cursor:pointer;font-weight:500;">';
        html += '<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h3.879a1.5 1.5 0 0 1 1.06.44l1.122 1.12A.5.5 0 0 0 8.92 4H13.5A1.5 1.5 0 0 1 15 5.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 12.5v-9z"/></svg>';
        html += '<span style="color:#dfe1e5;">' + escapeHtml(dir || 'root') + '</span>';
        html += '<span style="color:#808080;font-size:11px;">' + fList.length + ' file' + (fList.length > 1 ? 's' : '') + '</span>';
        html += '</div>';

        fList.forEach(file => {
          let statusBadge = '';
          if (file.status === 'M') {
            statusBadge = '<span style="display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;border:1px solid #499c54;border-radius:2px;font-size:9.5px;color:#499c54;font-weight:bold;margin-right:2px;">M</span>';
          } else if (file.status === 'A') {
            statusBadge = '<span style="display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;border:1px solid #62b543;border-radius:2px;font-size:9.5px;color:#62b543;font-weight:bold;margin-right:2px;">A</span>';
          } else if (file.status === 'D') {
            statusBadge = '<span style="display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;border:1px solid #e05555;border-radius:2px;font-size:9.5px;color:#e05555;font-weight:bold;margin-right:2px;">D</span>';
          }
          html += '<div class="as-file-item" data-path="' + escapeAttr(file.path) + '">';
          html += statusBadge;
          html += getFileIcon(file.name);
          html += '<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + escapeHtml(file.name) + '</span>';
          html += '</div>';
        });
      }
      filesContainer.innerHTML = html;

      filesContainer.querySelectorAll('.as-file-item').forEach(el => {
        el.addEventListener('dblclick', () => {
          const filePath = el.getAttribute('data-path');
          if (filePath) {
            vscode.postMessage({
              type: 'openReviewInCenter',
              payload: {
                filePath,
                commitHash: selectedCommitHash,
                filesList: currentFiles.map(f => f.path),
              },
            });
          }
        });
      });
    }

    // Branch header click to reset to ALL
    branchHeader.addEventListener('click', (e) => {
      if (e.target.closest('#push-remote-label') || e.target.closest('#push-remote-dropdown') ||
          e.target.closest('#push-target-branch-display') || e.target.closest('#push-target-branch-input')) {
        return;
      }
      selectedCommitHash = 'ALL';
      branchHeader.style.background = 'var(--vscode-button-background, #2675bf)';
      renderCommits();
      renderFiles();
    });

    // Remote dropdown trigger
    remoteLabel.addEventListener('click', (e) => {
      e.stopPropagation();
      remoteDropdown.style.display = remoteDropdown.style.display === 'none' ? 'block' : 'none';
    });

    // Target branch editing
    branchDisplay.addEventListener('click', (e) => {
      e.stopPropagation();
      branchDisplay.style.display = 'none';
      branchInput.style.display = 'inline-block';
      branchInput.focus();
      branchInput.select();
    });

    function commitBranchInput() {
      const val = branchInput.value.trim();
      if (val) {
        currentTargetBranch = val;
        branchDisplay.textContent = val;
      }
      branchInput.style.display = 'none';
      branchDisplay.style.display = 'inline-block';
    }

    branchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') commitBranchInput();
      if (e.key === 'Escape') {
        branchInput.value = currentTargetBranch;
        branchInput.style.display = 'none';
        branchDisplay.style.display = 'inline-block';
      }
    });
    branchInput.addEventListener('blur', commitBranchInput);

    function closeDialog() {
      vscode.postMessage({ type: 'close' });
    }

    function doPush(force) {
      btnSubmit.disabled = true;
      btnSubmit.textContent = 'Pushing...';
      vscode.postMessage({
        type: 'executePush',
        payload: {
          branch: pushInfo.currentBranch,
          targetBranch: currentTargetBranch,
          force: !!force,
          setUpstream: pushInfo.isNew || (currentTargetBranch !== pushInfo.currentBranch),
          remote: currentRemote,
          tags: chkTags.checked,
        },
      });
    }

    btnSubmit.addEventListener('click', () => doPush(false));
    btnCancel.addEventListener('click', closeDialog);

    btnMenuTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdownMenu.style.display = dropdownMenu.style.display === 'none' ? 'block' : 'none';
    });

    btnForcePush.addEventListener('click', () => {
      dropdownMenu.style.display = 'none';
      doPush(true);
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('#push-dropdown-menu') && e.target !== btnMenuTrigger) {
        dropdownMenu.style.display = 'none';
      }
      if (!e.target.closest('#push-remote-dropdown') && e.target !== remoteLabel) {
        remoteDropdown.style.display = 'none';
      }
    });

    // Keyboard shortcuts: Esc to close, Cmd/Ctrl+Enter to Push
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeDialog();
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') doPush(false);
    });

    // Listen to messages from extension
    window.addEventListener('message', (event) => {
      const msg = event.data;
      if (msg.type === 'pushFailed') {
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Push';
      } else if (msg.type === 'updatePushInfo') {
        pushInfo = msg.payload;
        initUI();
      }
    });

    initUI();
  </script>
</body>
</html>`;
  }
}
