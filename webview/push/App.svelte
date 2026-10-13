<script lang="ts">
  import { onMount } from "svelte";
  import { postMessage, onMessage } from "$shared/vscodeApi";
  import { getFileIcon } from "$shared/fileIcons";

  interface PushFile {
    name: string;
    path: string;
    dir?: string;
    status: string; // 'M' | 'A' | 'D'
  }

  interface PushCommit {
    hash: string;
    shortHash: string;
    message: string;
    files: PushFile[];
  }

  interface PushInfo {
    currentBranch: string;
    remote: string;
    remoteBranch?: string;
    remotes?: string[];
    repoName?: string;
    isNew?: boolean;
    commits?: PushCommit[];
    totalFiles?: PushFile[];
  }

  let pushInfo = $state<PushInfo>({
    currentBranch: "",
    remote: "origin",
    commits: [],
    totalFiles: []
  });

  let selectedCommitHash = $state<string>("ALL");
  let currentRemote = $state<string>("origin");
  let currentTargetBranch = $state<string>("");
  let isEditingTargetBranch = $state(false);
  let targetBranchInputVal = $state("");
  let showRemoteDropdown = $state(false);
  let showPushMenu = $state(false);
  let isPushing = $state(false);
  let pushTags = $state(false);
  let pushTagsOption = $state<"all" | "current">("all");

  // Resizable splitter
  let leftColWidth = $state<number>(340);
  let isDraggingSplitter = $state(false);
  let startX = 0;
  let startWidth = 0;
  let bodyContainerEl: HTMLDivElement | undefined;

  const commits = $derived(pushInfo.commits || []);
  const availableRemotes = $derived(
    pushInfo.remotes && pushInfo.remotes.length > 0 ? pushInfo.remotes : [currentRemote]
  );

  const displayedFiles = $derived.by(() => {
    if (selectedCommitHash === "ALL") {
      return pushInfo.totalFiles || [];
    }
    const c = commits.find((x) => x.hash === selectedCommitHash);
    return c ? c.files : [];
  });

  const groupedFiles = $derived.by(() => {
    const map = new Map<string, PushFile[]>();
    for (const f of displayedFiles) {
      const d = f.dir || "root";
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(f);
    }
    return Array.from(map.entries()).map(([dir, files]) => ({ dir, files }));
  });

  function initFromPushInfo(info: PushInfo) {
    pushInfo = info;
    currentRemote = info.remote || "origin";
    currentTargetBranch = info.remoteBranch || info.currentBranch || "";
    targetBranchInputVal = currentTargetBranch;
    selectedCommitHash = "ALL";
  }

  function startEditBranch(e: MouseEvent) {
    e.stopPropagation();
    isEditingTargetBranch = true;
    targetBranchInputVal = currentTargetBranch;
  }

  function commitBranchEdit() {
    const val = targetBranchInputVal.trim();
    if (val) {
      currentTargetBranch = val;
    }
    isEditingTargetBranch = false;
  }

  function cancelBranchEdit() {
    targetBranchInputVal = currentTargetBranch;
    isEditingTargetBranch = false;
  }

  function selectRemote(r: string, e: MouseEvent) {
    e.stopPropagation();
    currentRemote = r;
    showRemoteDropdown = false;
  }

  function openFileReview(file: PushFile) {
    postMessage("openReviewInCenter", {
      filePath: file.path,
      commitHash: selectedCommitHash,
      filesList: displayedFiles.map((f) => f.path)
    });
  }

  function doPush(force = false) {
    if (isPushing) return;
    isPushing = true;
    postMessage("executePush", {
      branch: pushInfo.currentBranch,
      targetBranch: currentTargetBranch,
      force,
      setUpstream: !!(pushInfo.isNew || currentTargetBranch !== pushInfo.currentBranch),
      remote: currentRemote,
      tags: pushTags
    });
  }

  function closeDialog() {
    postMessage("close");
  }

  function onSplitterDown(e: MouseEvent) {
    isDraggingSplitter = true;
    startX = e.clientX;
    startWidth = leftColWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    e.preventDefault();

    const onMove = (ev: MouseEvent) => {
      if (!isDraggingSplitter || !bodyContainerEl) return;
      const totalWidth = bodyContainerEl.getBoundingClientRect().width;
      const deltaX = ev.clientX - startX;
      let newW = startWidth + deltaX;
      const minW = 180;
      const maxW = totalWidth - minW;
      if (newW < minW) newW = minW;
      if (newW > maxW) newW = maxW;
      leftColWidth = newW;
    };

    const onUp = () => {
      isDraggingSplitter = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  onMount(() => {
    const unsubscribe = onMessage((msg: any) => {
      if (msg.type === "updatePushInfo") {
        initFromPushInfo(msg.payload || {});
      } else if (msg.type === "pushFailed") {
        isPushing = false;
      }
    });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showRemoteDropdown) {
          showRemoteDropdown = false;
        } else if (showPushMenu) {
          showPushMenu = false;
        } else if (isEditingTargetBranch) {
          cancelBranchEdit();
        } else {
          closeDialog();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        doPush(false);
      }
    };

    const onGlobalClick = () => {
      showRemoteDropdown = false;
      showPushMenu = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("click", onGlobalClick);

    postMessage("ready");

    return () => {
      unsubscribe();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("click", onGlobalClick);
    };
  });
</script>

<div class="as-push-card">
  <div class="as-body" bind:this={bodyContainerEl}>
    <!-- Left Column: Commits -->
    <div class="as-col-left" style="width: {leftColWidth}px;">
      <!-- Branch Header -->
      <div
        class="as-branch-header"
        class:all-selected={selectedCommitHash === 'ALL'}
        onclick={() => (selectedCommitHash = 'ALL')}
        role="button"
        tabindex="0"
        onkeydown={(e) => { if (e.key === 'Enter') selectedCommitHash = 'ALL'; }}
      >
        <span class="branch-current" title={pushInfo.currentBranch}>
          {pushInfo.currentBranch}
        </span>
        <span class="branch-arrow">&rarr;</span>

        <!-- Remote Selector -->
        <div class="remote-selector-wrapper">
          <span
            class="remote-label"
            title="Click to change remote"
            onclick={(e) => {
              e.stopPropagation();
              showRemoteDropdown = !showRemoteDropdown;
            }}
            role="button"
            tabindex="0"
            onkeydown={(e) => { if (e.key === 'Enter') showRemoteDropdown = !showRemoteDropdown; }}
          >
            {currentRemote}
          </span>
          {#if showRemoteDropdown}
            <div class="as-dropdown remote-dropdown" onclick={(e) => e.stopPropagation()} role="menu" tabindex="0" onkeydown={() => {}}>
              {#each availableRemotes as r}
                <div
                  class="as-dropdown-item"
                  onclick={(e) => selectRemote(r, e)}
                  role="menuitem"
                  tabindex="0"
                  onkeydown={(e) => { if (e.key === 'Enter') selectRemote(r, e); }}
                >
                  {r}
                </div>
              {/each}
            </div>
          {/if}
        </div>

        <span class="branch-colon">:</span>

        <!-- Target Branch Name Editor -->
        {#if !isEditingTargetBranch}
          <span
            class="target-branch-display"
            title="Click to edit remote branch name"
            onclick={startEditBranch}
            role="button"
            tabindex="0"
            onkeydown={(e) => { if (e.key === 'Enter') startEditBranch(e); }}
          >
            {currentTargetBranch}
          </span>
        {:else}
          <input
            type="text"
            class="target-branch-input"
            bind:value={targetBranchInputVal}
            onclick={(e) => e.stopPropagation()}
            onkeydown={(e) => {
              if (e.key === 'Enter') commitBranchEdit();
              if (e.key === 'Escape') cancelBranchEdit();
            }}
            onblur={commitBranchEdit}
          />
        {/if}

        {#if pushInfo.isNew}
          <span class="new-badge">New</span>
        {/if}
      </div>

      <!-- Commits List -->
      <div class="as-commits-container">
        {#if commits.length === 0}
          <div class="as-empty-commits">
            No unpushed commits found.
          </div>
        {:else}
          {#each commits as c (c.hash)}
            {@const isSelected = selectedCommitHash === c.hash}
            <div
              class="as-commit-item"
              class:selected={isSelected}
              onclick={(e) => {
                e.stopPropagation();
                selectedCommitHash = c.hash;
              }}
              role="row"
              tabindex="0"
              onkeydown={(e) => { if (e.key === 'Enter') selectedCommitHash = c.hash; }}
            >
              <span class="commit-hash">{c.shortHash}</span>
              <span class="commit-message" title={c.message}>{c.message}</span>
            </div>
          {/each}
        {/if}
      </div>
    </div>

    <!-- Splitter -->
    <div
      class="as-splitter"
      class:dragging={isDraggingSplitter}
      onmousedown={onSplitterDown}
      role="separator"
      tabindex="0"
      title="Drag to resize"
    ></div>

    <!-- Right Column: Files -->
    <div class="as-col-right">
      <div class="as-files-header">
        <div class="as-files-header-title">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="#c49000">
            <path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h3.879a1.5 1.5 0 0 1 1.06.44l1.122 1.12A.5.5 0 0 0 8.92 4H13.5A1.5 1.5 0 0 1 15 5.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 12.5v-9z"/>
          </svg>
          <span>{pushInfo.repoName || "Repository"}</span>
          <span class="as-files-count">
            {displayedFiles.length} {displayedFiles.length === 1 ? "file" : "files"}
          </span>
        </div>
      </div>

      <div class="as-files-container">
        {#if displayedFiles.length === 0}
          <div class="as-empty-files">No files changed.</div>
        {:else}
          {#each groupedFiles as group (group.dir)}
            <div class="as-file-group-header">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                <path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h3.879a1.5 1.5 0 0 1 1.06.44l1.122 1.12A.5.5 0 0 0 8.92 4H13.5A1.5 1.5 0 0 1 15 5.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 12.5v-9z"/>
              </svg>
              <span class="group-dir-name">{group.dir}</span>
              <span class="group-file-count">{group.files.length} {group.files.length === 1 ? "file" : "files"}</span>
            </div>
            {#each group.files as file (file.path)}
              <div
                class="as-file-item"
                ondblclick={() => openFileReview(file)}
                role="row"
                tabindex="0"
                onkeydown={(e) => { if (e.key === 'Enter') openFileReview(file); }}
              >
                {#if file.status === 'M'}
                  <span class="status-badge status-m">M</span>
                {:else if file.status === 'A'}
                  <span class="status-badge status-a">A</span>
                {:else if file.status === 'D'}
                  <span class="status-badge status-d">D</span>
                {/if}
                <span class="file-icon">{@html getFileIcon(file.name)}</span>
                <span class="file-name" title={file.path}>{file.name}</span>
              </div>
            {/each}
          {/each}
        {/if}
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div class="as-footer">
    <div class="as-footer-left">
      <label class="tags-checkbox-label">
        <input type="checkbox" bind:checked={pushTags} class="as-checkbox" />
        <span>Push tags:</span>
      </label>
      <select bind:value={pushTagsOption} class="as-select" disabled={!pushTags}>
        <option value="all">All</option>
        <option value="current">Current branch</option>
      </select>
    </div>

    <div class="as-footer-right">
      <button class="as-btn" onclick={closeDialog}>Cancel</button>

      <div class="push-btn-group">
        <button
          class="as-btn-primary"
          disabled={isPushing}
          onclick={() => doPush(false)}
        >
          {isPushing ? "Pushing..." : "Push"}
        </button>
        <button
          class="as-btn-primary push-trigger"
          disabled={isPushing}
          onclick={(e) => {
            e.stopPropagation();
            showPushMenu = !showPushMenu;
          }}
          title="Push Options"
        >
          ▼
        </button>
      </div>

      {#if showPushMenu}
        <div class="as-dropdown push-dropdown" onclick={(e) => e.stopPropagation()} role="menu" tabindex="0" onkeydown={() => {}}>
          <div
            class="as-dropdown-item"
            onclick={() => {
              showPushMenu = false;
              doPush(true);
            }}
            role="menuitem"
            tabindex="0"
            onkeydown={(e) => {
              if (e.key === 'Enter') {
                showPushMenu = false;
                doPush(true);
              }
            }}
          >
            Force Push (no-verify)...
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  :global(*) {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  :global(html, body) {
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
    min-width: 180px;
    max-width: calc(100% - 180px);
    border-right: 1px solid var(--vscode-panel-border, #323438);
    display: flex;
    flex-direction: column;
    background: var(--vscode-sideBar-background, var(--vscode-editor-background, #1e1f22));
    overflow: hidden;
    position: relative;
    flex-shrink: 0;
  }

  .as-splitter {
    width: 6px;
    margin-left: -3px;
    margin-right: -3px;
    cursor: col-resize;
    background: transparent;
    position: relative;
    z-index: 50;
    flex-shrink: 0;
    transition: background-color 0.12s ease;
  }

  .as-splitter:hover,
  .as-splitter.dragging {
    background: var(--vscode-focusBorder, #3574f0);
  }

  .as-col-right {
    flex: 1;
    min-width: 180px;
    display: flex;
    flex-direction: column;
    background: var(--vscode-editor-background, #1e1f22);
    overflow: hidden;
    position: relative;
    z-index: 10;
  }

  .as-branch-header {
    display: flex;
    align-items: center;
    padding: 7px 12px;
    background: var(--vscode-list-inactiveSelectionBackground, #203248);
    color: var(--vscode-editor-foreground, #dfe1e5);
    font-size: 12.5px;
    font-weight: 500;
    cursor: pointer;
    gap: 4px;
    overflow: visible;
    position: relative;
    z-index: 5;
    flex-shrink: 0;
    white-space: nowrap;
    transition: background 0.15s ease;
  }

  .as-branch-header.all-selected {
    background: var(--vscode-button-background, #2675bf);
    color: var(--vscode-button-foreground, #ffffff);
  }

  .branch-current {
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .branch-arrow,
  .branch-colon {
    opacity: 0.7;
    margin: 0 2px;
  }

  .remote-selector-wrapper {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    position: relative;
  }

  .remote-label {
    color: inherit;
    font-weight: 600;
    cursor: pointer;
    border-bottom: 1px dashed rgba(255, 255, 255, 0.7);
    padding: 0 2px;
  }

  .target-branch-display {
    color: #d0e3ff;
    text-decoration: underline;
    cursor: pointer;
    font-weight: 500;
    white-space: nowrap;
    padding: 1px 4px;
    border-radius: 3px;
  }

  .target-branch-input {
    background: var(--vscode-input-background, #1e1f22);
    color: var(--vscode-input-foreground, #ffffff);
    border: 1.5px solid var(--vscode-focusBorder, #3574f0);
    border-radius: 3px;
    padding: 2px 6px;
    font-size: 12px;
    outline: none;
    width: 140px;
  }

  .new-badge {
    background: rgba(255, 255, 255, 0.22);
    color: #ffffff;
    font-size: 10.5px;
    padding: 1px 5px;
    border-radius: 3px;
    margin-left: auto;
    white-space: nowrap;
  }

  .as-commits-container {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 4px 0;
  }

  .as-empty-commits {
    padding: 16px;
    text-align: center;
    color: #808080;
    font-size: 12px;
  }

  .as-commit-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px 6px 26px;
    cursor: pointer;
    font-size: 12.5px;
    color: var(--vscode-editor-foreground, #dfe1e5);
    outline: none;
  }

  .as-commit-item:hover {
    background: var(--vscode-list-hoverBackground, rgba(255, 255, 255, 0.05));
  }

  .as-commit-item.selected {
    background: var(--vscode-list-activeSelectionBackground, #2e436e) !important;
    color: var(--vscode-list-activeSelectionForeground, #ffffff) !important;
  }

  .commit-hash {
    font-family: monospace;
    font-size: 11.5px;
    color: #a9b7c6;
    font-weight: 600;
    flex-shrink: 0;
  }

  .commit-message {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
  }

  .as-files-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 7px 12px;
    background: var(--vscode-sideBarSectionHeader-background, var(--vscode-sideBar-background, #26282b));
    border-bottom: 1px solid var(--vscode-panel-border, #323438);
    flex-shrink: 0;
    position: relative;
    z-index: 10;
  }

  .as-files-header-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12.5px;
    font-weight: 600;
    color: var(--vscode-editor-foreground, #dfe1e5);
  }

  .as-files-count {
    color: var(--vscode-descriptionForeground, #808080);
    font-size: 11.5px;
    font-weight: normal;
  }

  .as-files-container {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 6px 8px;
  }

  .as-empty-files {
    padding: 20px;
    text-align: center;
    color: #808080;
    font-size: 12px;
  }

  .as-file-group-header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 3px 6px;
    color: #9aa0a6;
    font-size: 11.5px;
    font-weight: 500;
  }

  .group-dir-name {
    color: #dfe1e5;
  }

  .group-file-count {
    color: #808080;
    font-size: 11px;
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
    outline: none;
  }

  .as-file-item:hover {
    background: var(--vscode-list-hoverBackground, rgba(255, 255, 255, 0.05));
  }

  .status-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
    border-radius: 2px;
    font-size: 9.5px;
    font-weight: bold;
    margin-right: 2px;
    flex-shrink: 0;
  }

  .status-m {
    border: 1px solid #499c54;
    color: #499c54;
  }

  .status-a {
    border: 1px solid #62b543;
    color: #62b543;
  }

  .status-d {
    border: 1px solid #e05555;
    color: #e05555;
  }

  .file-icon {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
  }

  .file-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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

  .as-footer-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .tags-checkbox-label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12.5px;
    color: var(--vscode-editor-foreground, #dfe1e5);
    cursor: pointer;
  }

  .as-checkbox {
    accent-color: var(--vscode-focusBorder, #3574f0);
    cursor: pointer;
    width: 14px;
    height: 14px;
    margin: 0;
  }

  .as-select {
    background: var(--vscode-dropdown-background, #1e1f22);
    color: var(--vscode-dropdown-foreground, #dfe1e5);
    border: 1px solid var(--vscode-dropdown-border, #4e5157);
    border-radius: 3px;
    padding: 3px 6px;
    font-size: 12px;
    outline: none;
  }

  .as-footer-right {
    display: flex;
    align-items: center;
    gap: 10px;
    position: relative;
  }

  .push-btn-group {
    display: inline-flex;
    border-radius: 4px;
    overflow: hidden;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  }

  .push-trigger {
    border-left: 1px solid rgba(255, 255, 255, 0.25) !important;
    padding: 6px 8px !important;
    font-size: 11px !important;
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
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex-shrink: 0;
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
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex-shrink: 0;
    transition: background 0.15s;
  }

  .as-btn-primary:hover {
    background: var(--vscode-button-hoverBackground, #3068d8);
  }

  .as-btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .as-dropdown {
    position: absolute;
    background: var(--vscode-menu-background, #2b2d30);
    border: 1px solid var(--vscode-menu-border, #43454a);
    border-radius: 4px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
    z-index: 999;
    min-width: 140px;
    padding: 4px 0;
  }

  .remote-dropdown {
    top: 26px;
    left: 0;
  }

  .push-dropdown {
    bottom: 36px;
    right: 0;
    min-width: 180px;
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
