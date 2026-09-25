import * as vscode from 'vscode';
import { GitService, type BranchInfo, type TagInfo } from '../git/gitService';

type BranchNodeType = 'category' | 'branch-local' | 'branch-remote' | 'branch-current' | 'tag' | 'remote-group';

interface BranchNode {
  label: string;
  type: BranchNodeType;
  ref?: string;     // full ref name for checkout/actions
  hash?: string;
  children?: BranchNode[];
}

export class BranchTreeProvider implements vscode.TreeDataProvider<BranchNode> {
  private _onDidChangeTreeData = new vscode.EventEmitter<BranchNode | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private gitService: GitService) {}

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: BranchNode): vscode.TreeItem {
    const collapsible = element.children
      ? vscode.TreeItemCollapsibleState.Expanded
      : vscode.TreeItemCollapsibleState.None;

    const item = new vscode.TreeItem(element.label, collapsible);

    switch (element.type) {
      case 'category':
        item.iconPath = new vscode.ThemeIcon(
          element.label === 'Tags' ? 'tag' : 'git-branch',
        );
        break;
      case 'remote-group':
        item.iconPath = new vscode.ThemeIcon('cloud');
        break;
      case 'branch-current':
        item.iconPath = new vscode.ThemeIcon('star-full');
        item.description = element.hash?.slice(0, 7);
        item.contextValue = 'branch-current';
        break;
      case 'branch-local':
        item.iconPath = new vscode.ThemeIcon('git-branch');
        item.description = element.hash?.slice(0, 7);
        item.contextValue = 'branch-local';
        break;
      case 'branch-remote':
        item.iconPath = new vscode.ThemeIcon('git-branch');
        item.description = element.hash?.slice(0, 7);
        item.contextValue = 'branch-remote';
        break;
      case 'tag':
        item.iconPath = new vscode.ThemeIcon('tag');
        item.description = element.hash?.slice(0, 7);
        item.contextValue = 'tag';
        break;
    }

    if (element.ref) {
      item.tooltip = element.ref;
    }

    return item;
  }

  async getChildren(element?: BranchNode): Promise<BranchNode[]> {
    if (!element) {
      return this.getRootNodes();
    }
    return element.children || [];
  }

  private async getRootNodes(): Promise<BranchNode[]> {
    try {
      const [branches, tags, currentBranch] = await Promise.all([
        this.gitService.getBranches(),
        this.gitService.getTags(),
        this.gitService.getCurrentBranch(),
      ]);

      const locals = branches.filter(b => !b.remote);
      const remotes = branches.filter(b => b.remote);

      // HEAD node
      const headNode: BranchNode = {
        label: `HEAD (${currentBranch})`,
        type: 'branch-current',
        ref: currentBranch,
        hash: locals.find(b => b.current)?.hash,
      };

      // Local branches
      const localChildren: BranchNode[] = locals.map(b => ({
        label: b.name,
        type: b.current ? 'branch-current' as const : 'branch-local' as const,
        ref: b.name,
        hash: b.hash,
      }));

      const localNode: BranchNode = {
        label: 'Local',
        type: 'category',
        children: localChildren,
      };

      // Remote branches grouped by remote name
      const remoteGroups = new Map<string, BranchNode[]>();
      for (const b of remotes) {
        const remote = b.remote || 'origin';
        if (!remoteGroups.has(remote)) {
          remoteGroups.set(remote, []);
        }
        // Show just the branch name after the remote prefix (origin/main -> main)
        const displayName = b.name.slice(remote.length + 1);
        remoteGroups.get(remote)!.push({
          label: displayName,
          type: 'branch-remote',
          ref: b.name,
          hash: b.hash,
        });
      }

      const remoteChildren: BranchNode[] = [];
      for (const [remote, bNodes] of remoteGroups) {
        remoteChildren.push({
          label: remote,
          type: 'remote-group',
          children: bNodes,
        });
      }

      const remoteNode: BranchNode = {
        label: 'Remote',
        type: 'category',
        children: remoteChildren,
      };

      // Tags
      const tagChildren: BranchNode[] = tags.map(t => ({
        label: t.name,
        type: 'tag' as const,
        ref: t.name,
        hash: t.hash,
      }));

      const tagNode: BranchNode = {
        label: 'Tags',
        type: 'category',
        children: tagChildren,
      };

      return [headNode, localNode, remoteNode, tagNode];
    } catch {
      return [];
    }
  }
}
