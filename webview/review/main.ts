import { escapeHtml } from '../shared/escape';
import { highlightCode, computeWordDiff } from '../shared/syntaxHighlight';
import { LINE_HEIGHT, state, runtime, undoStack, redoStack } from './state';
import { parseDiffData, mapLeftToRight, mapRightToLeft, buildStagedContent, isBlockStaged } from './diffParser';
import {
  pushHistoryState,
  performUndo,
  performRedo,
  revertBlock,
  triggerSave,
  queueDebouncedSave,
  setCaretPosition,
  getCaretOffset
} from './editorHistory';
import {
  jumpToBlock,
  jumpDiff,
  jumpFirstOrLastDiff,
  hideDiffNavigationHint
} from './navigation';

declare function acquireVsCodeApi(): any;
const vscode = acquireVsCodeApi();

const app = document.getElementById('app') as HTMLElement;

function render(): void {
  if (!app) return;
  const rPaneOld = document.querySelector('.editor-pane.right-pane') as HTMLElement | null;
  if (rPaneOld) {
    runtime.savedScrollTop = rPaneOld.scrollTop;
  }

  runtime.isRendering = true;
  if (runtime.scrollAnimId) {
    cancelAnimationFrame(runtime.scrollAnimId);
    runtime.scrollAnimId = null;
  }

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
      <div class="dropdown-pill" data-tooltip="Side-by-side viewer">
        <span class="pill-icon">
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <rect x="1.5" y="2" width="4.5" height="10" rx="1" stroke="currentColor" stroke-width="1.2"/>
            <rect x="8" y="2" width="4.5" height="10" rx="1" stroke="currentColor" stroke-width="1.2"/>
          </svg>
        </span>
        <span class="pill-text">Side-by-side viewer</span>
        <span class="pill-arrow">
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M1.5 2.75L4 5.25L6.5 2.75" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
      </div>
      <div class="dropdown-pill" id="pill-highlight-words" data-tooltip="${state.highlightWords ? 'Highlight words' : 'Do not highlight'}">
        <span class="pill-text">${state.highlightWords ? 'Highlight words' : 'Do not highlight'}</span>
        <span class="pill-arrow">
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M1.5 2.75L4 5.25L6.5 2.75" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
      </div>
      <div class="file-breadcrumb">
        <span class="file-name-main">${escapeHtml(state.fileName || state.filePath)}</span>
        ${state.fileDir ? `<span class="file-dir-sub">${escapeHtml(state.fileDir)}</span>` : ''}
      </div>
    </div>

    <div class="toolbar-right-group">
      <div class="diff-counter-pill">
        <span class="counter-text">${diffCount} ${diffCount === 1 ? 'difference' : 'differences'}</span>
        <button class="arrow-btn" id="btn-prev-diff" data-tooltip="Previous Difference" data-shortcut="Shift+F7">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 6.5L5 3.5L8 6.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <button class="arrow-btn" id="btn-next-diff" data-tooltip="Next Difference" data-shortcut="F7">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
      <div class="toolbar-divider"></div>
      ${!state.readOnly ? `
      <button class="icon-tool-btn" id="btn-tick-all" data-tooltip="Tick All Differences in File" title="Tick All Differences in File">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
        </svg>
      </button>
      <label class="current-version-label" data-tooltip="Stage / Unstage entire file">
        <span class="studio-chk-wrap">
          <input type="checkbox" id="chk-master-version" checked/>
          <span class="chk-custom">
            <svg class="chk-mark" width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1.8 5.2L4 7.4L8.2 2.8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <svg class="chk-indet" width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 5H8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
          </span>
        </span>
        <span>Current version</span>
      </label>
      ` : ''}
      <button class="icon-tool-btn" id="btn-open-file" data-tooltip="Jump to Source / Open in Editor" data-shortcut="F4">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3.5 10.5L10.5 3.5M10.5 3.5H5.5M10.5 3.5V8.5" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      ${!state.readOnly ? `
      <button class="icon-tool-btn" id="btn-rollback-all" data-tooltip="Rollback All Changes in File" data-shortcut="Ctrl+Alt+Z">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M4 2.5L1.5 5L4 7.5" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M2 5H7.75C9.8 5 11.5 6.7 11.5 8.75C11.5 10.8 9.8 12.5 7.75 12.5H3.5" stroke="currentColor" stroke-width="1.25" stroke-linecap="round"/>
        </svg>
      </button>` : ''}
      <div class="toolbar-divider"></div>
      <button class="icon-tool-btn ${!hasPrev ? 'disabled' : ''}" id="btn-prev-file" data-tooltip="Previous File" data-shortcut="Alt+Left">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M8.5 3.5L5 7L8.5 10.5" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <button class="icon-tool-btn ${!hasNext ? 'disabled' : ''}" id="btn-next-file" data-tooltip="Next File" data-shortcut="Alt+Right">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M5.5 3.5L9 7L5.5 10.5" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <button class="icon-tool-btn" id="btn-refresh" data-tooltip="Refresh" data-shortcut="Cmd+R">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M3 8C3 5.24 5.24 3 8 3C9.8 3 11.38 3.96 12.25 5.4M13 8C13 10.76 10.76 13 8 13C6.2 13 4.62 12.04 3.75 10.6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
          <path d="M12.5 2.5V5.5H9.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M3.5 13.5V10.5H6.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
  `;
  root.appendChild(toolbar);

  // 2. Diff View Column Headers
  const colHeader = document.createElement('div');
  colHeader.className = 'studio-diff-columns-header';
  colHeader.innerHTML = `
    <div class="col-header-pane left-header">
      <span class="pane-title">${state.baseTitle || 'Base revision (HEAD)'}</span>
    </div>
    <div class="col-header-gutter"></div>
    <div class="col-header-pane right-header">
      <span class="pane-title">${state.targetTitle || 'Current version'}</span>
      ${state.readOnly ? '<span class="readonly-badge" title="Historical commit is read-only">Read-only</span>' : '<span class="editable-badge" title="You can edit this file directly">✎ Editable</span>'}
    </div>
  `;
  root.appendChild(colHeader);

  // 3. Diff Viewport
  const viewportWrapper = document.createElement('div');
  viewportWrapper.className = 'studio-diff-viewport-wrapper';

  const leftPane = document.createElement('div');
  leftPane.className = 'editor-pane left-pane';

  const rightPane = document.createElement('div');
  rightPane.className = 'editor-pane right-pane';
  rightPane.tabIndex = 0;

  const leftLineMap: { [line: number]: any } = {};
  const rightLineMap: { [line: number]: any } = {};
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

  // Render Left Lines
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

  // Render Right Lines
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

    const isEditable = !state.readOnly;
    const editableAttr = isEditable ? 'contenteditable="plaintext-only" spellcheck="false"' : '';

    rightHtml += `
      <div class="${rowClass}" data-line="${lineNum}">
        <span class="gutter-num">${lineNum}</span>
        <span class="line-content" ${editableAttr}>${contentHtml || '&nbsp;'}</span>
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

  // Inline editing events
  if (!state.readOnly) {
    let isEditingSession = false;

    rightPane.querySelectorAll('.line-content').forEach(span => {
      const lineRow = span.closest('.editor-line');
      const lineNum = parseInt(lineRow?.getAttribute('data-line') || '1', 10);

      span.addEventListener('focus', () => {
        isEditingSession = false;
      });

      span.addEventListener('blur', () => {
        isEditingSession = false;
        const curText = (span.textContent || '').replace(/\u00A0/g, ' ');
        if (state.currentLines[lineNum - 1] !== curText) {
          pushHistoryState(state.currentLines.join('\n'), rightPane.scrollTop);
          state.currentLines[lineNum - 1] = curText;
          triggerSave(vscode);
        }
      });

      span.addEventListener('input', () => {
        if (!isEditingSession) {
          pushHistoryState(state.currentLines.join('\n'), rightPane.scrollTop);
          isEditingSession = true;
        }
        const curText = (span.textContent || '').replace(/\u00A0/g, ' ');
        state.currentLines[lineNum - 1] = curText;
        queueDebouncedSave(vscode, lineNum, getCaretOffset(span as HTMLElement));
      });

      span.addEventListener('keydown', (e: KeyboardEvent) => {
        const isUndo = (e.metaKey || e.ctrlKey) && !e.shiftKey && (e.key === 'z' || e.key === 'Z');
        const isRedo = ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'z' || e.key === 'Z')) ||
                       ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y'));

        if (isUndo) {
          e.preventDefault();
          performUndo(vscode);
          return;
        }

        if (isRedo) {
          e.preventDefault();
          performRedo(vscode);
          return;
        }

        if ((e.metaKey || e.ctrlKey) && (e.key === 'x' || e.key === 'X')) {
          const sel = window.getSelection();
          const selectedText = sel ? sel.toString() : '';
          if (!selectedText) {
            e.preventDefault();
            pushHistoryState(state.currentLines.join('\n'), rightPane.scrollTop);
            const lineText = state.currentLines[lineNum - 1] || '';

            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(lineText + '\n').catch(() => {});
            }

            if (state.currentLines.length > 1) {
              state.currentLines.splice(lineNum - 1, 1);
            } else {
              state.currentLines[0] = '';
            }

            const nextLine = Math.min(lineNum, state.currentLines.length);
            triggerSave(vscode, nextLine, 0);
            return;
          }
        }

        if ((e.metaKey || e.ctrlKey) && (e.key === 's' || (e as any).keyCode === 83)) {
          e.preventDefault();
          const curText = (span.textContent || '').replace(/\u00A0/g, ' ');
          state.currentLines[lineNum - 1] = curText;
          triggerSave(vscode, lineNum, getCaretOffset(span as HTMLElement));
          return;
        }

        if (e.key === 'Tab') {
          e.preventDefault();
          pushHistoryState(state.currentLines.join('\n'), rightPane.scrollTop);
          const caret = getCaretOffset(span as HTMLElement);
          const fullText = state.currentLines[lineNum - 1] || '';
          const updated = fullText.slice(0, caret) + '  ' + fullText.slice(caret);
          state.currentLines[lineNum - 1] = updated;
          span.textContent = updated;
          setCaretPosition(span as HTMLElement, caret + 2);
          queueDebouncedSave(vscode, lineNum, caret + 2);
          return;
        }

        if (e.key === 'Enter') {
          e.preventDefault();
          pushHistoryState(state.currentLines.join('\n'), rightPane.scrollTop);
          const caret = getCaretOffset(span as HTMLElement);
          const fullText = state.currentLines[lineNum - 1] || '';
          const before = fullText.slice(0, caret);
          const after = fullText.slice(caret);

          const matchIndent = before.match(/^(\s*)/);
          const indent = matchIndent ? matchIndent[1] : '';
          const newLineText = indent + after;

          state.currentLines[lineNum - 1] = before;
          state.currentLines.splice(lineNum, 0, newLineText);

          triggerSave(vscode, lineNum + 1, indent.length);
          return;
        }

        if (e.key === 'Backspace') {
          const caret = getCaretOffset(span as HTMLElement);
          if (caret === 0 && lineNum > 1) {
            e.preventDefault();
            pushHistoryState(state.currentLines.join('\n'), rightPane.scrollTop);
            const prevText = state.currentLines[lineNum - 2] || '';
            const curText = state.currentLines[lineNum - 1] || '';
            const merged = prevText + curText;

            state.currentLines[lineNum - 2] = merged;
            state.currentLines.splice(lineNum - 1, 1);

            triggerSave(vscode, lineNum - 1, prevText.length);
            return;
          }
        }
      });
    });
  }

  // Middle Gutter with SVG ribbons
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

  // Overview Ruler
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
      const idx = state.blocks.indexOf(b);
      if (idx !== -1) {
        jumpToBlock(idx, true);
      }
    });
    overviewRuler.appendChild(stripe);
  });

  viewportWrapper.appendChild(overviewRuler);
  root.appendChild(viewportWrapper);
  app.appendChild(root);

  function updateRibbons(): void {
    runtime.updateRibbonsFn = updateRibbons;
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

      if (Math.max(y2, y4) < -20 || Math.min(y1, y3) > viewH + 20) {
        return;
      }

      const flat = 10;
      const d = `M 0,${y1} L ${flat},${y1} C ${flat + 10},${y1} ${W - flat - 10},${y3} ${W - flat},${y3} L ${W},${y3} L ${W},${y4} L ${W - flat},${y4} C ${W - flat - 10},${y4} ${flat + 10},${y2} ${flat},${y2} L 0,${y2} Z`;
      const fillClass = `ribbon-${b.type}`;

      svgHtml += `<path d="${d}" class="diff-ribbon ${fillClass}" data-block-id="${b.id}"/>`;

      if (!state.readOnly) {
        const checkY = b.isRightEmpty ? (y3 - 7) : (y3 + 3);
        const revertY = b.isLeftEmpty ? (y1 - 7) : (y1 + 3);

        if (revertY >= -15 && revertY <= viewH + 15) {
          ctrlHtml += `
            <button class="block-revert-btn" style="top: ${revertY}px;" data-tooltip="Revert change (Accept base revision)" data-block-id="${b.id}">
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                <path d="M7.5 11.5L12 7L7.5 2.5M2.5 11.5L7 7L2.5 2.5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.3"/>
              </svg>
            </button>
          `;
        }
        if (checkY >= -15 && checkY <= viewH + 15) {
          ctrlHtml += `
            <div class="gutter-block-control" style="top: ${checkY}px;" data-block-id="${b.id}">
              <label class="studio-chk-wrap" data-tooltip="Stage / Unstage change">
                <input type="checkbox" class="block-chk" ${b.staged ? 'checked' : ''} data-block-id="${b.id}"/>
                <span class="chk-custom">
                  <svg class="chk-mark" width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M1.8 5.2L4 7.4L8.2 2.8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <svg class="chk-indet" width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5H8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                  </svg>
                </span>
              </label>
            </div>
          `;
        }
      }
    });

    svgEl.innerHTML = svgHtml;
    controlsContainer.innerHTML = ctrlHtml;

    controlsContainer.querySelectorAll('.block-revert-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const blockId = parseInt(btn.getAttribute('data-block-id') || '0', 10);
        const block = state.blocks.find(b => b.id === blockId);
        if (block) {
          revertBlock(block, vscode, render);
        }
      });
    });

    controlsContainer.querySelectorAll('.block-chk').forEach(chk => {
      chk.addEventListener('change', (e) => {
        e.stopPropagation();
        const blockId = parseInt(chk.getAttribute('data-block-id') || '0', 10);
        const block = state.blocks.find(b => b.id === blockId);
        if (!block) return;
        const check = (chk as HTMLInputElement).checked;
        block.staged = check;

        const stagedCount = state.blocks.filter(b => b.staged).length;
        const totalCount = state.blocks.length;
        const stagedContent = buildStagedContent(state.baseContent, state.currentContent, state.blocks);

        const masterChk = document.querySelector('#chk-master-version') as HTMLInputElement | null;
        if (masterChk) {
          masterChk.checked = stagedCount === totalCount && totalCount > 0;
          masterChk.indeterminate = stagedCount > 0 && stagedCount < totalCount;
        }

        vscode.postMessage({
          type: 'updateBlockStage',
          payload: {
            filePath: state.filePath,
            stagedContent,
            stagedCount,
            totalCount
          }
        });
      });
    });
  }

  const setScroller = (side: 'left' | 'right') => {
    if (runtime.scrollAnimId) {
      cancelAnimationFrame(runtime.scrollAnimId);
      runtime.scrollAnimId = null;
      runtime.isSyncing = false;
    }
    runtime.activeScroller = side;
    if (runtime.scrollerTimeout) clearTimeout(runtime.scrollerTimeout);
    runtime.scrollerTimeout = setTimeout(() => {
      runtime.activeScroller = null;
    }, 150);
  };

  const handleWheel = (pane: HTMLElement, side: 'left' | 'right', e: WheelEvent) => {
    setScroller(side);
    if (e.shiftKey && e.deltaY !== 0 && e.deltaX === 0) {
      pane.scrollLeft += e.deltaY;
      e.preventDefault();
    }
  };

  leftPane.addEventListener('wheel', (e) => handleWheel(leftPane, 'left', e), { passive: false });
  rightPane.addEventListener('wheel', (e) => handleWheel(rightPane, 'right', e), { passive: false });
  leftPane.addEventListener('pointerdown', () => setScroller('left'), { passive: true });
  rightPane.addEventListener('pointerdown', () => setScroller('right'), { passive: true });
  leftPane.addEventListener('touchstart', () => setScroller('left'), { passive: true });
  rightPane.addEventListener('touchstart', () => setScroller('right'), { passive: true });

  leftPane.addEventListener('scroll', () => {
    if (runtime.isRendering || runtime.isSyncing || runtime.activeScroller === 'right') return;
    runtime.isSyncing = true;
    rightPane.scrollTop = mapLeftToRight(leftPane.scrollTop);
    runtime.savedScrollTop = rightPane.scrollTop;
    updateRibbons();
    requestAnimationFrame(() => {
      runtime.isSyncing = false;
    });
  }, { passive: true });

  rightPane.addEventListener('scroll', () => {
    if (runtime.isRendering) return;
    runtime.savedScrollTop = rightPane.scrollTop;
    if (runtime.isSyncing || runtime.activeScroller === 'left') return;
    runtime.isSyncing = true;
    leftPane.scrollTop = mapRightToLeft(rightPane.scrollTop);
    updateRibbons();
    requestAnimationFrame(() => {
      runtime.isSyncing = false;
    });
  }, { passive: true });

  if (runtime.savedScrollTop !== null) {
    runtime.isSyncing = true;
    rightPane.scrollTop = runtime.savedScrollTop;
    leftPane.scrollTop = mapRightToLeft(runtime.savedScrollTop);
  }

  requestAnimationFrame(() => {
    if (runtime.savedScrollTop !== null) {
      runtime.isSyncing = true;
      rightPane.scrollTop = runtime.savedScrollTop;
      leftPane.scrollTop = mapRightToLeft(runtime.savedScrollTop);
      updateRibbons();
      requestAnimationFrame(() => {
        runtime.isSyncing = false;
        runtime.isRendering = false;
      });
    } else {
      runtime.isRendering = false;
      updateRibbons();
      if (state.blocks && state.blocks.length > 0) {
        jumpToBlock(0, false);
      }
    }
  });

  if (state.pendingJumpDirection && state.blocks && state.blocks.length > 0) {
    const dir = state.pendingJumpDirection;
    const fromFileList = state.pendingFromFileList;
    state.pendingJumpDirection = null;
    state.pendingFromFileList = null;
    requestAnimationFrame(() => {
      if (fromFileList) {
        jumpFirstOrLastDiff(dir);
      } else {
        jumpDiff(dir, vscode);
      }
      window.focus();
      const rp = document.querySelector('.editor-pane.right-pane') as HTMLElement | null;
      if (rp) rp.focus();
    });
  }

  attachToolbarEvents(toolbar, vscode);

  if (state.focusTarget) {
    const target = state.focusTarget;
    state.focusTarget = null;
    requestAnimationFrame(() => {
      const lineEl = rightPane.querySelector(`.editor-line[data-line="${target.focusLine}"] .line-content`) as HTMLElement | null;
      if (lineEl) {
        lineEl.focus();
        setCaretPosition(lineEl, target.focusOffset || 0);
      }
    });
  }
}

function attachToolbarEvents(toolbar: HTMLElement, vscode: any): void {
  toolbar.querySelector('#btn-prev-diff')?.addEventListener('click', () => jumpDiff(-1, vscode));
  toolbar.querySelector('#btn-next-diff')?.addEventListener('click', () => jumpDiff(1, vscode));

  toolbar.querySelector('#btn-prev-file')?.addEventListener('click', () => {
    if (state.currentFileIndex > 0) {
      vscode.postMessage({ type: 'navigateFile', payload: state.currentFileIndex - 1 });
    }
  });

  toolbar.querySelector('#btn-next-file')?.addEventListener('click', () => {
    if (state.currentFileIndex < state.filesList.length - 1) {
      vscode.postMessage({ type: 'navigateFile', payload: state.currentFileIndex + 1 });
    }
  });

  toolbar.querySelector('#btn-refresh')?.addEventListener('click', () => {
    vscode.postMessage({ type: 'refreshDiff', payload: state.filePath });
  });

  toolbar.querySelector('#pill-highlight-words')?.addEventListener('click', () => {
    state.highlightWords = !state.highlightWords;
    render();
  });

  const masterChk = toolbar.querySelector('#chk-master-version') as HTMLInputElement | null;
  if (masterChk) {
    const stagedCount = state.blocks.filter(b => b.staged).length;
    const totalCount = state.blocks.length;
    masterChk.checked = stagedCount === totalCount && totalCount > 0;
    masterChk.indeterminate = stagedCount > 0 && stagedCount < totalCount;

    masterChk.addEventListener('change', () => {
      const check = masterChk.checked;
      state.blocks.forEach(b => { b.staged = check; });
      document.querySelectorAll('.block-chk').forEach(c => { (c as HTMLInputElement).checked = check; });
      const newStagedCount = check ? state.blocks.length : 0;
      const stagedContent = check ? state.currentContent : state.baseContent;
      vscode.postMessage({
        type: 'updateBlockStage',
        payload: {
          filePath: state.filePath,
          stagedContent,
          stagedCount: newStagedCount,
          totalCount: state.blocks.length
        }
      });
    });
  }

  toolbar.querySelector('#btn-tick-all')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const anyUnstaged = state.blocks.some(b => !b.staged);
    const targetCheck = anyUnstaged;
    if (masterChk) {
      masterChk.checked = targetCheck;
      masterChk.indeterminate = false;
    }
    state.blocks.forEach(b => { b.staged = targetCheck; });
    document.querySelectorAll('.block-chk').forEach(c => { (c as HTMLInputElement).checked = targetCheck; });
    const newStagedCount = targetCheck ? state.blocks.length : 0;
    const stagedContent = targetCheck ? state.currentContent : state.baseContent;
    vscode.postMessage({
      type: 'updateBlockStage',
      payload: {
        filePath: state.filePath,
        stagedContent,
        stagedCount: newStagedCount,
        totalCount: state.blocks.length
      }
    });
  });

  toolbar.querySelector('#btn-open-file')?.addEventListener('click', () => {
    if (state.filePath) {
      vscode.postMessage({ type: 'openFile', payload: state.filePath });
    }
  });

  toolbar.querySelector('#btn-rollback-all')?.addEventListener('click', () => {
    if (state.blocks.length > 0 && state.blocks[0].patchContent) {
      vscode.postMessage({ type: 'rollbackHunk', payload: { patch: state.blocks[0].patchContent } });
    }
  });
}

window.addEventListener('keydown', (e: KeyboardEvent) => {
  if (!state.readOnly) {
    const isUndo = (e.metaKey || e.ctrlKey) && !e.shiftKey && (e.key === 'z' || e.key === 'Z');
    const isRedo = ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'z' || e.key === 'Z')) ||
                   ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y'));
    if (isUndo) {
      e.preventDefault();
      performUndo(vscode);
      return;
    }
    if (isRedo) {
      e.preventDefault();
      performRedo(vscode);
      return;
    }
  }

  if (e.key === 'F4' || (e as any).keyCode === 115) {
    e.preventDefault();
    if (state.filePath) {
      vscode.postMessage({ type: 'openFile', payload: state.filePath });
    }
  } else if (e.key === 'F7' || (e as any).keyCode === 118) {
    e.preventDefault();
    if (e.shiftKey) {
      jumpDiff(-1, vscode);
    } else {
      jumpDiff(1, vscode);
    }
  }
});

window.addEventListener('message', (event) => {
  const msg = event.data;
  switch (msg.type) {
    case 'fileDiff': {
      hideDiffNavigationHint();
      const data = msg.payload;
      const isSameFile = (state.filePath && state.filePath === (data.path || ''));
      const isIdentical = isSameFile &&
        state.diff === (data.diff || '') &&
        state.stagedDiff === (data.stagedDiff || '') &&
        state.baseContent === (data.baseContent !== undefined ? data.baseContent : '') &&
        state.currentContent === (data.currentContent !== undefined ? data.currentContent : '') &&
        state.readOnly === (data.readOnly === true) &&
        !data.focusTarget;

      if (isIdentical) {
        return;
      }

      if (!isSameFile) {
        if (runtime.scrollAnimId) {
          cancelAnimationFrame(runtime.scrollAnimId);
          runtime.scrollAnimId = null;
        }
        runtime.isSyncing = false;
        runtime.isRendering = false;
        runtime.activeScroller = null;
        runtime.savedScrollTop = null;
        undoStack.length = 0;
        redoStack.length = 0;
      }
      state.filePath = data.path || '';
      state.fileName = data.fileName || state.filePath.split('/').pop() || '';
      state.fileDir = data.fileDir || state.filePath.split('/').slice(0, -1).join('/');
      state.diff = data.diff || '';
      state.stagedDiff = data.stagedDiff || '';
      state.baseContent = data.baseContent !== undefined ? data.baseContent : '';
      state.currentContent = data.currentContent !== undefined ? data.currentContent : '';
      state.filesList = data.filesList || [];
      state.currentFileIndex = data.currentFileIndex || 0;
      state.currentDiffIndex = 0;
      state.readOnly = data.readOnly === true;
      state.baseTitle = data.baseTitle || '';
      state.targetTitle = data.targetTitle || '';
      if (data.focusTarget) {
        state.focusTarget = data.focusTarget;
      }
      render();
      break;
    }
    case 'stagedDiffUpdated': {
      state.stagedDiff = msg.payload.stagedDiff || '';
      state.blocks.forEach(b => {
        b.staged = isBlockStaged(b, state.stagedDiff, state.baseLines, state.currentLines);
      });
      const masterChk = document.querySelector('#chk-master-version') as HTMLInputElement | null;
      if (masterChk) {
        const stagedCount = state.blocks.filter(b => b.staged).length;
        const totalCount = state.blocks.length;
        masterChk.checked = stagedCount === totalCount && totalCount > 0;
        masterChk.indeterminate = stagedCount > 0 && stagedCount < totalCount;
      }
      if (runtime.updateRibbonsFn) runtime.updateRibbonsFn();
      break;
    }
    case 'jumpDiff': {
      const direction = msg.payload?.direction || 1;
      const fromFileList = msg.payload?.fromFileList === true;
      if (state.blocks && state.blocks.length > 0) {
        if (fromFileList) {
          jumpFirstOrLastDiff(direction);
        } else {
          jumpDiff(direction, vscode);
        }
      } else {
        state.pendingJumpDirection = direction;
        state.pendingFromFileList = fromFileList;
      }
      window.focus();
      requestAnimationFrame(() => {
        const rightPane = document.querySelector('.editor-pane.right-pane') as HTMLElement | null;
        if (rightPane) {
          rightPane.focus();
        }
      });
      break;
    }
    case 'themeTokens': {
      const tokens = msg.payload;
      if (!tokens) break;
      let styleEl = document.getElementById('dynamic-syntax-tokens');
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'dynamic-syntax-tokens';
        document.head.appendChild(styleEl);
      }
      styleEl.textContent = `
        :root {
          --syn-kwd: ${tokens.kwd} !important;
          --syn-type: ${tokens.type} !important;
          --syn-fn: ${tokens.fn} !important;
          --syn-str: ${tokens.str} !important;
          --syn-num: ${tokens.num} !important;
          --syn-const: ${tokens.constVal} !important;
          --syn-var: ${tokens.varVal} !important;
          --syn-comment: ${tokens.comment} !important;
          --syn-anno: ${tokens.anno || tokens.type} !important;
          --syn-punct: ${tokens.punct || '#948a8b'} !important;
        }
      `;
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

// Tooltips setup
function initTooltips(): void {
  let tooltipEl = document.getElementById('studio-tooltip');
  if (!tooltipEl) {
    tooltipEl = document.createElement('div');
    tooltipEl.id = 'studio-tooltip';
    tooltipEl.className = 'studio-floating-tooltip';
    document.body.appendChild(tooltipEl);
  }

  let hoverTimer: any = null;
  let currentTarget: HTMLElement | null = null;

  document.addEventListener('mouseover', (e: MouseEvent) => {
    const target = (e.target as HTMLElement | null)?.closest('[data-tooltip], [title]') as HTMLElement | null;
    if (!target) {
      hideTooltip();
      return;
    }

    if (target.hasAttribute('title') && !target.hasAttribute('data-tooltip')) {
      const titleText = target.getAttribute('title') || '';
      target.removeAttribute('title');
      target.setAttribute('data-tooltip', titleText);
    } else if (target.hasAttribute('title')) {
      target.removeAttribute('title');
    }

    if (currentTarget === target) return;
    currentTarget = target;

    if (hoverTimer) clearTimeout(hoverTimer);
    hoverTimer = setTimeout(() => {
      showTooltip(target);
    }, 180);
  }, true);

  document.addEventListener('mouseout', (e: MouseEvent) => {
    const related = e.relatedTarget as HTMLElement | null;
    if (currentTarget && (!related || !currentTarget.contains(related))) {
      hideTooltip();
    }
  }, true);

  document.addEventListener('click', () => {
    hideTooltip();
  }, true);

  window.addEventListener('scroll', () => {
    hideTooltip();
  }, true);

  function showTooltip(target: HTMLElement): void {
    const text = target.getAttribute('data-tooltip');
    if (!text || !tooltipEl) return;
    const shortcut = target.getAttribute('data-shortcut');

    tooltipEl.innerHTML = `
      <span class="tooltip-text">${escapeHtml(text)}</span>
      ${shortcut ? `<span class="tooltip-shortcut">${escapeHtml(shortcut)}</span>` : ''}
    `;
    tooltipEl.style.display = 'flex';
    tooltipEl.classList.remove('visible');

    const rect = target.getBoundingClientRect();
    const tipRect = tooltipEl.getBoundingClientRect();

    let top = rect.bottom + 6;
    let left = rect.left + (rect.width / 2) - (tipRect.width / 2);

    if (top + tipRect.height > window.innerHeight - 6) {
      top = rect.top - tipRect.height - 6;
    }
    if (left < 6) left = 6;
    if (left + tipRect.width > window.innerWidth - 6) {
      left = window.innerWidth - tipRect.width - 6;
    }

    tooltipEl.style.top = `${Math.round(top)}px`;
    tooltipEl.style.left = `${Math.round(left)}px`;
    requestAnimationFrame(() => {
      if (tooltipEl) tooltipEl.classList.add('visible');
    });
  }

  function hideTooltip(): void {
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      hoverTimer = null;
    }
    currentTarget = null;
    if (tooltipEl) {
      tooltipEl.classList.remove('visible');
      tooltipEl.style.display = 'none';
    }
  }
}

initTooltips();

// Handshake
vscode.postMessage({ type: 'ready' });
