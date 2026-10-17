import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { GitService } from '../git/gitService';

interface Changelist {
  name: string;
  files: string[];
}

interface ChangelistData {
  changelists: Changelist[];
  active: string;
}

type ChangelistNode =
  | { type: 'changelist'; name: string; active: boolean }
  | { type: 'file'; path: string; changelist: string };

const DEFAULT_DATA: ChangelistData = {
  changelists: [{ name: 'Default', files: [] }],
  active: 'Default',
};

export class ChangelistTreeProvider implements vscode.TreeDataProvider<ChangelistNode> {
  private _onDidChangeTreeData = new vscode.EventEmitter<ChangelistNode | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private data: ChangelistData = DEFAULT_DATA;
  private dataPath: string;
  private treeView?: vscode.TreeView<ChangelistNode>;

  constructor(
    private gitService: GitService,
    private workspaceRoot: string,
    private extensionUri?: vscode.Uri,
  ) {
    const vscodePath = path.join(workspaceRoot, '.vscode');
    this.dataPath = path.join(vscodePath, 'changelists.json');
    this.load();

    // File-save / file-create listeners are intentionally removed here.
    // extension.ts owns a single shared debounced handler that calls syncChangelists()
    // to avoid running git status twice on every save event.
  }

  setTreeView(treeView: vscode.TreeView<ChangelistNode>): void {
    this.treeView = treeView;
    treeView.onDidChangeVisibility(e => {
      if (e.visible) {
        this.syncWithGitStatus();
      }
    });
  }

  refresh(): void {
    this.load();
    this._onDidChangeTreeData.fire(undefined);
  }

  /** Called by extension.ts shared debounce handler on file save / create. */
  syncChangelists(): void {
    // Only execute git status if changelist sidebar is actually visible to user
    if (this.treeView && !this.treeView.visible) {
      return;
    }
    this.syncWithGitStatus();
  }

  getTreeItem(element: ChangelistNode): vscode.TreeItem {
    if (element.type === 'changelist') {
      const item = new vscode.TreeItem(
        element.name,
        vscode.TreeItemCollapsibleState.Expanded,
      );
      item.contextValue = element.active ? 'changelist-active' : 'changelist';
      if (this.extensionUri) {
        item.iconPath = {
          light: vscode.Uri.joinPath(this.extensionUri, 'resources', 'vcs', 'changelist.svg'),
          dark: vscode.Uri.joinPath(this.extensionUri, 'resources', 'vcs', 'changelist_dark.svg'),
        };
      } else {
        item.iconPath = new vscode.ThemeIcon(
          element.active ? 'folder-active' : 'folder',
        );
      }
      if (element.active) {
        item.description = '(active)';
      }
      return item;
    } else {
      const item = new vscode.TreeItem(
        path.basename(element.path),
        vscode.TreeItemCollapsibleState.None,
      );
      item.description = path.dirname(element.path);
      item.contextValue = 'changelist-file';
      item.resourceUri = vscode.Uri.joinPath(
        vscode.Uri.file(this.workspaceRoot),
        element.path,
      );
      item.command = {
        command: 'vscode.open',
        title: 'Open File',
        arguments: [item.resourceUri],
      };
      return item;
    }
  }

  getChildren(element?: ChangelistNode): ChangelistNode[] {
    if (!element) {
      return this.data.changelists.map(cl => ({
        type: 'changelist' as const,
        name: cl.name,
        active: cl.name === this.data.active,
      }));
    }
    if (element.type === 'changelist') {
      const cl = this.data.changelists.find(c => c.name === element.name);
      return (cl?.files || []).map(f => ({
        type: 'file' as const,
        path: f,
        changelist: element.name,
      }));
    }
    return [];
  }

  async createChangelist(name?: string): Promise<void> {
    if (!name) {
      name = await vscode.window.showInputBox({
        prompt: 'Changelist name',
        placeHolder: 'Feature: ...',
      });
    }
    if (!name) return;

    if (this.data.changelists.some(c => c.name === name)) {
      vscode.window.showWarningMessage(`Changelist "${name}" already exists.`);
      return;
    }

    this.data.changelists.push({ name, files: [] });
    this.save();
    this._onDidChangeTreeData.fire(undefined);
  }

  async deleteChangelist(name: string): Promise<void> {
    if (name === 'Default') {
      vscode.window.showWarningMessage('Cannot delete the Default changelist.');
      return;
    }

    const cl = this.data.changelists.find(c => c.name === name);
    if (!cl) return;

    // Move files to Default
    const defaultCl = this.data.changelists.find(c => c.name === 'Default');
    if (defaultCl && cl.files.length > 0) {
      defaultCl.files.push(...cl.files);
    }

    this.data.changelists = this.data.changelists.filter(c => c.name !== name);
    if (this.data.active === name) {
      this.data.active = 'Default';
    }
    this.save();
    this._onDidChangeTreeData.fire(undefined);
  }

  setActive(name: string): void {
    this.data.active = name;
    this.save();
    this._onDidChangeTreeData.fire(undefined);
  }

  moveFiles(filePaths: string[], targetChangelist: string): void {
    const target = this.data.changelists.find(c => c.name === targetChangelist);
    if (!target) return;

    for (const f of filePaths) {
      for (const cl of this.data.changelists) {
        cl.files = cl.files.filter(file => file !== f);
      }
      if (!target.files.includes(f)) {
        target.files.push(f);
      }
    }
    this.save();
    this._onDidChangeTreeData.fire(undefined);
  }

  getData(): ChangelistData {
    return this.data;
  }

  async commitChangelist(name?: string): Promise<void> {
    const clName = name || this.data.active;
    const cl = this.data.changelists.find(c => c.name === clName);
    if (!cl || cl.files.length === 0) {
      vscode.window.showWarningMessage(`Changelist "${clName}" has no files.`);
      return;
    }

    const message = await vscode.window.showInputBox({
      prompt: 'Commit message',
      placeHolder: clName === 'Default' ? 'Commit message...' : clName,
      value: clName === 'Default' ? '' : clName,
    });
    if (!message) return;

    try {
      await this.gitService.stageFiles(cl.files);
      await this.gitService.commit(message);
      cl.files = [];
      this.save();
      this._onDidChangeTreeData.fire(undefined);
      vscode.window.showInformationMessage(`Committed changelist "${clName}".`);
    } catch (err: any) {
      vscode.window.showErrorMessage(`Commit failed: ${err.message}`);
    }
  }

  /**
   * Sync changelists with current git status — add new modified/untracked files
   * to the active changelist if they aren't in any changelist yet.
   */
  private async syncWithGitStatus(): Promise<void> {
    try {
      const status = await this.gitService.getStatus();
      const allFiles = new Set<string>();
      for (const cl of this.data.changelists) {
        for (const f of cl.files) allFiles.add(f);
      }

      const activeCl = this.data.changelists.find(c => c.name === this.data.active);
      if (!activeCl) return;

      let changed = false;
      for (const entry of status) {
        // Never track .vscode or changelists.json to prevent recursive self-referential git loops
        if (
          entry.path === '.vscode' ||
          entry.path.startsWith('.vscode/') ||
          entry.path.includes('changelists.json')
        ) {
          continue;
        }

        if (!allFiles.has(entry.path)) {
          activeCl.files.push(entry.path);
          changed = true;
        }
      }

      // Remove files that are no longer modified, or any accidentally saved .vscode/changelists.json
      const statusPaths = new Set(status.map(s => s.path));
      for (const cl of this.data.changelists) {
        const before = cl.files.length;
        cl.files = cl.files.filter(
          f =>
            statusPaths.has(f) &&
            !f.startsWith('.vscode/') &&
            !f.includes('changelists.json'),
        );
        if (cl.files.length !== before) changed = true;
      }

      if (changed) {
        this.save();
        this._onDidChangeTreeData.fire(undefined);
      }
    } catch {
      // Ignore errors during sync
    }
  }

  private load(): void {
    try {
      if (fs.existsSync(this.dataPath)) {
        const raw = fs.readFileSync(this.dataPath, 'utf-8');
        this.data = JSON.parse(raw);
      }
    } catch {
      this.data = { ...DEFAULT_DATA };
    }
    // Ensure Default changelist always exists
    if (!this.data.changelists.some(c => c.name === 'Default')) {
      this.data.changelists.unshift({ name: 'Default', files: [] });
    }
    // Clean up any historical .vscode/changelists.json entries
    for (const cl of this.data.changelists) {
      cl.files = cl.files.filter(
        f => !f.startsWith('.vscode/') && !f.includes('changelists.json'),
      );
    }
  }

  private save(): void {
    try {
      const dir = path.dirname(this.dataPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.dataPath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch {
      // Best effort
    }
  }
}
