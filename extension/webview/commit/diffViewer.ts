import { escapeHtml } from '../shared/escape';
import { state } from './state';
import { parseDiff, constructHunkPatch, constructBlockPatch } from './diffParser';

export function renderDiffViewer(vscode: any, onRender: () => void): HTMLElement {
  const diffContainer = document.createElement('div');
  diffContainer.className = 'diff-viewer-wrapper';

  const selectedFile = state.selectedFile || (state.files[0] ? state.files[0].path : '');
  const fileName = selectedFile.split('/').pop() || '';
  const fileDir = selectedFile.split('/').slice(0, -1).join('/');

  // Header bar
  const diffHeader = document.createElement('div');
  diffHeader.className = 'diff-header-bar';
  const isFileInitiallyChecked = state.checkedFiles.has(selectedFile);
  diffHeader.innerHTML = `
    <div class="diff-title-info">
      <label class="diff-master-chk-wrap" title="Stage / Unstage All Differences in File" data-tooltip="Tick All Differences in File">
        <input type="checkbox" id="chk-diff-all" class="diff-master-chk" ${isFileInitiallyChecked ? 'checked' : ''}/>
        <span class="diff-file-name">${escapeHtml(fileName)}</span>
      </label>
      <span class="diff-file-dir">${escapeHtml(fileDir)}</span>
    </div>
    <div class="diff-actions">
      <button class="diff-tool-btn" id="btn-tick-all" title="Tick All Differences in File" data-tooltip="Tick All Differences in File">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style="display:block;">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
        </svg>
      </button>
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
  diffContent.addEventListener('wheel', (e) => {
    if (e.shiftKey && e.deltaY !== 0 && e.deltaX === 0) {
      diffContent.scrollLeft += e.deltaY;
      e.preventDefault();
    }
  }, { passive: false });

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

  const masterChk = diffHeader.querySelector('#chk-diff-all') as HTMLInputElement | null;
  const btnTickAll = diffHeader.querySelector('#btn-tick-all');

  function updateMasterState(): void {
    if (!masterChk) return;
    const allCheckboxes = diffContent.querySelectorAll('.hunk-chk, .line-chk') as NodeListOf<HTMLInputElement>;
    if (allCheckboxes.length === 0) {
      masterChk.checked = state.checkedFiles.has(selectedFile);
      masterChk.indeterminate = false;
      return;
    }
    const allChecked = Array.from(allCheckboxes).every(c => c.checked);
    const someChecked = Array.from(allCheckboxes).some(c => c.checked);
    masterChk.checked = allChecked;
    masterChk.indeterminate = !allChecked && someChecked;
  }

  function toggleAllDifferences(targetState: boolean): void {
    const allHunkChks = diffContent.querySelectorAll('.hunk-chk') as NodeListOf<HTMLInputElement>;
    const allLineChks = diffContent.querySelectorAll('.line-chk') as NodeListOf<HTMLInputElement>;

    allHunkChks.forEach(c => { c.checked = targetState; });
    allLineChks.forEach(c => { c.checked = targetState; });

    hunks.forEach(h => {
      h.staged = targetState;
      if (h.blocks) {
        h.blocks.forEach(b => {
          b.staged = targetState;
          b.lines.forEach(bl => { bl.staged = targetState; });
        });
      }
    });

    if (masterChk) {
      masterChk.checked = targetState;
      masterChk.indeterminate = false;
    }

    if (targetState) {
      state.checkedFiles.add(selectedFile);
      vscode.postMessage({ type: 'stageFile', payload: selectedFile });
    } else {
      state.checkedFiles.delete(selectedFile);
      vscode.postMessage({ type: 'unstageFile', payload: selectedFile });
    }

    const treeChk = document.getElementById(`chk-${selectedFile}`) as HTMLInputElement | null;
    if (treeChk) treeChk.checked = targetState;
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

    const hunkChk = hunkHeader.querySelector('.hunk-chk') as HTMLInputElement;
    hunkChk.addEventListener('change', () => {
      const check = hunkChk.checked;
      hunk.staged = check;
      if (hunk.blocks) {
        hunk.blocks.forEach(b => {
          b.staged = check;
          b.lines.forEach(bLine => { bLine.staged = check; });
        });
        diffContent.querySelectorAll(`.line-chk[data-hunk="${hIdx}"]`).forEach((c: any) => {
          c.checked = check;
        });
      }
      const patchContent = constructHunkPatch(selectedFile, hunk);
      if (check) {
        vscode.postMessage({ type: 'applyHunkPatch', payload: { patch: patchContent, reverse: false } });
      } else {
        vscode.postMessage({ type: 'applyHunkPatch', payload: { patch: patchContent, reverse: true } });
      }
      updateMasterState();
    });

    diffContent.appendChild(hunkHeader);

    // Render lines in this hunk
    hunk.lines.forEach(l => {
      const lineRow = document.createElement('div');
      lineRow.className = `diff-line diff-${l.type}`;

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
        const blockChk = lineRow.querySelector('.line-chk') as HTMLInputElement | null;
        if (blockChk) {
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
            updateMasterState();
          });
        }
      }

      diffContent.appendChild(lineRow);
    });
  });

  diffContainer.appendChild(diffContent);

  if (masterChk) {
    masterChk.addEventListener('change', () => {
      toggleAllDifferences(masterChk.checked);
    });
  }

  if (btnTickAll) {
    btnTickAll.addEventListener('click', (e) => {
      e.stopPropagation();
      const allCheckboxes = diffContent.querySelectorAll('.hunk-chk, .line-chk') as NodeListOf<HTMLInputElement>;
      const anyUnchecked = Array.from(allCheckboxes).some(c => !c.checked);
      toggleAllDifferences(anyUnchecked);
    });
  }

  updateMasterState();

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

  const btnCloseDiff = diffHeader.querySelector('#btn-close-diff');
  if (btnCloseDiff) {
    btnCloseDiff.addEventListener('click', () => {
      state.showDiff = false;
      onRender();
    });
  }

  const btnOpenEditor = diffHeader.querySelector('#btn-open-editor');
  if (btnOpenEditor) {
    btnOpenEditor.addEventListener('click', () => {
      vscode.postMessage({ type: 'openDiffInEditor', payload: selectedFile });
    });
  }

  return diffContainer;
}
