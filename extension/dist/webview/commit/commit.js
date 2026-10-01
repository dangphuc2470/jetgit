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
    commitOptionsOpen: false,
    recentOpen: false,
    isGeneratingAi: false,
    conflictInfo: null,
    splitRatio: 0.6 // 60% file tree, 40% commit box
  };

  const app = document.getElementById('app');

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

    // 2. Toolbar
    const toolbar = document.createElement('div');
    toolbar.className = 'commit-toolbar';

    const hasConflictState = state.conflictInfo && (state.conflictInfo.hasConflicts || state.conflictInfo.isMerging || state.conflictInfo.isRebasing);
    const conflictButtonsHtml = hasConflictState ? `
        <div style="width: 1px; height: 16px; background: rgba(255,255,255,0.15); margin: 0 4px;"></div>
        <button class="tool-btn btn-conflict-resolve" id="btn-resolve-conflicts" title="Resolve Conflicts..." style="color: #62b543; display: inline-flex; align-items: center; justify-content: center;">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path fill-rule="evenodd" d="M3.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L9.293 8 3.646 2.354a.5.5 0 0 1 0-.708z"/>
            <path fill-rule="evenodd" d="M7.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L13.293 8 7.646 2.354a.5.5 0 0 1 0-.708z"/>
          </svg>
        </button>
        <button class="tool-btn btn-conflict-abort" id="btn-abort-merge" title="Abort Merge / Rebase" style="color: #e05555; display: inline-flex; align-items: center; justify-content: center;">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
          </svg>
        </button>
    ` : '';

    toolbar.innerHTML = `
      <div class="tool-left">
        <button class="tool-btn" id="btn-refresh" title="Refresh (Cmd+R)">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M13.65 2.35A7.958 7.958 0 0 0 8 0a8 8 0 1 0 8 8h-2a6 6 0 1 1-1.76-4.24l-2.24 2.24H16V0l-2.35 2.35z"/></svg>
        </button>
        <button class="tool-btn" id="btn-rollback" title="Rollback (Cmd+Alt+Z)">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M3.5 6.5A5.5 5.5 0 1 1 9 12h-1a4.5 4.5 0 1 0-4.5-4.5H6L2.5 3 0 6.5h3.5z"/></svg>
        </button>
        <button class="tool-btn ${state.showDiff ? 'active' : ''}" id="btn-show-diff" title="Show Diff / Review (Cmd+D)">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M4 1v14h8V1H4zm1 2h6v10H5V3zm2 2v2h2V5H7zm0 4v2h2V9H7z"/></svg>
        </button>
        <button class="tool-btn" id="btn-view-options" title="View Options">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><circle cx="8" cy="8" r="3"/><path d="M8 2.5C4 2.5 1 8 1 8s3 5.5 7 5.5 7-5.5 7-5.5-3-5.5-7-5.5zm0 9C5.5 11.5 3 8 3 8s2.5-3.5 5-3.5 5 3.5 5 3.5-2.5 3.5-5 3.5z"/></svg>
        </button>
        <button class="tool-btn" id="btn-toggle-expand" title="Expand / Collapse All">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1L4 5h8L8 1zM8 15l4-4H4l4 4z"/></svg>
        </button>
        <button class="tool-btn" id="btn-clear" title="Clear / Deselect All">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>
        </button>
        ${conflictButtonsHtml}
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

    // Render Unversioned group
    const unversionedGroup = renderFileGroup(
      'Unversioned Files',
      unversionedFiles,
      state.expandUnversioned,
      'toggleUnversioned',
      'checkAllUnversioned'
    );
    treeContainer.appendChild(unversionedGroup);

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
        <label class="checkbox-label amend-label">
          <input type="checkbox" id="chk-amend" ${state.isAmend ? 'checked' : ''}/>
          <span>Amend</span>
        </label>
        <div class="commit-icon-tools">
          <button class="tool-btn-sm" id="btn-recent-msgs" title="Recent Commit Messages">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
              <circle cx="8" cy="8" r="6.5"/>
              <polyline points="8 4 8 8 10.5 9.5"/>
            </svg>
          </button>
          <button class="tool-btn-sm ${state.isGeneratingAi ? 'spinning' : ''}" id="btn-generate-ai" title="${state.isGeneratingAi ? 'Generating commit message with AI... Please wait.' : 'Generate Commit Message with AI'}" ${state.isGeneratingAi ? 'disabled' : ''}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
              <path d="M8 1.5L9.5 6.5L14.5 8L9.5 9.5L8 14.5L6.5 9.5L1.5 8L6.5 6.5L8 1.5Z"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="commit-input-wrapper">
        <textarea id="commit-message-input" class="${state.isGeneratingAi ? 'ai-generating' : ''}" placeholder="${state.isGeneratingAi ? 'Generating commit message with AI... Please wait...' : 'Commit message...'}">${escapeHtml(state.commitMessage)}</textarea>
        ${state.isGeneratingAi ? '<div class="ai-status-bar"><span class="ai-status-dot"></span><span>AI is generating commit message...</span></div>' : ''}
        ${state.recentOpen ? renderRecentMessagesDropdown() : ''}
      </div>

      <div class="commit-actions-bar">
        <div class="action-buttons-group">
          <button class="btn-commit-primary" id="btn-commit">Commit</button>
          <button class="btn-commit-secondary" id="btn-commit-push">Commit and Push...</button>
        </div>
        <div class="commit-gear-wrapper">
          <button class="tool-btn-sm" id="btn-commit-gear" title="Before Commit Settings">⚙</button>
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
    attachToolbarEvents(toolbar);
    attachTreeEvents(treeContainer);
    attachCommitBoxEvents(commitBox);
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
      <span class="group-arrow ${expanded ? 'expanded' : ''}">▶</span>
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

    if (expanded) {
      const itemsContainer = document.createElement('div');
      itemsContainer.className = 'group-items';

      files.forEach(file => {
        const itemEl = document.createElement('div');
        const isSelected = state.selectedFile === file.path;
        const isPartiallyStaged = file.partiallyStaged || (file.totalChanges > 0 && file.stagedChanges > 0 && file.stagedChanges < file.totalChanges);
        const isChecked = !isPartiallyStaged && (state.checkedFiles.has(file.path) || (file.staged && !isPartiallyStaged));
        itemEl.className = `file-item ${isSelected ? 'selected' : ''}`;

        const isUnversioned = file.isUntracked;
        const nameColorClass = isUnversioned ? 'name-unversioned' : 'name-modified';

        let badgeHtml = '';
        if (isPartiallyStaged) {
          badgeHtml = `<span class="file-changes-badge">${file.stagedChanges} of ${file.totalChanges} changes</span>`;
        }

        itemEl.innerHTML = `
          <input type="checkbox" class="file-chk" ${isChecked ? 'checked' : ''}/>
          <span class="file-icon">${getFileIcon(file.name)}</span>
          <span class="file-name ${nameColorClass}">${escapeHtml(file.name)}</span>
          ${state.showPaths && file.dir ? `<span class="file-dir">${escapeHtml(file.dir)}</span>` : ''}
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

        itemsContainer.appendChild(itemEl);
      });

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
        <label class="gear-item"><input type="checkbox"/> Reformat code</label>
        <label class="gear-item"><input type="checkbox"/> Rearrange code</label>
        <label class="gear-item"><input type="checkbox"/> Optimize imports</label>
        <label class="gear-item"><input type="checkbox"/> Clean up</label>
        <div class="gear-divider"></div>
        <label class="gear-item"><input type="checkbox"/> Check TODO (0)</label>
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
  function attachToolbarEvents(toolbar) {
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

    toolbar.querySelector('#btn-view-options').addEventListener('click', () => {
      state.showPaths = !state.showPaths;
      render();
    });

    toolbar.querySelector('#btn-toggle-expand').addEventListener('click', () => {
      const anyExpanded = state.expandChanges || state.expandUnversioned;
      state.expandChanges = !anyExpanded;
      state.expandUnversioned = !anyExpanded;
      render();
    });

    toolbar.querySelector('#btn-clear').addEventListener('click', () => {
      state.checkedFiles.clear();
      render();
    });

    const btnResolve = toolbar.querySelector('#btn-resolve-conflicts');
    if (btnResolve) {
      btnResolve.addEventListener('click', () => {
        openConflictsDialog();
      });
    }

    const btnAbort = toolbar.querySelector('#btn-abort-merge');
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
      if (state.recentOpen || state.commitOptionsOpen) {
        if (!e.target.closest('#recent-dropdown') && !e.target.closest('#btn-recent-msgs') &&
            !e.target.closest('#gear-dropdown') && !e.target.closest('#btn-commit-gear')) {
          state.recentOpen = false;
          state.commitOptionsOpen = false;
          render();
        }
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

  // Message listener from extension
  window.addEventListener('message', (event) => {
    const msg = event.data;
    switch (msg.type) {
      case 'init':
      case 'status': {
        const data = msg.payload;
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

  // Ready message to request initial data
  vscode.postMessage({ type: 'ready' });
})();
