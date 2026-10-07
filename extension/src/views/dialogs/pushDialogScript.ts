export function getPushDialogScript(rawPushInfo: string): string {
  return `
    const vscode = acquireVsCodeApi();
    let pushInfo = ${rawPushInfo};

    let selectedCommitHash = 'ALL';
    let currentRemote = pushInfo.remote;
    let currentTargetBranch = pushInfo.remoteBranch || pushInfo.currentBranch;
    const availableRemotes = (pushInfo.remotes && pushInfo.remotes.length > 0) ? pushInfo.remotes : [currentRemote];

    const titleEl = document.getElementById('push-dialog-title');
    const branchHeader = document.getElementById('push-branch-header');
    const currentBranchEl = document.getElementById('push-current-branch');
    const remoteLabel = document.getElementById('push-remote-label');
    const remoteDropdown = document.getElementById('push-remote-dropdown');
    const branchDisplay = document.getElementById('push-target-branch-display');
    const branchInput = document.getElementById('push-target-branch-input');
    const newBadge = document.getElementById('push-new-badge');
    const commitsContainer = document.getElementById('push-commits-container');
    const filesContainer = document.getElementById('push-files-container');
    const filesCountEl = document.getElementById('push-files-count');
    const repoNameEl = document.getElementById('push-repo-name');
    const btnCancel = document.getElementById('btn-push-cancel');
    const btnSubmit = document.getElementById('btn-push-submit');
    const btnMenuTrigger = document.getElementById('btn-push-menu-trigger');
    const dropdownMenu = document.getElementById('push-dropdown-menu');
    const btnForcePush = document.getElementById('btn-force-push-opt');
    const chkTags = document.getElementById('chk-push-tags');

    function escapeHtml(str) {
      if (!str) return '';
      return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    function escapeAttr(str) {
      return escapeHtml(str);
    }

    function initUI() {
      if (titleEl) titleEl.textContent = 'Push Commits to ' + currentRemote;
      currentBranchEl.textContent = pushInfo.currentBranch;
      currentBranchEl.title = pushInfo.currentBranch;
      remoteLabel.textContent = currentRemote;
      branchDisplay.textContent = currentTargetBranch;
      branchDisplay.title = 'Click to edit remote branch name: ' + currentTargetBranch;
      branchInput.value = currentTargetBranch;
      repoNameEl.textContent = pushInfo.repoName;
      repoNameEl.title = pushInfo.repoName;
      newBadge.style.display = pushInfo.isNew ? 'inline-block' : 'none';

      // Setup remotes dropdown
      remoteDropdown.innerHTML = '';
      availableRemotes.forEach(r => {
        const item = document.createElement('div');
        item.className = 'as-dropdown-item';
        item.textContent = r;
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          currentRemote = r;
          remoteLabel.textContent = r;
          if (titleEl) titleEl.textContent = 'Push Commits to ' + r;
          remoteDropdown.style.display = 'none';
        });
        remoteDropdown.appendChild(item);
      });

      renderCommits();
      renderFiles();
    }

    function renderCommits() {
      const commits = pushInfo.commits || [];
      if (commits.length === 0) {
        commitsContainer.innerHTML = '<div style="padding:16px;text-align:center;color:#808080;font-size:12px;">No unpushed commits found.</div>';
        return;
      }
      let html = '';
      commits.forEach(c => {
        const isSel = selectedCommitHash === c.hash;
        html += '<div class="as-commit-item' + (isSel ? ' selected' : '') + '" data-hash="' + escapeAttr(c.hash) + '">';
        html += '<span style="font-family:monospace;font-size:11.5px;color:#a9b7c6;font-weight:600;">' + escapeHtml(c.shortHash) + '</span>';
        html += '<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;">' + escapeHtml(c.message) + '</span>';
        html += '</div>';
      });
      commitsContainer.innerHTML = html;

      commitsContainer.querySelectorAll('.as-commit-item').forEach(el => {
        el.addEventListener('click', () => {
          selectedCommitHash = el.getAttribute('data-hash');
          branchHeader.style.background = 'var(--vscode-list-inactiveSelectionBackground, #203248)';
          renderCommits();
          renderFiles();
        });
      });
    }

    function renderFiles() {
      let currentFiles = [];
      const commits = pushInfo.commits || [];
      const totalFiles = pushInfo.totalFiles || [];
      if (selectedCommitHash === 'ALL') {
        currentFiles = totalFiles;
      } else {
        const c = commits.find(x => x.hash === selectedCommitHash);
        currentFiles = c ? c.files : [];
      }

      filesCountEl.textContent = currentFiles.length + ' file' + (currentFiles.length > 1 ? 's' : '');

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
        html += '<div style="display:flex;align-items:center;gap:6px;padding:3px 6px;color:#9aa0a6;font-size:11.5px;cursor:pointer;font-weight:500;">';
        html += '<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h3.879a1.5 1.5 0 0 1 1.06.44l1.122 1.12A.5.5 0 0 0 8.92 4H13.5A1.5 1.5 0 0 1 15 5.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 12.5v-9z"/></svg>';
        html += '<span style="color:#dfe1e5;">' + escapeHtml(dir || 'root') + '</span>';
        html += '<span style="color:#808080;font-size:11px;">' + fList.length + ' file' + (fList.length > 1 ? 's' : '') + '</span>';
        html += '</div>';

        fList.forEach(file => {
          let statusBadge = '';
          if (file.status === 'M') {
            statusBadge = '<span style="display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;border:1px solid #499c54;border-radius:2px;font-size:9.5px;color:#499c54;font-weight:bold;margin-right:2px;">M</span>';
          } else if (file.status === 'A') {
            statusBadge = '<span style="display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;border:1px solid #62b543;border-radius:2px;font-size:9.5px;color:#62b543;font-weight:bold;margin-right:2px;">A</span>';
          } else if (file.status === 'D') {
            statusBadge = '<span style="display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;border:1px solid #e05555;border-radius:2px;font-size:9.5px;color:#e05555;font-weight:bold;margin-right:2px;">D</span>';
          }
          html += '<div class="as-file-item" data-path="' + escapeAttr(file.path) + '">';
          html += statusBadge;
          html += getFileIcon(file.name);
          html += '<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + escapeHtml(file.name) + '</span>';
          html += '</div>';
        });
      }
      filesContainer.innerHTML = html;

      filesContainer.querySelectorAll('.as-file-item').forEach(el => {
        el.addEventListener('click', () => {
          filesContainer.querySelectorAll('.as-file-item.selected').forEach(item => item.classList.remove('selected'));
          el.classList.add('selected');
        });

        el.addEventListener('dblclick', () => {
          filesContainer.querySelectorAll('.as-file-item.selected').forEach(item => item.classList.remove('selected'));
          el.classList.add('selected');
          const filePath = el.getAttribute('data-path');
          if (filePath) {
            vscode.postMessage({
              type: 'openReviewInCenter',
              payload: {
                filePath,
                commitHash: selectedCommitHash,
                filesList: currentFiles.map(f => f.path),
              },
            });
          }
        });
      });
    }

    // Branch header click to reset to ALL
    branchHeader.addEventListener('click', (e) => {
      if (e.target.closest('#push-remote-label') || e.target.closest('#push-remote-dropdown') ||
          e.target.closest('#push-target-branch-display') || e.target.closest('#push-target-branch-input')) {
        return;
      }
      selectedCommitHash = 'ALL';
      branchHeader.style.background = 'var(--vscode-button-background, #2675bf)';
      renderCommits();
      renderFiles();
    });

    // Remote dropdown trigger
    remoteLabel.addEventListener('click', (e) => {
      e.stopPropagation();
      const isHidden = remoteDropdown.style.display === 'none';
      remoteDropdown.style.display = isHidden ? 'block' : 'none';
      branchHeader.style.zIndex = isHidden ? '100' : '5';
    });

    // Target branch editing
    branchDisplay.addEventListener('click', (e) => {
      e.stopPropagation();
      branchDisplay.style.display = 'none';
      branchInput.style.display = 'inline-block';
      branchInput.focus();
      branchInput.select();
    });

    function commitBranchInput() {
      const val = branchInput.value.trim();
      if (val) {
        currentTargetBranch = val;
        branchDisplay.textContent = val;
      }
      branchInput.style.display = 'none';
      branchDisplay.style.display = 'inline-block';
    }

    branchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') commitBranchInput();
      if (e.key === 'Escape') {
        branchInput.value = currentTargetBranch;
        branchInput.style.display = 'none';
        branchDisplay.style.display = 'inline-block';
      }
    });
    branchInput.addEventListener('blur', commitBranchInput);

    function closeDialog() {
      vscode.postMessage({ type: 'close' });
    }

    function doPush(force) {
      btnSubmit.disabled = true;
      btnSubmit.textContent = 'Pushing...';
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
    btnCancel.addEventListener('click', closeDialog);

    btnMenuTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdownMenu.style.display = dropdownMenu.style.display === 'none' ? 'block' : 'none';
    });

    btnForcePush.addEventListener('click', () => {
      dropdownMenu.style.display = 'none';
      doPush(true);
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('#push-dropdown-menu') && e.target !== btnMenuTrigger) {
        dropdownMenu.style.display = 'none';
      }
      if (!e.target.closest('#push-remote-dropdown') && e.target !== remoteLabel) {
        remoteDropdown.style.display = 'none';
        branchHeader.style.zIndex = '5';
      }
    });

    // Keyboard shortcuts: Esc to close, Cmd/Ctrl+Enter to Push
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeDialog();
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') doPush(false);
    });

    // Listen to messages from extension
    window.addEventListener('message', (event) => {
      const msg = event.data;
      if (msg.type === 'pushFailed') {
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Push';
      } else if (msg.type === 'updatePushInfo') {
        pushInfo = msg.payload;
        initUI();
      }
    });

    // Resizable splitter logic
    const splitter = document.getElementById('as-splitter');
    const leftCol = document.getElementById('as-col-left');
    const bodyContainer = document.getElementById('as-body-container');

    if (splitter && leftCol && bodyContainer) {
      let isDragging = false;
      let startX = 0;
      let startWidth = 0;

      splitter.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        startWidth = leftCol.getBoundingClientRect().width;
        splitter.classList.add('dragging');
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        e.preventDefault();
      });

      window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const totalWidth = bodyContainer.getBoundingClientRect().width;
        const deltaX = e.clientX - startX;
        let newWidth = startWidth + deltaX;
        const minW = 180;
        const maxW = totalWidth - minW;
        if (newWidth < minW) newWidth = minW;
        if (newWidth > maxW) newWidth = maxW;
        leftCol.style.width = newWidth + 'px';
      });

      window.addEventListener('mouseup', () => {
        if (isDragging) {
          isDragging = false;
          splitter.classList.remove('dragging');
          document.body.style.cursor = '';
          document.body.style.userSelect = '';
        }
      });
    }

    initUI();
`;
}
