<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { escapeHtml } from '../shared/escape';
  import { attachTooltip } from '../shared/tooltip';
  import { getVsCodeApi } from '$shared/vscodeApi';
  import type { CommitFile, DiffData } from './types';
  import { state as commitState } from './state';
  import { renderDiffViewer } from './diffViewer';
  import { showFileContextMenu, closeContextMenu } from './contextMenu';
  import ChangesTree from './ChangesTree.svelte';
  import CommitBox from './CommitBox.svelte';

  const vscode = getVsCodeApi();

  let activeTab = $state<'commit' | 'shelf' | 'stash'>('commit');
  let files = $state<CommitFile[]>([]);
  let selectedFile = $state<string | null>(null);
  let checkedFiles = $state<Set<string>>(new Set());
  let showDiff = $state(false);
  let diffData = $state<DiffData | null>(null);
  let commitMessage = $state('');
  let isAmend = $state(false);
  let recentMessages = $state<string[]>([]);
  let stashes = $state<any[]>([]);
  let expandChanges = $state(true);
  let expandUnversioned = $state(true);
  let showPaths = $state(true);
  let viewOptionsOpen = $state(false);
  let groupByDirectory = $state(false);
  let groupByModule = $state(false);
  let repoName = $state('Project');
  let expandedFolders = $state<Set<string>>(new Set());
  let collapsedFolders = $state<Set<string>>(new Set());
  let expandAllFolders = $state<boolean | null>(null);
  let showIgnoredFiles = $state(false);
  let commitOptionsOpen = $state(false);
  let recentOpen = $state(false);
  let isGeneratingAi = $state(false);
  let conflictInfo = $state<any>(null);
  let splitRatio = $state(0.6);

  let commitBoxRef: any = $state(null);
  let leftPanelEl: HTMLDivElement | null = $state(null);
  let treeContainerEl: HTMLDivElement | null = $state(null);
  let diffViewerContainerEl: HTMLDivElement | null = $state(null);

  // Sync back to singleton state for any external non-Svelte helpers (diffViewer, contextMenu, dialogs)
  function syncToSingleton() {
    commitState.activeTab = activeTab;
    commitState.files = files;
    commitState.selectedFile = selectedFile;
    commitState.checkedFiles = checkedFiles;
    commitState.showDiff = showDiff;
    commitState.diffData = diffData;
    commitState.commitMessage = commitMessage;
    commitState.isAmend = isAmend;
    commitState.recentMessages = recentMessages;
    commitState.stashes = stashes;
    commitState.expandChanges = expandChanges;
    commitState.expandUnversioned = expandUnversioned;
    commitState.showPaths = showPaths;
    commitState.viewOptionsOpen = viewOptionsOpen;
    commitState.groupByDirectory = groupByDirectory;
    commitState.groupByModule = groupByModule;
    commitState.repoName = repoName;
    commitState.expandedFolders = expandedFolders;
    commitState.collapsedFolders = collapsedFolders;
    commitState.expandAllFolders = expandAllFolders;
    commitState.showIgnoredFiles = showIgnoredFiles;
    commitState.commitOptionsOpen = commitOptionsOpen;
    commitState.recentOpen = recentOpen;
    commitState.isGeneratingAi = isGeneratingAi;
    commitState.conflictInfo = conflictInfo;
    commitState.splitRatio = splitRatio;
  }

  $effect(() => {
    syncToSingleton();
  });

  // Render Diff Viewer into container if showDiff is true
  $effect(() => {
    if (showDiff && diffViewerContainerEl) {
      diffViewerContainerEl.innerHTML = '';
      const diffEl = renderDiffViewer(vscode, () => {
        showDiff = commitState.showDiff;
      });
      diffViewerContainerEl.appendChild(diffEl);
    }
  });

  let hasConflictState = $derived(
    conflictInfo && (conflictInfo.hasConflicts || conflictInfo.isMerging || conflictInfo.isRebasing)
  );
  let numConflicts = $derived(conflictInfo?.conflicts?.length || 0);
  let conflictTitle = $derived(
    numConflicts > 0
      ? `Resolve Conflicts (${numConflicts})`
      : conflictInfo?.isRebasing
        ? 'Rebase in Progress'
        : 'Merge in Progress'
  );

  function handleSelectFile(file: CommitFile) {
    selectedFile = file.path;
    vscode.postMessage({ type: 'openReviewInCenter', payload: file.path });
    if (showDiff) {
      vscode.postMessage({ type: 'getFileDiff', payload: file.path });
    }
  }

  function handleOpenFileDiff(file: CommitFile) {
    selectedFile = file.path;
    vscode.postMessage({ type: 'openReviewInCenter', payload: file.path });
  }

  function handleToggleStageFile(file: CommitFile, checked: boolean) {
    if (checked) {
      checkedFiles.add(file.path);
      checkedFiles = new Set(checkedFiles);
      vscode.postMessage({ type: 'stageFile', payload: file.path });
    } else {
      checkedFiles.delete(file.path);
      checkedFiles = new Set(checkedFiles);
      vscode.postMessage({ type: 'unstageFile', payload: file.path });
    }
  }

  function handleToggleStageFiles(targetFiles: CommitFile[], checked: boolean) {
    const paths = targetFiles.map((f) => f.path);
    if (checked) {
      paths.forEach((p) => checkedFiles.add(p));
      checkedFiles = new Set(checkedFiles);
      vscode.postMessage({ type: 'stageFiles', payload: paths });
    } else {
      paths.forEach((p) => checkedFiles.delete(p));
      checkedFiles = new Set(checkedFiles);
      vscode.postMessage({ type: 'unstageFiles', payload: paths });
    }
  }

  function handleToggleFolder(folderPath: string, isModule = false) {
    const isCurrentlyExpanded = expandAllFolders === true
      ? !collapsedFolders.has(folderPath)
      : expandAllFolders === false
        ? expandedFolders.has(folderPath)
        : collapsedFolders.has(folderPath)
          ? false
          : true;

    if (isCurrentlyExpanded) {
      collapsedFolders.add(folderPath);
      expandedFolders.delete(folderPath);
    } else {
      expandedFolders.add(folderPath);
      collapsedFolders.delete(folderPath);
    }
    collapsedFolders = new Set(collapsedFolders);
    expandedFolders = new Set(expandedFolders);
  }

  function handleContextMenu(e: MouseEvent, file: CommitFile) {
    showFileContextMenu(e, file, vscode, () => {
      // Re-render callback
      files = [...files];
    });
  }

  // Toolbar Actions
  function handleRefresh() {
    vscode.postMessage({ type: 'refresh' });
  }

  function handleRollback() {
    const selected = Array.from(checkedFiles);
    if (selected.length === 0 && selectedFile) {
      selected.push(selectedFile);
    }
    if (selected.length === 0) return;
    vscode.postMessage({ type: 'rollbackFiles', payload: selected });
  }

  function handleShowDiff() {
    const selected = selectedFile || (files[0] ? files[0].path : '');
    if (selected) {
      vscode.postMessage({ type: 'openReviewInCenter', payload: selected });
    } else {
      showDiff = !showDiff;
    }
  }

  function handleExpandAll() {
    expandChanges = true;
    expandUnversioned = true;
    expandAllFolders = true;
    collapsedFolders.clear();
    expandedFolders.clear();
    collapsedFolders = new Set(collapsedFolders);
    expandedFolders = new Set(expandedFolders);
  }

  function handleCollapseAll() {
    expandAllFolders = false;
    expandedFolders.clear();
    collapsedFolders.clear();
    collapsedFolders = new Set(collapsedFolders);
    expandedFolders = new Set(expandedFolders);
  }

  // Commit Actions
  function doCommit(push: boolean) {
    if (!commitMessage || !commitMessage.trim()) {
      commitBoxRef?.focusTextarea(true);
      return;
    }
    const filesToCommit = Array.from(checkedFiles);
    vscode.postMessage({
      type: push ? 'commitAndPush' : 'commit',
      payload: {
        message: commitMessage.trim(),
        files: filesToCommit,
        amend: isAmend,
      },
    });
  }

  function handleGenerateAi() {
    if (isGeneratingAi) return;
    isGeneratingAi = true;
    const filesList = Array.from(checkedFiles);
    vscode.postMessage({
      type: 'generateAiCommitMessage',
      payload: { files: filesList },
    });
  }

  // Resizable Horizontal Splitter
  function handleSplitterMouseDown(e: MouseEvent) {
    e.preventDefault();
    const startY = e.clientY;
    const startRatio = splitRatio;
    document.body.classList.add('resizing-h');

    function onMouseMove(ev: MouseEvent) {
      if (!leftPanelEl) return;
      const rect = leftPanelEl.getBoundingClientRect();
      if (rect.height <= 0) return;
      const dy = ev.clientY - startY;
      const dRatio = dy / rect.height;
      splitRatio = Math.max(0.2, Math.min(0.8, startRatio + dRatio));
    }

    function onMouseUp() {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      document.body.classList.remove('resizing-h');
    }

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  // Window IPC Messages
  function handleMessage(event: MessageEvent) {
    const msg = event.data;
    if (!msg || !msg.type) return;

    switch (msg.type) {
      case 'showPushDialog': {
        vscode.postMessage({ type: 'openPushDialog', payload: msg.payload });
        break;
      }
      case 'pushSuccess': {
        break;
      }
      case 'pushError': {
        break;
      }
      case 'init':
      case 'status': {
        const data = msg.payload || {};
        if (data.repoName) repoName = data.repoName;
        files = data.files || [];
        recentMessages = data.recentMessages || [];
        stashes = data.stashes || [];
        conflictInfo = data.conflictInfo || {
          hasConflicts: false,
          isMerging: false,
          isRebasing: false,
          yoursBranch: '',
          theirsBranch: '',
          conflicts: [],
        };

        const newChecked = new Set<string>();
        files.forEach((f) => {
          if (f.staged && !f.partiallyStaged) {
            newChecked.add(f.path);
          }
        });
        checkedFiles = newChecked;

        if (!commitMessage && data.defaultCommitMessage) {
          commitMessage = data.defaultCommitMessage;
        }

        if (!selectedFile && files.length > 0) {
          selectedFile = files[0].path;
          if (showDiff) {
            vscode.postMessage({ type: 'getFileDiff', payload: selectedFile });
          }
        }
        break;
      }
      case 'showConflictsDialog': {
        vscode.postMessage({ type: 'openConflictsDialog' });
        break;
      }
      case 'selectFile': {
        const filePath = typeof msg.payload === 'string' ? msg.payload : msg.payload?.filePath;
        if (filePath && selectedFile !== filePath) {
          selectedFile = filePath;
          const isUnversioned = files.some((f) => f.path === filePath && f.isUntracked);
          if (isUnversioned) {
            expandUnversioned = true;
          } else {
            expandChanges = true;
          }
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
        diffData = msg.payload;
        break;
      }
      case 'commitSuccess': {
        commitMessage = '';
        isAmend = false;
        checkedFiles = new Set();
        diffData = null;
        break;
      }
      case 'setCommitMessage': {
        isGeneratingAi = false;
        const newMsg = msg.payload?.message || '';
        if (newMsg) {
          commitMessage = newMsg;
        }
        break;
      }
      case 'generateAiError': {
        isGeneratingAi = false;
        break;
      }
      case 'closeAllMenus': {
        closeContextMenu();
        recentOpen = false;
        commitOptionsOpen = false;
        viewOptionsOpen = false;
        break;
      }
    }
  }

  function handleGlobalClick(e: MouseEvent) {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    if (recentOpen || commitOptionsOpen || viewOptionsOpen) {
      if (
        !target.closest('#recent-dropdown') &&
        !target.closest('#btn-recent-msgs') &&
        !target.closest('#gear-dropdown') &&
        !target.closest('#btn-commit-gear') &&
        !target.closest('#view-options-wrapper')
      ) {
        recentOpen = false;
        commitOptionsOpen = false;
        viewOptionsOpen = false;
      }
    }

    if (!target.closest('.as-context-menu')) {
      closeContextMenu();
    }
  }

  function handleGlobalKeyDown(e: KeyboardEvent) {
    if ((e.ctrlKey || (e.metaKey && e.altKey)) && (e.key === 'p' || e.key === 'P')) {
      e.preventDefault();
      groupByDirectory = !groupByDirectory;
      showPaths = !groupByDirectory;
    }
    if (e.key === 'Escape') {
      closeContextMenu();
      recentOpen = false;
      commitOptionsOpen = false;
      viewOptionsOpen = false;
    }
  }

  function initTooltips(): () => void {
    const cleanups: (() => void)[] = [];
    document.querySelectorAll('[data-tooltip], [title]').forEach((el) => {
      const tip = (el as HTMLElement).dataset.tooltip || el.getAttribute('title');
      const sc = (el as HTMLElement).dataset.shortcut || '';
      if (tip) {
        const cleanup = attachTooltip(el as HTMLElement, tip, sc, 'bottom');
        if (cleanup) cleanups.push(cleanup);
      }
    });
    return () => {
      cleanups.forEach((c) => c());
    };
  }

  onMount(() => {
    window.addEventListener('message', handleMessage);
    document.addEventListener('click', handleGlobalClick);
    window.addEventListener('keydown', handleGlobalKeyDown);

    const cleanupTips = initTooltips();

    // Handshake
    vscode.postMessage({ type: 'ready' });

    return () => {
      window.removeEventListener('message', handleMessage);
      document.removeEventListener('click', handleGlobalClick);
      window.removeEventListener('keydown', handleGlobalKeyDown);
      cleanupTips();
    };
  });
</script>

<div class="commit-window">
  <!-- 1. Tab Bar -->
  <div class="tab-bar">
    <div class="tab-items">
      <button
        type="button"
        class={`tab-btn ${activeTab === 'commit' ? 'active' : ''}`}
        onclick={() => { activeTab = 'commit'; }}
      >
        Commit
      </button>
      <button
        type="button"
        class={`tab-btn ${activeTab === 'shelf' ? 'active' : ''}`}
        onclick={() => { activeTab = 'shelf'; }}
      >
        Shelf
      </button>
      <button
        type="button"
        class={`tab-btn ${activeTab === 'stash' ? 'active' : ''}`}
        onclick={() => { activeTab = 'stash'; }}
      >
        Stash
      </button>
    </div>
    <div class="tab-actions">
      <button
        type="button"
        class="icon-btn"
        id="btn-tab-menu"
        title="More Options"
        data-tooltip="More Options"
        onclick={() => vscode.postMessage({ type: 'openLog' })}
      >
        ⋮
      </button>
      <button
        type="button"
        class="icon-btn"
        id="btn-tab-collapse"
        title="Collapse / Minimize"
        data-tooltip="Collapse / Minimize"
        onclick={() => vscode.postMessage({ type: 'collapseView' })}
      >
        —
      </button>
    </div>
  </div>

  <!-- Shelf Tab Content -->
  {#if activeTab === 'shelf'}
    <div class="shelf-view">
      <div class="empty-state">
        <div class="empty-icon">📁</div>
        <div class="empty-title">No Shelved Changes</div>
        <div class="empty-sub">Shelve changes to temporarily set them aside without committing.</div>
        <button
          type="button"
          class="action-btn-primary"
          id="btn-create-shelf"
          onclick={() => vscode.postMessage({ type: 'createShelf' })}
        >
          Shelf Changes...
        </button>
      </div>
    </div>

  <!-- Stash Tab Content -->
  {:else if activeTab === 'stash'}
    <div class="stash-view">
      <div class="stash-header">
        <span class="stash-title">Git Stashes ({stashes.length})</span>
        <button
          type="button"
          class="action-btn-primary"
          id="btn-create-stash"
          onclick={() => vscode.postMessage({ type: 'createStash' })}
        >
          + New Stash...
        </button>
      </div>
      <div class="stash-list">
        {#if stashes.length === 0}
          <div class="empty-state">
            <div class="empty-title">No Stashes</div>
            <div class="empty-sub">Use git stash to save local uncommitted changes.</div>
          </div>
        {:else}
          {#each stashes as s}
            <div class="stash-row">
              <div class="stash-info">
                <span class="stash-idx">{s.index}</span>
                <span class="stash-msg">{s.message || 'WIP on branch'}</span>
                <span class="stash-date">{s.date || ''}</span>
              </div>
              <div class="stash-actions">
                <button
                  type="button"
                  class="stash-btn"
                  onclick={() => vscode.postMessage({ type: 'stashPop', payload: s.index })}
                >
                  Pop
                </button>
                <button
                  type="button"
                  class="stash-btn"
                  onclick={() => vscode.postMessage({ type: 'stashApply', payload: s.index })}
                >
                  Apply
                </button>
                <button
                  type="button"
                  class="stash-btn danger"
                  onclick={() => vscode.postMessage({ type: 'stashDrop', payload: s.index })}
                >
                  Drop
                </button>
              </div>
            </div>
          {/each}
        {/if}
      </div>
    </div>

  <!-- Commit Tab Content -->
  {:else}
    <!-- 2. Conflict Banner Bar -->
    {#if hasConflictState}
      <div class="conflict-header-bar">
        <div class="conflict-bar-left">
          <span class="conflict-bar-title">{conflictTitle}</span>
        </div>
        <div class="conflict-bar-actions">
          <button
            type="button"
            class="conflict-action-btn btn-resolve"
            id="btn-resolve-conflicts"
            title="Resolve Conflicts..."
            data-tooltip="Resolve Conflicts..."
            onclick={() => vscode.postMessage({ type: 'openConflictsDialog' })}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path d="M2.5 3.5L7 8L2.5 12.5M8.5 3.5L13 8L8.5 12.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button
            type="button"
            class="conflict-action-btn btn-abort"
            id="btn-abort-merge"
            title="Abort Merge / Rebase"
            data-tooltip="Abort Merge / Rebase"
            onclick={() => vscode.postMessage({ type: 'abortMerge' })}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path d="M3.5 3.5L12.5 12.5M12.5 3.5L3.5 12.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    {/if}

    <!-- 3. Toolbar -->
    <div class="commit-toolbar">
      <div class="tool-left">
        <button
          type="button"
          class="tool-btn"
          id="btn-refresh"
          title="Refresh (Cmd+R)"
          data-tooltip="Refresh"
          data-shortcut="Cmd+R"
          onclick={handleRefresh}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style="display:block;">
            <path fill-rule="evenodd" d="M12.5747152,11.8852806 C11.4741474,13.1817355 9.83247882,14.0044386 7.99865879,14.0044386 C5.03907292,14.0044386 2.57997332,11.8615894 2.08820756,9.0427473 L3.94774327,9.10768372 C4.43372186,10.8898575 6.06393114,12.2000519 8.00015362,12.2000519 C9.30149237,12.2000519 10.4645985,11.6082097 11.2349873,10.6790094 L9.05000019,8.71167959 L14.0431479,8.44999981 L14.3048222,13.4430431 L12.5747152,11.8852806 Z M3.42785637,4.11741586 C4.52839138,2.82452748 6.16775464,2.00443857 7.99865879,2.00443857 C10.918604,2.00443857 13.3513802,4.09026967 13.8882946,6.8532307 L12.0226389,6.78808057 C11.5024872,5.05935553 9.89838095,3.8000774 8.00015362,3.8000774 C6.69867367,3.8000774 5.53545628,4.39204806 4.76506921,5.32142241 L6.95482203,7.29304326 L1.96167436,7.55472304 L1.70000005,2.56167973 L3.42785637,4.11741586 Z" transform="rotate(3 8.002 8.004)"/>
          </svg>
        </button>
        <button
          type="button"
          class="tool-btn"
          id="btn-rollback"
          title="Rollback (Cmd+Alt+Z)"
          data-tooltip="Rollback"
          data-shortcut="Cmd+Alt+Z"
          onclick={handleRollback}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style="display:block;">
            <g fill-rule="evenodd" transform="translate(1 0)">
              <polygon points="0 0 4 4 0 8" transform="matrix(-1 0 0 1 4 0)"/>
              <path d="M4.15058343,11 L8.06891179,11 C9.72576604,11 11.0689118,9.65685425 11.0689118,8 C11.0689118,6.34314575 9.72576604,5 8.06891179,5 L4.03764586,5 L4,3 L8,3 C10.7614237,3 13,5.23857625 13,8 C13,10.7614237 10.7614237,13 8,13 L4.18822929,13 L4.15058343,11 Z"/>
            </g>
          </svg>
        </button>
        <button
          type="button"
          class={`tool-btn ${showDiff ? 'active' : ''}`}
          id="btn-show-diff"
          title="Show Diff / Review (Cmd+D)"
          data-tooltip="Show Diff / Review"
          data-shortcut="Cmd+D"
          onclick={handleShowDiff}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style="display:block;">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M5.85355 8.14645C5.65829 7.95118 5.34171 7.95118 5.14645 8.14645C4.95118 8.34171 4.95118 8.65829 5.14645 8.85355L7.29289 11H0.5C0.223858 11 0 11.2239 0 11.5C0 11.7761 0.223858 12 0.5 12H7.29289L5.14645 14.1464C4.95118 14.3417 4.95118 14.6583 5.14645 14.8536C5.34171 15.0488 5.65829 15.0488 5.85355 14.8536L8.85355 11.8536L9.20711 11.5L8.85355 11.1464L5.85355 8.14645Z"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M10.1464 1.14645C10.3417 0.951184 10.6583 0.951184 10.8536 1.14645C11.0488 1.34171 11.0488 1.65829 10.8536 1.85355L8.70711 4H15.5C15.7761 4 16 4.22386 16 4.5C16 4.77614 15.7761 5 15.5 5H8.70711L10.8536 7.14645C11.0488 7.34171 11.0488 7.65829 10.8536 7.85355C10.6583 8.04882 10.3417 8.04882 10.1464 7.85355L7.14645 4.85355L6.79289 4.5L7.14645 4.14645L10.1464 1.14645Z"/>
          </svg>
        </button>
        <div class="view-options-wrapper" id="view-options-wrapper" style="position:relative;display:inline-block;">
          <button
            type="button"
            class={`tool-btn ${viewOptionsOpen ? 'active' : ''}`}
            id="btn-view-options"
            title="View Options"
            data-tooltip="View Options"
            onclick={(e) => {
              e.stopPropagation();
              viewOptionsOpen = !viewOptionsOpen;
            }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style="display:block;">
              <path d="M1.5 8C3 4.5 7 2.8 8 2.8C9 2.8 13 4.5 14.5 8C13 11.5 9 13.2 8 13.2C7 13.2 3 11.5 1.5 8Z" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="8" cy="8" r="2.2" stroke="currentColor" stroke-width="1.3"/>
              <polygon points="12,14.5 15,14.5 15,11.5" fill="currentColor"/>
            </svg>
          </button>
          {#if viewOptionsOpen}
            <div class="as-view-options-menu" id="view-options-menu">
              <div class="as-menu-section-header">Group By</div>
              <div
                class={`as-menu-item ${groupByDirectory ? 'active' : ''}`}
                data-action="toggle-groupBy-directory"
                onclick={(e) => {
                  e.stopPropagation();
                  groupByDirectory = !groupByDirectory;
                  showPaths = !groupByDirectory;
                }}
                role="button"
                tabindex="0"
                onkeydown={(e) => { if (e.key === 'Enter') { groupByDirectory = !groupByDirectory; showPaths = !groupByDirectory; } }}
              >
                <div class="as-menu-item-left">
                  <span class="as-menu-check">{groupByDirectory ? '✓' : ''}</span>
                  <span class="as-menu-label">Directory</span>
                </div>
                <span class="as-menu-shortcut">^P</span>
              </div>
              <div
                class={`as-menu-item ${groupByModule ? 'active' : ''}`}
                data-action="toggle-groupBy-module"
                onclick={(e) => {
                  e.stopPropagation();
                  groupByModule = !groupByModule;
                }}
                role="button"
                tabindex="0"
                onkeydown={(e) => { if (e.key === 'Enter') { groupByModule = !groupByModule; } }}
              >
                <div class="as-menu-item-left">
                  <span class="as-menu-check">{groupByModule ? '✓' : ''}</span>
                  <span class="as-menu-label">Module</span>
                </div>
              </div>
              <div class="as-menu-section-header" style="margin-top: 6px;">Show</div>
              <div
                class={`as-menu-item ${showIgnoredFiles !== false ? 'active' : ''}`}
                data-action="toggle-ignored"
                onclick={(e) => {
                  e.stopPropagation();
                  showIgnoredFiles = !showIgnoredFiles;
                }}
                role="button"
                tabindex="0"
                onkeydown={(e) => { if (e.key === 'Enter') { showIgnoredFiles = !showIgnoredFiles; } }}
              >
                <div class="as-menu-item-left">
                  <span class="as-menu-check">{showIgnoredFiles !== false ? '✓' : ''}</span>
                  <span class="as-menu-label">Ignored Files</span>
                </div>
              </div>
            </div>
          {/if}
        </div>
        <button
          type="button"
          class="tool-btn"
          id="btn-expand-all"
          title="Expand All"
          data-tooltip="Expand All"
          onclick={handleExpandAll}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
            <polyline points="4 5.5 8 1.5 12 5.5"/>
            <polyline points="4 10.5 8 14.5 12 10.5"/>
          </svg>
        </button>
        <button
          type="button"
          class="tool-btn"
          id="btn-collapse-all"
          title="Collapse All"
          data-tooltip="Collapse All"
          onclick={handleCollapseAll}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
            <polyline points="4 2.5 8 6.5 12 2.5"/>
            <polyline points="4 13.5 8 9.5 12 13.5"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- 4. Main Body -->
    <div class={`commit-body ${showDiff ? 'with-diff' : ''}`}>
      <div class="commit-left-panel" bind:this={leftPanelEl}>
        <div style={`flex: ${splitRatio}; display: flex; flex-direction: column; min-height: 80px; overflow: hidden;`}>
          <ChangesTree
            {files}
            {selectedFile}
            {checkedFiles}
            {expandChanges}
            {expandUnversioned}
            {showPaths}
            {groupByDirectory}
            {groupByModule}
            {repoName}
            {showIgnoredFiles}
            {expandedFolders}
            {collapsedFolders}
            {expandAllFolders}
            onSelectFile={handleSelectFile}
            onOpenFileDiff={handleOpenFileDiff}
            onToggleStageFile={handleToggleStageFile}
            onToggleStageFiles={handleToggleStageFiles}
            onToggleFolder={handleToggleFolder}
            onToggleExpandChanges={() => { expandChanges = !expandChanges; }}
            onToggleExpandUnversioned={() => { expandUnversioned = !expandUnversioned; }}
            onContextMenu={handleContextMenu}
          />
        </div>

        <div
          class="h-splitter"
          onmousedown={handleSplitterMouseDown}
          role="separator"
          tabindex="0"
        ></div>

        <div style={`flex: ${1 - splitRatio}; display: flex; flex-direction: column; min-height: 80px; overflow: hidden;`}>
          <CommitBox
            bind:this={commitBoxRef}
            {commitMessage}
            {isAmend}
            {isGeneratingAi}
            {recentMessages}
            {recentOpen}
            {commitOptionsOpen}
            onChangeMessage={(msg) => { commitMessage = msg; }}
            onToggleAmend={(amend) => {
              isAmend = amend;
              if (isAmend && (!commitMessage || !commitMessage.trim()) && recentMessages.length > 0) {
                commitMessage = recentMessages[0];
              }
            }}
            onToggleRecentOpen={() => {
              recentOpen = !recentOpen;
              commitOptionsOpen = false;
            }}
            onToggleCommitOptions={() => {
              commitOptionsOpen = !commitOptionsOpen;
              recentOpen = false;
            }}
            onSelectRecentMessage={(msg) => {
              commitMessage = msg;
              recentOpen = false;
            }}
            onGenerateAi={handleGenerateAi}
            onCommit={() => doCommit(false)}
            onCommitAndPush={() => doCommit(true)}
          />
        </div>
      </div>

      {#if showDiff}
        <div class="commit-right-panel" bind:this={diffViewerContainerEl}></div>
      {/if}
    </div>
  {/if}
</div>
