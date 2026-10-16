import { state } from './state';
import { CommitFile } from './types';

export function isFolderExpanded(folderPath: string, isModule?: boolean): boolean {
  if (state.expandAllFolders === true) {
    return !state.collapsedFolders.has(folderPath);
  }
  if (state.expandAllFolders === false) {
    return state.expandedFolders.has(folderPath);
  }
  if (state.collapsedFolders.has(folderPath)) return false;
  if (state.expandedFolders.has(folderPath)) return true;
  return true; // Default expanded so files are visible
}

export function toggleFolder(folderPath: string, isModule?: boolean, onRender?: () => void): void {
  const currentlyExpanded = isFolderExpanded(folderPath, isModule);
  if (currentlyExpanded) {
    state.collapsedFolders.add(folderPath);
    state.expandedFolders.delete(folderPath);
  } else {
    state.expandedFolders.add(folderPath);
    state.collapsedFolders.delete(folderPath);
  }
  if (onRender) onRender();
}

export function buildDirectoryTree(files: CommitFile[]): any {
  const root: any = {
    name: '',
    path: '',
    isFolder: true,
    children: new Map(),
    files: [],
    allFiles: []
  };

  for (const file of files) {
    const normalized = (file.path || '').replace(/\\/g, '/');
    const parts = normalized.split('/').filter(Boolean);
    if (parts.length === 0) continue;
    parts.pop(); // remove file name, keep directory parts
    let curr = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!curr.children.has(part)) {
        curr.children.set(part, {
          name: part,
          path: parts.slice(0, i + 1).join('/'),
          isFolder: true,
          children: new Map(),
          files: [],
          allFiles: []
        });
      }
      curr = curr.children.get(part);
    }
    curr.files.push(file);
  }

  function populateAllFiles(node: any) {
    const list = [...node.files];
    for (const child of node.children.values()) {
      list.push(...populateAllFiles(child));
    }
    node.allFiles = list;
    return list;
  }
  populateAllFiles(root);

  // Compact single-child middle packages
  function compactMiddleNodes(node: any) {
    const newChildren = new Map();
    for (const [name, child] of node.children.entries()) {
      let cur = child;
      while (cur.files.length === 0 && cur.children.size === 1) {
        const onlyChild = cur.children.values().next().value;
        cur = {
          name: cur.name + '/' + onlyChild.name,
          path: onlyChild.path,
          isFolder: true,
          children: onlyChild.children,
          files: onlyChild.files,
          allFiles: onlyChild.allFiles
        };
      }
      compactMiddleNodes(cur);
      newChildren.set(cur.name, cur);
    }
    node.children = newChildren;
  }
  compactMiddleNodes(root);

  return root;
}
