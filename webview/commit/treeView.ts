import { escapeHtml } from '../shared/escape';
import { getFileIcon } from '../shared/fileIcons';
import { state } from './state';
import { CommitFile } from './types';
import { showFileContextMenu } from './contextMenu';

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

export function renderFolderNode(node: any, depth: number, groupTitle: string, vscode: any, onRender: () => void): HTMLElement {
  const folderEl = document.createElement('div');
  folderEl.className = 'tree-folder-node';

  const folderPath = node.path || node.name;
  const isExpanded = isFolderExpanded(folderPath, false);

  const allFiles: CommitFile[] = node.allFiles || [];
  const anyPartiallyStaged = allFiles.some((f: any) => f.partiallyStaged || (f.totalChanges > 0 && f.stagedChanges > 0 && f.stagedChanges < f.totalChanges));
  const allChecked = allFiles.length > 0 && allFiles.every(f => (state.checkedFiles.has(f.path) || (f.staged && !f.partiallyStaged)));
  const someChecked = anyPartiallyStaged || (!allChecked && allFiles.some((f: any) => state.checkedFiles.has(f.path) || f.staged || f.stagedChanges > 0));

  const header = document.createElement('div');
  header.className = 'tree-folder-header';
  header.dataset.folderPath = folderPath;

  const countText = `${allFiles.length} ${allFiles.length === 1 ? 'file' : 'files'}`;

  header.innerHTML = `
    <span class="tree-arrow ${isExpanded ? 'expanded' : ''}">
      <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M6 3.5L10.5 8L6 12.5L5 11.5L8.5 8L5 4.5L6 3.5Z"/>
      </svg>
    </span>
    <input type="checkbox" class="file-chk tree-chk group-chk" ${allChecked ? 'checked' : ''}/>
    <span class="tree-folder-icon">
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <path d="M1.5 3.5C1.5 2.67157 2.17157 2 3 2H6.08579C6.48362 2 6.86514 2.15804 7.14645 2.43934L8.70711 4H13C13.8284 4 14.5 4.67157 14.5 5.5V12.5C14.5 13.3284 13.8284 14 13 14H3C2.17157 14 1.5 13.3284 1.5 12.5V3.5Z" stroke="#8C8C8C" stroke-width="1.2" fill="none"/>
      </svg>
    </span>
    <span class="tree-folder-name">${escapeHtml(node.name)}</span>
    <span class="tree-folder-count">${countText}</span>
  `;

  const chk = header.querySelector('.tree-chk') as HTMLInputElement | null;
  if (chk) {
    chk.indeterminate = someChecked && !allChecked;
    chk.addEventListener('change', (e) => {
      e.stopPropagation();
      const isChecked = chk.checked;
      const paths = allFiles.map(f => f.path);
      if (isChecked) {
        paths.forEach(p => state.checkedFiles.add(p));
        vscode.postMessage({ type: 'stageFiles', payload: paths });
      } else {
        paths.forEach(p => state.checkedFiles.delete(p));
        vscode.postMessage({ type: 'unstageFiles', payload: paths });
      }
      onRender();
    });
  }

  header.addEventListener('click', (e) => {
    if (e.target === chk) return;
    toggleFolder(folderPath, false, onRender);
  });

  folderEl.appendChild(header);

  if (isExpanded) {
    const childrenContainer = document.createElement('div');
    childrenContainer.className = 'tree-folder-children';

    const subfolders = Array.from(node.children.values()).sort((a: any, b: any) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    );
    subfolders.forEach((sub: any) => {
      childrenContainer.appendChild(renderFolderNode(sub, depth + 1, groupTitle, vscode, onRender));
    });

    const directFiles = [...node.files].sort((a: any, b: any) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    );
    directFiles.forEach((file: any) => {
      childrenContainer.appendChild(renderTreeFileItem(file, true, vscode, onRender));
    });

    folderEl.appendChild(childrenContainer);
  }

  return folderEl;
}

export function renderTreeFileItem(file: CommitFile, inTreeMode: boolean, vscode: any, onRender: () => void): HTMLElement {
  const itemEl = document.createElement('div');
  const isSelected = state.selectedFile === file.path;
  const isPartiallyStaged = file.partiallyStaged || ((file as any).totalChanges > 0 && (file as any).stagedChanges > 0 && (file as any).stagedChanges < (file as any).totalChanges);
  const isChecked = !isPartiallyStaged && (state.checkedFiles.has(file.path) || (file.staged && !isPartiallyStaged));
  itemEl.className = `file-item tree-file-item ${inTreeMode ? 'in-tree' : 'in-flat'} ${isSelected ? 'selected' : ''}`;
  itemEl.dataset.path = file.path;

  const isUnversioned = file.isUntracked;
  const nameColorClass = isUnversioned ? 'name-unversioned' : 'name-modified';

  let badgeHtml = '';
  if (isPartiallyStaged) {
    badgeHtml = `<span class="file-changes-badge">${(file as any).stagedChanges} of ${(file as any).totalChanges} changes</span>`;
  }

  itemEl.innerHTML = `
    ${inTreeMode ? '<span class="tree-item-spacer"></span>' : ''}
    <input type="checkbox" class="file-chk tree-chk" ${isChecked ? 'checked' : ''}/>
    <span class="file-icon">${getFileIcon(file.name)}</span>
    <span class="file-name ${nameColorClass}">${escapeHtml(file.name)}</span>
    ${(!inTreeMode && state.showPaths && file.dir) ? `<span class="file-dir">${escapeHtml(file.dir)}</span>` : ''}
    ${badgeHtml}
  `;

  const fileChk = itemEl.querySelector('.file-chk') as HTMLInputElement;
  if (isPartiallyStaged && fileChk) {
    fileChk.indeterminate = true;
  }
  if (fileChk) {
    fileChk.addEventListener('change', (e) => {
      e.stopPropagation();
      if (fileChk.checked) {
        state.checkedFiles.add(file.path);
        vscode.postMessage({ type: 'stageFile', payload: file.path });
      } else {
        state.checkedFiles.delete(file.path);
        vscode.postMessage({ type: 'unstageFile', payload: file.path });
      }
      onRender();
    });
  }

  itemEl.addEventListener('click', (e) => {
    if (e.target === fileChk) return;
    state.selectedFile = file.path;
    vscode.postMessage({ type: 'openReviewInCenter', payload: file.path });
    if (state.showDiff) {
      vscode.postMessage({ type: 'getFileDiff', payload: file.path });
    }
    onRender();
  });

  itemEl.addEventListener('dblclick', (e) => {
    if (e.target === fileChk) return;
    state.selectedFile = file.path;
    vscode.postMessage({ type: 'openReviewInCenter', payload: file.path });
  });

  itemEl.addEventListener('contextmenu', (e) => {
    showFileContextMenu(e, file, vscode, state, onRender);
  });

  return itemEl;
}

export function renderFileGroup(
  title: string,
  files: CommitFile[],
  expanded: boolean,
  toggleAction: 'toggleChanges' | 'toggleUnversioned',
  vscode: any,
  onRender: () => void
): HTMLElement {
  const groupEl = document.createElement('div');
  groupEl.className = 'tree-group';

  const anyPartiallyStaged = files.some((f: any) => f.partiallyStaged || (f.totalChanges > 0 && f.stagedChanges > 0 && f.stagedChanges < f.totalChanges));
  const allChecked = files.length > 0 && files.every(f => (state.checkedFiles.has(f.path) || (f.staged && !f.partiallyStaged)));
  const someChecked = anyPartiallyStaged || (!allChecked && files.some((f: any) => state.checkedFiles.has(f.path) || f.staged || f.stagedChanges > 0));

  const header = document.createElement('div');
  header.className = 'group-header';
  header.innerHTML = `
    <span class="group-arrow ${expanded ? 'expanded' : ''}">
      <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M6 3.5L10.5 8L6 12.5L5 11.5L8.5 8L5 4.5L6 3.5Z"/>
      </svg>
    </span>
    <input type="checkbox" class="group-chk" ${allChecked ? 'checked' : ''}/>
    <span class="group-title">${title}</span>
    <span class="group-count">${files.length} ${files.length === 1 ? 'file' : 'files'}</span>
  `;

  const chk = header.querySelector('.group-chk') as HTMLInputElement;
  chk.indeterminate = someChecked && !allChecked;

  chk.addEventListener('change', (e) => {
    e.stopPropagation();
    const check = chk.checked;
    const paths = files.map(f => f.path);
    if (check) {
      paths.forEach(p => state.checkedFiles.add(p));
      vscode.postMessage({ type: 'stageFiles', payload: paths });
    } else {
      paths.forEach(p => state.checkedFiles.delete(p));
      vscode.postMessage({ type: 'unstageFiles', payload: paths });
    }
    onRender();
  });

  header.addEventListener('click', (e) => {
    if (e.target === chk) return;
    if (toggleAction === 'toggleChanges') {
      state.expandChanges = !state.expandChanges;
    } else {
      state.expandUnversioned = !state.expandUnversioned;
    }
    onRender();
  });

  groupEl.appendChild(header);

  if (expanded && files.length > 0) {
    const isTreeMode = Boolean(state.groupByDirectory || state.groupByModule);
    const itemsContainer = document.createElement('div');
    itemsContainer.className = `group-items ${isTreeMode ? 'group-tree-mode' : ''}`;

    if (state.groupByModule) {
      const moduleName = state.repoName || 'Project';
      const modulePath = `__module__:${title}:${moduleName}`;
      const isModuleExpanded = isFolderExpanded(modulePath, true);

      const moduleNodeEl = document.createElement('div');
      moduleNodeEl.className = 'tree-folder-node module-folder-node';

      const moduleHeader = document.createElement('div');
      moduleHeader.className = 'tree-folder-header module-header';
      moduleHeader.dataset.folderPath = modulePath;

      moduleHeader.innerHTML = `
        <span class="tree-arrow ${isModuleExpanded ? 'expanded' : ''}">
          <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M6 3.5L10.5 8L6 12.5L5 11.5L8.5 8L5 4.5L6 3.5Z"/>
          </svg>
        </span>
        <input type="checkbox" class="file-chk tree-chk group-chk" ${allChecked ? 'checked' : ''}/>
        <span class="tree-folder-icon">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M1.5 3.5C1.5 2.67157 2.17157 2 3 2H6.08579C6.48362 2 6.86514 2.15804 7.14645 2.43934L8.70711 4H13C13.8284 4 14.5 4.67157 14.5 5.5V12.5C14.5 13.3284 13.8284 14 13 14H3C2.17157 14 1.5 13.3284 1.5 12.5V3.5Z" stroke="#8C8C8C" stroke-width="1.2" fill="none"/>
          </svg>
        </span>
        <span class="tree-folder-name">${escapeHtml(moduleName)}</span>
        <span class="tree-folder-count">${files.length} ${files.length === 1 ? 'file' : 'files'}</span>
      `;

      const modChk = moduleHeader.querySelector('.tree-chk') as HTMLInputElement;
      if (modChk) {
        modChk.indeterminate = someChecked && !allChecked;
        modChk.addEventListener('change', (e) => {
          e.stopPropagation();
          const isChecked = modChk.checked;
          const paths = files.map(f => f.path);
          if (isChecked) {
            paths.forEach(p => state.checkedFiles.add(p));
            vscode.postMessage({ type: 'stageFiles', payload: paths });
          } else {
            paths.forEach(p => state.checkedFiles.delete(p));
            vscode.postMessage({ type: 'unstageFiles', payload: paths });
          }
          onRender();
        });
      }

      moduleHeader.addEventListener('click', (e) => {
        if (e.target === modChk) return;
        toggleFolder(modulePath, true, onRender);
      });

      moduleNodeEl.appendChild(moduleHeader);

      if (isModuleExpanded) {
        const modChildrenContainer = document.createElement('div');
        modChildrenContainer.className = 'tree-folder-children module-children';

        if (state.groupByDirectory) {
          const treeRoot = buildDirectoryTree(files);
          const subfolders = Array.from(treeRoot.children.values()).sort((a: any, b: any) =>
            a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
          );
          subfolders.forEach((sub: any) => {
            modChildrenContainer.appendChild(renderFolderNode(sub, 1, title, vscode, onRender));
          });
          const directFiles = [...treeRoot.files].sort((a: any, b: any) =>
            a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
          );
          directFiles.forEach((file: any) => {
            modChildrenContainer.appendChild(renderTreeFileItem(file, true, vscode, onRender));
          });
        } else {
          files.forEach(file => {
            modChildrenContainer.appendChild(renderTreeFileItem(file, false, vscode, onRender));
          });
        }

        moduleNodeEl.appendChild(modChildrenContainer);
      }

      itemsContainer.appendChild(moduleNodeEl);
    } else if (state.groupByDirectory) {
      const treeRoot = buildDirectoryTree(files);
      const subfolders = Array.from(treeRoot.children.values()).sort((a: any, b: any) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
      );
      subfolders.forEach((sub: any) => {
        itemsContainer.appendChild(renderFolderNode(sub, 0, title, vscode, onRender));
      });
      const directFiles = [...treeRoot.files].sort((a: any, b: any) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
      );
      directFiles.forEach((file: any) => {
        itemsContainer.appendChild(renderTreeFileItem(file, true, vscode, onRender));
      });
    } else {
      files.forEach(file => {
        itemsContainer.appendChild(renderTreeFileItem(file, false, vscode, onRender));
      });
    }

    groupEl.appendChild(itemsContainer);
  }

  return groupEl;
}
