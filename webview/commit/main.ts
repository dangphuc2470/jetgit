import { escapeHtml } from '../shared/escape';
import { attachTooltip } from '../shared/tooltip';
import { state } from './state';
import { renderFileGroup } from './treeView';
import { renderDiffViewer } from './diffViewer';
import {
  renderRecentMessagesDropdown,
  renderCommitGearDropdown,
  renderViewOptionsDropdown,
} from './dropdowns';
import {
  openConflictsDialog,
  openPushDialog,
  updateConflictsDialog,
  closePushDialog,
  handlePushError,
} from './dialogs';
import { registerGlobalContextMenuListeners } from './contextMenu';

declare function acquireVsCodeApi(): any;
const vscode = acquireVsCodeApi();

const app = document.getElementById('app') as HTMLElement;

function render(): void {
  if (!app) return;
  app.innerHTML = '';

  const container = document.createElement('div');
  container.className = 'commit-window';

  // 1. Tab Bar
  const tabBar = document.createElement('div');
  tabBar.className = 'tab-bar';
  tabBar.innerHTML = `
    <div class="tab-items">
      <button class="tab-btn ${state.activeTab === 'commit' ? 'active' : ''}" data-tab="commit">Commit</button>
      <button class="tab-btn ${state.activeTab === 'shelf' ? 'active' : ''}" data-tab="shelf">Shelf</button>
      <button class="tab-btn ${state.activeTab === 'stash' ? 'active' : ''}" data-tab="stash">Stash</button>
    </div>
    <div class="tab-actions">
      <button class="icon-btn" id="btn-tab-menu" title="More Options">⋮</button>
      <button class="icon-btn" id="btn-tab-collapse" title="Collapse / Minimize">—</button>
    </div>
  `;
  container.appendChild(tabBar);

  // If shelf tab
  if (state.activeTab === 'shelf') {
    const shelfContent = document.createElement('div');
    shelfContent.className = 'shelf-view';
    shelfContent.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📁</div>
        <div class="empty-title">No Shelved Changes</div>
        <div class="empty-sub">Shelve changes to temporarily set them aside without committing.</div>
        <button class="action-btn-primary" id="btn-create-shelf">Shelf Changes...</button>
      </div>
    `;
    container.appendChild(shelfContent);
    attachTabEvents(container);
    app.appendChild(container);
    return;
  }

  // If stash tab
  if (state.activeTab === 'stash') {
    const stashContent = document.createElement('div');
    stashContent.className = 'stash-view';
    let stashItems = state.stashes.map((s: any) => `
      <div class="stash-row">
        <div class="stash-info">
          <span class="stash-idx">${s.index}</span>
          <span class="stash-msg">${escapeHtml(s.message || 'WIP on branch')}</span>
          <span class="stash-date">${s.date || ''}</span>
        </div>
        <div class="stash-actions">
          <button class="stash-btn" data-act="pop" data-idx="${s.index}">Pop</button>
          <button class="stash-btn" data-act="apply" data-idx="${s.index}">Apply</button>
          <button class="stash-btn danger" data-act="drop" data-idx="${s.index}">Drop</button>
        </div>
      </div>
    `).join('');

    if (state.stashes.length === 0) {
      stashItems = `
        <div class="empty-state">
          <div class="empty-title">No Stashes</div>
          <div class="empty-sub">Use git stash to save local uncommitted changes.</div>
        </div>
      `;
    }

    stashContent.innerHTML = `
      <div class="stash-header">
        <span class="stash-title">Git Stashes (${state.stashes.length})</span>
        <button class="action-btn-primary" id="btn-create-stash">+ New Stash...</button>
      </div>
      <div class="stash-list">${stashItems}</div>
    `;
    container.appendChild(stashContent);
    attachTabEvents(container);
    attachStashEvents(stashContent);
    app.appendChild(container);
    return;
  }

  // 2. Conflict Banner Bar
  const hasConflictState = state.conflictInfo && (state.conflictInfo.hasConflicts || state.conflictInfo.isMerging || state.conflictInfo.isRebasing);
  if (hasConflictState) {
    const conflictBar = document.createElement('div');
    conflictBar.className = 'conflict-header-bar';
    const numConflicts = state.conflictInfo?.conflicts?.length || 0;
    const titleText = numConflicts > 0
      ? `Resolve Conflicts (${numConflicts})`
      : (state.conflictInfo?.isRebasing ? 'Rebase in Progress' : 'Merge in Progress');

    conflictBar.innerHTML = `
      <div class="conflict-bar-left">
        <span class="conflict-bar-title">${titleText}</span>
      </div>
      <div class="conflict-bar-actions">
        <button class="conflict-action-btn btn-resolve" id="btn-resolve-conflicts" title="Resolve Conflicts...">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path d="M2.5 3.5L7 8L2.5 12.5M8.5 3.5L13 8L8.5 12.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <button class="conflict-action-btn btn-abort" id="btn-abort-merge" title="Abort Merge / Rebase">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path d="M3.5 3.5L12.5 12.5M12.5 3.5L3.5 12.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    `;
    container.appendChild(conflictBar);
  }

  // 3. Toolbar
  const toolbar = document.createElement('div');
  toolbar.className = 'commit-toolbar';
  toolbar.innerHTML = `
    <div class="tool-left">
      <button class="tool-btn" id="btn-refresh" title="Refresh (Cmd+R)" data-tooltip="Refresh" data-shortcut="Cmd+R">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style="display:block;">
          <path fill-rule="evenodd" d="M12.5747152,11.8852806 C11.4741474,13.1817355 9.83247882,14.0044386 7.99865879,14.0044386 C5.03907292,14.0044386 2.57997332,11.8615894 2.08820756,9.0427473 L3.94774327,9.10768372 C4.43372186,10.8898575 6.06393114,12.2000519 8.00015362,12.2000519 C9.30149237,12.2000519 10.4645985,11.6082097 11.2349873,10.6790094 L9.05000019,8.71167959 L14.0431479,8.44999981 L14.3048222,13.4430431 L12.5747152,11.8852806 Z M3.42785637,4.11741586 C4.52839138,2.82452748 6.16775464,2.00443857 7.99865879,2.00443857 C10.918604,2.00443857 13.3513802,4.09026967 13.8882946,6.8532307 L12.0226389,6.78808057 C11.5024872,5.05935553 9.89838095,3.8000774 8.00015362,3.8000774 C6.69867367,3.8000774 5.53545628,4.39204806 4.76506921,5.32142241 L6.95482203,7.29304326 L1.96167436,7.55472304 L1.70000005,2.56167973 L3.42785637,4.11741586 Z" transform="rotate(3 8.002 8.004)"/>
        </svg>
      </button>
      <button class="tool-btn" id="btn-rollback" title="Rollback (Cmd+Alt+Z)" data-tooltip="Rollback" data-shortcut="Cmd+Alt+Z">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style="display:block;">
          <g fill-rule="evenodd" transform="translate(1 0)">
            <polygon points="0 0 4 4 0 8" transform="matrix(-1 0 0 1 4 0)"/>
            <path d="M4.15058343,11 L8.06891179,11 C9.72576604,11 11.0689118,9.65685425 11.0689118,8 C11.0689118,6.34314575 9.72576604,5 8.06891179,5 L4.03764586,5 L4,3 L8,3 C10.7614237,3 13,5.23857625 13,8 C13,10.7614237 10.7614237,13 8,13 L4.18822929,13 L4.15058343,11 Z"/>
          </g>
        </svg>
      </button>
      <button class="tool-btn ${state.showDiff ? 'active' : ''}" id="btn-show-diff" title="Show Diff / Review (Cmd+D)" data-tooltip="Show Diff / Review" data-shortcut="Cmd+D">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style="display:block;">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M5.85355 8.14645C5.65829 7.95118 5.34171 7.95118 5.14645 8.14645C4.95118 8.34171 4.95118 8.65829 5.14645 8.85355L7.29289 11H0.5C0.223858 11 0 11.2239 0 11.5C0 11.7761 0.223858 12 0.5 12H7.29289L5.14645 14.1464C4.95118 14.3417 4.95118 14.6583 5.14645 14.8536C5.34171 15.0488 5.65829 15.0488 5.85355 14.8536L8.85355 11.8536L9.20711 11.5L8.85355 11.1464L5.85355 8.14645Z"/>
          <path fill-rule="evenodd" clip-rule="evenodd" d="M10.1464 1.14645C10.3417 0.951184 10.6583 0.951184 10.8536 1.14645C11.0488 1.34171 11.0488 1.65829 10.8536 1.85355L8.70711 4H15.5C15.7761 4 16 4.22386 16 4.5C16 4.77614 15.7761 5 15.5 5H8.70711L10.8536 7.14645C11.0488 7.34171 11.0488 7.65829 10.8536 7.85355C10.6583 8.04882 10.3417 8.04882 10.1464 7.85355L7.14645 4.85355L6.79289 4.5L7.14645 4.14645L10.1464 1.14645Z"/>
        </svg>
      </button>
      <div class="view-options-wrapper" id="view-options-wrapper" style="position:relative;display:inline-block;">
        <button class="tool-btn ${state.viewOptionsOpen ? 'active' : ''}" id="btn-view-options" title="View Options" data-tooltip="View Options">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style="display:block;">
            <path d="M1.5 8C3 4.5 7 2.8 8 2.8C9 2.8 13 4.5 14.5 8C13 11.5 9 13.2 8 13.2C7 13.2 3 11.5 1.5 8Z" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="8" cy="8" r="2.2" stroke="currentColor" stroke-width="1.3"/>
            <polygon points="12,14.5 15,14.5 15,11.5" fill="currentColor"/>
          </svg>
        </button>
        ${state.viewOptionsOpen ? renderViewOptionsDropdown() : ''}
      </div>
      <button class="tool-btn" id="btn-expand-all" title="Expand All" data-tooltip="Expand All">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
          <polyline points="4 5.5 8 1.5 12 5.5"/>
          <polyline points="4 10.5 8 14.5 12 10.5"/>
        </svg>
      </button>
      <button class="tool-btn" id="btn-collapse-all" title="Collapse All" data-tooltip="Collapse All">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
          <polyline points="4 2.5 8 6.5 12 2.5"/>
          <polyline points="4 13.5 8 9.5 12 13.5"/>
        </svg>
      </button>
    </div>
  `;
  container.appendChild(toolbar);

  // 4. Body
  const mainBody = document.createElement('div');
  mainBody.className = `commit-body ${state.showDiff ? 'with-diff' : ''}`;

  const leftPanel = document.createElement('div');
  leftPanel.className = 'commit-left-panel';

  const treeContainer = document.createElement('div');
  treeContainer.className = 'file-tree-container';
  treeContainer.style.flex = `${state.splitRatio}`;

  const changesFiles = state.files
    .filter(f => !f.isUntracked)
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }) || a.path.localeCompare(b.path));
  const unversionedFiles = state.files
    .filter(f => f.isUntracked)
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }) || a.path.localeCompare(b.path));

  const changesGroup = renderFileGroup(
    'Changes',
    changesFiles,
    state.expandChanges,
    'toggleChanges',
    vscode,
    render
  );
  treeContainer.appendChild(changesGroup);

  if (state.showIgnoredFiles !== false) {
    const unversionedGroup = renderFileGroup(
      'Unversioned Files',
      unversionedFiles,
      state.expandUnversioned,
      'toggleUnversioned',
      vscode,
      render
    );
    treeContainer.appendChild(unversionedGroup);
  }

  leftPanel.appendChild(treeContainer);

  const hSplitter = document.createElement('div');
  hSplitter.className = 'h-splitter';
  hSplitter.innerHTML = `<div class="splitter-line"></div>`;
  attachHSplitter(hSplitter, treeContainer, leftPanel);
  leftPanel.appendChild(hSplitter);

  const commitBox = document.createElement('div');
  commitBox.className = 'commit-box';
  commitBox.style.flex = `${1 - state.splitRatio}`;

  commitBox.innerHTML = `
    <div class="commit-options-bar">
      <div class="amend-tools-group">
        <label class="checkbox-label amend-label" title="Amend previous commit" data-tooltip="Amend previous commit">
          <input type="checkbox" id="chk-amend" class="amend-chk" ${state.isAmend ? 'checked' : ''}/>
          <span>Amend</span>
        </label>
        <div class="commit-icon-tools">
          <button class="tool-btn-sm" id="btn-recent-msgs" title="Recent Commit Messages (Cmd+M)" data-tooltip="Recent Commit Messages" data-shortcut="Cmd+M">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
              <circle cx="8" cy="8" r="6.5"/>
              <polyline points="8 4 8 8 10.5 9.5"/>
            </svg>
          </button>
          <button class="tool-btn-sm ${state.isGeneratingAi ? 'spinning' : ''}" id="btn-generate-ai" title="${state.isGeneratingAi ? 'Generating commit message with AI... Please wait.' : 'Generate Commit Message with AI'}" data-tooltip="${state.isGeneratingAi ? 'Generating commit message with AI... Please wait.' : 'Generate Commit Message with AI'}" ${state.isGeneratingAi ? 'disabled' : ''}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style="display:block;">
              <path d="M11.5973 7.65471L13.6882 5.56049C14.1053 5.15406 14.1003 4.49602 13.6948 4.08627L12.0267 2.3136L12.0224 2.30932C11.6123 1.90004 10.942 1.89327 10.5331 2.31079L8.3867 4.44406M11.5973 7.65471L8.3867 4.44406M11.5973 7.65471L5.74041 13.5H2.50036L2.5 10.32L8.3867 4.44406" stroke="currentColor" stroke-miterlimit="10"/>
              <path d="M13.3214 10.1903L13.8295 11.1171C14.0739 11.5622 14.4413 11.9297 14.8901 12.1742L15.8056 12.675C16.0648 12.817 16.0648 13.1845 15.8056 13.3265L14.8901 13.8272C14.4413 14.0717 14.0739 14.4392 13.8295 14.8843L13.3214 15.8111C13.1837 16.063 12.8163 16.063 12.6786 15.8111L12.1705 14.8829C11.9261 14.4378 11.5587 14.0703 11.1113 13.8258L10.1944 13.325C9.93519 13.183 9.93519 12.8155 10.1944 12.6735L11.1099 12.1728C11.5587 11.9283 11.9261 11.5608 12.1705 11.1157L12.6786 10.1889C12.8163 9.93704 13.1837 9.93704 13.3214 10.1889V10.1903Z" fill="#A571E6"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <div class="commit-input-wrapper">
      <textarea id="commit-message-input" class="${state.isGeneratingAi ? 'ai-generating' : ''}" placeholder="${state.isGeneratingAi ? 'Generating commit message with AI... Please wait...' : 'Commit message...'}">${escapeHtml(state.commitMessage)}</textarea>
      ${state.isGeneratingAi ? '<div class="ai-status-bar"><span class="ai-status-dot"></span><span>AI is generating commit message...</span></div>' : ''}
      ${state.recentOpen ? renderRecentMessagesDropdown() : ''}
    </div>

    <div class="commit-actions-bar">
      <div class="action-buttons-group">
        <button class="btn-commit-primary" id="btn-commit" title="Commit">Commit</button>
        <button class="btn-commit-secondary" id="btn-commit-push" title="Commit and Push...">Commit and Push...</button>
      </div>
      <div class="commit-gear-wrapper">
        <button class="tool-btn-sm" id="btn-commit-gear" title="Before Commit Settings" data-tooltip="Before Commit Settings">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style="display:block;">
            <path d="M9.1 4.4L8.6 2H7.4l-.5 2.4-.7.3-2-1.3-.9.8 1.3 2-.2.7-2.4.5v1.2l2.4.5.3.8-1.3 2 .8.8 2-1.3.8.3.4 2.3h1.2l.5-2.4.8-.3 2 1.3.8-.8-1.3-2 .3-.8 2.3-.4V7.4l-2.4-.5-.3-.8 1.3-2-.8-.8-2 1.3-.7-.2zM9.4 1l.5 2.4L12 2.1l2 2-1.4 2.1 2.4.4v2.8l-2.4.5L14 12l-2 2-2.1-1.4-.5 2.4H6.6l-.5-2.4L4 13.9l-2-2 1.4-2.1L1 9.4V6.6l2.4-.5L2.1 4l2-2 2.1 1.4.4-2.4h2.8zm.6 7c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zM8 9c.6 0 1-.4 1-1s-.4-1-1-1-1 .4-1 1 .4 1 1 1z"/>
          </svg>
        </button>
        ${state.commitOptionsOpen ? renderCommitGearDropdown() : ''}
      </div>
    </div>
  `;
  leftPanel.appendChild(commitBox);
  mainBody.appendChild(leftPanel);

  if (state.showDiff) {
    const rightPanel = document.createElement('div');
    rightPanel.className = 'commit-right-panel';
    rightPanel.appendChild(renderDiffViewer(vscode, render));
    mainBody.appendChild(rightPanel);
  }

  container.appendChild(mainBody);
  app.appendChild(container);

  attachTabEvents(container);
  attachToolbarEvents(toolbar, container);
  attachCommitBoxEvents(commitBox);

  container.querySelectorAll('[data-tooltip], [title]').forEach(el => {
    const tip = (el as HTMLElement).dataset.tooltip || el.getAttribute('title');
    const sc = (el as HTMLElement).dataset.shortcut || '';
    if (tip) {
      attachTooltip(el as HTMLElement, tip, sc, 'bottom');
    }
  });
}

function attachTabEvents(container: HTMLElement): void {
  container.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.activeTab = (btn.getAttribute('data-tab') as any) || 'commit';
      render();
    });
  });

  const btnTabMenu = container.querySelector('#btn-tab-menu');
  if (btnTabMenu) {
    btnTabMenu.addEventListener('click', () => {
      vscode.postMessage({ type: 'openLog' });
    });
  }

  const btnTabCollapse = container.querySelector('#btn-tab-collapse');
  if (btnTabCollapse) {
    btnTabCollapse.addEventListener('click', () => {
      vscode.postMessage({ type: 'collapseView' });
    });
  }
}

function attachToolbarEvents(toolbar: HTMLElement, container: HTMLElement): void {
  toolbar.querySelector('#btn-refresh')?.addEventListener('click', () => {
    vscode.postMessage({ type: 'refresh' });
  });

  toolbar.querySelector('#btn-rollback')?.addEventListener('click', () => {
    const selected = Array.from(state.checkedFiles);
    if (selected.length === 0 && state.selectedFile) {
      selected.push(state.selectedFile);
    }
    if (selected.length === 0) return;
    vscode.postMessage({ type: 'rollbackFiles', payload: selected });
  });

  toolbar.querySelector('#btn-show-diff')?.addEventListener('click', () => {
    const selected = state.selectedFile || (state.files[0] ? state.files[0].path : '');
    if (selected) {
      vscode.postMessage({ type: 'openReviewInCenter', payload: selected });
    } else {
      state.showDiff = !state.showDiff;
      render();
    }
  });

  const btnViewOpt = toolbar.querySelector('#btn-view-options');
  if (btnViewOpt) {
    btnViewOpt.addEventListener('click', (e) => {
      e.stopPropagation();
      state.viewOptionsOpen = !state.viewOptionsOpen;
      render();
    });
  }

  const menuViewOpt = toolbar.querySelector('#view-options-menu');
  if (menuViewOpt) {
    menuViewOpt.querySelectorAll('.as-menu-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = (item as HTMLElement).dataset.action;
        if (action === 'toggle-groupBy-directory' || action === 'groupBy-directory') {
          state.groupByDirectory = !state.groupByDirectory;
          state.showPaths = !state.groupByDirectory;
        } else if (action === 'toggle-groupBy-module' || action === 'groupBy-module') {
          state.groupByModule = !state.groupByModule;
        } else if (action === 'toggle-ignored') {
          state.showIgnoredFiles = (state.showIgnoredFiles === false ? true : false);
        }
        render();
      });
    });
  }

  const btnExpandAll = toolbar.querySelector('#btn-expand-all');
  if (btnExpandAll) {
    btnExpandAll.addEventListener('click', () => {
      state.expandChanges = true;
      state.expandUnversioned = true;
      state.expandAllFolders = true;
      state.collapsedFolders.clear();
      state.expandedFolders.clear();
      render();
    });
  }

  const btnCollapseAll = toolbar.querySelector('#btn-collapse-all');
  if (btnCollapseAll) {
    btnCollapseAll.addEventListener('click', () => {
      state.expandAllFolders = false;
      state.expandedFolders.clear();
      state.collapsedFolders.clear();
      render();
    });
  }

  const targetScope = container || document;
  targetScope.querySelector('#btn-resolve-conflicts')?.addEventListener('click', () => {
    vscode.postMessage({ type: 'openConflictsDialog' });
  });

  targetScope.querySelector('#btn-abort-merge')?.addEventListener('click', () => {
    vscode.postMessage({ type: 'abortMerge' });
  });
}

function attachCommitBoxEvents(commitBox: HTMLElement): void {
  const textarea = commitBox.querySelector('#commit-message-input') as HTMLTextAreaElement | null;
  if (textarea) {
    textarea.addEventListener('input', () => {
      state.commitMessage = textarea.value;
    });
  }

  const chkAmend = commitBox.querySelector('#chk-amend') as HTMLInputElement | null;
  if (chkAmend) {
    chkAmend.addEventListener('change', () => {
      state.isAmend = chkAmend.checked;
      if (state.isAmend && (!state.commitMessage || !state.commitMessage.trim())) {
        if (state.recentMessages.length > 0) {
          state.commitMessage = state.recentMessages[0];
          if (textarea) textarea.value = state.commitMessage;
        }
      }
    });
  }

  commitBox.querySelector('#btn-recent-msgs')?.addEventListener('click', (e) => {
    e.stopPropagation();
    state.recentOpen = !state.recentOpen;
    state.commitOptionsOpen = false;
    render();
  });

  commitBox.querySelector('#btn-generate-ai')?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (state.isGeneratingAi) return;
    state.isGeneratingAi = true;
    const files = Array.from(state.checkedFiles);
    render();
    vscode.postMessage({
      type: 'generateAiCommitMessage',
      payload: { files }
    });
  });

  commitBox.querySelector('#btn-commit-gear')?.addEventListener('click', (e) => {
    e.stopPropagation();
    state.commitOptionsOpen = !state.commitOptionsOpen;
    state.recentOpen = false;
    render();
  });

  commitBox.querySelector('#btn-commit')?.addEventListener('click', () => {
    doCommit(false);
  });

  commitBox.querySelector('#btn-commit-push')?.addEventListener('click', () => {
    doCommit(true);
  });

  const dropdown = commitBox.querySelector('#recent-dropdown');
  if (dropdown) {
    dropdown.querySelectorAll('.recent-msg-item').forEach(item => {
      item.addEventListener('click', () => {
        const msg = item.getAttribute('data-msg') || '';
        state.commitMessage = msg;
        state.recentOpen = false;
        render();
      });
    });
  }
}

function doCommit(push: boolean): void {
  if (!state.commitMessage || !state.commitMessage.trim()) {
    textareaFocus();
    return;
  }
  const filesToCommit = Array.from(state.checkedFiles);
  vscode.postMessage({
    type: push ? 'commitAndPush' : 'commit',
    payload: {
      message: state.commitMessage.trim(),
      files: filesToCommit,
      amend: state.isAmend
    }
  });
}

function textareaFocus(): void {
  const ta = document.getElementById('commit-message-input') as HTMLTextAreaElement | null;
  if (ta) {
    ta.focus();
    ta.classList.add('error-pulse');
    setTimeout(() => ta.classList.remove('error-pulse'), 1000);
  }
}

function attachStashEvents(stashContent: HTMLElement): void {
  stashContent.querySelector('#btn-create-stash')?.addEventListener('click', () => {
    vscode.postMessage({ type: 'createStash' });
  });

  stashContent.querySelectorAll('.stash-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const act = btn.getAttribute('data-act');
      const idx = btn.getAttribute('data-idx');
      if (act === 'pop') vscode.postMessage({ type: 'stashPop', payload: idx });
      if (act === 'apply') vscode.postMessage({ type: 'stashApply', payload: idx });
      if (act === 'drop') vscode.postMessage({ type: 'stashDrop', payload: idx });
    });
  });
}

function attachHSplitter(splitter: HTMLElement, topEl: HTMLElement, container: HTMLElement): void {
  let isDragging = false;
  let startY = 0;
  let startRatio = state.splitRatio;

  splitter.addEventListener('mousedown', (e) => {
    isDragging = true;
    startY = e.clientY;
    startRatio = state.splitRatio;
    document.body.classList.add('resizing-h');
    e.preventDefault();
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const containerHeight = container.getBoundingClientRect().height;
    if (containerHeight <= 0) return;
    const dy = e.clientY - startY;
    const dRatio = dy / containerHeight;
    let newRatio = Math.max(0.2, Math.min(0.8, startRatio + dRatio));
    state.splitRatio = newRatio;
    topEl.style.flex = `${newRatio}`;
    const nextBox = topEl.nextElementSibling?.nextElementSibling as HTMLElement | null;
    if (nextBox) {
      nextBox.style.flex = `${1 - newRatio}`;
    }
  });

  window.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      document.body.classList.remove('resizing-h');
    }
  });
}

// Global outside click handler for dropdowns
document.addEventListener('click', (e) => {
  if (state.recentOpen || state.commitOptionsOpen || state.viewOptionsOpen) {
    const target = e.target as HTMLElement | null;
    if (target &&
        !target.closest('#recent-dropdown') && !target.closest('#btn-recent-msgs') &&
        !target.closest('#gear-dropdown') && !target.closest('#btn-commit-gear') &&
        !target.closest('#view-options-wrapper')) {
      state.recentOpen = false;
      state.commitOptionsOpen = false;
      state.viewOptionsOpen = false;
      render();
    }
  }
});

// Shortcut Control/Command+P for toggling Group By Directory
window.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || (e.metaKey && e.altKey)) && (e.key === 'p' || e.key === 'P')) {
    e.preventDefault();
    state.groupByDirectory = !state.groupByDirectory;
    state.showPaths = !state.groupByDirectory;
    render();
  }
});

registerGlobalContextMenuListeners(vscode, render);

// Window message dispatcher
window.addEventListener('message', (event) => {
  const msg = event.data;
  switch (msg.type) {
    case 'showPushDialog': {
      openPushDialog(msg.payload, vscode);
      break;
    }
    case 'pushSuccess': {
      closePushDialog();
      break;
    }
    case 'pushError': {
      handlePushError();
      break;
    }
    case 'init':
    case 'status': {
      const data = msg.payload;
      if (data.repoName) {
        state.repoName = data.repoName;
      }
      state.files = data.files || [];
      state.changesCount = data.changesCount || 0;
      state.unversionedCount = data.unversionedCount || 0;
      state.recentMessages = data.recentMessages || [];
      state.stashes = data.stashes || [];
      state.conflictInfo = data.conflictInfo || {
        hasConflicts: false,
        isMerging: false,
        isRebasing: false,
        yoursBranch: '',
        theirsBranch: '',
        conflicts: [],
      };

      updateConflictsDialog();

      state.checkedFiles.clear();
      state.files.forEach(f => {
        if (f.staged && !f.partiallyStaged) {
          state.checkedFiles.add(f.path);
        }
      });

      if (!state.commitMessage && data.defaultCommitMessage) {
        state.commitMessage = data.defaultCommitMessage;
      }

      if (!state.selectedFile && state.files.length > 0) {
        state.selectedFile = state.files[0].path;
        if (state.showDiff) {
          vscode.postMessage({ type: 'getFileDiff', payload: state.selectedFile });
        }
      }

      render();
      break;
    }
    case 'showConflictsDialog': {
      vscode.postMessage({ type: 'openConflictsDialog' });
      break;
    }
    case 'selectFile': {
      const filePath = typeof msg.payload === 'string' ? msg.payload : msg.payload?.filePath;
      if (filePath && state.selectedFile !== filePath) {
        state.selectedFile = filePath;
        const isUnversioned = state.files.some(f => f.path === filePath && f.isUntracked);
        if (isUnversioned) {
          state.expandUnversioned = true;
        } else {
          state.expandChanges = true;
        }
        render();
        requestAnimationFrame(() => {
          const selectedEl = document.querySelector('.file-item.selected');
          if (selectedEl) {
            selectedEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          }
        });
      }
      break;
    }
    case 'fileDiff': {
      state.diffData = msg.payload;
      if (state.showDiff) {
        render();
      }
      break;
    }
    case 'commitSuccess': {
      state.commitMessage = '';
      state.isAmend = false;
      state.checkedFiles.clear();
      state.diffData = null;
      render();
      break;
    }
    case 'setCommitMessage': {
      state.isGeneratingAi = false;
      const newMsg = msg.payload?.message || '';
      if (newMsg) {
        state.commitMessage = newMsg;
      }
      render();
      break;
    }
    case 'generateAiError': {
      state.isGeneratingAi = false;
      render();
      break;
    }
  }
});

if (typeof document !== 'undefined') {
  if (document.body) {
    document.body.setAttribute('data-vscode-context', JSON.stringify({ preventDefaultContextMenuItems: true }));
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      if (document.body) document.body.setAttribute('data-vscode-context', JSON.stringify({ preventDefaultContextMenuItems: true }));
    });
  }
}

window.addEventListener('contextmenu', (e) => {
  e.preventDefault();
}, true);

// Initial handshake
vscode.postMessage({ type: 'ready' });
