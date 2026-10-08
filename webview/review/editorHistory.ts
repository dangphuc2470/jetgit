import { state, runtime, undoStack, redoStack, MAX_HISTORY } from './state';
import { DiffBlock } from './types';

let saveTimer: any = null;

export function pushHistoryState(content: string, scrollY?: number): void {
  if (!content) return;
  if (undoStack.length > 0 && undoStack[undoStack.length - 1].content === content) {
    return;
  }
  undoStack.push({
    content,
    scrollTop: scrollY !== undefined && scrollY !== null ? scrollY : (runtime.savedScrollTop || 0)
  });
  if (undoStack.length > MAX_HISTORY) {
    undoStack.shift();
  }
  redoStack.length = 0;
}

export function performUndo(vscode: any): void {
  if (state.readOnly || undoStack.length === 0) return;
  const curContent = state.currentLines.join('\n');
  const prevState = undoStack.pop()!;
  const rightPane = document.querySelector('.editor-pane.right-pane');
  const curScroll = rightPane ? rightPane.scrollTop : (runtime.savedScrollTop || 0);
  redoStack.push({
    content: curContent,
    scrollTop: curScroll
  });

  runtime.savedScrollTop = prevState.scrollTop;
  state.currentLines = prevState.content.split('\n');
  state.currentContent = prevState.content;
  vscode.postMessage({
    type: 'saveFileContent',
    payload: {
      filePath: state.filePath,
      content: prevState.content,
      focusLine: null,
      focusOffset: null
    }
  });
}

export function performRedo(vscode: any): void {
  if (state.readOnly || redoStack.length === 0) return;
  const curContent = state.currentLines.join('\n');
  const nextState = redoStack.pop()!;
  const rightPane = document.querySelector('.editor-pane.right-pane');
  const curScroll = rightPane ? rightPane.scrollTop : (runtime.savedScrollTop || 0);
  undoStack.push({
    content: curContent,
    scrollTop: curScroll
  });

  runtime.savedScrollTop = nextState.scrollTop;
  state.currentLines = nextState.content.split('\n');
  state.currentContent = nextState.content;
  vscode.postMessage({
    type: 'saveFileContent',
    payload: {
      filePath: state.filePath,
      content: nextState.content,
      focusLine: null,
      focusOffset: null
    }
  });
}

export function triggerSave(vscode: any, focusLine?: number | null, focusOffset?: number | null): void {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  if (state.readOnly || !state.filePath) return;
  const rightPane = document.querySelector('.editor-pane.right-pane');
  if (rightPane) {
    runtime.savedScrollTop = rightPane.scrollTop;
  }
  const newContent = state.currentLines.join('\n');
  state.currentContent = newContent;
  vscode.postMessage({
    type: 'saveFileContent',
    payload: {
      filePath: state.filePath,
      content: newContent,
      focusLine: focusLine || null,
      focusOffset: focusOffset !== undefined ? focusOffset : null
    }
  });
}

export function queueDebouncedSave(vscode: any, focusLine?: number | null, focusOffset?: number | null): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    triggerSave(vscode, focusLine, focusOffset);
  }, 1200);
}

export function revertBlock(block: DiffBlock, vscode: any, onRender: () => void): void {
  const rightPane = document.querySelector('.editor-pane.right-pane');
  if (rightPane) {
    runtime.savedScrollTop = rightPane.scrollTop;
  }
  pushHistoryState(state.currentLines.join('\n'), runtime.savedScrollTop || 0);

  const currentLines = [...state.currentLines];
  const baseLines = [...state.baseLines];

  const replaceStart = block.rightStart - 1;
  const replaceCount = block.isRightEmpty ? 0 : (block.addCount || 0);

  const insertLines: string[] = [];
  if (!block.isLeftEmpty && block.delCount && block.delCount > 0) {
    for (let i = 0; i < block.delCount; i++) {
      const bIdx = (block.leftStart - 1) + i;
      if (bIdx >= 0 && bIdx < baseLines.length) {
        insertLines.push(baseLines[bIdx]);
      }
    }
  }

  currentLines.splice(replaceStart, replaceCount, ...insertLines);
  const newContent = currentLines.join('\n');

  // Optimistic UI update: Immediate 0ms local response
  state.currentLines = currentLines;
  state.currentContent = newContent;
  onRender();

  vscode.postMessage({
    type: 'revertBlockContent',
    payload: {
      filePath: state.filePath,
      newContent
    }
  });
}

export function setCaretPosition(el: HTMLElement, offset: number): void {
  if (!el) return;
  el.focus();
  const sel = window.getSelection();
  if (!sel) return;
  const range = document.createRange();
  let charCount = 0;
  let nodeToSet: Node = el;
  let nodeOffset = 0;

  function traverse(node: Node): boolean {
    if (node.nodeType === Node.TEXT_NODE) {
      const textLen = (node.nodeValue || '').length;
      const nextCharCount = charCount + textLen;
      if (!nodeToSet || nodeToSet === el) {
        if (offset <= nextCharCount) {
          nodeToSet = node;
          nodeOffset = Math.max(0, offset - charCount);
          return true;
        }
      }
      charCount = nextCharCount;
    } else {
      for (let i = 0; i < node.childNodes.length; i++) {
        if (traverse(node.childNodes[i])) return true;
      }
    }
    return false;
  }
  traverse(el);
  try {
    range.setStart(nodeToSet, Math.min(nodeOffset, (nodeToSet.nodeValue || '').length));
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  } catch (e) {}
}

export function getCaretOffset(element: HTMLElement): number {
  let caretOffset = 0;
  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0) {
    try {
      const range = sel.getRangeAt(0);
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(element);
      preCaretRange.setEnd(range.endContainer, range.endOffset);
      caretOffset = preCaretRange.toString().length;
    } catch (e) {}
  }
  return caretOffset;
}
