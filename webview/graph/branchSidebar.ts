import {
  postMessage,
  openCreateBranchDialog,
  openRenameBranchDialog,
  openCreateTagDialog
} from "$shared/vscodeApi";

export     function renderSidebarContent(container: HTMLElement, getBranchData: () => any, getActiveBranch: () => string, setActiveBranch: (branch: string) => void) {
      if (!container) return;
      if (container._selectedTreeBranch === undefined) {
        container._selectedTreeBranch = getActiveBranch() || "";
      }
      const data = getBranchData();
      const currentActive = getActiveBranch();
      const { branches = [], tags = [], currentBranch = "" } = data;

      function getFavorites() {
        try {
          const raw = localStorage.getItem("intellij_git_fav_branches");
          if (raw) return new Set(JSON.parse(raw));
        } catch {}
        return new Set(["develop", "main", "master"]);
      }

      function saveFavorites(favSet) {
        try {
          localStorage.setItem("intellij_git_fav_branches", JSON.stringify(Array.from(favSet)));
        } catch {}
      }

      function isBranchFavorite(name) {
        if (!name) return false;
        const favs = getFavorites();
        return favs.has(name);
      }

      function toggleBranchFavorite(name) {
        if (!name) return;
        const favs = getFavorites();
        if (favs.has(name)) {
          favs.delete(name);
        } else {
          favs.add(name);
        }
        saveFavorites(favs);
      }

      const getCurrentBranchName = () => (getBranchData() && getBranchData().currentBranch) || window.__GIT_CURRENT_BRANCH__ || "";

      // Close any open context menu
      function closeBranchContextMenu() {
        const old = document.querySelector(".branch-context-menu");
        if (old) old.remove();
        const oldCommit = document.querySelectorAll(".commit-context-menu");
        oldCommit.forEach(m => m.remove());
      }

      window.addEventListener("blur", closeBranchContextMenu);
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) closeBranchContextMenu();
      });
      window.addEventListener("message", (ev) => {
        if (ev.data?.type === "closeAllMenus") closeBranchContextMenu();
      });

      function showBranchContextMenu(e, branchName) {
        e.preventDefault();
        e.stopPropagation();
        closeBranchContextMenu();

        const isCurrent = (branchName === currentBranch);
        const menu = document.createElement("div");
        menu.className = "branch-context-menu";
        menu.setAttribute("data-vscode-context", JSON.stringify({ preventDefaultContextMenuItems: true }));
        menu.addEventListener("contextmenu", (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
        });

        function addItem(label, shortcut, onClick, disabled = false) {
          const it = document.createElement("div");
          it.className = "bcm-item" + (disabled ? " disabled" : "");
          if (disabled) {
            it.style.pointerEvents = "none";
            it.style.opacity = "0.45";
          }
          it.innerHTML = '<span>' + label + '</span>' + (shortcut ? '<span class="bcm-shortcut">' + shortcut + '</span>' : '');
          it.addEventListener("click", (ev) => {
            if (disabled) return;
            ev.stopPropagation();
            closeBranchContextMenu();
            onClick();
          });
          menu.appendChild(it);
        }

        function addDivider() {
          const d = document.createElement("div");
          d.className = "bcm-divider";
          menu.appendChild(d);
        }

        const branchInfo = branches.find((b) => b.name === branchName);
        const isRemote = branchInfo ? (!!branchInfo.remote || branchName.startsWith("origin/")) : branchName.startsWith("origin/");

        if (isCurrent) {
          addItem("New Branch from '" + branchName + "'...", "", () => {
            openCreateBranchDialog(branchName);
          });
          addItem("Show Diff with Working Tree", "", () => {
            postMessage("showDiff", { branch: branchName });
          });
          addDivider();
          addItem("Update", "", () => {
            showToast("Updating '" + branchName + "'...");
            postMessage("pull", branchName);
          });
          addItem("Push...", "", () => {
            postMessage("push", branchName);
          });
          if (branchInfo && branchInfo.upstream) {
            addItem("Unset Tracked Branch (" + branchInfo.upstream + ")", "", () => {
              showToast("Unsetting tracked branch for '" + branchName + "'...");
              postMessage("unsetUpstream", { branch: branchName });
            });
          }
          addDivider();
          addItem("Rename...", "F2", () => {
            openRenameBranchDialog(branchName);
          });
        } else if (isRemote) {
          addItem("Checkout", "", () => {
            postMessage("checkout", branchName);
          });
          addItem("Fetch Branch", "", () => {
            showToast("Fetching '" + branchName + "'...");
            postMessage("fetchSingleBranch", { branch: branchName });
          });
          const curBranchInfo = currentBranch ? branches.find(b => b.name === currentBranch && !b.remote) : null;
          const isAlreadyTrackingThis = curBranchInfo && curBranchInfo.upstream === branchName;
          if (currentBranch) {
            const trackLabel = "Track into '" + currentBranch + "'" + (isAlreadyTrackingThis ? " (already tracked)" : "");
            addItem(trackLabel, "", () => {
              showToast("Tracking '" + currentBranch + "' -> '" + branchName + "'...");
              postMessage("setUpstream", { branch: currentBranch, upstream: branchName });
            }, isAlreadyTrackingThis);
          }
          addItem("New Branch from '" + branchName + "'...", "", () => {
            openCreateBranchDialog(branchName);
          });
          addItem("Checkout and Rebase onto '" + (currentBranch || "HEAD") + "'", "", () => {
            postMessage("checkoutAndRebase", { branch: branchName, onto: currentBranch });
          });
          addDivider();
          addItem("Compare with '" + (currentBranch || "HEAD") + "'", "", () => {
            postMessage("compareBranch", { branch: branchName, withBranch: currentBranch });
          });
          addItem("Show Diff with Working Tree", "", () => {
            postMessage("showDiff", { branch: branchName });
          });
          addDivider();
          addItem("Rebase '" + (currentBranch || "HEAD") + "' onto '" + branchName + "'", "", () => {
            postMessage("rebase", branchName);
          });
          addItem("Merge '" + branchName + "' into '" + (currentBranch || "HEAD") + "'", "", () => {
            postMessage("mergeBranch", branchName);
          });
          addDivider();
          addItem("Delete Remote Branch...", "", () => {
            postMessage("deleteBranch", branchName);
          });
        } else {
          addItem("Checkout", "", () => {
            postMessage("checkout", branchName);
          });
          addItem("New Branch from '" + branchName + "'...", "", () => {
            openCreateBranchDialog(branchName);
          });
          addItem("Checkout and Rebase onto '" + (currentBranch || "HEAD") + "'", "", () => {
            postMessage("checkoutAndRebase", { branch: branchName, onto: currentBranch });
          });
          addDivider();
          addItem("Compare with '" + (currentBranch || "HEAD") + "'", "", () => {
            postMessage("compareBranch", { branch: branchName, withBranch: currentBranch });
          });
          addItem("Show Diff with Working Tree", "", () => {
            postMessage("showDiff", { branch: branchName });
          });
          addDivider();
          addItem("Rebase '" + (currentBranch || "HEAD") + "' onto '" + branchName + "'", "", () => {
            postMessage("rebase", branchName);
          });
          addItem("Merge '" + branchName + "' into '" + (currentBranch || "HEAD") + "'", "", () => {
            postMessage("mergeBranch", branchName);
          });
          addDivider();
          addItem("Update", "", () => {
            showToast("Updating '" + branchName + "'...");
            postMessage("pull", branchName);
          });
          addItem("Push...", "", () => {
            postMessage("push", branchName);
          });
          if (branchInfo && branchInfo.upstream) {
            addItem("Unset Tracked Branch (" + branchInfo.upstream + ")", "", () => {
              showToast("Unsetting tracked branch for '" + branchName + "'...");
              postMessage("unsetUpstream", { branch: branchName });
            });
          }
          addDivider();
          addItem("Rename...", "F2", () => {
            openRenameBranchDialog(branchName);
          });
          addItem("Delete", "", () => {
            postMessage("deleteBranch", branchName);
          });
        }

        document.body.appendChild(menu);
        let x = e.clientX;
        let y = e.clientY;
        const rect = menu.getBoundingClientRect();
        if (x + rect.width > window.innerWidth - 8) x = Math.max(8, window.innerWidth - rect.width - 8);
        if (y + rect.height > window.innerHeight - 8) {
          const yAbove = e.clientY - rect.height;
          if (yAbove >= 8) {
            y = yAbove;
          } else {
            y = Math.max(4, window.innerHeight - rect.height - 8);
          }
        }
        menu.style.left = Math.max(0, x) + "px";
        menu.style.top = Math.max(0, y) + "px";
      }

      function showGeneralBranchContextMenu(e) {
        e.preventDefault();
        e.stopPropagation();
        closeBranchContextMenu();

        const menu = document.createElement("div");
        menu.className = "branch-context-menu";
        menu.setAttribute("data-vscode-context", JSON.stringify({ preventDefaultContextMenuItems: true }));
        menu.addEventListener("contextmenu", (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
        });

        function addItem(label, shortcut, onClick) {
          const it = document.createElement("div");
          it.className = "bcm-item";
          it.innerHTML = '<span>' + label + '</span>' + (shortcut ? '<span class="bcm-shortcut">' + shortcut + '</span>' : '');
          it.addEventListener("click", (ev) => {
            ev.stopPropagation();
            closeBranchContextMenu();
            onClick();
          });
          menu.appendChild(it);
        }

        addItem("New Branch...", "", () => {
          openCreateBranchDialog(currentBranch || "HEAD");
        });
        addItem("Refresh Branches", "", () => {
          postMessage("refreshBranches");
        });

        document.body.appendChild(menu);
        let x = e.clientX;
        let y = e.clientY;
        const rect = menu.getBoundingClientRect();
        if (x + rect.width > window.innerWidth - 8) x = Math.max(8, window.innerWidth - rect.width - 8);
        if (y + rect.height > window.innerHeight - 8) {
          const yAbove = e.clientY - rect.height;
          if (yAbove >= 8) {
            y = yAbove;
          } else {
            y = Math.max(4, window.innerHeight - rect.height - 8);
          }
        }
        menu.style.left = Math.max(0, x) + "px";
        menu.style.top = Math.max(0, y) + "px";
      }

      // 1. Tooltip system attached to document.body
      let tooltipEl = document.querySelector(".app-tooltip");
      if (!tooltipEl) {
        tooltipEl = document.createElement("div");
        tooltipEl.className = "app-tooltip";
        document.body.appendChild(tooltipEl);
      }

      function updateTooltip(el, text, shortcut = "") {
        el.dataset.tooltip = text;
        if (shortcut) el.dataset.shortcut = shortcut;
        el.title = text + (shortcut ? " (" + shortcut + ")" : "");
      }

      function attachTooltip(el, text, shortcut = "", side = "right") {
        updateTooltip(el, text, shortcut);
        let timer;
        el.addEventListener("mouseenter", () => {
          const currentText = el.dataset.tooltip || el.title;
          const currentShortcut = el.dataset.shortcut || "";
          if (!currentText) return;
          timer = setTimeout(() => {
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
          }, 80);
        });
        el.addEventListener("mouseleave", () => {
          clearTimeout(timer);
          tooltipEl.classList.remove("visible");
        });
        el.addEventListener("click", () => {
          clearTimeout(timer);
          tooltipEl.classList.remove("visible");
        });
      }

      let strip = container.querySelector(".sidebar-strip");
      let mainArea = container.querySelector(".sidebar-main");
      let sInput = container.querySelector(".branch-search-input");
      let treeContent = container.querySelector(".branch-tree-content");

      if (!container._repoFolderStates) {
        container._repoFolderStates = new Map();
      }
      if (!container._sectionCollapseState) {
        container._sectionCollapseState = new Map();
      }
      const sectionCollapseState = container._sectionCollapseState;

      const svgArrowRight = '<svg class="tree-arrow-svg" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="display:block;"><path d="M6 3.5L10.5 8L6 12.5"/></svg>';
      const svgArrowDown = '<svg class="tree-arrow-svg" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="display:block;"><path d="M3.5 6L8 10.5L12.5 6"/></svg>';
      const svgTagIcon = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" style="display:block;color:#dfe1e5;"><path d="M7.707 2.293L1.295 8.705C0.904 9.096 0.904 9.729 1.295 10.119L5.881 14.705C6.271 15.096 6.904 15.096 7.295 14.705L13.707 8.293C13.895 8.105 14 7.851 14 7.586V3C14 2.448 13.552 2 13 2H8.414C8.149 2 7.895 2.105 7.707 2.293Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/><circle cx="10.2" cy="5.8" r="1.3" stroke="currentColor" stroke-width="1.2" fill="none"/></svg>';
      const svgCheckoutYellow = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" style="display:block;"><path fill-rule="evenodd" clip-rule="evenodd" d="M7.70708 2.29289L1.29497 8.705C0.904444 9.09553 0.904444 9.72869 1.29497 10.1192L5.88075 14.705C6.27128 15.0955 6.90444 15.0955 7.29497 14.705L13.7071 8.29289C13.8946 8.10536 14 7.851 14 7.58579V3C14 2.44772 13.5523 2 13 2H8.41418C8.14897 2 7.89461 2.10536 7.70708 2.29289ZM10 8C11.1046 8 12 7.10457 12 6C12 4.89543 11.1046 4 10 4C8.89543 4 8 4.89543 8 6C8 7.10457 8.89543 8 10 8Z" fill="#F2C55C"/></svg>';
      const svgBranchWhite = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" style="display:block;color:#dfe1e5;"><circle cx="4.5" cy="4.5" r="1.8" stroke="currentColor" stroke-width="1.2" fill="none"/><circle cx="10.8" cy="6.2" r="1.8" stroke="currentColor" stroke-width="1.2" fill="none"/><line x1="4.5" y1="6.3" x2="4.5" y2="14" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><path d="M4.5 9.8H9.3C10.13 9.8 10.8 9.13 10.8 8.3V8.0" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>';

      function populateTree(searchQuery) {
        if (!treeContent) return;
        treeContent.innerHTML = "";
        const currentActive = (container._selectedTreeBranch !== undefined && container._selectedTreeBranch !== null) ? container._selectedTreeBranch : (getActiveBranch() || "");
        const latestData = getBranchData() || {};
        const branches = latestData.branches || [];
        const tags = latestData.tags || [];
        const currentBranch = latestData.currentBranch || "";
        const currentRepoKey = latestData.repoPath || window.__GIT_REPO_PATH__ || "default_repo";

        if (!container._repoFolderStates.has(currentRepoKey)) {
          const repoMap = new Map();
          try {
            const raw = localStorage.getItem("intellij_git_folders_" + currentRepoKey);
            if (raw) {
              const parsed = JSON.parse(raw);
              Object.keys(parsed).forEach(k => repoMap.set(k, parsed[k]));
            }
          } catch {}
          container._repoFolderStates.set(currentRepoKey, repoMap);
        }
        const folderCollapseState = container._repoFolderStates.get(currentRepoKey);
        const query = (searchQuery !== undefined ? searchQuery : (sInput ? sInput.value : "")).toLowerCase().trim();
        const filterFn = (name) => {
          if (query && !name.toLowerCase().includes(query)) return false;
          return true;
        };

        function createSec(title, isOpenDefault = true) {
          const sec = document.createElement("div");
          sec.className = "tree-section";
          const hdr = document.createElement("div");
          hdr.className = "tree-section-header";
          const isCollapsed = sectionCollapseState.has(title)
            ? sectionCollapseState.get(title)
            : !isOpenDefault;
          hdr.innerHTML = '<span class="arrow">' + (isCollapsed ? svgArrowRight : svgArrowDown) + '</span> <span style="color:#ffffff;">' + title + '</span>';
          const bdy = document.createElement("div");
          bdy.className = "tree-section-body";
          bdy.style.display = isCollapsed ? "none" : "block";
          hdr.addEventListener("click", (e) => {
            e.stopPropagation();
            const isNowCollapsed = bdy.style.display !== "none";
            bdy.style.display = isNowCollapsed ? "none" : "block";
            const arrow = hdr.querySelector(".arrow");
            if (arrow) arrow.innerHTML = isNowCollapsed ? svgArrowRight : svgArrowDown;
            sectionCollapseState.set(title, isNowCollapsed);
          });
          sec.appendChild(hdr);
          sec.appendChild(bdy);
          return { sec, bdy };
        }

        function selectBranch(name) {
          container._selectedTreeBranch = name;
          if (container._updateStarBtn) {
            container._updateStarBtn();
          }
          populateTree();
        }

        function openBranchLog(name) {
          container._selectedTreeBranch = name;
          setActiveBranch(name);
          onFilter({ branch: name });
          if (container._updateStarBtn) {
            container._updateStarBtn();
          }
          populateTree();
        }

        function getTrackingHtml(b) {
          if (!b) return "";
          let trackHtml = "";
          if (b.behind || b.ahead) {
            trackHtml = '<span class="branch-track" style="margin-left:auto;display:inline-flex;align-items:center;gap:5px;flex-shrink:0;font-size:11px;font-family:var(--vscode-editor-font-family, monospace);">';
            if (b.behind) {
              const behindTxt = "Behind remote by " + b.behind + " commit" + (b.behind > 1 ? "s" : "");
              trackHtml += '<span class="track-badge behind" style="color:#58a6ff;display:inline-flex;align-items:center;gap:1px;cursor:default;" data-tooltip="' + behindTxt + '" title="' + behindTxt + '">↙ ' + b.behind + '</span>';
            }
            if (b.ahead) {
              const aheadTxt = "Ahead of remote by " + b.ahead + " commit" + (b.ahead > 1 ? "s" : "");
              trackHtml += '<span class="track-badge ahead" style="color:#3fb950;display:inline-flex;align-items:center;gap:1px;cursor:default;" data-tooltip="' + aheadTxt + '" title="' + aheadTxt + '">↗ ' + b.ahead + '</span>';
            }
            trackHtml += '</span>';
          }
          return trackHtml;
        }

        if (currentBranch && (!query || currentBranch.toLowerCase().includes(query) || "head (current branch)".includes(query))) {
          const headBox = document.createElement("div");
          headBox.className = "head-branch-box" + (currentActive === "HEAD" ? " active" : "");
          const curInfo = branches.find((b) => b.name === currentBranch);
          headBox.innerHTML = '<span class="head-title" style="display:inline-flex;align-items:center;gap:4px;">HEAD (Current Branch)</span>';
          headBox.title = "HEAD (" + currentBranch + ")";
          headBox.addEventListener("click", () => selectBranch("HEAD"));
          headBox.addEventListener("dblclick", () => openBranchLog("HEAD"));
          headBox.addEventListener("contextmenu", (e) => {
            selectBranch("HEAD");
            showBranchContextMenu(e, currentBranch);
          });
          treeContent.appendChild(headBox);
        }

        function createTreeNode(name = "", fullPath = "") {
          return { name, fullPath, folders: {}, branches: [] };
        }

        function insertBranchIntoTree(root, parts, branchObj) {
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

        function hasCurrentBranchInNode(n) {
          if (!n || !currentBranch) return false;
          if (n.branches && n.branches.some(b => b.name === currentBranch)) return true;
          if (n.folders) {
            for (const k in n.folders) {
              if (hasCurrentBranchInNode(n.folders[k])) return true;
            }
          }
          return false;
        }

        function hasFavoriteInNode(n) {
          if (!n) return false;
          if (n.branches && n.branches.some(b => isBranchFavorite(b.name))) return true;
          if (n.folders) {
            for (const k in n.folders) {
              if (hasFavoriteInNode(n.folders[k])) return true;
            }
          }
          return false;
        }

        function renderTreeLevel(lvlContainer, node, isRemoteTree = false) {
          const hasSiblingFolders = !!(node.folders && Object.keys(node.folders).length > 0);

          function renderBranchItem(b) {
            const item = document.createElement("div");
            item.className = "tree-item" + (currentActive === b.name ? " active" : "") + (b.name === currentBranch ? " current-head" : "");

            const isCur = (b.name === currentBranch);
            const isFav = isBranchFavorite(b.name);
            let icon = '';
            if (isFav) {
              icon = '<span class="tree-item-icon tree-item-star-slot is-fav" title="Favorite" style="cursor:pointer;color:#e5a50a;font-size:14px;line-height:1;display:inline-flex;align-items:center;justify-content:center;">★</span>';
            } else if (isCur) {
              icon = '<span class="tree-item-icon">' + svgCheckoutYellow + '</span>';
            } else {
              icon = '<span class="tree-item-icon">' + svgBranchWhite + '</span>';
            }

            const spacer = hasSiblingFolders ? '<span class="arrow spacer" style="visibility:hidden;pointer-events:none;width:16px;height:16px;min-width:16px;display:inline-flex;flex-shrink:0;"></span>' : '';

            const trackHtml = getTrackingHtml(b);
            item.innerHTML = spacer + icon + '<span class="branch-name" style="' + (isCur ? 'font-weight:600;' : '') + 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + b.leafName + '</span>' + trackHtml;
            item.title = b.name;
            item.addEventListener("click", () => selectBranch(b.name));
            item.addEventListener("dblclick", () => openBranchLog(b.name));
            item.addEventListener("contextmenu", (e) => {
              selectBranch(b.name);
              showBranchContextMenu(e, b.name);
            });

            const starEl = item.querySelector(".tree-item-star-slot");
            if (starEl) {
              starEl.addEventListener("click", (e) => {
                e.stopPropagation();
                toggleBranchFavorite(b.name);
                if (container && container._updateStarBtn) container._updateStarBtn();
                populateTree();
              });
            }
            lvlContainer.appendChild(item);
          }

          function renderFolderItem(fk) {
            const subNode = node.folders[fk];
            const fDiv = document.createElement("div");
            fDiv.className = "tree-folder";

            const fHdr = document.createElement("div");
            fHdr.className = "tree-folder-header";
            const folderIconSvg = '<span class="tree-item-icon"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" style="display:block;"><path d="M8.10584 4.34613L8.25344 4.5H8.46667H13C13.8284 4.5 14.5 5.17157 14.5 6V12.1333C14.5 12.9529 13.932 13.5 13.3667 13.5H2.63333C2.06804 13.5 1.5 12.9529 1.5 12.1333V3.86667C1.5 3.04707 2.06804 2.5 2.63333 2.5H6.1217C6.25792 2.5 6.38824 2.55557 6.48253 2.65387L8.10584 4.34613Z" fill="#43454A" stroke="#FFFFFF" stroke-width="1.1"/></svg></span>';

            const isFolderCollapsed = query ? false : (folderCollapseState.has(subNode.fullPath)
              ? folderCollapseState.get(subNode.fullPath)
              : !hasCurrentBranchInNode(subNode));

            fHdr.innerHTML = '<span class="arrow">' + (isFolderCollapsed ? svgArrowRight : svgArrowDown) + '</span>' + folderIconSvg + '<span class="folder-name" style="color:#ffffff;">' + fk + '</span>';

            const fBdy = document.createElement("div");
            fBdy.className = "tree-folder-body";
            fBdy.style.display = isFolderCollapsed ? "none" : "block";

            fHdr.addEventListener("click", (e) => {
              e.stopPropagation();
              const isNowCollapsed = fBdy.style.display !== "none";
              fBdy.style.display = isNowCollapsed ? "none" : "block";
              const arrow = fHdr.querySelector(".arrow");
              if (arrow) arrow.innerHTML = isNowCollapsed ? svgArrowRight : svgArrowDown;
              folderCollapseState.set(subNode.fullPath, isNowCollapsed);
              try {
                const obj = {};
                folderCollapseState.forEach((val, key) => { obj[key] = val; });
                localStorage.setItem("intellij_git_folders_" + currentRepoKey, JSON.stringify(obj));
              } catch {}
            });

            if (isRemoteTree) {
              fHdr.addEventListener("contextmenu", (e) => {
                e.preventDefault();
                e.stopPropagation();
                closeBranchContextMenu();

                const locals = branches.filter(b => !b.remote && !b.name.startsWith('('));
                const slashIdx = subNode.fullPath.indexOf('/');
                const isRootRemote = slashIdx === -1;
                const remoteName = isRootRemote ? subNode.fullPath : subNode.fullPath.slice(0, slashIdx);
                const folderSubPath = isRootRemote ? "" : subNode.fullPath.slice(slashIdx + 1);

                const targetLocals = isRootRemote
                  ? locals
                  : locals.filter(b => b.name === folderSubPath || b.name.startsWith(folderSubPath + '/'));

                const allTracked = targetLocals.length > 0 && targetLocals.every(b => {
                  const expectedUpstream = remoteName + '/' + b.name;
                  return b.upstream === expectedUpstream;
                });

                const menu = document.createElement("div");
                menu.className = "branch-context-menu";
                menu.setAttribute("data-vscode-context", JSON.stringify({ preventDefaultContextMenuItems: true }));
                menu.addEventListener("contextmenu", (ev) => {
                  ev.preventDefault();
                  ev.stopPropagation();
                });

                if (isRootRemote) {
                  const itFetch = document.createElement("div");
                  itFetch.className = "bcm-item";
                  itFetch.innerHTML = '<span>Fetch \'' + remoteName + '\'</span>';
                  itFetch.addEventListener("click", (ev) => {
                    ev.stopPropagation();
                    closeBranchContextMenu();
                    showToast("Fetching remote '" + remoteName + "'...");
                    postMessage("fetchRemote", { remote: remoteName });
                  });
                  menu.appendChild(itFetch);
                }

                const itAll = document.createElement("div");
                itAll.className = "bcm-item" + (allTracked ? " disabled" : "");
                if (allTracked) {
                  itAll.style.pointerEvents = "none";
                  itAll.style.opacity = "0.45";
                }
                const labelText = isRootRemote
                  ? "Track All Local Branches to '" + remoteName + "'"
                  : "Track '" + subNode.fullPath + "' for '" + folderSubPath + "'";
                itAll.innerHTML = '<span>' + labelText + (allTracked ? ' (already tracked)' : '') + '</span>';
                itAll.addEventListener("click", (ev) => {
                  if (allTracked) return;
                  ev.stopPropagation();
                  closeBranchContextMenu();
                  showToast("Tracking " + (isRootRemote ? "all local branches" : "'" + folderSubPath + "'") + " to '" + remoteName + "'...");
                  postMessage("trackAllBranchesToRemote", { remote: remoteName, prefix: folderSubPath || undefined });
                });
                menu.appendChild(itAll);

                document.body.appendChild(menu);
                let x = e.clientX;
                let y = e.clientY;
                const rect = menu.getBoundingClientRect();
                if (x + rect.width > window.innerWidth - 8) x = Math.max(8, window.innerWidth - rect.width - 8);
                if (y + rect.height > window.innerHeight - 8) {
                  const yAbove = e.clientY - rect.height;
                  if (yAbove >= 8) y = yAbove;
                  else y = Math.max(4, window.innerHeight - rect.height - 8);
                }
                menu.style.left = Math.max(0, x) + "px";
                menu.style.top = Math.max(0, y) + "px";
              });
            }

            fDiv.appendChild(fHdr);
            renderTreeLevel(fBdy, subNode, isRemoteTree);
            fDiv.appendChild(fBdy);
            lvlContainer.appendChild(fDiv);
          }

          // 1. Nhánh đang checkout (HEAD) trực tiếp ưu tiên lên ĐẦU TIÊN (hơn cả favorite)
          const curBranchObj = node.branches.find((b) => b.name === currentBranch);
          if (curBranchObj) {
            renderBranchItem(curBranchObj);
          }

          // 2. Thư mục chứa nhánh đang checkout -> ưu tiên lên đầu (hơn cả favorite)
          const allFolderKeys = Object.keys(node.folders);
          const curFolders = allFolderKeys
            .filter((k) => hasCurrentBranchInNode(node.folders[k]))
            .sort((a, b) => a.localeCompare(b));
          for (const fk of curFolders) {
            renderFolderItem(fk);
          }

          // 3. Tiếp theo là các nhánh Favorite còn lại
          const favBranches = node.branches
            .filter((b) => isBranchFavorite(b.name) && b.name !== currentBranch)
            .sort((a, b) => a.leafName.localeCompare(b.leafName));
          for (const b of favBranches) {
            renderBranchItem(b);
          }

          // 4. Các thư mục chứa nhánh Favorite
          const favFolders = allFolderKeys
            .filter((k) => !hasCurrentBranchInNode(node.folders[k]) && hasFavoriteInNode(node.folders[k]))
            .sort((a, b) => a.localeCompare(b));
          for (const fk of favFolders) {
            renderFolderItem(fk);
          }

          // 5. Các thư mục thường còn lại
          const otherFolders = allFolderKeys
            .filter((k) => !hasCurrentBranchInNode(node.folders[k]) && !hasFavoriteInNode(node.folders[k]))
            .sort((a, b) => a.localeCompare(b));
          for (const fk of otherFolders) {
            renderFolderItem(fk);
          }

          // 6. Các nhánh thường còn lại (không phải checkout, không phải favorite)
          const nonFavBranches = node.branches
            .filter((b) => !isBranchFavorite(b.name) && b.name !== currentBranch)
            .sort((a, b) => a.leafName.localeCompare(b.leafName));
          for (const b of nonFavBranches) {
            renderBranchItem(b);
          }
        }

        const localList = branches.filter((b) => !b.remote && !b.name.startsWith("origin/") && !b.name.startsWith("(") && !b.name.includes("detached") && filterFn(b.name));
        if (localList.length > 0) {
          const localSec = createSec("Local", true);
          const localTree = createTreeNode();
          for (const b of localList) {
            const parts = b.name.split("/");
            insertBranchIntoTree(localTree, parts, b);
          }
          renderTreeLevel(localSec.bdy, localTree);
          treeContent.appendChild(localSec.sec);
        }

        const configuredRemotes = latestData.remotes || [];
        const remoteList = branches.filter((b) => (b.remote || b.name.startsWith("origin/") || configuredRemotes.some(r => b.name.startsWith(r + '/'))) && b.name.includes('/') && !b.name.endsWith('/HEAD')).filter((b) => filterFn(b.name));
        if (remoteList.length > 0) {
          const remoteSec = createSec("Remote", true);
          const remoteTree = createTreeNode();
          for (const b of remoteList) {
            const parts = b.name.split("/");
            insertBranchIntoTree(remoteTree, parts, { ...b, remote: true });
          }
          renderTreeLevel(remoteSec.bdy, remoteTree, true);
          treeContent.appendChild(remoteSec.sec);
        }

        if (tags.length > 0) {
          const tagSec = createSec("Tags", false);
          for (const t of tags.filter((t) => filterFn(t.name))) {
            const item = document.createElement("div");
            item.className = "tree-item" + (currentActive === t.name ? " active" : "");
            item.innerHTML = '<span class="arrow spacer" style="visibility:hidden;pointer-events:none;"></span><span class="tree-item-icon">' + svgTagIcon + '</span><span>' + t.name + '</span>';
            item.addEventListener("click", () => selectBranch(t.name));
            item.addEventListener("dblclick", () => openBranchLog(t.name));
            tagSec.bdy.appendChild(item);
          }
          treeContent.appendChild(tagSec.sec);
        }

        if (localList.length === 0 && remoteList.length === 0 && (!tags || tags.filter(t => filterFn(t.name)).length === 0) && (!currentBranch || !filterFn(currentBranch))) {
          const emptyEl = document.createElement("div");
          emptyEl.style.cssText = "padding:16px 12px;text-align:center;color:var(--vscode-descriptionForeground);font-size:12px;";
          emptyEl.textContent = query ? ('No branches matching "' + query + '"') : "No branches";
          treeContent.appendChild(emptyEl);
        }

        treeContent.querySelectorAll(".track-badge").forEach((badge) => {
          attachTooltip(badge, badge.dataset.tooltip || badge.title || "", "", "bottom");
        });
        if (container._updateStarBtn) container._updateStarBtn();
        if (container._updateExitBtn) container._updateExitBtn();
        container._populateTree = populateTree;
      }

      if (!strip || !mainArea || !sInput || !treeContent) {
        container.innerHTML = "";

        strip = document.createElement("div");
        strip.className = "sidebar-strip";

        function addStripBtn(iconSvg, title, onClick, extraClass = "", shortcut = "") {
          const btn = document.createElement("button");
          btn.className = "sidebar-strip-btn " + extraClass;
          btn.innerHTML = iconSvg;
          attachTooltip(btn, title, shortcut);
          btn.addEventListener("click", (ev) => {
            ev.stopPropagation();
            onClick(btn);
          });
          strip.appendChild(btn);
          return btn;
        }

        const collapseSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>';
        const expandSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>';
        const isCollapsed = container.classList.contains("collapsed");
        const collapseBtn = addStripBtn(isCollapsed ? expandSvg : collapseSvg, isCollapsed ? "Expand Branches" : "Collapse Branches", (btn) => {
          container.classList.toggle("collapsed");
          const coll = container.classList.contains("collapsed");
          btn.innerHTML = coll ? expandSvg : collapseSvg;
          updateTooltip(btn, coll ? "Expand Branches" : "Collapse Branches");
        });

        // New branch (+)
        addStripBtn('<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>', "New Branch...", () => {
          const base = container._selectedTreeBranch || getActiveBranch() || getCurrentBranchName() || "HEAD";
          openCreateBranchDialog(base);
        }, "", "+");

        // Fetch / Update Selected Branch (↙)
        addStripBtn('<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="17" y1="7" x2="7" y2="17"></line><polyline points="17 17 7 17 7 7"></polyline></svg>', "Update Selected Branch", () => {
          const target = container._selectedTreeBranch || getActiveBranch() || getCurrentBranchName();
          if (target) {
            showToast("Updating '" + target + "'...");
            postMessage("pull", target);
          }
        }, "", "Fetch/Pull");

        // Delete Selected Branch (🗑)
        addStripBtn('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>', "Delete Selected Branch", () => {
          const target = container._selectedTreeBranch || getActiveBranch();
          if (target && target !== getCurrentBranchName()) {
            postMessage("deleteBranch", target);
          }
        }, "", "Delete");

        // Compare with Current Branch (⇄)
        addStripBtn('<svg width="15" height="15" viewBox="0 0 16 16" fill="none" style="display:block;"><path fill-rule="evenodd" clip-rule="evenodd" d="M5.85355 8.14645C5.65829 7.95118 5.34171 7.95118 5.14645 8.14645C4.95118 8.34171 4.95118 8.65829 5.14645 8.85355L7.29289 11H0.5C0.223858 11 0 11.2239 0 11.5C0 11.7761 0.223858 12 0.5 12H7.29289L5.14645 14.1464C4.95118 14.3417 4.95118 14.6583 5.14645 14.8536C5.34171 15.0488 5.65829 15.0488 5.85355 14.8536L8.85355 11.8536L9.20711 11.5L8.85355 11.1464L5.85355 8.14645Z" fill="currentColor"/><path fill-rule="evenodd" clip-rule="evenodd" d="M10.1464 1.14645C10.3417 0.951184 10.6583 0.951184 10.8536 1.14645C11.0488 1.34171 11.0488 1.65829 10.8536 1.85355L8.70711 4H15.5C15.7761 4 16 4.22386 16 4.5C16 4.77614 15.7761 5 15.5 5H8.70711L10.8536 7.14645C11.0488 7.34171 11.0488 7.65829 10.8536 7.85355C10.6583 8.04882 10.3417 8.04882 10.1464 7.85355L7.14645 4.85355L6.79289 4.5L7.14645 4.14645L10.1464 1.14645Z" fill="currentColor"/></svg>', "Compare with Current Branch", () => {
          const target = container._selectedTreeBranch || getActiveBranch();
          const cur = getCurrentBranchName();
          if (target) {
            postMessage("compareBranch", { branch: target, withBranch: cur });
          }
        }, "", "Compare");

        // Fetch All Remotes (Android Studio dashed arrow into corner bracket)
        addStripBtn('<svg width="15" height="15" viewBox="0 0 16 16" fill="none" style="display:block;"><path d="M12.8536 3.14645C13.0488 3.34171 13.0488 3.65829 12.8536 3.85355L11.4393 5.26777C11.2441 5.46303 10.9275 5.46303 10.7322 5.26777C10.537 5.0725 10.537 4.75592 10.7322 4.56066L12.1464 3.14645C12.3417 2.95118 12.6583 2.95118 12.8536 3.14645Z" fill="currentColor"/><path d="M10.0251 5.97487C10.2204 6.17014 10.2204 6.48672 10.0251 6.68198L8.61091 8.09619C8.41565 8.29146 8.09907 8.29146 7.90381 8.09619C7.70854 7.90093 7.70854 7.58435 7.90381 7.38909L9.31802 5.97487C9.51328 5.77961 9.82986 5.77961 10.0251 5.97487Z" fill="currentColor"/><path d="M7.1967 8.8033C7.39196 8.99856 7.39196 9.31515 7.1967 9.51041L5.78249 10.9246C5.58722 11.1199 5.27064 11.1199 5.07538 10.9246C4.88012 10.7294 4.88012 10.4128 5.07538 10.2175L6.48959 8.8033C6.68485 8.60804 7.00144 8.60804 7.1967 8.8033Z" fill="currentColor"/><path d="M3.5 5C3.77614 5 4 5.22386 4 5.5V7.5C4 7.77614 3.77614 8 3.5 8C3.22386 8 3 7.77614 3 7.5V5.5C3 5.22386 3.22386 5 3.5 5Z" fill="currentColor"/><path d="M3.5 9C3.77614 9 4 9.22386 4 9.5V12H6.5C6.77614 12 7 12.2239 7 12.5C7 12.7761 6.77614 13 6.5 13H3.5C3.22386 13 3 12.7761 3 12.5V9.5C3 9.22386 3.22386 9 3.5 9Z" fill="currentColor"/><path d="M8 12.5C8 12.2239 8.22386 12 8.5 12H10.5C10.7761 12 11 12.2239 11 12.5C11 12.7761 10.7761 13 10.5 13H8.5C8.22386 13 8 12.7761 8 12.5Z" fill="currentColor"/></svg>', "Fetch All Remotes", () => {
          postMessage("fetchAll");
        }, "", "git fetch --all");

        // Search (Q)
        addStripBtn('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>', "Search Branches", () => {
          if (container.classList.contains("collapsed")) {
            container.classList.remove("collapsed");
            collapseBtn.innerHTML = collapseSvg;
            updateTooltip(collapseBtn, "Collapse Branches");
          }
          if (sInput) {
            sInput.focus();
            sInput.select();
          }
        }, "", "Search");

        // Expand / Collapse all
        addStripBtn('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>', "Expand / Collapse All Folders", () => {
          const bodies = treeContent.querySelectorAll(".tree-section-body, .tree-folder-body");
          let anyOpen = false;
          bodies.forEach(b => { if (b.style.display !== "none") anyOpen = true; });
          const shouldOpen = !anyOpen;
          bodies.forEach(b => { b.style.display = shouldOpen ? "block" : "none"; });
          treeContent.querySelectorAll(".arrow").forEach(a => { a.innerHTML = shouldOpen ? svgArrowDown : svgArrowRight; });
          folderCollapseState.forEach((_, k) => folderCollapseState.set(k, !shouldOpen));
          sectionCollapseState.forEach((_, k) => sectionCollapseState.set(k, !shouldOpen));
        });

        // Favorite / Unfavorite Selected Branch (★)
        const starOutlineSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>';
        const starFilledSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="#e5a50a" stroke="#e5a50a" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>';

        let starBtn = addStripBtn(starOutlineSvg, "Favorite / Unfavorite Selected Branch (★)", () => {
          const sel = container._selectedTreeBranch || getActiveBranch();
          const target = sel === "HEAD" ? getCurrentBranchName() : (sel || getCurrentBranchName());
          if (!target) return;
          toggleBranchFavorite(target);
          updateStarBtn();
          populateTree();
        }, "", "Favorite");

        function updateStarBtn() {
          if (!starBtn) return;
          const sel = container._selectedTreeBranch || getActiveBranch();
          const target = sel === "HEAD" ? getCurrentBranchName() : (sel || getCurrentBranchName());
          const fav = isBranchFavorite(target);
          starBtn.innerHTML = fav ? starFilledSvg : starOutlineSvg;
          starBtn.classList.toggle("active", fav);
          if (target) {
            updateTooltip(starBtn, fav ? ("Remove '" + target + "' from Favorites (★)") : ("Add '" + target + "' to Favorites (★)"));
          } else {
            updateTooltip(starBtn, "Favorite / Unfavorite Selected Branch (★)");
          }
        }
        container._updateStarBtn = updateStarBtn;
        updateStarBtn();

        // Git Remote Credentials / Log In (Outlined Key Icon - Placed at the end)
        const keyOutlinedSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;"><circle cx="7.5" cy="15.5" r="5.5"></circle><path d="m21 2-9.6 9.6"></path><path d="m15.5 7.5 2.5 2.5"></path><path d="m18.5 4.5 2.5 2.5"></path><circle cx="7.5" cy="15.5" r="1.5"></circle></svg>';
        addStripBtn(keyOutlinedSvg, "Git Remote Logins & Credentials", () => {
          postMessage("openAuthDialog");
        }, "", "Git Log In");

        // Exit Sub-repo (Door Icon)
        const exitDoorSvg = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>';
        const exitRepoBtn = addStripBtn(exitDoorSvg, "Exit Repository (Choose Another Repo)", () => {
          postMessage("exitSubRepo");
        }, "exit-subrepo-btn", "Exit");
        exitRepoBtn.style.marginTop = "auto";

        function updateExitBtn() {
          if (!exitRepoBtn) return;
          const latestData = getBranchData() || {};
          const isSub = !!(latestData.isSubRepo || window.__IS_SUB_REPO__);
          exitRepoBtn.style.display = isSub ? "flex" : "none";
        }
        container._updateExitBtn = updateExitBtn;
        updateExitBtn();

        container.appendChild(strip);

        mainArea = document.createElement("div");
        mainArea.className = "sidebar-main";

        const searchBox = document.createElement("div");
        searchBox.className = "branch-search-box";
        sInput = document.createElement("input");
        sInput.type = "text";
        sInput.className = "branch-search-input";
        sInput.placeholder = "Search branches...";
        sInput.addEventListener("input", (e) => {
          if (container._populateTree) {
            container._populateTree(e.target.value);
          } else {
            populateTree(e.target.value);
          }
        });
        searchBox.appendChild(sInput);
        mainArea.appendChild(searchBox);

        treeContent = document.createElement("div");
        treeContent.className = "branch-tree-content";
        treeContent.addEventListener("contextmenu", (e) => {
          const item = e.target.closest(".tree-item, .head-branch-box");
          if (!item) {
            e.preventDefault();
            e.stopPropagation();
            showGeneralBranchContextMenu(e);
          }
        });
        mainArea.appendChild(treeContent);
        mainArea.addEventListener("contextmenu", (e) => {
          const item = e.target.closest(".tree-item, .head-branch-box");
          if (!item) {
            e.preventDefault();
            e.stopPropagation();
            showGeneralBranchContextMenu(e);
          }
        });
        container.appendChild(mainArea);
      }

      populateTree();
    }
