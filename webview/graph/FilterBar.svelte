<script lang="ts">
  import { onMount } from "svelte";
  import { postMessage } from "$shared/vscodeApi";
  import type { ViewOptions } from "./types";

  interface Props {
    activeBranch?: string;
    branchData?: any;
    commits?: any[];
    selectedHash?: string | null;
    viewOptions?: ViewOptions;
    onFilter: (filter: any) => void;
    onRefresh: () => void;
    setActiveBranch?: (name: string) => void;
  }

  let {
    activeBranch = $bindable(""),
    branchData = { branches: [], currentBranch: "" },
    commits = [],
    selectedHash = null,
    viewOptions = $bindable(),
    onFilter,
    onRefresh,
    setActiveBranch
  }: Props = $props();

  // Filter criteria state
  let curQuery = $state("");
  let curBranch = $state(activeBranch || "");
  let curUser = $state("");
  let curDate = $state("");
  let curAfter = $state("");
  let curBefore = $state("");
  let curPath = $state("");
  let isRegex = $state(false);
  let isCase = $state(false);

  // Search input & search debounce
  let searchInputEl = $state<HTMLInputElement>();
  let searchDebounceTimer: ReturnType<typeof setTimeout> | undefined;

  // Active popup identifier
  type PopupName = "branch" | "user" | "date" | "path" | "graphOptions" | "viewOptions";
  let activePopup = $state<PopupName | null>(null);

  // Popup input references for autofocus
  let branchSearchInputEl = $state<HTMLInputElement>();
  let userSearchInputEl = $state<HTMLInputElement>();
  let pathInputEl = $state<HTMLInputElement>();

  // Filter popup local search states
  let branchSearch = $state("");
  let userSearch = $state("");
  let pathInputVal = $state("");
  let customDateAfter = $state("");
  let customDateBefore = $state("");

  // Graph Options state
  let sortMode = $state<"date" | "topo">("date");
  let isFirstParent = $state(false);
  let isNoMerges = $state(false);

  function toggleOption(key: keyof ViewOptions, storageKey: string) {
    if (!viewOptions) return;
    const nextVal = !viewOptions[key];
    viewOptions = {
      ...viewOptions,
      [key]: nextVal
    };
    try {
      localStorage.setItem(storageKey, String(nextVal));
    } catch {}
  }

  // Sync activeBranch prop with curBranch
  $effect(() => {
    if (activeBranch !== undefined && activeBranch !== curBranch) {
      curBranch = activeBranch || "";
    }
  });

  // Apply View Options classes to document.body
  $effect(() => {
    if (typeof document !== "undefined" && document.body && viewOptions) {
      document.body.classList.toggle("hide-col-author", !viewOptions.colAuthor);
      document.body.classList.toggle("hide-col-date", !viewOptions.colDate);
      document.body.classList.toggle("show-col-hash", viewOptions.colHash);
      document.body.classList.toggle("show-col-gpg", viewOptions.colGpg);
      document.body.classList.toggle("compact-refs", viewOptions.compactRefs);
      document.body.classList.toggle("hide-tag-names", !viewOptions.tagNames);
      document.body.classList.toggle("show-long-edges", viewOptions.longEdges);
      document.body.classList.toggle("commit-timestamp", viewOptions.commitTimestamp);
      document.body.classList.toggle("refs-on-left", viewOptions.refsOnLeft);
      document.body.classList.toggle("hl-my-commits", viewOptions.hlMyCommits);
      document.body.classList.toggle("hl-merge-commits", viewOptions.hlMergeCommits);
      document.body.classList.toggle("hl-current-branch", viewOptions.hlCurrentBranch);
      document.body.classList.toggle("hl-not-cherry-picked", viewOptions.hlNotCherryPicked);
    }
  });

  // Derived filtered branches
  let localBranches = $derived.by(() => {
    const list = (branchData?.branches || []).filter((b: any) => !b.remote);
    const q = branchSearch.trim().toLowerCase();
    return q ? list.filter((b: any) => b.name.toLowerCase().includes(q)) : list;
  });

  let remoteBranches = $derived.by(() => {
    const list = (branchData?.branches || []).filter((b: any) => b.remote);
    const q = branchSearch.trim().toLowerCase();
    return q ? list.filter((b: any) => b.name.toLowerCase().includes(q)) : list;
  });

  // Derived filtered authors
  let authorCounts = $derived.by(() => {
    const counts: Record<string, number> = {};
    for (const c of commits || []) {
      if (c.author) counts[c.author] = (counts[c.author] || 0) + 1;
    }
    return counts;
  });

  let authorNames = $derived(Object.keys(authorCounts).sort());

  let filteredAuthors = $derived.by(() => {
    const q = userSearch.trim().toLowerCase();
    return q ? authorNames.filter((name) => name.toLowerCase().includes(q)) : authorNames;
  });

  function showToast(text: string) {
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

  function applyFilter() {
    onFilter({
      query: curQuery || void 0,
      branch: curBranch || void 0,
      author: curUser || void 0,
      after: curAfter || void 0,
      before: curBefore || void 0,
      path: curPath || void 0,
      order: sortMode,
      firstParent: isFirstParent,
      noMerges: isNoMerges
    });
  }

  function changeBranch(newBranch: string) {
    curBranch = newBranch;
    activeBranch = newBranch;
    if (setActiveBranch) setActiveBranch(newBranch);
    applyFilter();
  }

  function togglePopup(name: PopupName, e?: MouseEvent) {
    if (e) e.stopPropagation();
    if (activePopup === name) {
      activePopup = null;
    } else {
      activePopup = name;
      if (name === "branch") {
        branchSearch = "";
        setTimeout(() => branchSearchInputEl?.focus(), 30);
      } else if (name === "user") {
        userSearch = "";
        setTimeout(() => userSearchInputEl?.focus(), 30);
      } else if (name === "path") {
        pathInputVal = curPath;
        setTimeout(() => pathInputEl?.focus(), 30);
      }
    }
  }

  function closeAllPopups() {
    activePopup = null;
  }

  // Tooltip helper action
  let tooltipEl: HTMLDivElement | null = null;
  function tooltip(node: HTMLElement, options: { text: string; shortcut?: string; side?: string }) {
    if (!tooltipEl && typeof document !== "undefined") {
      tooltipEl = document.querySelector(".app-tooltip");
      if (!tooltipEl) {
        tooltipEl = document.createElement("div");
        tooltipEl.className = "app-tooltip";
        document.body.appendChild(tooltipEl);
      }
    }

    let timer: ReturnType<typeof setTimeout> | undefined;
    const shortcut = options.shortcut || "";
    const side = options.side || "bottom";

    const onEnter = () => {
      timer = setTimeout(() => {
        if (!tooltipEl) return;
        tooltipEl.innerHTML = options.text + (shortcut ? `<span class="tooltip-shortcut">${shortcut}</span>` : "");
        tooltipEl.style.visibility = "hidden";
        tooltipEl.style.display = "block";
        tooltipEl.style.left = "-9999px";
        tooltipEl.style.top = "-9999px";
        tooltipEl.style.transform = "none";
        tooltipEl.classList.add("visible");

        const tipWidth = tooltipEl.offsetWidth || 100;
        const tipHeight = tooltipEl.offsetHeight || 24;
        const rect = node.getBoundingClientRect();
        const pad = 6;
        const viewWidth = window.innerWidth || document.documentElement.clientWidth;
        const viewHeight = window.innerHeight || document.documentElement.clientHeight;

        let tipLeft = rect.left + rect.width / 2 - tipWidth / 2;
        let tipTop = rect.bottom + 6;

        if (side === "bottom") {
          if (tipTop + tipHeight > viewHeight - pad && rect.top - tipHeight - 6 >= pad) {
            tipTop = rect.top - tipHeight - 6;
            tooltipEl.classList.remove("side-bottom");
            tooltipEl.classList.add("side-top");
          } else {
            tooltipEl.classList.remove("side-top");
            tooltipEl.classList.add("side-bottom");
          }
        }

        if (tipLeft < pad) tipLeft = pad;
        else if (tipLeft + tipWidth > viewWidth - pad) tipLeft = Math.max(pad, viewWidth - tipWidth - pad);

        tooltipEl.style.left = Math.round(tipLeft) + "px";
        tooltipEl.style.top = Math.round(tipTop) + "px";
        tooltipEl.style.visibility = "visible";
      }, 90);
    };

    const onLeave = () => {
      clearTimeout(timer);
      if (tooltipEl) tooltipEl.classList.remove("visible");
    };

    node.addEventListener("mouseenter", onEnter);
    node.addEventListener("mouseleave", onLeave);
    node.addEventListener("click", onLeave);

    return {
      destroy() {
        clearTimeout(timer);
        node.removeEventListener("mouseenter", onEnter);
        node.removeEventListener("mouseleave", onLeave);
        node.removeEventListener("click", onLeave);
      }
    };
  }

  onMount(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (activePopup) {
        const container = target.closest(`[data-popup-container="${activePopup}"]`);
        if (!container) {
          activePopup = null;
        }
      }
    };
    document.addEventListener("click", onDocClick);

    return () => {
      document.removeEventListener("click", onDocClick);
    };
  });
</script>

<div class="filter-bar">
  <!-- 1. Search Box with Regex and Case Sensitive -->
  <div class="as-search-box">
    <span class="as-search-icon" use:tooltip={{ text: "Search commits by text or hash" }}>
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
        <circle cx="6.5" cy="6.5" r="4.5" />
        <line x1="10" y1="10" x2="14.5" y2="14.5" />
      </svg>
    </span>
    <input
      type="text"
      class="as-search-input"
      placeholder="Text or hash"
      bind:this={searchInputEl}
      value={curQuery}
      oninput={(e) => {
        const val = (e.currentTarget as HTMLInputElement).value.trim();
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => {
          if (val !== curQuery) {
            curQuery = val;
            applyFilter();
          }
        }, 300);
      }}
      onkeydown={(e) => {
        if (e.key === "Enter") {
          clearTimeout(searchDebounceTimer);
          curQuery = (e.currentTarget as HTMLInputElement).value.trim();
          applyFilter();
        }
      }}
    />
    <span
      class="as-search-opt"
      class:active={isRegex}
      use:tooltip={{ text: "Regex" }}
      onclick={() => {
        isRegex = !isRegex;
      }}
    >
      .*
    </span>
    <span
      class="as-search-opt"
      class:active={isCase}
      use:tooltip={{ text: "Match Case" }}
      onclick={() => {
        isCase = !isCase;
      }}
    >
      Cc
    </span>
  </div>

  <!-- 2. Branch Dropdown -->
  <div style="position:relative;display:inline-flex;" data-popup-container="branch">
    <div
      class="as-filter-label"
      class:active={!!curBranch}
      use:tooltip={{ text: "Filter by Branch" }}
      onclick={(e) => togglePopup("branch", e)}
    >
      <span class="lbl-prefix">Branch{curBranch ? ":" : ""}</span>
      {#if curBranch}
        <span class="lbl-val">{curBranch}</span>
        <span
          class="lbl-clear"
          title="Clear"
          onclick={(e) => {
            e.stopPropagation();
            changeBranch("");
          }}>&times;</span
        >
      {:else}
        <span class="lbl-arrow">&#9662;</span>
      {/if}
    </div>

    {#if activePopup === "branch"}
      <div class="filter-popup" style="display:flex;">
        <div class="filter-popup-search">
          <input
            type="text"
            placeholder="Search branch..."
            bind:this={branchSearchInputEl}
            bind:value={branchSearch}
          />
        </div>
        <div class="branch-popup-items" style="overflow-y:auto;flex:1;">
          <div
            class="filter-popup-item"
            class:selected={!curBranch}
            onclick={() => {
              changeBranch("");
              closeAllPopups();
            }}
          >
            All Branches
          </div>

          {#if branchData?.currentBranch && (!branchSearch || branchData.currentBranch.toLowerCase().includes(branchSearch.toLowerCase()))}
            <div
              class="filter-popup-item"
              class:selected={curBranch === "HEAD"}
              onclick={() => {
                changeBranch("HEAD");
                closeAllPopups();
              }}
            >
              <span>HEAD ({branchData.currentBranch})</span>
            </div>
          {/if}

          {#if localBranches.length > 0}
            <div class="filter-popup-header">Local</div>
            {#each localBranches as b}
              <div
                class="filter-popup-item"
                class:selected={curBranch === b.name}
                onclick={() => {
                  changeBranch(b.name);
                  closeAllPopups();
                }}
              >
                {b.name}
              </div>
            {/each}
          {/if}

          {#if remoteBranches.length > 0}
            <div class="filter-popup-header">Remote</div>
            {#each remoteBranches as b}
              <div
                class="filter-popup-item"
                class:selected={curBranch === b.name}
                onclick={() => {
                  changeBranch(b.name);
                  closeAllPopups();
                }}
              >
                {b.name}
              </div>
            {/each}
          {/if}
        </div>
      </div>
    {/if}
  </div>

  <!-- 3. User Dropdown -->
  <div style="position:relative;display:inline-flex;" data-popup-container="user">
    <div
      class="as-filter-label"
      class:active={!!curUser}
      use:tooltip={{ text: "Filter by User" }}
      onclick={(e) => togglePopup("user", e)}
    >
      <span class="lbl-prefix">User{curUser ? ":" : ""}</span>
      {#if curUser}
        <span class="lbl-val">{curUser}</span>
        <span
          class="lbl-clear"
          title="Clear"
          onclick={(e) => {
            e.stopPropagation();
            curUser = "";
            applyFilter();
          }}>&times;</span
        >
      {:else}
        <span class="lbl-arrow">&#9662;</span>
      {/if}
    </div>

    {#if activePopup === "user"}
      <div class="filter-popup" style="display:flex;">
        <div class="filter-popup-search">
          <input
            type="text"
            placeholder="Type user name or email..."
            bind:this={userSearchInputEl}
            bind:value={userSearch}
            onkeydown={(e) => {
              if (e.key === "Enter" && userSearch.trim()) {
                curUser = userSearch.trim();
                closeAllPopups();
                applyFilter();
              }
            }}
          />
        </div>
        <div class="user-popup-items" style="overflow-y:auto;flex:1;">
          <div
            class="filter-popup-item"
            class:selected={!curUser}
            onclick={() => {
              curUser = "";
              closeAllPopups();
              applyFilter();
            }}
          >
            All Users
          </div>

          {#if filteredAuthors.length > 0}
            <div class="filter-popup-header">Authors in repo</div>
            {#each filteredAuthors as name}
              <div
                class="filter-popup-item"
                class:selected={curUser === name}
                onclick={() => {
                  curUser = name;
                  closeAllPopups();
                  applyFilter();
                }}
              >
                <span>{name}</span>
                <span style="opacity:0.6;font-size:11px;">({authorCounts[name]})</span>
              </div>
            {/each}
          {/if}
        </div>
      </div>
    {/if}
  </div>

  <!-- 4. Date Dropdown -->
  <div style="position:relative;display:inline-flex;" data-popup-container="date">
    <div
      class="as-filter-label"
      class:active={!!curDate}
      use:tooltip={{ text: "Filter by Date" }}
      onclick={(e) => togglePopup("date", e)}
    >
      <span class="lbl-prefix">Date{curDate ? ":" : ""}</span>
      {#if curDate}
        <span class="lbl-val">{curDate}</span>
        <span
          class="lbl-clear"
          title="Clear"
          onclick={(e) => {
            e.stopPropagation();
            curDate = "";
            curAfter = "";
            curBefore = "";
            applyFilter();
          }}>&times;</span
        >
      {:else}
        <span class="lbl-arrow">&#9662;</span>
      {/if}
    </div>

    {#if activePopup === "date"}
      <div class="filter-popup" style="display:flex;">
        <div
          class="filter-popup-item"
          onclick={() => {
            curDate = "";
            curAfter = "";
            curBefore = "";
            closeAllPopups();
            applyFilter();
          }}
        >
          All
        </div>
        <div
          class="filter-popup-item"
          onclick={() => {
            curDate = "Today";
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            curAfter = now.toISOString();
            curBefore = "";
            closeAllPopups();
            applyFilter();
          }}
        >
          Today
        </div>
        <div
          class="filter-popup-item"
          onclick={() => {
            curDate = "Yesterday";
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            const y = new Date(now.getTime() - 86400000);
            curAfter = y.toISOString();
            curBefore = now.toISOString();
            closeAllPopups();
            applyFilter();
          }}
        >
          Yesterday
        </div>
        <div
          class="filter-popup-item"
          onclick={() => {
            curDate = "Last 7 Days";
            curAfter = new Date(Date.now() - 7 * 86400000).toISOString();
            curBefore = "";
            closeAllPopups();
            applyFilter();
          }}
        >
          Last 7 Days
        </div>
        <div
          class="filter-popup-item"
          onclick={() => {
            curDate = "Last 30 Days";
            curAfter = new Date(Date.now() - 30 * 86400000).toISOString();
            curBefore = "";
            closeAllPopups();
            applyFilter();
          }}
        >
          Last 30 Days
        </div>

        <div class="filter-popup-divider"></div>

        <div class="filter-custom-date">
          <label for="c-after">Custom Range:</label>
          <input type="date" id="c-after" bind:value={customDateAfter} />
          <input type="date" id="c-before" bind:value={customDateBefore} />
          <button
            class="filter-apply-btn"
            onclick={() => {
              if (customDateAfter || customDateBefore) {
                curDate = (customDateAfter || "...") + " - " + (customDateBefore || "...");
                curAfter = customDateAfter ? new Date(customDateAfter).toISOString() : "";
                curBefore = customDateBefore ? new Date(customDateBefore).toISOString() : "";
              } else {
                curDate = "";
                curAfter = "";
                curBefore = "";
              }
              closeAllPopups();
              applyFilter();
            }}
          >
            Apply
          </button>
        </div>
      </div>
    {/if}
  </div>

  <!-- 5. Path Dropdown -->
  <div style="position:relative;display:inline-flex;" data-popup-container="path">
    <div
      class="as-filter-label"
      class:active={!!curPath}
      use:tooltip={{ text: "Filter by Structure / Path" }}
      onclick={(e) => togglePopup("path", e)}
    >
      <span class="lbl-prefix">Paths{curPath ? ":" : ""}</span>
      {#if curPath}
        <span class="lbl-val">{curPath}</span>
        <span
          class="lbl-clear"
          title="Clear"
          onclick={(e) => {
            e.stopPropagation();
            curPath = "";
            applyFilter();
          }}>&times;</span
        >
      {:else}
        <span class="lbl-arrow">&#9662;</span>
      {/if}
    </div>

    {#if activePopup === "path"}
      <div class="filter-popup" style="display:flex;padding:8px 12px;">
        <input
          type="text"
          placeholder="e.g. lib/models or file.dart"
          bind:this={pathInputEl}
          bind:value={pathInputVal}
          style="width:100%;box-sizing:border-box;background:var(--vscode-input-background);color:var(--vscode-input-foreground);border:1px solid var(--vscode-input-border, rgba(128,128,128,0.3));border-radius:3px;padding:3px 6px;font-size:11px;outline:none;margin-bottom:6px;"
          onkeydown={(e) => {
            if (e.key === "Enter") {
              curPath = pathInputVal.trim();
              closeAllPopups();
              applyFilter();
            }
          }}
        />
        <button
          class="filter-apply-btn"
          onclick={() => {
            curPath = pathInputVal.trim();
            closeAllPopups();
            applyFilter();
          }}
        >
          Apply
        </button>
      </div>
    {/if}
  </div>

  <!-- 6. Graph Options Button & Menu -->
  <div style="position:relative;display:inline-flex;" data-popup-container="graphOptions">
    <div
      class="as-filter-label as-tool-icon"
      style="padding:2px 4px;"
      use:tooltip={{ text: "Graph Options" }}
      onclick={(e) => togglePopup("graphOptions", e)}
    >
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
        <line x1="4.5" y1="2.5" x2="4.5" y2="13.5" />
        <polyline points="2.5,10.5 4.5,13.5 6.5,10.5" />
        <line x1="11.5" y1="2.5" x2="11.5" y2="13.5" />
        <polygon points="11.5,3.5 13.5,5.5 11.5,7.5 9.5,5.5" fill="var(--vscode-editor-background, #1e1f22)" stroke="currentColor" stroke-width="1.2" />
        <polygon points="11.5,8.5 13.5,10.5 11.5,12.5 9.5,10.5" fill="var(--vscode-editor-background, #1e1f22)" stroke="currentColor" stroke-width="1.2" />
        <polygon points="12,15 15,15 15,12" fill="currentColor" stroke="none" />
      </svg>
    </div>

    {#if activePopup === "graphOptions"}
      <div class="as-dropdown-menu" style="display:flex;">
        <div class="as-menu-section-header">Sort</div>
        <div
          class="as-menu-item"
          class:selected={sortMode === "date"}
          onclick={() => {
            sortMode = "date";
            applyFilter();
          }}
        >
          <span class="as-menu-check">
            {#if sortMode === "date"}
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z" /></svg>
            {/if}
          </span>
          <span class="as-menu-label">By Commit Date</span>
        </div>
        <div
          class="as-menu-item"
          class:selected={sortMode === "topo"}
          onclick={() => {
            sortMode = "topo";
            applyFilter();
          }}
        >
          <span class="as-menu-check">
            {#if sortMode === "topo"}
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z" /></svg>
            {/if}
          </span>
          <span class="as-menu-label">Topologically</span>
        </div>

        <div class="as-menu-divider"></div>

        <div class="as-menu-section-header">Options</div>
        <div
          class="as-menu-item"
          class:selected={isFirstParent}
          onclick={() => {
            isFirstParent = !isFirstParent;
            applyFilter();
          }}
        >
          <span class="as-menu-check">
            {#if isFirstParent}
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z" /></svg>
            {/if}
          </span>
          <span class="as-menu-label">First Parent</span>
        </div>
        <div
          class="as-menu-item"
          class:selected={isNoMerges}
          onclick={() => {
            isNoMerges = !isNoMerges;
            applyFilter();
          }}
        >
          <span class="as-menu-check">
            {#if isNoMerges}
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z" /></svg>
            {/if}
          </span>
          <span class="as-menu-label">No Merges</span>
        </div>

        <div class="as-menu-divider"></div>

        <div class="as-menu-section-header">Branch Actions</div>
        <div
          class="as-menu-item"
          onclick={() => {
            closeAllPopups();
            postMessage("collapseLinearBranches");
            showToast("Collapsed linear branches");
          }}
        >
          <span class="as-menu-check"></span>
          <span class="as-menu-label">Collapse Linear Branches</span>
        </div>
        <div
          class="as-menu-item"
          onclick={() => {
            closeAllPopups();
            postMessage("expandLinearBranches");
            showToast("Expanded linear branches");
          }}
        >
          <span class="as-menu-check"></span>
          <span class="as-menu-label">Expand Linear Branches</span>
        </div>
      </div>
    {/if}
  </div>

  <!-- 7. Right Toolbar Actions (Refresh, Cherry-Pick, View Options, Search) -->
  <div class="as-toolbar-right">
    <!-- Refresh Button -->
    <span
      class="as-tool-icon"
      use:tooltip={{ text: "Refresh", shortcut: "Cmd+R" }}
      onclick={() => onRefresh()}
    >
      <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" style="display:block;">
        <path fill-rule="evenodd" d="M12.5747152,11.8852806 C11.4741474,13.1817355 9.83247882,14.0044386 7.99865879,14.0044386 C5.03907292,14.0044386 2.57997332,11.8615894 2.08820756,9.0427473 L3.94774327,9.10768372 C4.43372186,10.8898575 6.06393114,12.2000519 8.00015362,12.2000519 C9.30149237,12.2000519 10.4645985,11.6082097 11.2349873,10.6790094 L9.05000019,8.71167959 L14.0431479,8.44999981 L14.3048222,13.4430431 L12.5747152,11.8852806 Z M3.42785637,4.11741586 C4.52839138,2.82452748 6.16775464,2.00443857 7.99865879,2.00443857 C10.918604,2.00443857 13.3513802,4.09026967 13.8882946,6.8532307 L12.0226389,6.78808057 C11.5024872,5.05935553 9.89838095,3.8000774 8.00015362,3.8000774 C6.69867367,3.8000774 5.53545628,4.39204806 4.76506921,5.32142241 L6.95482203,7.29304326 L1.96167436,7.55472304 L1.70000005,2.56167973 L3.42785637,4.11741586 Z" transform="rotate(3 8.002 8.004)"/>
      </svg>
    </span>

    <!-- Cherry-Pick Button -->
    <span
      class="as-tool-icon"
      use:tooltip={{ text: "Cherry-Pick Commit" }}
      onclick={() => {
        if (selectedHash) {
          postMessage("cherryPick", { hash: selectedHash });
        } else {
          showToast("Select a commit from the log to cherry-pick");
        }
      }}
    >
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style="display:block;">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M6.5 11C6.5 12.1046 5.60457 13 4.5 13C3.39543 13 2.5 12.1046 2.5 11C2.5 9.89543 3.39543 9 4.5 9C5.60457 9 6.5 9.89543 6.5 11ZM4.5 14C6.15685 14 7.5 12.6569 7.5 11C7.5 9.34315 6.15685 8 4.5 8C2.84315 8 1.5 9.34315 1.5 11C1.5 12.6569 2.84315 14 4.5 14ZM13.5 11C13.5 12.1046 12.6046 13 11.5 13C10.3954 13 9.5 12.1046 9.5 11C9.5 9.89543 10.3954 9 11.5 9C12.6046 9 13.5 9.89543 13.5 11ZM11.5 14C13.1569 14 14.5 12.6569 14.5 11C14.5 9.34315 13.1569 8 11.5 8C9.84315 8 8.5 9.34315 8.5 11C8.5 12.6569 9.84315 14 11.5 14Z" fill="currentColor"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M11.8537 1.14647C11.7934 1.08617 11.7216 1.04449 11.6453 1.02143C11.5869 1.00372 11.5244 0.996452 11.46 1.00164L11.4585 1.00175L11.4577 1.00183C8.89299 1.21581 7.10682 2.51359 5.92996 4.03112C4.76214 5.53699 4.18349 7.26955 4.00588 8.424C3.9639 8.69693 4.15111 8.95222 4.42404 8.99421C4.69697 9.0362 4.95227 8.84899 4.99426 8.57606C5.14998 7.56384 5.67133 5.9964 6.72018 4.64394C7.43375 3.72381 8.38624 2.9082 9.6361 2.42686L10.8329 1.87283L10.1507 2.48553C9.63716 3.45813 9.48624 4.482 9.53842 5.42758C9.61459 6.8079 10.1221 8.0385 10.5761 8.76503C10.7225 8.9992 11.031 9.07038 11.2651 8.92403C11.4993 8.77767 11.5705 8.4692 11.4241 8.23503C11.0449 7.62822 10.6024 6.55883 10.5369 5.37248C10.4723 4.20114 10.7737 2.93361 11.8537 1.85358C12.049 1.65832 12.049 1.34174 11.8537 1.14647Z" fill="currentColor"/>
      </svg>
    </span>

    <!-- View Options Button & Menu -->
    <div style="position:relative;display:inline-flex;" data-popup-container="viewOptions">
      <span
        class="as-tool-icon"
        use:tooltip={{ text: "View Options" }}
        onclick={(e) => togglePopup("viewOptions", e)}
      >
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
          <path d="M1.5 8C3 4.5 7 2.8 8 2.8C9 2.8 13 4.5 14.5 8C13 11.5 9 13.2 8 13.2C7 13.2 3 11.5 1.5 8Z"/>
          <circle cx="8" cy="8" r="2.2"/>
          <polygon points="12,15 15,15 15,12" fill="currentColor" stroke="none"/>
        </svg>
      </span>

      {#if activePopup === "viewOptions"}
        <div class="as-dropdown-menu" style="display:flex;right:0;left:auto;">
          <!-- Section 1: Show -->
          <div class="as-menu-section-header">Show</div>
          <div
            class="as-menu-item"
            onclick={() => toggleOption("compactRefs", "jetgit_view_compact_refs")}
          >
            <span class="as-menu-check">
              {#if viewOptions?.compactRefs}
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z" /></svg>
              {/if}
            </span>
            <span class="as-menu-label">Compact References View</span>
          </div>

          <div
            class="as-menu-item"
            onclick={() => toggleOption("tagNames", "jetgit_view_tag_names")}
          >
            <span class="as-menu-check">
              {#if viewOptions?.tagNames}
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z" /></svg>
              {/if}
            </span>
            <span class="as-menu-label">Tag Names</span>
          </div>

          <div
            class="as-menu-item"
            onclick={() => toggleOption("longEdges", "jetgit_view_long_edges")}
          >
            <span class="as-menu-check">
              {#if viewOptions?.longEdges}
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z" /></svg>
              {/if}
            </span>
            <span class="as-menu-label">Long Edges</span>
          </div>

          <div
            class="as-menu-item"
            onclick={() => toggleOption("commitTimestamp", "jetgit_view_commit_timestamp")}
          >
            <span class="as-menu-check">
              {#if viewOptions?.commitTimestamp}
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z" /></svg>
              {/if}
            </span>
            <span class="as-menu-label">Commit Timestamp</span>
          </div>

          <div
            class="as-menu-item"
            onclick={() => toggleOption("refsOnLeft", "jetgit_view_refs_on_left")}
          >
            <span class="as-menu-check">
              {#if viewOptions?.refsOnLeft}
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z" /></svg>
              {/if}
            </span>
            <span class="as-menu-label">References on the Left</span>
          </div>

          <!-- Columns Submenu -->
          <div class="as-menu-item has-submenu">
            <span class="as-menu-check"></span>
            <span class="as-menu-label">Columns</span>
            <span class="as-menu-arrow">›</span>

            <div class="as-dropdown-menu as-submenu" style="left:auto;right:100%;margin-right:2px;">
              <div
                class="as-menu-item"
                onclick={(e) => {
                  e.stopPropagation();
                  toggleOption("colAuthor", "jetgit_col_author");
                }}
              >
                <span class="as-menu-check">
                  {#if viewOptions?.colAuthor}
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z" /></svg>
                  {/if}
                </span>
                <span class="as-menu-label">Author</span>
              </div>

              <div
                class="as-menu-item"
                onclick={(e) => {
                  e.stopPropagation();
                  toggleOption("colHash", "jetgit_col_hash");
                }}
              >
                <span class="as-menu-check">
                  {#if viewOptions?.colHash}
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z" /></svg>
                  {/if}
                </span>
                <span class="as-menu-label">Hash</span>
              </div>

              <div
                class="as-menu-item"
                onclick={(e) => {
                  e.stopPropagation();
                  toggleOption("colDate", "jetgit_col_date");
                }}
              >
                <span class="as-menu-check">
                  {#if viewOptions?.colDate}
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z" /></svg>
                  {/if}
                </span>
                <span class="as-menu-label">Date</span>
              </div>

              <div
                class="as-menu-item"
                onclick={(e) => {
                  e.stopPropagation();
                  toggleOption("colGpg", "jetgit_col_gpg");
                }}
              >
                <span class="as-menu-check">
                  {#if viewOptions?.colGpg}
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z" /></svg>
                  {/if}
                </span>
                <span class="as-menu-label">GPG Signature</span>
              </div>
            </div>
          </div>

          <div class="as-menu-divider"></div>

          <!-- Section 2: Highlight -->
          <div class="as-menu-section-header">Highlight</div>
          <div
            class="as-menu-item"
            onclick={() => toggleOption("hlMyCommits", "jetgit_hl_my_commits")}
          >
            <span class="as-menu-check">
              {#if viewOptions?.hlMyCommits}
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z" /></svg>
              {/if}
            </span>
            <span class="as-menu-label">My Commits</span>
          </div>

          <div
            class="as-menu-item"
            onclick={() => toggleOption("hlMergeCommits", "jetgit_hl_merge_commits")}
          >
            <span class="as-menu-check">
              {#if viewOptions?.hlMergeCommits}
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z" /></svg>
              {/if}
            </span>
            <span class="as-menu-label">Merge Commits</span>
          </div>

          <div
            class="as-menu-item"
            onclick={() => toggleOption("hlCurrentBranch", "jetgit_hl_current_branch")}
          >
            <span class="as-menu-check">
              {#if viewOptions?.hlCurrentBranch}
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z" /></svg>
              {/if}
            </span>
            <span class="as-menu-label">Current Branch</span>
          </div>

          <div
            class="as-menu-item"
            onclick={() => toggleOption("hlNotCherryPicked", "jetgit_hl_not_cherry_picked")}
          >
            <span class="as-menu-check">
              {#if viewOptions?.hlNotCherryPicked}
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z" /></svg>
              {/if}
            </span>
            <span class="as-menu-label">Not Cherry-Picked Commits</span>
          </div>
        </div>
      {/if}
    </div>

    <!-- Search Commits Button (Focus Search Box) -->
    <span
      class="as-tool-icon"
      use:tooltip={{ text: "Search Commits", shortcut: "/" }}
      onclick={() => {
        searchInputEl?.focus();
        searchInputEl?.select();
      }}
    >
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
        <circle cx="6.5" cy="6.5" r="4.5" />
        <line x1="10" y1="10" x2="14.5" y2="14.5" />
      </svg>
    </span>
  </div>
</div>

<style>
.filter-bar {display:flex;gap:12px;padding:0 12px;background:var(--vscode-editor-background);border-bottom:1px solid var(--vscode-panel-border);align-items:center;height:34px;min-height:34px;box-sizing:border-box;font-size:12px;position:relative;z-index:1000;user-select:none;flex-wrap:nowrap;overflow:visible;}
.as-search-box {display:flex;align-items:center;background:var(--vscode-input-background, #3c3c3c);border:1px solid rgba(128,128,128,0.25);border-radius:4px;padding:0 6px;height:24px;width:200px;gap:4px;flex-shrink:0;}
.as-search-box:focus-within {border-color:var(--vscode-focusBorder, #007acc);}
.as-search-input {background:transparent;border:none;outline:none;color:var(--vscode-input-foreground);font-size:12px;flex:1;min-width:60px;}
.as-search-icon {color:#8c8c8c;font-size:11px;display:flex;align-items:center;}
.as-search-opt {font-size:11px;color:#8c8c8c;padding:1px 3px;border-radius:2px;cursor:pointer;user-select:none;font-family:monospace;}
.as-search-opt:hover {color:#ffffff;background:rgba(255,255,255,0.1);}
.as-search-opt.active {color:#58a6ff;background:rgba(56,139,253,0.2);}
.as-filter-label {display:inline-flex;align-items:center;gap:3px;height:24px;padding:0 5px;border-radius:3px;cursor:pointer;font-size:12px;color:#cccccc;position:relative;flex-shrink:0;white-space:nowrap;}
.as-filter-label:hover {background:rgba(255, 255, 255, 0.08);color:#ffffff;}
.as-filter-label .lbl-prefix {color:#8c8c8c;}
.as-filter-label .lbl-val {color:#ffffff;font-weight:500;}
.as-filter-label .lbl-arrow {font-size:9px;color:#8c8c8c;margin-left:2px;}
.as-filter-label .lbl-clear {color:#8c8c8c;margin-left:3px;font-size:12px;padding:0 2px;border-radius:50%;line-height:1;}
.as-filter-label .lbl-clear:hover {color:#ffffff;background:rgba(255,255,255,0.2);}
.as-toolbar-right {margin-left:auto;display:flex;align-items:center;gap:10px;color:#8c8c8c;}
.as-tool-icon {cursor:pointer;display:flex;align-items:center;padding:2px 4px;border-radius:3px;}
.as-tool-icon:hover {color:#ffffff;background:rgba(255,255,255,0.1);}

.filter-popup {position:absolute;top:calc(100% + 4px);left:0;background:var(--vscode-menu-background, #2b2d30);border:1px solid var(--vscode-menu-border, #393b40);border-radius:6px;box-shadow:0 8px 24px rgba(0, 0, 0, 0.65);min-width:230px;max-width:340px;max-height:360px;overflow-y:auto;z-index:1000;padding:4px;display:none;flex-direction:column;}
.filter-popup-search {padding:4px 6px 6px;border-bottom:1px solid var(--vscode-menu-border, #393b40);flex-shrink:0;}
.filter-popup-search input {width:100%;box-sizing:border-box;background:var(--vscode-input-background, #1e1f22);color:var(--vscode-input-foreground, #dfe1e5);border:1px solid var(--vscode-input-border, #4e5157);border-radius:4px;padding:3px 6px;font-size:11px;outline:none;}
.filter-popup-item {padding:4px 12px;border-radius:4px;display:flex;align-items:center;justify-content:space-between;gap:8px;color:var(--vscode-menu-foreground, #dfe1e5);cursor:pointer;font-size:12px;white-space:nowrap;margin:1px 0;transition:background 0.08s ease, color 0.08s ease;}
.filter-popup-item:hover {background:var(--vscode-menu-selectionBackground, #2e436e) !important;color:var(--vscode-menu-selectionForeground, #ffffff) !important;}
.filter-popup-item.selected {font-weight:600;color:var(--vscode-terminal-ansiYellow, #e5a50a);}
.filter-popup-header {padding:6px 10px 2px;font-size:10px;font-weight:600;color:var(--vscode-descriptionForeground, #7f858e);text-transform:uppercase;letter-spacing:0.5px;}
.filter-popup-divider {height:1px;background:var(--vscode-menu-separatorBackground, var(--vscode-menu-border, #393b40));margin:4px 0;}
.filter-custom-date {padding:8px 12px;display:flex;flex-direction:column;gap:6px;}
.filter-custom-date label {font-size:11px;color:var(--vscode-descriptionForeground, #7f858e);}
.filter-custom-date input {background:var(--vscode-input-background, #1e1f22);color:var(--vscode-input-foreground, #dfe1e5);border:1px solid var(--vscode-input-border, #4e5157);border-radius:4px;padding:3px 6px;font-size:11px;outline:none;}
.filter-apply-btn {margin-top:4px;background:var(--vscode-button-background, #2e436e);color:var(--vscode-button-foreground, #ffffff);border:none;border-radius:4px;padding:4px 10px;font-size:11px;cursor:pointer;align-self:flex-end;}
.filter-apply-btn:hover {background:var(--vscode-button-hoverBackground, #355389);}

.as-dropdown-menu {position:absolute;top:calc(100% + 4px);background:var(--vscode-menu-background, #2b2d30);border:1px solid var(--vscode-menu-border, #393b40);border-radius:6px;box-shadow:0 8px 24px rgba(0, 0, 0, 0.65);padding:4px;min-width:215px;max-height:calc(100vh - 46px);overflow-y:auto;z-index:2000;display:none;flex-direction:column;color:var(--vscode-menu-foreground, #dfe1e5);font-family:-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;font-size:12px;user-select:none;box-sizing:border-box;}
.as-menu-section-header {padding:6px 10px 3px 10px;font-size:11px;font-weight:600;color:var(--vscode-descriptionForeground, #7f858e);text-align:left;}
.as-menu-divider {height:1px;background:var(--vscode-menu-separatorBackground, var(--vscode-menu-border, #393b40));margin:4px 0;}
.as-menu-item {display:flex;align-items:center;padding:3px 8px;border-radius:4px;cursor:pointer;height:24px;box-sizing:border-box;color:var(--vscode-menu-foreground, #dfe1e5);white-space:nowrap;position:relative;transition:background 0.08s ease, color 0.08s ease;}
.as-menu-item:hover, .as-menu-item.selected {background:var(--vscode-menu-selectionBackground, #2e436e) !important;color:var(--vscode-menu-selectionForeground, #ffffff) !important;}
.as-menu-item:hover .as-menu-label, .as-menu-item:hover .as-menu-check, .as-menu-item:hover .as-menu-arrow {color:var(--vscode-menu-selectionForeground, #ffffff) !important;}
.as-menu-check {width:18px;min-width:18px;display:inline-flex;align-items:center;justify-content:flex-start;color:inherit;flex-shrink:0;}
.as-menu-label {flex:1;text-align:left;color:inherit;}
.as-menu-arrow {margin-left:auto;font-size:13px;opacity:0.7;}
.as-submenu {display:none;position:absolute;left:100%;top:-4px;margin-left:2px;min-width:140px;}
.has-submenu:hover > .as-submenu {display:flex;}

:global(body.hide-col-author .author) {display:none !important;}
:global(body.hide-col-date .date) {display:none !important;}
:global(body.show-col-hash .hash) {display:inline-block !important;color:#8c8c8c !important;font-family:var(--vscode-editor-font-family, monospace) !important;font-size:11px !important;user-select:text !important;width:68px !important;min-width:68px !important;}
:global(body.compact-refs .labels) {gap:3px !important;}
:global(body.compact-refs .label) {padding:0 3px !important;font-size:0.76em !important;}
:global(body.refs-on-left .labels) {order:0 !important;margin-left:0 !important;margin-right:8px !important;}
</style>
