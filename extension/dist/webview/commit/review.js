(function() {
  const vscode = acquireVsCodeApi();

  let state = {
    filePath: '',
    fileName: '',
    fileDir: '',
    diff: '',
    hunks: [],
    filesList: [],
    currentFileIndex: 0
  };

  const app = document.getElementById('app');

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

  function render() {
    app.innerHTML = '';

    const container = document.createElement('div');
    container.className = 'center-review-container';

    // 1. Navigation / Action Bar
    const topBar = document.createElement('div');
    topBar.className = 'review-top-bar';

    const hasPrev = state.currentFileIndex > 0;
    const hasNext = state.currentFileIndex < state.filesList.length - 1;

    topBar.innerHTML = `
      <div class="review-file-nav">
        <button class="nav-btn ${!hasPrev ? 'disabled' : ''}" id="btn-prev-file" title="Previous File (Alt+Left)">◀</button>
        <button class="nav-btn ${!hasNext ? 'disabled' : ''}" id="btn-next-file" title="Next File (Alt+Right)">▶</button>
        <div class="review-file-title">
          <span class="file-name-bold">${escapeHtml(state.fileName)}</span>
          <span class="file-dir-muted">${escapeHtml(state.fileDir)}</span>
        </div>
      </div>
      <div class="review-actions">
        <button class="action-btn" id="btn-prev-diff" title="Previous Difference (F7)">▲ Prev Difference</button>
        <button class="action-btn" id="btn-next-diff" title="Next Difference (Shift+F7)">▼ Next Difference</button>
        <button class="action-btn" id="btn-rollback-hunk" title="Rollback Current Hunk">↶ Rollback</button>
        <button class="action-btn" id="btn-refresh-diff" title="Refresh Diff">↻ Refresh</button>
      </div>
    `;
    container.appendChild(topBar);

    // 2. Diff Content Scroll Area
    const diffScroll = document.createElement('div');
    diffScroll.className = 'review-diff-scroll';

    if (!state.diff || !state.diff.trim()) {
      diffScroll.innerHTML = `
        <div class="diff-empty-state">
          <div class="empty-icon">✓</div>
          <div class="empty-title">No local changes in this file</div>
          <div class="empty-sub">Working tree matches HEAD.</div>
        </div>
      `;
      container.appendChild(diffScroll);
      app.appendChild(container);
      attachTopBarEvents(topBar);
      return;
    }

    state.hunks = parseDiff(state.diff, state.filePath);
    if (state.hunks.length === 0) {
      diffScroll.innerHTML = `
        <div class="diff-empty-state">
          <div class="empty-title">No text differences found</div>
        </div>
      `;
      container.appendChild(diffScroll);
      app.appendChild(container);
      attachTopBarEvents(topBar);
      return;
    }

    state.hunks.forEach((hunk, hIdx) => {
      // Hunk header bar
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
          diffScroll.querySelectorAll(`.line-chk[data-hunk="${hIdx}"]`).forEach(c => {
            c.checked = check;
          });
        }
        const patchContent = constructHunkPatch(state.filePath, hunk);
        if (check) {
          vscode.postMessage({ type: 'applyHunkPatch', payload: { patch: patchContent, reverse: false } });
        } else {
          vscode.postMessage({ type: 'applyHunkPatch', payload: { patch: patchContent, reverse: true } });
        }
      });

      diffScroll.appendChild(hunkHeader);

      // Render lines
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

            const patchContent = constructBlockPatch(state.filePath, hunk, block);
            if (check) {
              vscode.postMessage({ type: 'applyHunkPatch', payload: { patch: patchContent, reverse: false } });
            } else {
              vscode.postMessage({ type: 'applyHunkPatch', payload: { patch: patchContent, reverse: true } });
            }
          });
        }

        diffScroll.appendChild(lineRow);
      });
    });

    container.appendChild(diffScroll);
    app.appendChild(container);
    attachTopBarEvents(topBar);
  }

  function attachTopBarEvents(topBar) {
    const btnPrev = topBar.querySelector('#btn-prev-file');
    if (btnPrev) {
      btnPrev.addEventListener('click', () => {
        if (state.currentFileIndex > 0) {
          vscode.postMessage({ type: 'navigateFile', payload: state.currentFileIndex - 1 });
        }
      });
    }

    const btnNext = topBar.querySelector('#btn-next-file');
    if (btnNext) {
      btnNext.addEventListener('click', () => {
        if (state.currentFileIndex < state.filesList.length - 1) {
          vscode.postMessage({ type: 'navigateFile', payload: state.currentFileIndex + 1 });
        }
      });
    }

    const btnRefresh = topBar.querySelector('#btn-refresh-diff');
    if (btnRefresh) {
      btnRefresh.addEventListener('click', () => {
        vscode.postMessage({ type: 'refreshDiff', payload: state.filePath });
      });
    }

    const btnPrevDiff = topBar.querySelector('#btn-prev-diff');
    if (btnPrevDiff) {
      btnPrevDiff.addEventListener('click', () => {
        scrollToDiff(-1);
      });
    }

    const btnNextDiff = topBar.querySelector('#btn-next-diff');
    if (btnNextDiff) {
      btnNextDiff.addEventListener('click', () => {
        scrollToDiff(1);
      });
    }

    const btnRollbackHunk = topBar.querySelector('#btn-rollback-hunk');
    if (btnRollbackHunk) {
      btnRollbackHunk.addEventListener('click', () => {
        if (state.hunks.length > 0) {
          const patchContent = constructHunkPatch(state.filePath, state.hunks[0]);
          vscode.postMessage({ type: 'rollbackHunk', payload: { patch: patchContent, path: state.filePath } });
        }
      });
    }
  }

  function scrollToDiff(dir) {
    const changes = document.querySelectorAll('.diff-add, .diff-del');
    if (changes.length === 0) return;
    const scrollContainer = document.querySelector('.review-diff-scroll');
    if (!scrollContainer) return;

    const currentScroll = scrollContainer.scrollTop;
    let target = null;

    if (dir > 0) {
      for (const el of changes) {
        if (el.offsetTop > currentScroll + 30) {
          target = el;
          break;
        }
      }
      if (!target) target = changes[0];
    } else {
      for (let i = changes.length - 1; i >= 0; i--) {
        const el = changes[i];
        if (el.offsetTop < currentScroll - 30) {
          target = el;
          break;
        }
      }
      if (!target) target = changes[changes.length - 1];
    }

    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function constructHunkPatch(filePath, hunk) {
    let patch = `--- a/${filePath}\n+++ b/${filePath}\n`;
    patch += hunk.rawLines.join('\n') + '\n';
    return patch;
  }

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

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  window.addEventListener('message', (event) => {
    const msg = event.data;
    switch (msg.type) {
      case 'fileDiff': {
        const data = msg.payload;
        state.filePath = data.path || '';
        state.fileName = state.filePath.split('/').pop() || '';
        state.fileDir = state.filePath.split('/').slice(0, -1).join('/');
        state.diff = data.diff || '';
        state.filesList = data.filesList || [];
        state.currentFileIndex = data.currentFileIndex || 0;
        render();
        break;
      }
    }
  });

  vscode.postMessage({ type: 'ready' });
})();
