<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import FilterBar from "./FilterBar.svelte";
  import CommitList from "./CommitList.svelte";
  import CommitDetail from "./CommitDetail.svelte";
  import { renderSidebarContent } from "./branchSidebar";
  import {
    postMessage,
    onMessage,
    openPushDialog,
    activePushDialog,
    openGitAuthDialog,
    activeAuthDialog
  } from "$shared/vscodeApi";

  let commits = $state<any[]>([]);
  let graphWidth = $state(1);
  let selectedHash = $state<string | null>(null);
  let selectedFiles = $state<any[]>([]);
  let loading = $state(true);
  let scrollToIndex = $state(-1);
  let branchData = $state<any>({ branches: [], tags: [], currentBranch: "" });
  let activeBranch = $state("");
  let noGitData = $state<any>(null);
  let hasInitializedActiveBranch = false;

  let selectedCommit = $derived(commits.find((c) => c.hash === selectedHash) || null);

  let branchSidebarEl = $state<HTMLDivElement>();
  let branchSplitterEl = $state<HTMLDivElement>();
  let detailPanelEl = $state<HTMLDivElement>();
  let detailSplitterEl = $state<HTMLDivElement>();
  let unsubscribe: (() => void) | undefined;

  function onSelectCommit(hash: string) {
    selectedHash = hash;
    selectedFiles = [];
    postMessage("selectCommit", hash);
  }

  function onFilter(filter: any) {
    loading = true;
    postMessage("filter", filter);
  }

  function onLoadMore() {
    postMessage("loadMore");
  }

  function onRebaseFromHere(hash: string) {
    postMessage("rebaseFromHere", hash);
  }

  onMount(() => {
    postMessage("ready");

    const closeAllFloatingMenus = () => {
      document.querySelectorAll('.commit-context-menu, .branch-context-menu, .filter-popup, .as-dropdown-menu').forEach(el => el.remove());
    };
    window.addEventListener("blur", closeAllFloatingMenus);
    const visChangeHandler = () => {
      if (document.hidden) closeAllFloatingMenus();
    };
    document.addEventListener("visibilitychange", visChangeHandler);

    unsubscribe = onMessage((msg: any) => {
      switch (msg.type) {
        case "closeAllMenus": {
          closeAllFloatingMenus();
          break;
        }
        case "noGitRepo": {
          (window as any).__IS_SUB_REPO__ = false;
          hasInitializedActiveBranch = false;
          loading = false;
          commits = [];
          selectedHash = null;
          selectedFiles = [];
          activeBranch = "";
          branchData = { branches: [], tags: [], currentBranch: "" };
          noGitData = msg.payload;
          break;
        }
        case "showPushDialog": {
          openPushDialog(msg.payload);
          break;
        }
        case "pushSuccess": {
          if (activePushDialog) {
            activePushDialog.remove();
          }
          break;
        }
        case "showAuthDialog": {
          openGitAuthDialog(msg.payload);
          break;
        }
        case "authSuccess": {
          if (activeAuthDialog) {
            activeAuthDialog.remove();
          }
          break;
        }
        case "authError": {
          if (activeAuthDialog) {
            const errEl = activeAuthDialog.querySelector("#as-auth-error-msg") as HTMLElement;
            const submitBtn = activeAuthDialog.querySelector("#as-auth-submit") as HTMLButtonElement;
            const spinner = activeAuthDialog.querySelector("#as-auth-spinner") as HTMLElement;
            const btnText = activeAuthDialog.querySelector("#as-auth-btn-text") as HTMLElement;
            if (errEl) {
              errEl.style.display = "block";
              errEl.textContent = msg.payload?.error || "Authentication failed. Please verify credentials.";
            }
            if (submitBtn) submitBtn.disabled = false;
            if (spinner) spinner.style.display = "none";
            if (btnText) btnText.textContent = "Log In";
          }
          break;
        }
        case "commits": {
          const p = msg.payload;
          if (p.currentUser) {
            (window as any).__GIT_CURRENT_USER__ = p.currentUser;
          }
          if (p.currentBranch !== undefined) {
            (window as any).__GIT_CURRENT_BRANCH__ = p.currentBranch;
          }
          if (p.isSubRepo !== undefined) {
            (window as any).__IS_SUB_REPO__ = !!p.isSubRepo;
          }
          if (p.repoPath) {
            (window as any).__GIT_REPO_PATH__ = p.repoPath;
          }
          document.querySelectorAll(".no-git-container").forEach((el) => el.remove());
          const seen = new Set();
          const unique: any[] = [];
          if (p.commits) {
            for (const c of p.commits) {
              if (!seen.has(c.hash)) {
                seen.add(c.hash);
                unique.push(c);
              }
            }
          }

          const cEl = (window as any).__commitListContainer__ || document.querySelector(".commit-list-container");
          const oldCommits = commits || [];
          const ROW_HEIGHT = 25;
          let anchorHash: string | null = null;
          let anchorOffset = 0;
          const curSelected = selectedHash;

          if (cEl && oldCommits.length > 0) {
            const curScrollTop = cEl.scrollTop;
            const anchorRow = Math.max(0, Math.floor(curScrollTop / ROW_HEIGHT));
            if (oldCommits[anchorRow]) {
              anchorHash = oldCommits[anchorRow].hash;
              anchorOffset = curScrollTop - anchorRow * ROW_HEIGHT;
            }
          }

          let newIndex = -1;
          if (anchorHash) {
            newIndex = unique.findIndex((c) => c.hash === anchorHash);
          }
          if (newIndex === -1 && curSelected) {
            newIndex = unique.findIndex((c) => c.hash === curSelected);
            anchorOffset = 0;
          }

          noGitData = null;
          commits = unique;
          graphWidth = p.graphWidth;
          loading = false;

          if (cEl && unique.length > 0) {
            if (newIndex !== -1) {
              const targetScrollTop = newIndex * ROW_HEIGHT + anchorOffset;
              cEl.scrollTop = targetScrollTop;
              if ((window as any).__commitListSetScrollTop__) {
                (window as any).__commitListSetScrollTop__(targetScrollTop);
              }
              requestAnimationFrame(() => {
                if (cEl) cEl.scrollTop = targetScrollTop;
                if ((window as any).__commitListSetScrollTop__) {
                  (window as any).__commitListSetScrollTop__(targetScrollTop);
                }
              });
            } else if (oldCommits.length > 0) {
              cEl.scrollTop = 0;
              if ((window as any).__commitListSetScrollTop__) {
                (window as any).__commitListSetScrollTop__(0);
              }
              if (curSelected && !unique.some((c) => c.hash === curSelected) && unique[0]) {
                onSelectCommit(unique[0].hash);
              }
            }
          }

          const sideEl = document.querySelector(".branch-sidebar") as any;
          if (sideEl && sideEl._updateExitBtn) sideEl._updateExitBtn();
          break;
        }
        case "reachedEnd": {
          break;
        }
        case "error": {
          loading = false;
          break;
        }
        case "branches": {
          if (msg.payload && msg.payload.currentUser) {
            (window as any).__GIT_CURRENT_USER__ = msg.payload.currentUser;
          }
          if (msg.payload && msg.payload.currentBranch !== undefined) {
            (window as any).__GIT_CURRENT_BRANCH__ = msg.payload.currentBranch;
          }
          if (msg.payload && msg.payload.isSubRepo !== undefined) {
            (window as any).__IS_SUB_REPO__ = !!msg.payload.isSubRepo;
          }
          if (msg.payload && msg.payload.repoPath) {
            (window as any).__GIT_REPO_PATH__ = msg.payload.repoPath;
          }
          branchData = msg.payload;
          if (!hasInitializedActiveBranch) {
            hasInitializedActiveBranch = true;
            if (msg.payload && msg.payload.activeBranch) {
              activeBranch = msg.payload.activeBranch;
            }
          }
          const sideEl = document.querySelector(".branch-sidebar") as any;
          if (sideEl && sideEl._updateExitBtn) sideEl._updateExitBtn();
          if (sideEl && sideEl._updateStarBtn) sideEl._updateStarBtn();
          break;
        }
        case "commitFiles": {
          const p = msg.payload;
          if (p.hash === selectedHash) {
            selectedFiles = p.files;
          }
          break;
        }
        case "scrollToCommit": {
          const hash2 = msg.payload;
          selectedHash = hash2;
          selectedFiles = [];
          postMessage("selectCommit", hash2);
          const idx = commits.findIndex((c) => c.hash === hash2 || c.hash.startsWith(hash2) || hash2.startsWith(c.abbreviatedHash));
          if (idx >= 0) {
            scrollToIndex = idx;
          }
          break;
        }
      }
    });

    // Setup Branch Splitter
    try {
      const savedW = localStorage.getItem("intellij_git_branch_sidebar_width");
      if (savedW && branchSidebarEl) {
        const w = parseInt(savedW, 10);
        if (w >= 140 && w <= 700) {
          branchSidebarEl.style.width = w + "px";
          branchSidebarEl.style.minWidth = w + "px";
        }
      }
    } catch (e) {}

    let isDraggingBranchSplitter = false;
    let startX = 0;
    let startWidth = 260;

    const onBranchSplitterDown = (e: MouseEvent) => {
      if (!branchSidebarEl || branchSidebarEl.classList.contains("collapsed")) return;
      isDraggingBranchSplitter = true;
      startX = e.clientX;
      startWidth = branchSidebarEl.getBoundingClientRect().width;
      branchSplitterEl?.classList.add("active");
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      branchSidebarEl.style.transition = "none";
      e.preventDefault();
    };

    const onBranchSplitterMove = (e: MouseEvent) => {
      if (!isDraggingBranchSplitter || !branchSidebarEl) return;
      const dx = e.clientX - startX;
      const newWidth = Math.max(140, Math.min(700, startWidth + dx));
      branchSidebarEl.style.width = newWidth + "px";
      branchSidebarEl.style.minWidth = newWidth + "px";
      try {
        localStorage.setItem("intellij_git_branch_sidebar_width", String(newWidth));
      } catch (err) {}
    };

    const onBranchSplitterUp = () => {
      if (isDraggingBranchSplitter && branchSidebarEl) {
        isDraggingBranchSplitter = false;
        branchSplitterEl?.classList.remove("active");
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        branchSidebarEl.style.transition = "";
      }
    };

    branchSplitterEl?.addEventListener("mousedown", onBranchSplitterDown);
    window.addEventListener("mousemove", onBranchSplitterMove);
    window.addEventListener("mouseup", onBranchSplitterUp);

    const onKeyEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedHash) {
        selectedHash = null;
      }
    };
    window.addEventListener("keydown", onKeyEscape);

    return () => {
      branchSplitterEl?.removeEventListener("mousedown", onBranchSplitterDown);
      window.removeEventListener("mousemove", onBranchSplitterMove);
      window.removeEventListener("mouseup", onBranchSplitterUp);
      window.removeEventListener("keydown", onKeyEscape);
    };
  });

  onDestroy(() => {
    unsubscribe?.();
  });

  // Effect to re-render sidebar when branchData or noGitData changes
  $effect(() => {
    if (!branchSidebarEl) return;
    if (noGitData) {
      branchSidebarEl.style.display = "none";
      if (branchSplitterEl) branchSplitterEl.style.display = "none";
    } else {
      branchSidebarEl.style.display = "";
      if (branchSplitterEl) {
        branchSplitterEl.style.display = branchSidebarEl.classList.contains("collapsed") ? "none" : "";
      }
      renderSidebarContent(
        branchSidebarEl,
        () => branchData,
        () => activeBranch,
        (b) => { activeBranch = b; }
      );
    }
  });

  // Setup Detail Splitter Drag
  $effect(() => {
    if (!selectedHash || !detailSplitterEl || !detailPanelEl) return;
    try {
      const savedDW = localStorage.getItem("intellij_git_detail_panel_width");
      if (savedDW) {
        const dw = parseInt(savedDW, 10);
        if (dw >= 180 && dw <= 800) {
          detailPanelEl.style.width = dw + "px";
          detailPanelEl.style.minWidth = dw + "px";
        }
      }
    } catch (e) {}

    let isDraggingDetailSplitter = false;
    let startXDetail = 0;
    let startWidthDetail = 300;

    const onMouseMoveDetail = (e: MouseEvent) => {
      if (!isDraggingDetailSplitter || !detailPanelEl) return;
      const dx = startXDetail - e.clientX;
      const newWidth = Math.max(180, Math.min(800, startWidthDetail + dx));
      detailPanelEl.style.width = newWidth + "px";
      detailPanelEl.style.minWidth = newWidth + "px";
      try {
        localStorage.setItem("intellij_git_detail_panel_width", String(newWidth));
      } catch (err) {}
    };

    const onMouseUpDetail = () => {
      if (isDraggingDetailSplitter && detailPanelEl) {
        isDraggingDetailSplitter = false;
        detailSplitterEl?.classList.remove("active");
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        detailPanelEl.style.transition = "";
        window.removeEventListener("mousemove", onMouseMoveDetail);
        window.removeEventListener("mouseup", onMouseUpDetail);
      }
    };

    const onMouseDownDetail = (e: MouseEvent) => {
      isDraggingDetailSplitter = true;
      startXDetail = e.clientX;
      startWidthDetail = detailPanelEl.getBoundingClientRect().width;
      detailSplitterEl?.classList.add("active");
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      detailPanelEl.style.transition = "none";
      window.addEventListener("mousemove", onMouseMoveDetail);
      window.addEventListener("mouseup", onMouseUpDetail);
      e.preventDefault();
    };

    detailSplitterEl.addEventListener("mousedown", onMouseDownDetail);
    return () => {
      detailSplitterEl?.removeEventListener("mousedown", onMouseDownDetail);
      window.removeEventListener("mousemove", onMouseMoveDetail);
      window.removeEventListener("mouseup", onMouseUpDetail);
    };
  });
</script>

<div class="app">
  <FilterBar
    {activeBranch}
    {branchData}
    {commits}
    {selectedHash}
    {onFilter}
    onRefresh={() => postMessage("refresh")}
  />

  <div class="main-area">
    <div class="branch-sidebar" bind:this={branchSidebarEl}></div>
    <div class="branch-splitter" bind:this={branchSplitterEl}></div>

    <div class="center-area">
      {#if loading && commits.length === 0}
        <div class="loading">Loading commits...</div>
      {:else if noGitData}
        <div class="no-git-container">
          <div style="display:flex;flex-direction:column;align-items:center;width:100%;max-width:440px;margin:auto 0;padding:12px 0;flex-shrink:0;">
            <div>
              <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#d29922" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <div style="font-size:16px;font-weight:600;margin:14px 0 6px;">No Git Repository Found</div>
            <div style="font-size:12px;color:var(--vscode-descriptionForeground);max-width:440px;line-height:1.5;margin-bottom:20px;">
              The folder "{noGitData.currentPath || ""}" is not a Git repository.
            </div>

            {#if noGitData.subRepos && noGitData.subRepos.length > 0}
              <div style="font-size:12px;font-weight:600;margin-bottom:10px;color:var(--vscode-descriptionForeground);text-transform:uppercase;letter-spacing:0.5px;">
                Detected Git repository in subfolder:
              </div>
              <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:20px;width:100%;max-width:360px;">
                {#each noGitData.subRepos as r}
                  <button
                    class="no-git-btn primary"
                    style="display:flex;align-items:center;justify-content:center;gap:8px;padding:8px 16px;border-radius:4px;background:#2e436e;color:#ffffff;border:1px solid #3e5b94;font-size:12px;font-weight:500;cursor:pointer;width:100%;flex-shrink:0;"
                    onclick={() => {
                      (window as any).__IS_SUB_REPO__ = true;
                      noGitData = null;
                      loading = true;
                      postMessage("switchRepo", r.path);
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M6 3v12"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>
                    </svg>
                    Open repository in "{r.name}"
                  </button>
                {/each}
              </div>
            {/if}

            <button
              class="no-git-btn secondary"
              style="display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:4px;background:var(--vscode-button-secondaryBackground, #3a3d41);color:var(--vscode-button-secondaryForeground, #ffffff);border:1px solid rgba(255,255,255,0.1);font-size:12px;cursor:pointer;flex-shrink:0;"
              onclick={() => {
                noGitData = null;
                loading = true;
                postMessage("initRepo");
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Initialize Git Repository Here (git init)
            </button>
          </div>
        </div>
      {:else if commits.length === 0 && !loading}
        <div class="empty">No commits found.</div>
      {:else}
        <CommitList
          {commits}
          {graphWidth}
          {selectedHash}
          {scrollToIndex}
          {onSelectCommit}
          {onLoadMore}
          {onRebaseFromHere}
        />
      {/if}
    </div>

    {#if selectedHash}
      <div class="detail-splitter" bind:this={detailSplitterEl}></div>
      <div class="detail-panel" bind:this={detailPanelEl}>
        <button
          class="detail-close-btn"
          title="Close Details (Esc)"
          onclick={() => { selectedHash = null; }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1.5 1.5L10.5 10.5M1.5 10.5L10.5 1.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          </svg>
        </button>
        <CommitDetail
          commit={selectedCommit}
          files={selectedFiles}
        />
      </div>
    {/if}
  </div>
</div>

<style>
:global {
html, body {margin:0;padding:0;height:100%;overflow:hidden;font-family:var(--vscode-font-family, system-ui, sans-serif);font-size:var(--vscode-font-size, 13px);color:var(--vscode-foreground);background:var(--vscode-editor-background);}.app {position:absolute;top:0;left:0;right:0;bottom:0;display:flex;flex-direction:column;overflow:hidden;}.loading, .empty {padding:20px;text-align:center;color:var(--vscode-descriptionForeground);}.main-area {display:flex;flex:1;min-height:0;overflow:hidden;position:relative;}.branch-sidebar {width:260px;min-width:140px;background:var(--vscode-sideBar-background, #1e1e1e);overflow:hidden;display:flex;flex-direction:row;flex-shrink:0;user-select:none;font-size:1em;transition:width 0.12s ease;}.branch-splitter {width:1px;cursor:col-resize;flex-shrink:0;background:transparent;z-index:10;user-select:none;position:relative;}.branch-splitter::before {content:'';position:absolute;top:0;bottom:0;left:-4px;right:-4px;cursor:col-resize;z-index:1;}.branch-splitter:hover, .branch-splitter.active {background:transparent !important;}.branch-sidebar.collapsed + .branch-splitter {display:none !important;}.branch-sidebar.collapsed {width:34px !important;min-width:34px !important;}.sidebar-strip {width:34px;background:var(--vscode-sideBar-background, #1e1e1e);border-right:1px solid var(--vscode-panel-border);display:flex;flex-direction:column;align-items:center;padding:6px 0;gap:3px;flex-shrink:0;box-sizing:border-box;}.sidebar-strip-btn {width:26px;height:26px;display:flex;align-items:center;justify-content:center;border:none;background:transparent;color:var(--vscode-foreground);opacity:0.8;border-radius:4px;cursor:pointer;padding:0;transition:all 0.1s ease;}.sidebar-strip-btn:hover {opacity:1;background:var(--vscode-toolbar-hoverBackground, rgba(255,255,255,0.12));}.sidebar-strip-btn.active {background:var(--vscode-toolbar-activeBackground, rgba(255,255,255,0.2));opacity:1;color:#e5a50a;}.sidebar-main {flex:1;min-width:0;display:flex;flex-direction:column;overflow:hidden;}.branch-sidebar.collapsed .sidebar-main {display:none;}.branch-search-box {padding:6px;border-bottom:1px solid var(--vscode-panel-border);flex-shrink:0;}.branch-search-input {width:100%;box-sizing:border-box;background:var(--vscode-input-background);color:var(--vscode-input-foreground);border:1px solid var(--vscode-input-border, transparent);border-radius:3px;padding:4px 6px;font-size:0.95em;outline:none;}.branch-search-input:focus {border-color:var(--vscode-focusBorder);}.branch-tree-content {flex:1;overflow-y:scroll;overflow-x:hidden;padding:4px 0;scrollbar-color:rgb(70, 62, 62) transparent !important;}.branch-tree-content::-webkit-scrollbar {width:8px !important;height:8px !important;background:transparent !important;background-color:transparent !important;}.branch-tree-content::-webkit-scrollbar-track, .branch-tree-content::-webkit-scrollbar-track-piece, .branch-tree-content::-webkit-scrollbar-corner {background:transparent !important;background-color:transparent !important;border:none !important;box-shadow:none !important;}.branch-tree-content::-webkit-scrollbar-thumb {background:rgb(70, 62, 62) !important;background-color:rgb(70, 62, 62) !important;border-radius:4px !important;border:none !important;}.branch-tree-content::-webkit-scrollbar-thumb:hover {background:rgba(255,255,255,0.35) !important;background-color:rgba(255,255,255,0.35) !important;}.tree-section-header {padding:4px 8px;font-weight:600;color:#ffffff;cursor:pointer;display:flex;align-items:center;gap:5px;font-size:1em;}.tree-section-header:hover {background:var(--vscode-list-hoverBackground);}.tree-folder-header {padding:3px 6px;font-weight:400;color:#ffffff;cursor:pointer;display:flex;align-items:center;gap:4px;font-size:1em;border-radius:3px;margin:1px 4px;user-select:none;}.tree-folder-header:hover {background:var(--vscode-list-hoverBackground);color:#ffffff;}.tree-folder-header:hover .tree-item-icon {color:#dfe1e5 !important;}.tree-item-icon {width:16px;height:16px;min-width:16px;max-width:16px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;margin-right:4px;}.tree-item {display:flex;align-items:center;gap:4px;padding:3px 6px;cursor:pointer;border-radius:3px;margin:1px 4px;white-space:nowrap;overflow:hidden;color:var(--vscode-foreground);font-size:1em;user-select:none;}.tree-folder-body {margin-left:18px;border-left:1px solid rgba(140, 140, 140, 0.45);padding-left:14px;}.tree-section-body {margin-left:16px;border-left:1px solid rgba(140, 140, 140, 0.45);padding-left:0px;}.arrow.spacer {visibility:hidden !important;pointer-events:none;}.tree-item-star-slot {display:none;}.tree-item-star-slot.is-fav {width:16px;height:16px;min-width:16px;max-width:16px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;cursor:pointer;line-height:1;margin-right:2px;user-select:none;color:#e5a50a !important;visibility:visible !important;}.tree-item:hover {background:var(--vscode-list-hoverBackground);}.tree-item.current-head:not(.active) {color:var(--vscode-foreground,#dfe1e5);font-weight:600;}.tree-item.active {background:var(--vscode-list-activeSelectionBackground) !important;color:var(--vscode-list-activeSelectionForeground) !important;font-weight:600;}.tree-item.active .branch-name {color:var(--vscode-list-activeSelectionForeground) !important;}.head-branch-box {display:flex;align-items:center;justify-content:space-between;padding:4px 8px;margin:2px 4px 4px 4px;background:transparent;border-radius:4px;cursor:pointer;user-select:none;font-size:1em;font-weight:600;color:var(--vscode-foreground,#dfe1e5);transition:background 0.12s ease;}.head-branch-box:hover {background:var(--vscode-list-hoverBackground, rgba(255,255,255,0.08));}.head-branch-box.active {background:var(--vscode-list-activeSelectionBackground,#04395e);color:var(--vscode-list-activeSelectionForeground,#ffffff);}.branch-icon {color:#dfe1e5;}.branch-icon.remote {color:#dfe1e5;}.star-icon {color:#e5a50a;}.folder-icon {color:#8c8c8c;}.arrow {color:var(--vscode-descriptionForeground, #8c8c8c);width:16px;height:16px;min-width:16px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;cursor:pointer;opacity:0.85;transition:opacity 0.1s ease, color 0.1s ease;}.arrow:hover {opacity:1;color:var(--vscode-foreground, #dfe1e5);}.center-area {flex:1;min-height:0;position:relative;}.detail-panel {position:relative;width:300px;min-width:180px;overflow-y:auto;flex-shrink:0;box-sizing:border-box;}.detail-panel::-webkit-scrollbar {width:6px;height:6px;}.detail-panel::-webkit-scrollbar-track {background:transparent;}.detail-panel::-webkit-scrollbar-thumb {background:rgba(255,255,255,0.18);border-radius:3px;}.detail-panel::-webkit-scrollbar-thumb:hover {background:rgba(255,255,255,0.35);}.detail-splitter {width:1px;cursor:col-resize;flex-shrink:0;background:var(--vscode-panel-border, #393b40);z-index:10;user-select:none;position:relative;transition:background 0.15s ease;}.detail-splitter::before {content:"";position:absolute;top:0;bottom:0;left:-3px;right:-3px;cursor:col-resize;z-index:1;}.detail-splitter:hover, .detail-splitter.active {background:var(--vscode-focusBorder, #3574f0) !important;}.detail-close-btn {position:absolute;top:8px;right:8px;width:22px;height:22px;display:flex;align-items:center;justify-content:center;background:transparent;border:none;border-radius:4px;color:var(--vscode-foreground, #cccccc);opacity:0.7;cursor:pointer;z-index:10;transition:all 0.15s ease;padding:0;}.detail-close-btn:hover {opacity:1;background:var(--vscode-toolbar-hoverBackground, rgba(255,255,255,0.12));}.no-git-container {position:absolute;top:0;left:0;right:0;bottom:0;background:var(--vscode-editor-background);z-index:50;display:flex;flex-direction:column;align-items:center;overflow-y:auto;overflow-x:hidden;height:100%;box-sizing:border-box;user-select:none;padding:32px 16px;text-align:center;color:var(--vscode-foreground);scrollbar-color:rgb(70, 62, 62) transparent !important;}.no-git-container::-webkit-scrollbar {width:8px !important;height:8px !important;background:transparent !important;}.no-git-container::-webkit-scrollbar-thumb {background:rgb(70, 62, 62) !important;border-radius:4px !important;}.no-git-container::-webkit-scrollbar-thumb:hover {background:rgba(255,255,255,0.35) !important;}.app-tooltip {position:fixed;z-index:99999;pointer-events:none;background:var(--vscode-editorHoverWidget-background, #252526);color:var(--vscode-editorHoverWidget-foreground, #cccccc);border:1px solid var(--vscode-editorHoverWidget-border, #454545);box-shadow:0 4px 14px rgba(0,0,0,0.45);padding:4px 8px;border-radius:4px;font-size:11px;font-family:var(--vscode-font-family, system-ui, sans-serif);line-height:1.4;white-space:nowrap;opacity:0;visibility:hidden;transition:opacity 0.12s ease, visibility 0.12s ease;}.app-tooltip.visible {opacity:1;visibility:visible;}.app-tooltip .tooltip-shortcut {margin-left:6px;opacity:0.65;font-size:10px;background:rgba(255,255,255,0.08);padding:1px 4px;border-radius:3px;border:1px solid rgba(255,255,255,0.1);}.app-tooltip.side-right::before {content:"";position:absolute;top:50%;left:-5px;transform:translateY(-50%);width:0;height:0;border-top:4px solid transparent;border-bottom:4px solid transparent;border-right:5px solid var(--vscode-editorHoverWidget-border, #454545);}.app-tooltip.side-bottom::before {content:"";position:absolute;top:-5px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-bottom:5px solid var(--vscode-editorHoverWidget-border, #454545);}
}
</style>
