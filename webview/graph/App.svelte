<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import FilterBar from "./FilterBar.svelte";
  import CommitList from "./CommitList.svelte";
  import CommitDetail from "./CommitDetail.svelte";
  import BranchSidebar from "./BranchSidebar.svelte";
  import TaskStatusBar from "./TaskStatusBar.svelte";
  import type { TaskItem } from "$shared/protocol";
  import {
    postMessage,
    onMessage,
    openPushDialog,
    activePushDialog,
    openGitAuthDialog,
    activeAuthDialog,
    openCreateBranchDialog,
    openCheckoutBranchDialog
  } from "$shared/vscodeApi";
  import type { ViewOptions } from "./types";

  const defaultViewOptions: ViewOptions = {
    compactRefs: true,
    tagNames: true,
    longEdges: false,
    commitTimestamp: false,
    refsOnLeft: false,
    colAuthor: true,
    colDate: true,
    colHash: false,
    colGpg: false,
    hlMyCommits: true,
    hlMergeCommits: true,
    hlCurrentBranch: true,
    hlNotCherryPicked: false
  };

  function loadViewOptions(): ViewOptions {
    const opts = { ...defaultViewOptions };
    try {
      if (localStorage.getItem("jetgit_view_compact_refs") !== null) {
        opts.compactRefs = localStorage.getItem("jetgit_view_compact_refs") === "true";
      }
      if (localStorage.getItem("jetgit_view_tag_names") !== null) {
        opts.tagNames = localStorage.getItem("jetgit_view_tag_names") === "true";
      }
      if (localStorage.getItem("jetgit_view_long_edges") !== null) {
        opts.longEdges = localStorage.getItem("jetgit_view_long_edges") === "true";
      }
      if (localStorage.getItem("jetgit_view_commit_timestamp") !== null) {
        opts.commitTimestamp = localStorage.getItem("jetgit_view_commit_timestamp") === "true";
      }
      if (localStorage.getItem("jetgit_view_refs_on_left") !== null) {
        opts.refsOnLeft = localStorage.getItem("jetgit_view_refs_on_left") === "true";
      }
      if (localStorage.getItem("jetgit_col_author") !== null) {
        opts.colAuthor = localStorage.getItem("jetgit_col_author") === "true";
      }
      if (localStorage.getItem("jetgit_col_date") !== null) {
        opts.colDate = localStorage.getItem("jetgit_col_date") === "true";
      }
      if (localStorage.getItem("jetgit_col_hash") !== null) {
        opts.colHash = localStorage.getItem("jetgit_col_hash") === "true";
      }
      if (localStorage.getItem("jetgit_col_gpg") !== null) {
        opts.colGpg = localStorage.getItem("jetgit_col_gpg") === "true";
      }
      if (localStorage.getItem("jetgit_hl_my_commits") !== null) {
        opts.hlMyCommits = localStorage.getItem("jetgit_hl_my_commits") === "true";
      }
      if (localStorage.getItem("jetgit_hl_merge_commits") !== null) {
        opts.hlMergeCommits = localStorage.getItem("jetgit_hl_merge_commits") === "true";
      }
      if (localStorage.getItem("jetgit_hl_current_branch") !== null) {
        opts.hlCurrentBranch = localStorage.getItem("jetgit_hl_current_branch") === "true";
      }
      if (localStorage.getItem("jetgit_hl_not_cherry_picked") !== null) {
        opts.hlNotCherryPicked = localStorage.getItem("jetgit_hl_not_cherry_picked") === "true";
      }
    } catch {}
    return opts;
  }

  let viewOptions = $state<ViewOptions>(loadViewOptions());

  $effect(() => {
    if (typeof document !== "undefined" && document.body && viewOptions) {
      document.body.classList.toggle("compact-refs", viewOptions.compactRefs);
      document.body.classList.toggle("hide-tag-names", !viewOptions.tagNames);
      document.body.classList.toggle("show-long-edges", viewOptions.longEdges);
      document.body.classList.toggle("commit-timestamp", viewOptions.commitTimestamp);
      document.body.classList.toggle("refs-on-left", viewOptions.refsOnLeft);
      document.body.classList.toggle("hide-col-author", !viewOptions.colAuthor);
      document.body.classList.toggle("hide-col-date", !viewOptions.colDate);
      document.body.classList.toggle("show-col-hash", viewOptions.colHash);
      document.body.classList.toggle("show-col-gpg", viewOptions.colGpg);
      document.body.classList.toggle("hl-my-commits", viewOptions.hlMyCommits);
      document.body.classList.toggle("hl-merge-commits", viewOptions.hlMergeCommits);
      document.body.classList.toggle("hl-current-branch", viewOptions.hlCurrentBranch);
      document.body.classList.toggle("hl-not-cherry-picked", viewOptions.hlNotCherryPicked);
    }
  });

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

  let sidebarWidth = $state(260);
  let isDraggingBranchSplitter = $state(false);
  let isSidebarCollapsed = $state(false);
  let detailPanelEl = $state<HTMLDivElement>();
  let detailSplitterEl = $state<HTMLDivElement>();
  let unsubscribe: (() => void) | undefined;

  let tasks = $state<TaskItem[]>([]);

  function onCancelTask(id: string) {
    postMessage("cancelTask", { id });
  }

  function onDismissTask(id: string) {
    postMessage("dismissTask", { id });
  }

  function onClearFinishedTasks() {
    postMessage("clearFinishedTasks");
  }

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
      window.dispatchEvent(new CustomEvent('closeAllGraphMenus'));
      document.querySelectorAll<HTMLElement>('.filter-popup, .as-dropdown-menu').forEach(el => el.style.display = 'none');
    };
    const visChangeHandler = () => {
      if (document.hidden) closeAllFloatingMenus();
    };
    const blurHandler = () => {
      if (Date.now() - ((window as any).__lastGraphMenuOpenedAt || 0) > 200) {
        closeAllFloatingMenus();
      }
    };
    document.addEventListener("visibilitychange", visChangeHandler);
    window.addEventListener("blur", blurHandler);

    unsubscribe = onMessage((msg: any) => {
      switch (msg.type) {
        case "closeAllMenus": {
          if (Date.now() - ((window as any).__lastGraphMenuOpenedAt || 0) > 200) {
            closeAllFloatingMenus();
          }
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
        case "openCreateBranchDialog": {
          openCreateBranchDialog(msg.payload?.startPoint);
          break;
        }
        case "openCheckoutBranchDialog": {
          openCheckoutBranchDialog(msg.payload?.remoteRef, msg.payload?.defaultName);
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
          const curScrollTop = cEl ? cEl.scrollTop : 0;
          const isAtTop = curScrollTop <= 10;

          // Only anchor to past commit row if the user was scrolled down reading older commits.
          // If the user was at the top (viewing HEAD / latest commits), keep them at the top (scrollTop = 0)
          // so newly committed commits appear immediately in view without requiring manual scrolling or reload.
          if (!isAtTop && cEl && oldCommits.length > 0) {
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
          if (newIndex === -1 && curSelected && !isAtTop) {
            newIndex = unique.findIndex((c) => c.hash === curSelected);
            anchorOffset = 0;
          }

          noGitData = null;
          commits = unique;
          graphWidth = p.graphWidth;
          loading = false;

          if (cEl && unique.length > 0) {
            if (isAtTop) {
              cEl.scrollTop = 0;
              if ((window as any).__commitListSetScrollTop__) {
                (window as any).__commitListSetScrollTop__(0);
              }
            } else if (newIndex !== -1) {
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
          const prevCurrentBranch = branchData?.currentBranch;
          branchData = msg.payload;
          (window as any).__GIT_BRANCH_DATA__ = msg.payload;
          if (!hasInitializedActiveBranch) {
            hasInitializedActiveBranch = true;
            if (msg.payload && msg.payload.activeBranch) {
              activeBranch = msg.payload.activeBranch;
            }
          } else if (prevCurrentBranch && msg.payload?.currentBranch && prevCurrentBranch !== msg.payload.currentBranch) {
            activeBranch = msg.payload.currentBranch;
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
        case "tasksUpdate": {
          tasks = msg.payload || [];
          break;
        }
      }
    });

    // Load saved branch sidebar width
    try {
      const savedW = localStorage.getItem("jetgit_branch_sidebar_width");
      if (savedW) {
        const w = parseInt(savedW, 10);
        if (w >= 140 && w <= 700) {
          sidebarWidth = w;
        }
      }
    } catch (e) {}

    const onKeyEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedHash) {
        selectedHash = null;
      }
    };
    window.addEventListener("keydown", onKeyEscape);

    return () => {
      window.removeEventListener("keydown", onKeyEscape);
      document.removeEventListener("visibilitychange", visChangeHandler);
      window.removeEventListener("blur", blurHandler);
    };
  });

  let startX = 0;
  let startWidth = 260;

  function onBranchSplitterDown(e: MouseEvent) {
    if (isSidebarCollapsed) return;
    isDraggingBranchSplitter = true;
    startX = e.clientX;
    startWidth = sidebarWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    e.preventDefault();

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      sidebarWidth = Math.max(140, Math.min(700, startWidth + dx));
    };

    const onUp = () => {
      isDraggingBranchSplitter = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      try {
        localStorage.setItem("jetgit_branch_sidebar_width", String(sidebarWidth));
      } catch (err) {}
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  onDestroy(() => {
    unsubscribe?.();
  });



  // Setup Detail Splitter Drag
  $effect(() => {
    if (!selectedHash || !detailSplitterEl || !detailPanelEl) return;
    try {
      const savedDW = localStorage.getItem("jetgit_detail_panel_width");
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
        localStorage.setItem("jetgit_detail_panel_width", String(newWidth));
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
    bind:viewOptions
    bind:activeBranch
    setActiveBranch={(b) => { activeBranch = b; }}
    {branchData}
    {commits}
    {selectedHash}
    {onFilter}
    onRefresh={() => postMessage("refresh")}
  />

  <div class="main-area">
    {#if !noGitData}
      <BranchSidebar
        {branchData}
        {activeBranch}
        onSelectActiveBranch={(b) => { activeBranch = b; }}
        {onFilter}
        width={sidebarWidth}
        isDragging={isDraggingBranchSplitter}
        bind:isCollapsed={isSidebarCollapsed}
      />
      <div
        class="branch-splitter"
        class:active={isDraggingBranchSplitter}
        style:display={isSidebarCollapsed ? "none" : ""}
        onmousedown={onBranchSplitterDown}
      ></div>
    {/if}

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
          {viewOptions}
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

  <TaskStatusBar
    {tasks}
    {onCancelTask}
    {onDismissTask}
    onClearFinished={onClearFinishedTasks}
  />
</div>


