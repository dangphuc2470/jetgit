export const mergeEditorScript = `
    const vscode = acquireVsCodeApi();
    const LINE_HEIGHT = 20;

    let state = {
      filePath: '',
      fileName: '',
      yoursBranch: 'HEAD',
      theirsBranch: 'Incoming',
      hunks: [],
      conflictBlocks: [],
      currentConflictIndex: 0,
    };

    const TOKEN_REGEX = /(\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/)|("(?:[^"\\\\]|\\\\.)*"|'(?:[^'\\\\]|\\\\.)*'|\`(?:[^\`\\\\]|\\\\.)*\`)|(\\b(?:0x[0-9a-fA-F]+|\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?)\\b)|(@[a-zA-Z_$][a-zA-Z0-9_$]*)|(\\b(?:abstract|as|assert|async|await|break|case|catch|class|const|continue|covariant|default|deferred|do|dynamic|else|enum|export|extends|extension|external|factory|final|finally|for|Function|get|hide|if|implements|import|in|interface|is|late|library|mixin|native|new|of|on|operator|part|rethrow|return|set|show|static|super|switch|sync|this|throw|try|typedef|var|void|while|with|yield|let|function|package|public|private|protected)\\b)|(\\b(?:true|false|null|undefined|nil|None)\\b)|(\\b(?:int|double|num|bool|boolean|String|string|List|Map|Set|Iterable|Future|Stream|Duration|DateTime|Uri|Object|Never|any|number|char|float|long|short|byte)\\b)|(\\b[a-zA-Z_$][a-zA-Z0-9_$]*(?=\\s*\\())|(\\b[A-Z][a-zA-Z0-9_$]*\\b)|(\\b[a-zA-Z_$][a-zA-Z0-9_$]*\\b)/g;

    function escapeHtml(text) {
      if (!text) return '';
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

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
        if (comment) result += \`<span class="syn-comment">\${escapeHtml(comment)}</span>\`;
        else if (str) result += \`<span class="syn-str">\${escapeHtml(str)}</span>\`;
        else if (num) result += \`<span class="syn-num">\${escapeHtml(num)}</span>\`;
        else if (anno) result += \`<span class="syn-anno">\${escapeHtml(anno)}</span>\`;
        else if (kwd) result += \`<span class="syn-kwd">\${escapeHtml(kwd)}</span>\`;
        else if (constVal) result += \`<span class="syn-const">\${escapeHtml(constVal)}</span>\`;
        else if (builtinType) result += \`<span class="syn-type">\${escapeHtml(builtinType)}</span>\`;
        else if (fnName) result += \`<span class="syn-fn">\${escapeHtml(fnName)}</span>\`;
        else if (pascalType) result += \`<span class="syn-type">\${escapeHtml(pascalType)}</span>\`;
        else if (ident) result += \`<span class="syn-var">\${escapeHtml(ident)}</span>\`;
        else result += escapeHtml(full);
      }
      if (lastIndex < code.length) {
        result += escapeHtml(code.slice(lastIndex));
      }
      return result;
    }

    // Elements
    const leftEditor = document.getElementById('left-editor');
    const centerEditor = document.getElementById('center-editor');
    const rightEditor = document.getElementById('right-editor');
    const leftLinesEl = document.getElementById('left-lines');
    const centerLinesEl = document.getElementById('center-lines');
    const rightLinesEl = document.getElementById('right-lines');
    const leftSvg = document.getElementById('left-svg');
    const rightSvg = document.getElementById('right-svg');
    const leftControls = document.getElementById('left-controls');
    const rightControls = document.getElementById('right-controls');
    const statusCounter = document.getElementById('status-counter');
    const fileTitle = document.getElementById('file-title');
    const headerYours = document.getElementById('header-yours');
    const headerTheirs = document.getElementById('header-theirs');

    function render3Way() {
      leftLinesEl.innerHTML = '';
      centerLinesEl.innerHTML = '';
      rightLinesEl.innerHTML = '';
      state.conflictBlocks = [];

      let leftLineNo = 1;
      let centerLineNo = 1;
      let rightLineNo = 1;

      state.hunks.forEach((hunk) => {
        if (hunk.type === 'common') {
          const lines = hunk.commonLines || [];
          lines.forEach(text => {
            appendLine(leftLinesEl, leftLineNo++, text, '');
            appendLine(centerLinesEl, centerLineNo++, text, '', true, hunk.id);
            appendLine(rightLinesEl, rightLineNo++, text, '');
          });
        } else if (hunk.type === 'conflict') {
          const yLines = hunk.yoursLines || [];
          const tLines = hunk.theirsLines || [];

          const leftStart = leftLineNo;
          yLines.forEach(text => {
            appendLine(leftLinesEl, leftLineNo++, text, 'line-conflict');
          });
          const leftEnd = leftLineNo - 1;

          const rightStart = rightLineNo;
          tLines.forEach(text => {
            appendLine(rightLinesEl, rightLineNo++, text, 'line-conflict');
          });
          const rightEnd = rightLineNo - 1;

          const centerStart = centerLineNo;
          const rLines = hunk.resultLines || [];
          if (hunk.resolved && rLines.length > 0) {
            rLines.forEach(text => {
              appendLine(centerLinesEl, centerLineNo++, text, 'line-conflict-resolved', true, hunk.id);
            });
          } else if (hunk.resolved && rLines.length === 0) {
            // Ignored / empty result
          } else {
            // Unresolved placeholder
            appendLine(centerLinesEl, centerLineNo++, '// Unresolved conflict #' + hunk.id, 'line-placeholder', true, hunk.id);
          }
          const centerEnd = centerLineNo - 1;

          state.conflictBlocks.push({
            id: hunk.id,
            hunk,
            leftStart,
            leftEnd: Math.max(leftStart, leftEnd),
            leftCount: yLines.length,
            rightStart,
            rightEnd: Math.max(rightStart, rightEnd),
            rightCount: tLines.length,
            centerStart,
            centerEnd: Math.max(centerStart, centerEnd),
            resolved: hunk.resolved || false,
            chosen: hunk.chosen || null,
          });
        }
      });

      updateConflictCounter();
      updateRibbonsAndControls();
    }

    function appendLine(container, lineNo, text, extraClass, editable = false, hunkId = null) {
      const lineEl = document.createElement('div');
      lineEl.className = 'editor-line' + (extraClass ? ' ' + extraClass : '');
      if (hunkId !== null) {
        lineEl.setAttribute('data-hunk-id', hunkId);
      }

      const numEl = document.createElement('div');
      numEl.className = 'gutter-num';
      numEl.textContent = lineNo;
      lineEl.appendChild(numEl);

      const contentEl = document.createElement('div');
      contentEl.className = 'line-content';
      contentEl.innerHTML = highlightCode(text);
      if (editable) {
        contentEl.setAttribute('contenteditable', 'plaintext-only');
        contentEl.setAttribute('spellcheck', 'false');
      }
      lineEl.appendChild(contentEl);

      container.appendChild(lineEl);
    }

    function updateConflictCounter() {
      const remaining = state.conflictBlocks.filter(b => !b.resolved).length;
      if (remaining === 0) {
        statusCounter.textContent = 'All conflicts resolved';
        statusCounter.className = 'status-counter all-resolved';
      } else {
        statusCounter.textContent = \`\${remaining} conflict\${remaining > 1 ? 's' : ''} remaining\`;
        statusCounter.className = 'status-counter';
      }
    }

    function updateRibbonsAndControls() {
      const sLeft = leftEditor.scrollTop;
      const sCenter = centerEditor.scrollTop;
      const sRight = rightEditor.scrollTop;
      const viewH = leftEditor.clientHeight;
      const W = 44;

      let leftSvgHtml = '';
      let rightSvgHtml = '';
      let leftCtrlHtml = '';
      let rightCtrlHtml = '';

      state.conflictBlocks.forEach(b => {
        // Left -> Center
        const ly1 = (b.leftStart - 1) * LINE_HEIGHT - sLeft;
        const ly2 = b.leftCount === 0 ? ly1 : (b.leftEnd * LINE_HEIGHT - sLeft);
        const cy1 = (b.centerStart - 1) * LINE_HEIGHT - sCenter;
        const cy2 = (b.centerEnd * LINE_HEIGHT - sCenter);

        const leftD = \`M 0,\${ly1} L 6,\${ly1} C 16,\${ly1} \${W - 16},\${cy1} \${W - 6},\${cy1} L \${W},\${cy1} L \${W},\${cy2} L \${W - 6},\${cy2} C \${W - 16},\${cy2} 16,\${ly2} 6,\${ly2} L 0,\${ly2} Z\`;
        const ribbonClass = b.resolved ? (b.chosen === 'ignored' ? 'conflict-ribbon ignored' : 'conflict-ribbon resolved') : 'conflict-ribbon';

        leftSvgHtml += \`<path d="\${leftD}" class="\${ribbonClass}" data-id="\${b.id}"/>\`;

        // Left controls (>> and x)
        const btnY = Math.max(0, ly1 + 2);
        const leftAcceptActive = b.resolved && b.chosen === 'yours' ? ' active-accepted' : '';
        leftCtrlHtml += \`
          <button class="block-btn accept-left-btn\${leftAcceptActive}" style="top: \${btnY}px; left: 4px;" title="Accept Yours (Left)" data-id="\${b.id}">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 2L5 5L1.5 8M5 2L8.5 5L5 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <button class="block-btn btn-ignore ignore-left-btn" style="top: \${btnY}px; left: 24px;" title="Ignore Yours" data-id="\${b.id}">
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 1.5L6.5 6.5M6.5 1.5L1.5 6.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
          </button>
        \`;

        // Center <- Right
        const ry1 = (b.rightStart - 1) * LINE_HEIGHT - sRight;
        const ry2 = b.rightCount === 0 ? ry1 : (b.rightEnd * LINE_HEIGHT - sRight);

        const rightD = \`M 0,\${cy1} L 6,\${cy1} C 16,\${cy1} \${W - 16},\${ry1} \${W - 6},\${ry1} L \${W},\${ry1} L \${W},\${ry2} L \${W - 6},\${ry2} C \${W - 16},\${ry2} 16,\${ly2} 6,\${ly2} L 0,\${ly2} Z\`;
        rightSvgHtml += \`<path d="\${rightD}" class="\${ribbonClass}" data-id="\${b.id}"/>\`;

        const rBtnY = Math.max(0, ry1 + 2);
        const rightAcceptActive = b.resolved && b.chosen === 'theirs' ? ' active-accepted' : '';
        rightCtrlHtml += \`
          <button class="block-btn btn-ignore ignore-right-btn" style="top: \${rBtnY}px; left: 4px;" title="Ignore Theirs" data-id="\${b.id}">
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 1.5L6.5 6.5M6.5 1.5L1.5 6.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
          </button>
          <button class="block-btn accept-right-btn\${rightAcceptActive}" style="top: \${rBtnY}px; left: 22px;" title="Accept Theirs (Right)" data-id="\${b.id}">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M8.5 2L5 5L8.5 8M5 2L1.5 5L5 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        \`;
      });

      leftSvg.innerHTML = leftSvgHtml;
      rightSvg.innerHTML = rightSvgHtml;
      leftControls.innerHTML = leftCtrlHtml;
      rightControls.innerHTML = rightCtrlHtml;

      // Bind events
      leftControls.querySelectorAll('.accept-left-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = parseInt(btn.getAttribute('data-id'), 10);
          acceptConflict(id, 'yours');
        });
      });
      leftControls.querySelectorAll('.ignore-left-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = parseInt(btn.getAttribute('data-id'), 10);
          acceptConflict(id, 'ignored');
        });
      });
      rightControls.querySelectorAll('.accept-right-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = parseInt(btn.getAttribute('data-id'), 10);
          acceptConflict(id, 'theirs');
        });
      });
      rightControls.querySelectorAll('.ignore-right-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = parseInt(btn.getAttribute('data-id'), 10);
          acceptConflict(id, 'ignored');
        });
      });
    }

    function acceptConflict(id, choice) {
      const hunk = state.hunks.find(h => h.id === id);
      if (!hunk) return;

      hunk.resolved = true;
      hunk.chosen = choice;
      if (choice === 'yours') {
        hunk.resultLines = [...(hunk.yoursLines || [])];
      } else if (choice === 'theirs') {
        hunk.resultLines = [...(hunk.theirsLines || [])];
      } else if (choice === 'ignored') {
        hunk.resultLines = [];
      }

      render3Way();
    }

    // Synchronized Scrolling
    let isSyncing = false;
    function syncScroll(source) {
      if (isSyncing) return;
      isSyncing = true;
      const top = source.scrollTop;
      const left = source.scrollLeft;

      if (source !== leftEditor) leftEditor.scrollTop = top;
      if (source !== centerEditor) centerEditor.scrollTop = top;
      if (source !== rightEditor) rightEditor.scrollTop = top;

      updateRibbonsAndControls();
      isSyncing = false;
    }

    function handleWheel(pane, e) {
      if (e.shiftKey && e.deltaY !== 0 && e.deltaX === 0) {
        pane.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    }
    leftEditor.addEventListener('wheel', (e) => handleWheel(leftEditor, e), { passive: false });
    centerEditor.addEventListener('wheel', (e) => handleWheel(centerEditor, e), { passive: false });
    rightEditor.addEventListener('wheel', (e) => handleWheel(rightEditor, e), { passive: false });

    leftEditor.addEventListener('scroll', () => syncScroll(leftEditor));
    centerEditor.addEventListener('scroll', () => syncScroll(centerEditor));
    rightEditor.addEventListener('scroll', () => syncScroll(rightEditor));

    // Jump Between Conflicts
    function jumpConflict(direction) {
      const unresolved = state.conflictBlocks;
      if (unresolved.length === 0) return;

      state.currentConflictIndex = (state.currentConflictIndex + direction + unresolved.length) % unresolved.length;
      const target = unresolved[state.currentConflictIndex];
      if (target) {
        const targetY = Math.max(0, (target.centerStart - 4) * LINE_HEIGHT);
        centerEditor.scrollTo({ top: targetY, behavior: 'smooth' });
      }
    }

    document.getElementById('btn-prev-conflict').addEventListener('click', () => jumpConflict(-1));
    document.getElementById('btn-next-conflict').addEventListener('click', () => jumpConflict(1));

    document.getElementById('btn-apply-non-conflicting').addEventListener('click', () => {
      // Auto accept all non-conflicting or simple blocks
      state.hunks.forEach(h => {
        if (h.type === 'conflict' && !h.resolved) {
          if ((h.yoursLines || []).length === 0 && (h.theirsLines || []).length > 0) {
            h.resolved = true;
            h.chosen = 'theirs';
            h.resultLines = [...h.theirsLines];
          } else if ((h.theirsLines || []).length === 0 && (h.yoursLines || []).length > 0) {
            h.resolved = true;
            h.chosen = 'yours';
            h.resultLines = [...h.yoursLines];
          }
        }
      });
      render3Way();
    });

    // Apply & Cancel
    function getMergedContent() {
      const lineEls = centerLinesEl.querySelectorAll('.line-content');
      const lines = [];
      lineEls.forEach(el => {
        lines.push(el.textContent || '');
      });
      return lines.join('\\n');
    }

    document.getElementById('btn-apply-merge').addEventListener('click', () => {
      const remaining = state.conflictBlocks.filter(b => !b.resolved).length;
      if (remaining > 0) {
        // Highlight remaining
        jumpConflict(0);
      }
      const content = getMergedContent();
      vscode.postMessage({
        type: 'applyMerge',
        payload: {
          filePath: state.filePath,
          content,
        }
      });
    });

    document.getElementById('btn-cancel-merge').addEventListener('click', () => {
      vscode.postMessage({ type: 'cancelMerge' });
    });

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.key === 'F7') {
        e.preventDefault();
        jumpConflict(e.shiftKey ? -1 : 1);
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('btn-apply-merge').click();
      } else if (e.key === 'Escape') {
        document.getElementById('btn-cancel-merge').click();
      }
    });

    // Webview Message Listener
    window.addEventListener('message', (e) => {
      const msg = e.data;
      if (msg.type === 'loadMergeData') {
        state.filePath = msg.payload.filePath;
        state.fileName = msg.payload.fileName;
        state.yoursBranch = msg.payload.yoursBranch;
        state.theirsBranch = msg.payload.theirsBranch;
        state.hunks = msg.payload.hunks || [];

        fileTitle.textContent = state.filePath;
        headerYours.textContent = \`Your version (\${state.yoursBranch})\`;
        headerTheirs.textContent = \`Their version (\${state.theirsBranch})\`;

        render3Way();
      }
    });

    window.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    }, true);

    vscode.postMessage({ type: 'ready' });
`;
