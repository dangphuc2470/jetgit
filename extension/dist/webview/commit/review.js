(function() {
  const vscode = acquireVsCodeApi();

  const LINE_HEIGHT = 20; // 20px per line for pixel-perfect math

  let state = {
    filePath: '',
    fileName: '',
    fileDir: '',
    diff: '',
    baseContent: '',
    currentContent: '',
    baseLines: [],
    currentLines: [],
    filesList: [],
    currentFileIndex: 0,
    highlightWords: true,
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

  // Parse git raw diff into hunks and build continuous blocks
  function parseBlocksFromDiff(rawDiff) {
    state.baseLines = state.baseContent ? state.baseContent.split('\n') : [];
    state.currentLines = state.currentContent ? state.currentContent.split('\n') : [];

    if (!rawDiff || !rawDiff.trim()) {
      if (state.baseLines.length === 0 && state.currentLines.length > 0) {
        // Untracked new file
        return [{
          id: 0,
          type: 'add',
          leftStart: 1,
          leftEnd: 1,
          isLeftEmpty: true,
          rightStart: 1,
          rightEnd: state.currentLines.length,
          isRightEmpty: false,
          staged: true,
          patchContent: ''
        }];
      } else if (state.currentLines.length === 0 && state.baseLines.length > 0) {
        // Deleted file
        return [{
          id: 0,
          type: 'del',
          leftStart: 1,
          leftEnd: state.baseLines.length,
          isLeftEmpty: false,
          rightStart: 1,
          rightEnd: 1,
          isRightEmpty: true,
          staged: true,
          patchContent: ''
        }];
      }
      return [];
    }

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

    const blocks = [];
    hunks.forEach((hunk, hIdx) => {
      let bLine = hunk.oldStart;
      let cLine = hunk.newStart;
      let dIdx = 0;

      while (dIdx < hunk.diffLines.length) {
        const d = hunk.diffLines[dIdx];
        if (d.startsWith(' ')) {
          bLine++;
          cLine++;
          dIdx++;
        } else {
          const startLeft = bLine;
          const startRight = cLine;
          let delCount = 0;
          let addCount = 0;
          const blockHunkLines = [hunk.header];

          while (dIdx < hunk.diffLines.length && (hunk.diffLines[dIdx].startsWith('-') || hunk.diffLines[dIdx].startsWith('+'))) {
            const cur = hunk.diffLines[dIdx];
            blockHunkLines.push(cur);
            if (cur.startsWith('-')) {
              delCount++;
              bLine++;
            } else if (cur.startsWith('+')) {
              addCount++;
              cLine++;
            }
            dIdx++;
          }

          let blockType = 'mod';
          if (delCount > 0 && addCount === 0) blockType = 'del';
          else if (addCount > 0 && delCount === 0) blockType = 'add';
          else blockType = 'mod';

          // Unified patch for this hunk/block
          let patch = `--- a/${state.filePath}\n+++ b/${state.filePath}\n${hunk.header}\n`;
          hunk.rawLines.slice(1).forEach(l => { patch += l + '\n'; });

          blocks.push({
            id: blocks.length,
            type: blockType,
            leftStart: delCount > 0 ? startLeft : Math.max(1, startLeft - 1),
            leftEnd: delCount > 0 ? (startLeft + delCount - 1) : Math.max(1, startLeft - 1),
            isLeftEmpty: delCount === 0,
            rightStart: addCount > 0 ? startRight : Math.max(1, startRight - 1),
            rightEnd: addCount > 0 ? (startRight + addCount - 1) : Math.max(1, startRight - 1),
            isRightEmpty: addCount === 0,
            delCount,
            addCount,
            staged: true,
            patchContent: patch
          });
        }
      }
    });

    return blocks;
  }

  // Render the whole review interface
  function render() {
    app.innerHTML = '';

    state.blocks = parseBlocksFromDiff(state.diff);

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
          <span class="pill-icon">≡</span>
          <span class="pill-text">Side-by-side viewer</span>
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
        <label class="current-version-label" title="Stage / Unstage entire file">
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

    // 3. Diff Viewport (Left editor, Middle gutter with SVG ribbons, Right editor)
    const viewportWrapper = document.createElement('div');
    viewportWrapper.className = 'studio-diff-viewport-wrapper';

    // Left Editor Scroll Container
    const leftPane = document.createElement('div');
    leftPane.className = 'editor-pane left-pane';

    // Right Editor Scroll Container
    const rightPane = document.createElement('div');
    rightPane.className = 'editor-pane right-pane';

    // Build line maps for quick lookup of which block each line belongs to
    const leftLineMap = {};
    const rightLineMap = {};
    state.blocks.forEach(b => {
      if (!b.isLeftEmpty) {
        for (let l = b.leftStart; l <= b.leftEnd; l++) {
          leftLineMap[l] = b;
        }
      }
      if (!b.isRightEmpty) {
        for (let r = b.rightStart; r <= b.rightEnd; r++) {
          rightLineMap[r] = b;
        }
      }
    });

    // Render Left Lines (Pure original code, NO dummy filler rows!)
    let leftHtml = '';
    state.baseLines.forEach((line, idx) => {
      const lineNum = idx + 1;
      const b = leftLineMap[lineNum];
      let rowClass = 'editor-line';
      let contentHtml = escapeHtml(line);

      if (b) {
        if (b.type === 'del') {
          rowClass += ' line-del';
          contentHtml = `<span class="diff-word-del">${contentHtml}</span>`;
        } else if (b.type === 'mod') {
          rowClass += ' line-mod';
          // Compute word diff against matching line in right block
          const rOffset = lineNum - b.leftStart;
          const matchingRightLineNum = b.rightStart + rOffset;
          const rightText = (matchingRightLineNum <= b.rightEnd && state.currentLines[matchingRightLineNum - 1] !== undefined)
            ? state.currentLines[matchingRightLineNum - 1]
            : '';
          const wDiff = computeWordDiff(line, rightText);
          contentHtml = wDiff.leftHtml;
        }
      }

      leftHtml += `
        <div class="${rowClass}" data-line="${lineNum}">
          <span class="gutter-num">${lineNum}</span>
          <span class="line-content">${contentHtml || '&nbsp;'}</span>
        </div>
      `;
    });
    leftPane.innerHTML = `<div class="editor-lines-container">${leftHtml}</div>`;

    // Render Right Lines (Pure modified code, NO dummy filler rows!)
    let rightHtml = '';
    state.currentLines.forEach((line, idx) => {
      const lineNum = idx + 1;
      const b = rightLineMap[lineNum];
      let rowClass = 'editor-line';
      let contentHtml = escapeHtml(line);

      if (b) {
        if (b.type === 'add') {
          rowClass += ' line-add';
          contentHtml = `<span class="diff-word-add">${contentHtml}</span>`;
        } else if (b.type === 'mod') {
          rowClass += ' line-mod';
          // Compute word diff against matching line in left block
          const lOffset = lineNum - b.rightStart;
          const matchingLeftLineNum = b.leftStart + lOffset;
          const leftText = (matchingLeftLineNum <= b.leftEnd && state.baseLines[matchingLeftLineNum - 1] !== undefined)
            ? state.baseLines[matchingLeftLineNum - 1]
            : '';
          const wDiff = computeWordDiff(leftText, line);
          contentHtml = wDiff.rightHtml;
        }
      }

      rightHtml += `
        <div class="${rowClass}" data-line="${lineNum}">
          <span class="gutter-num">${lineNum}</span>
          <span class="line-content">${contentHtml || '&nbsp;'}</span>
        </div>
      `;
    });
    rightPane.innerHTML = `<div class="editor-lines-container">${rightHtml}</div>`;

    // Middle Gutter with SVG curved connectors
    const middleGutter = document.createElement('div');
    middleGutter.className = 'middle-gutter';

    const maxLines = Math.max(state.baseLines.length, state.currentLines.length, 1);
    const gutterTotalHeight = maxLines * LINE_HEIGHT;

    // SVG ribbon layer
    const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgEl.setAttribute('class', 'gutter-ribbon-svg');
    svgEl.setAttribute('width', '54');
    svgEl.setAttribute('height', `${gutterTotalHeight}`);
    svgEl.style.height = `${gutterTotalHeight}px`;

    const W = 54;
    let pathsHtml = '';
    let controlsHtml = '';

    state.blocks.forEach(b => {
      let y1, y2, y3, y4;

      if (b.isLeftEmpty) {
        // Pure addition: starts as a point on the left
        y1 = (b.leftStart - 1) * LINE_HEIGHT + (LINE_HEIGHT / 2);
        y2 = y1;
      } else {
        y1 = (b.leftStart - 1) * LINE_HEIGHT;
        y2 = b.leftEnd * LINE_HEIGHT;
      }

      if (b.isRightEmpty) {
        // Pure deletion: ends as a point on the right
        y3 = (b.rightStart - 1) * LINE_HEIGHT + (LINE_HEIGHT / 2);
        y4 = y3;
      } else {
        y3 = (b.rightStart - 1) * LINE_HEIGHT;
        y4 = b.rightEnd * LINE_HEIGHT;
      }

      // Smooth cubic bezier curved ribbon
      const d = `M 0,${y1} C ${W * 0.45},${y1} ${W * 0.55},${y3} ${W},${y3} L ${W},${y4} C ${W * 0.55},${y4} ${W * 0.45},${y2} 0,${y2} Z`;
      const fillClass = `ribbon-${b.type}`;

      pathsHtml += `<path d="${d}" class="diff-ribbon ${fillClass}" data-block-id="${b.id}"/>`;

      // Checkbox placed at the middle of the ribbon
      const checkY = Math.min(y1, y3) + 2;
      controlsHtml += `
        <div class="gutter-block-control" style="top: ${checkY}px;" data-block-id="${b.id}">
          <input type="checkbox" class="block-chk" title="Stage / Unstage block" ${b.staged ? 'checked' : ''} data-block-id="${b.id}"/>
        </div>
      `;
    });

    svgEl.innerHTML = pathsHtml;
    middleGutter.appendChild(svgEl);

    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'gutter-controls-layer';
    controlsContainer.style.height = `${gutterTotalHeight}px`;
    controlsContainer.innerHTML = controlsHtml;
    middleGutter.appendChild(controlsContainer);

    viewportWrapper.appendChild(leftPane);
    viewportWrapper.appendChild(middleGutter);
    viewportWrapper.appendChild(rightPane);

    // 4. Far Right Overview Ruler (Diff Minimap)
    const overviewRuler = document.createElement('div');
    overviewRuler.className = 'studio-overview-ruler';
    const totalLines = Math.max(state.currentLines.length, state.baseLines.length, 1);

    state.blocks.forEach(b => {
      const lineStart = b.isRightEmpty ? b.leftStart : b.rightStart;
      const lineCount = b.isRightEmpty ? (b.leftEnd - b.leftStart + 1) : (b.rightEnd - b.rightStart + 1);
      const topPct = (lineStart / totalLines) * 100;
      const heightPct = Math.max((lineCount / totalLines) * 100, 1.2);

      const stripe = document.createElement('div');
      stripe.className = `ruler-stripe stripe-${b.type}`;
      stripe.style.top = `${topPct}%`;
      stripe.style.height = `${heightPct}%`;
      stripe.setAttribute('title', `${b.type.toUpperCase()}: Line ${lineStart}`);

      stripe.addEventListener('click', () => {
        scrollToLine(lineStart);
      });
      overviewRuler.appendChild(stripe);
    });

    viewportWrapper.appendChild(overviewRuler);
    root.appendChild(viewportWrapper);

    app.appendChild(root);

    // Synchronize scrolling between leftPane, middleGutter, and rightPane
    setupSynchronizedScrolling(leftPane, rightPane, middleGutter);

    // Attach toolbar & block events
    attachToolbarEvents(toolbar);
    attachBlockEvents(controlsContainer);
  }

  // Smooth synchronized scrolling across Left Pane, Middle Gutter, and Right Pane
  function setupSynchronizedScrolling(leftPane, rightPane, middleGutter) {
    let activeScroll = null;

    function onScroll(source, targets) {
      if (activeScroll && activeScroll !== source) return;
      activeScroll = source;

      const top = source.scrollTop;
      targets.forEach(t => {
        t.scrollTop = top;
      });

      requestAnimationFrame(() => {
        activeScroll = null;
      });
    }

    leftPane.addEventListener('scroll', () => onScroll(leftPane, [rightPane, middleGutter]), { passive: true });
    rightPane.addEventListener('scroll', () => onScroll(rightPane, [leftPane, middleGutter]), { passive: true });
  }

  // Scroll to a specific line in both panes
  function scrollToLine(lineNum) {
    const leftPane = document.querySelector('.editor-pane.left-pane');
    const rightPane = document.querySelector('.editor-pane.right-pane');
    const middleGutter = document.querySelector('.middle-gutter');
    const targetTop = Math.max(0, (lineNum - 1) * LINE_HEIGHT - 60);

    if (leftPane && rightPane && middleGutter) {
      leftPane.scrollTo({ top: targetTop, behavior: 'smooth' });
      rightPane.scrollTo({ top: targetTop, behavior: 'smooth' });
      middleGutter.scrollTo({ top: targetTop, behavior: 'smooth' });
    }
  }

  // Jump to diff block
  function jumpDiff(direction) {
    if (state.blocks.length === 0) return;
    state.currentDiffIndex += direction;
    if (state.currentDiffIndex < 0) {
      state.currentDiffIndex = state.blocks.length - 1;
    } else if (state.currentDiffIndex >= state.blocks.length) {
      state.currentDiffIndex = 0;
    }
    const b = state.blocks[state.currentDiffIndex];
    if (b) {
      const targetLine = b.isRightEmpty ? b.leftStart : b.rightStart;
      scrollToLine(targetLine);
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

  // Attach gutter block checkboxes
  function attachBlockEvents(controlsContainer) {
    controlsContainer.querySelectorAll('.block-chk').forEach(chk => {
      chk.addEventListener('change', (e) => {
        e.stopPropagation();
        const blockId = parseInt(chk.getAttribute('data-block-id'), 10);
        const block = state.blocks.find(b => b.id === blockId);
        if (!block) return;
        const check = chk.checked;
        block.staged = check;

        if (block.patchContent) {
          vscode.postMessage({
            type: 'applyHunkPatch',
            payload: { patch: block.patchContent, reverse: !check }
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
