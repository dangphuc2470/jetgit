import { escapeHtml } from '../shared/escape';
import { LINE_HEIGHT, state, runtime } from './state';
import { mapLeftToRight, mapRightToLeft } from './diffParser';

let pendingNextFile = false;
let pendingPrevFile = false;
let hintTimeout: any = null;

export function hideDiffNavigationHint(): void {
  pendingNextFile = false;
  pendingPrevFile = false;
  if (hintTimeout) {
    clearTimeout(hintTimeout);
    hintTimeout = null;
  }
  const el = document.getElementById('diff-nav-hint');
  if (el) {
    el.style.opacity = '0';
    el.style.transform = 'translate(-50%, 8px)';
    setTimeout(() => {
      if (el && el.parentNode) el.parentNode.removeChild(el);
    }, 200);
  }
}

export function showDiffNavigationHint(kbdText: string, messageText: string, duration = 3500): void {
  if (hintTimeout) {
    clearTimeout(hintTimeout);
    hintTimeout = null;
  }
  let el = document.getElementById('diff-nav-hint');
  if (!el) {
    el = document.createElement('div');
    el.id = 'diff-nav-hint';
    document.body.appendChild(el);
  }
  el.innerHTML = `<span class="hint-kbd">${escapeHtml(kbdText)}</span><span class="hint-msg">${escapeHtml(messageText)}</span>`;
  el.style.opacity = '1';
  el.style.transform = 'translate(-50%, 0)';
  hintTimeout = setTimeout(() => {
    hideDiffNavigationHint();
  }, duration);
}

export function highlightActiveBlock(blockId: number): void {
  const svgEl = document.querySelector('.gutter-ribbon-svg');
  if (!svgEl) return;
  const ribbon = svgEl.querySelector(`[data-block-id="${blockId}"]`);
  if (ribbon) {
    ribbon.classList.add('diff-ribbon-active');
    setTimeout(() => {
      ribbon.classList.remove('diff-ribbon-active');
    }, 700);
  }
}

export function smoothScrollBoth(
  leftPane: HTMLElement,
  rightPane: HTMLElement,
  targetLeft: number,
  targetRight: number,
  duration = 240,
  onComplete?: () => void
): void {
  if (runtime.scrollAnimId) {
    cancelAnimationFrame(runtime.scrollAnimId);
    runtime.scrollAnimId = null;
  }

  const startLeft = leftPane.scrollTop;
  const startRight = rightPane.scrollTop;
  const diffLeft = targetLeft - startLeft;
  const diffRight = targetRight - startRight;

  if (Math.abs(diffLeft) < 1 && Math.abs(diffRight) < 1) {
    if (onComplete) onComplete();
    return;
  }

  runtime.isSyncing = true;
  let startTime: number | null = null;

  function step(timestamp: number): void {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);

    leftPane.scrollTop = Math.round(startLeft + diffLeft * ease);
    rightPane.scrollTop = Math.round(startRight + diffRight * ease);
    runtime.savedScrollTop = rightPane.scrollTop;
    if (runtime.updateRibbonsFn) runtime.updateRibbonsFn();

    if (progress < 1) {
      runtime.scrollAnimId = requestAnimationFrame(step);
    } else {
      leftPane.scrollTop = targetLeft;
      rightPane.scrollTop = targetRight;
      runtime.savedScrollTop = targetRight;
      if (runtime.updateRibbonsFn) runtime.updateRibbonsFn();
      runtime.scrollAnimId = null;
      requestAnimationFrame(() => {
        runtime.isSyncing = false;
      });
      if (onComplete) onComplete();
    }
  }

  runtime.scrollAnimId = requestAnimationFrame(step);
}

export function jumpToBlock(index: number, smooth = false): void {
  if (!state.blocks || state.blocks.length === 0) return;
  if (index < 0) index = state.blocks.length - 1;
  if (index >= state.blocks.length) index = 0;
  state.currentDiffIndex = index;

  const b = state.blocks[index];
  if (!b) return;

  const leftPane = document.querySelector('.editor-pane.left-pane') as HTMLElement | null;
  const rightPane = document.querySelector('.editor-pane.right-pane') as HTMLElement | null;
  if (!leftPane || !rightPane) return;

  let targetLeft = 0;
  let targetRight = 0;

  if (b.isRightEmpty) {
    targetLeft = Math.max(0, (b.leftStart - 1) * LINE_HEIGHT - 60);
    targetRight = mapLeftToRight(targetLeft);
  } else {
    targetRight = Math.max(0, (b.rightStart - 1) * LINE_HEIGHT - 60);
    targetLeft = mapRightToLeft(targetRight);
  }

  if (smooth) {
    smoothScrollBoth(leftPane, rightPane, targetLeft, targetRight, 240, () => {
      highlightActiveBlock(b.id);
    });
  } else {
    if (runtime.scrollAnimId) {
      cancelAnimationFrame(runtime.scrollAnimId);
      runtime.scrollAnimId = null;
    }
    runtime.isSyncing = true;
    rightPane.scrollTop = targetRight;
    leftPane.scrollTop = targetLeft;
    runtime.savedScrollTop = targetRight;
    if (runtime.updateRibbonsFn) runtime.updateRibbonsFn();
    requestAnimationFrame(() => {
      runtime.isSyncing = false;
    });
    highlightActiveBlock(b.id);
  }
}

export function jumpFirstOrLastDiff(direction: number): void {
  if (!state.blocks || state.blocks.length === 0) return;
  const targetIdx = direction > 0 ? 0 : state.blocks.length - 1;
  hideDiffNavigationHint();
  jumpToBlock(targetIdx, true);
  window.focus();
  const rightPane = document.querySelector('.editor-pane.right-pane') as HTMLElement | null;
  if (rightPane) rightPane.focus();
}

export function jumpDiff(direction: number, vscode: any): void {
  if (!state.blocks || state.blocks.length === 0) {
    if (direction > 0 && state.currentFileIndex < state.filesList.length - 1) {
      if (pendingNextFile) {
        hideDiffNavigationHint();
        vscode.postMessage({ type: 'navigateFile', payload: state.currentFileIndex + 1 });
      } else {
        pendingNextFile = true;
        showDiffNavigationHint('F7', 'Press F7 again to go to the next file');
      }
    }
    return;
  }

  const rightPane = document.querySelector('.editor-pane.right-pane') as HTMLElement | null;
  const currentScroll = rightPane ? rightPane.scrollTop : 0;

  const getBlockY = (b: any): number => {
    return b.isRightEmpty ? mapLeftToRight((b.leftStart - 1) * LINE_HEIGHT) : (b.rightStart - 1) * LINE_HEIGHT;
  };

  if (direction > 0) {
    let targetIdx = state.blocks.findIndex(b => getBlockY(b) > currentScroll + 70);
    if (targetIdx !== -1) {
      hideDiffNavigationHint();
      jumpToBlock(targetIdx, true);
    } else {
      const hasNextFile = state.currentFileIndex < state.filesList.length - 1;
      if (hasNextFile) {
        if (pendingNextFile) {
          hideDiffNavigationHint();
          vscode.postMessage({ type: 'navigateFile', payload: state.currentFileIndex + 1 });
        } else {
          pendingNextFile = true;
          showDiffNavigationHint('F7', 'Press F7 again to go to the next file');
        }
      } else {
        showDiffNavigationHint('F7', 'You are at the last change of the last file');
      }
    }
  } else {
    let targetIdx = -1;
    for (let i = state.blocks.length - 1; i >= 0; i--) {
      if (getBlockY(state.blocks[i]) < currentScroll + 50) {
        targetIdx = i;
        break;
      }
    }
    if (targetIdx !== -1) {
      hideDiffNavigationHint();
      jumpToBlock(targetIdx, true);
    } else {
      const hasPrevFile = state.currentFileIndex > 0;
      if (hasPrevFile) {
        if (pendingPrevFile) {
          hideDiffNavigationHint();
          vscode.postMessage({ type: 'navigateFile', payload: state.currentFileIndex - 1 });
        } else {
          pendingPrevFile = true;
          showDiffNavigationHint('Shift+F7', 'Press Shift+F7 again to go to the previous file');
        }
      } else {
        showDiffNavigationHint('Shift+F7', 'You are at the first change of the first file');
      }
    }
  }
}
