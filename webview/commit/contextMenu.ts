import { escapeHtml } from '../shared/escape';
import { state } from './state';
import { CommitFile } from './types';

let activeContextMenu: HTMLElement | null = null;
let lastContextMenuOpenedAt = 0;

export function closeContextMenu(): void {
  if (activeContextMenu) {
    activeContextMenu.remove();
    activeContextMenu = null;
  }
}

export function showFileContextMenu(e: MouseEvent, file: CommitFile, vscode: any, onRender?: () => void): void {
  e.preventDefault();
  e.stopPropagation();
  lastContextMenuOpenedAt = Date.now();
  closeContextMenu();

  state.selectedFile = file.path;
  document.querySelectorAll('.file-item').forEach(el => el.classList.remove('selected'));
  const currentItem = e.currentTarget as HTMLElement | null;
  if (currentItem) currentItem.classList.add('selected');

  const menu = document.createElement('div');
  menu.className = 'as-context-menu';
  menu.setAttribute('data-vscode-context', JSON.stringify({ preventDefaultContextMenuItems: true }));
  menu.addEventListener('contextmenu', (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
  });
  activeContextMenu = menu;

  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const optKey = isMac ? '⌥' : 'Alt+';
  const cmdKey = isMac ? '⌘' : 'Ctrl+';

  const isStaged = file.staged && !file.partiallyStaged;
  const vcsActionLabel = file.isUntracked ? 'Add to VCS' : (isStaged ? 'Unstage' : 'Add to VCS');

  const svgRollback = `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><g fill="currentColor" fill-rule="evenodd" transform="translate(2 1)"><polygon points="0 0 4 4 0 8" transform="matrix(-1 0 0 1 4 0)"/><path d="M4.15058343,11 L8.06891179,11 C9.72576604,11 11.0689118,9.65685425 11.0689118,8 C11.0689118,6.34314575 9.72576604,5 8.06891179,5 L4.03764586,5 L4,3 L8,3 C10.7614237,3 13,5.23857625 13,8 C13,10.7614237 10.7614237,13 8,13 L4.18822929,13 L4.15058343,11 Z"/></g></svg>`;
  const svgDiff = `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M5.85355 8.14645C5.65829 7.95118 5.34171 7.95118 5.14645 8.14645C4.95118 8.34171 4.95118 8.65829 5.14645 8.85355L7.29289 11H0.5C0.223858 11 0 11.2239 0 11.5C0 11.7761 0.223858 12 0.5 12H7.29289L5.14645 14.1464C4.95118 14.3417 4.95118 14.6583 5.14645 14.8536C5.34171 15.0488 5.65829 15.0488 5.85355 14.8536L8.85355 11.8536L9.20711 11.5L8.85355 11.1464L5.85355 8.14645Z"/><path fill-rule="evenodd" clip-rule="evenodd" d="M10.1464 1.14645C10.3417 0.951184 10.6583 0.951184 10.8536 1.14645C11.0488 1.34171 11.0488 1.65829 10.8536 1.85355L8.70711 4H15.5C15.7761 4 16 4.22386 16 4.5C16 4.77614 15.7761 5 15.5 5H8.70711L10.8536 7.14645C11.0488 7.34171 11.0488 7.65829 10.8536 7.85355C10.6583 8.04882 10.3417 8.04882 10.1464 7.85355L7.14645 4.85355L6.79289 4.5L7.14645 4.14645L10.1464 1.14645Z"/></svg>`;
  const svgJumpToSource = `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><g transform="translate(1 1)"><path d="M10.5680324,4.97553028 L8.07248899,2.47998684 L2,8.51847817 L2,11 L4.49554344,11 L10.5680324,4.97553028 Z M12.647652,2.89591075 C12.9147826,2.6287544 12.9147826,1.91529537 12.647652,1.64813903 L11.3998802,0.400367308 C11.1327496,0.133210961 10.4192392,0.133210961 10.1521085,0.400367308 L8.9043368,1.64813903 L11.3998802,4.14368247 L12.647652,2.89591075 Z"/><rect width="14" height="2" y="12"/></g></svg>`;
  const svgDelete = `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M7 2H9C9.55228 2 10 2.44772 10 3H6C6 2.44772 6.44772 2 7 2ZM5 3C5 1.89543 5.89543 1 7 1H9C10.1046 1 11 1.89543 11 3H13C13.5523 3 14 3.44772 14 4V5V6H13V13C13 14.1046 12.1046 15 11 15H5C3.89543 15 3 14.1046 3 13V6H2V5V4C2 3.44772 2.44772 3 3 3H5ZM11 4H10H6H5H3V5H4H12H13V4H11ZM4 6H12V13C12 13.5523 11.5523 14 11 14H5C4.44772 14 4 13.5523 4 13V6ZM6.5 7C6.22386 7 6 7.22386 6 7.5V11.5C6 11.7761 6.22386 12 6.5 12C6.77614 12 7 11.7761 7 11.5V7.5C7 7.22386 6.77614 7 6.5 7ZM9 7.5C9 7.22386 9.22386 7 9.5 7C9.77614 7 10 7.22386 10 7.5V11.5C10 11.7761 9.77614 12 9.5 12C9.22386 12 9 11.7761 9 11.5V7.5Z"/></svg>`;
  const svgAddVcs = `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M7.5 2C7.77614 2 8 2.22386 8 2.5V7.5H13C13.2761 7.5 13.5 7.72386 13.5 8C13.5 8.27614 13.2761 8.5 13 8.5H8V13.5C8 13.7761 7.77614 14 7.5 14C7.22386 14 7 13.7761 7 13.5V8.5H2C1.72386 8.5 1.5 8.27614 1.5 8C1.5 7.72386 1.72386 7.5 2 7.5H7V2.5C7 2.22386 7.22386 2 7.5 2Z"/></svg>`;
  const svgUnstage = `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M2 7.5C2 7.22386 2.22386 7 2.5 7H13.5C13.7761 7 14 7.22386 14 7.5C14 7.77614 13.7761 8 13.5 8H2.5C2.22386 8 2 7.77614 2 7.5Z"/></svg>`;
  const svgRefresh = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor"><path d="M2.5 9V8C2.5 4.96243 4.96243 2.5 8 2.5C9.10679 2.5 10.1372 2.82692 11 3.38947" stroke-linecap="round"/><path d="M5 12.6105C5.86278 13.1731 6.89321 13.5 8 13.5C11.0376 13.5 13.5 11.0376 13.5 8V7" stroke-linecap="round"/><path d="M0.5 7.5L2.5 9.5L4.5 7.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M11.5 8.5L13.5 6.5L15.5 8.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const svgChangelist = `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" d="M2,2 L14,2 L14,14 L2,14 L2,2 Z M4,4 L4,12 L12,12 L12,4 L4,4 Z M5,5 H11 V6 H5 Z M5,7 H11 V8 H5 Z M5,9 H11 V10 H5 Z"/></svg>`;
  const svgNewChangelist = `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" d="M2,2 L14,2 L14,14 L2,14 L2,2 Z M4,4 L4,12 L12,12 L12,4 L4,4 Z M7.5,5 H8.5 V7.5 H11 V8.5 H8.5 V11 H7.5 V8.5 H5 V7.5 H7.5 Z"/></svg>`;

  interface MenuItemDef {
    label?: string;
    shortcut?: string;
    icon?: string;
    action?: () => void;
    separator?: boolean;
  }

  const items: MenuItemDef[] = [
    {
      label: 'Rollback...',
      shortcut: `${optKey}${cmdKey}Z`,
      icon: svgRollback,
      action: () => vscode.postMessage({ type: 'rollbackFiles', payload: [file.path] })
    },
    {
      label: 'Show Diff',
      shortcut: `${cmdKey}D`,
      icon: svgDiff,
      action: () => vscode.postMessage({ type: 'openReviewInCenter', payload: file.path })
    },
    {
      label: 'Jump to Source',
      shortcut: 'F4',
      icon: svgJumpToSource,
      action: () => vscode.postMessage({ type: 'jumpToSource', payload: file.path })
    },
    { separator: true },
    {
      label: 'Move to Another Changelist...',
      shortcut: 'F6',
      icon: svgChangelist,
      action: () => {
        const selected = state.checkedFiles.has(file.path) && state.checkedFiles.size > 1
          ? Array.from(state.checkedFiles)
          : [file.path];
        vscode.postMessage({ type: 'promptMoveToChangelist', payload: { files: selected } });
      }
    },
    {
      label: 'New Changelist...',
      icon: svgNewChangelist,
      action: () => vscode.postMessage({ type: 'newChangelist' })
    },
    { separator: true },
    {
      label: 'Delete...',
      shortcut: '⌫',
      icon: svgDelete,
      action: () => vscode.postMessage({ type: 'deleteFile', payload: file.path })
    },
    {
      label: vcsActionLabel,
      shortcut: `${optKey}${cmdKey}A`,
      icon: isStaged ? svgUnstage : svgAddVcs,
      action: () => {
        if (isStaged) {
          vscode.postMessage({ type: 'unstageFile', payload: file.path });
        } else {
          vscode.postMessage({ type: 'stageFile', payload: file.path });
        }
      }
    },
    { separator: true },
    {
      label: 'Refresh',
      shortcut: `${cmdKey}R`,
      icon: svgRefresh,
      action: () => vscode.postMessage({ type: 'refresh' })
    }
  ];

  items.forEach(it => {
    if (it.separator) {
      const sep = document.createElement('div');
      sep.className = 'as-menu-separator';
      menu.appendChild(sep);
      return;
    }

    const row = document.createElement('div');
    row.className = 'as-menu-item';
    row.innerHTML = `
      <div class="as-menu-item-left">
        <span class="as-menu-icon">${it.icon || ''}</span>
        <span class="as-menu-label">${escapeHtml(it.label || '')}</span>
      </div>
      ${it.shortcut ? `<span class="as-menu-shortcut">${it.shortcut}</span>` : ''}
    `;

    row.addEventListener('click', (ev) => {
      ev.stopPropagation();
      closeContextMenu();
      if (it.action) it.action();
    });

    menu.appendChild(row);
  });

  document.body.appendChild(menu);

  let posX = e.clientX;
  let posY = e.clientY;
  const menuRect = menu.getBoundingClientRect();
  if (posX + menuRect.width > window.innerWidth) {
    posX = Math.max(8, window.innerWidth - menuRect.width - 8);
  }
  if (posY + menuRect.height > window.innerHeight) {
    posY = Math.max(8, window.innerHeight - menuRect.height - 8);
  }
  menu.style.left = `${posX}px`;
  menu.style.top = `${posY}px`;
}

export function registerGlobalContextMenuListeners(vscode: any, onRender?: () => void): void {
  window.addEventListener('click', closeContextMenu);
  window.addEventListener('blur', () => {
    if (Date.now() - lastContextMenuOpenedAt > 200) {
      closeContextMenu();
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) closeContextMenu();
  });
  window.addEventListener('message', (e) => {
    if (e.data?.type === 'closeAllMenus') {
      if (Date.now() - lastContextMenuOpenedAt > 200) {
        closeContextMenu();
        document.querySelectorAll('.as-context-menu, .as-view-options-menu').forEach(el => el.remove());
      }
    }
  });
  window.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeContextMenu();
      return;
    }
    const isInputFocused = document.activeElement && (
      document.activeElement.tagName === 'TEXTAREA' ||
      document.activeElement.tagName === 'INPUT'
    );
    if (isInputFocused) return;

    if (state.selectedFile) {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
      if (e.key === 'F4') {
        e.preventDefault();
        vscode.postMessage({ type: 'jumpToSource', payload: state.selectedFile });
      } else if (e.key === 'F6') {
        e.preventDefault();
        const selected = state.checkedFiles.has(state.selectedFile) && state.checkedFiles.size > 1
          ? Array.from(state.checkedFiles)
          : [state.selectedFile];
        vscode.postMessage({ type: 'promptMoveToChangelist', payload: { files: selected } });
      } else if (cmdOrCtrl && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        vscode.postMessage({ type: 'openReviewInCenter', payload: state.selectedFile });
      } else if (cmdOrCtrl && e.altKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        vscode.postMessage({ type: 'rollbackFiles', payload: [state.selectedFile] });
      } else if (e.key === 'F7' || (e as any).keyCode === 118) {
        e.preventDefault();
        let targetFile = state.selectedFile;
        if (!targetFile && state.files && state.files.length > 0) {
          targetFile = state.files[0].path;
          state.selectedFile = targetFile;
          if (onRender) onRender();
        }
        if (targetFile) {
          vscode.postMessage({
            type: 'openReviewInCenter',
            payload: {
              filePath: targetFile,
              jumpDiff: true,
              fromFileList: true,
              direction: e.shiftKey ? -1 : 1,
            },
          });
        }
      }
    }
  });
}

export function showChangelistContextMenu(
  e: MouseEvent,
  clName: string,
  isActive: boolean,
  vscode: any,
): void {
  e.preventDefault();
  e.stopPropagation();
  lastContextMenuOpenedAt = Date.now();
  closeContextMenu();

  const menu = document.createElement('div');
  menu.className = 'as-context-menu';
  menu.setAttribute('data-vscode-context', JSON.stringify({ preventDefaultContextMenuItems: true }));
  menu.addEventListener('contextmenu', (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
  });
  activeContextMenu = menu;

  const svgChangelist = `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" d="M2,2 L14,2 L14,14 L2,14 L2,2 Z M4,4 L4,12 L12,12 L12,4 L4,4 Z M5,5 H11 V6 H5 Z M5,7 H11 V8 H5 Z M5,9 H11 V10 H5 Z"/></svg>`;
  const svgNewChangelist = `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" d="M2,2 L14,2 L14,14 L2,14 L2,2 Z M4,4 L4,12 L12,12 L12,4 L4,4 Z M7.5,5 H8.5 V7.5 H11 V8.5 H8.5 V11 H7.5 V8.5 H5 V7.5 H7.5 Z"/></svg>`;
  const svgDelete = `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M7 2H9C9.55228 2 10 2.44772 10 3H6C6 2.44772 6.44772 2 7 2ZM5 3C5 1.89543 5.89543 1 7 1H9C10.1046 1 11 1.89543 11 3H13C13.5523 3 14 3.44772 14 4V5V6H13V13C13 14.1046 12.1046 15 11 15H5C3.89543 15 3 14.1046 3 13V6H2V5V4C2 3.44772 2.44772 3 3 3H5ZM11 4H10H6H5H3V5H4H12H13V4H11ZM4 6H12V13C12 13.5523 11.5523 14 11 14H5C4.44772 14 4 13.5523 4 13V6ZM6.5 7C6.22386 7 6 7.22386 6 7.5V11.5C6 11.7761 6.22386 12 6.5 12C6.77614 12 7 11.7761 7 11.5V7.5C7 7.22386 6.77614 7 6.5 7ZM9 7.5C9 7.22386 9.22386 7 9.5 7C9.77614 7 10 7.22386 10 7.5V11.5C10 11.7761 9.77614 12 9.5 12C9.22386 12 9 11.7761 9 11.5V7.5Z"/></svg>`;

  interface MenuItemDef {
    label?: string;
    shortcut?: string;
    icon?: string;
    action?: () => void;
    separator?: boolean;
  }

  const items: MenuItemDef[] = [];
  if (!isActive) {
    items.push({
      label: 'Set as Active Changelist',
      icon: svgChangelist,
      action: () => vscode.postMessage({ type: 'setActiveChangelist', payload: clName }),
    });
  }
  items.push({
    label: 'New Changelist...',
    icon: svgNewChangelist,
    action: () => vscode.postMessage({ type: 'newChangelist' }),
  });
  if (clName !== 'Default') {
    items.push({ separator: true });
    items.push({
      label: 'Delete Changelist',
      icon: svgDelete,
      action: () => vscode.postMessage({ type: 'deleteChangelist', payload: clName }),
    });
  }

  items.forEach(it => {
    if (it.separator) {
      const sep = document.createElement('div');
      sep.className = 'as-menu-separator';
      menu.appendChild(sep);
      return;
    }

    const row = document.createElement('div');
    row.className = 'as-menu-item';
    row.innerHTML = `
      <div class="as-menu-item-left">
        <span class="as-menu-icon">${it.icon || ''}</span>
        <span class="as-menu-label">${escapeHtml(it.label || '')}</span>
      </div>
      ${it.shortcut ? `<span class="as-menu-shortcut">${it.shortcut}</span>` : ''}
    `;

    row.addEventListener('click', (ev) => {
      ev.stopPropagation();
      closeContextMenu();
      if (it.action) it.action();
    });

    menu.appendChild(row);
  });

  document.body.appendChild(menu);

  let posX = e.clientX;
  let posY = e.clientY;
  const menuRect = menu.getBoundingClientRect();
  if (posX + menuRect.width > window.innerWidth) {
    posX = Math.max(8, window.innerWidth - menuRect.width - 8);
  }
  if (posY + menuRect.height > window.innerHeight) {
    posY = Math.max(8, window.innerHeight - menuRect.height - 8);
  }
  menu.style.left = `${posX}px`;
  menu.style.top = `${posY}px`;
}
