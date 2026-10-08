<script lang="ts">
  import { onMount } from "svelte";
  import { postMessage } from "$shared/vscodeApi";

  interface Props {
    activeBranch?: string;
    branchData?: any;
    commits?: any[];
    selectedHash?: string | null;
    onFilter: (filter: any) => void;
    onRefresh: () => void;
    setActiveBranch?: (name: string) => void;
  }

  let {
    activeBranch = "",
    branchData = { branches: [], currentBranch: "" },
    commits = [],
    selectedHash = null,
    onFilter,
    onRefresh,
    setActiveBranch
  }: Props = $props();

  let bar: HTMLDivElement;
  let updateLabelsFn: (() => void) | undefined;
  let curBranch: string = "";

  onMount(() => {

    let curQuery = "";
    curBranch = activeBranch || "";
    let curUser = "";
    let curDate = "";
    let curAfter = "";
    let curBefore = "";
    let curPath = "";
    let isRegex = false;
    let isCase = false;

    // Graph Options state
    let sortMode = "date"; // "date" | "topo"
    let isFirstParent = false;
    let isNoMerges = false;

    // View Options state
    let viewCompactRefs = true;
    let viewTagNames = false;
    let viewLongEdges = false;
    let viewCommitTimestamp = false;
    let viewRefsOnLeft = false;

    let colAuthor = true;
    let colHash = false;
    let colDate = true;
    let colGpg = false;

    let hlMyCommits = true;
    let hlMergeCommits = true;
    let hlCurrentBranch = true;
    let hlNotCherryPicked = false;
    try {
      if (localStorage.getItem("intellij_git_hl_my_commits") !== null) {
        hlMyCommits = localStorage.getItem("intellij_git_hl_my_commits") === "true";
      }
      if (localStorage.getItem("intellij_git_hl_merge_commits") !== null) {
        hlMergeCommits = localStorage.getItem("intellij_git_hl_merge_commits") === "true";
      }
      if (localStorage.getItem("intellij_git_hl_current_branch") !== null) {
        hlCurrentBranch = localStorage.getItem("intellij_git_hl_current_branch") === "true";
      }
    } catch {}

    let graphOptionPopup = null;
    let viewOptionPopup = null;

    let tooltipEl = document.querySelector(".app-tooltip");
    if (!tooltipEl && typeof document !== "undefined") {
      tooltipEl = document.createElement("div");
      tooltipEl.className = "app-tooltip";
      document.body.appendChild(tooltipEl);
    }

    function attachTooltip(el, text, shortcut = "", side = "bottom") {
      if (!el) return;
      el.dataset.tooltip = text;
      if (shortcut) el.dataset.shortcut = shortcut;
      el.title = text + (shortcut ? " (" + shortcut + ")" : "");
      let timer;
      el.addEventListener("mouseenter", () => {
        const currentText = el.dataset.tooltip || el.title;
        const currentShortcut = el.dataset.shortcut || "";
        if (!currentText) return;
        timer = setTimeout(() => {
          if (!tooltipEl) {
            tooltipEl = document.querySelector(".app-tooltip");
            if (!tooltipEl) {
              tooltipEl = document.createElement("div");
              tooltipEl.className = "app-tooltip";
              document.body.appendChild(tooltipEl);
            }
          }
          tooltipEl.innerHTML = currentText + (currentShortcut ? '<span class="tooltip-shortcut">' + currentShortcut + '</span>' : '');

          tooltipEl.style.visibility = "hidden";
          tooltipEl.style.display = "block";
          tooltipEl.style.left = "-9999px";
          tooltipEl.style.top = "-9999px";
          tooltipEl.style.transform = "none";
          tooltipEl.classList.add("visible");

          const tipWidth = tooltipEl.offsetWidth || 100;
          const tipHeight = tooltipEl.offsetHeight || 24;
          const rect = el.getBoundingClientRect();
          const pad = 6;
          const viewWidth = window.innerWidth || document.documentElement.clientWidth;
          const viewHeight = window.innerHeight || document.documentElement.clientHeight;

          let tipLeft;
          let tipTop;

          if (side === "bottom") {
            tipLeft = rect.left + (rect.width / 2) - (tipWidth / 2);
            tipTop = rect.bottom + 6;
            if (tipTop + tipHeight > viewHeight - pad && rect.top - tipHeight - 6 >= pad) {
              tipTop = rect.top - tipHeight - 6;
              tooltipEl.classList.remove("side-bottom");
              tooltipEl.classList.add("side-top");
            } else {
              tooltipEl.classList.remove("side-top");
              tooltipEl.classList.add("side-bottom");
            }
          } else if (side === "right") {
            tipLeft = rect.right + 7;
            tipTop = rect.top + (rect.height / 2) - (tipHeight / 2);
            if (tipLeft + tipWidth > viewWidth - pad && rect.left - tipWidth - 7 >= pad) {
              tipLeft = rect.left - tipWidth - 7;
              tooltipEl.classList.remove("side-right");
              tooltipEl.classList.add("side-left");
            } else {
              tooltipEl.classList.remove("side-left");
              tooltipEl.classList.add("side-right");
            }
          } else {
            tipLeft = rect.left + (rect.width / 2) - (tipWidth / 2);
            tipTop = rect.bottom + 6;
          }

          if (tipLeft < pad) {
            tipLeft = pad;
          } else if (tipLeft + tipWidth > viewWidth - pad) {
            tipLeft = Math.max(pad, viewWidth - tipWidth - pad);
          }

          if (tipTop < pad) {
            tipTop = pad;
          } else if (tipTop + tipHeight > viewHeight - pad) {
            tipTop = Math.max(pad, viewHeight - tipHeight - pad);
          }

          tooltipEl.style.left = Math.round(tipLeft) + "px";
          tooltipEl.style.top = Math.round(tipTop) + "px";
          tooltipEl.style.transform = "none";
          tooltipEl.style.visibility = "visible";
        }, 90);
      });
      el.addEventListener("mouseleave", () => {
        clearTimeout(timer);
        if (tooltipEl) tooltipEl.classList.remove("visible");
      });
      el.addEventListener("click", () => {
        clearTimeout(timer);
        if (tooltipEl) tooltipEl.classList.remove("visible");
      });
    }

    function applyViewOptions() {
      if (typeof document !== "undefined" && document.body) {
        document.body.classList.toggle("hide-col-author", !colAuthor);
        document.body.classList.toggle("hide-col-date", !colDate);
        document.body.classList.toggle("show-col-hash", colHash);
        document.body.classList.toggle("compact-refs", viewCompactRefs);
        document.body.classList.toggle("refs-on-left", viewRefsOnLeft);
        document.body.classList.toggle("hl-my-commits", hlMyCommits);
        document.body.classList.toggle("hl-merge-commits", hlMergeCommits);
        document.body.classList.toggle("hl-current-branch", hlCurrentBranch);
      }
    }
    applyViewOptions();

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
      updateLabels();
    }

    function createMenuItem(label, isChecked, onClick, hasSubmenu = false) {
      const item = document.createElement("div");
      item.className = "as-menu-item" + (hasSubmenu ? " has-submenu" : "");
      
      const checkSpan = document.createElement("span");
      checkSpan.className = "as-menu-check";
      if (isChecked) {
        checkSpan.innerHTML = '<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z"/></svg>';
      }
      item.appendChild(checkSpan);

      const labelSpan = document.createElement("span");
      labelSpan.className = "as-menu-label";
      labelSpan.textContent = label;
      item.appendChild(labelSpan);

      if (hasSubmenu) {
        const arrowSpan = document.createElement("span");
        arrowSpan.className = "as-menu-arrow";
        arrowSpan.innerHTML = "›";
        item.appendChild(arrowSpan);
      }

      item.addEventListener("click", (e) => {
        e.stopPropagation();
        onClick(e);
      });

      return item;
    }

    function createSectionHeader(title) {
      const hdr = document.createElement("div");
      hdr.className = "as-menu-section-header";
      hdr.textContent = title;
      return hdr;
    }

    function createDivider() {
      const d = document.createElement("div");
      d.className = "as-menu-divider";
      return d;
    }

    // 1. Search Box with Q icon and .* Cc options
    const searchBox = document.createElement("div");
    searchBox.className = "as-search-box";
    searchBox.innerHTML = '<span class="as-search-icon" title="Search commits"><svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" style="display:block;"><circle cx="6.5" cy="6.5" r="4.5"/><line x1="10" y1="10" x2="14.5" y2="14.5"/></svg></span>';
    const searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.className = "as-search-input";
    searchInput.placeholder = "Text or hash";
    let searchDebounceTimer;
    searchInput.addEventListener("input", () => {
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => {
        const val = searchInput.value.trim();
        if (val !== curQuery) {
          curQuery = val;
          applyFilter();
        }
      }, 300);
    });
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        clearTimeout(searchDebounceTimer);
        curQuery = searchInput.value.trim();
        applyFilter();
      }
    });
    searchBox.appendChild(searchInput);

    const regexBtn = document.createElement("span");
    regexBtn.className = "as-search-opt";
    regexBtn.textContent = ".*";
    regexBtn.title = "Regex";
    regexBtn.addEventListener("click", () => {
      isRegex = !isRegex;
      regexBtn.className = "as-search-opt" + (isRegex ? " active" : "");
    });
    searchBox.appendChild(regexBtn);

    const caseBtn = document.createElement("span");
    caseBtn.className = "as-search-opt";
    caseBtn.textContent = "Cc";
    caseBtn.title = "Match Case";
    caseBtn.addEventListener("click", () => {
      isCase = !isCase;
      caseBtn.className = "as-search-opt" + (isCase ? " active" : "");
    });
    searchBox.appendChild(caseBtn);

    bar.appendChild(searchBox);

    function closeAllPopups() {
      branchPopup.style.display = "none";
      userPopup.style.display = "none";
      datePopup.style.display = "none";
      pathPopup.style.display = "none";
      if (graphOptionPopup) graphOptionPopup.style.display = "none";
      if (viewOptionPopup) viewOptionPopup.style.display = "none";
    }

    // 2. Branch Dropdown
    const branchContainer = document.createElement("div");
    branchContainer.style.position = "relative";
    const branchLabel = document.createElement("div");
    branchLabel.className = "as-filter-label";
    branchContainer.appendChild(branchLabel);

    const branchPopup = document.createElement("div");
    branchPopup.className = "filter-popup";
    branchPopup.innerHTML = '<div class="filter-popup-search"><input type="text" placeholder="Search branch..." /></div><div class="branch-popup-items" style="overflow-y:auto;flex:1;"></div>';
    branchContainer.appendChild(branchPopup);
    const branchSearchInput = branchPopup.querySelector("input");
    const branchItemsContainer = branchPopup.querySelector(".branch-popup-items");

    branchSearchInput.addEventListener("input", () => {
      renderBranchItems(branchSearchInput.value.toLowerCase());
    });

    function renderBranchItems(search = "") {
      branchItemsContainer.innerHTML = "";
      const bData = branchData || { branches: [], currentBranch: "" };
      const branches = bData.branches || [];

      const allItem = document.createElement("div");
      allItem.className = "filter-popup-item" + (!curBranch ? " selected" : "");
      allItem.textContent = "All Branches";
      allItem.addEventListener("click", () => {
        curBranch = "";
        if (setActiveBranch) setActiveBranch("");
        closeAllPopups();
        applyFilter();
      });
      branchItemsContainer.appendChild(allItem);

      if (bData.currentBranch && (!search || bData.currentBranch.toLowerCase().includes(search))) {
        const headItem = document.createElement("div");
        headItem.className = "filter-popup-item" + (curBranch === "HEAD" ? " selected" : "");
        headItem.innerHTML = '<span>HEAD (' + bData.currentBranch + ')</span>';
        headItem.addEventListener("click", () => {
          curBranch = "HEAD";
          if (setActiveBranch) setActiveBranch("HEAD");
          closeAllPopups();
          applyFilter();
        });
        branchItemsContainer.appendChild(headItem);
      }

      const localList = branches.filter(b => !b.remote && (!search || b.name.toLowerCase().includes(search)));
      if (localList.length > 0) {
        const hdr = document.createElement("div");
        hdr.className = "filter-popup-header";
        hdr.textContent = "Local";
        branchItemsContainer.appendChild(hdr);
        for (const b of localList) {
          const item = document.createElement("div");
          item.className = "filter-popup-item" + (curBranch === b.name ? " selected" : "");
          item.textContent = b.name;
          item.addEventListener("click", () => {
            curBranch = b.name;
            if (setActiveBranch) setActiveBranch(b.name);
            closeAllPopups();
            applyFilter();
          });
          branchItemsContainer.appendChild(item);
        }
      }

      const remoteList = branches.filter(b => b.remote && (!search || b.name.toLowerCase().includes(search)));
      if (remoteList.length > 0) {
        const hdr = document.createElement("div");
        hdr.className = "filter-popup-header";
        hdr.textContent = "Remote";
        branchItemsContainer.appendChild(hdr);
        for (const b of remoteList) {
          const item = document.createElement("div");
          item.className = "filter-popup-item" + (curBranch === b.name ? " selected" : "");
          item.textContent = b.name;
          item.addEventListener("click", () => {
            curBranch = b.name;
            if (setActiveBranch) setActiveBranch(b.name);
            closeAllPopups();
            applyFilter();
          });
          branchItemsContainer.appendChild(item);
        }
      }
    }

    branchLabel.addEventListener("click", (e) => {
      e.stopPropagation();
      if (branchPopup && !branchContainer.contains(branchPopup)) {
        branchContainer.appendChild(branchPopup);
      }
      const open = branchPopup.style.display === "flex";
      closeAllPopups();
      if (!open) {
        renderBranchItems();
        branchPopup.style.display = "flex";
        setTimeout(() => branchSearchInput.focus(), 20);
      }
    });

    bar.appendChild(branchContainer);

    // 3. User Dropdown
    const userContainer = document.createElement("div");
    userContainer.style.position = "relative";
    const userLabel = document.createElement("div");
    userLabel.className = "as-filter-label";
    userContainer.appendChild(userLabel);

    const userPopup = document.createElement("div");
    userPopup.className = "filter-popup";
    userPopup.innerHTML = '<div class="filter-popup-search"><input type="text" placeholder="Type user name or email..." /></div><div class="user-popup-items" style="overflow-y:auto;flex:1;"></div>';
    userContainer.appendChild(userPopup);
    const userSearchInput = userPopup.querySelector("input");
    const userItemsContainer = userPopup.querySelector(".user-popup-items");

    userSearchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && userSearchInput.value.trim()) {
        curUser = userSearchInput.value.trim();
        closeAllPopups();
        applyFilter();
      }
    });
    userSearchInput.addEventListener("input", () => {
      renderUserItems(userSearchInput.value.toLowerCase());
    });

    function renderUserItems(search = "") {
      userItemsContainer.innerHTML = "";
      const allItem = document.createElement("div");
      allItem.className = "filter-popup-item" + (!curUser ? " selected" : "");
      allItem.textContent = "All Users";
      allItem.addEventListener("click", () => {
        curUser = "";
        closeAllPopups();
        applyFilter();
      });
      userItemsContainer.appendChild(allItem);

      const commitsList = commits || [];
      const authorCounts = {};
      for (const c of commitsList) {
        if (c.author) authorCounts[c.author] = (authorCounts[c.author] || 0) + 1;
      }
      const authorNames = Object.keys(authorCounts).sort();
      const filtered = authorNames.filter(name => !search || name.toLowerCase().includes(search));

      if (filtered.length > 0) {
        const hdr = document.createElement("div");
        hdr.className = "filter-popup-header";
        hdr.textContent = "Authors in repo";
        userItemsContainer.appendChild(hdr);

        for (const name of filtered) {
          const item = document.createElement("div");
          item.className = "filter-popup-item" + (curUser === name ? " selected" : "");
          item.innerHTML = '<span>' + name + '</span> <span style="opacity:0.6;font-size:11px;">(' + authorCounts[name] + ')</span>';
          item.addEventListener("click", () => {
            curUser = name;
            closeAllPopups();
            applyFilter();
          });
          userItemsContainer.appendChild(item);
        }
      }
    }

    userLabel.addEventListener("click", (e) => {
      e.stopPropagation();
      if (userPopup && !userContainer.contains(userPopup)) {
        userContainer.appendChild(userPopup);
      }
      const open = userPopup.style.display === "flex";
      closeAllPopups();
      if (!open) {
        renderUserItems();
        userPopup.style.display = "flex";
        setTimeout(() => userSearchInput.focus(), 20);
      }
    });

    bar.appendChild(userContainer);

    // 4. Date Dropdown
    const dateContainer = document.createElement("div");
    dateContainer.style.position = "relative";
    const dateLabel = document.createElement("div");
    dateLabel.className = "as-filter-label";
    dateContainer.appendChild(dateLabel);

    const datePopup = document.createElement("div");
    datePopup.className = "filter-popup";
    const dateOptions = [
      { label: "All", key: "" },
      { label: "Today", key: "today" },
      { label: "Yesterday", key: "yesterday" },
      { label: "Last 7 Days", key: "7days" },
      { label: "Last 30 Days", key: "30days" }
    ];
    for (const opt of dateOptions) {
      const item = document.createElement("div");
      item.className = "filter-popup-item";
      item.textContent = opt.label;
      item.addEventListener("click", () => {
        if (!opt.key) {
          curDate = "";
          curAfter = "";
          curBefore = "";
        } else if (opt.key === "today") {
          curDate = "Today";
          const now = new Date();
          now.setHours(0, 0, 0, 0);
          curAfter = now.toISOString();
          curBefore = "";
        } else if (opt.key === "yesterday") {
          curDate = "Yesterday";
          const now = new Date();
          now.setHours(0, 0, 0, 0);
          const y = new Date(now.getTime() - 86400000);
          curAfter = y.toISOString();
          curBefore = now.toISOString();
        } else if (opt.key === "7days") {
          curDate = "Last 7 Days";
          curAfter = new Date(Date.now() - 7 * 86400000).toISOString();
          curBefore = "";
        } else if (opt.key === "30days") {
          curDate = "Last 30 Days";
          curAfter = new Date(Date.now() - 30 * 86400000).toISOString();
          curBefore = "";
        }
        closeAllPopups();
        applyFilter();
      });
      datePopup.appendChild(item);
    }
    const divdr = document.createElement("div");
    divdr.className = "filter-popup-divider";
    datePopup.appendChild(divdr);

    const customDateBox = document.createElement("div");
    customDateBox.className = "filter-custom-date";
    customDateBox.innerHTML = '<label>Custom Range:</label><input type="date" id="c-after" /><input type="date" id="c-before" /><button class="filter-apply-btn">Apply</button>';
    const cAfter = customDateBox.querySelector("#c-after");
    const cBefore = customDateBox.querySelector("#c-before");
    const cApply = customDateBox.querySelector("button");
    cApply.addEventListener("click", () => {
      if (cAfter.value || cBefore.value) {
        curDate = (cAfter.value || "...") + " - " + (cBefore.value || "...");
        curAfter = cAfter.value ? new Date(cAfter.value).toISOString() : "";
        curBefore = cBefore.value ? new Date(cBefore.value).toISOString() : "";
      } else {
        curDate = "";
        curAfter = "";
        curBefore = "";
      }
      closeAllPopups();
      applyFilter();
    });
    datePopup.appendChild(customDateBox);
    dateContainer.appendChild(datePopup);

    dateLabel.addEventListener("click", (e) => {
      e.stopPropagation();
      if (datePopup && !dateContainer.contains(datePopup)) {
        dateContainer.appendChild(datePopup);
      }
      const open = datePopup.style.display === "flex";
      closeAllPopups();
      if (!open) {
        datePopup.style.display = "flex";
      }
    });

    bar.appendChild(dateContainer);

    // 5. Path Dropdown (>)
    const pathContainer = document.createElement("div");
    pathContainer.style.position = "relative";
    const pathLabel = document.createElement("div");
    pathLabel.className = "as-filter-label";
    pathContainer.appendChild(pathLabel);

    const pathPopup = document.createElement("div");
    pathPopup.className = "filter-popup";
    pathPopup.style.padding = "8px 12px";
    pathPopup.innerHTML = '<input type="text" placeholder="e.g. lib/models or file.dart" style="width:100%;box-sizing:border-box;background:var(--vscode-input-background);color:var(--vscode-input-foreground);border:1px solid var(--vscode-input-border, rgba(128,128,128,0.3));border-radius:3px;padding:3px 6px;font-size:11px;outline:none;margin-bottom:6px;" /><button class="filter-apply-btn">Apply</button>';
    const pathInput = pathPopup.querySelector("input");
    const pathBtn = pathPopup.querySelector("button");

    pathBtn.addEventListener("click", () => {
      curPath = pathInput.value.trim();
      closeAllPopups();
      applyFilter();
    });
    pathInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        curPath = pathInput.value.trim();
        closeAllPopups();
        applyFilter();
      }
    });
    pathContainer.appendChild(pathPopup);

    pathLabel.addEventListener("click", (e) => {
      e.stopPropagation();
      if (pathPopup && !pathContainer.contains(pathPopup)) {
        pathContainer.appendChild(pathPopup);
      }
      const open = pathPopup.style.display === "flex";
      closeAllPopups();
      if (!open) {
        pathPopup.style.display = "flex";
        setTimeout(() => pathInput.focus(), 20);
      }
    });

    bar.appendChild(pathContainer);

    // Graph Option Button & Menu (Image 1 & Image 3)
    const graphOptionContainer = document.createElement("div");
    graphOptionContainer.style.position = "relative";
    const graphOptionBtn = document.createElement("div");
    graphOptionBtn.className = "as-filter-label as-tool-icon";
    graphOptionBtn.title = "Graph Options";
    graphOptionBtn.style.padding = "2px 4px";
    graphOptionBtn.innerHTML = `
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
        <line x1="4.5" y1="2.5" x2="4.5" y2="13.5"/>
        <polyline points="2.5,10.5 4.5,13.5 6.5,10.5"/>
        <line x1="11.5" y1="2.5" x2="11.5" y2="13.5"/>
        <polygon points="11.5,3.5 13.5,5.5 11.5,7.5 9.5,5.5" fill="var(--vscode-editor-background, #1e1f22)" stroke="currentColor" stroke-width="1.2"/>
        <polygon points="11.5,8.5 13.5,10.5 11.5,12.5 9.5,10.5" fill="var(--vscode-editor-background, #1e1f22)" stroke="currentColor" stroke-width="1.2"/>
        <polygon points="12,15 15,15 15,12" fill="currentColor" stroke="none"/>
      </svg>
    `;
    graphOptionContainer.appendChild(graphOptionBtn);

    graphOptionPopup = document.createElement("div");
    graphOptionPopup.className = "as-dropdown-menu";
    graphOptionPopup.setAttribute("data-vscode-context", JSON.stringify({ preventDefaultContextMenuItems: true }));
    graphOptionContainer.appendChild(graphOptionPopup);

    function renderGraphOptionMenu() {
      graphOptionPopup.innerHTML = "";

      // Section 1: Sort
      graphOptionPopup.appendChild(createSectionHeader("Sort"));
      graphOptionPopup.appendChild(createMenuItem("By Commit Date", sortMode === "date", () => {
        sortMode = "date";
        renderGraphOptionMenu();
        applyFilter();
      }));
      graphOptionPopup.appendChild(createMenuItem("Topologically", sortMode === "topo", () => {
        sortMode = "topo";
        renderGraphOptionMenu();
        applyFilter();
      }));

      graphOptionPopup.appendChild(createDivider());

      // Section 2: Options
      graphOptionPopup.appendChild(createSectionHeader("Options"));
      graphOptionPopup.appendChild(createMenuItem("First Parent", isFirstParent, () => {
        isFirstParent = !isFirstParent;
        renderGraphOptionMenu();
        applyFilter();
      }));
      graphOptionPopup.appendChild(createMenuItem("No Merges", isNoMerges, () => {
        isNoMerges = !isNoMerges;
        renderGraphOptionMenu();
        applyFilter();
      }));

      graphOptionPopup.appendChild(createDivider());

      // Section 3: Branch Actions
      graphOptionPopup.appendChild(createSectionHeader("Branch Actions"));
      graphOptionPopup.appendChild(createMenuItem("Collapse Linear Branches", false, () => {
        closeAllPopups();
        postMessage("collapseLinearBranches");
        showToast("Collapsed linear branches");
      }));
      graphOptionPopup.appendChild(createMenuItem("Expand Linear Branches", false, () => {
        closeAllPopups();
        postMessage("expandLinearBranches");
        showToast("Expanded linear branches");
      }));
    }

    graphOptionBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (graphOptionPopup && !graphOptionContainer.contains(graphOptionPopup)) {
        graphOptionContainer.appendChild(graphOptionPopup);
      }
      const open = graphOptionPopup.style.display === "flex";
      closeAllPopups();
      if (!open) {
        renderGraphOptionMenu();
        graphOptionPopup.style.display = "flex";
      }
    });

    bar.appendChild(graphOptionContainer);

    // 6. Right toolbar actions (Refresh, Cherry-Pick, View Options, Search)
    const tbRight = document.createElement("div");
    tbRight.className = "as-toolbar-right";

    // 1. Refresh
    const btnRefresh = document.createElement("span");
    btnRefresh.className = "as-tool-icon";
    btnRefresh.title = "Refresh";
    btnRefresh.innerHTML = `
      <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" style="display:block;">
        <path fill-rule="evenodd" d="M12.5747152,11.8852806 C11.4741474,13.1817355 9.83247882,14.0044386 7.99865879,14.0044386 C5.03907292,14.0044386 2.57997332,11.8615894 2.08820756,9.0427473 L3.94774327,9.10768372 C4.43372186,10.8898575 6.06393114,12.2000519 8.00015362,12.2000519 C9.30149237,12.2000519 10.4645985,11.6082097 11.2349873,10.6790094 L9.05000019,8.71167959 L14.0431479,8.44999981 L14.3048222,13.4430431 L12.5747152,11.8852806 Z M3.42785637,4.11741586 C4.52839138,2.82452748 6.16775464,2.00443857 7.99865879,2.00443857 C10.918604,2.00443857 13.3513802,4.09026967 13.8882946,6.8532307 L12.0226389,6.78808057 C11.5024872,5.05935553 9.89838095,3.8000774 8.00015362,3.8000774 C6.69867367,3.8000774 5.53545628,4.39204806 4.76506921,5.32142241 L6.95482203,7.29304326 L1.96167436,7.55472304 L1.70000005,2.56167973 L3.42785637,4.11741586 Z" transform="rotate(3 8.002 8.004)"/>
      </svg>
    `;
    btnRefresh.addEventListener("click", () => {
      postMessage("refresh");
    });
    tbRight.appendChild(btnRefresh);

    // 2. Cherry-Pick
    const btnCherry = document.createElement("span");
    btnCherry.className = "as-tool-icon";
    btnCherry.title = "Cherry-Pick Commit";
    btnCherry.innerHTML = `
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style="display:block;">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M6.5 11C6.5 12.1046 5.60457 13 4.5 13C3.39543 13 2.5 12.1046 2.5 11C2.5 9.89543 3.39543 9 4.5 9C5.60457 9 6.5 9.89543 6.5 11ZM4.5 14C6.15685 14 7.5 12.6569 7.5 11C7.5 9.34315 6.15685 8 4.5 8C2.84315 8 1.5 9.34315 1.5 11C1.5 12.6569 2.84315 14 4.5 14ZM13.5 11C13.5 12.1046 12.6046 13 11.5 13C10.3954 13 9.5 12.1046 9.5 11C9.5 9.89543 10.3954 9 11.5 9C12.6046 9 13.5 9.89543 13.5 11ZM11.5 14C13.1569 14 14.5 12.6569 14.5 11C14.5 9.34315 13.1569 8 11.5 8C9.84315 8 8.5 9.34315 8.5 11C8.5 12.6569 9.84315 14 11.5 14Z" fill="currentColor"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M11.8537 1.14647C11.7934 1.08617 11.7216 1.04449 11.6453 1.02143C11.5869 1.00372 11.5244 0.996452 11.46 1.00164L11.4585 1.00175L11.4577 1.00183C8.89299 1.21581 7.10682 2.51359 5.92996 4.03112C4.76214 5.53699 4.18349 7.26955 4.00588 8.424C3.9639 8.69693 4.15111 8.95222 4.42404 8.99421C4.69697 9.0362 4.95227 8.84899 4.99426 8.57606C5.14998 7.56384 5.67133 5.9964 6.72018 4.64394C7.43375 3.72381 8.38624 2.9082 9.6361 2.42686L10.8329 1.87283L10.1507 2.48553C9.63716 3.45813 9.48624 4.482 9.53842 5.42758C9.61459 6.8079 10.1221 8.0385 10.5761 8.76503C10.7225 8.9992 11.031 9.07038 11.2651 8.92403C11.4993 8.77767 11.5705 8.4692 11.4241 8.23503C11.0449 7.62822 10.6024 6.55883 10.5369 5.37248C10.4723 4.20114 10.7737 2.93361 11.8537 1.85358C12.049 1.65832 12.049 1.34174 11.8537 1.14647Z" fill="currentColor"/>
      </svg>
    `;
    btnCherry.addEventListener("click", () => {
      const selHash = selectedHash;
      if (selHash) {
        postMessage("cherryPick", { hash: selHash });
      } else {
        showToast("Select a commit from the log to cherry-pick");
      }
    });
    tbRight.appendChild(btnCherry);

    // 3. View Options
    const viewOptionContainer = document.createElement("div");
    viewOptionContainer.style.position = "relative";
    viewOptionContainer.style.display = "inline-flex";

    const btnViewOption = document.createElement("span");
    btnViewOption.className = "as-tool-icon";
    btnViewOption.title = "View Options";
    btnViewOption.innerHTML = `
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
        <path d="M1.5 8C3 4.5 7 2.8 8 2.8C9 2.8 13 4.5 14.5 8C13 11.5 9 13.2 8 13.2C7 13.2 3 11.5 1.5 8Z"/>
        <circle cx="8" cy="8" r="2.2"/>
        <polygon points="12,15 15,15 15,12" fill="currentColor" stroke="none"/>
      </svg>
    `;
    viewOptionContainer.appendChild(btnViewOption);

    viewOptionPopup = document.createElement("div");
    viewOptionPopup.className = "as-dropdown-menu";
    viewOptionPopup.style.right = "0";
    viewOptionPopup.style.left = "auto";
    viewOptionPopup.setAttribute("data-vscode-context", JSON.stringify({ preventDefaultContextMenuItems: true }));
    viewOptionContainer.appendChild(viewOptionPopup);

    function renderViewOptionMenu() {
      viewOptionPopup.innerHTML = "";

      // Section 1: Show
      viewOptionPopup.appendChild(createSectionHeader("Show"));
      viewOptionPopup.appendChild(createMenuItem("Compact References View", viewCompactRefs, () => {
        viewCompactRefs = !viewCompactRefs;
        applyViewOptions();
        renderViewOptionMenu();
      }));
      viewOptionPopup.appendChild(createMenuItem("Tag Names", viewTagNames, () => {
        viewTagNames = !viewTagNames;
        applyViewOptions();
        renderViewOptionMenu();
      }));
      viewOptionPopup.appendChild(createMenuItem("Long Edges", viewLongEdges, () => {
        viewLongEdges = !viewLongEdges;
        applyViewOptions();
        renderViewOptionMenu();
      }));
      viewOptionPopup.appendChild(createMenuItem("Commit Timestamp", viewCommitTimestamp, () => {
        viewCommitTimestamp = !viewCommitTimestamp;
        applyViewOptions();
        renderViewOptionMenu();
      }));
      viewOptionPopup.appendChild(createMenuItem("References on the Left", viewRefsOnLeft, () => {
        viewRefsOnLeft = !viewRefsOnLeft;
        applyViewOptions();
        renderViewOptionMenu();
      }));

      // Columns Submenu
      const columnsItem = createMenuItem("Columns", false, (ev) => {
        // keep open
      }, true);

      const subMenu = document.createElement("div");
      subMenu.className = "as-dropdown-menu as-submenu";
      subMenu.setAttribute("data-vscode-context", JSON.stringify({ preventDefaultContextMenuItems: true }));

      function renderColumnsSubMenu() {
        subMenu.innerHTML = "";
        subMenu.appendChild(createMenuItem("Author", colAuthor, () => {
          colAuthor = !colAuthor;
          applyViewOptions();
          renderColumnsSubMenu();
        }));
        subMenu.appendChild(createMenuItem("Hash", colHash, () => {
          colHash = !colHash;
          applyViewOptions();
          renderColumnsSubMenu();
        }));
        subMenu.appendChild(createMenuItem("Date", colDate, () => {
          colDate = !colDate;
          applyViewOptions();
          renderColumnsSubMenu();
        }));
        subMenu.appendChild(createMenuItem("GPG Signature", colGpg, () => {
          colGpg = !colGpg;
          applyViewOptions();
          renderColumnsSubMenu();
        }));
      }
      renderColumnsSubMenu();
      columnsItem.addEventListener("mouseenter", () => {
        const rect = columnsItem.getBoundingClientRect();
        if (rect.right + 150 > window.innerWidth) {
          subMenu.style.left = "auto";
          subMenu.style.right = "100%";
          subMenu.style.marginLeft = "0";
          subMenu.style.marginRight = "2px";
        } else {
          subMenu.style.left = "100%";
          subMenu.style.right = "auto";
          subMenu.style.marginLeft = "2px";
          subMenu.style.marginRight = "0";
        }
      });
      columnsItem.appendChild(subMenu);
      viewOptionPopup.appendChild(columnsItem);

      viewOptionPopup.appendChild(createDivider());

      // Section 2: Highlight
      viewOptionPopup.appendChild(createSectionHeader("Highlight"));
      viewOptionPopup.appendChild(createMenuItem("My Commits", hlMyCommits, () => {
        hlMyCommits = !hlMyCommits;
        try { localStorage.setItem("intellij_git_hl_my_commits", hlMyCommits ? "true" : "false"); } catch {}
        applyViewOptions();
        renderViewOptionMenu();
      }));
      viewOptionPopup.appendChild(createMenuItem("Merge Commits", hlMergeCommits, () => {
        hlMergeCommits = !hlMergeCommits;
        try { localStorage.setItem("intellij_git_hl_merge_commits", hlMergeCommits ? "true" : "false"); } catch {}
        applyViewOptions();
        renderViewOptionMenu();
      }));
      viewOptionPopup.appendChild(createMenuItem("Current Branch", hlCurrentBranch, () => {
        hlCurrentBranch = !hlCurrentBranch;
        try { localStorage.setItem("intellij_git_hl_current_branch", hlCurrentBranch ? "true" : "false"); } catch {}
        applyViewOptions();
        renderViewOptionMenu();
      }));
      viewOptionPopup.appendChild(createMenuItem("Not Cherry-Picked Commits", hlNotCherryPicked, () => {
        hlNotCherryPicked = !hlNotCherryPicked;
        applyViewOptions();
        renderViewOptionMenu();
      }));
    }

    btnViewOption.addEventListener("click", (e) => {
      e.stopPropagation();
      if (viewOptionPopup && !viewOptionContainer.contains(viewOptionPopup)) {
        viewOptionContainer.appendChild(viewOptionPopup);
      }
      const open = viewOptionPopup.style.display === "flex";
      closeAllPopups();
      if (!open) {
        renderViewOptionMenu();
        viewOptionPopup.style.display = "flex";
      }
    });
    tbRight.appendChild(viewOptionContainer);

    // 4. Search
    const btnSearch = document.createElement("span");
    btnSearch.className = "as-tool-icon";
    btnSearch.title = "Search Commits (/)";
    btnSearch.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
        <circle cx="6.5" cy="6.5" r="4.5"/>
        <line x1="10" y1="10" x2="14.5" y2="14.5"/>
      </svg>
    `;
    btnSearch.addEventListener("click", () => {
      searchInput.focus();
      searchInput.select();
    });
    tbRight.appendChild(btnSearch);

    bar.appendChild(tbRight);

    attachTooltip(btnRefresh, "Refresh", "Cmd+R", "bottom");
    attachTooltip(btnCherry, "Cherry-Pick Commit", "", "bottom");
    attachTooltip(btnViewOption, "View Options", "", "bottom");
    attachTooltip(btnSearch, "Search Commits", "/", "bottom");
    attachTooltip(graphOptionBtn, "Graph Options", "", "bottom");
    attachTooltip(regexBtn, "Regex", "", "bottom");
    attachTooltip(caseBtn, "Match Case", "", "bottom");
    const asSearchIcon = searchBox.querySelector(".as-search-icon");
    if (asSearchIcon) attachTooltip(asSearchIcon, "Search commits by text or hash", "", "bottom");
    attachTooltip(branchLabel, "Filter by Branch", "", "bottom");
    attachTooltip(userLabel, "Filter by User", "", "bottom");
    attachTooltip(dateLabel, "Filter by Date", "", "bottom");
    attachTooltip(pathLabel, "Filter by Structure / Path", "", "bottom");

    function updateLabels() {
      // Branch Label
      if (curBranch) {
        branchLabel.className = "as-filter-label active";
        branchLabel.innerHTML = '<span class="lbl-prefix">Branch:</span> <span class="lbl-val">' + curBranch + '</span> <span class="lbl-clear" title="Clear">&times;</span>';
        branchLabel.querySelector(".lbl-clear").addEventListener("click", (e) => {
          e.stopPropagation();
          curBranch = "";
          if (setActiveBranch) setActiveBranch("");
          applyFilter();
        });
      } else {
        branchLabel.className = "as-filter-label";
        branchLabel.innerHTML = '<span class="lbl-prefix">Branch</span> <span class="lbl-arrow">&#9662;</span>';
      }

      // User Label
      if (curUser) {
        userLabel.className = "as-filter-label active";
        userLabel.innerHTML = '<span class="lbl-prefix">User:</span> <span class="lbl-val">' + curUser + '</span> <span class="lbl-clear" title="Clear">&times;</span>';
        userLabel.querySelector(".lbl-clear").addEventListener("click", (e) => {
          e.stopPropagation();
          curUser = "";
          applyFilter();
        });
      } else {
        userLabel.className = "as-filter-label";
        userLabel.innerHTML = '<span class="lbl-prefix">User</span> <span class="lbl-arrow">&#9662;</span>';
      }

      // Date Label
      if (curDate) {
        dateLabel.className = "as-filter-label active";
        dateLabel.innerHTML = '<span class="lbl-prefix">Date:</span> <span class="lbl-val">' + curDate + '</span> <span class="lbl-clear" title="Clear">&times;</span>';
        dateLabel.querySelector(".lbl-clear").addEventListener("click", (e) => {
          e.stopPropagation();
          curDate = "";
          curAfter = "";
          curBefore = "";
          applyFilter();
        });
      } else {
        dateLabel.className = "as-filter-label";
        dateLabel.innerHTML = '<span class="lbl-prefix">Date</span> <span class="lbl-arrow">&#9662;</span>';
      }

      // Path Label
      if (curPath) {
        pathLabel.className = "as-filter-label active";
        pathLabel.innerHTML = '<span class="lbl-prefix">Paths:</span> <span class="lbl-val">' + curPath + '</span> <span class="lbl-clear" title="Clear">&times;</span>';
        pathLabel.querySelector(".lbl-clear").addEventListener("click", (e) => {
          e.stopPropagation();
          curPath = "";
          applyFilter();
        });
      } else {
        pathLabel.className = "as-filter-label";
        pathLabel.innerHTML = '<span class="lbl-prefix">Paths</span> <span class="lbl-arrow">&#9662;</span>';
      }
    }
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (branchPopup?.style.display === "flex" && !branchContainer.contains(target)) {
        branchPopup.style.display = "none";
      }
      if (userPopup?.style.display === "flex" && !userContainer.contains(target)) {
        userPopup.style.display = "none";
      }
      if (datePopup?.style.display === "flex" && !dateContainer.contains(target)) {
        datePopup.style.display = "none";
      }
      if (pathPopup?.style.display === "flex" && !pathContainer.contains(target)) {
        pathPopup.style.display = "none";
      }
      if (graphOptionPopup?.style.display === "flex" && !graphOptionContainer.contains(target)) {
        graphOptionPopup.style.display = "none";
      }
      if (viewOptionPopup?.style.display === "flex" && !viewOptionContainer.contains(target)) {
        viewOptionPopup.style.display = "none";
      }
    };
    document.addEventListener("click", onDocClick);

    updateLabelsFn = updateLabels;
    updateLabels();

    return () => {
      document.removeEventListener("click", onDocClick);
    };
  });

  $effect(() => {
    const extBranch = activeBranch;
    if (extBranch !== undefined && extBranch !== curBranch) {
      curBranch = extBranch || "";
      if (updateLabelsFn) updateLabelsFn();
    }
  });
</script>

<div class="filter-bar" bind:this={bar}></div>

<style>
.filter-bar {display:flex;gap:12px;padding:0 12px;background:var(--vscode-editor-background);border-bottom:1px solid var(--vscode-panel-border);align-items:center;height:34px;min-height:34px;box-sizing:border-box;font-size:12px;position:relative;z-index:1000;user-select:none;flex-wrap:nowrap;overflow:visible;}
:global(.as-search-box) {display:flex;align-items:center;background:var(--vscode-input-background, #3c3c3c);border:1px solid rgba(128,128,128,0.25);border-radius:4px;padding:0 6px;height:24px;width:200px;gap:4px;flex-shrink:0;}
:global(.as-search-box:focus-within) {border-color:var(--vscode-focusBorder, #007acc);}
:global(.as-search-input) {background:transparent;border:none;outline:none;color:var(--vscode-input-foreground);font-size:12px;flex:1;min-width:60px;}
:global(.as-search-icon) {color:#8c8c8c;font-size:11px;display:flex;align-items:center;}
:global(.as-search-opt) {font-size:11px;color:#8c8c8c;padding:1px 3px;border-radius:2px;cursor:pointer;user-select:none;font-family:monospace;}
:global(.as-search-opt:hover) {color:#ffffff;background:rgba(255,255,255,0.1);}
:global(.as-search-opt.active) {color:#58a6ff;background:rgba(56,139,253,0.2);}
:global(.as-filter-label) {display:inline-flex;align-items:center;gap:3px;height:24px;padding:0 5px;border-radius:3px;cursor:pointer;font-size:12px;color:#cccccc;position:relative;flex-shrink:0;white-space:nowrap;}
:global(.as-filter-label:hover) {background:rgba(255, 255, 255, 0.08);color:#ffffff;}
:global(.as-filter-label .lbl-prefix) {color:#8c8c8c;}
:global(.as-filter-label .lbl-val) {color:#ffffff;font-weight:500;}
:global(.as-filter-label .lbl-arrow) {font-size:9px;color:#8c8c8c;margin-left:2px;}
:global(.as-filter-label .lbl-clear) {color:#8c8c8c;margin-left:3px;font-size:12px;padding:0 2px;border-radius:50%;line-height:1;}
:global(.as-filter-label .lbl-clear:hover) {color:#ffffff;background:rgba(255,255,255,0.2);}
:global(.as-toolbar-right) {margin-left:auto;display:flex;align-items:center;gap:10px;color:#8c8c8c;}
:global(.as-tool-icon) {cursor:pointer;display:flex;align-items:center;padding:2px 4px;border-radius:3px;}
:global(.as-tool-icon:hover) {color:#ffffff;background:rgba(255,255,255,0.1);}

:global(.filter-popup) {position:absolute;top:calc(100% + 4px);left:0;background:var(--vscode-menu-background, #2b2d30);border:1px solid var(--vscode-menu-border, #393b40);border-radius:6px;box-shadow:0 8px 24px rgba(0, 0, 0, 0.65);min-width:230px;max-width:340px;max-height:360px;overflow-y:auto;z-index:1000;padding:4px;display:none;flex-direction:column;}
:global(.filter-popup-search) {padding:4px 6px 6px;border-bottom:1px solid var(--vscode-menu-border, #393b40);flex-shrink:0;}
:global(.filter-popup-search input) {width:100%;box-sizing:border-box;background:var(--vscode-input-background, #1e1f22);color:var(--vscode-input-foreground, #dfe1e5);border:1px solid var(--vscode-input-border, #4e5157);border-radius:4px;padding:3px 6px;font-size:11px;outline:none;}
:global(.filter-popup-item) {padding:4px 12px;border-radius:4px;display:flex;align-items:center;justify-content:space-between;gap:8px;color:var(--vscode-menu-foreground, #dfe1e5);cursor:pointer;font-size:12px;white-space:nowrap;margin:1px 0;transition:background 0.08s ease, color 0.08s ease;}
:global(.filter-popup-item:hover) {background:var(--vscode-menu-selectionBackground, #2e436e) !important;color:var(--vscode-menu-selectionForeground, #ffffff) !important;}
:global(.filter-popup-item.selected) {font-weight:600;color:var(--vscode-terminal-ansiYellow, #e5a50a);}
:global(.filter-popup-header) {padding:6px 10px 2px;font-size:10px;font-weight:600;color:var(--vscode-descriptionForeground, #7f858e);text-transform:uppercase;letter-spacing:0.5px;}
:global(.filter-popup-divider) {height:1px;background:var(--vscode-menu-separatorBackground, var(--vscode-menu-border, #393b40));margin:4px 0;}
:global(.filter-custom-date) {padding:8px 12px;display:flex;flex-direction:column;gap:6px;}
:global(.filter-custom-date label) {font-size:11px;color:var(--vscode-descriptionForeground, #7f858e);}
:global(.filter-custom-date input) {background:var(--vscode-input-background, #1e1f22);color:var(--vscode-input-foreground, #dfe1e5);border:1px solid var(--vscode-input-border, #4e5157);border-radius:4px;padding:3px 6px;font-size:11px;outline:none;}
:global(.filter-apply-btn) {margin-top:4px;background:var(--vscode-button-background, #2e436e);color:var(--vscode-button-foreground, #ffffff);border:none;border-radius:4px;padding:4px 10px;font-size:11px;cursor:pointer;align-self:flex-end;}
:global(.filter-apply-btn:hover) {background:var(--vscode-button-hoverBackground, #355389);}

:global(.branch-context-menu), :global(.commit-context-menu) {position:fixed;background:var(--vscode-menu-background, #2b2d30);border:1px solid var(--vscode-menu-border, #393b40);border-radius:6px;box-shadow:0 8px 24px rgba(0, 0, 0, 0.65);padding:4px;z-index:2000;min-width:270px;max-height:none;overflow:visible;box-sizing:border-box;font-family:-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;font-size:12px;user-select:none;color:var(--vscode-menu-foreground, #dfe1e5);}
:global(.commit-context-menu::-webkit-scrollbar), :global(.branch-context-menu::-webkit-scrollbar) {width:5px;}
:global(.commit-context-menu::-webkit-scrollbar-thumb), :global(.branch-context-menu::-webkit-scrollbar-thumb) {background:rgba(255, 255, 255, 0.2);border-radius:3px;}
:global(.commit-context-menu::-webkit-scrollbar-thumb:hover), :global(.branch-context-menu::-webkit-scrollbar-thumb:hover) {background:rgba(255, 255, 255, 0.35);}
:global(.bcm-item), :global(.ccm-item) {padding:4px 10px;border-radius:4px;display:flex;align-items:center;justify-content:flex-start;gap:8px;color:var(--vscode-menu-foreground, #dfe1e5);cursor:pointer;white-space:nowrap;margin:1px 0;height:24px;box-sizing:border-box;transition:background 0.08s ease, color 0.08s ease;}
:global(.bcm-item:hover), :global(.ccm-item:hover) {background:var(--vscode-menu-selectionBackground, #2e436e) !important;color:var(--vscode-menu-selectionForeground, #ffffff) !important;}
:global(.bcm-item:hover .bcm-shortcut), :global(.ccm-item:hover .ccm-shortcut) {color:var(--vscode-menu-selectionForeground, #ffffff) !important;opacity:0.95 !important;}
:global(.bcm-item:hover .ccm-icon), :global(.ccm-item:hover .ccm-icon) {color:var(--vscode-menu-selectionForeground, #ffffff) !important;opacity:1 !important;}
:global(.bcm-item:hover span), :global(.ccm-item:hover span), :global(.bcm-item:hover .ccm-label), :global(.ccm-item:hover .ccm-label) {color:var(--vscode-menu-selectionForeground, #ffffff) !important;}
:global(.ccm-item.disabled) {opacity:0.38 !important;cursor:default !important;pointer-events:none !important;}
:global(.ccm-icon) {width:16px;height:16px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;color:inherit;opacity:0.85;}
:global(.ccm-label) {flex:1;text-align:left;color:inherit;}
:global(.bcm-shortcut), :global(.ccm-shortcut) {font-size:11px;color:var(--vscode-descriptionForeground, #8c8c8c);opacity:0.65;margin-left:auto;padding-left:16px;font-family:-apple-system, BlinkMacSystemFont, "Segoe UI", monospace;}
:global(.bcm-divider), :global(.ccm-divider) {height:1px;background:var(--vscode-menu-separatorBackground, var(--vscode-menu-border, #393b40));margin:4px 0;}
:global(.ccm-arrow) {margin-left:auto;font-size:12px;opacity:0.65;}
:global(.has-submenu) {position:relative;}
:global(.ccm-submenu) {display:none;position:absolute;left:100%;top:-4px;margin-left:2px;}
:global(.has-submenu:hover > .ccm-submenu) {display:flex;}

:global(.as-mini-toast) {position:fixed;bottom:24px;right:24px;background:var(--vscode-notifications-background, #2b2d30);color:var(--vscode-notifications-foreground, #dfe1e5);border:1px solid var(--vscode-notifications-border, #393b40);border-radius:6px;padding:8px 14px;font-size:12px;box-shadow:0 4px 16px rgba(0,0,0,0.5);z-index:9999;opacity:0;transform:translateY(8px);transition:all 0.2s ease;pointer-events:none;}
:global(.as-mini-toast.visible) {opacity:1;transform:translateY(0);}

:global(.as-dialog-overlay) {position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.55);display:flex;align-items:center;justify-content:center;z-index:9999;backdrop-filter:blur(1px);}
:global(.as-dialog-card) {background:var(--vscode-editor-background, #1e1f22);border:1px solid var(--vscode-panel-border, #393b40);border-radius:8px;box-shadow:0 16px 48px rgba(0,0,0,0.75);width:560px;max-width:92vw;display:flex;flex-direction:column;color:var(--vscode-editor-foreground, #dfe1e5);font-family:-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;overflow:hidden;box-sizing:border-box;}
:global(.as-dialog-header) {padding:10px 16px;font-size:13px;font-weight:600;background:var(--vscode-titleBar-activeBackground, #2b2d30);border-bottom:1px solid var(--vscode-panel-border, #393b40);display:flex;align-items:center;justify-content:space-between;user-select:none;}
:global(.as-dialog-close) {cursor:pointer;padding:2px 6px;border-radius:4px;opacity:0.7;}
:global(.as-dialog-close:hover) {opacity:1;background:rgba(255,255,255,0.1);}
:global(.as-dialog-body) {padding:14px 16px;display:flex;flex-direction:column;gap:8px;box-sizing:border-box;}
:global(.as-dialog-field-label) {font-size:11px;font-weight:600;color:var(--vscode-descriptionForeground, #8c8c8c);text-transform:uppercase;letter-spacing:0.5px;}
:global(.as-dialog-input) {width:100%;box-sizing:border-box;background:var(--vscode-input-background, #1e1f22);color:var(--vscode-input-foreground, #dfe1e5);border:1px solid var(--vscode-input-border, #4e5157);border-radius:4px;padding:7px 10px;font-size:13px;outline:none;font-family:inherit;}
:global(.as-dialog-input:focus), :global(.as-dialog-textarea:focus) {border-color:var(--vscode-focusBorder, #3574f0);}
:global(.as-dialog-textarea) {width:100%;box-sizing:border-box;background:var(--vscode-input-background, #1e1f22);color:var(--vscode-input-foreground, #dfe1e5);border:1px solid var(--vscode-input-border, #4e5157);border-radius:4px;padding:8px 10px;font-size:12px;min-height:140px;max-height:320px;resize:vertical;outline:none;font-family:inherit;line-height:1.45;}
:global(.as-dialog-footer) {padding:10px 16px;background:var(--vscode-editor-background, #1e1f22);border-top:1px solid var(--vscode-panel-border, #393b40);display:flex;align-items:center;justify-content:flex-end;gap:8px;box-sizing:border-box;}
:global(.as-dialog-btn) {padding:6px 16px;font-size:12px;border-radius:4px;cursor:pointer;border:none;font-weight:500;user-select:none;}
:global(.as-dialog-btn-primary) {background:var(--vscode-button-background, #2e436e);color:var(--vscode-button-foreground, #ffffff);}
:global(.as-dialog-btn-primary:hover) {background:var(--vscode-button-hoverBackground, #355389);}
:global(.as-dialog-btn-secondary) {background:transparent;color:var(--vscode-menu-foreground, #dfe1e5);border:1px solid var(--vscode-panel-border, #4e5157);}
:global(.as-dialog-btn-secondary:hover) {background:rgba(255,255,255,0.08);}

:global(.as-dropdown-menu) {position:absolute;top:calc(100% + 4px);background:var(--vscode-menu-background, #2b2d30);border:1px solid var(--vscode-menu-border, #393b40);border-radius:6px;box-shadow:0 8px 24px rgba(0, 0, 0, 0.65);padding:4px;min-width:215px;max-height:calc(100vh - 46px);overflow-y:auto;z-index:2000;display:none;flex-direction:column;color:var(--vscode-menu-foreground, #dfe1e5);font-family:-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;font-size:12px;user-select:none;box-sizing:border-box;}
:global(.as-menu-section-header) {padding:6px 10px 3px 10px;font-size:11px;font-weight:600;color:var(--vscode-descriptionForeground, #7f858e);text-align:left;}
:global(.as-menu-divider) {height:1px;background:var(--vscode-menu-separatorBackground, var(--vscode-menu-border, #393b40));margin:4px 0;}
:global(.as-menu-item) {display:flex;align-items:center;padding:3px 8px;border-radius:4px;cursor:pointer;height:24px;box-sizing:border-box;color:var(--vscode-menu-foreground, #dfe1e5);white-space:nowrap;position:relative;transition:background 0.08s ease, color 0.08s ease;}
:global(.as-menu-item:hover), :global(.as-menu-item.selected) {background:var(--vscode-menu-selectionBackground, #2e436e) !important;color:var(--vscode-menu-selectionForeground, #ffffff) !important;}
:global(.as-menu-item:hover .as-menu-label), :global(.as-menu-item:hover .as-menu-check), :global(.as-menu-item:hover .as-menu-arrow) {color:var(--vscode-menu-selectionForeground, #ffffff) !important;}
:global(.as-menu-check) {width:18px;min-width:18px;display:inline-flex;align-items:center;justify-content:flex-start;color:inherit;flex-shrink:0;}
:global(.as-menu-label) {flex:1;text-align:left;color:inherit;}
:global(.as-menu-arrow) {margin-left:auto;font-size:13px;opacity:0.7;}
:global(.as-submenu) {display:none;position:absolute;left:100%;top:-4px;margin-left:2px;min-width:140px;}
:global(.has-submenu:hover > .as-submenu) {display:flex;}

:global(body.hide-col-author .author) {display:none !important;}
:global(body.hide-col-date .date) {display:none !important;}
:global(body.show-col-hash .hash) {display:inline-block !important;color:#8c8c8c !important;font-family:var(--vscode-editor-font-family, monospace) !important;font-size:11px !important;user-select:text !important;width:68px !important;min-width:68px !important;}
:global(body.compact-refs .labels) {gap:3px !important;}
:global(body.compact-refs .label) {padding:0 3px !important;font-size:0.76em !important;}
:global(body.refs-on-left .labels) {order:0 !important;margin-left:0 !important;margin-right:8px !important;}
</style>
