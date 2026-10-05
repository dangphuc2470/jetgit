(function() {
  const vscode = acquireVsCodeApi();

  // State
  let state = {
    activeTab: 'commit', // 'commit' | 'shelf' | 'stash'
    files: [], // { path, name, dir, status, staged, isUntracked }
    changesCount: 0,
    unversionedCount: 0,
    selectedFile: null,
    checkedFiles: new Set(), // paths of checked files
    showDiff: false,
    diffData: null, // { path, diff, hunks }
    commitMessage: '',
    isAmend: false,
    recentMessages: [],
    stashes: [],
    expandChanges: true,
    expandUnversioned: true,
    showPaths: true,
    viewOptionsOpen: false,
    groupBy: 'none',
    groupByDirectory: false,
    groupByModule: false,
    repoName: 'Project',
    expandedFolders: new Set(),
    collapsedFolders: new Set(),
    expandAllFolders: null,
    showIgnoredFiles: false,
    commitOptionsOpen: false,
    recentOpen: false,
    isGeneratingAi: false,
    conflictInfo: null,
    splitRatio: 0.6 // 60% file tree, 40% commit box
  };

  const app = document.getElementById('app');

  // Tooltip system
  let tooltipEl = document.querySelector('.app-tooltip');
  if (!tooltipEl && typeof document !== 'undefined') {
    tooltipEl = document.createElement('div');
    tooltipEl.className = 'app-tooltip';
    document.body.appendChild(tooltipEl);
  }

  function attachTooltip(el, text, shortcut = '', side = 'bottom') {
    if (!el) return;
    el.dataset.tooltip = text;
    if (shortcut) el.dataset.shortcut = shortcut;
    el.title = text + (shortcut ? ` (${shortcut})` : '');

    let timer;
    el.addEventListener('mouseenter', () => {
      const currentText = el.dataset.tooltip || el.title;
      const currentShortcut = el.dataset.shortcut || '';
      if (!currentText) return;

      timer = setTimeout(() => {
        if (!tooltipEl) {
          tooltipEl = document.querySelector('.app-tooltip');
          if (!tooltipEl) {
            tooltipEl = document.createElement('div');
            tooltipEl.className = 'app-tooltip';
            document.body.appendChild(tooltipEl);
          }
        }
        tooltipEl.innerHTML = currentText + (currentShortcut ? `<span class="tooltip-shortcut">${currentShortcut}</span>` : '');

        // Temporarily display offscreen to measure dimensions
        tooltipEl.style.visibility = 'hidden';
        tooltipEl.style.display = 'block';
        tooltipEl.style.left = '-9999px';
        tooltipEl.style.top = '-9999px';
        tooltipEl.style.transform = 'none';
        tooltipEl.classList.add('visible');

        const tipWidth = tooltipEl.offsetWidth || 100;
        const tipHeight = tooltipEl.offsetHeight || 24;
        const rect = el.getBoundingClientRect();
        const pad = 6;
        const viewWidth = window.innerWidth || document.documentElement.clientWidth;
        const viewHeight = window.innerHeight || document.documentElement.clientHeight;

        let tipLeft;
        let tipTop;

        if (side === 'bottom') {
          tipLeft = rect.left + (rect.width / 2) - (tipWidth / 2);
          tipTop = rect.bottom + 6;

          // If overflowing bottom, flip to above the element
          if (tipTop + tipHeight > viewHeight - pad && rect.top - tipHeight - 6 >= pad) {
            tipTop = rect.top - tipHeight - 6;
            tooltipEl.classList.remove('side-bottom');
            tooltipEl.classList.add('side-top');
          } else {
            tooltipEl.classList.remove('side-top');
            tooltipEl.classList.add('side-bottom');
          }
        } else if (side === 'right') {
          tipLeft = rect.right + 7;
          tipTop = rect.top + (rect.height / 2) - (tipHeight / 2);

          // If overflowing right edge, flip to left of element
          if (tipLeft + tipWidth > viewWidth - pad && rect.left - tipWidth - 7 >= pad) {
            tipLeft = rect.left - tipWidth - 7;
            tooltipEl.classList.remove('side-right');
            tooltipEl.classList.add('side-left');
          } else {
            tooltipEl.classList.remove('side-left');
            tooltipEl.classList.add('side-right');
          }
        } else {
          tipLeft = rect.left + (rect.width / 2) - (tipWidth / 2);
          tipTop = rect.bottom + 6;
        }

        // Clamp horizontally so it never overflows left or right boundaries
        if (tipLeft < pad) {
          tipLeft = pad;
        } else if (tipLeft + tipWidth > viewWidth - pad) {
          tipLeft = Math.max(pad, viewWidth - tipWidth - pad);
        }

        // Clamp vertically
        if (tipTop < pad) {
          tipTop = pad;
        } else if (tipTop + tipHeight > viewHeight - pad) {
          tipTop = Math.max(pad, viewHeight - tipHeight - pad);
        }

        tooltipEl.style.left = Math.round(tipLeft) + 'px';
        tooltipEl.style.top = Math.round(tipTop) + 'px';
        tooltipEl.style.transform = 'none';
        tooltipEl.style.visibility = 'visible';
      }, 90);
    });

    el.addEventListener('mouseleave', () => {
      clearTimeout(timer);
      if (tooltipEl) {
        tooltipEl.classList.remove('visible');
        tooltipEl.style.visibility = 'hidden';
      }
    });

    el.addEventListener('click', () => {
      clearTimeout(timer);
      if (tooltipEl) {
        tooltipEl.classList.remove('visible');
        tooltipEl.style.visibility = 'hidden';
      }
    });
  }

  // File type icons
  function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const base = filename.toLowerCase();

    if (ext === 'dart') {
      return '<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M4.5 12L12 4.5L19.5 12L12 19.5L4.5 12Z" stroke="#4fc3f7" stroke-width="2.5" fill="#0288d1"/><circle cx="12" cy="12" r="3" fill="#ffffff"/></svg>';
    }
    if (ext === 'sh' || ext === 'bash') {
      return '<svg width="15" height="15" viewBox="0 0 16 16" fill="#80cbc4"><rect x="1" y="2" width="14" height="12" rx="2" fill="#263238" stroke="#80cbc4" stroke-width="1.2"/><path d="M4 6L6.5 8L4 10" stroke="#80cbc4" stroke-width="1.2" stroke-linecap="round"/><line x1="8" y1="10" x2="11" y2="10" stroke="#80cbc4" stroke-width="1.2"/></svg>';
    }
    if (base === 'fastfile' || base === 'podfile' || base === 'gemfile' || base.endsWith('.lock')) {
      return '<svg width="15" height="15" viewBox="0 0 16 16" fill="#e57373"><path d="M8 2L13 6L8 14L3 6L8 2Z" stroke="#ef5350" stroke-width="1.2" fill="#c62828"/></svg>';
    }
    if (ext === 'pbxproj' || ext === 'xcscheme' || ext === 'xcworkspacedata') {
      return '<svg width="15" height="15" viewBox="0 0 16 16" fill="#64b5f6"><rect x="2" y="2" width="12" height="12" rx="2" fill="#1565c0"/><path d="M5 8H11M8 5V11" stroke="#ffffff" stroke-width="1.5"/></svg>';
    }
    if (ext === 'yaml' || ext === 'yml') {
      return '<svg width="15" height="15" viewBox="0 0 16 16" fill="#ffb74d"><rect x="2" y="2" width="12" height="12" rx="2" fill="#ef6c00"/><text x="4" y="11" fill="#ffffff" font-size="8" font-weight="bold">Y</text></svg>';
    }
    if (ext === 'json') {
      return '<svg width="15" height="15" viewBox="0 0 16 16" fill="#ce93d8"><text x="2" y="12" fill="#ab47bc" font-size="12" font-weight="bold">{ }</text></svg>';
    }
    if (ext === 'der' || ext === 'cer' || ext === 'crt' || ext === 'pem') {
      return '<svg width="15" height="15" viewBox="0 0 16 16" fill="#ffd54f"><rect x="3" y="2" width="10" height="12" rx="1" fill="#f57f17"/><circle cx="8" cy="8" r="2" fill="#ffffff"/></svg>';
    }
    // Default file icon
    return '<svg width="15" height="15" viewBox="0 0 16 16" fill="#90a4ae"><path d="M3 2h7l3 3v9H3V2z" fill="#37474f" stroke="#78909c" stroke-width="1.2"/><path d="M10 2v3h3" fill="none" stroke="#78909c" stroke-width="1.2"/></svg>';
  }

  // Parse diff into hunks with lines and change blocks
  function parseDiff(rawDiff, filePath) {
    if (!rawDiff || !rawDiff.trim()) return [];
    const lines = rawDiff.split('\n');
    const hunks = [];
    let currentHunk = null;
    let oldLine = 0;
    let newLine = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('@@')) {
        let hunkOldStart = 1;
        let hunkNewStart = 1;
        const match = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
        if (match) {
          oldLine = parseInt(match[1], 10);
          newLine = parseInt(match[2], 10);
          hunkOldStart = oldLine;
          hunkNewStart = newLine;
        }
        currentHunk = {
          header: line,
          oldStart: hunkOldStart,
          newStart: hunkNewStart,
          lines: [],
          rawLines: [line],
          staged: true,
          blocks: []
        };
        hunks.push(currentHunk);
      } else if (currentHunk) {
        currentHunk.rawLines.push(line);
        if (line.startsWith('+')) {
          currentHunk.lines.push({
            type: 'add',
            oldNum: '',
            newNum: newLine++,
            text: line.slice(1),
            raw: line,
            staged: true
          });
        } else if (line.startsWith('-')) {
          currentHunk.lines.push({
            type: 'del',
            oldNum: oldLine++,
            newNum: '',
            text: line.slice(1),
            raw: line,
            staged: true
          });
        } else {
          currentHunk.lines.push({
            type: 'ctx',
            oldNum: oldLine++,
            newNum: newLine++,
            text: line.startsWith(' ') ? line.slice(1) : line,
            raw: line,
            staged: true
          });
        }
      }
    }

    // Group contiguous changed lines into change blocks
    hunks.forEach(hunk => {
      let currentBlock = null;
      hunk.lines.forEach((l, idx) => {
        if (l.type === 'add' || l.type === 'del') {
          if (!currentBlock) {
            currentBlock = {
              id: hunk.blocks.length,
              startIndex: idx,
              endIndex: idx,
              lines: [l],
              staged: true
            };
            hunk.blocks.push(currentBlock);
          } else {
            currentBlock.endIndex = idx;
            currentBlock.lines.push(l);
          }
          l.block = currentBlock;
          l.isBlockStart = (currentBlock.startIndex === idx);
        } else {
          currentBlock = null;
          l.isBlockStart = false;
          l.block = null;
        }
      });
    });

    return hunks;
  }

  // Render main UI
  function render() {
    app.innerHTML = '';

    // Root container
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
      let stashItems = state.stashes.map(s => `
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

    // 2. Conflict Banner Bar (Separate dedicated line on top)
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

    // 3. Body: Split into Left (File Tree + Commit Box) and Optional Right (Diff Viewer)
    const mainBody = document.createElement('div');
    mainBody.className = `commit-body ${state.showDiff ? 'with-diff' : ''}`;

    // Left Panel
    const leftPanel = document.createElement('div');
    leftPanel.className = 'commit-left-panel';

    // File Tree Container
    const treeContainer = document.createElement('div');
    treeContainer.className = 'file-tree-container';
    treeContainer.style.flex = `${state.splitRatio}`;

    // Render Changes group (sorted A-Z)
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
      'checkAllChanges'
    );
    treeContainer.appendChild(changesGroup);

    // Render Unversioned group (guarded by showIgnoredFiles)
    if (state.showIgnoredFiles !== false) {
      const unversionedGroup = renderFileGroup(
        'Unversioned Files',
        unversionedFiles,
        state.expandUnversioned,
        'toggleUnversioned',
        'checkAllUnversioned'
      );
      treeContainer.appendChild(unversionedGroup);
    }

    leftPanel.appendChild(treeContainer);

    // Horizontal Splitter between file list and commit box
    const hSplitter = document.createElement('div');
    hSplitter.className = 'h-splitter';
    hSplitter.innerHTML = `<div class="splitter-line"></div>`;
    attachHSplitter(hSplitter, treeContainer, leftPanel);
    leftPanel.appendChild(hSplitter);

    // Commit Message & Actions Box
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

    // Right Panel: Diff & Line-by-Line Reviewer (if showDiff is true)
    if (state.showDiff) {
      const rightPanel = document.createElement('div');
      rightPanel.className = 'commit-right-panel';
      rightPanel.appendChild(renderDiffViewer());
      mainBody.appendChild(rightPanel);
    }

    container.appendChild(mainBody);
    app.appendChild(container);

    // Attach all event listeners
    attachTabEvents(container);
    attachToolbarEvents(toolbar, container);
    attachTreeEvents(treeContainer);
    attachCommitBoxEvents(commitBox);

    // Auto attach tooltips to all elements with data-tooltip or title
    container.querySelectorAll('[data-tooltip], [title]').forEach(el => {
      const tip = el.dataset.tooltip || el.getAttribute('title');
      const sc = el.dataset.shortcut || '';
      if (tip) {
        attachTooltip(el, tip, sc, 'bottom');
      }
    });
  }

  // Folder expansion helpers
  function isFolderExpanded(folderPath, isModule) {
    if (state.expandAllFolders === true) {
      return !state.collapsedFolders.has(folderPath);
    }
    if (state.expandAllFolders === false) {
      return state.expandedFolders.has(folderPath);
    }
    if (state.collapsedFolders.has(folderPath)) return false;
    if (state.expandedFolders.has(folderPath)) return true;
    return true; // Default expanded so files are visible
  }

  function toggleFolder(folderPath, isModule) {
    const currentlyExpanded = isFolderExpanded(folderPath, isModule);
    if (currentlyExpanded) {
      state.collapsedFolders.add(folderPath);
      state.expandedFolders.delete(folderPath);
    } else {
      state.expandedFolders.add(folderPath);
      state.collapsedFolders.delete(folderPath);
    }
    render();
  }

  // Hierarchical directory tree builder with middle folder compaction
  function buildDirectoryTree(files) {
    const root = {
      name: '',
      path: '',
      isFolder: true,
      children: new Map(),
      files: [],
      allFiles: []
    };

    for (const file of files) {
      const normalized = (file.path || '').replace(/\\/g, '/');
      const parts = normalized.split('/').filter(Boolean);
      if (parts.length === 0) continue;
      parts.pop(); // remove file name, keep directory parts
      let curr = root;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (!curr.children.has(part)) {
          curr.children.set(part, {
            name: part,
            path: parts.slice(0, i + 1).join('/'),
            isFolder: true,
            children: new Map(),
            files: [],
            allFiles: []
          });
        }
        curr = curr.children.get(part);
      }
      curr.files.push(file);
    }

    function populateAllFiles(node) {
      const list = [...node.files];
      for (const child of node.children.values()) {
        list.push(...populateAllFiles(child));
      }
      node.allFiles = list;
      return list;
    }
    populateAllFiles(root);

    // Compact single-child middle packages (e.g. lib/src/modules/capture_display/screen)
    function compactMiddleNodes(node) {
      const newChildren = new Map();
      for (const [name, child] of node.children.entries()) {
        let cur = child;
        while (cur.files.length === 0 && cur.children.size === 1) {
          const onlyChild = cur.children.values().next().value;
          cur = {
            name: cur.name + '/' + onlyChild.name,
            path: onlyChild.path,
            isFolder: true,
            children: onlyChild.children,
            files: onlyChild.files,
            allFiles: onlyChild.allFiles
          };
        }
        compactMiddleNodes(cur);
        newChildren.set(cur.name, cur);
      }
      node.children = newChildren;
    }
    compactMiddleNodes(root);

    return root;
  }

  // Render a folder node in tree view
  function renderFolderNode(node, depth, groupTitle) {
    const folderEl = document.createElement('div');
    folderEl.className = 'tree-folder-node';

    const folderPath = node.path || node.name;
    const isExpanded = isFolderExpanded(folderPath, false);

    const allFiles = node.allFiles || [];
    const anyPartiallyStaged = allFiles.some(f => f.partiallyStaged || (f.totalChanges > 0 && f.stagedChanges > 0 && f.stagedChanges < f.totalChanges));
    const allChecked = allFiles.length > 0 && allFiles.every(f => (state.checkedFiles.has(f.path) || (f.staged && !f.partiallyStaged)));
    const someChecked = anyPartiallyStaged || (!allChecked && allFiles.some(f => state.checkedFiles.has(f.path) || f.staged || f.stagedChanges > 0));

    const header = document.createElement('div');
    header.className = 'tree-folder-header';
    header.dataset.folderPath = folderPath;

    const countText = `${allFiles.length} ${allFiles.length === 1 ? 'file' : 'files'}`;

    header.innerHTML = `
      <span class="tree-arrow ${isExpanded ? 'expanded' : ''}">
        <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M6 3.5L10.5 8L6 12.5L5 11.5L8.5 8L5 4.5L6 3.5Z"/>
        </svg>
      </span>
      <input type="checkbox" class="file-chk tree-chk group-chk" ${allChecked ? 'checked' : ''}/>
      <span class="tree-folder-icon">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M1.5 3.5C1.5 2.67157 2.17157 2 3 2H6.08579C6.48362 2 6.86514 2.15804 7.14645 2.43934L8.70711 4H13C13.8284 4 14.5 4.67157 14.5 5.5V12.5C14.5 13.3284 13.8284 14 13 14H3C2.17157 14 1.5 13.3284 1.5 12.5V3.5Z" stroke="#8C8C8C" stroke-width="1.2" fill="none"/>
        </svg>
      </span>
      <span class="tree-folder-name">${escapeHtml(node.name)}</span>
      <span class="tree-folder-count">${countText}</span>
    `;

    const chk = header.querySelector('.tree-chk');
    if (chk) {
      chk.indeterminate = someChecked && !allChecked;
      chk.addEventListener('change', (e) => {
        e.stopPropagation();
        const isChecked = chk.checked;
        const paths = allFiles.map(f => f.path);
        if (isChecked) {
          paths.forEach(p => state.checkedFiles.add(p));
          vscode.postMessage({ type: 'stageFiles', payload: paths });
        } else {
          paths.forEach(p => state.checkedFiles.delete(p));
          vscode.postMessage({ type: 'unstageFiles', payload: paths });
        }
        render();
      });
    }

    header.addEventListener('click', (e) => {
      if (e.target === chk) return;
      toggleFolder(folderPath, false);
    });

    folderEl.appendChild(header);

    if (isExpanded) {
      const childrenContainer = document.createElement('div');
      childrenContainer.className = 'tree-folder-children';

      const subfolders = Array.from(node.children.values()).sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
      );
      subfolders.forEach(sub => {
        childrenContainer.appendChild(renderFolderNode(sub, depth + 1, groupTitle));
      });

      const directFiles = [...node.files].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
      );
      directFiles.forEach(file => {
        childrenContainer.appendChild(renderTreeFileItem(file, true));
      });

      folderEl.appendChild(childrenContainer);
    }

    return folderEl;
  }

  // Render a file item
  function renderTreeFileItem(file, inTreeMode) {
    const itemEl = document.createElement('div');
    const isSelected = state.selectedFile === file.path;
    const isPartiallyStaged = file.partiallyStaged || (file.totalChanges > 0 && file.stagedChanges > 0 && file.stagedChanges < file.totalChanges);
    const isChecked = !isPartiallyStaged && (state.checkedFiles.has(file.path) || (file.staged && !isPartiallyStaged));
    itemEl.className = `file-item tree-file-item ${isSelected ? 'selected' : ''}`;
    itemEl.dataset.path = file.path;

    const isUnversioned = file.isUntracked;
    const nameColorClass = isUnversioned ? 'name-unversioned' : 'name-modified';

    let badgeHtml = '';
    if (isPartiallyStaged) {
      badgeHtml = `<span class="file-changes-badge">${file.stagedChanges} of ${file.totalChanges} changes</span>`;
    }

    itemEl.innerHTML = `
      ${inTreeMode ? '<span class="tree-item-spacer"></span>' : ''}
      <input type="checkbox" class="file-chk tree-chk" ${isChecked ? 'checked' : ''}/>
      <span class="file-icon">${getFileIcon(file.name)}</span>
      <span class="file-name ${nameColorClass}">${escapeHtml(file.name)}</span>
      ${(!inTreeMode && state.showPaths && file.dir) ? `<span class="file-dir">${escapeHtml(file.dir)}</span>` : ''}
      ${badgeHtml}
    `;

    const fileChk = itemEl.querySelector('.file-chk');
    if (isPartiallyStaged) {
      fileChk.indeterminate = true;
    }
    fileChk.addEventListener('change', (e) => {
      e.stopPropagation();
      if (fileChk.checked) {
        state.checkedFiles.add(file.path);
        vscode.postMessage({ type: 'stageFile', payload: file.path });
      } else {
        state.checkedFiles.delete(file.path);
        vscode.postMessage({ type: 'unstageFile', payload: file.path });
      }
      render();
    });

    itemEl.addEventListener('click', (e) => {
      if (e.target === fileChk) return;
      state.selectedFile = file.path;
      vscode.postMessage({ type: 'openReviewInCenter', payload: file.path });
      if (state.showDiff) {
        vscode.postMessage({ type: 'getFileDiff', payload: file.path });
      }
      render();
    });

    itemEl.addEventListener('dblclick', (e) => {
      if (e.target === fileChk) return;
      state.selectedFile = file.path;
      vscode.postMessage({ type: 'openReviewInCenter', payload: file.path });
    });

    itemEl.addEventListener('contextmenu', (e) => {
      showFileContextMenu(e, file);
    });

    return itemEl;
  }

  // Render a group in the tree
  function renderFileGroup(title, files, expanded, toggleAction, checkAllAction) {
    const groupEl = document.createElement('div');
    groupEl.className = 'tree-group';

    const anyPartiallyStaged = files.some(f => f.partiallyStaged || (f.totalChanges > 0 && f.stagedChanges > 0 && f.stagedChanges < f.totalChanges));
    const allChecked = files.length > 0 && files.every(f => (state.checkedFiles.has(f.path) || (f.staged && !f.partiallyStaged)));
    const someChecked = anyPartiallyStaged || (!allChecked && files.some(f => state.checkedFiles.has(f.path) || f.staged || f.stagedChanges > 0));

    const header = document.createElement('div');
    header.className = 'group-header';
    header.innerHTML = `
      <span class="group-arrow ${expanded ? 'expanded' : ''}">
        <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M6 3.5L10.5 8L6 12.5L5 11.5L8.5 8L5 4.5L6 3.5Z"/>
        </svg>
      </span>
      <input type="checkbox" class="group-chk" ${allChecked ? 'checked' : ''}/>
      <span class="group-title">${title}</span>
      <span class="group-count">${files.length} ${files.length === 1 ? 'file' : 'files'}</span>
    `;

    const chk = header.querySelector('.group-chk');
    chk.indeterminate = someChecked && !allChecked;

    chk.addEventListener('change', (e) => {
      e.stopPropagation();
      const check = chk.checked;
      const paths = files.map(f => f.path);
      if (check) {
        paths.forEach(p => state.checkedFiles.add(p));
        vscode.postMessage({ type: 'stageFiles', payload: paths });
      } else {
        paths.forEach(p => state.checkedFiles.delete(p));
        vscode.postMessage({ type: 'unstageFiles', payload: paths });
      }
      render();
    });

    header.addEventListener('click', (e) => {
      if (e.target === chk) return;
      if (toggleAction === 'toggleChanges') {
        state.expandChanges = !state.expandChanges;
      } else {
        state.expandUnversioned = !state.expandUnversioned;
      }
      render();
    });

    groupEl.appendChild(header);

    if (expanded && files.length > 0) {
      const isTreeMode = Boolean(state.groupByDirectory || state.groupByModule);
      const itemsContainer = document.createElement('div');
      itemsContainer.className = `group-items ${isTreeMode ? 'group-tree-mode' : ''}`;

      if (state.groupByModule) {
        // Module Wrapper Node
        const moduleName = state.repoName || 'Project';
        const modulePath = `__module__:${title}:${moduleName}`;
        const isModuleExpanded = isFolderExpanded(modulePath, true);

        const moduleNodeEl = document.createElement('div');
        moduleNodeEl.className = 'tree-folder-node module-folder-node';

        const moduleHeader = document.createElement('div');
        moduleHeader.className = 'tree-folder-header module-header';
        moduleHeader.dataset.folderPath = modulePath;

        moduleHeader.innerHTML = `
          <span class="tree-arrow ${isModuleExpanded ? 'expanded' : ''}">
            <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M6 3.5L10.5 8L6 12.5L5 11.5L8.5 8L5 4.5L6 3.5Z"/>
            </svg>
          </span>
          <input type="checkbox" class="file-chk tree-chk group-chk" ${allChecked ? 'checked' : ''}/>
          <span class="tree-folder-icon">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M1.5 3.5C1.5 2.67157 2.17157 2 3 2H6.08579C6.48362 2 6.86514 2.15804 7.14645 2.43934L8.70711 4H13C13.8284 4 14.5 4.67157 14.5 5.5V12.5C14.5 13.3284 13.8284 14 13 14H3C2.17157 14 1.5 13.3284 1.5 12.5V3.5Z" stroke="#8C8C8C" stroke-width="1.2" fill="none"/>
            </svg>
          </span>
          <span class="tree-folder-name">${escapeHtml(moduleName)}</span>
          <span class="tree-folder-count">${files.length} ${files.length === 1 ? 'file' : 'files'}</span>
        `;

        const modChk = moduleHeader.querySelector('.tree-chk');
        if (modChk) {
          modChk.indeterminate = someChecked && !allChecked;
          modChk.addEventListener('change', (e) => {
            e.stopPropagation();
            const isChecked = modChk.checked;
            const paths = files.map(f => f.path);
            if (isChecked) {
              paths.forEach(p => state.checkedFiles.add(p));
              vscode.postMessage({ type: 'stageFiles', payload: paths });
            } else {
              paths.forEach(p => state.checkedFiles.delete(p));
              vscode.postMessage({ type: 'unstageFiles', payload: paths });
            }
            render();
          });
        }

        moduleHeader.addEventListener('click', (e) => {
          if (e.target === modChk) return;
          toggleFolder(modulePath, true);
        });

        moduleNodeEl.appendChild(moduleHeader);

        if (isModuleExpanded) {
          const modChildrenContainer = document.createElement('div');
          modChildrenContainer.className = 'tree-folder-children module-children';

          if (state.groupByDirectory) {
            const treeRoot = buildDirectoryTree(files);
            const subfolders = Array.from(treeRoot.children.values()).sort((a, b) =>
              a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
            );
            subfolders.forEach(sub => {
              modChildrenContainer.appendChild(renderFolderNode(sub, 1, title));
            });
            const directFiles = [...treeRoot.files].sort((a, b) =>
              a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
            );
            directFiles.forEach(file => {
              modChildrenContainer.appendChild(renderTreeFileItem(file, true));
            });
          } else {
            // Flat list inside module
            files.forEach(file => {
              modChildrenContainer.appendChild(renderTreeFileItem(file, false));
            });
          }

          moduleNodeEl.appendChild(modChildrenContainer);
        }

        itemsContainer.appendChild(moduleNodeEl);
      } else if (state.groupByDirectory) {
        // Group by directory without module wrapper
        const treeRoot = buildDirectoryTree(files);
        const subfolders = Array.from(treeRoot.children.values()).sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
        );
        subfolders.forEach(sub => {
          itemsContainer.appendChild(renderFolderNode(sub, 0, title));
        });
        const directFiles = [...treeRoot.files].sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
        );
        directFiles.forEach(file => {
          itemsContainer.appendChild(renderTreeFileItem(file, true));
        });
      } else {
        // Flat list
        files.forEach(file => {
          itemsContainer.appendChild(renderTreeFileItem(file, false));
        });
      }

      groupEl.appendChild(itemsContainer);
    }

    return groupEl;
  }

  // Render Diff Viewer with Line-by-Line Tick checkboxes
  function renderDiffViewer() {
    const diffContainer = document.createElement('div');
    diffContainer.className = 'diff-viewer-wrapper';

    const selectedFile = state.selectedFile || (state.files[0] ? state.files[0].path : '');
    const fileName = selectedFile.split('/').pop() || '';
    const fileDir = selectedFile.split('/').slice(0, -1).join('/');

    // Header bar
    const diffHeader = document.createElement('div');
    diffHeader.className = 'diff-header-bar';
    diffHeader.innerHTML = `
      <div class="diff-title-info">
        <span class="diff-file-name">${escapeHtml(fileName)}</span>
        <span class="diff-file-dir">${escapeHtml(fileDir)}</span>
      </div>
      <div class="diff-actions">
        <button class="diff-tool-btn" id="btn-revert-hunk" title="Revert Hunk">↶</button>
        <button class="diff-tool-btn" id="btn-prev-diff" title="Previous Difference (Cmd+Shift+Up)">▲</button>
        <button class="diff-tool-btn" id="btn-next-diff" title="Next Difference (Cmd+Shift+Down)">▼</button>
        <button class="diff-tool-btn" id="btn-open-center" title="Open in Center Editor Tab (Android Studio)">⤢</button>
        <button class="diff-tool-btn" id="btn-open-editor" title="Open in VS Code Diff Editor">↗</button>
        <button class="diff-tool-btn" id="btn-close-diff" title="Close Diff (Esc)">✕</button>
      </div>
    `;
    diffContainer.appendChild(diffHeader);

    // Diff Content
    const diffContent = document.createElement('div');
    diffContent.className = 'diff-content-scroll';

    if (!state.diffData || !state.diffData.diff) {
      diffContent.innerHTML = `
        <div class="diff-loading">
          <span>Loading diff for ${escapeHtml(fileName)}...</span>
        </div>
      `;
      diffContainer.appendChild(diffContent);
      return diffContainer;
    }

    const hunks = parseDiff(state.diffData.diff, selectedFile);
    if (hunks.length === 0) {
      diffContent.innerHTML = `
        <div class="diff-empty">
          <span>No text differences found.</span>
        </div>
      `;
      diffContainer.appendChild(diffContent);
      return diffContainer;
    }

    hunks.forEach((hunk, hIdx) => {
      // Hunk separator bar with Hunk Checkbox
      const hunkHeader = document.createElement('div');
      hunkHeader.className = 'hunk-header-bar';
      hunkHeader.innerHTML = `
        <label class="hunk-chk-label">
          <input type="checkbox" class="hunk-chk" data-hunk="${hIdx}" checked/>
          <span class="hunk-title">${escapeHtml(hunk.header)}</span>
        </label>
      `;

      const hunkChk = hunkHeader.querySelector('.hunk-chk');
      hunkChk.addEventListener('change', () => {
        const check = hunkChk.checked;
        hunk.staged = check;
        if (hunk.blocks) {
          hunk.blocks.forEach(b => {
            b.staged = check;
            b.lines.forEach(bLine => { bLine.staged = check; });
          });
          diffContent.querySelectorAll(`.line-chk[data-hunk="${hIdx}"]`).forEach(c => {
            c.checked = check;
          });
        }
        const patchContent = constructHunkPatch(selectedFile, hunk);
        if (check) {
          vscode.postMessage({ type: 'applyHunkPatch', payload: { patch: patchContent, reverse: false } });
        } else {
          vscode.postMessage({ type: 'applyHunkPatch', payload: { patch: patchContent, reverse: true } });
        }
      });

      diffContent.appendChild(hunkHeader);

      // Render lines in this hunk
      hunk.lines.forEach((l, lIdx) => {
        const lineRow = document.createElement('div');
        lineRow.className = `diff-line diff-${l.type}`;

        const isChanged = l.type === 'add' || l.type === 'del';
        const isBlockStart = l.isBlockStart;
        const block = l.block;

        lineRow.innerHTML = `
          <div class="gutter">
            <span class="line-num old-num">${l.oldNum !== undefined ? l.oldNum : ''}</span>
            <span class="line-num new-num">${l.newNum !== undefined ? l.newNum : ''}</span>
            ${isBlockStart ? `
              <input type="checkbox" class="line-chk" title="Stage / Unstage block" ${block && block.staged ? 'checked' : ''} data-hunk="${hIdx}" data-block="${block ? block.id : 0}"/>
            ` : '<span class="gutter-spacer"></span>'}
          </div>
          <div class="line-prefix">${l.type === 'add' ? '+' : l.type === 'del' ? '-' : ' '}</div>
          <div class="line-text">${escapeHtml(l.text)}</div>
        `;

        if (isBlockStart && block) {
          const blockChk = lineRow.querySelector('.line-chk');
          blockChk.addEventListener('change', () => {
            const check = blockChk.checked;
            block.staged = check;
            block.lines.forEach(bLine => { bLine.staged = check; });

            if (hunk.blocks) {
              const allBlocksStaged = hunk.blocks.every(b => b.staged);
              const someBlocksStaged = hunk.blocks.some(b => b.staged);
              hunkChk.checked = allBlocksStaged;
              hunkChk.indeterminate = !allBlocksStaged && someBlocksStaged;
            }

            const patchContent = constructBlockPatch(selectedFile, hunk, block);
            if (check) {
              vscode.postMessage({ type: 'applyHunkPatch', payload: { patch: patchContent, reverse: false } });
            } else {
              vscode.postMessage({ type: 'applyHunkPatch', payload: { patch: patchContent, reverse: true } });
            }
          });
        }

        diffContent.appendChild(lineRow);
      });
    });

    diffContainer.appendChild(diffContent);

    // Auto-scroll to first diff line
    requestAnimationFrame(() => {
      const firstDiff = diffContent.querySelector('.diff-line.diff-add, .diff-line.diff-del');
      if (firstDiff) {
        firstDiff.scrollIntoView({ block: 'center' });
      }
    });

    // Header actions
    const btnOpenCenter = diffHeader.querySelector('#btn-open-center');
    if (btnOpenCenter) {
      btnOpenCenter.addEventListener('click', () => {
        vscode.postMessage({ type: 'openReviewInCenter', payload: selectedFile });
      });
    }

    diffHeader.querySelector('#btn-close-diff').addEventListener('click', () => {
      state.showDiff = false;
      render();
    });

    diffHeader.querySelector('#btn-open-editor').addEventListener('click', () => {
      vscode.postMessage({ type: 'openDiffInEditor', payload: selectedFile });
    });

    return diffContainer;
  }

  // Construct a git unified patch for a hunk
  function constructHunkPatch(filePath, hunk) {
    let patch = `--- a/${filePath}\n+++ b/${filePath}\n`;
    patch += hunk.rawLines.join('\n') + '\n';
    return patch;
  }

  // Construct a patch for a specific block of changes
  function constructBlockPatch(filePath, hunk, block) {
    if (!hunk.blocks || hunk.blocks.length <= 1) {
      return constructHunkPatch(filePath, hunk);
    }
    let patch = `--- a/${filePath}\n+++ b/${filePath}\n`;
    let oldLen = 0;
    let newLen = 0;
    const patchBody = [];

    hunk.lines.forEach(l => {
      if (l.block === block) {
        patchBody.push(l.raw);
        if (l.type === 'del') oldLen++;
        if (l.type === 'add') newLen++;
      } else if (l.type === 'ctx') {
        patchBody.push(l.raw);
        oldLen++;
        newLen++;
      } else if (l.type === 'del') {
        patchBody.push(' ' + l.raw.slice(1));
        oldLen++;
        newLen++;
      }
    });

    const header = `@@ -${hunk.oldStart},${oldLen} +${hunk.newStart},${newLen} @@`;
    patch += header + '\n' + patchBody.join('\n') + '\n';
    return patch;
  }

  // Render recent commit messages dropdown
  function renderRecentMessagesDropdown() {
    let listHtml = state.recentMessages.map(msg => `
      <div class="recent-msg-item" data-msg="${escapeAttr(msg)}">
        <span class="recent-clock">🕒</span>
        <span class="recent-text">${escapeHtml(msg)}</span>
      </div>
    `).join('');

    if (state.recentMessages.length === 0) {
      listHtml = '<div class="recent-msg-empty">No recent commit messages</div>';
    }

    return `
      <div class="recent-messages-dropdown" id="recent-dropdown">
        <div class="recent-dropdown-title">Recent Commit Messages</div>
        <div class="recent-list">${listHtml}</div>
      </div>
    `;
  }

  // Render gear options dropdown
  function renderCommitGearDropdown() {
    return `
      <div class="commit-gear-dropdown" id="gear-dropdown">
        <div class="gear-title">Before Commit</div>
        <label class="gear-item"><input type="checkbox" class="file-chk tree-chk"/> Reformat code</label>
        <label class="gear-item"><input type="checkbox" class="file-chk tree-chk"/> Rearrange code</label>
        <label class="gear-item"><input type="checkbox" class="file-chk tree-chk"/> Optimize imports</label>
        <label class="gear-item"><input type="checkbox" class="file-chk tree-chk"/> Clean up</label>
        <div class="gear-divider"></div>
        <label class="gear-item"><input type="checkbox" class="file-chk tree-chk"/> Check TODO (0)</label>
      </div>
    `;
  }

  // Render View Options dropdown
  function renderViewOptionsDropdown() {
    return `
      <div class="as-view-options-menu" id="view-options-menu">
        <div class="as-menu-section-header">Group By</div>
        <div class="as-menu-item ${state.groupByDirectory ? 'active' : ''}" data-action="toggle-groupBy-directory">
          <div class="as-menu-item-left">
            <span class="as-menu-check">${state.groupByDirectory ? '✓' : ''}</span>
            <span class="as-menu-label">Directory</span>
          </div>
          <span class="as-menu-shortcut">^P</span>
        </div>
        <div class="as-menu-item ${state.groupByModule ? 'active' : ''}" data-action="toggle-groupBy-module">
          <div class="as-menu-item-left">
            <span class="as-menu-check">${state.groupByModule ? '✓' : ''}</span>
            <span class="as-menu-label">Module</span>
          </div>
        </div>
        <div class="as-menu-section-header" style="margin-top: 6px;">Show</div>
        <div class="as-menu-item ${state.showIgnoredFiles !== false ? 'active' : ''}" data-action="toggle-ignored">
          <div class="as-menu-item-left">
            <span class="as-menu-check">${state.showIgnoredFiles !== false ? '✓' : ''}</span>
            <span class="as-menu-label">Ignored Files</span>
          </div>
        </div>
      </div>
    `;
  }

  // Attach tab switching events
  function attachTabEvents(container) {
    container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.activeTab = btn.getAttribute('data-tab');
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

  // Attach toolbar events
  function attachToolbarEvents(toolbar, container) {
    toolbar.querySelector('#btn-refresh').addEventListener('click', () => {
      vscode.postMessage({ type: 'refresh' });
    });

    toolbar.querySelector('#btn-rollback').addEventListener('click', () => {
      const selected = Array.from(state.checkedFiles);
      if (selected.length === 0 && state.selectedFile) {
        selected.push(state.selectedFile);
      }
      if (selected.length === 0) return;
      vscode.postMessage({ type: 'rollbackFiles', payload: selected });
    });

    toolbar.querySelector('#btn-show-diff').addEventListener('click', () => {
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
          const action = item.dataset.action;
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
    const btnResolve = targetScope.querySelector('#btn-resolve-conflicts');
    if (btnResolve) {
      btnResolve.addEventListener('click', () => {
        vscode.postMessage({ type: 'openConflictsDialog' });
      });
    }

    const btnAbort = targetScope.querySelector('#btn-abort-merge');
    if (btnAbort) {
      btnAbort.addEventListener('click', () => {
        vscode.postMessage({ type: 'abortMerge' });
      });
    }
  }

  // Attach tree events
  function attachTreeEvents(treeContainer) {
    // Tree clicks are handled per item
  }

  // Attach commit box events
  function attachCommitBoxEvents(commitBox) {
    const textarea = commitBox.querySelector('#commit-message-input');
    textarea.addEventListener('input', () => {
      state.commitMessage = textarea.value;
    });

    const chkAmend = commitBox.querySelector('#chk-amend');
    chkAmend.addEventListener('change', () => {
      state.isAmend = chkAmend.checked;
      if (state.isAmend && (!state.commitMessage || !state.commitMessage.trim())) {
        if (state.recentMessages.length > 0) {
          state.commitMessage = state.recentMessages[0];
          textarea.value = state.commitMessage;
        }
      }
    });

    const btnRecent = commitBox.querySelector('#btn-recent-msgs');
    btnRecent.addEventListener('click', (e) => {
      e.stopPropagation();
      state.recentOpen = !state.recentOpen;
      state.commitOptionsOpen = false;
      render();
    });

    const btnAi = commitBox.querySelector('#btn-generate-ai');
    if (btnAi) {
      btnAi.addEventListener('click', (e) => {
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
    }

    const btnGear = commitBox.querySelector('#btn-commit-gear');
    btnGear.addEventListener('click', (e) => {
      e.stopPropagation();
      state.commitOptionsOpen = !state.commitOptionsOpen;
      state.recentOpen = false;
      render();
    });

    const btnCommit = commitBox.querySelector('#btn-commit');
    btnCommit.addEventListener('click', () => {
      doCommit(false);
    });

    const btnCommitPush = commitBox.querySelector('#btn-commit-push');
    btnCommitPush.addEventListener('click', () => {
      doCommit(true);
    });

    // Recent items click
    const dropdown = commitBox.querySelector('#recent-dropdown');
    if (dropdown) {
      dropdown.querySelectorAll('.recent-msg-item').forEach(item => {
        item.addEventListener('click', () => {
          const msg = item.getAttribute('data-msg');
          state.commitMessage = msg;
          state.recentOpen = false;
          render();
        });
      });
    }

    // Close dropdowns on outside click
    document.addEventListener('click', (e) => {
      if (state.recentOpen || state.commitOptionsOpen || state.viewOptionsOpen) {
        if (!e.target.closest('#recent-dropdown') && !e.target.closest('#btn-recent-msgs') &&
            !e.target.closest('#gear-dropdown') && !e.target.closest('#btn-commit-gear') &&
            !e.target.closest('#view-options-wrapper')) {
          state.recentOpen = false;
          state.commitOptionsOpen = false;
          state.viewOptionsOpen = false;
          render();
        }
      }
    });

    // Keyboard shortcut ^P (Control+P) for toggling Group By Directory
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || (e.metaKey && e.altKey)) && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        state.groupByDirectory = !state.groupByDirectory;
        state.showPaths = !state.groupByDirectory;
        render();
      }
    });
  }

  // Handle Commit / Commit and Push
  function doCommit(push) {
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

  function textareaFocus() {
    const ta = document.getElementById('commit-message-input');
    if (ta) {
      ta.focus();
      ta.classList.add('error-pulse');
      setTimeout(() => ta.classList.remove('error-pulse'), 1000);
    }
  }

  // Stash events
  function attachStashEvents(stashContent) {
    const btnNewStash = stashContent.querySelector('#btn-create-stash');
    if (btnNewStash) {
      btnNewStash.addEventListener('click', () => {
        vscode.postMessage({ type: 'createStash' });
      });
    }

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

  // Horizontal splitter dragging
  function attachHSplitter(splitter, topEl, container) {
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
      topEl.nextElementSibling.nextElementSibling.style.flex = `${1 - newRatio}`;
    });

    window.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        document.body.classList.remove('resizing-h');
      }
    });
  }

  // Android Studio Context Menu implementation
  let activeContextMenu = null;

  function closeContextMenu() {
    if (activeContextMenu) {
      activeContextMenu.remove();
      activeContextMenu = null;
    }
  }

  function showFileContextMenu(e, file) {
    e.preventDefault();
    e.stopPropagation();
    closeContextMenu();

    state.selectedFile = file.path;
    document.querySelectorAll('.file-item').forEach(el => el.classList.remove('selected'));
    const currentItem = e.currentTarget;
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

    const items = [
      {
        label: 'Rollback...',
        shortcut: `${optKey}${cmdKey}Z`,
        icon: '↶',
        action: () => vscode.postMessage({ type: 'rollbackFiles', payload: [file.path] })
      },
      {
        label: 'Show Diff',
        shortcut: `${cmdKey}D`,
        icon: '⇄',
        action: () => vscode.postMessage({ type: 'openReviewInCenter', payload: file.path })
      },
      {
        label: 'Jump to Source',
        shortcut: 'F4',
        icon: '↗',
        action: () => vscode.postMessage({ type: 'jumpToSource', payload: file.path })
      },
      { separator: true },
      {
        label: 'Delete...',
        shortcut: '⌫',
        icon: '✕',
        action: () => vscode.postMessage({ type: 'deleteFile', payload: file.path })
      },
      {
        label: vcsActionLabel,
        shortcut: `${optKey}${cmdKey}A`,
        icon: '+',
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
        icon: '↻',
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
          <span class="as-menu-icon">${it.icon}</span>
          <span class="as-menu-label">${escapeHtml(it.label)}</span>
        </div>
        ${it.shortcut ? `<span class="as-menu-shortcut">${it.shortcut}</span>` : ''}
      `;

      row.addEventListener('click', (ev) => {
        ev.stopPropagation();
        closeContextMenu();
        it.action();
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

  window.addEventListener('click', closeContextMenu);
  window.addEventListener('blur', closeContextMenu);
  window.addEventListener('keydown', (e) => {
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
      } else if (cmdOrCtrl && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        vscode.postMessage({ type: 'openReviewInCenter', payload: state.selectedFile });
      } else if (cmdOrCtrl && e.altKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        vscode.postMessage({ type: 'rollbackFiles', payload: [state.selectedFile] });
      } else if (e.key === 'F7' || e.keyCode === 118) {
        e.preventDefault();
        let targetFile = state.selectedFile;
        if (!targetFile && state.files && state.files.length > 0) {
          targetFile = state.files[0].path;
          state.selectedFile = targetFile;
          render();
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

  // Helper escape functions
  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function escapeAttr(str) {
    if (!str) return '';
    return str.replace(/"/g, '&quot;');
  }

  let activeConflictsDialog = null;
  let updateConflictsDialog = null;

  function openConflictsDialog() {
    if (activeConflictsDialog) {
      activeConflictsDialog.remove();
      activeConflictsDialog = null;
    }

    const conflictInfo = state.conflictInfo || {
      hasConflicts: false,
      isMerging: false,
      isRebasing: false,
      yoursBranch: 'Yours',
      theirsBranch: 'Theirs',
      conflicts: [],
    };

    let conflicts = [...(conflictInfo.conflicts || [])];
    let selectedPath = conflicts.length > 0 ? conflicts[0].path : null;
    let groupByDir = false;

    const overlay = document.createElement('div');
    overlay.className = 'as-conflicts-dialog-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:99999;backdrop-filter:blur(2px);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;';

    const card = document.createElement('div');
    card.className = 'as-dialog-card';
    card.style.cssText = 'background:#2b2d30;border:1px solid #43454a;border-radius:8px;box-shadow:0 16px 48px rgba(0,0,0,0.8);width:680px;max-width:94vw;max-height:88vh;display:flex;flex-direction:column;overflow:hidden;color:#dfe1e5;';

    const yoursLabel = `Yours (${conflictInfo.yoursBranch || 'HEAD'})`;
    const theirsLabel = `Theirs (${conflictInfo.theirsBranch || 'MERGE_HEAD'})`;

    card.innerHTML = `
      <div style="position:relative;display:flex;align-items:center;padding:10px 14px;background:#212224;border-bottom:1px solid #323438;user-select:none;">
        <div style="display:flex;gap:7px;align-items:center;z-index:2;">
          <span class="as-dot-close" title="Close" style="width:11px;height:11px;border-radius:50%;background:#ff5f56;display:inline-block;cursor:pointer;"></span>
          <span style="width:11px;height:11px;border-radius:50%;background:#4a4a4a;display:inline-block;"></span>
          <span style="width:11px;height:11px;border-radius:50%;background:#27c93f;display:inline-block;"></span>
        </div>
        <div style="position:absolute;left:0;right:0;text-align:center;font-weight:600;font-size:13px;color:#dfe1e5;pointer-events:none;">
          Conflicts
        </div>
      </div>
      <div style="padding:14px 18px 8px;font-size:13px;color:#dfe1e5;font-weight:400;">
        The following files have unresolved conflicts. You need to resolve them before merge.
      </div>
      <div style="display:flex;flex:1;min-height:220px;max-height:450px;padding:8px 18px;gap:14px;">
        <div style="flex:1;min-width:0;display:flex;flex-direction:column;border:1px solid #43454a;border-radius:4px;background:#1e1f22;overflow:hidden;">
          <div style="display:flex;background:#2b2d30;border-bottom:1px solid #3c3f41;padding:6px 10px;font-size:12px;font-weight:600;color:#9aa0a6;user-select:none;">
            <div style="flex:1.8;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">Name</div>
            <div style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" id="lbl-yours">${escapeHtml(yoursLabel)}</div>
            <div style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" id="lbl-theirs">${escapeHtml(theirsLabel)}</div>
          </div>
          <div id="conflict-table-body" style="flex:1;overflow-y:auto;min-height:180px;">
          </div>
        </div>
        <div style="width:130px;display:flex;flex-direction:column;gap:8px;padding-top:2px;">
          <button id="btn-act-yours" style="background:#2b2d30;color:#dfe1e5;border:1px solid #4e5157;border-radius:4px;padding:6px 12px;font-size:12.5px;cursor:pointer;text-align:center;white-space:nowrap;">Accept Yours</button>
          <button id="btn-act-theirs" style="background:#2b2d30;color:#dfe1e5;border:1px solid #4e5157;border-radius:4px;padding:6px 12px;font-size:12.5px;cursor:pointer;text-align:center;white-space:nowrap;">Accept Theirs</button>
          <button id="btn-act-merge" style="background:#3574f0;color:#ffffff;border:none;border-radius:4px;padding:6px 12px;font-size:12.5px;font-weight:600;cursor:pointer;text-align:center;white-space:nowrap;margin-top:2px;">Merge...</button>
        </div>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 18px 14px;background:#2b2d30;border-top:1px solid #323438;">
        <label style="display:inline-flex;align-items:center;gap:6px;font-size:12.5px;color:#dfe1e5;cursor:pointer;user-select:none;">
          <input type="checkbox" id="chk-group-dir" style="accent-color:#3574f0;cursor:pointer;width:14px;height:14px;margin:0;">
          <span>Group files by directory</span>
        </label>
        <button id="btn-dialog-close" style="background:#2b2d30;color:#dfe1e5;border:1px solid #4e5157;border-radius:4px;padding:5px 18px;font-size:12.5px;cursor:pointer;">Close</button>
      </div>
    `;

    overlay.appendChild(card);
    document.body.appendChild(overlay);
    activeConflictsDialog = overlay;

    const tableBody = card.querySelector('#conflict-table-body');
    const chkGroup = card.querySelector('#chk-group-dir');
    const btnAcceptYours = card.querySelector('#btn-act-yours');
    const btnAcceptTheirs = card.querySelector('#btn-act-theirs');
    const btnMerge = card.querySelector('#btn-act-merge');
    const btnClose = card.querySelector('#btn-dialog-close');
    const dotClose = card.querySelector('.as-dot-close');

    function renderTable() {
      if (conflicts.length === 0) {
        tableBody.innerHTML = '<div style="padding:24px;text-align:center;color:#808080;font-size:13px;">No unresolved conflicts.</div>';
        btnAcceptYours.disabled = true;
        btnAcceptYours.style.opacity = '0.5';
        btnAcceptTheirs.disabled = true;
        btnAcceptTheirs.style.opacity = '0.5';
        btnMerge.disabled = true;
        btnMerge.style.opacity = '0.5';
        return;
      }

      btnAcceptYours.disabled = false;
      btnAcceptYours.style.opacity = '1';
      btnAcceptTheirs.disabled = false;
      btnAcceptTheirs.style.opacity = '1';
      btnMerge.disabled = false;
      btnMerge.style.opacity = '1';

      if (!selectedPath || !conflicts.some(c => c.path === selectedPath)) {
        selectedPath = conflicts[0].path;
      }

      let html = '';
      if (!groupByDir) {
        conflicts.forEach(file => {
          const isSelected = file.path === selectedPath;
          const bg = isSelected ? '#2675bf' : 'transparent';
          const textColor = isSelected ? '#ffffff' : '#e06c75';
          const dirColor = isSelected ? '#b0d4f1' : '#808080';
          const statusColor = isSelected ? '#ffffff' : '#dfe1e5';
          html += `
            <div class="as-conflict-row" data-path="${escapeAttr(file.path)}" style="display:flex;align-items:center;padding:5px 10px;font-size:12.5px;cursor:pointer;user-select:none;background:${bg};border-bottom:1px solid rgba(255,255,255,0.03);">
              <div style="flex:1.8;min-width:0;display:flex;align-items:center;gap:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                ${getFileIcon(file.name)}
                <span style="color:${textColor};font-weight:500;">${escapeHtml(file.name)}</span>
                ${file.dir ? `<span style="color:${dirColor};font-size:11.5px;margin-left:4px;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(file.dir)}</span>` : ''}
              </div>
              <div style="flex:1;min-width:0;color:${statusColor};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(file.yours)}</div>
              <div style="flex:1;min-width:0;color:${statusColor};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(file.theirs)}</div>
            </div>
          `;
        });
      } else {
        const groups = new Map();
        conflicts.forEach(file => {
          const dir = file.dir || '';
          if (!groups.has(dir)) groups.set(dir, []);
          groups.get(dir).push(file);
        });

        for (const [dir, files] of groups.entries()) {
          html += `
            <div style="display:flex;align-items:center;gap:6px;padding:4px 8px;background:rgba(255,255,255,0.04);color:#9aa0a6;font-size:11.5px;font-weight:600;border-bottom:1px solid rgba(255,255,255,0.04);">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h3.879a1.5 1.5 0 0 1 1.06.44l1.122 1.12A.5.5 0 0 0 8.92 4H13.5A1.5 1.5 0 0 1 15 5.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 12.5v-9z"/></svg>
              <span>${escapeHtml(dir || 'root')}</span>
            </div>
          `;
          files.forEach(file => {
            const isSelected = file.path === selectedPath;
            const bg = isSelected ? '#2675bf' : 'transparent';
            const textColor = isSelected ? '#ffffff' : '#e06c75';
            const statusColor = isSelected ? '#ffffff' : '#dfe1e5';
            html += `
              <div class="as-conflict-row" data-path="${escapeAttr(file.path)}" style="display:flex;align-items:center;padding:5px 10px 5px 22px;font-size:12.5px;cursor:pointer;user-select:none;background:${bg};border-bottom:1px solid rgba(255,255,255,0.03);">
                <div style="flex:1.8;min-width:0;display:flex;align-items:center;gap:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                  ${getFileIcon(file.name)}
                  <span style="color:${textColor};font-weight:500;">${escapeHtml(file.name)}</span>
                </div>
                <div style="flex:1;min-width:0;color:${statusColor};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(file.yours)}</div>
                <div style="flex:1;min-width:0;color:${statusColor};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(file.theirs)}</div>
              </div>
            `;
          });
        }
      }
      tableBody.innerHTML = html;

      tableBody.querySelectorAll('.as-conflict-row').forEach(row => {
        row.addEventListener('click', () => {
          selectedPath = row.getAttribute('data-path');
          renderTable();
        });
        row.addEventListener('dblclick', () => {
          selectedPath = row.getAttribute('data-path');
          doMerge();
        });
      });
    }

    function doMerge() {
      if (!selectedPath) return;
      vscode.postMessage({ type: 'openMergeEditor', payload: { path: selectedPath } });
    }

    function doAcceptYours() {
      if (!selectedPath) return;
      const target = selectedPath;
      vscode.postMessage({ type: 'acceptYours', payload: { path: target } });
      conflicts = conflicts.filter(c => c.path !== target);
      if (conflicts.length === 0) {
        close();
      } else {
        selectedPath = conflicts[0].path;
        renderTable();
      }
    }

    function doAcceptTheirs() {
      if (!selectedPath) return;
      const target = selectedPath;
      vscode.postMessage({ type: 'acceptTheirs', payload: { path: target } });
      conflicts = conflicts.filter(c => c.path !== target);
      if (conflicts.length === 0) {
        close();
      } else {
        selectedPath = conflicts[0].path;
        renderTable();
      }
    }

    function close() {
      window.removeEventListener('keydown', handleKey);
      overlay.remove();
      activeConflictsDialog = null;
      updateConflictsDialog = null;
    }

    function handleKey(e) {
      if (e.key === 'Escape') {
        close();
      } else if (e.key === 'Enter') {
        doMerge();
      } else if (e.key === 'ArrowDown') {
        const idx = conflicts.findIndex(c => c.path === selectedPath);
        if (idx < conflicts.length - 1) {
          selectedPath = conflicts[idx + 1].path;
          renderTable();
          e.preventDefault();
        }
      } else if (e.key === 'ArrowUp') {
        const idx = conflicts.findIndex(c => c.path === selectedPath);
        if (idx > 0) {
          selectedPath = conflicts[idx - 1].path;
          renderTable();
          e.preventDefault();
        }
      }
    }

    window.addEventListener('keydown', handleKey);

    chkGroup.addEventListener('change', () => {
      groupByDir = chkGroup.checked;
      renderTable();
    });

    btnMerge.addEventListener('click', doMerge);
    btnAcceptYours.addEventListener('click', doAcceptYours);
    btnAcceptTheirs.addEventListener('click', doAcceptTheirs);
    btnClose.addEventListener('click', close);
    dotClose.addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });

    updateConflictsDialog = function() {
      const updatedInfo = state.conflictInfo;
      if (updatedInfo) {
        conflicts = [...(updatedInfo.conflicts || [])];
        if (conflicts.length === 0) {
          close();
          return;
        }
        renderTable();
      }
    };

    renderTable();
  }

  let activePushDialog = null;

  function openPushDialog(pushInfo) {
    if (activePushDialog) {
      activePushDialog.remove();
      activePushDialog = null;
    }

    if (!pushInfo) return;

    const overlay = document.createElement('div');
    overlay.className = 'as-push-dialog-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.65);display:flex;align-items:center;justify-content:center;z-index:99999;backdrop-filter:blur(2px);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;';

    const card = document.createElement('div');
    card.className = 'as-push-dialog-card';
    card.style.cssText = 'background:#1e1f22;border:1px solid #43454a;border-radius:8px;box-shadow:0 20px 60px rgba(0,0,0,0.85);width:760px;max-width:95vw;height:520px;max-height:90vh;display:flex;flex-direction:column;overflow:hidden;color:#dfe1e5;';

    const commits = pushInfo.commits || [];
    const totalFiles = pushInfo.totalFiles || [];
    let selectedCommitHash = 'ALL';
    let currentRemote = pushInfo.remote;
    let currentTargetBranch = pushInfo.remoteBranch || pushInfo.currentBranch;
    const availableRemotes = (pushInfo.remotes && pushInfo.remotes.length > 0) ? pushInfo.remotes : [currentRemote];

    card.innerHTML = `
      <div style="position:relative;display:flex;align-items:center;padding:10px 14px;background:#2b2d30;border-bottom:1px solid #323438;user-select:none;">
        <div style="display:flex;gap:7px;align-items:center;z-index:2;">
          <span class="as-push-dot-close" title="Close" style="width:11px;height:11px;border-radius:50%;background:#ff5f56;display:inline-block;cursor:pointer;"></span>
          <span style="width:11px;height:11px;border-radius:50%;background:#4a4a4a;display:inline-block;"></span>
          <span style="width:11px;height:11px;border-radius:50%;background:#27c93f;display:inline-block;"></span>
        </div>
        <div id="push-dialog-title" style="position:absolute;left:0;right:0;text-align:center;font-weight:600;font-size:13px;color:#dfe1e5;pointer-events:none;">
          Push Commits to ${escapeHtml(currentRemote)}
        </div>
      </div>
      <div style="display:flex;flex:1;min-height:0;overflow:hidden;">
        <!-- Left Column: Branches & Commits -->
        <div style="width:44%;border-right:1px solid #323438;display:flex;flex-direction:column;background:#1e1f22;overflow-y:auto;">
          <div id="push-branch-header" style="display:flex;align-items:center;padding:7px 12px;background:#2675bf;color:#ffffff;font-size:12.5px;font-weight:500;cursor:pointer;user-select:none;gap:4px;overflow:hidden;position:relative;">
            <span style="font-weight:600;white-space:nowrap;">${escapeHtml(pushInfo.currentBranch)}</span>
            <span style="opacity:0.7;margin:0 2px;">&rarr;</span>
            <div style="display:inline-flex;align-items:center;gap:2px;position:relative;">
              <span id="push-remote-label" title="Click to change remote" style="color:#ffffff;font-weight:600;cursor:pointer;border-bottom:1px dashed rgba(255,255,255,0.6);">${escapeHtml(currentRemote)}</span>
              <div id="push-remote-dropdown" style="display:none;position:absolute;top:22px;left:0;background:#2b2d30;border:1px solid #43454a;border-radius:4px;box-shadow:0 8px 24px rgba(0,0,0,0.8);z-index:200;min-width:110px;padding:4px 0;"></div>
            </div>
            <span style="opacity:0.7;margin:0 2px;">:</span>
            <span id="push-target-branch-display" title="Click to edit remote branch name" style="color:#d0e3ff;text-decoration:underline;cursor:pointer;font-weight:500;white-space:nowrap;padding:1px 4px;border-radius:3px;">${escapeHtml(currentTargetBranch)}</span>
            <input id="push-target-branch-input" type="text" value="${escapeAttr(currentTargetBranch)}" style="display:none;background:#1e1f22;color:#ffffff;border:1.5px solid #3574f0;border-radius:3px;padding:2px 6px;font-size:12px;font-family:inherit;outline:none;width:150px;">
            <span id="push-new-badge" style="background:rgba(255,255,255,0.22);color:#ffffff;font-size:10.5px;padding:1px 5px;border-radius:3px;margin-left:auto;white-space:nowrap;${pushInfo.isNew ? '' : 'display:none;'}">New</span>
          </div>
          <div id="push-commits-container" style="flex:1;overflow-y:auto;padding:4px 0;">
          </div>
        </div>

        <!-- Right Column: Files Tree -->
        <div style="width:56%;display:flex;flex-direction:column;background:#1e1f22;overflow:hidden;">
          <div style="display:flex;align-items:center;justify-content:space-between;padding:7px 12px;background:#26282b;border-bottom:1px solid #323438;user-select:none;">
            <div style="display:flex;align-items:center;gap:6px;font-size:12.5px;font-weight:600;color:#dfe1e5;">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="#c49000"><path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h3.879a1.5 1.5 0 0 1 1.06.44l1.122 1.12A.5.5 0 0 0 8.92 4H13.5A1.5 1.5 0 0 1 15 5.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 12.5v-9z"/></svg>
              <span>${escapeHtml(pushInfo.repoName)}</span>
              <span id="push-files-count" style="color:#808080;font-size:11.5px;font-weight:normal;"></span>
            </div>
            <div style="display:flex;align-items:center;gap:6px;color:#9aa0a6;">
              <span title="View Options" style="cursor:pointer;font-size:12px;">👁</span>
            </div>
          </div>
          <div id="push-files-container" style="flex:1;overflow-y:auto;padding:6px 8px;">
          </div>
        </div>
      </div>

      <!-- Footer Bar -->
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 16px;background:#2b2d30;border-top:1px solid #323438;user-select:none;">
        <div style="display:flex;align-items:center;gap:12px;">
          <span style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;border:1px solid #5c6164;color:#adb0b8;font-size:11.5px;cursor:pointer;" title="Help">?</span>
          <label style="display:inline-flex;align-items:center;gap:6px;font-size:12.5px;color:#dfe1e5;cursor:pointer;">
            <input type="checkbox" id="chk-push-tags" style="accent-color:#3574f0;width:14px;height:14px;cursor:pointer;">
            <span>Push tags:</span>
          </label>
          <select id="sel-push-tags" style="background:#1e1f22;color:#dfe1e5;border:1px solid #4e5157;border-radius:3px;padding:3px 6px;font-size:12px;outline:none;">
            <option value="all">All</option>
            <option value="current">Current branch</option>
          </select>
        </div>
        <div style="display:flex;align-items:center;gap:10px;position:relative;">
          <button id="btn-push-cancel" style="background:#2b2d30;color:#dfe1e5;border:1px solid #4e5157;border-radius:4px;padding:6px 16px;font-size:12.5px;cursor:pointer;">Cancel</button>
          <div style="display:inline-flex;border-radius:4px;overflow:hidden;box-shadow:0 2px 6px rgba(0,0,0,0.3);">
            <button id="btn-push-submit" style="background:#3574f0;color:#ffffff;border:none;padding:6px 18px;font-size:12.5px;font-weight:600;cursor:pointer;">Push</button>
            <button id="btn-push-menu-trigger" style="background:#3574f0;color:#ffffff;border:none;border-left:1px solid rgba(255,255,255,0.25);padding:6px 8px;font-size:11px;cursor:pointer;" title="Push Options">▼</button>
          </div>
          <div id="push-dropdown-menu" style="display:none;position:absolute;bottom:36px;right:0;background:#2b2d30;border:1px solid #43454a;border-radius:4px;box-shadow:0 8px 24px rgba(0,0,0,0.7);padding:4px 0;z-index:100;min-width:180px;">
            <div id="btn-force-push-opt" style="padding:6px 14px;font-size:12.5px;color:#dfe1e5;cursor:pointer;">Force Push (no-verify)...</div>
          </div>
        </div>
      </div>
    `;

    overlay.appendChild(card);
    document.body.appendChild(overlay);
    activePushDialog = overlay;

    const titleEl = card.querySelector('#push-dialog-title');
    const branchHeader = card.querySelector('#push-branch-header');
    const remoteLabel = card.querySelector('#push-remote-label');
    const remoteDropdown = card.querySelector('#push-remote-dropdown');
    const branchDisplay = card.querySelector('#push-target-branch-display');
    const branchInput = card.querySelector('#push-target-branch-input');
    const newBadge = card.querySelector('#push-new-badge');
    const commitsContainer = card.querySelector('#push-commits-container');
    const filesContainer = card.querySelector('#push-files-container');
    const filesCountEl = card.querySelector('#push-files-count');
    const btnCancel = card.querySelector('#btn-push-cancel');
    const btnSubmit = card.querySelector('#btn-push-submit');
    const btnMenuTrigger = card.querySelector('#btn-push-menu-trigger');
    const dropdownMenu = card.querySelector('#push-dropdown-menu');
    const btnForcePush = card.querySelector('#btn-force-push-opt');
    const chkTags = card.querySelector('#chk-push-tags');
    const dotClose = card.querySelector('.as-push-dot-close');

    // Remote dropdown setup
    if (availableRemotes.length > 0) {
      remoteDropdown.innerHTML = availableRemotes.map(r => `
        <div class="as-remote-opt" data-remote="${escapeAttr(r)}" style="padding:5px 12px;font-size:12px;color:#dfe1e5;cursor:pointer;${r === currentRemote ? 'background:#3574f0;color:#fff;' : ''}">${escapeHtml(r)}</div>
      `).join('');
      remoteDropdown.querySelectorAll('.as-remote-opt').forEach(opt => {
        opt.addEventListener('click', (e) => {
          e.stopPropagation();
          currentRemote = opt.getAttribute('data-remote');
          remoteLabel.textContent = currentRemote;
          if (titleEl) titleEl.textContent = 'Push Commits to ' + currentRemote;
          remoteDropdown.style.display = 'none';
        });
      });
    }

    remoteLabel.addEventListener('click', (e) => {
      e.stopPropagation();
      if (availableRemotes.length > 1) {
        remoteDropdown.style.display = remoteDropdown.style.display === 'none' ? 'block' : 'none';
      }
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('#push-remote-dropdown') && e.target !== remoteLabel) {
        remoteDropdown.style.display = 'none';
      }
    });

    // Inline edit target branch
    branchDisplay.addEventListener('click', (e) => {
      e.stopPropagation();
      branchDisplay.style.display = 'none';
      branchInput.style.display = 'inline-block';
      branchInput.value = currentTargetBranch;
      branchInput.focus();
      branchInput.select();
    });

    function finishEditBranch() {
      const val = branchInput.value.trim();
      if (val) {
        currentTargetBranch = val;
        branchDisplay.textContent = currentTargetBranch;
        if (currentTargetBranch !== pushInfo.currentBranch || pushInfo.isNew) {
          newBadge.style.display = 'inline-block';
        }
      }
      branchInput.style.display = 'none';
      branchDisplay.style.display = 'inline-block';
    }

    branchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        finishEditBranch();
        e.stopPropagation();
      } else if (e.key === 'Escape') {
        branchInput.value = currentTargetBranch;
        branchInput.style.display = 'none';
        branchDisplay.style.display = 'inline-block';
        e.stopPropagation();
      }
    });

    branchInput.addEventListener('blur', () => {
      finishEditBranch();
    });

    function renderCommits() {
      if (commits.length === 0) {
        commitsContainer.innerHTML = '<div style="padding:16px 12px;color:#808080;font-size:12px;">No unpushed commits on this branch.</div>';
        return;
      }
      let html = '';
      commits.forEach(c => {
        const isSel = selectedCommitHash === c.hash;
        const bg = isSel ? '#2d4b73' : 'transparent';
        const textColor = isSel ? '#ffffff' : '#dfe1e5';
        html += `
          <div class="as-push-commit-item" data-hash="${escapeAttr(c.hash)}" style="display:flex;align-items:center;padding:5px 12px 5px 22px;background:${bg};color:${textColor};font-size:12.5px;cursor:pointer;user-select:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
            <span style="overflow:hidden;text-overflow:ellipsis;" title="${escapeHtml(c.message)}">${escapeHtml(c.message)}</span>
          </div>
        `;
      });
      commitsContainer.innerHTML = html;

      commitsContainer.querySelectorAll('.as-push-commit-item').forEach(el => {
        el.addEventListener('click', () => {
          selectedCommitHash = el.getAttribute('data-hash');
          branchHeader.style.background = '#203248';
          renderCommits();
          renderFiles();
        });
      });
    }

    function renderFiles() {
      let currentFiles = [];
      if (selectedCommitHash === 'ALL') {
        currentFiles = totalFiles;
      } else {
        const c = commits.find(x => x.hash === selectedCommitHash);
        currentFiles = c ? c.files : [];
      }

      filesCountEl.textContent = `${currentFiles.length} files`;

      if (currentFiles.length === 0) {
        filesContainer.innerHTML = '<div style="padding:20px;text-align:center;color:#808080;font-size:12px;">No files changed.</div>';
        return;
      }

      const groups = new Map();
      currentFiles.forEach(f => {
        const d = f.dir || '';
        if (!groups.has(d)) groups.set(d, []);
        groups.get(d).push(f);
      });

      let html = '';
      for (const [dir, fList] of groups.entries()) {
        html += `
          <div style="display:flex;align-items:center;gap:6px;padding:3px 6px;color:#9aa0a6;font-size:11.5px;cursor:pointer;font-weight:500;">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h3.879a1.5 1.5 0 0 1 1.06.44l1.122 1.12A.5.5 0 0 0 8.92 4H13.5A1.5 1.5 0 0 1 15 5.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 12.5v-9z"/></svg>
            <span style="color:#dfe1e5;">${escapeHtml(dir || 'root')}</span>
            <span style="color:#808080;font-size:11px;">${fList.length} file${fList.length > 1 ? 's' : ''}</span>
          </div>
        `;
        fList.forEach(file => {
          let statusBadge = '';
          if (file.status === 'M') {
            statusBadge = '<span style="display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;border:1px solid #499c54;border-radius:2px;font-size:9.5px;color:#499c54;font-weight:bold;margin-right:2px;">M</span>';
          } else if (file.status === 'A') {
            statusBadge = '<span style="display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;border:1px solid #62b543;border-radius:2px;font-size:9.5px;color:#62b543;font-weight:bold;margin-right:2px;">A</span>';
          } else if (file.status === 'D') {
            statusBadge = '<span style="display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;border:1px solid #e05555;border-radius:2px;font-size:9.5px;color:#e05555;font-weight:bold;margin-right:2px;">D</span>';
          }
          html += `
            <div class="as-push-file-item" data-path="${escapeAttr(file.path)}" style="display:flex;align-items:center;gap:6px;padding:3px 8px 3px 26px;font-size:12.5px;color:#dfe1e5;cursor:pointer;user-select:none;">
              ${statusBadge}
              ${getFileIcon(file.name)}
              <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(file.name)}</span>
            </div>
          `;
        });
      }
      filesContainer.innerHTML = html;

      filesContainer.querySelectorAll('.as-push-file-item').forEach(el => {
        el.addEventListener('dblclick', () => {
          const filePath = el.getAttribute('data-path');
          if (filePath) {
            vscode.postMessage({
              type: 'openReviewInCenter',
              payload: { filePath, jumpDiff: true, fromFileList: true },
            });
          }
        });
      });
    }

    branchHeader.addEventListener('click', (e) => {
      if (e.target.closest('#push-remote-label') || e.target.closest('#push-remote-dropdown') ||
          e.target.closest('#push-target-branch-display') || e.target.closest('#push-target-branch-input')) {
        return;
      }
      selectedCommitHash = 'ALL';
      branchHeader.style.background = '#2675bf';
      renderCommits();
      renderFiles();
    });

    function close() {
      overlay.remove();
      activePushDialog = null;
    }

    function doPush(force) {
      btnSubmit.disabled = true;
      btnSubmit.textContent = 'Pushing...';
      btnSubmit.style.opacity = '0.7';
      vscode.postMessage({
        type: 'executePush',
        payload: {
          branch: pushInfo.currentBranch,
          targetBranch: currentTargetBranch,
          force: !!force,
          setUpstream: pushInfo.isNew || (currentTargetBranch !== pushInfo.currentBranch),
          remote: currentRemote,
          tags: chkTags.checked,
        },
      });
    }

    btnSubmit.addEventListener('click', () => doPush(false));
    btnCancel.addEventListener('click', close);
    dotClose.addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });

    btnMenuTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdownMenu.style.display = dropdownMenu.style.display === 'none' ? 'block' : 'none';
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('#push-dropdown-menu') && e.target !== btnMenuTrigger) {
        dropdownMenu.style.display = 'none';
      }
    });

    btnForcePush.addEventListener('click', () => {
      dropdownMenu.style.display = 'none';
      doPush(true);
    });

    renderCommits();
    renderFiles();
  }

  // Message listener from extension
  window.addEventListener('message', (event) => {
    const msg = event.data;
    switch (msg.type) {
      case 'showPushDialog': {
        openPushDialog(msg.payload);
        break;
      }
      case 'pushSuccess': {
        if (activePushDialog) {
          activePushDialog.remove();
          activePushDialog = null;
        }
        break;
      }
      case 'pushError': {
        if (activePushDialog) {
          const btn = activePushDialog.querySelector('#btn-push-submit');
          if (btn) {
            btn.disabled = false;
            btn.textContent = 'Push';
            btn.style.opacity = '1';
          }
        }
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

        if (typeof updateConflictsDialog === 'function') {
          updateConflictsDialog();
        }

        // Synchronize checked files strictly with actual git staged status
        state.checkedFiles.clear();
        state.files.forEach(f => {
          if (f.staged && !f.partiallyStaged) {
            state.checkedFiles.add(f.path);
          }
        });

        // Set default commit message if empty
        if (!state.commitMessage && data.defaultCommitMessage) {
          state.commitMessage = data.defaultCommitMessage;
        }

        // Auto select first file if none selected
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
        openConflictsDialog();
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
        state.diffData = msg.payload; // { path, diff }
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

  // Ready message to request initial data
  vscode.postMessage({ type: 'ready' });
})();
