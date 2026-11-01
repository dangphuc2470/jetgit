<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { highlightCode, computeWordDiff } from "../shared/syntaxHighlight";
  import type { ExtensionToReviewMessage } from "../shared/protocol";
  import { getVsCodeApi } from "$shared/vscodeApi";
  import { LINE_HEIGHT, state as reviewState, runtime, undoStack, redoStack } from "./state";
  import type { DiffBlock } from "./types";
  import {
    parseDiffData,
    mapLeftToRight,
    mapRightToLeft,
    buildStagedContent,
    isBlockStaged,
    computeAlignedRenderLines,
  } from "./diffParser";
  import {
    pushHistoryState,
    performUndo,
    performRedo,
    revertBlock,
    triggerSave,
    queueDebouncedSave,
    setCaretPosition,
    getCaretOffset,
  } from "./editorHistory";
  import {
    jumpToBlock,
    jumpDiff,
    jumpFirstOrLastDiff,
    hideDiffNavigationHint,
    highlightActiveBlock,
  } from "./navigation";
  import ReviewToolbar from "./ReviewToolbar.svelte";
  import DiffRibbon from "./DiffRibbon.svelte";
  import OverviewRuler from "./OverviewRuler.svelte";

  const vscode = getVsCodeApi();

  let filePath = $state("");
  let fileName = $state("");
  let fileDir = $state("");
  let diff = $state("");
  let stagedDiff = $state("");
  let baseContent = $state("");
  let currentContent = $state("");
  let baseLines = $state<string[]>([]);
  let currentLines = $state<string[]>([]);
  let filesList = $state<string[]>([]);
  let currentFileIndex = $state(0);
  let readOnly = $state(false);
  let baseTitle = $state("");
  let targetTitle = $state("");
  let highlightWords = $state(true);

  let blocks = $state<DiffBlock[]>([]);
  let sLeft = $state(0);
  let sRight = $state(0);
  let viewH = $state(800);
  let activeBlockId = $state<number | null>(null);

  let leftPaneEl: HTMLDivElement | null = $state(null);
  let rightPaneEl: HTMLDivElement | null = $state(null);
  let middleGutterEl: HTMLDivElement | null = $state(null);

  let activeEditableSpan: HTMLElement | null = null;
  let isMouseDragging = false;
  let mouseDownPos = { x: 0, y: 0 };
  let lastRenderedFilePath = "";

  // Master checkbox status
  let stagedBlocksCount = $derived(blocks.filter((b) => b.staged).length);
  let totalBlocksCount = $derived(blocks.length);
  let isMasterChecked = $derived(stagedBlocksCount === totalBlocksCount && totalBlocksCount > 0);
  let isMasterIndeterminate = $derived(stagedBlocksCount > 0 && stagedBlocksCount < totalBlocksCount);

  let alignedResult = $derived.by(() => {
    return computeAlignedRenderLines(baseLines, currentLines, blocks, highlightWords);
  });

  let leftRenderLines = $derived(alignedResult.leftLines);
  let rightRenderLines = $derived(alignedResult.rightLines);
  let totalAlignedLines = $derived(alignedResult.totalAlignedLines);

  // Sync state singleton with Svelte component
  function syncToSingleton() {
    reviewState.filePath = filePath;
    reviewState.fileName = fileName;
    reviewState.fileDir = fileDir;
    reviewState.diff = diff;
    reviewState.stagedDiff = stagedDiff;
    reviewState.baseContent = baseContent;
    reviewState.currentContent = currentContent;
    reviewState.baseLines = baseLines;
    reviewState.currentLines = currentLines;
    reviewState.filesList = filesList;
    reviewState.currentFileIndex = currentFileIndex;
    reviewState.readOnly = readOnly;
    reviewState.baseTitle = baseTitle;
    reviewState.targetTitle = targetTitle;
    reviewState.highlightWords = highlightWords;
    reviewState.blocks = blocks;
  }

  function syncFromSingleton() {
    filePath = reviewState.filePath;
    fileName = reviewState.fileName;
    fileDir = reviewState.fileDir;
    diff = reviewState.diff;
    stagedDiff = reviewState.stagedDiff || "";
    baseContent = reviewState.baseContent;
    currentContent = reviewState.currentContent;
    baseLines = [...reviewState.baseLines];
    currentLines = [...reviewState.currentLines];
    filesList = [...reviewState.filesList];
    currentFileIndex = reviewState.currentFileIndex;
    readOnly = reviewState.readOnly;
    baseTitle = reviewState.baseTitle || "";
    targetTitle = reviewState.targetTitle || "";
    highlightWords = reviewState.highlightWords;
    blocks = [...reviewState.blocks];
  }

  function handleRevertBlock(block: DiffBlock) {
    revertBlock(block, vscode, () => {
      syncFromSingleton();
      requestAnimationFrame(() => updateScrollPositions());
    });
  }

  function handleToggleStageBlock(block: DiffBlock, checked: boolean) {
    block.staged = checked;
    blocks = [...blocks];
    reviewState.blocks = blocks;

    const stagedCount = blocks.filter((b) => b.staged).length;
    const totalCount = blocks.length;
    const stagedCont = buildStagedContent(baseContent, currentContent, blocks);

    vscode.postMessage({
      type: "updateBlockStage",
      payload: {
        filePath,
        stagedContent: stagedCont,
        stagedCount,
        totalCount,
      },
    });
  }

  function handleToggleMasterStage() {
    const nextChecked = !isMasterChecked;
    for (const b of blocks) {
      b.staged = nextChecked;
    }
    blocks = [...blocks];
    reviewState.blocks = blocks;

    const stagedCount = nextChecked ? blocks.length : 0;
    const stagedCont = nextChecked ? currentContent : baseContent;

    vscode.postMessage({
      type: "updateBlockStage",
      payload: {
        filePath,
        stagedContent: stagedCont,
        stagedCount,
        totalCount: blocks.length,
      },
    });
  }

  function handleTickAll() {
    const anyUnstaged = blocks.some((b) => !b.staged);
    const targetCheck = anyUnstaged;
    for (const b of blocks) {
      b.staged = targetCheck;
    }
    blocks = [...blocks];
    reviewState.blocks = blocks;

    const stagedCount = targetCheck ? blocks.length : 0;
    const stagedCont = targetCheck ? currentContent : baseContent;

    vscode.postMessage({
      type: "updateBlockStage",
      payload: {
        filePath,
        stagedContent: stagedCont,
        stagedCount,
        totalCount: blocks.length,
      },
    });
  }

  // Scroll Synchronization
  const setScroller = (side: "left" | "right") => {
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

  const onWheelPane = (pane: HTMLElement | null, side: "left" | "right", e: WheelEvent) => {
    if (!pane) return;
    setScroller(side);
    if (e.shiftKey && e.deltaY !== 0 && e.deltaX === 0) {
      pane.scrollLeft += e.deltaY;
      e.preventDefault();
    }
  };

  function updateScrollPositions() {
    if (leftPaneEl) sLeft = leftPaneEl.scrollTop;
    if (rightPaneEl) sRight = rightPaneEl.scrollTop;
    if (middleGutterEl) viewH = middleGutterEl.clientHeight || 800;
  }

  function onLeftScroll() {
    if (runtime.isRendering || runtime.isSyncing || runtime.activeScroller === "right") return;
    if (!leftPaneEl || !rightPaneEl) return;
    runtime.isSyncing = true;
    rightPaneEl.scrollTop = leftPaneEl.scrollTop;
    runtime.savedScrollTop = rightPaneEl.scrollTop;
    updateScrollPositions();
    requestAnimationFrame(() => {
      runtime.isSyncing = false;
    });
  }

  function onRightScroll() {
    if (runtime.isRendering) return;
    if (!leftPaneEl || !rightPaneEl) return;
    runtime.savedScrollTop = rightPaneEl.scrollTop;
    if (runtime.isSyncing || runtime.activeScroller === "left") return;
    runtime.isSyncing = true;
    leftPaneEl.scrollTop = rightPaneEl.scrollTop;
    updateScrollPositions();
    requestAnimationFrame(() => {
      runtime.isSyncing = false;
    });
  }

  // Inline Editing in Right Pane
  function deactivateCurrentEditable(): void {
    if (!activeEditableSpan || !rightPaneEl) return;
    const oldSpan = activeEditableSpan;
    activeEditableSpan = null;
    const lineRow = oldSpan.closest(".editor-line");
    const lineNum = parseInt(lineRow?.getAttribute("data-line") || "1", 10);
    const curText = (oldSpan.textContent || "").replace(/\u00A0/g, " ");

    if (currentLines[lineNum - 1] !== curText) {
      pushHistoryState(currentLines.join("\n"), rightPaneEl.scrollTop);
      currentLines[lineNum - 1] = curText;
      reviewState.currentLines = currentLines;
      triggerSave(vscode);
    }
    oldSpan.removeAttribute("contenteditable");
    oldSpan.classList.remove("active-editing");
  }

  function activateLineEditing(span: HTMLElement, clientX?: number, clientY?: number, explicitOffset?: number): void {
    if (readOnly) return;
    if (activeEditableSpan && activeEditableSpan !== span) {
      deactivateCurrentEditable();
    }
    activeEditableSpan = span;
    span.setAttribute("contenteditable", "plaintext-only");
    span.setAttribute("spellcheck", "false");
    span.classList.add("active-editing");
    span.focus();

    if (explicitOffset !== undefined) {
      setCaretPosition(span, explicitOffset);
    } else if (clientX !== undefined && clientY !== undefined) {
      const docAny = document as any;
      if (document.caretRangeFromPoint) {
        const range = document.caretRangeFromPoint(clientX, clientY);
        if (range) {
          const sel = window.getSelection();
          if (sel) {
            sel.removeAllRanges();
            sel.addRange(range);
          }
        }
      } else if (docAny.caretPositionFromPoint) {
        const pos = docAny.caretPositionFromPoint(clientX, clientY);
        if (pos) {
          const range = document.createRange();
          range.setStart(pos.offsetNode, pos.offset);
          range.collapse(true);
          const sel = window.getSelection();
          if (sel) {
            sel.removeAllRanges();
            sel.addRange(range);
          }
        }
      }
    }
  }

  function getOffsetInSpan(span: HTMLElement, targetNode: Node, targetOffset: number): number {
    if (targetNode === span) {
      if (targetOffset === 0) return 0;
      return (span.textContent || "").replace(/\u00A0/g, " ").length;
    }
    if (!span.contains(targetNode)) {
      const line = span.closest(".editor-line");
      if (line && line.contains(targetNode)) {
        const gutter = line.querySelector(".gutter-num");
        if (gutter && (gutter === targetNode || gutter.contains(targetNode))) {
          return 0;
        }
      }
      return 0;
    }
    let offset = 0;
    let found = false;

    function walk(node: Node): void {
      if (found) return;
      if (node === targetNode) {
        if (node.nodeType === Node.TEXT_NODE) {
          offset += Math.min(targetOffset, (node.nodeValue || "").length);
        }
        found = true;
        return;
      }
      if (node.nodeType === Node.TEXT_NODE) {
        offset += (node.nodeValue || "").length;
      } else {
        for (let i = 0; i < node.childNodes.length; i++) {
          walk(node.childNodes[i]);
          if (found) return;
        }
      }
    }

    walk(span);
    return offset;
  }

  interface SelectionInfo {
    isMultiLine: boolean;
    startLine: number;
    startOffset: number;
    endLine: number;
    endOffset: number;
    selectedText: string;
  }

  function getRightPaneSelection(): SelectionInfo | null {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null;
    const range = sel.getRangeAt(0);

    let startLineEl = (range.startContainer.nodeType === Node.ELEMENT_NODE
      ? range.startContainer as HTMLElement
      : range.startContainer.parentElement)?.closest(".editor-pane.right-pane .editor-line") as HTMLElement | null;

    let endLineEl = (range.endContainer.nodeType === Node.ELEMENT_NODE
      ? range.endContainer as HTMLElement
      : range.endContainer.parentElement)?.closest(".editor-pane.right-pane .editor-line") as HTMLElement | null;

    if (!startLineEl || !endLineEl) return null;

    let startLine = parseInt(startLineEl.getAttribute("data-line") || "1", 10);
    let endLine = parseInt(endLineEl.getAttribute("data-line") || "1", 10);

    const startSpan = startLineEl.querySelector(".line-content") as HTMLElement | null;
    const endSpan = endLineEl.querySelector(".line-content") as HTMLElement | null;
    if (!startSpan || !endSpan) return null;

    let startOffset = getOffsetInSpan(startSpan, range.startContainer, range.startOffset);
    let endOffset = getOffsetInSpan(endSpan, range.endContainer, range.endOffset);

    if (startLine > endLine || (startLine === endLine && startOffset > endOffset)) {
      const tmpL = startLine; startLine = endLine; endLine = tmpL;
      const tmpO = startOffset; startOffset = endOffset; endOffset = tmpO;
    }

    const selectedText = sel.toString();
    if (!selectedText) return null;

    return {
      isMultiLine: startLine !== endLine,
      startLine,
      startOffset,
      endLine,
      endOffset,
      selectedText,
    };
  }

  function deleteSelectionRange(selInfo: SelectionInfo): void {
    if (!rightPaneEl) return;
    pushHistoryState(currentLines.join("\n"), rightPaneEl.scrollTop);
    const startText = currentLines[selInfo.startLine - 1] || "";
    const endText = currentLines[selInfo.endLine - 1] || "";
    const before = startText.slice(0, Math.min(selInfo.startOffset, startText.length));
    const after = endText.slice(Math.min(selInfo.endOffset, endText.length));
    const combined = before + after;

    currentLines[selInfo.startLine - 1] = combined;
    const deleteCount = selInfo.endLine - selInfo.startLine;
    if (deleteCount > 0) {
      currentLines.splice(selInfo.startLine, deleteCount);
    }
    reviewState.currentLines = currentLines;
    triggerSave(vscode, selInfo.startLine, selInfo.startOffset);
  }

  function replaceSelectionWithText(selInfo: SelectionInfo, insertedText: string): void {
    if (!rightPaneEl) return;
    pushHistoryState(currentLines.join("\n"), rightPaneEl.scrollTop);
    const startText = currentLines[selInfo.startLine - 1] || "";
    const endText = currentLines[selInfo.endLine - 1] || "";
    const before = startText.slice(0, Math.min(selInfo.startOffset, startText.length));
    const after = endText.slice(Math.min(selInfo.endOffset, endText.length));

    const insertLines = insertedText.split(/\r?\n/);
    if (insertLines.length === 1) {
      currentLines[selInfo.startLine - 1] = before + insertLines[0] + after;
      const deleteCount = selInfo.endLine - selInfo.startLine;
      if (deleteCount > 0) {
        currentLines.splice(selInfo.startLine, deleteCount);
      }
      reviewState.currentLines = currentLines;
      triggerSave(vscode, selInfo.startLine, selInfo.startOffset + insertLines[0].length);
    } else {
      const firstLine = before + insertLines[0];
      const lastLine = insertLines[insertLines.length - 1] + after;
      const middleLines = insertLines.slice(1, -1);
      const newBlock = [firstLine, ...middleLines, lastLine];

      const deleteCount = selInfo.endLine - selInfo.startLine + 1;
      currentLines.splice(selInfo.startLine - 1, deleteCount, ...newBlock);
      reviewState.currentLines = currentLines;
      const targetLine = selInfo.startLine + insertLines.length - 1;
      const targetOffset = insertLines[insertLines.length - 1].length;
      triggerSave(vscode, targetLine, targetOffset);
    }
  }

  function indentLines(fromLine: number, toLine: number, unindent: boolean): void {
    if (!rightPaneEl) return;
    pushHistoryState(currentLines.join("\n"), rightPaneEl.scrollTop);
    for (let l = fromLine; l <= toLine; l++) {
      const idx = l - 1;
      if (idx < 0 || idx >= currentLines.length) continue;
      const line = currentLines[idx];
      if (unindent) {
        if (line.startsWith("  ")) {
          currentLines[idx] = line.slice(2);
        } else if (line.startsWith(" ")) {
          currentLines[idx] = line.slice(1);
        } else if (line.startsWith("\t")) {
          currentLines[idx] = line.slice(1);
        }
      } else {
        currentLines[idx] = "  " + line;
      }
    }
    reviewState.currentLines = currentLines;
    triggerSave(vscode, fromLine, 0);
  }

  function onRightMouseDown(e: MouseEvent) {
    if (readOnly) return;
    const target = e.target as HTMLElement;
    if (target.closest("button, input, .block-chk")) return;

    isMouseDragging = false;
    mouseDownPos = { x: e.clientX, y: e.clientY };

    const targetLine = target.closest(".editor-line");
    const targetSpan = targetLine?.querySelector(".line-content") as HTMLElement | null;

    if (activeEditableSpan && activeEditableSpan !== targetSpan) {
      deactivateCurrentEditable();
    }
  }

  function onRightMouseMove(e: MouseEvent) {
    if (readOnly) return;
    if (e.buttons === 1) {
      const dx = Math.abs(e.clientX - mouseDownPos.x);
      const dy = Math.abs(e.clientY - mouseDownPos.y);
      if (dx > 4 || dy > 4) {
        if (!isMouseDragging) {
          isMouseDragging = true;
          if (activeEditableSpan) {
            deactivateCurrentEditable();
          }
        }
      }
    }
  }

  function onRightMouseUp(e: MouseEvent) {
    if (readOnly) return;
    const target = e.target as HTMLElement;
    if (target.closest("button, input, .block-chk")) return;

    const sel = window.getSelection();
    const hasRange = sel && !sel.isCollapsed && sel.toString().length > 0;

    if (!hasRange) {
      const targetLine = target.closest(".editor-line");
      const targetSpan = targetLine?.querySelector(".line-content") as HTMLElement | null;
      if (targetSpan) {
        activateLineEditing(targetSpan, e.clientX, e.clientY);
      }
    }
    isMouseDragging = false;
  }

  function onRightPaste(e: ClipboardEvent) {
    if (readOnly) return;
    const selInfo = getRightPaneSelection();
    if (selInfo) {
      e.preventDefault();
      const text = e.clipboardData?.getData("text") || "";
      if (text) {
        replaceSelectionWithText(selInfo, text);
      }
    }
  }

  function onRightKeyDown(e: KeyboardEvent) {
    if (readOnly) return;
    const selInfo = getRightPaneSelection();
    if (selInfo) {
      const isUndo = (e.metaKey || e.ctrlKey) && !e.shiftKey && (e.key === "z" || e.key === "Z");
      const isRedo = ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === "z" || e.key === "Z")) ||
                     ((e.ctrlKey || e.metaKey) && (e.key === "y" || e.key === "Y"));
      if (isUndo) {
        e.preventDefault();
        performUndo(vscode);
        syncFromSingleton();
        return;
      }
      if (isRedo) {
        e.preventDefault();
        performRedo(vscode);
        syncFromSingleton();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === "x" || e.key === "X")) {
        e.preventDefault();
        if (navigator.clipboard?.writeText) {
          navigator.clipboard.writeText(selInfo.selectedText).catch(() => {});
        }
        deleteSelectionRange(selInfo);
        return;
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === "c" || e.key === "C" || e.key === "a" || e.key === "A")) {
        return;
      }
      if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        deleteSelectionRange(selInfo);
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const startText = currentLines[selInfo.startLine - 1] || "";
        const matchIndent = startText.slice(0, selInfo.startOffset).match(/^(\s*)/);
        const indent = matchIndent ? matchIndent[1] : "";
        replaceSelectionWithText(selInfo, "\n" + indent);
        return;
      }
      if (e.key === "Tab") {
        e.preventDefault();
        if (selInfo.isMultiLine) {
          indentLines(selInfo.startLine, selInfo.endLine, e.shiftKey);
        } else {
          replaceSelectionWithText(selInfo, "  ");
        }
        return;
      }
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        replaceSelectionWithText(selInfo, e.key);
        return;
      }
    }

    if (activeEditableSpan) {
      const lineRow = activeEditableSpan.closest(".editor-line");
      const lineNum = parseInt(lineRow?.getAttribute("data-line") || "1", 10);

      if ((e.metaKey || e.ctrlKey) && (e.key === "s" || (e as any).keyCode === 83)) {
        e.preventDefault();
        const curText = (activeEditableSpan.textContent || "").replace(/\u00A0/g, " ");
        currentLines[lineNum - 1] = curText;
        reviewState.currentLines = currentLines;
        triggerSave(vscode, lineNum, getCaretOffset(activeEditableSpan));
        return;
      }

      if (e.key === "Tab") {
        e.preventDefault();
        pushHistoryState(currentLines.join("\n"), rightPaneEl?.scrollTop);
        const caret = getCaretOffset(activeEditableSpan);
        const fullText = currentLines[lineNum - 1] || "";
        const updated = fullText.slice(0, caret) + "  " + fullText.slice(caret);
        currentLines[lineNum - 1] = updated;
        reviewState.currentLines = currentLines;
        activeEditableSpan.textContent = updated;
        setCaretPosition(activeEditableSpan, caret + 2);
        queueDebouncedSave(vscode, lineNum, caret + 2);
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        pushHistoryState(currentLines.join("\n"), rightPaneEl?.scrollTop);
        const caret = getCaretOffset(activeEditableSpan);
        const fullText = currentLines[lineNum - 1] || "";
        const before = fullText.slice(0, caret);
        const after = fullText.slice(caret);

        const matchIndent = before.match(/^(\s*)/);
        const indent = matchIndent ? matchIndent[1] : "";
        const newLineText = indent + after;

        currentLines[lineNum - 1] = before;
        currentLines.splice(lineNum, 0, newLineText);
        reviewState.currentLines = currentLines;
        triggerSave(vscode, lineNum + 1, indent.length);
        return;
      }

      if (e.key === "Backspace") {
        const caret = getCaretOffset(activeEditableSpan);
        if (caret === 0 && lineNum > 1) {
          e.preventDefault();
          pushHistoryState(currentLines.join("\n"), rightPaneEl?.scrollTop);
          const prevText = currentLines[lineNum - 2] || "";
          const curText = currentLines[lineNum - 1] || "";
          const merged = prevText + curText;

          currentLines[lineNum - 2] = merged;
          currentLines.splice(lineNum - 1, 1);
          reviewState.currentLines = currentLines;
          triggerSave(vscode, lineNum - 1, prevText.length);
          return;
        }
      }
    }
  }

  function handleLineInput(span: HTMLElement) {
    const lineRow = span.closest(".editor-line");
    const lineNum = parseInt(lineRow?.getAttribute("data-line") || "1", 10);
    const curText = (span.textContent || "").replace(/\u00A0/g, " ");
    currentLines[lineNum - 1] = curText;
    reviewState.currentLines = currentLines;
    queueDebouncedSave(vscode, lineNum, getCaretOffset(span));
  }

  // Global Keydown Listeners
  function handleGlobalKeyDown(e: KeyboardEvent) {
    if (!readOnly) {
      const isUndo = (e.metaKey || e.ctrlKey) && !e.shiftKey && (e.key === "z" || e.key === "Z");
      const isRedo = ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === "z" || e.key === "Z")) ||
                     ((e.ctrlKey || e.metaKey) && (e.key === "y" || e.key === "Y"));
      if (isUndo) {
        e.preventDefault();
        performUndo(vscode);
        syncFromSingleton();
        return;
      }
      if (isRedo) {
        e.preventDefault();
        performRedo(vscode);
        syncFromSingleton();
        return;
      }
    }

    if (e.key === "F4" || (e as any).keyCode === 115) {
      e.preventDefault();
      if (filePath) {
        vscode.postMessage({ type: "openFile", payload: filePath });
      }
    } else if (e.key === "F7" || (e as any).keyCode === 118) {
      e.preventDefault();
      if (e.shiftKey) {
        jumpDiff(-1, vscode);
      } else {
        jumpDiff(1, vscode);
      }
    }
  }

  // IPC Message Listener
  function handleMessage(event: MessageEvent<ExtensionToReviewMessage>) {
    const msg = event.data;
    if (!msg || !msg.type) return;

    switch (msg.type) {
      case "fileDiff": {
        hideDiffNavigationHint();
        const data = msg.payload;
        const isSameFile = (filePath && filePath === (data.path || ""));
        const isIdentical = isSameFile &&
          diff === (data.diff || "") &&
          stagedDiff === (data.stagedDiff || "") &&
          baseContent === (data.baseContent !== undefined ? data.baseContent : "") &&
          currentContent === (data.currentContent !== undefined ? data.currentContent : "") &&
          readOnly === (data.readOnly === true) &&
          !data.focusTarget;

        if (isIdentical) return;

        if (!isSameFile) {
          if (runtime.scrollAnimId) {
            cancelAnimationFrame(runtime.scrollAnimId);
            runtime.scrollAnimId = null;
          }
          runtime.isSyncing = false;
          runtime.isRendering = false;
          runtime.activeScroller = null;
          runtime.savedScrollTop = null;
          lastRenderedFilePath = "";
          undoStack.length = 0;
          redoStack.length = 0;
        }

        filePath = data.path || "";
        fileName = data.fileName || filePath.split("/").pop() || "";
        fileDir = data.fileDir || filePath.split("/").slice(0, -1).join("/");
        diff = data.diff || "";
        stagedDiff = data.stagedDiff || "";
        baseContent = data.baseContent !== undefined ? data.baseContent : "";
        currentContent = data.currentContent !== undefined ? data.currentContent : "";
        filesList = data.filesList || [];
        currentFileIndex = data.currentFileIndex || 0;
        readOnly = data.readOnly === true;
        baseTitle = data.baseTitle || "";
        targetTitle = data.targetTitle || "";

        syncToSingleton();
        parseDiffData(reviewState.diff);
        syncFromSingleton();

        requestAnimationFrame(() => {
          if (runtime.savedScrollTop !== null && rightPaneEl && leftPaneEl) {
            runtime.isSyncing = true;
            rightPaneEl.scrollTop = runtime.savedScrollTop;
            leftPaneEl.scrollTop = mapRightToLeft(runtime.savedScrollTop);
            updateScrollPositions();
            requestAnimationFrame(() => {
              runtime.isSyncing = false;
            });
          } else {
            updateScrollPositions();
            if (blocks && blocks.length > 0) {
              const targetDir = (reviewState.pendingJumpDirection !== null && reviewState.pendingJumpDirection !== undefined)
                ? reviewState.pendingJumpDirection
                : 1;
              reviewState.pendingJumpDirection = null;
              reviewState.pendingFromFileList = null;
              const targetIdx = targetDir > 0 ? 0 : blocks.length - 1;
              jumpToBlock(targetIdx, false);
              highlightActiveBlock(blocks[targetIdx].id);
              window.focus();
              rightPaneEl?.focus();
            }
          }
        });
        break;
      }
      case "stagedDiffUpdated": {
        stagedDiff = msg.payload.stagedDiff || "";
        reviewState.stagedDiff = stagedDiff;
        for (const b of blocks) {
          b.staged = isBlockStaged(b, stagedDiff, baseLines, currentLines);
        }
        blocks = [...blocks];
        reviewState.blocks = blocks;
        break;
      }
      case "jumpDiff": {
        const direction = msg.payload?.direction || 1;
        const fromFileList = msg.payload?.fromFileList === true;
        if (blocks && blocks.length > 0) {
          if (fromFileList) {
            jumpFirstOrLastDiff(direction);
          } else {
            jumpDiff(direction, vscode);
          }
        } else {
          reviewState.pendingJumpDirection = direction;
          reviewState.pendingFromFileList = fromFileList;
        }
        window.focus();
        requestAnimationFrame(() => {
          rightPaneEl?.focus();
        });
        break;
      }
      case "themeTokens": {
        const tokens = msg.payload;
        if (!tokens) break;
        let styleEl = document.getElementById("dynamic-syntax-tokens");
        if (!styleEl) {
          styleEl = document.createElement("style");
          styleEl.id = "dynamic-syntax-tokens";
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
            --syn-punct: ${tokens.punct || "#948a8b"} !important;
          }
        `;
        break;
      }
    }
  }

  // Floating tooltip initialization
  function initTooltips(): () => void {
    let tooltipEl = document.getElementById("studio-tooltip");
    if (!tooltipEl) {
      tooltipEl = document.createElement("div");
      tooltipEl.id = "studio-tooltip";
      tooltipEl.className = "studio-floating-tooltip";
      document.body.appendChild(tooltipEl);
    }

    let hoverTimer: any = null;
    let currentTarget: HTMLElement | null = null;

    const onMouseOver = (e: MouseEvent) => {
      const target = (e.target as HTMLElement | null)?.closest("[data-tooltip], [title]") as HTMLElement | null;
      if (!target) {
        hideTooltip();
        return;
      }

      if (target.hasAttribute("title") && !target.hasAttribute("data-tooltip")) {
        const titleText = target.getAttribute("title") || "";
        target.removeAttribute("title");
        target.setAttribute("data-tooltip", titleText);
      } else if (target.hasAttribute("title")) {
        target.removeAttribute("title");
      }

      if (currentTarget === target) return;
      currentTarget = target;

      if (hoverTimer) clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => {
        showTooltip(target);
      }, 180);
    };

    const onMouseOut = (e: MouseEvent) => {
      const related = e.relatedTarget as HTMLElement | null;
      if (currentTarget && (!related || !currentTarget.contains(related))) {
        hideTooltip();
      }
    };

    const hideTooltip = () => {
      if (hoverTimer) {
        clearTimeout(hoverTimer);
        hoverTimer = null;
      }
      currentTarget = null;
      if (tooltipEl) {
        tooltipEl.classList.remove("visible");
        tooltipEl.style.display = "none";
      }
    };

    const showTooltip = (target: HTMLElement) => {
      const text = target.getAttribute("data-tooltip");
      if (!text || !tooltipEl) return;
      const shortcut = target.getAttribute("data-shortcut");

      tooltipEl.innerHTML = `
        <span class="tooltip-text">${text}</span>
        ${shortcut ? `<span class="tooltip-shortcut">${shortcut}</span>` : ""}
      `;
      tooltipEl.style.display = "flex";
      tooltipEl.classList.remove("visible");

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
        if (tooltipEl) tooltipEl.classList.add("visible");
      });
    };

    document.addEventListener("mouseover", onMouseOver, true);
    document.addEventListener("mouseout", onMouseOut, true);
    document.addEventListener("click", hideTooltip, true);
    window.addEventListener("scroll", hideTooltip, true);

    return () => {
      document.removeEventListener("mouseover", onMouseOver, true);
      document.removeEventListener("mouseout", onMouseOut, true);
      document.removeEventListener("click", hideTooltip, true);
      window.removeEventListener("scroll", hideTooltip, true);
      if (tooltipEl && tooltipEl.parentNode) {
        tooltipEl.parentNode.removeChild(tooltipEl);
      }
    };
  }

  onMount(() => {
    runtime.updateRibbonsFn = updateScrollPositions;
    runtime.setActiveBlockId = (id: number | null) => {
      activeBlockId = id;
    };
    window.addEventListener("message", handleMessage);
    window.addEventListener("keydown", handleGlobalKeyDown);

    const cleanupTooltips = initTooltips();

    // Handshake
    vscode.postMessage({ type: "ready" });

    return () => {
      window.removeEventListener("message", handleMessage);
      window.removeEventListener("keydown", handleGlobalKeyDown);
      runtime.setActiveBlockId = null;
      cleanupTooltips();
    };
  });
</script>

<div class="studio-diff-container">
  <!-- Toolbar -->
  <ReviewToolbar
    {fileName}
    {fileDir}
    diffCount={blocks.length}
    hasPrev={currentFileIndex > 0}
    hasNext={currentFileIndex < filesList.length - 1}
    {readOnly}
    {highlightWords}
    {isMasterChecked}
    {isMasterIndeterminate}
    onToggleHighlightWords={() => { highlightWords = !highlightWords; }}
    onPrevDiff={() => jumpDiff(-1, vscode)}
    onNextDiff={() => jumpDiff(1, vscode)}
    onTickAll={handleTickAll}
    onToggleMasterStage={handleToggleMasterStage}
    onOpenFile={() => { if (filePath) vscode.postMessage({ type: 'openFile', payload: filePath }); }}
    onRollbackAll={() => {
      if (blocks.length > 0 && blocks[0].patchContent) {
        vscode.postMessage({ type: 'rollbackHunk', payload: { patch: blocks[0].patchContent } });
      }
    }}
    onPrevFile={() => {
      if (currentFileIndex > 0) {
        reviewState.pendingJumpDirection = -1;
        reviewState.pendingFromFileList = true;
        vscode.postMessage({ type: 'navigateFile', payload: currentFileIndex - 1 });
      }
    }}
    onNextFile={() => {
      if (currentFileIndex < filesList.length - 1) {
        reviewState.pendingJumpDirection = 1;
        reviewState.pendingFromFileList = true;
        vscode.postMessage({ type: 'navigateFile', payload: currentFileIndex + 1 });
      }
    }}
    onRefresh={() => vscode.postMessage({ type: 'refreshDiff', payload: filePath })}
  />

  <!-- Column Headers -->
  <div class="studio-diff-columns-header">
    <div class="col-header-pane left-header">
      <span class="pane-title">{baseTitle || "Base revision (HEAD)"}</span>
    </div>
    <div class="col-header-gutter"></div>
    <div class="col-header-pane right-header">
      <span class="pane-title">{targetTitle || "Current version"}</span>
      {#if readOnly}
        <span class="readonly-badge" title="Historical commit is read-only">Read-only</span>
      {:else}
        <span class="editable-badge" title="You can edit this file directly">✎ Editable</span>
      {/if}
    </div>
  </div>

  <!-- Diff Viewport Wrapper -->
  <div class="studio-diff-viewport-wrapper">
    {#if leftRenderLines.length === 0 && rightRenderLines.length === 0}
      <div style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--vscode-descriptionForeground, #7f848e); font-size: 13px; z-index: 5; pointer-events: none;">
        <span>{filePath ? 'No differences or empty file' : 'Loading diff...'}</span>
      </div>
    {/if}
    <!-- Left Pane (Base) -->
    <div
      class="editor-pane left-pane"
      bind:this={leftPaneEl}
      onscroll={onLeftScroll}
      onwheel={(e) => onWheelPane(leftPaneEl, "left", e)}
      onpointerdown={() => setScroller("left")}
    >
      <div class="editor-lines-container">
        {#each leftRenderLines as line (line.id)}
          <div class={line.rowClass} data-line={line.lineNum}>
            <span class="gutter-num">{line.lineNum ?? ""}</span>
            <span class="line-content">{@html line.html}</span>
          </div>
        {/each}
      </div>
    </div>

    <!-- Middle Gutter (SVG Ribbons & Actions) -->
    <DiffRibbon
      bind:gutterEl={middleGutterEl}
      {blocks}
      {sLeft}
      {sRight}
      {viewH}
      {readOnly}
      {activeBlockId}
      onRevertBlock={handleRevertBlock}
      onToggleStageBlock={handleToggleStageBlock}
    />

    <!-- Right Pane (Current Working Copy) -->
    <div
      class="editor-pane right-pane"
      tabindex="0"
      bind:this={rightPaneEl}
      onscroll={onRightScroll}
      onwheel={(e) => onWheelPane(rightPaneEl, "right", e)}
      onpointerdown={() => setScroller("right")}
      onmousedown={onRightMouseDown}
      onmousemove={onRightMouseMove}
      onmouseup={onRightMouseUp}
      onkeydown={onRightKeyDown}
      onpaste={onRightPaste}
    >
      <div class="editor-lines-container">
        {#each rightRenderLines as line (line.id)}
          {#if line.isSpacer}
            <div class={line.rowClass}>
              <span class="gutter-num"></span>
              <span class="line-content">&nbsp;</span>
            </div>
          {:else}
            <div class={`${line.rowClass} in-right`} data-line={line.lineNum}>
              <span class="gutter-num">{line.lineNum}</span>
              <span
                class="line-content"
                data-line={line.lineNum}
                oninput={(e) => handleLineInput(e.currentTarget as HTMLElement)}
              >
                {@html line.html}
              </span>
            </div>
          {/if}
        {/each}
      </div>
    </div>

    <!-- Overview Ruler -->
    <OverviewRuler
      {blocks}
      totalLines={totalAlignedLines}
      onJumpToBlock={(idx) => jumpToBlock(idx, true)}
    />
  </div>
</div>
