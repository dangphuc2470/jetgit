(function() {
  const vscode = acquireVsCodeApi();

  let state = {
    filePath: '',
    fileName: '',
    fileDir: '',
    diff: '',
    baseContent: '',
    currentContent: '',
    filesList: [],
    currentFileIndex: 0,
    viewMode: 'side-by-side', // 'side-by-side' | 'unified'
    highlightWords: true,
    rows: [],
    blocks: [],
    currentDiffIndex: 0
  };

  const app = document.getElementById('app');

  // Tokenize string into words, symbols, whitespace
  function tokenize(str) {
    if (!str) return [];
    return str.match(/[a-zA-Z0-9_]+|[^\sa-zA-Z0-9_]+|\s+/g) || [str];
  }

  // Word-level diff for modified lines
  function computeWordDiff(leftStr, rightStr) {
    if (!state.highlightWords) {
      return {
        leftHtml: escapeHtml(leftStr),
        rightHtml: escapeHtml(rightStr)
      };
    }

    const leftTokens = tokenize(leftStr);
    const rightTokens = tokenize(rightStr);

    let start = 0;
    while (start < leftTokens.length && start < rightTokens.length && leftTokens[start] === rightTokens[start]) {
      start++;
    }
    let endLeft = leftTokens.length - 1;
    let endRight = rightTokens.length - 1;
    while (endLeft >= start && endRight >= start && leftTokens[endLeft] === rightTokens[endRight]) {
      endLeft--;
      endRight--;
    }

    const render = (tokens, changeStart, changeEnd, cls) => {
      let html = '';
      for (let i = 0; i < tokens.length; i++) {
        const text = escapeHtml(tokens[i]);
        if (i >= changeStart && i <= changeEnd) {
          html += `<span class="${cls}">${text}</span>`;
        } else {
          html += text;
        }
      }
      return html;
    };

    return {
      leftHtml: render(leftTokens, start, endLeft, 'diff-word-mod-left'),
      rightHtml: render(rightTokens, start, endRight, 'diff-word-mod-right')
    };
  }

  // Parse git raw diff into hunks
  function parseGitHunks(rawDiff) {
    if (!rawDiff || !rawDiff.trim()) return [];
    const lines = rawDiff.split('\n');
    const hunks = [];
    let currentHunk = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('@@')) {
        const match = line.match(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
        if (match) {
          currentHunk = {
            header: line,
            oldStart: parseInt(match[1], 10),
            oldCount: match[2] !== undefined ? parseInt(match[2], 10) : 1,
            newStart: parseInt(match[3], 10),
            newCount: match[4] !== undefined ? parseInt(match[4], 10) : 1,
            diffLines: [],
            rawLines: [line]
          };
          hunks.push(currentHunk);
        }
      } else if (currentHunk) {
        currentHunk.rawLines.push(line);
        if (line.startsWith('+') || line.startsWith('-') || line.startsWith(' ')) {
          currentHunk.diffLines.push(line);
        }
      }
    }
    return hunks;
  }

  // Build full-file side-by-side aligned rows from baseContent, currentContent and hunks
  function buildSideBySideModel() {
    const baseLines = state.baseContent ? state.baseContent.split('\n') : [];
    const currentLines = state.currentContent ? state.currentContent.split('\n') : [];
    const hunks = parseGitHunks(state.diff);

    const rows = [];
    const blocks = [];
    let basePtr = 1;
    let currentPtr = 1;

    // Helper to add unchanged row
    function addUnchangedRow(bNum, cNum, text) {
      rows.push({
        type: 'none',
        leftNum: bNum,
        leftText: escapeHtml(text),
        rightNum: cNum,
        rightText: escapeHtml(text),
        isBlockStart: false,
        block: null
      });
    }

    if (hunks.length === 0) {
      // Either untracked file, deleted file, or identical file
      if (baseLines.length === 0 && currentLines.length > 0) {
        // Purely untracked / new file
        const block = { id: 0, type: 'add', startIndex: 0, lineCount: currentLines.length, staged: true };
        blocks.push(block);
        currentLines.forEach((line, idx) => {
          rows.push({
            type: 'add',
            leftNum: '',
            leftText: '',
            rightNum: idx + 1,
            rightText: escapeHtml(line),
            isBlockStart: idx === 0,
            block: block
          });
        });
      } else if (currentLines.length === 0 && baseLines.length > 0) {
        // Purely deleted file
        const block = { id: 0, type: 'del', startIndex: 0, lineCount: baseLines.length, staged: true };
        blocks.push(block);
        baseLines.forEach((line, idx) => {
          rows.push({
            type: 'del',
            leftNum: idx + 1,
            leftText: escapeHtml(line),
            rightNum: '',
            rightText: '',
            isBlockStart: idx === 0,
            block: block
          });
        });
      } else {
        // Identical file
        const maxLen = Math.max(baseLines.length, currentLines.length);
        for (let i = 0; i < maxLen; i++) {
          const bText = baseLines[i] !== undefined ? baseLines[i] : '';
          const cText = currentLines[i] !== undefined ? currentLines[i] : '';
          addUnchangedRow(i + 1, i + 1, bText || cText);
        }
      }
      state.rows = rows;
      state.blocks = blocks;
      return;
    }

    // Process file against hunks
    hunks.forEach((hunk, hIdx) => {
      // 1. Unchanged rows before this hunk
      while (basePtr < hunk.oldStart && currentPtr < hunk.newStart && basePtr <= baseLines.length) {
        const text = baseLines[basePtr - 1] !== undefined ? baseLines[basePtr - 1] : (currentLines[currentPtr - 1] || '');
        addUnchangedRow(basePtr, currentPtr, text);
        basePtr++;
        currentPtr++;
      }

      // If one pointer fell behind due to start offsets
      while (basePtr < hunk.oldStart && basePtr <= baseLines.length) {
        addUnchangedRow(basePtr, '', baseLines[basePtr - 1]);
        basePtr++;
      }
      while (currentPtr < hunk.newStart && currentPtr <= currentLines.length) {
        addUnchangedRow('', currentPtr, currentLines[currentPtr - 1]);
        currentPtr++;
      }

      // 2. Parse inside this hunk into chunks of context and changes
      let dIdx = 0;
      while (dIdx < hunk.diffLines.length) {
        const dLine = hunk.diffLines[dIdx];
        if (dLine.startsWith(' ')) {
          const text = dLine.slice(1);
          addUnchangedRow(basePtr, currentPtr, text);
          basePtr++;
          currentPtr++;
          dIdx++;
        } else {
          // Changed block: sequence of '-' and '+'
          const dels = [];
          const adds = [];
          const hunkRawLines = [hunk.header];

          while (dIdx < hunk.diffLines.length && (hunk.diffLines[dIdx].startsWith('-') || hunk.diffLines[dIdx].startsWith('+'))) {
            const cur = hunk.diffLines[dIdx];
            hunkRawLines.push(cur);
            if (cur.startsWith('-')) {
              dels.push({ text: cur.slice(1), lineNum: basePtr++ });
            } else if (cur.startsWith('+')) {
              adds.push({ text: cur.slice(1), lineNum: currentPtr++ });
            }
            dIdx++;
          }

          // Determine block type: 'mod' (blue), 'add' (green), 'del' (red)
          let blockType = 'mod';
          if (dels.length > 0 && adds.length === 0) blockType = 'del';
          else if (adds.length > 0 && dels.length === 0) blockType = 'add';
          else blockType = 'mod'; // Modified: words/spaces/numbers changed

          const block = {
            id: blocks.length,
            type: blockType,
            startIndex: rows.length,
            lineCount: Math.max(dels.length, adds.length),
            staged: true,
            hunkIndex: hIdx,
            hunk: hunk,
            patchContent: constructHunkPatch(state.filePath, hunk)
          };
          blocks.push(block);

          const maxLines = Math.max(dels.length, adds.length);
          for (let m = 0; m < maxLines; m++) {
            const hasLeft = m < dels.length;
            const hasRight = m < adds.length;
            const isFirst = (m === 0);

            if (hasLeft && hasRight) {
              // Line modified: compute word diff (blue highlight)
              const wDiff = computeWordDiff(dels[m].text, adds[m].text);
              rows.push({
                type: 'mod',
                leftNum: dels[m].lineNum,
                leftHtml: wDiff.leftHtml,
                rightNum: adds[m].lineNum,
                rightHtml: wDiff.rightHtml,
                isBlockStart: isFirst,
                block: block
              });
            } else if (hasLeft && !hasRight) {
              // Deleted line (red highlight)
              rows.push({
                type: 'del',
                leftNum: dels[m].lineNum,
                leftHtml: `<span class="diff-word-del">${escapeHtml(dels[m].text)}</span>`,
                rightNum: '',
                rightHtml: '',
                isBlockStart: isFirst,
                block: block
              });
            } else if (!hasLeft && hasRight) {
              // Added line (green highlight)
              rows.push({
                type: 'add',
                leftNum: '',
                leftHtml: '',
                rightNum: adds[m].lineNum,
                rightHtml: `<span class="diff-word-add">${escapeHtml(adds[m].text)}</span>`,
                isBlockStart: isFirst,
                block: block
              });
            }
          }
        }
      }
    });

    // 3. Trailing unchanged rows after all hunks
    const maxRemaining = Math.max(baseLines.length - basePtr + 1, currentLines.length - currentPtr + 1);
    for (let r = 0; r < maxRemaining; r++) {
      const bNum = basePtr <= baseLines.length ? basePtr : '';
      const cNum = currentPtr <= currentLines.length ? currentPtr : '';
      const text = (bNum && baseLines[basePtr - 1] !== undefined) ? baseLines[basePtr - 1] : (currentLines[currentPtr - 1] || '');
      addUnchangedRow(bNum, cNum, text);
      if (bNum) basePtr++;
      if (cNum) currentPtr++;
    }

    state.rows = rows;
    state.blocks = blocks;
  }

  // Construct a standard unified patch for a hunk
  function constructHunkPatch(filePath, hunk) {
    let patch = `--- a/${filePath}\n+++ b/${filePath}\n`;
    patch += hunk.header + '\n';
    hunk.rawLines.slice(1).forEach(l => {
      patch += l + '\n';
    });
    return patch;
  }

  // Render the whole review interface
  function render() {
    app.innerHTML = '';

    buildSideBySideModel();

    const root = document.createElement('div');
    root.className = 'studio-diff-container';

    // 1. Top Android Studio Toolbar
    const toolbar = document.createElement('div');
    toolbar.className = 'studio-toolbar';

    const hasPrev = state.currentFileIndex > 0;
    const hasNext = state.currentFileIndex < state.filesList.length - 1;
    const diffCount = state.blocks.length;

    toolbar.innerHTML = `
      <div class="toolbar-left-group">
        <div class="dropdown-pill">
          <span class="pill-text">${state.viewMode === 'side-by-side' ? 'Side-by-side viewer' : 'Unified viewer'}</span>
          <span class="pill-arrow">▾</span>
        </div>
        <div class="dropdown-pill" id="pill-highlight-words">
          <span class="pill-text">${state.highlightWords ? 'Highlight words' : 'Do not highlight'}</span>
          <span class="pill-arrow">▾</span>
        </div>
        <div class="file-breadcrumb">
          <span class="file-name-main">${escapeHtml(state.fileName || state.filePath)}</span>
          ${state.fileDir ? `<span class="file-dir-sub">${escapeHtml(state.fileDir)}</span>` : ''}
        </div>
      </div>

      <div class="toolbar-right-group">
        <div class="diff-counter-pill">
          <span class="counter-text">${diffCount} ${diffCount === 1 ? 'difference' : 'differences'}</span>
          <button class="arrow-btn" id="btn-prev-diff" title="Previous Difference (F7)">▲</button>
          <button class="arrow-btn" id="btn-next-diff" title="Next Difference (Shift+F7)">▼</button>
        </div>
        <div class="toolbar-divider"></div>
        <label class="current-version-label" title="Stage all changes in this file">
          <input type="checkbox" id="chk-master-version" checked/>
          <span>Current version</span>
        </label>
        <button class="icon-tool-btn" id="btn-rollback-all" title="Rollback All Changes in File">↶</button>
        <div class="toolbar-divider"></div>
        <button class="icon-tool-btn ${!hasPrev ? 'disabled' : ''}" id="btn-prev-file" title="Previous File (Alt+Left)">◀</button>
        <button class="icon-tool-btn ${!hasNext ? 'disabled' : ''}" id="btn-next-file" title="Next File (Alt+Right)">▶</button>
        <button class="icon-tool-btn" id="btn-refresh" title="Refresh (Cmd+R)">↻</button>
      </div>
    `;
    root.appendChild(toolbar);

    // 2. Diff View Column Headers
    const colHeader = document.createElement('div');
    colHeader.className = 'studio-diff-columns-header';
    colHeader.innerHTML = `
      <div class="col-header-pane left-header">
        <span class="pane-title">Base revision (HEAD)</span>
      </div>
      <div class="col-header-gutter"></div>
      <div class="col-header-pane right-header">
        <span class="pane-title">Current version</span>
      </div>
    `;
    root.appendChild(colHeader);

    // 3. Diff Viewport (Side-by-side synchronized editor)
    const viewportWrapper = document.createElement('div');
    viewportWrapper.className = 'studio-diff-viewport-wrapper';

    const scrollPane = document.createElement('div');
    scrollPane.className = 'studio-diff-scroll';

    // Editor Table with Left text, Middle gutter, Right text
    const table = document.createElement('div');
    table.className = 'studio-diff-table';

    state.rows.forEach((row, rIdx) => {
      const rowEl = document.createElement('div');
      const rowType = row.type; // 'none', 'mod', 'add', 'del'
      rowEl.className = `studio-diff-row row-${rowType}`;
      rowEl.setAttribute('data-row-idx', rIdx);

      const block = row.block;
      const isStart = row.isBlockStart;

      // Left pane cell
      const leftCell = document.createElement('div');
      leftCell.className = `diff-cell left-cell cell-${rowType}`;
      if (rowType === 'add') {
        leftCell.classList.add('cell-filler');
      } else {
        leftCell.innerHTML = `<span class="code-line">${row.leftHtml !== undefined ? row.leftHtml : (row.leftText || '&nbsp;')}</span>`;
      }

      // Middle gutter cell (line numbers + checkbox + connector)
      const gutterCell = document.createElement('div');
      gutterCell.className = 'diff-gutter-cell';

      const leftNumSpan = `<span class="gutter-num left-num">${row.leftNum || ''}</span>`;
      const rightNumSpan = `<span class="gutter-num right-num">${row.rightNum || ''}</span>`;

      let actionHtml = '<span class="gutter-spacer"></span>';
      if (isStart && block) {
        actionHtml = `
          <div class="gutter-action-box">
            <input type="checkbox" class="block-chk" data-block-id="${block.id}" title="Stage / Unstage change block" ${block.staged ? 'checked' : ''}/>
            <button class="gutter-revert-btn" data-block-id="${block.id}" title="Revert block">↶</button>
          </div>
        `;
      }

      gutterCell.innerHTML = `
        ${leftNumSpan}
        <div class="gutter-center-col">${actionHtml}</div>
        ${rightNumSpan}
      `;

      // Right pane cell
      const rightCell = document.createElement('div');
      rightCell.className = `diff-cell right-cell cell-${rowType}`;
      if (rowType === 'del') {
        rightCell.classList.add('cell-filler');
      } else {
        rightCell.innerHTML = `<span class="code-line">${row.rightHtml !== undefined ? row.rightHtml : (row.rightText || '&nbsp;')}</span>`;
      }

      rowEl.appendChild(leftCell);
      rowEl.appendChild(gutterCell);
      rowEl.appendChild(rightCell);
      table.appendChild(rowEl);
    });

    scrollPane.appendChild(table);
    viewportWrapper.appendChild(scrollPane);

    // 4. Far Right Overview Ruler (Diff Minimap)
    const overviewRuler = document.createElement('div');
    overviewRuler.className = 'studio-overview-ruler';
    const totalRowCount = Math.max(state.rows.length, 1);

    state.blocks.forEach(b => {
      const topPct = (b.startIndex / totalRowCount) * 100;
      const heightPct = Math.max((b.lineCount / totalRowCount) * 100, 1.2);
      const stripe = document.createElement('div');
      stripe.className = `ruler-stripe stripe-${b.type}`;
      stripe.style.top = `${topPct}%`;
      stripe.style.height = `${heightPct}%`;
      stripe.setAttribute('title', `${b.type.toUpperCase()}: Line ${b.startIndex + 1}`);

      stripe.addEventListener('click', () => {
        scrollToRow(b.startIndex);
      });
      overviewRuler.appendChild(stripe);
    });

    viewportWrapper.appendChild(overviewRuler);
    root.appendChild(viewportWrapper);

    app.appendChild(root);

    // Attach all event listeners
    attachToolbarEvents(toolbar);
    attachGutterEvents(table);
  }

  // Scroll to a specific row index smoothly
  function scrollToRow(rowIdx) {
    const scrollPane = document.querySelector('.studio-diff-scroll');
    const targetRow = document.querySelector(`.studio-diff-row[data-row-idx="${rowIdx}"]`);
    if (scrollPane && targetRow) {
      const top = targetRow.offsetTop - 60;
      scrollPane.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }
  }

  // Jump between difference blocks
  function jumpDiff(direction) {
    if (state.blocks.length === 0) return;
    state.currentDiffIndex += direction;
    if (state.currentDiffIndex < 0) {
      state.currentDiffIndex = state.blocks.length - 1;
    } else if (state.currentDiffIndex >= state.blocks.length) {
      state.currentDiffIndex = 0;
    }
    const targetBlock = state.blocks[state.currentDiffIndex];
    if (targetBlock) {
      scrollToRow(targetBlock.startIndex);
    }
  }

  // Attach toolbar listeners
  function attachToolbarEvents(toolbar) {
    toolbar.querySelector('#btn-prev-diff').addEventListener('click', () => jumpDiff(-1));
    toolbar.querySelector('#btn-next-diff').addEventListener('click', () => jumpDiff(1));

    const btnPrevFile = toolbar.querySelector('#btn-prev-file');
    if (btnPrevFile) {
      btnPrevFile.addEventListener('click', () => {
        if (state.currentFileIndex > 0) {
          vscode.postMessage({ type: 'navigateFile', payload: state.currentFileIndex - 1 });
        }
      });
    }

    const btnNextFile = toolbar.querySelector('#btn-next-file');
    if (btnNextFile) {
      btnNextFile.addEventListener('click', () => {
        if (state.currentFileIndex < state.filesList.length - 1) {
          vscode.postMessage({ type: 'navigateFile', payload: state.currentFileIndex + 1 });
        }
      });
    }

    toolbar.querySelector('#btn-refresh').addEventListener('click', () => {
      vscode.postMessage({ type: 'refreshDiff', payload: state.filePath });
    });

    const pillHighlight = toolbar.querySelector('#pill-highlight-words');
    if (pillHighlight) {
      pillHighlight.addEventListener('click', () => {
        state.highlightWords = !state.highlightWords;
        render();
      });
    }

    // Master version checkbox (stages or unstages entire file)
    const masterChk = toolbar.querySelector('#chk-master-version');
    if (masterChk) {
      masterChk.addEventListener('change', () => {
        const check = masterChk.checked;
        state.blocks.forEach(b => { b.staged = check; });
        document.querySelectorAll('.block-chk').forEach(c => { c.checked = check; });
        if (check) {
          vscode.postMessage({ type: 'stageFile', payload: state.filePath });
        } else {
          vscode.postMessage({ type: 'unstageFile', payload: state.filePath });
        }
      });
    }

    // Rollback all in file
    const btnRollbackAll = toolbar.querySelector('#btn-rollback-all');
    if (btnRollbackAll) {
      btnRollbackAll.addEventListener('click', () => {
        if (state.blocks.length > 0 && state.blocks[0].patchContent) {
          vscode.postMessage({ type: 'rollbackHunk', payload: { patch: state.blocks[0].patchContent } });
        }
      });
    }
  }

  // Attach gutter block actions (stage hunk, rollback hunk)
  function attachGutterEvents(table) {
    table.querySelectorAll('.block-chk').forEach(chk => {
      chk.addEventListener('change', (e) => {
        e.stopPropagation();
        const blockId = parseInt(chk.getAttribute('data-block-id'), 10);
        const block = state.blocks.find(b => b.id === blockId);
        if (!block) return;
        const check = chk.checked;
        block.staged = check;

        // Apply hunk patch selectively
        if (block.patchContent) {
          vscode.postMessage({
            type: 'applyHunkPatch',
            payload: { patch: block.patchContent, reverse: !check }
          });
        }
      });
    });

    table.querySelectorAll('.gutter-revert-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const blockId = parseInt(btn.getAttribute('data-block-id'), 10);
        const block = state.blocks.find(b => b.id === blockId);
        if (block && block.patchContent) {
          vscode.postMessage({
            type: 'rollbackHunk',
            payload: { patch: block.patchContent }
          });
        }
      });
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Listen for messages from extension host
  window.addEventListener('message', (event) => {
    const msg = event.data;
    switch (msg.type) {
      case 'fileDiff': {
        const data = msg.payload;
        state.filePath = data.path || '';
        state.fileName = data.fileName || state.filePath.split('/').pop() || '';
        state.fileDir = data.fileDir || state.filePath.split('/').slice(0, -1).join('/');
        state.diff = data.diff || '';
        state.baseContent = data.baseContent !== undefined ? data.baseContent : '';
        state.currentContent = data.currentContent !== undefined ? data.currentContent : '';
        state.filesList = data.filesList || [];
        state.currentFileIndex = data.currentFileIndex || 0;
        state.currentDiffIndex = 0;
        render();
        break;
      }
    }
  });

  // Ready handshake
  vscode.postMessage({ type: 'ready' });
})();
