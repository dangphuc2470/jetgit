import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { GitService, type StatusEntry } from '../git/gitService';
import { GitContentProvider } from '../providers/gitContentProvider';
import { CommitReviewPanel } from './commitReviewPanel';
import { PushDialogPanel } from './pushDialogPanel';
import { ConflictsDialogPanel } from './conflictsDialogPanel';
import { MergeEditorPanel } from './mergeEditorPanel';
import { generateAiCommitMessage } from '../utils/aiCommitGenerator';
import { getNonce } from '../utils/themeTokens';
import { CommitToExtensionMessage, ExtensionToCommitMessage } from '../shared/protocol';
import { ChangelistTreeProvider } from './changelistTree';

export class CommitViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'intellij-git.commitView';
  public static currentProvider?: CommitViewProvider;
  private view?: vscode.WebviewView;
  private changelistTree?: ChangelistTreeProvider;
  private graphViewProvider?: { refresh: () => void | Promise<void> };
  private fileRepoMap = new Map<string, { relativePath: string; repoPath: string; repoName: string; gitService: GitService }>();
  private changesFilePaths: string[] = [];
  private unversionedFilePaths: string[] = [];
  private allFilePaths: string[] = [];
  private lastStatusHash = '';
  private isRefreshing = false;
  private queuedRefresh = false;
  private skippedFilesCache: { files: any[]; timestamp: number } | null = null;
  private skippedCacheValid = false;

  constructor(
    private extensionUri: vscode.Uri,
    private gitService: GitService,
    private log: vscode.OutputChannel,
  ) {
    CommitViewProvider.currentProvider = this;
    CommitReviewPanel.onFileNavigateListener = (filePath: string) => {
      this.selectFile(filePath);
    };
  }

  public setGraphViewProvider(graphViewProvider: { refresh: () => void | Promise<void> }): void {
    this.graphViewProvider = graphViewProvider;
  }

  public setChangelistTree(changelistTree: ChangelistTreeProvider): void {
    this.changelistTree = changelistTree;
  }

  public selectFile(filePath: string): void {
    if (this.view) {
      this.view.webview.postMessage({
        type: 'selectFile',
        payload: filePath,
      });
    }
  }

  private getReviewFilesList(filePath: string): string[] {
    let list = this.unversionedFilePaths.includes(filePath)
      ? this.unversionedFilePaths
      : this.changesFilePaths;
    if (!list.includes(filePath)) {
      list = this.allFilePaths.length > 0 ? this.allFilePaths : [filePath];
    }
    return list;
  }

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ): void {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview'),
        vscode.Uri.joinPath(this.extensionUri, 'resources'),
      ],
    };

    webviewView.webview.html = this.getHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(msg => this.handleMessage(msg));

    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        this.refresh();
      } else {
        this.closeAllMenus();
      }
    });

    this.refresh();
  }

  closeAllMenus(): void {
    this.view?.webview.postMessage({ type: 'closeAllMenus' });
  }

  private async discoverRepositories(): Promise<{ name: string; path: string; gitService: GitService }[]> {
    const repos: { name: string; path: string; gitService: GitService }[] = [];
    const seenPaths = new Set<string>();

    const checkAndAdd = async (name: string, folderPath: string) => {
      const normalized = path.resolve(folderPath);
      if (seenPaths.has(normalized)) return;
      try {
        const gitPath = path.join(normalized, '.git');
        if (fs.existsSync(gitPath)) {
          seenPaths.add(normalized);
          const gs = normalized === path.resolve(this.gitService.getCwd())
            ? this.gitService
            : new GitService(normalized);
          repos.push({ name, path: normalized, gitService: gs });
        }
      } catch {}
    };

    const folders = vscode.workspace.workspaceFolders || [];
    for (const folder of folders) {
      await checkAndAdd(folder.name, folder.uri.fsPath);

      try {
        const entries = fs.readdirSync(folder.uri.fsPath, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory() && entry.name !== 'node_modules' && !entry.name.startsWith('.')) {
            const subPath = path.join(folder.uri.fsPath, entry.name);
            await checkAndAdd(entry.name, subPath);
          }
        }
      } catch {}
    }

    if (repos.length === 0) {
      const rootPath = path.resolve(this.gitService.getCwd());
      const isRepo = await this.gitService.isGitRepo();
      if (isRepo) {
        await checkAndAdd(path.basename(rootPath) || 'Project', rootPath);
      }
      try {
        const sub = await this.gitService.findSubRepos();
        for (const s of sub) {
          await checkAndAdd(s.name, s.path);
        }
      } catch {}
    } else if (repos.length === 1) {
      try {
        const sub = await repos[0].gitService.findSubRepos();
        for (const s of sub) {
          await checkAndAdd(s.name, s.path);
        }
      } catch {}
    }

    return repos;
  }

  async refresh(): Promise<void> {
    if (!this.view || !this.view.visible) return;
    if (this.isRefreshing) {
      this.queuedRefresh = true;
      return;
    }
    this.isRefreshing = true;

    try {
      const repos = await this.discoverRepositories();
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      const defaultRepoName = repos.length === 1 ? repos[0].name : (workspaceFolder ? workspaceFolder.name : (path.basename(this.gitService.getCwd()) || 'Project'));

      if (repos.length === 0) {
        this.fileRepoMap.clear();
        this.view.webview.postMessage({
          type: 'status',
          payload: {
            files: [],
            changesCount: 0,
            unversionedCount: 0,
            recentMessages: [],
            stashes: [],
            repoName: defaultRepoName,
            repos: [],
          },
        });
        return;
      }

      this.fileRepoMap.clear();
      const isMultiRepo = repos.length > 1;

      const repoResults = await Promise.all(
        repos.map(async (repo) => {
          try {
            await repo.gitService.unmaskAllAssumeUnchanged();
            const [statusEntries, mergeMsg, recentMsgs, stashes, totalDiff, cachedDiff, conflictInfo] = await Promise.all([
              repo.gitService.getStatus(),
              repo.gitService.getMergeMessage().catch(() => ''),
              repo.gitService.getRecentCommitMessages(10).catch(() => []),
              repo.gitService.getStashes().catch(() => []),
              repo.gitService.exec(['diff', 'HEAD']).catch(() => ''),
              repo.gitService.exec(['diff', '--cached']).catch(() => ''),
              repo.gitService.getConflictInfo().catch(() => ({
                hasConflicts: false,
                isMerging: false,
                isRebasing: false,
                yoursBranch: '',
                theirsBranch: '',
                conflicts: [],
              })),
            ]);

            const totalChangesMap = this.parseChangesPerFile(totalDiff);
            const stagedChangesMap = this.parseChangesPerFile(cachedDiff);

            const files = statusEntries.map(entry => {
              const relativePath = entry.path;
              const fileName = path.basename(relativePath);
              const fileDir = path.dirname(relativePath);
              const isUntracked = entry.x === '?' && entry.y === '?';
              const isStaged = entry.x !== ' ' && entry.x !== '?';
              const totalChanges = totalChangesMap.get(relativePath) || 0;
              const stagedChanges = stagedChangesMap.get(relativePath) || 0;
              const isPartiallyStaged = totalChanges > 0 && stagedChanges > 0 && stagedChanges < totalChanges;
              const uniquePath = isMultiRepo ? `${repo.name}/${relativePath}` : relativePath;

              return {
                path: uniquePath,
                relativePath,
                repoName: repo.name,
                repoPath: repo.path,
                name: fileName,
                dir: fileDir === '.' ? '' : fileDir,
                status: entry.y !== ' ' ? entry.y : entry.x,
                staged: isStaged,
                isUntracked,
                totalChanges,
                stagedChanges,
                partiallyStaged: isPartiallyStaged,
                gitService: repo.gitService,
              };
            });

            const formattedSkipped = (this.skippedCacheValid && this.skippedFilesCache)
              ? this.skippedFilesCache.files.filter(f => f.repoName === repo.name || !f.repoName)
              : [];

            return {
              repo,
              files,
              skippedFiles: formattedSkipped,
              mergeMsg,
              recentMsgs,
              stashes,
              conflictInfo,
            };
          } catch (err: any) {
            this.log.appendLine(`Commit panel status fetch failed for ${repo.name}: ${err.message}`);
            return {
              repo,
              files: [],
              skippedFiles: [],
              mergeMsg: '',
              recentMsgs: [],
              stashes: [],
              conflictInfo: {
                hasConflicts: false,
                isMerging: false,
                isRebasing: false,
                yoursBranch: '',
                theirsBranch: '',
                conflicts: [],
              },
            };
          }
        })
      );

      const allFiles: any[] = [];
      const allSkippedFiles: any[] = [];
      const allRecentMessages: string[] = [];
      const allStashes: any[] = [];
      let defaultCommitMessage = '';
      let combinedConflictInfo: any = null;

      for (const res of repoResults) {
        for (const sf of (res.skippedFiles || [])) {
          allSkippedFiles.push(sf);
          this.fileRepoMap.set(sf.path, {
            relativePath: sf.relativePath,
            repoPath: sf.repoPath,
            repoName: sf.repoName,
            gitService: res.repo.gitService,
          });
        }
        for (const file of res.files) {
          allFiles.push(file);
          this.fileRepoMap.set(file.path, {
            relativePath: file.relativePath,
            repoPath: file.repoPath,
            repoName: file.repoName,
            gitService: file.gitService,
          });
        }
        if (!defaultCommitMessage && res.mergeMsg) {
          defaultCommitMessage = res.mergeMsg;
        }
        for (const msg of res.recentMsgs) {
          if (!allRecentMessages.includes(msg)) allRecentMessages.push(msg);
        }
        allStashes.push(...res.stashes);
        if (res.conflictInfo && (res.conflictInfo.hasConflicts || res.conflictInfo.isMerging || res.conflictInfo.isRebasing)) {
          if (!combinedConflictInfo) {
            combinedConflictInfo = { ...res.conflictInfo };
          } else {
            combinedConflictInfo.conflicts = [
              ...(combinedConflictInfo.conflicts || []),
              ...(res.conflictInfo.conflicts || []),
            ];
            combinedConflictInfo.hasConflicts = combinedConflictInfo.conflicts.length > 0;
          }
        }
      }

      const changesFiles = allFiles
        .filter(f => !f.isUntracked)
        .sort((a, b) => (a.repoName || '').localeCompare(b.repoName || '') || a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }) || a.path.localeCompare(b.path));
      const unversionedFiles = allFiles
        .filter(f => f.isUntracked)
        .sort((a, b) => (a.repoName || '').localeCompare(b.repoName || '') || a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }) || a.path.localeCompare(b.path));
      const sortedFiles = [...changesFiles, ...unversionedFiles];

      const changesCount = changesFiles.length;
      const unversionedCount = unversionedFiles.length;

      this.changesFilePaths = changesFiles.map(f => f.path);
      this.unversionedFilePaths = unversionedFiles.map(f => f.path);
      this.allFilePaths = sortedFiles.map(f => f.path);
      this.lastStatusHash = sortedFiles.map(f => `${f.status}:${f.path}:${f.totalChanges}:${f.staged}`).join('\n');

      this.view.webview.postMessage({
        type: 'status',
        payload: {
          files: sortedFiles,
          skippedFiles: allSkippedFiles,
          changesCount,
          unversionedCount,
          skippedCount: allSkippedFiles.length,
          defaultCommitMessage: defaultCommitMessage || '',
          recentMessages: allRecentMessages.slice(0, 20),
          stashes: allStashes,
          conflictInfo: combinedConflictInfo || {
            hasConflicts: false,
            isMerging: false,
            isRebasing: false,
            yoursBranch: '',
            theirsBranch: '',
            conflicts: [],
          },
          repoName: defaultRepoName,
          repos: repos.map(r => ({ name: r.name, path: r.path })),
          isMultiRepo,
          changelists: this.changelistTree ? this.changelistTree.getData().changelists : [],
          activeChangelist: this.changelistTree ? this.changelistTree.getData().active : 'Changes',
        },
      });
    } catch (err: any) {
      this.log.appendLine(`Commit panel status fetch failed: ${err.message}`);
    } finally {
      this.isRefreshing = false;
      if (this.queuedRefresh) {
        this.queuedRefresh = false;
        this.refresh();
      }
    }
  }

  private parseChangesPerFile(diffText: string): Map<string, number> {
    const map = new Map<string, number>();
    if (!diffText || !diffText.trim()) return map;

    const fileSections = diffText.split(/^diff --git /m);
    for (const section of fileSections) {
      if (!section.trim()) continue;
      const match = section.match(/^a\/(.*?)\s+b\/(.*?)(?:\n|$)/);
      if (!match) continue;
      const filePath = match[2];

      const lines = section.split('\n');
      let count = 0;
      let inHunk = false;
      let inDiffBlock = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('@@')) {
          inHunk = true;
          inDiffBlock = false;
        } else if (inHunk) {
          if (line.startsWith('+') || line.startsWith('-')) {
            if (!inDiffBlock) {
              count++;
              inDiffBlock = true;
            }
          } else if (line.startsWith(' ')) {
            inDiffBlock = false;
          }
        }
      }
      map.set(filePath, count);
    }
    return map;
  }

  private async handleMessage(msg: CommitToExtensionMessage): Promise<void> {
    switch (msg.type) {
      case 'ready':
      case 'refresh': {
        this.skippedCacheValid = false;
        await this.refresh();
        break;
      }
      case 'getSkippedFiles': {
        const force = (msg as any).payload?.force ?? false;
        await this.handleGetSkippedFiles(force);
        break;
      }
      case 'newChangelist': {
        const name = (msg as any).payload?.name;
        if (this.changelistTree) {
          await this.changelistTree.createChangelist(name);
          await this.refresh();
        }
        break;
      }
      case 'deleteChangelist': {
        const name = (msg as any).payload;
        if (this.changelistTree && typeof name === 'string') {
          await this.changelistTree.deleteChangelist(name);
          await this.refresh();
        }
        break;
      }
      case 'renameChangelist': {
        const payload = (msg as any).payload;
        const oldName = typeof payload === 'string' ? payload : payload?.oldName;
        const newName = typeof payload === 'object' ? payload?.newName : undefined;
        if (this.changelistTree && typeof oldName === 'string') {
          await this.changelistTree.renameChangelist(oldName, newName);
          await this.refresh();
        }
        break;
      }
      case 'setActiveChangelist': {
        const name = (msg as any).payload;
        if (this.changelistTree && typeof name === 'string') {
          this.changelistTree.setActive(name);
          await this.refresh();
        }
        break;
      }
      case 'moveFilesToChangelist': {
        const { files, changelist } = (msg as any).payload || {};
        if (this.changelistTree && Array.isArray(files) && changelist) {
          this.changelistTree.moveFiles(files, changelist);
          await this.refresh();
        }
        break;
      }
      case 'promptMoveToChangelist': {
        const payload = (msg as any).payload || {};
        const files: string[] = Array.isArray(payload.files)
          ? payload.files
          : (payload.filePath ? [payload.filePath] : []);
        if (!this.changelistTree || files.length === 0) return;

        const currentData = this.changelistTree.getData();
        const items = currentData.changelists.map(c => ({
          label: c.name,
          description: c.name === currentData.active ? '(active)' : undefined,
        }));
        items.push({
          label: '+ New Changelist...',
          description: 'Create a new changelist and move selected files',
        });

        const picked = await vscode.window.showQuickPick(items, {
          placeHolder: `Move ${files.length} file(s) to changelist`,
        });
        if (!picked) return;

        if (picked.label === '+ New Changelist...') {
          const newName = await vscode.window.showInputBox({
            prompt: 'New changelist name',
            placeHolder: 'Feature: ...',
          });
          if (!newName) return;
          await this.changelistTree.createChangelist(newName);
          this.changelistTree.moveFiles(files, newName);
        } else {
          this.changelistTree.moveFiles(files, picked.label);
        }
        await this.refresh();
        break;
      }
      case 'selectFile':
      case 'openReviewInCenter': {
        const filePath = typeof msg.payload === 'string' ? msg.payload : msg.payload?.filePath;
        const jumpDiff = typeof msg.payload === 'object' ? Boolean(msg.payload?.jumpDiff) : false;
        const fromFileList = typeof msg.payload === 'object' ? Boolean(msg.payload?.fromFileList) : false;
        const direction = typeof msg.payload === 'object' ? (msg.payload?.direction || 1) : 1;
        this.log.appendLine(`[CommitPanel] openReviewInCenter for file: ${filePath}`);
        if (filePath) {
          try {
            const mapped = this.fileRepoMap.get(filePath);
            const targetService = mapped ? mapped.gitService : this.gitService;
            const targetPath = mapped ? mapped.relativePath : filePath;
            const repoReviewList = mapped
              ? this.allFilePaths
                  .filter(p => this.fileRepoMap.get(p)?.repoPath === mapped.repoPath)
                  .map(p => this.fileRepoMap.get(p)?.relativePath || p)
              : this.getReviewFilesList(filePath);

            const panel = CommitReviewPanel.createOrShow(
              this.extensionUri,
              targetService,
              targetPath,
              repoReviewList.length > 0 ? repoReviewList : [targetPath],
              () => this.refresh(),
              false,
              undefined,
              this.log,
            );
            if (jumpDiff) {
              panel.focusAndJumpDiff(direction, fromFileList);
            }
          } catch (err: any) {
            this.log.appendLine(`[CommitPanel] Error opening review panel: ${err.message}`);
          }
        }
        break;
      }
      case 'stageFile': {
        const filePath = msg.payload as string;
        try {
          const mapped = this.fileRepoMap.get(filePath);
          const targetService = mapped ? mapped.gitService : this.gitService;
          const targetPath = mapped ? mapped.relativePath : filePath;
          await targetService.stageFile(targetPath);
          if (CommitReviewPanel.currentPanel && CommitReviewPanel.currentPanel.getCurrentFilePath() === targetPath) {
            await CommitReviewPanel.currentPanel.loadFile(targetPath, this.getReviewFilesList(filePath));
          }
          await this.refresh();
        } catch (err: any) {
          vscode.window.showErrorMessage(`Stage failed: ${err.message}`);
        }
        break;
      }
      case 'stageFiles': {
        const filePaths = msg.payload as string[];
        if (!filePaths || filePaths.length === 0) return;
        try {
          const groups = new Map<GitService, string[]>();
          for (const p of filePaths) {
            const mapped = this.fileRepoMap.get(p);
            const gs = mapped ? mapped.gitService : this.gitService;
            const rel = mapped ? mapped.relativePath : p;
            if (!groups.has(gs)) groups.set(gs, []);
            groups.get(gs)!.push(rel);
          }
          for (const [gs, paths] of groups) {
            await gs.stageFiles(paths);
          }
          if (CommitReviewPanel.currentPanel) {
            const current = CommitReviewPanel.currentPanel.getCurrentFilePath();
            if (current && filePaths.some(p => (this.fileRepoMap.get(p)?.relativePath || p) === current)) {
              await CommitReviewPanel.currentPanel.loadFile(current, [current]);
            }
          }
          await this.refresh();
        } catch (err: any) {
          vscode.window.showErrorMessage(`Stage failed: ${err.message}`);
        }
        break;
      }
      case 'unstageFile': {
        const filePath = msg.payload as string;
        try {
          const mapped = this.fileRepoMap.get(filePath);
          const targetService = mapped ? mapped.gitService : this.gitService;
          const targetPath = mapped ? mapped.relativePath : filePath;
          await targetService.unstageFile(targetPath);
          if (CommitReviewPanel.currentPanel && CommitReviewPanel.currentPanel.getCurrentFilePath() === targetPath) {
            await CommitReviewPanel.currentPanel.loadFile(targetPath, this.getReviewFilesList(filePath));
          }
          await this.refresh();
        } catch (err: any) {
          vscode.window.showErrorMessage(`Unstage failed: ${err.message}`);
        }
        break;
      }
      case 'unstageFiles': {
        const filePaths = msg.payload as string[];
        if (!filePaths || filePaths.length === 0) return;
        try {
          const groups = new Map<GitService, string[]>();
          for (const p of filePaths) {
            const mapped = this.fileRepoMap.get(p);
            const gs = mapped ? mapped.gitService : this.gitService;
            const rel = mapped ? mapped.relativePath : p;
            if (!groups.has(gs)) groups.set(gs, []);
            groups.get(gs)!.push(rel);
          }
          for (const [gs, paths] of groups) {
            await gs.unstageFiles(paths);
          }
          if (CommitReviewPanel.currentPanel) {
            const current = CommitReviewPanel.currentPanel.getCurrentFilePath();
            if (current && filePaths.some(p => (this.fileRepoMap.get(p)?.relativePath || p) === current)) {
              await CommitReviewPanel.currentPanel.loadFile(current, [current]);
            }
          }
          await this.refresh();
        } catch (err: any) {
          vscode.window.showErrorMessage(`Unstage failed: ${err.message}`);
        }
        break;
      }
      case 'unskipFile': {
        const filePath = msg.payload as string;
        try {
          const mapped = this.fileRepoMap.get(filePath);
          const targetService = mapped ? mapped.gitService : this.gitService;
          const targetPath = mapped ? mapped.relativePath : filePath;
          await targetService.unskipFile(targetPath);
          vscode.window.showInformationMessage(`Tracked '${path.basename(targetPath)}' again.`);
          this.skippedCacheValid = false;
          await Promise.all([
            this.refresh(),
            this.handleGetSkippedFiles(true),
          ]);
        } catch (err: any) {
          vscode.window.showErrorMessage(`Unskip failed: ${err.message}`);
        }
        break;
      }
      case 'skipFile': {
        const filePath = msg.payload as string;
        try {
          const mapped = this.fileRepoMap.get(filePath);
          const targetService = mapped ? mapped.gitService : this.gitService;
          const targetPath = mapped ? mapped.relativePath : filePath;
          await targetService.skipFile(targetPath);
          vscode.window.showInformationMessage(`Skipped '${path.basename(targetPath)}' (skip-worktree).`);
          this.skippedCacheValid = false;
          await Promise.all([
            this.refresh(),
            this.handleGetSkippedFiles(true),
          ]);
        } catch (err: any) {
          vscode.window.showErrorMessage(`Skip failed: ${err.message}`);
        }
        break;
      }
      case 'rollbackFiles': {
        const filePaths = msg.payload as string[];
        if (!filePaths || filePaths.length === 0) return;
        const confirm = await vscode.window.showWarningMessage(
          `Rollback changes in ${filePaths.length} file(s)? This cannot be undone.`,
          { modal: true },
          'Rollback',
        );
        if (confirm !== 'Rollback') return;
        try {
          const groups = new Map<GitService, string[]>();
          for (const p of filePaths) {
            const mapped = this.fileRepoMap.get(p);
            const gs = mapped ? mapped.gitService : this.gitService;
            const rel = mapped ? mapped.relativePath : p;
            if (!groups.has(gs)) groups.set(gs, []);
            groups.get(gs)!.push(rel);
          }
          for (const [gs, paths] of groups) {
            await gs.rollbackFiles(paths);
          }
          vscode.window.showInformationMessage(`Rolled back ${filePaths.length} file(s).`);
          await this.refresh();
        } catch (err: any) {
          vscode.window.showErrorMessage(`Rollback failed: ${err.message}`);
        }
        break;
      }
      case 'jumpToSource': {
        const filePath = msg.payload as string;
        if (filePath) {
          const mapped = this.fileRepoMap.get(filePath);
          const fullPath = mapped
            ? path.join(mapped.repoPath, mapped.relativePath)
            : path.join(this.gitService.getCwd(), filePath);
          if (fs.existsSync(fullPath)) {
            vscode.commands.executeCommand('vscode.open', vscode.Uri.file(fullPath));
          }
        }
        break;
      }
      case 'deleteFile': {
        const filePath = msg.payload as string;
        if (!filePath) return;
        const mapped = this.fileRepoMap.get(filePath);
        const fullPath = mapped
          ? path.join(mapped.repoPath, mapped.relativePath)
          : path.join(this.gitService.getCwd(), filePath);
        const fileName = path.basename(fullPath);
        const confirm = await vscode.window.showWarningMessage(
          `Are you sure you want to delete "${fileName}"?`,
          { modal: true },
          'Delete',
        );
        if (confirm !== 'Delete') return;
        try {
          if (fs.existsSync(fullPath)) {
            if (fs.statSync(fullPath).isDirectory()) {
              fs.rmSync(fullPath, { recursive: true, force: true });
            } else {
              fs.unlinkSync(fullPath);
            }
          }
          const gs = mapped ? mapped.gitService : this.gitService;
          const rel = mapped ? mapped.relativePath : filePath;
          await gs.exec(['rm', '-f', '--cached', rel]).catch(() => {});
          await this.refresh();
          vscode.window.showInformationMessage(`Deleted ${fileName}`);
        } catch (err: any) {
          vscode.window.showErrorMessage(`Delete failed: ${err.message}`);
        }
        break;
      }
      case 'getFileDiff': {
        const filePath = msg.payload as string;
        try {
          const mapped = this.fileRepoMap.get(filePath);
          const gs = mapped ? mapped.gitService : this.gitService;
          const rel = mapped ? mapped.relativePath : filePath;
          const diff = await gs.getFileDiff(rel);
          this.view?.webview.postMessage({
            type: 'fileDiff',
            payload: { path: filePath, diff },
          });
        } catch (err: any) {
          this.log.appendLine(`Get diff failed: ${err.message}`);
        }
        break;
      }
      case 'applyHunkPatch': {
        const { patch, reverse } = msg.payload;
        try {
          await this.gitService.applyHunkPatch(patch, reverse);
          await this.refresh();
        } catch (err: any) {
          vscode.window.showErrorMessage(`Apply patch failed: ${err.message}`);
        }
        break;
      }
      case 'commit': {
        const { message, files: targetFiles, amend } = msg.payload;
        try {
          const groups = new Map<GitService, string[]>();
          if (targetFiles && targetFiles.length > 0) {
            for (const filePath of targetFiles) {
              const mapped = this.fileRepoMap.get(filePath);
              const gs = mapped ? mapped.gitService : this.gitService;
              const rel = mapped ? mapped.relativePath : filePath;
              if (!groups.has(gs)) groups.set(gs, []);
              groups.get(gs)!.push(rel);
            }
          } else {
            groups.set(this.gitService, []);
          }

          for (const [gs, paths] of groups) {
            await gs.commitFiles(message, paths.length > 0 ? paths : undefined, amend);
          }
          vscode.window.showInformationMessage('Committed successfully.');
          this.view?.webview.postMessage({ type: 'commitSuccess' });
          await this.refresh();
          this.graphViewProvider?.refresh();
          this.changelistTree?.syncChangelists();
          vscode.commands.executeCommand('intellij-git.refreshGraph');
          vscode.commands.executeCommand('intellij-git.refreshChangelists');
        } catch (err: any) {
          vscode.window.showErrorMessage(`Commit failed: ${err.message}`);
        }
        break;
      }
      case 'commitAndPush': {
        const { message, files: targetFiles, amend } = msg.payload;
        try {
          const groups = new Map<GitService, string[]>();
          if (targetFiles && targetFiles.length > 0) {
            for (const filePath of targetFiles) {
              const mapped = this.fileRepoMap.get(filePath);
              const gs = mapped ? mapped.gitService : this.gitService;
              const rel = mapped ? mapped.relativePath : filePath;
              if (!groups.has(gs)) groups.set(gs, []);
              groups.get(gs)!.push(rel);
            }
          } else {
            groups.set(this.gitService, []);
          }

          for (const [gs, paths] of groups) {
            await gs.commitFiles(message, paths.length > 0 ? paths : undefined, amend);
          }
          vscode.window.showInformationMessage('Committed successfully.');
          this.view?.webview.postMessage({ type: 'commitSuccess' });
          await this.refresh();
          this.graphViewProvider?.refresh();
          this.changelistTree?.syncChangelists();
          vscode.commands.executeCommand('intellij-git.refreshGraph');
          vscode.commands.executeCommand('intellij-git.refreshChangelists');
          await this.openPushDialog();
        } catch (err: any) {
          vscode.window.showErrorMessage(`Commit failed: ${err.message}`);
        }
        break;
      }
      case 'openPushDialog': {
        await this.openPushDialog(msg.payload?.branch);
        break;
      }
      case 'executePush': {
        const { branch, targetBranch, force, setUpstream, remote, tags } = msg.payload || {};
        try {
          await this.gitService.push(branch, force, setUpstream, remote, tags, targetBranch);
          vscode.window.showInformationMessage(`Pushed ${branch || 'branch'} successfully to ${remote || 'remote'}.`);
          await this.refresh();
          this.graphViewProvider?.refresh();
          vscode.commands.executeCommand('intellij-git.refreshGraph');
          this.view?.webview.postMessage({ type: 'pushSuccess' });
        } catch (err: any) {
          vscode.window.showErrorMessage(`Push failed: ${err.message}`);
          this.view?.webview.postMessage({ type: 'pushError', payload: { error: err.message } });
        }
        break;
      }
      case 'acceptYours': {
        const { path: filePath } = msg.payload;
        try {
          await this.gitService.acceptYours(filePath);
          vscode.window.showInformationMessage(`Accepted Yours for '${filePath}'`);
          await this.refresh();
        } catch (err: any) {
          vscode.window.showErrorMessage(`Accept Yours failed: ${err.message}`);
        }
        break;
      }
      case 'acceptTheirs': {
        const { path: filePath } = msg.payload;
        try {
          await this.gitService.acceptTheirs(filePath);
          vscode.window.showInformationMessage(`Accepted Theirs for '${filePath}'`);
          await this.refresh();
        } catch (err: any) {
          vscode.window.showErrorMessage(`Accept Theirs failed: ${err.message}`);
        }
        break;
      }
      case 'openMergeEditor': {
        const { path: filePath } = msg.payload;
        try {
          await MergeEditorPanel.createOrShow(this.extensionUri, this.gitService, filePath);
        } catch (err: any) {
          vscode.window.showErrorMessage(`Failed to open merge editor: ${err.message}`);
        }
        break;
      }
      case 'abortMerge': {
        const confirmed = await vscode.window.showWarningMessage(
          'Are you sure you want to abort the current merge/rebase? All uncommitted merge changes will be lost.',
          { modal: true },
          'Abort'
        );
        if (confirmed === 'Abort') {
          try {
            await this.gitService.abortMerge();
            vscode.window.showInformationMessage('Merge/rebase aborted.');
            await this.refresh();
          } catch (err: any) {
            vscode.window.showErrorMessage(`Abort failed: ${err.message}`);
          }
        }
        break;
      }
      case 'openConflictsDialog': {
        this.openConflictsDialog();
        break;
      }
      case 'generateAiCommitMessage': {
        const { files } = msg.payload || {};
        const checkedFiles: string[] = Array.isArray(files) ? files : [];
        try {
          const finalMessage = await generateAiCommitMessage(this.gitService, checkedFiles);
          if (finalMessage) {
            this.view?.webview.postMessage({
              type: 'setCommitMessage',
              payload: { message: finalMessage },
            });
          } else {
            this.view?.webview.postMessage({ type: 'generateAiError' });
            vscode.window.showWarningMessage('No commit message was generated by AI.');
          }
        } catch (err: any) {
          this.view?.webview.postMessage({ type: 'generateAiError' });
          vscode.window.showErrorMessage(`Failed to generate commit message: ${err.message}`);
        } finally {
          await this.refresh();
        }
        break;
      }
      case 'openDiffInEditor': {
        const filePath = msg.payload as string;
        try {
          const leftUri = GitContentProvider.makeUri('HEAD', filePath);
          const rightUri = vscode.Uri.file(path.join(this.gitService.getCwd(), filePath));
          const fileName = path.basename(filePath);
          await vscode.commands.executeCommand('vscode.diff', leftUri, rightUri, `${fileName} (HEAD ↔ Working Tree)`);
        } catch (err: any) {
          vscode.window.showErrorMessage(`Open diff editor failed: ${err.message}`);
        }
        break;
      }
      case 'createStash': {
        const msgText = await vscode.window.showInputBox({
          prompt: 'Stash message (optional)',
          placeHolder: 'WIP on feature...',
        });
        if (msgText === undefined) return;
        try {
          await this.gitService.stashSave(msgText);
          vscode.window.showInformationMessage('Stashed local changes.');
          await this.refresh();
        } catch (err: any) {
          vscode.window.showErrorMessage(`Stash failed: ${err.message}`);
        }
        break;
      }
      case 'stashPop': {
        const idx = msg.payload as string;
        try {
          await this.gitService.stashPop(idx);
          vscode.window.showInformationMessage(`Applied and dropped ${idx}`);
        } catch (err: any) {
          const raw = err?.message || String(err);
          if (raw.includes('CONFLICT') || raw.includes('conflict') || raw.includes('Merge conflict')) {
            vscode.window.showWarningMessage(
              `Stash applied with merge conflicts. Resolve them in the merge editor.`,
              'Resolve Conflicts'
            ).then(res => {
              if (res === 'Resolve Conflicts') {
                vscode.commands.executeCommand('intellij-git.resolveConflicts');
              }
            });
          } else {
            vscode.window.showErrorMessage(`Stash pop failed: ${err.message}`);
          }
        } finally {
          await this.refresh();
        }
        break;
      }
      case 'stashApply': {
        const idx = msg.payload as string;
        try {
          await this.gitService.stashApply(idx);
          vscode.window.showInformationMessage(`Applied ${idx}`);
        } catch (err: any) {
          const raw = err?.message || String(err);
          if (raw.includes('CONFLICT') || raw.includes('conflict') || raw.includes('Merge conflict')) {
            vscode.window.showWarningMessage(
              `Stash applied with merge conflicts. Resolve them in the merge editor.`,
              'Resolve Conflicts'
            ).then(res => {
              if (res === 'Resolve Conflicts') {
                vscode.commands.executeCommand('intellij-git.resolveConflicts');
              }
            });
          } else {
            vscode.window.showErrorMessage(`Stash apply failed: ${err.message}`);
          }
        } finally {
          await this.refresh();
        }
        break;
      }
      case 'stashDrop': {
        const idx = msg.payload as string;
        const confirm = await vscode.window.showWarningMessage(
          `Drop stash ${idx}?`,
          { modal: true },
          'Drop',
        );
        if (confirm !== 'Drop') return;
        try {
          await this.gitService.stashDrop(idx);
          vscode.window.showInformationMessage(`Dropped ${idx}`);
          await this.refresh();
        } catch (err: any) {
          vscode.window.showErrorMessage(`Stash drop failed: ${err.message}`);
        }
        break;
      }
      case 'openLog': {
        vscode.commands.executeCommand('intellij-git.openLog');
        break;
      }
      case 'collapseView': {
        vscode.commands.executeCommand('workbench.action.toggleSidebarVisibility');
        break;
      }
    }
  }

  show(): void {
    if (this.view) {
      this.view.show(true);
    }
  }

  private getHtml(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview', 'commit', 'commit.js'),
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview', 'commit', 'commit.css'),
    );
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none'; style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="${styleUri}">
  <title>Commit</title>
</head>
<body data-vscode-context='{"preventDefaultContextMenuItems": true}'>
  <div id="app"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }

  private async handleGetSkippedFiles(force = false): Promise<void> {
    const now = Date.now();
    if (!force && this.skippedCacheValid && this.skippedFilesCache && (now - this.skippedFilesCache.timestamp < 10000)) {
      if (this.view) {
        this.view.webview.postMessage({
          type: 'skippedFiles',
          payload: { files: this.skippedFilesCache.files },
        });
      }
      return;
    }

    try {
      const repos = await this.discoverRepositories();
      const isMultiRepo = repos.length > 1;
      const skippedLists = await Promise.all(
        repos.map(async (repo) => {
          try {
            const skipped = await repo.gitService.getSkippedFiles(repo.name, repo.path);
            return skipped.map(sf => {
              const uniquePath = isMultiRepo ? `${repo.name}/${sf.path}` : sf.path;
              return {
                ...sf,
                path: uniquePath,
                relativePath: sf.path,
                repoName: repo.name,
                repoPath: repo.path,
              };
            });
          } catch {
            return [];
          }
        })
      );

      const allSkipped = skippedLists.flat();
      this.skippedFilesCache = {
        files: allSkipped,
        timestamp: Date.now(),
      };
      this.skippedCacheValid = true;

      if (this.view) {
        this.view.webview.postMessage({
          type: 'skippedFiles',
          payload: { files: allSkipped },
        });
      }
    } catch (err: any) {
      this.log.appendLine(`Failed to get skipped files: ${err.message}`);
      if (this.view) {
        this.view.webview.postMessage({
          type: 'skippedFiles',
          payload: { files: [] },
        });
      }
    }
  }

  async openConflictsDialog(): Promise<void> {
    await ConflictsDialogPanel.createOrShow(this.extensionUri, this.gitService);
  }

  async openPushDialog(branch?: string): Promise<void> {
    await PushDialogPanel.createOrShow(this.extensionUri, this.gitService, branch);
  }
}
