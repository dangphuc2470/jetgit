<script lang="ts">
  import { onMount, tick } from "svelte";
  import {
    postMessage,
    openCreateBranchDialog,
    openRenameBranchDialog,
    openCreateTagDialog
  } from "$shared/vscodeApi";
  import { attachTooltip } from "$shared/tooltip";

  interface BranchInfo {
    name: string;
    remote?: boolean;
    upstream?: string;
    behind?: number;
    ahead?: number;
    [key: string]: any;
  }

  interface TagInfo {
    name: string;
    [key: string]: any;
  }

  interface BranchData {
    branches?: BranchInfo[];
    tags?: TagInfo[];
    currentBranch?: string;
    repoPath?: string;
    isSubRepo?: boolean;
    remotes?: string[];
    [key: string]: any;
  }

  interface Props {
    branchData: BranchData;
    activeBranch: string;
    onSelectActiveBranch: (branch: string) => void;
    onFilter: (filter: { branch: string }) => void;
    width?: number;
    isDragging?: boolean;
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
  }

  let {
    branchData = {},
    activeBranch = "",
    onSelectActiveBranch,
    onFilter,
    width = 260,
    isDragging = false,
    isCollapsed = $bindable(false),
    onToggleCollapse
  }: Props = $props();

  // Internal reactive states
  let selectedTreeBranch = $state("");
  let searchQuery = $state("");
  let searchInputEl = $state<HTMLInputElement>();
  let folderCollapseMap = $state<Record<string, boolean>>({});
  let searchFolderCollapseMap = $state<Record<string, boolean>>({});
  let sectionCollapseMap = $state<Record<string, boolean>>({
    Local: false,
    Remote: false,
    Tags: true
  });
  let favoriteSet = $state<Set<string>>(new Set(["develop", "main", "master"]));

  // Context menu state
  let contextMenu = $state<{
    visible: boolean;
    x: number;
    y: number;
    items: Array<{
      label: string;
      shortcut?: string;
      onClick?: () => void;
      isDivider?: boolean;
      disabled?: boolean;
    }>;
  }>({
    visible: false,
    x: 0,
    y: 0,
    items: []
  });

  const currentBranch = $derived(branchData?.currentBranch || (typeof window !== "undefined" ? (window as any).__GIT_CURRENT_BRANCH__ : "") || "");
  const currentRepoKey = $derived(branchData?.repoPath || (typeof window !== "undefined" ? (window as any).__GIT_REPO_PATH__ : "") || "default_repo");
  const isSubRepo = $derived(!!(branchData?.isSubRepo || (typeof window !== "undefined" ? (window as any).__IS_SUB_REPO__ : false)));

  // Toast notification helper
  function showToast(text: string) {
    if (typeof window !== "undefined" && (window as any).showToast) {
      (window as any).showToast(text);
      return;
    }
    const old = document.querySelector(".as-mini-toast");
    if (old) old.remove();
    const t = document.createElement("div");
    t.className = "as-mini-toast";
    t.innerText = text;
    document.body.appendChild(t);
    setTimeout(() => t.classList.add("visible"), 10);
    setTimeout(() => {
      t.classList.remove("visible");
      setTimeout(() => t.remove(), 250);
    }, 2000);
  }

  // Favorites persistence
  function loadFavorites() {
    try {
      const raw = localStorage.getItem("intellij_git_fav_branches");
      if (raw) {
        favoriteSet = new Set(JSON.parse(raw));
        return;
      }
    } catch {}
    favoriteSet = new Set(["develop", "main", "master"]);
  }

  function saveFavorites(set: Set<string>) {
    try {
      localStorage.setItem("intellij_git_fav_branches", JSON.stringify(Array.from(set)));
    } catch {}
  }

  function isBranchFavorite(name: string): boolean {
    return favoriteSet.has(name);
  }

  function toggleBranchFavorite(name: string) {
    if (!name) return;
    const next = new Set(favoriteSet);
    if (next.has(name)) {
      next.delete(name);
    } else {
      next.add(name);
    }
    favoriteSet = next;
    saveFavorites(next);
  }

  // Folder collapse state persistence
  function loadFolderStates(repoKey: string) {
    try {
      const raw = localStorage.getItem("intellij_git_folders_" + repoKey);
      if (raw) {
        folderCollapseMap = JSON.parse(raw);
        return;
      }
    } catch {}
    folderCollapseMap = {};
  }

  function saveFolderStates(repoKey: string, states: Record<string, boolean>) {
    try {
      localStorage.setItem("intellij_git_folders_" + repoKey, JSON.stringify(states));
    } catch {}
  }

  $effect(() => {
    if (currentRepoKey) {
      loadFolderStates(currentRepoKey);
    }
  });

  $effect(() => {
    if (!queryTrimmed) {
      searchFolderCollapseMap = {};
    }
  });

  onMount(() => {
    loadFavorites();
    if (!selectedTreeBranch) {
      selectedTreeBranch = activeBranch || "HEAD";
    }

    const closeMenu = () => {
      contextMenu.visible = false;
      const old = document.querySelector(".branch-context-menu");
      if (old) old.remove();
    };

    window.addEventListener("blur", closeMenu);
    const visHandler = () => {
      if (document.hidden) closeMenu();
    };
    document.addEventListener("visibilitychange", visHandler);
    const msgHandler = (ev: MessageEvent) => {
      if (ev.data?.type === "closeAllMenus") closeMenu();
    };
    window.addEventListener("message", msgHandler);

    return () => {
      window.removeEventListener("blur", closeMenu);
      document.removeEventListener("visibilitychange", visHandler);
      window.removeEventListener("message", msgHandler);
    };
  });

  function selectBranch(name: string) {
    selectedTreeBranch = name;
  }

  function openBranchLog(name: string) {
    selectedTreeBranch = name;
    onSelectActiveBranch(name);
    onFilter({ branch: name });
  }

  // Svelte action for attaching tooltips
  function tooltip(node: HTMLElement, param: { text: string; shortcut?: string; side?: string }) {
    attachTooltip(node, param.text, param.shortcut || "", param.side || "right");
    return {
      update(newParam: { text: string; shortcut?: string; side?: string }) {
        attachTooltip(node, newParam.text, newParam.shortcut || "", newParam.side || "right");
      }
    };
  }

  // Tree representation
  interface TreeNode {
    name: string;
    fullPath: string;
    folders: Record<string, TreeNode>;
    branches: Array<BranchInfo & { leafName: string }>;
  }

  function createTreeNode(name = "", fullPath = ""): TreeNode {
    return { name, fullPath, folders: {}, branches: [] };
  }

  function insertBranchIntoTree(root: TreeNode, parts: string[], branchObj: BranchInfo) {
    if (branchObj.name.startsWith("(") || branchObj.name.startsWith("HEAD")) {
      root.branches.push({ ...branchObj, leafName: branchObj.name });
      return;
    }
    let current = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current.folders[part]) {
        const nextPath = current.fullPath ? current.fullPath + "/" + part : part;
        current.folders[part] = createTreeNode(part, nextPath);
      }
      current = current.folders[part];
    }
    const leafName = parts[parts.length - 1];
    current.branches.push({ ...branchObj, leafName });
  }

  function hasCurrentBranchInNode(n: TreeNode): boolean {
    if (!n || !currentBranch) return false;
    if (n.branches && n.branches.some(b => b.name === currentBranch)) return true;
    if (n.folders) {
      for (const k in n.folders) {
        if (hasCurrentBranchInNode(n.folders[k])) return true;
      }
    }
    return false;
  }

  function hasFavoriteInNode(n: TreeNode): boolean {
    if (!n) return false;
    if (n.branches && n.branches.some(b => isBranchFavorite(b.name))) return true;
    if (n.folders) {
      for (const k in n.folders) {
        if (hasFavoriteInNode(n.folders[k])) return true;
      }
    }
    return false;
  }

  const queryTrimmed = $derived(searchQuery.toLowerCase().trim());

  function filterMatches(name: string): boolean {
    if (!queryTrimmed) return true;
    return name.toLowerCase().includes(queryTrimmed);
  }

  // Local Tree construction
  const localTreeData = $derived.by(() => {
    const branches = branchData.branches || [];
    const localList = branches.filter(
      (b) => !b.remote && !b.name.startsWith("origin/") && !b.name.startsWith("(") && !b.name.includes("detached") && filterMatches(b.name)
    );
    const root = createTreeNode();
    for (const b of localList) {
      const parts = b.name.split("/");
      insertBranchIntoTree(root, parts, b);
    }
    return { list: localList, root };
  });

  // Remote Tree construction
  const remoteTreeData = $derived.by(() => {
    const branches = branchData.branches || [];
    const configuredRemotes = branchData.remotes || [];
    const remoteList = branches.filter(
      (b) => (b.remote || b.name.startsWith("origin/") || configuredRemotes.some(r => b.name.startsWith(r + "/"))) &&
             b.name.includes("/") &&
             !b.name.endsWith("/HEAD") &&
             filterMatches(b.name)
    );
    const root = createTreeNode();
    for (const b of remoteList) {
      const parts = b.name.split("/");
      insertBranchIntoTree(root, parts, { ...b, remote: true });
    }
    return { list: remoteList, root };
  });

  // Tags list
  const filteredTags = $derived.by(() => {
    const tags = branchData.tags || [];
    return tags.filter((t) => filterMatches(t.name));
  });

  // Context menu builder
  function showBranchContextMenu(e: MouseEvent, branchName: string) {
    e.preventDefault();
    e.stopPropagation();

    const branches = branchData.branches || [];
    const isCurrent = branchName === currentBranch;
    const branchInfo = branches.find((b) => b.name === branchName);
    const isRemote = branchInfo ? (!!branchInfo.remote || branchName.startsWith("origin/")) : branchName.startsWith("origin/");

    const items: Array<{
      label: string;
      shortcut?: string;
      onClick?: () => void;
      isDivider?: boolean;
      disabled?: boolean;
    }> = [];

    const closeAndRun = (action: () => void) => {
      contextMenu.visible = false;
      action();
    };

    if (isCurrent) {
      items.push({
        label: `New Branch from '${branchName}'...`,
        onClick: () => closeAndRun(() => openCreateBranchDialog(branchName))
      });
      items.push({
        label: "Show Diff with Working Tree",
        onClick: () => closeAndRun(() => postMessage("showDiff", { branch: branchName }))
      });
      items.push({ isDivider: true, label: "" });
      items.push({
        label: "Update",
        onClick: () => closeAndRun(() => {
          showToast(`Updating '${branchName}'...`);
          postMessage("pull", branchName);
        })
      });
      items.push({
        label: "Push...",
        onClick: () => closeAndRun(() => postMessage("push", branchName))
      });
      if (branchInfo && branchInfo.upstream) {
        items.push({
          label: `Unset Tracked Branch (${branchInfo.upstream})`,
          onClick: () => closeAndRun(() => {
            showToast(`Unsetting tracked branch for '${branchName}'...`);
            postMessage("unsetUpstream", { branch: branchName });
          })
        });
      }
      items.push({ isDivider: true, label: "" });
      items.push({
        label: "Rename...",
        shortcut: "F2",
        onClick: () => closeAndRun(() => openRenameBranchDialog(branchName))
      });
    } else if (isRemote) {
      items.push({
        label: "Checkout",
        onClick: () => closeAndRun(() => postMessage("checkout", branchName))
      });
      items.push({
        label: "Fetch Branch",
        onClick: () => closeAndRun(() => {
          showToast(`Fetching '${branchName}'...`);
          postMessage("fetchSingleBranch", { branch: branchName });
        })
      });
      const curBranchInfo = currentBranch ? branches.find(b => b.name === currentBranch && !b.remote) : null;
      const isAlreadyTrackingThis = curBranchInfo && curBranchInfo.upstream === branchName;
      if (currentBranch) {
        items.push({
          label: `Track into '${currentBranch}'` + (isAlreadyTrackingThis ? " (already tracked)" : ""),
          disabled: !!isAlreadyTrackingThis,
          onClick: () => closeAndRun(() => {
            showToast(`Tracking '${currentBranch}' -> '${branchName}'...`);
            postMessage("setUpstream", { branch: currentBranch, upstream: branchName });
          })
        });
      }
      items.push({
        label: `New Branch from '${branchName}'...`,
        onClick: () => closeAndRun(() => openCreateBranchDialog(branchName))
      });
      items.push({
        label: `Checkout and Rebase onto '${currentBranch || "HEAD"}'`,
        onClick: () => closeAndRun(() => postMessage("checkoutAndRebase", { branch: branchName, onto: currentBranch }))
      });
      items.push({ isDivider: true, label: "" });
      items.push({
        label: `Compare with '${currentBranch || "HEAD"}'`,
        onClick: () => closeAndRun(() => postMessage("compareBranch", { branch: branchName, withBranch: currentBranch }))
      });
      items.push({
        label: "Show Diff with Working Tree",
        onClick: () => closeAndRun(() => postMessage("showDiff", { branch: branchName }))
      });
      items.push({ isDivider: true, label: "" });
      items.push({
        label: `Rebase '${currentBranch || "HEAD"}' onto '${branchName}'`,
        onClick: () => closeAndRun(() => postMessage("rebase", branchName))
      });
      items.push({
        label: `Merge '${branchName}' into '${currentBranch || "HEAD"}'`,
        onClick: () => closeAndRun(() => postMessage("mergeBranch", branchName))
      });
      items.push({ isDivider: true, label: "" });
      items.push({
        label: "Delete Remote Branch...",
        onClick: () => closeAndRun(() => postMessage("deleteBranch", branchName))
      });
    } else {
      items.push({
        label: "Checkout",
        onClick: () => closeAndRun(() => postMessage("checkout", branchName))
      });
      items.push({
        label: `New Branch from '${branchName}'...`,
        onClick: () => closeAndRun(() => openCreateBranchDialog(branchName))
      });
      items.push({
        label: `Checkout and Rebase onto '${currentBranch || "HEAD"}'`,
        onClick: () => closeAndRun(() => postMessage("checkoutAndRebase", { branch: branchName, onto: currentBranch }))
      });
      items.push({ isDivider: true, label: "" });
      items.push({
        label: `Compare with '${currentBranch || "HEAD"}'`,
        onClick: () => closeAndRun(() => postMessage("compareBranch", { branch: branchName, withBranch: currentBranch }))
      });
      items.push({
        label: "Show Diff with Working Tree",
        onClick: () => closeAndRun(() => postMessage("showDiff", { branch: branchName }))
      });
      items.push({ isDivider: true, label: "" });
      items.push({
        label: `Rebase '${currentBranch || "HEAD"}' onto '${branchName}'`,
        onClick: () => closeAndRun(() => postMessage("rebase", branchName))
      });
      items.push({
        label: `Merge '${branchName}' into '${currentBranch || "HEAD"}'`,
        onClick: () => closeAndRun(() => postMessage("mergeBranch", branchName))
      });
      items.push({ isDivider: true, label: "" });
      items.push({
        label: "Update",
        onClick: () => closeAndRun(() => {
          showToast(`Updating '${branchName}'...`);
          postMessage("pull", branchName);
        })
      });
      items.push({
        label: "Push...",
        onClick: () => closeAndRun(() => postMessage("push", branchName))
      });
      if (branchInfo && branchInfo.upstream) {
        items.push({
          label: `Unset Tracked Branch (${branchInfo.upstream})`,
          onClick: () => closeAndRun(() => {
            showToast(`Unsetting tracked branch for '${branchName}'...`);
            postMessage("unsetUpstream", { branch: branchName });
          })
        });
      }
      items.push({ isDivider: true, label: "" });
      items.push({
        label: "Rename...",
        shortcut: "F2",
        onClick: () => closeAndRun(() => openRenameBranchDialog(branchName))
      });
      items.push({
        label: "Delete",
        onClick: () => closeAndRun(() => postMessage("deleteBranch", branchName))
      });
    }

    let menuX = e.clientX;
    let menuY = e.clientY;
    if (menuX + 270 > window.innerWidth - 8) menuX = Math.max(8, window.innerWidth - 278);
    if (menuY + 300 > window.innerHeight - 8) menuY = Math.max(8, window.innerHeight - 308);

    contextMenu = {
      visible: true,
      x: menuX,
      y: menuY,
      items
    };
  }

  function showGeneralBranchContextMenu(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    const items = [
      {
        label: "New Branch...",
        onClick: () => {
          contextMenu.visible = false;
          openCreateBranchDialog(currentBranch || "HEAD");
        }
      },
      {
        label: "Refresh Branches",
        onClick: () => {
          contextMenu.visible = false;
          postMessage("refreshBranches");
        }
      }
    ];

    let menuX = e.clientX;
    let menuY = e.clientY;
    if (menuX + 220 > window.innerWidth - 8) menuX = Math.max(8, window.innerWidth - 228);
    if (menuY + 120 > window.innerHeight - 8) menuY = Math.max(8, window.innerHeight - 128);

    contextMenu = {
      visible: true,
      x: menuX,
      y: menuY,
      items
    };
  }

  function showRemoteFolderContextMenu(e: MouseEvent, subNode: TreeNode) {
    e.preventDefault();
    e.stopPropagation();

    const branches = branchData.branches || [];
    const locals = branches.filter(b => !b.remote && !b.name.startsWith("("));
    const slashIdx = subNode.fullPath.indexOf("/");
    const isRootRemote = slashIdx === -1;
    const remoteName = isRootRemote ? subNode.fullPath : subNode.fullPath.slice(0, slashIdx);
    const folderSubPath = isRootRemote ? "" : subNode.fullPath.slice(slashIdx + 1);

    const targetLocals = isRootRemote
      ? locals
      : locals.filter(b => b.name === folderSubPath || b.name.startsWith(folderSubPath + "/"));

    const allTracked = targetLocals.length > 0 && targetLocals.every(b => {
      const expectedUpstream = remoteName + "/" + b.name;
      return b.upstream === expectedUpstream;
    });

    const items: Array<{
      label: string;
      shortcut?: string;
      onClick?: () => void;
      isDivider?: boolean;
      disabled?: boolean;
    }> = [];

    const closeAndRun = (action: () => void) => {
      contextMenu.visible = false;
      action();
    };

    if (isRootRemote) {
      items.push({
        label: `Fetch '${remoteName}'`,
        onClick: () => closeAndRun(() => {
          showToast(`Fetching remote '${remoteName}'...`);
          postMessage("fetchRemote", { remote: remoteName });
        })
      });
    }

    const labelText = isRootRemote
      ? `Track All Local Branches to '${remoteName}'`
      : `Track '${subNode.fullPath}' for '${folderSubPath}'`;

    items.push({
      label: labelText + (allTracked ? " (already tracked)" : ""),
      disabled: allTracked,
      onClick: () => closeAndRun(() => {
        showToast(`Tracking ${isRootRemote ? "all local branches" : `'${folderSubPath}'`} to '${remoteName}'...`);
        postMessage("trackAllBranchesToRemote", { remote: remoteName, prefix: folderSubPath || undefined });
      })
    });

    let menuX = e.clientX;
    let menuY = e.clientY;
    if (menuX + 270 > window.innerWidth - 8) menuX = Math.max(8, window.innerWidth - 278);
    if (menuY + 160 > window.innerHeight - 8) menuY = Math.max(8, window.innerHeight - 168);

    contextMenu = {
      visible: true,
      x: menuX,
      y: menuY,
      items
    };
  }

  function toggleFolder(fullPath: string, defaultCollapsed: boolean) {
    if (queryTrimmed) {
      const isCurrentlyCollapsed = searchFolderCollapseMap[fullPath] ?? false;
      searchFolderCollapseMap = {
        ...searchFolderCollapseMap,
        [fullPath]: !isCurrentlyCollapsed
      };
      return;
    }
    const isCurrentlyCollapsed = fullPath in folderCollapseMap ? folderCollapseMap[fullPath] : defaultCollapsed;
    folderCollapseMap = {
      ...folderCollapseMap,
      [fullPath]: !isCurrentlyCollapsed
    };
    saveFolderStates(currentRepoKey, folderCollapseMap);
  }

  function toggleSection(secName: string) {
    sectionCollapseMap = {
      ...sectionCollapseMap,
      [secName]: !sectionCollapseMap[secName]
    };
  }

  function expandOrCollapseAll() {
    if (queryTrimmed) {
      const visiblePaths: string[] = [];
      const collectPaths = (node: TreeNode) => {
        if (node.folders) {
          for (const k in node.folders) {
            const sub = node.folders[k];
            visiblePaths.push(sub.fullPath);
            collectPaths(sub);
          }
        }
      };
      collectPaths(localTreeData.root);
      collectPaths(remoteTreeData.root);

      const anyOpen = visiblePaths.some(p => !(searchFolderCollapseMap[p] ?? false));
      const nextMap: Record<string, boolean> = {};
      visiblePaths.forEach(p => {
        nextMap[p] = anyOpen;
      });
      searchFolderCollapseMap = nextMap;
      return;
    }

    const anyOpen = Object.values(sectionCollapseMap).some(v => !v) || Object.values(folderCollapseMap).some(v => !v);
    const shouldCollapse = anyOpen;
    sectionCollapseMap = {
      Local: shouldCollapse,
      Remote: shouldCollapse,
      Tags: shouldCollapse
    };
    const nextMap: Record<string, boolean> = {};
    Object.keys(folderCollapseMap).forEach(k => {
      nextMap[k] = shouldCollapse;
    });
    folderCollapseMap = nextMap;
    saveFolderStates(currentRepoKey, nextMap);
  }

  function handleCollapseStrip() {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      isCollapsed = !isCollapsed;
    }
  }

  const isCurrentFav = $derived.by(() => {
    const target = selectedTreeBranch === "HEAD" ? currentBranch : (selectedTreeBranch || currentBranch);
    return isBranchFavorite(target);
  });

  function handleFavoriteToggle() {
    const target = selectedTreeBranch === "HEAD" ? currentBranch : (selectedTreeBranch || currentBranch);
    if (!target) return;
    toggleBranchFavorite(target);
  }
</script>

<svelte:window onclick={() => { contextMenu.visible = false; }} />

<div
  class="branch-sidebar"
  class:collapsed={isCollapsed}
  style:width={isCollapsed ? "34px" : `${width}px`}
  style:min-width={isCollapsed ? "34px" : `${width}px`}
  style:transition={isDragging ? "none" : "width 0.12s ease"}
>
  <!-- Strip Toolbar (Leftmost thin strip) -->
  <div class="sidebar-strip">
    <!-- Collapse / Expand Button -->
    <button
      class="sidebar-strip-btn"
      use:tooltip={{ text: isCollapsed ? "Expand Branches" : "Collapse Branches" }}
      onclick={handleCollapseStrip}
    >
      {#if isCollapsed}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      {:else}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      {/if}
    </button>

    <!-- New Branch (+) -->
    <button
      class="sidebar-strip-btn"
      use:tooltip={{ text: "New Branch...", shortcut: "+" }}
      onclick={() => openCreateBranchDialog(selectedTreeBranch || currentBranch || "HEAD")}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
    </button>

    <!-- Update Selected Branch (↙) -->
    <button
      class="sidebar-strip-btn"
      use:tooltip={{ text: "Update Selected Branch", shortcut: "Fetch/Pull" }}
      onclick={() => {
        const target = selectedTreeBranch || currentBranch;
        if (target) {
          showToast(`Updating '${target}'...`);
          postMessage("pull", target);
        }
      }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="17" y1="7" x2="7" y2="17"></line>
        <polyline points="17 17 7 17 7 7"></polyline>
      </svg>
    </button>

    <!-- Delete Selected Branch (🗑) -->
    <button
      class="sidebar-strip-btn"
      use:tooltip={{ text: "Delete Selected Branch", shortcut: "Delete" }}
      onclick={() => {
        const target = selectedTreeBranch || activeBranch;
        if (target && target !== currentBranch) {
          postMessage("deleteBranch", target);
        }
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      </svg>
    </button>

    <!-- Compare with Current Branch (⇄) -->
    <button
      class="sidebar-strip-btn"
      use:tooltip={{ text: "Compare with Current Branch", shortcut: "Compare" }}
      onclick={() => {
        const target = selectedTreeBranch || activeBranch;
        if (target) {
          postMessage("compareBranch", { branch: target, withBranch: currentBranch });
        }
      }}
    >
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style="display:block;">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M5.85355 8.14645C5.65829 7.95118 5.34171 7.95118 5.14645 8.14645C4.95118 8.34171 4.95118 8.65829 5.14645 8.85355L7.29289 11H0.5C0.223858 11 0 11.2239 0 11.5C0 11.7761 0.223858 12 0.5 12H7.29289L5.14645 14.1464C4.95118 14.3417 4.95118 14.6583 5.14645 14.8536C5.34171 15.0488 5.65829 15.0488 5.85355 14.8536L8.85355 11.8536L9.20711 11.5L8.85355 11.1464L5.85355 8.14645Z" fill="currentColor"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M10.1464 1.14645C10.3417 0.951184 10.6583 0.951184 10.8536 1.14645C11.0488 1.34171 11.0488 1.65829 10.8536 1.85355L8.70711 4H15.5C15.7761 4 16 4.22386 16 4.5C16 4.77614 15.7761 5 15.5 5H8.70711L10.8536 7.14645C11.0488 7.34171 11.0488 7.65829 10.8536 7.85355C10.6583 8.04882 10.3417 8.04882 10.1464 7.85355L7.14645 4.85355L6.79289 4.5L7.14645 4.14645L10.1464 1.14645Z" fill="currentColor"/>
      </svg>
    </button>

    <!-- Fetch All Remotes -->
    <button
      class="sidebar-strip-btn"
      use:tooltip={{ text: "Fetch All Remotes", shortcut: "git fetch --all" }}
      onclick={() => postMessage("fetchAll")}
    >
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style="display:block;">
        <path d="M12.8536 3.14645C13.0488 3.34171 13.0488 3.65829 12.8536 3.85355L11.4393 5.26777C11.2441 5.46303 10.9275 5.46303 10.7322 5.26777C10.537 5.0725 10.537 4.75592 10.7322 4.56066L12.1464 3.14645C12.3417 2.95118 12.6583 2.95118 12.8536 3.14645Z" fill="currentColor"/>
        <path d="M10.0251 5.97487C10.2204 6.17014 10.2204 6.48672 10.0251 6.68198L8.61091 8.09619C8.41565 8.29146 8.09907 8.29146 7.90381 8.09619C7.70854 7.90093 7.70854 7.58435 7.90381 7.38909L9.31802 5.97487C9.51328 5.77961 9.82986 5.77961 10.0251 5.97487Z" fill="currentColor"/>
        <path d="M7.1967 8.8033C7.39196 8.99856 7.39196 9.31515 7.1967 9.51041L5.78249 10.9246C5.58722 11.1199 5.27064 11.1199 5.07538 10.9246C4.88012 10.7294 4.88012 10.4128 5.07538 10.2175L6.48959 8.8033C6.68485 8.60804 7.00144 8.60804 7.1967 8.8033Z" fill="currentColor"/>
        <path d="M3.5 5C3.77614 5 4 5.22386 4 5.5V7.5C4 7.77614 3.77614 8 3.5 8C3.22386 8 3 7.77614 3 7.5V5.5C3 5.22386 3.22386 5 3.5 5Z" fill="currentColor"/>
        <path d="M3.5 9C3.77614 9 4 9.22386 4 9.5V12H6.5C6.77614 12 7 12.2239 7 12.5C7 12.7761 6.77614 13 6.5 13H3.5C3.22386 13 3 12.7761 3 12.5V9.5C3 9.22386 3.22386 9 3.5 9Z" fill="currentColor"/>
        <path d="M8 12.5C8 12.2239 8.22386 12 8.5 12H10.5C10.7761 12 11 12.2239 11 12.5C11 12.7761 10.7761 13 10.5 13H8.5C8.22386 13 8 12.7761 8 12.5Z" fill="currentColor"/>
      </svg>
    </button>

    <!-- Search (Q) -->
    <button
      class="sidebar-strip-btn"
      use:tooltip={{ text: "Search Branches", shortcut: "Search" }}
      onclick={() => {
        if (isCollapsed) isCollapsed = false;
        tick().then(() => {
          searchInputEl?.focus();
          searchInputEl?.select();
        });
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
    </button>

    <!-- Expand / Collapse All Folders -->
    <button
      class="sidebar-strip-btn"
      use:tooltip={{ text: "Expand / Collapse All Folders" }}
      onclick={expandOrCollapseAll}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="15 3 21 3 21 9"></polyline>
        <polyline points="9 21 3 21 3 15"></polyline>
        <line x1="21" y1="3" x2="14" y2="10"></line>
        <line x1="3" y1="21" x2="10" y2="14"></line>
      </svg>
    </button>

    <!-- Favorite / Unfavorite Selected Branch (★) -->
    <button
      class="sidebar-strip-btn"
      class:active={isCurrentFav}
      use:tooltip={{
        text: isCurrentFav ? `Remove '${selectedTreeBranch || currentBranch}' from Favorites (★)` : `Add '${selectedTreeBranch || currentBranch}' to Favorites (★)`,
        shortcut: "Favorite"
      }}
      onclick={handleFavoriteToggle}
    >
      {#if isCurrentFav}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="#e5a50a" stroke="#e5a50a" stroke-width="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
      {:else}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
      {/if}
    </button>

    <!-- Git Remote Credentials / Log In -->
    <button
      class="sidebar-strip-btn"
      use:tooltip={{ text: "Git Remote Logins & Credentials", shortcut: "Git Log In" }}
      onclick={() => postMessage("openAuthDialog")}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
        <circle cx="7.5" cy="15.5" r="5.5"></circle>
        <path d="m21 2-9.6 9.6"></path>
        <path d="m15.5 7.5 2.5 2.5"></path>
        <path d="m18.5 4.5 2.5 2.5"></path>
        <circle cx="7.5" cy="15.5" r="1.5"></circle>
      </svg>
    </button>

    <!-- Exit Sub-repo (Door Icon) -->
    {#if isSubRepo}
      <button
        class="sidebar-strip-btn exit-subrepo-btn"
        style="margin-top:auto;"
        use:tooltip={{ text: "Exit Repository (Choose Another Repo)", shortcut: "Exit" }}
        onclick={() => postMessage("exitSubRepo")}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
      </button>
    {/if}
  </div>

  <!-- Main Sidebar Content (Tree View & Search) -->
  <div
    class="sidebar-main"
    oncontextmenu={(e) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".tree-item, .head-branch-box, .tree-folder-header")) {
        showGeneralBranchContextMenu(e);
      }
    }}
  >
    <!-- Search Box -->
    <div class="branch-search-box">
      <input
        bind:this={searchInputEl}
        type="text"
        class="branch-search-input"
        placeholder="Search branches..."
        bind:value={searchQuery}
      />
    </div>

    <!-- Tree View -->
    <div class="branch-tree-content">
      <!-- HEAD (Current Branch) box -->
      {#if currentBranch && (!queryTrimmed || currentBranch.toLowerCase().includes(queryTrimmed) || "head (current branch)".includes(queryTrimmed))}
        <div
          class="head-branch-box"
          class:active={selectedTreeBranch === "HEAD"}
          title={`HEAD (${currentBranch})`}
          onclick={() => selectBranch("HEAD")}
          ondblclick={() => openBranchLog("HEAD")}
          oncontextmenu={(e) => {
            selectBranch("HEAD");
            showBranchContextMenu(e, currentBranch);
          }}
        >
          <span class="head-title" style="display:inline-flex;align-items:center;gap:4px;">
            HEAD (Current Branch)
          </span>
        </div>
      {/if}

      <!-- LOCAL SECTION -->
      {#if localTreeData.list.length > 0}
        <div class="tree-section">
          <div class="tree-section-header" onclick={() => toggleSection("Local")}>
            <span class="arrow">
              {#if sectionCollapseMap.Local}
                <svg class="tree-arrow-svg" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
                  <path d="M6 3.5L10.5 8L6 12.5"/>
                </svg>
              {:else}
                <svg class="tree-arrow-svg" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
                  <path d="M3.5 6L8 10.5L12.5 6"/>
                </svg>
              {/if}
            </span>
            <span style="color:#ffffff;">Local</span>
          </div>

          {#if !sectionCollapseMap.Local}
            <div class="tree-section-body">
              {@render renderTreeLevel(localTreeData.root, false)}
            </div>
          {/if}
        </div>
      {/if}

      <!-- REMOTE SECTION -->
      {#if remoteTreeData.list.length > 0}
        <div class="tree-section">
          <div class="tree-section-header" onclick={() => toggleSection("Remote")}>
            <span class="arrow">
              {#if sectionCollapseMap.Remote}
                <svg class="tree-arrow-svg" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
                  <path d="M6 3.5L10.5 8L6 12.5"/>
                </svg>
              {:else}
                <svg class="tree-arrow-svg" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
                  <path d="M3.5 6L8 10.5L12.5 6"/>
                </svg>
              {/if}
            </span>
            <span style="color:#ffffff;">Remote</span>
          </div>

          {#if !sectionCollapseMap.Remote}
            <div class="tree-section-body">
              {@render renderTreeLevel(remoteTreeData.root, true)}
            </div>
          {/if}
        </div>
      {/if}

      <!-- TAGS SECTION -->
      {#if filteredTags.length > 0}
        <div class="tree-section">
          <div class="tree-section-header" onclick={() => toggleSection("Tags")}>
            <span class="arrow">
              {#if sectionCollapseMap.Tags}
                <svg class="tree-arrow-svg" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
                  <path d="M6 3.5L10.5 8L6 12.5"/>
                </svg>
              {:else}
                <svg class="tree-arrow-svg" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
                  <path d="M3.5 6L8 10.5L12.5 6"/>
                </svg>
              {/if}
            </span>
            <span style="color:#ffffff;">Tags</span>
          </div>

          {#if !sectionCollapseMap.Tags}
            <div class="tree-section-body">
              {#each filteredTags as t}
                <div
                  class="tree-item"
                  class:active={selectedTreeBranch === t.name}
                  title={t.name}
                  onclick={() => selectBranch(t.name)}
                  ondblclick={() => openBranchLog(t.name)}
                >
                  <span class="arrow spacer" style="visibility:hidden;pointer-events:none;"></span>
                  <span class="tree-item-icon">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style="display:block;color:#dfe1e5;">
                      <path d="M7.707 2.293L1.295 8.705C0.904 9.096 0.904 9.729 1.295 10.119L5.881 14.705C6.271 15.096 6.904 15.096 7.295 14.705L13.707 8.293C13.895 8.105 14 7.851 14 7.586V3C14 2.448 13.552 2 13 2H8.414C8.149 2 7.895 2.105 7.707 2.293Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
                      <circle cx="10.2" cy="5.8" r="1.3" stroke="currentColor" stroke-width="1.2" fill="none"/>
                    </svg>
                  </span>
                  <span>{t.name}</span>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {/if}

      <!-- EMPTY STATE -->
      {#if localTreeData.list.length === 0 && remoteTreeData.list.length === 0 && filteredTags.length === 0 && (!currentBranch || !filterMatches(currentBranch))}
        <div style="padding:16px 12px;text-align:center;color:var(--vscode-descriptionForeground);font-size:12px;">
          {queryTrimmed ? `No branches matching "${queryTrimmed}"` : "No branches"}
        </div>
      {/if}
    </div>
  </div>
</div>

<!-- FLOATING BRANCH CONTEXT MENU -->
{#if contextMenu.visible}
  <div
    class="branch-context-menu"
    style="left:{contextMenu.x}px;top:{contextMenu.y}px;"
    oncontextmenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
  >
    {#each contextMenu.items as it}
      {#if it.isDivider}
        <div class="bcm-divider"></div>
      {:else}
        <div
          class="bcm-item"
          class:disabled={it.disabled}
          onclick={(e) => {
            if (it.disabled) return;
            e.stopPropagation();
            it.onClick?.();
          }}
        >
          <span>{it.label}</span>
          {#if it.shortcut}
            <span class="bcm-shortcut">{it.shortcut}</span>
          {/if}
        </div>
      {/if}
    {/each}
  </div>
{/if}

<!-- SVELTE 5 RECURSIVE TREE SNIPPET -->
{#snippet renderTreeLevel(node: TreeNode, isRemoteTree: boolean)}
  {@const hasSiblingFolders = !!(node.folders && Object.keys(node.folders).length > 0)}
  {@const curBranchObj = node.branches.find(b => b.name === currentBranch)}
  {@const allFolderKeys = Object.keys(node.folders)}
  {@const curFolders = allFolderKeys.filter(k => hasCurrentBranchInNode(node.folders[k])).sort((a, b) => a.localeCompare(b))}
  {@const favBranches = node.branches.filter(b => isBranchFavorite(b.name) && b.name !== currentBranch).sort((a, b) => a.leafName.localeCompare(b.leafName))}
  {@const favFolders = allFolderKeys.filter(k => !hasCurrentBranchInNode(node.folders[k]) && hasFavoriteInNode(node.folders[k])).sort((a, b) => a.localeCompare(b))}
  {@const otherFolders = allFolderKeys.filter(k => !hasCurrentBranchInNode(node.folders[k]) && !hasFavoriteInNode(node.folders[k])).sort((a, b) => a.localeCompare(b))}
  {@const nonFavBranches = node.branches.filter(b => !isBranchFavorite(b.name) && b.name !== currentBranch).sort((a, b) => a.leafName.localeCompare(b.leafName))}

  <!-- 1. Current Branch (HEAD) at top level -->
  {#if curBranchObj}
    {@render renderBranchItem(curBranchObj, hasSiblingFolders)}
  {/if}

  <!-- 2. Folders containing Current Branch -->
  {#each curFolders as fk}
    {@render renderFolderItem(node.folders[fk], fk, isRemoteTree)}
  {/each}

  <!-- 3. Favorite Branches -->
  {#each favBranches as b}
    {@render renderBranchItem(b, hasSiblingFolders)}
  {/each}

  <!-- 4. Folders containing Favorite Branches -->
  {#each favFolders as fk}
    {@render renderFolderItem(node.folders[fk], fk, isRemoteTree)}
  {/each}

  <!-- 5. Other Folders -->
  {#each otherFolders as fk}
    {@render renderFolderItem(node.folders[fk], fk, isRemoteTree)}
  {/each}

  <!-- 6. Non-Favorite Branches -->
  {#each nonFavBranches as b}
    {@render renderBranchItem(b, hasSiblingFolders)}
  {/each}
{/snippet}

<!-- SVELTE 5 BRANCH ITEM SNIPPET -->
{#snippet renderBranchItem(b: BranchInfo & { leafName: string }, hasSiblingFolders: boolean)}
  {@const isCur = b.name === currentBranch}
  {@const isFav = isBranchFavorite(b.name)}
  {@const isSelected = selectedTreeBranch === b.name}

  <div
    class="tree-item"
    class:active={isSelected}
    class:current-head={isCur && !isSelected}
    title={b.name}
    onclick={() => selectBranch(b.name)}
    ondblclick={() => openBranchLog(b.name)}
    oncontextmenu={(e) => {
      selectBranch(b.name);
      showBranchContextMenu(e, b.name);
    }}
  >
    {#if hasSiblingFolders}
      <span class="arrow spacer" style="visibility:hidden;pointer-events:none;width:16px;height:16px;min-width:16px;display:inline-flex;flex-shrink:0;"></span>
    {/if}

    <!-- Icon: Favorite Star OR Checkout Yellow OR Branch White -->
    {#if isFav}
      <span
        class="tree-item-icon tree-item-star-slot is-fav"
        title="Favorite"
        style="cursor:pointer;color:#e5a50a;font-size:14px;line-height:1;display:inline-flex;align-items:center;justify-content:center;"
        onclick={(e) => {
          e.stopPropagation();
          toggleBranchFavorite(b.name);
        }}
      >
        ★
      </span>
    {:else if isCur}
      <span class="tree-item-icon">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style="display:block;">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M7.70708 2.29289L1.29497 8.705C0.904444 9.09553 0.904444 9.72869 1.29497 10.1192L5.88075 14.705C6.27128 15.0955 6.90444 15.0955 7.29497 14.705L13.7071 8.29289C13.8946 8.10536 14 7.851 14 7.58579V3C14 2.44772 13.5523 2 13 2H8.41418C8.14897 2 7.89461 2.10536 7.70708 2.29289ZM10 8C11.1046 8 12 7.10457 12 6C12 4.89543 11.1046 4 10 4C8.89543 4 8 4.89543 8 6C8 7.10457 8.89543 8 10 8Z" fill="#F2C55C"/>
        </svg>
      </span>
    {:else}
      <span class="tree-item-icon">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style="display:block;color:#dfe1e5;">
          <circle cx="4.5" cy="4.5" r="1.8" stroke="currentColor" stroke-width="1.2" fill="none"/>
          <circle cx="10.8" cy="6.2" r="1.8" stroke="currentColor" stroke-width="1.2" fill="none"/>
          <line x1="4.5" y1="6.3" x2="4.5" y2="14" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
          <path d="M4.5 9.8H9.3C10.13 9.8 10.8 9.13 10.8 8.3V8.0" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        </svg>
      </span>
    {/if}

    <span
      class="branch-name"
      style="{isCur ? 'font-weight:600;' : ''}overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"
    >
      {b.leafName}
    </span>

    <!-- Tracking Ahead / Behind Badges -->
    {#if b.behind || b.ahead}
      <span class="branch-track" style="margin-left:auto;display:inline-flex;align-items:center;gap:5px;flex-shrink:0;font-size:11px;font-family:var(--vscode-editor-font-family, monospace);">
        {#if b.behind}
          <span
            class="track-badge behind"
            style="color:#58a6ff;display:inline-flex;align-items:center;gap:1px;cursor:default;"
            use:tooltip={{ text: `Behind remote by ${b.behind} commit${b.behind > 1 ? "s" : ""}`, side: "bottom" }}
          >
            ↙ {b.behind}
          </span>
        {/if}
        {#if b.ahead}
          <span
            class="track-badge ahead"
            style="color:#3fb950;display:inline-flex;align-items:center;gap:1px;cursor:default;"
            use:tooltip={{ text: `Ahead of remote by ${b.ahead} commit${b.ahead > 1 ? "s" : ""}`, side: "bottom" }}
          >
            ↗ {b.ahead}
          </span>
        {/if}
      </span>
    {/if}
  </div>
{/snippet}

<!-- SVELTE 5 FOLDER ITEM SNIPPET -->
{#snippet renderFolderItem(subNode: TreeNode, fk: string, isRemoteTree: boolean)}
  {@const defaultCollapsed = !hasCurrentBranchInNode(subNode)}
  {@const isCollapsed = queryTrimmed
    ? (searchFolderCollapseMap[subNode.fullPath] ?? false)
    : (subNode.fullPath in folderCollapseMap ? folderCollapseMap[subNode.fullPath] : defaultCollapsed)}

  <div class="tree-folder">
    <div
      class="tree-folder-header"
      onclick={() => toggleFolder(subNode.fullPath, defaultCollapsed)}
      oncontextmenu={(e) => {
        if (isRemoteTree) {
          showRemoteFolderContextMenu(e, subNode);
        }
      }}
    >
      <span class="arrow">
        {#if isCollapsed}
          <svg class="tree-arrow-svg" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
            <path d="M6 3.5L10.5 8L6 12.5"/>
          </svg>
        {:else}
          <svg class="tree-arrow-svg" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
            <path d="M3.5 6L8 10.5L12.5 6"/>
          </svg>
        {/if}
      </span>

      <span class="tree-item-icon">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style="display:block;">
          <path d="M8.10584 4.34613L8.25344 4.5H8.46667H13C13.8284 4.5 14.5 5.17157 14.5 6V12.1333C14.5 12.9529 13.932 13.5 13.3667 13.5H2.63333C2.06804 13.5 1.5 12.9529 1.5 12.1333V3.86667C1.5 3.04707 2.06804 2.5 2.63333 2.5H6.1217C6.25792 2.5 6.38824 2.55557 6.48253 2.65387L8.10584 4.34613Z" fill="#43454A" stroke="#FFFFFF" stroke-width="1.1"/>
        </svg>
      </span>

      <span class="folder-name" style="color:#ffffff;">
        {fk}
      </span>
    </div>

    {#if !isCollapsed}
      <div class="tree-folder-body">
        {@render renderTreeLevel(subNode, isRemoteTree)}
      </div>
    {/if}
  </div>
{/snippet}
