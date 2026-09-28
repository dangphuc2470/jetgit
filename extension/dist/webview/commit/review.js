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
    segments: [],
    currentDiffIndex: 0
  };

  const app = document.getElementById('app');

  const TOKEN_REGEX = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b(?:0x[0-9a-fA-F]+|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b)|(@[a-zA-Z_$][a-zA-Z0-9_$]*)|(\b(?:abstract|as|assert|async|await|break|case|catch|class|const|continue|covariant|default|deferred|do|dynamic|else|enum|export|extends|extension|external|factory|final|finally|for|Function|get|hide|if|implements|import|in|interface|is|late|library|mixin|native|new|of|on|operator|part|rethrow|return|set|show|static|super|switch|sync|this|throw|try|typedef|var|void|while|with|yield|let|function|package|public|private|protected)\b)|(\b(?:true|false|null|undefined|nil|None)\b)|(\b(?:int|double|num|bool|boolean|String|string|List|Map|Set|Iterable|Future|Stream|Duration|DateTime|Uri|Object|Never|any|number|char|float|long|short|byte)\b)|(\b[a-zA-Z_$][a-zA-Z0-9_$]*(?=\s*\())|(\b[A-Z][a-zA-Z0-9_$]*\b)|(\b[a-zA-Z_$][a-zA-Z0-9_$]*\b)/g;

  function highlightCode(code) {
    if (!code) return '';
    let result = '';
    let lastIndex = 0;
    TOKEN_REGEX.lastIndex = 0;

    let match;
    while ((match = TOKEN_REGEX.exec(code)) !== null) {
      if (match.index > lastIndex) {
        result += escapeHtml(code.slice(lastIndex, match.index));
      }
      lastIndex = TOKEN_REGEX.lastIndex;

      const [full, comment, str, num, anno, kwd, constVal, builtinType, fnName, pascalType, ident] = match;

      if (comment) {
        result += `<span class="syn-comment">${escapeHtml(comment)}</span>`;
      } else if (str) {
        result += `<span class="syn-str">${escapeHtml(str)}</span>`;
      } else if (num) {
        result += `<span class="syn-num">${escapeHtml(num)}</span>`;
      } else if (anno) {
        result += `<span class="syn-anno">${escapeHtml(anno)}</span>`;
      } else if (kwd) {
        result += `<span class="syn-kwd">${escapeHtml(kwd)}</span>`;
      } else if (constVal) {
        result += `<span class="syn-const">${escapeHtml(constVal)}</span>`;
      } else if (builtinType) {
        result += `<span class="syn-type">${escapeHtml(builtinType)}</span>`;
      } else if (fnName) {
        result += `<span class="syn-fn">${escapeHtml(fnName)}</span>`;
      } else if (pascalType) {
        result += `<span class="syn-type">${escapeHtml(pascalType)}</span>`;
      } else if (ident) {
        result += `<span class="syn-var">${escapeHtml(ident)}</span>`;
      } else {
        result += escapeHtml(full);
      }
    }

    if (lastIndex < code.length) {
      result += escapeHtml(code.slice(lastIndex));
    }

    return result;
  }

  // Tokenize string into words, strings, comments, symbols, whitespace
  function tokenize(str) {
    if (!str) return [];
    const regex = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|([a-zA-Z0-9_$]+|[^\sa-zA-Z0-9_$]+|\s+)/g;
    return str.match(regex) || [str];
  }

  // Word-level diff for modified lines with syntax highlighting
  function computeWordDiff(leftStr, rightStr) {
    if (!state.highlightWords) {
      return {
        leftHtml: highlightCode(leftStr),
        rightHtml: highlightCode(rightStr)
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
        const text = tokens[i];
        const highlighted = highlightCode(text);
        if (i >= changeStart && i <= changeEnd) {
          html += `<span class="${cls}">${highlighted}</span>`;
        } else {
          html += highlighted;
        }
      }
      return html;
    };

    return {
      leftHtml: render(leftTokens, start, endLeft, 'diff-word-mod-left'),
      rightHtml: render(rightTokens, start, endRight, 'diff-word-mod-right')
    };
  }

  // Parse git raw diff into hunks, blocks and anchored scroll segments
  function parseDiffData(rawDiff) {
    state.baseLines = state.baseContent ? state.baseContent.split('\n') : [];
    state.currentLines = state.currentContent ? state.currentContent.split('\n') : [];

    const L_total = state.baseLines.length;
    const R_total = state.currentLines.length;

    if (!rawDiff || !rawDiff.trim()) {
      if (L_total === 0 && R_total > 0) {
        state.blocks = [{
          id: 0,
          type: 'add',
          leftStart: 1,
          leftEnd: 1,
          isLeftEmpty: true,
          rightStart: 1,
          rightEnd: R_total,
          isRightEmpty: false,
          staged: true,
          patchContent: ''
        }];
        state.segments = [{
          leftY: 0,
          rightY: 0,
          hLeft: 0,
          hRight: R_total * LINE_HEIGHT,
          isDiff: true
        }];
      } else if (R_total === 0 && L_total > 0) {
        state.blocks = [{
          id: 0,
          type: 'del',
          leftStart: 1,
          leftEnd: L_total,
          isLeftEmpty: false,
          rightStart: 1,
          rightEnd: 1,
          isRightEmpty: true,
          staged: true,
          patchContent: ''
        }];
        state.segments = [{
          leftY: 0,
          rightY: 0,
          hLeft: L_total * LINE_HEIGHT,
          hRight: 0,
          isDiff: true
        }];
      } else {
        state.blocks = [];
        state.segments = [{
          leftY: 0,
          rightY: 0,
          hLeft: L_total * LINE_HEIGHT,
          hRight: R_total * LINE_HEIGHT,
          isDiff: false
        }];
      }
      return;
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
    hunks.forEach((hunk) => {
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

          while (dIdx < hunk.diffLines.length && (hunk.diffLines[dIdx].startsWith('-') || hunk.diffLines[dIdx].startsWith('+'))) {
            const cur = hunk.diffLines[dIdx];
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

          let patch = `--- a/${state.filePath}\n+++ b/${state.filePath}\n${hunk.header}\n`;
          hunk.rawLines.slice(1).forEach(l => { patch += l + '\n'; });

          blocks.push({
            id: blocks.length,
            type: blockType,
            leftStart: startLeft,
            leftEnd: delCount > 0 ? (startLeft + delCount - 1) : startLeft,
            isLeftEmpty: delCount === 0,
            rightStart: startRight,
            rightEnd: addCount > 0 ? (startRight + addCount - 1) : startRight,
            isRightEmpty: addCount === 0,
            delCount,
            addCount,
            staged: true,
            patchContent: patch
          });
        }
      }
    });

    state.blocks = blocks;
    state.segments = buildSegments(hunks, L_total, R_total);
  }

  // Build anchored scroll segments connecting common code and diff blocks
  function buildSegments(hunks, L_total, R_total) {
    const segments = [];
    let curL = 1;
    let curR = 1;

    hunks.forEach((hunk) => {
      // 1. Common unchanged code before hunk
      const commonCount = Math.min(
        Math.max(0, hunk.oldStart - curL),
        Math.max(0, hunk.newStart - curR)
      );
      if (commonCount > 0) {
        segments.push({
          leftY: (curL - 1) * LINE_HEIGHT,
          rightY: (curR - 1) * LINE_HEIGHT,
          hLeft: commonCount * LINE_HEIGHT,
          hRight: commonCount * LINE_HEIGHT,
          isDiff: false
        });
        curL += commonCount;
        curR += commonCount;
      }

      if (curL < hunk.oldStart) {
        const diffL = hunk.oldStart - curL;
        segments.push({
          leftY: (curL - 1) * LINE_HEIGHT,
          rightY: (curR - 1) * LINE_HEIGHT,
          hLeft: diffL * LINE_HEIGHT,
          hRight: 0,
          isDiff: true
        });
        curL += diffL;
      }
      if (curR < hunk.newStart) {
        const diffR = hunk.newStart - curR;
        segments.push({
          leftY: (curL - 1) * LINE_HEIGHT,
          rightY: (curR - 1) * LINE_HEIGHT,
          hLeft: 0,
          hRight: diffR * LINE_HEIGHT,
          isDiff: true
        });
        curR += diffR;
      }

      // 2. Inside hunk: walk diff lines
      let dIdx = 0;
      while (dIdx < hunk.diffLines.length) {
        const d = hunk.diffLines[dIdx];
        if (d.startsWith(' ')) {
          let ctxCount = 0;
          while (dIdx < hunk.diffLines.length && hunk.diffLines[dIdx].startsWith(' ')) {
            ctxCount++;
            dIdx++;
          }
          segments.push({
            leftY: (curL - 1) * LINE_HEIGHT,
            rightY: (curR - 1) * LINE_HEIGHT,
            hLeft: ctxCount * LINE_HEIGHT,
            hRight: ctxCount * LINE_HEIGHT,
            isDiff: false
          });
          curL += ctxCount;
          curR += ctxCount;
        } else {
          let delCount = 0;
          let addCount = 0;
          while (dIdx < hunk.diffLines.length && (hunk.diffLines[dIdx].startsWith('-') || hunk.diffLines[dIdx].startsWith('+'))) {
            if (hunk.diffLines[dIdx].startsWith('-')) delCount++;
            else if (hunk.diffLines[dIdx].startsWith('+')) addCount++;
            dIdx++;
          }
          segments.push({
            leftY: (curL - 1) * LINE_HEIGHT,
            rightY: (curR - 1) * LINE_HEIGHT,
            hLeft: delCount * LINE_HEIGHT,
            hRight: addCount * LINE_HEIGHT,
            isDiff: true
          });
          curL += delCount;
          curR += addCount;
        }
      }
    });

    // 3. Trailing common lines after last hunk
    const remL = Math.max(0, L_total - curL + 1);
    const remR = Math.max(0, R_total - curR + 1);
    const trailingCommon = Math.max(remL, remR);
    if (trailingCommon > 0) {
      segments.push({
        leftY: (curL - 1) * LINE_HEIGHT,
        rightY: (curR - 1) * LINE_HEIGHT,
        hLeft: remL * LINE_HEIGHT,
        hRight: remR * LINE_HEIGHT,
        isDiff: false
      });
    }

    return segments;
  }

  // Map Left scroll position to Right scroll position (Anchored Scroll)
  function mapLeftToRight(sLeft) {
    if (sLeft <= 0 || state.segments.length === 0) return 0;
    for (let i = 0; i < state.segments.length; i++) {
      const seg = state.segments[i];
      if (sLeft >= seg.leftY && sLeft <= seg.leftY + seg.hLeft) {
        if (!seg.isDiff) {
          return seg.rightY + (sLeft - seg.leftY);
        } else {
          if (seg.hLeft === 0 || seg.hRight === 0) {
            return seg.rightY; // Wait until this side reaches common code!
          }
          const ratio = (sLeft - seg.leftY) / seg.hLeft;
          return seg.rightY + ratio * seg.hRight;
        }
      }
    }
    const last = state.segments[state.segments.length - 1];
    return last ? (last.rightY + last.hRight) : sLeft;
  }

  // Map Right scroll position to Left scroll position (Anchored Scroll)
  function mapRightToLeft(sRight) {
    if (sRight <= 0 || state.segments.length === 0) return 0;
    for (let i = 0; i < state.segments.length; i++) {
      const seg = state.segments[i];
      if (sRight >= seg.rightY && sRight <= seg.rightY + seg.hRight) {
        if (!seg.isDiff) {
          return seg.leftY + (sRight - seg.rightY);
        } else {
          if (seg.hRight === 0 || seg.hLeft === 0) {
            return seg.leftY; // Wait until this side reaches common code!
          }
          const ratio = (sRight - seg.rightY) / seg.hRight;
          return seg.leftY + ratio * seg.hLeft;
        }
      }
    }
    const last = state.segments[state.segments.length - 1];
    return last ? (last.leftY + last.hLeft) : sRight;
  }

  // Render the whole review interface
  function render() {
    app.innerHTML = '';

    parseDiffData(state.diff);

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
          <button class="arrow-btn" id="btn-prev-diff" title="Previous Difference (Shift+F7)">▲</button>
          <button class="arrow-btn" id="btn-next-diff" title="Next Difference (F7)">▼</button>
        </div>
        <div class="toolbar-divider"></div>
        <label class="current-version-label" title="Stage / Unstage entire file">
          <input type="checkbox" id="chk-master-version" checked/>
          <span>Current version</span>
        </label>
        <button class="icon-tool-btn" id="btn-open-file" title="Jump to Source / Open in Editor (F4)">↗</button>
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

    // 3. Diff Viewport (Left editor, Middle gutter, Right editor)
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

    // Render Left Lines (Pure code, NO fake dummy filler rows!)
    let leftHtml = '';
    state.baseLines.forEach((line, idx) => {
      const lineNum = idx + 1;
      const b = leftLineMap[lineNum];
      let rowClass = 'editor-line';
      let contentHtml = highlightCode(line);

      if (b) {
        if (b.type === 'del') {
          rowClass += ' line-del';
          contentHtml = highlightCode(line);
        } else if (b.type === 'mod') {
          rowClass += ' line-mod';
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

    let leftInsertionsHtml = '';
    state.blocks.forEach(b => {
      if (b.isLeftEmpty) {
        const topY = (b.leftStart - 1) * LINE_HEIGHT;
        leftInsertionsHtml += `<div class="diff-insertion-line insertion-add" style="top: ${topY}px;"></div>`;
      }
    });
    leftPane.innerHTML = `<div class="editor-lines-container">${leftHtml}${leftInsertionsHtml}</div>`;

    // Render Right Lines (Pure code, NO fake dummy filler rows!)
    let rightHtml = '';
    state.currentLines.forEach((line, idx) => {
      const lineNum = idx + 1;
      const b = rightLineMap[lineNum];
      let rowClass = 'editor-line';
      let contentHtml = highlightCode(line);

      if (b) {
        if (b.type === 'add') {
          rowClass += ' line-add';
          contentHtml = highlightCode(line);
        } else if (b.type === 'mod') {
          rowClass += ' line-mod';
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

    let rightInsertionsHtml = '';
    state.blocks.forEach(b => {
      if (b.isRightEmpty) {
        const topY = (b.rightStart - 1) * LINE_HEIGHT;
        rightInsertionsHtml += `<div class="diff-insertion-line insertion-del" style="top: ${topY}px;"></div>`;
      }
    });
    rightPane.innerHTML = `<div class="editor-lines-container">${rightHtml}${rightInsertionsHtml}</div>`;

    // Middle Gutter with Viewport SVG curved ribbons
    const middleGutter = document.createElement('div');
    middleGutter.className = 'middle-gutter';

    const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgEl.setAttribute('class', 'gutter-ribbon-svg');
    svgEl.setAttribute('width', '54');
    svgEl.setAttribute('height', '100%');
    middleGutter.appendChild(svgEl);

    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'gutter-controls-layer';
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

    // Dynamic viewport-based ribbon updater
    function updateRibbons() {
      const sLeft = leftPane.scrollTop;
      const sRight = rightPane.scrollTop;
      const viewH = middleGutter.clientHeight || 800;
      const W = 54;

      let svgHtml = '';
      let ctrlHtml = '';

      state.blocks.forEach(b => {
        let y1 = (b.leftStart - 1) * LINE_HEIGHT - sLeft;
        let y2 = b.isLeftEmpty ? y1 : (b.leftEnd * LINE_HEIGHT - sLeft);

        let y3 = (b.rightStart - 1) * LINE_HEIGHT - sRight;
        let y4 = b.isRightEmpty ? y3 : (b.rightEnd * LINE_HEIGHT - sRight);

        // Skip if block is offscreen
        if (Math.max(y2, y4) < -20 || Math.min(y1, y3) > viewH + 20) {
          return;
        }

        const flat = 10;
        const d = `M 0,${y1} L ${flat},${y1} C ${flat + 10},${y1} ${W - flat - 10},${y3} ${W - flat},${y3} L ${W},${y3} L ${W},${y4} L ${W - flat},${y4} C ${W - flat - 10},${y4} ${flat + 10},${y2} ${flat},${y2} L 0,${y2} Z`;
        const fillClass = `ribbon-${b.type}`;

        svgHtml += `<path d="${d}" class="diff-ribbon ${fillClass}" data-block-id="${b.id}"/>`;

        // Checkbox positioned neatly in a straight vertical column aligned with Android Studio
        const checkY = b.isRightEmpty ? (y3 - 7) : (y3 + 3);
        if (checkY >= -15 && checkY <= viewH + 15) {
          ctrlHtml += `
            <div class="gutter-block-control" style="top: ${checkY}px;" data-block-id="${b.id}">
              <input type="checkbox" class="block-chk" title="Stage / Unstage block" ${b.staged ? 'checked' : ''} data-block-id="${b.id}"/>
            </div>
          `;
        }
      });

      svgEl.innerHTML = svgHtml;
      controlsContainer.innerHTML = ctrlHtml;

      // Re-attach checkbox event listener for visible controls
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

    // Anchored Dual Scroll Synchronization
    let isSyncing = false;

    leftPane.addEventListener('scroll', () => {
      if (isSyncing) return;
      isSyncing = true;
      rightPane.scrollTop = mapLeftToRight(leftPane.scrollTop);
      updateRibbons();
      isSyncing = false;
    }, { passive: true });

    rightPane.addEventListener('scroll', () => {
      if (isSyncing) return;
      isSyncing = true;
      leftPane.scrollTop = mapRightToLeft(rightPane.scrollTop);
      updateRibbons();
      isSyncing = false;
    }, { passive: true });

    // Initial draw
    requestAnimationFrame(updateRibbons);

    // Attach toolbar events
    attachToolbarEvents(toolbar);
  }

  // Scroll to a specific line in both panes
  function scrollToLine(lineNum) {
    const leftPane = document.querySelector('.editor-pane.left-pane');
    const rightPane = document.querySelector('.editor-pane.right-pane');
    const targetRight = Math.max(0, (lineNum - 1) * LINE_HEIGHT - 60);

    if (leftPane && rightPane) {
      rightPane.scrollTo({ top: targetRight, behavior: 'smooth' });
      leftPane.scrollTo({ top: mapRightToLeft(targetRight), behavior: 'smooth' });
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

    // Open file in editor (F4)
    const btnOpenFile = toolbar.querySelector('#btn-open-file');
    if (btnOpenFile) {
      btnOpenFile.addEventListener('click', () => {
        if (state.filePath) {
          vscode.postMessage({ type: 'openFile', payload: state.filePath });
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

  // Global Keyboard shortcuts: F4 = Open in editor, F7 = Next diff, Shift+F7 = Prev diff
  window.addEventListener('keydown', (e) => {
    if (e.key === 'F4' || e.keyCode === 115) {
      e.preventDefault();
      if (state.filePath) {
        vscode.postMessage({ type: 'openFile', payload: state.filePath });
      }
    } else if (e.key === 'F7' || e.keyCode === 118) {
      e.preventDefault();
      if (e.shiftKey) {
        jumpDiff(-1); // Shift+F7 = Prev diff
      } else {
        jumpDiff(1);  // F7 = Next diff
      }
    }
  });

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
