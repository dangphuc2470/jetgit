<script lang="ts">
  import { onMount, tick } from "svelte";
  import { highlightCode } from "$shared/syntaxHighlight";
  import { postMessage } from "$shared/vscodeApi";
  import type { ConflictHunk, ExtensionToMergeMessage } from "$shared/protocol";
  import { applyAllNonConflicting } from "$mergeResolveUtil";
  import MergeToolbar from "./MergeToolbar.svelte";

  const LINE_HEIGHT = 20;
  const GUTTER_WIDTH = 44;

  interface ComputedBlock {
    id: number;
    hunk: ConflictHunk;
    leftStart: number;
    leftEnd: number;
    leftCount: number;
    rightStart: number;
    rightEnd: number;
    rightCount: number;
    centerStart: number;
    centerEnd: number;
    centerCount: number;
    resolved: boolean;
    chosen: "yours" | "theirs" | "custom" | "ignored" | null;
    leftStatus: "pending" | "accepted" | "ignored";
    rightStatus: "pending" | "accepted" | "ignored";
    changeKind: "conflict" | "insert" | "modify";
    activeSide: "yours" | "theirs" | "both";
  }

  interface RenderLine {
    id: number;
    lineNo: number;
    text: string;
    extraClass: string;
    editable?: boolean;
    hunkId?: number;
  }

  let lineIdCounter = 1;

  interface RibbonItem {
    id: number;
    leftD: string;
    rightD: string;
    leftRibbonClass: string;
    rightRibbonClass: string;
    showLeft: boolean;
    showRight: boolean;
    leftBtnY: number;
    rightBtnY: number;
    resolved: boolean;
    chosen: "yours" | "theirs" | "custom" | "ignored" | null;
    leftStatus: "pending" | "accepted" | "ignored";
    rightStatus: "pending" | "accepted" | "ignored";
  }

  let filePath = $state("");
  let fileName = $state("");
  let yoursBranch = $state("Current version");
  let theirsBranch = $state("Incoming version");
  let hunks = $state<ConflictHunk[]>([]);
  let currentConflictIndex = $state(0);

  let leftLines = $state<RenderLine[]>([]);
  let centerLines = $state<RenderLine[]>([]);
  let rightLines = $state<RenderLine[]>([]);
  let conflictBlocks = $state<ComputedBlock[]>([]);
  let isAppendMode = $state(false);

  let leftEditor: HTMLElement | null = $state(null);
  let centerEditor: HTMLElement | null = $state(null);
  let rightEditor: HTMLElement | null = $state(null);

  let sLeft = $state(0);
  let sCenter = $state(0);
  let sRight = $state(0);

  let remainingConflicts = $derived(
    conflictBlocks.filter((b) => !b.resolved && b.changeKind === "conflict").length
  );

  function getSideRibbonClass(
    changeKind: "conflict" | "insert" | "modify",
    status: "pending" | "accepted" | "ignored",
  ): string {
    if (status === "accepted") {
      return changeKind === "modify" ? "modify-ribbon resolved" : "insert-ribbon resolved";
    }
    if (status === "ignored") {
      return "conflict-ribbon ignored";
    }
    if (changeKind === "insert") return "insert-ribbon";
    if (changeKind === "modify") return "modify-ribbon";
    return "conflict-ribbon";
  }

  let ribbons = $derived.by(() => {
    const W = GUTTER_WIDTH;
    const items: RibbonItem[] = [];

    for (const b of conflictBlocks) {
      // Left -> Center
      const ly1 = (b.leftStart - 1) * LINE_HEIGHT - sLeft;
      const ly2 = b.leftCount === 0 ? ly1 + 2 : b.leftEnd * LINE_HEIGHT - sLeft;
      const cy1 = (b.centerStart - 1) * LINE_HEIGHT - sCenter;
      const cy2 = b.centerCount === 0 ? cy1 + 2 : b.centerEnd * LINE_HEIGHT - sCenter;

      const leftD = `M 0,${ly1} L 6,${ly1} C 16,${ly1} ${W - 16},${cy1} ${W - 6},${cy1} L ${W},${cy1} L ${W},${cy2} L ${W - 6},${cy2} C ${W - 16},${cy2} 16,${ly2} 6,${ly2} L 0,${ly2} Z`;

      // Center <- Right
      const ry1 = (b.rightStart - 1) * LINE_HEIGHT - sRight;
      const ry2 = b.rightCount === 0 ? ry1 + 2 : b.rightEnd * LINE_HEIGHT - sRight;

      const rightD = `M 0,${cy1} L 6,${cy1} C 16,${cy1} ${W - 16},${ry1} ${W - 6},${ry1} L ${W},${ry1} L ${W},${ry2} L ${W - 6},${ry2} C ${W - 16},${ry2} 16,${cy2} 6,${cy2} L 0,${cy2} Z`;

      const showLeft = b.activeSide === "yours" || b.activeSide === "both";
      const showRight = b.activeSide === "theirs" || b.activeSide === "both";

      const leftRibbonClass = getSideRibbonClass(b.changeKind, b.leftStatus);
      const rightRibbonClass = getSideRibbonClass(b.changeKind, b.rightStatus);

      const leftBtnY = Math.max(0, ly1 + 2);
      const rightBtnY = Math.max(0, ry1 + 2);

      items.push({
        id: b.id,
        leftD,
        rightD,
        leftRibbonClass,
        rightRibbonClass,
        showLeft,
        showRight,
        leftBtnY,
        rightBtnY,
        resolved: b.resolved,
        chosen: b.chosen,
        leftStatus: b.leftStatus,
        rightStatus: b.rightStatus,
      });
    }

    return items;
  });

  function rebuildLines() {
    lineIdCounter = 1;
    const nextLeft: RenderLine[] = [];
    const nextCenter: RenderLine[] = [];
    const nextRight: RenderLine[] = [];
    const nextBlocks: ComputedBlock[] = [];

    let leftNo = 1;
    let centerNo = 1;
    let rightNo = 1;

    for (const hunk of hunks) {
      if (hunk.type === "common") {
        const lines = hunk.commonLines || [];
        for (const text of lines) {
          nextLeft.push({ id: lineIdCounter++, lineNo: leftNo++, text, extraClass: "" });
          nextCenter.push({ id: lineIdCounter++, lineNo: centerNo++, text, extraClass: "", editable: true, hunkId: hunk.id });
          nextRight.push({ id: lineIdCounter++, lineNo: rightNo++, text, extraClass: "" });
        }
      } else if (hunk.type === "conflict") {
        const yLines = hunk.yoursLines || [];
        const tLines = hunk.theirsLines || [];
        const changeKind = hunk.changeKind || "conflict";
        const activeSide = hunk.activeSide || "both";

        const pendingLineClass =
          changeKind === "insert"
            ? "line-insert"
            : changeKind === "modify"
              ? "line-modify"
              : "line-conflict";
        const resolvedLineClass =
          changeKind === "modify" ? "line-modify-resolved" : "line-conflict-resolved";

        const leftLineClass =
          hunk.leftStatus === "accepted"
            ? resolvedLineClass
            : hunk.leftStatus === "ignored"
              ? ""
              : pendingLineClass;
        const rightLineClass =
          hunk.rightStatus === "accepted"
            ? resolvedLineClass
            : hunk.rightStatus === "ignored"
              ? ""
              : pendingLineClass;

        const leftStart = leftNo;
        for (const text of yLines) {
          nextLeft.push({ id: lineIdCounter++, lineNo: leftNo++, text, extraClass: leftLineClass });
        }
        const leftEnd = leftNo - 1;

        const rightStart = rightNo;
        for (const text of tLines) {
          nextRight.push({ id: lineIdCounter++, lineNo: rightNo++, text, extraClass: rightLineClass });
        }
        const rightEnd = rightNo - 1;

        const centerStart = centerNo;
        const leftHandled = hunk.leftStatus !== "pending";
        const rightHandled = hunk.rightStatus !== "pending";
        const isResolved = Boolean(hunk.resolved || (leftHandled && rightHandled));

        const centerLinesToRender =
          hunk.resultLines !== undefined && hunk.resultLines !== null
            ? hunk.resultLines
            : hunk.baseLines || [];

        const centerClass = isResolved
          ? hunk.chosen === "ignored"
            ? ""
            : resolvedLineClass
          : pendingLineClass;

        for (const text of centerLinesToRender) {
          nextCenter.push({
            id: lineIdCounter++,
            lineNo: centerNo++,
            text,
            extraClass: centerClass,
            editable: true,
            hunkId: hunk.id,
          });
        }
        const centerCount = centerLinesToRender.length;
        const centerEnd = centerNo - 1;

        nextBlocks.push({
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
          centerCount,
          resolved: isResolved,
          chosen: hunk.chosen || null,
          leftStatus: hunk.leftStatus || "pending",
          rightStatus: hunk.rightStatus || "pending",
          changeKind,
          activeSide,
        });
      }
    }

    leftLines = nextLeft;
    centerLines = nextCenter;
    rightLines = nextRight;
    conflictBlocks = nextBlocks;
  }

  function updateHunkResolved(hunk: ConflictHunk) {
    const isBothHandled = hunk.leftStatus !== "pending" && hunk.rightStatus !== "pending";
    hunk.resolved = isBothHandled;
    if (isBothHandled) {
      if (hunk.leftStatus === "accepted" && hunk.rightStatus === "accepted") {
        hunk.chosen = "custom";
      } else if (hunk.leftStatus === "accepted") {
        hunk.chosen = "yours";
      } else if (hunk.rightStatus === "accepted") {
        hunk.chosen = "theirs";
      } else {
        hunk.chosen = "ignored";
      }
    } else {
      hunk.chosen = null;
    }
  }

  function acceptLeft(id: number) {
    const hunk = hunks.find((h) => h.id === id);
    if (!hunk) return;
    hunk.leftStatus = "accepted";
    if (hunk.rightStatus === "accepted") {
      hunk.resultLines = [...(hunk.yoursLines || []), ...(hunk.theirsLines || [])];
    } else {
      hunk.resultLines = [...(hunk.yoursLines || [])];
    }
    updateHunkResolved(hunk);
    rebuildLines();
  }

  function ignoreLeft(id: number) {
    const hunk = hunks.find((h) => h.id === id);
    if (!hunk) return;
    hunk.leftStatus = "ignored";
    if (hunk.rightStatus === "accepted") {
      hunk.resultLines = [...(hunk.theirsLines || [])];
    } else if (hunk.rightStatus === "ignored") {
      hunk.resultLines = hunk.activeSide && hunk.activeSide !== "both"
        ? [...(hunk.baseLines || [])]
        : [];
    }
    updateHunkResolved(hunk);
    rebuildLines();
  }

  function revertLeft(id: number) {
    const hunk = hunks.find((h) => h.id === id);
    if (!hunk) return;
    hunk.leftStatus = "pending";
    if (hunk.rightStatus === "accepted") {
      hunk.resultLines = [...(hunk.theirsLines || [])];
    } else {
      hunk.resultLines = [...(hunk.baseLines || [])];
    }
    updateHunkResolved(hunk);
    rebuildLines();
  }

  function acceptRight(id: number) {
    const hunk = hunks.find((h) => h.id === id);
    if (!hunk) return;
    hunk.rightStatus = "accepted";
    if (hunk.leftStatus === "accepted") {
      hunk.resultLines = [...(hunk.yoursLines || []), ...(hunk.theirsLines || [])];
    } else {
      hunk.resultLines = [...(hunk.theirsLines || [])];
    }
    updateHunkResolved(hunk);
    rebuildLines();
  }

  function ignoreRight(id: number) {
    const hunk = hunks.find((h) => h.id === id);
    if (!hunk) return;
    hunk.rightStatus = "ignored";
    if (hunk.leftStatus === "accepted") {
      hunk.resultLines = [...(hunk.yoursLines || [])];
    } else if (hunk.leftStatus === "ignored") {
      hunk.resultLines = hunk.activeSide && hunk.activeSide !== "both"
        ? [...(hunk.baseLines || [])]
        : [];
    }
    updateHunkResolved(hunk);
    rebuildLines();
  }

  function revertRight(id: number) {
    const hunk = hunks.find((h) => h.id === id);
    if (!hunk) return;
    hunk.rightStatus = "pending";
    if (hunk.leftStatus === "accepted") {
      hunk.resultLines = [...(hunk.yoursLines || [])];
    } else {
      hunk.resultLines = [...(hunk.baseLines || [])];
    }
    updateHunkResolved(hunk);
    rebuildLines();
  }

  function handleApplyNonConflicting() {
    const { resolvedCount } = applyAllNonConflicting(hunks);
    rebuildLines();
    if (resolvedCount > 0) {
      const firstUnresolved = conflictBlocks.findIndex((b) => !b.resolved);
      if (firstUnresolved !== -1) {
        currentConflictIndex = firstUnresolved;
        const target = conflictBlocks[currentConflictIndex];
        if (target && centerEditor) {
          const targetY = Math.max(0, (target.centerStart - 4) * LINE_HEIGHT);
          centerEditor.scrollTo({ top: targetY, behavior: "smooth" });
        }
      }
    }
  }

  function jumpConflict(direction: number) {
    if (conflictBlocks.length === 0) return;
    currentConflictIndex = (currentConflictIndex + direction + conflictBlocks.length) % conflictBlocks.length;
    const target = conflictBlocks[currentConflictIndex];
    if (target && centerEditor) {
      const targetY = Math.max(0, (target.centerStart - 4) * LINE_HEIGHT);
      centerEditor.scrollTo({ top: targetY, behavior: "smooth" });
    }
  }

  function getMergedContent(): string {
    if (!centerEditor) return "";
    const contentEls = centerEditor.querySelectorAll<HTMLElement>(".line-content");
    const lines: string[] = [];
    contentEls.forEach((el) => {
      lines.push(el.textContent || "");
    });
    return lines.join("\n");
  }

  function handleApply() {
    if (remainingConflicts > 0) {
      const confirmed = window.confirm(
        `There are ${remainingConflicts} unresolved conflict${remainingConflicts > 1 ? "s" : ""} remaining.\nDo you want to apply the merged content anyway?`
      );
      if (!confirmed) return;
    }
    const content = getMergedContent();
    postMessage({
      type: "applyMerge",
      payload: {
        filePath,
        content,
      },
    });
  }

  function handleCancel() {
    const hasModifications = conflictBlocks.some((b) => b.resolved);
    if (hasModifications) {
      const confirmed = window.confirm("Discard all merge resolutions and close?");
      if (!confirmed) return;
    }
    postMessage({ type: "cancelMerge" });
  }

  function getSelectionOffsets(element: HTMLElement): { start: number; end: number } {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return { start: 0, end: 0 };
    const range = selection.getRangeAt(0);

    const rStart = range.cloneRange();
    rStart.selectNodeContents(element);
    rStart.setEnd(range.startContainer, range.startOffset);
    const start = rStart.toString().length;

    const rEnd = range.cloneRange();
    rEnd.selectNodeContents(element);
    rEnd.setEnd(range.endContainer, range.endOffset);
    const end = rEnd.toString().length;

    return { start, end };
  }

  function setCaretPosition(element: HTMLElement, offset: number) {
    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    let currentOffset = 0;
    let found = false;

    function traverse(node: Node) {
      if (found) return;
      if (node.nodeType === Node.TEXT_NODE) {
        const textLen = (node.textContent || "").length;
        if (currentOffset + textLen >= offset) {
          range.setStart(node, Math.min(offset - currentOffset, textLen));
          range.collapse(true);
          found = true;
          return;
        }
        currentOffset += textLen;
      } else {
        for (let i = 0; i < node.childNodes.length; i++) {
          traverse(node.childNodes[i]);
        }
      }
    }

    traverse(element);
    if (!found) {
      range.selectNodeContents(element);
      range.collapse(false);
    }
    selection.removeAllRanges();
    selection.addRange(range);
  }

  function updateConflictBlocksCenterRanges() {
    for (const b of conflictBlocks) {
      const matching = centerLines.filter((l) => l.hunkId === b.id);
      if (matching.length > 0) {
        b.centerStart = matching[0].lineNo;
        b.centerEnd = matching[matching.length - 1].lineNo;
      }
    }
    conflictBlocks = [...conflictBlocks];
  }

  function handleCenterKeyDown(e: KeyboardEvent, idx: number) {
    const currentEl = e.currentTarget as HTMLElement;

    if (e.key === "Enter") {
      if (e.shiftKey || e.metaKey || e.ctrlKey) {
        return;
      }
      e.preventDefault();
      const fullText = currentEl.textContent || "";
      const { start, end } = getSelectionOffsets(currentEl);
      const leftText = fullText.slice(0, start);
      const rightText = fullText.slice(end);

      const curLine = centerLines[idx];
      const isPlaceholder = curLine.extraClass.includes("line-placeholder");

      curLine.text = leftText;
      currentEl.textContent = leftText;
      if (isPlaceholder) {
        curLine.extraClass = "line-conflict-resolved";
      }

      if (curLine.hunkId) {
        const hunk = hunks.find((h) => h.id === curLine.hunkId);
        if (hunk && !hunk.resolved) {
          hunk.resolved = true;
          hunk.chosen = "custom";
          hunk.leftStatus = "accepted";
          hunk.rightStatus = "accepted";
        }
        const b = conflictBlocks.find((cb) => cb.id === curLine.hunkId);
        if (b && !b.resolved) {
          b.resolved = true;
          b.chosen = "custom";
          b.leftStatus = "accepted";
          b.rightStatus = "accepted";
        }
      }

      const nextClass = isPlaceholder ? "line-conflict-resolved" : curLine.extraClass;
      const newLine: RenderLine = {
        id: lineIdCounter++,
        lineNo: 0,
        text: rightText,
        extraClass: nextClass,
        editable: true,
        hunkId: curLine.hunkId,
      };

      centerLines.splice(idx + 1, 0, newLine);
      centerLines.forEach((l, i) => (l.lineNo = i + 1));
      centerLines = [...centerLines];
      updateConflictBlocksCenterRanges();

      tick().then(() => {
        const contentEls = centerEditor?.querySelectorAll<HTMLElement>(".line-content");
        if (contentEls && contentEls[idx + 1]) {
          contentEls[idx + 1].focus();
          setCaretPosition(contentEls[idx + 1], 0);
        }
      });
      return;
    }

    if (e.key === "Backspace") {
      const { start, end } = getSelectionOffsets(currentEl);
      if (start === 0 && end === 0 && idx > 0) {
        e.preventDefault();
        const contentEls = centerEditor?.querySelectorAll<HTMLElement>(".line-content");
        const prevEl = contentEls ? contentEls[idx - 1] : null;
        const prevText = prevEl?.textContent ?? centerLines[idx - 1].text ?? "";
        const curText = currentEl.textContent ?? centerLines[idx].text ?? "";
        const mergeCol = prevText.length;

        centerLines[idx - 1].text = prevText + curText;
        if (prevEl) {
          prevEl.textContent = prevText + curText;
        }

        centerLines.splice(idx, 1);
        centerLines.forEach((l, i) => (l.lineNo = i + 1));
        centerLines = [...centerLines];
        updateConflictBlocksCenterRanges();

        tick().then(() => {
          const updatedEls = centerEditor?.querySelectorAll<HTMLElement>(".line-content");
          if (updatedEls && updatedEls[idx - 1]) {
            updatedEls[idx - 1].focus();
            setCaretPosition(updatedEls[idx - 1], mergeCol);
          }
        });
        return;
      }
    }

    if (e.key === "Delete") {
      const fullText = currentEl.textContent || "";
      const { start, end } = getSelectionOffsets(currentEl);
      if (start === fullText.length && end === fullText.length && idx < centerLines.length - 1) {
        e.preventDefault();
        const contentEls = centerEditor?.querySelectorAll<HTMLElement>(".line-content");
        const nextEl = contentEls ? contentEls[idx + 1] : null;
        const nextText = nextEl?.textContent ?? centerLines[idx + 1].text ?? "";

        centerLines[idx].text = fullText + nextText;
        currentEl.textContent = fullText + nextText;

        centerLines.splice(idx + 1, 1);
        centerLines.forEach((l, i) => (l.lineNo = i + 1));
        centerLines = [...centerLines];
        updateConflictBlocksCenterRanges();

        tick().then(() => {
          const updatedEls = centerEditor?.querySelectorAll<HTMLElement>(".line-content");
          if (updatedEls && updatedEls[idx]) {
            updatedEls[idx].focus();
            setCaretPosition(updatedEls[idx], start);
          }
        });
        return;
      }
    }

    if (e.key === "ArrowUp") {
      if (idx > 0) {
        e.preventDefault();
        const { start } = getSelectionOffsets(currentEl);
        const contentEls = centerEditor?.querySelectorAll<HTMLElement>(".line-content");
        if (contentEls && contentEls[idx - 1]) {
          contentEls[idx - 1].focus();
          setCaretPosition(contentEls[idx - 1], start);
        }
      }
      return;
    }

    if (e.key === "ArrowDown") {
      if (idx < centerLines.length - 1) {
        e.preventDefault();
        const { start } = getSelectionOffsets(currentEl);
        const contentEls = centerEditor?.querySelectorAll<HTMLElement>(".line-content");
        if (contentEls && contentEls[idx + 1]) {
          contentEls[idx + 1].focus();
          setCaretPosition(contentEls[idx + 1], start);
        }
      }
      return;
    }
  }

  function handleCenterBlur(e: FocusEvent, idx: number) {
    const currentEl = e.currentTarget as HTMLElement;
    const text = currentEl.textContent || "";
    if (centerLines[idx]) {
      centerLines[idx].text = text;
      if (centerLines[idx].extraClass.includes("line-conflict")) {
        centerLines[idx].extraClass = "line-conflict-resolved";
        if (centerLines[idx].hunkId) {
          const hunk = hunks.find((h) => h.id === centerLines[idx].hunkId);
          if (hunk) {
            hunk.resolved = true;
            hunk.chosen = "custom";
            hunk.leftStatus = "accepted";
            hunk.rightStatus = "accepted";
            hunk.resultLines = centerLines.filter((l) => l.hunkId === hunk.id).map((l) => l.text);
          }
          const b = conflictBlocks.find((cb) => cb.id === centerLines[idx].hunkId);
          if (b) {
            b.resolved = true;
            b.chosen = "custom";
            b.leftStatus = "accepted";
            b.rightStatus = "accepted";
          }
          conflictBlocks = [...conflictBlocks];
        }
      }
    }
  }

  function handleCenterPaste(e: ClipboardEvent, idx: number) {
    const pasteText = e.clipboardData?.getData("text/plain");
    if (!pasteText || !pasteText.includes("\n")) return;

    e.preventDefault();
    const currentEl = e.currentTarget as HTMLElement;
    const fullText = currentEl.textContent || "";
    const { start, end } = getSelectionOffsets(currentEl);
    const leftText = fullText.slice(0, start);
    const rightText = fullText.slice(end);

    const pastedLines = pasteText.split(/\r?\n/);
    centerLines[idx].text = leftText + pastedLines[0];
    currentEl.textContent = centerLines[idx].text;

    const curLine = centerLines[idx];
    const newItems: RenderLine[] = [];
    for (let p = 1; p < pastedLines.length; p++) {
      const isLast = p === pastedLines.length - 1;
      newItems.push({
        id: lineIdCounter++,
        lineNo: 0,
        text: isLast ? pastedLines[p] + rightText : pastedLines[p],
        extraClass: curLine.extraClass,
        editable: true,
        hunkId: curLine.hunkId,
      });
    }

    centerLines.splice(idx + 1, 0, ...newItems);
    centerLines.forEach((l, i) => (l.lineNo = i + 1));
    centerLines = [...centerLines];
    updateConflictBlocksCenterRanges();

    const targetIdx = idx + pastedLines.length - 1;
    const targetCol = pastedLines[pastedLines.length - 1].length;

    tick().then(() => {
      const contentEls = centerEditor?.querySelectorAll<HTMLElement>(".line-content");
      if (contentEls && contentEls[targetIdx]) {
        contentEls[targetIdx].focus();
        setCaretPosition(contentEls[targetIdx], targetCol);
      }
    });
  }

  // Scroll Synchronization via RAF
  let isSyncing = false;
  let rafId: number | null = null;

  function syncScroll(source: HTMLElement) {
    if (isSyncing) return;
    isSyncing = true;
    const top = source.scrollTop;

    if (source !== leftEditor && leftEditor) leftEditor.scrollTop = top;
    if (source !== centerEditor && centerEditor) centerEditor.scrollTop = top;
    if (source !== rightEditor && rightEditor) rightEditor.scrollTop = top;

    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      sLeft = leftEditor?.scrollTop || 0;
      sCenter = centerEditor?.scrollTop || 0;
      sRight = rightEditor?.scrollTop || 0;
      isSyncing = false;
      rafId = null;
    });
  }

  function handleWheel(pane: HTMLElement, e: WheelEvent) {
    if (e.shiftKey && e.deltaY !== 0 && e.deltaX === 0) {
      pane.scrollLeft += e.deltaY;
      e.preventDefault();
    }
  }

  onMount(() => {
    const messageListener = (event: MessageEvent<ExtensionToMergeMessage>) => {
      const msg = event.data;
      if (msg.type === "loadMergeData") {
        const data = msg.payload;
        filePath = data.filePath;
        fileName = data.fileName;
        yoursBranch = data.yoursBranch || "Current version";
        theirsBranch = data.theirsBranch || "Incoming version";
        hunks = data.hunks || [];
        rebuildLines();
        const firstUnresolved = conflictBlocks.findIndex((b) => !b.resolved);
        if (firstUnresolved !== -1) {
          currentConflictIndex = firstUnresolved;
          const target = conflictBlocks[currentConflictIndex];
          if (target && centerEditor) {
            const targetY = Math.max(0, (target.centerStart - 4) * LINE_HEIGHT);
            centerEditor.scrollTo({ top: targetY, behavior: "smooth" });
          }
        }
      } else if (msg.type === "themeTokens") {
        const tokens = msg.payload;
        if (tokens) {
          let styleEl = document.getElementById("dynamic-syntax-tokens");
          if (!styleEl) {
            styleEl = document.createElement("style");
            styleEl.id = "dynamic-syntax-tokens";
            document.head.appendChild(styleEl);
          }
          let css = ":root {\n";
          for (const [k, v] of Object.entries(tokens)) {
            css += `  --syn-${k}: ${v};\n`;
          }
          css += "}\n";
          styleEl.textContent = css;
        }
      }
    };

    const keyListener = (e: KeyboardEvent) => {
      if (e.key === "F7") {
        e.preventDefault();
        jumpConflict(e.shiftKey ? -1 : 1);
      } else if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleApply();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleCancel();
      }
    };

    const updateModifierState = (e: KeyboardEvent | MouseEvent) => {
      isAppendMode = Boolean(e.ctrlKey || e.metaKey || e.altKey);
    };
    const handleWindowBlur = () => {
      isAppendMode = false;
    };

    window.addEventListener("message", messageListener);
    window.addEventListener("keydown", keyListener);
    window.addEventListener("keydown", updateModifierState);
    window.addEventListener("keyup", updateModifierState);
    window.addEventListener("blur", handleWindowBlur);

    postMessage({ type: "ready" });

    return () => {
      window.removeEventListener("message", messageListener);
      window.removeEventListener("keydown", keyListener);
      window.removeEventListener("keydown", updateModifierState);
      window.removeEventListener("keyup", updateModifierState);
      window.removeEventListener("blur", handleWindowBlur);
      if (rafId) cancelAnimationFrame(rafId);
    };
  });
</script>

<div class="merge-editor-container">
  <!-- Top Toolbar -->
  <MergeToolbar
    {filePath}
    {remainingConflicts}
    onPrev={() => jumpConflict(-1)}
    onNext={() => jumpConflict(1)}
    onApplyNonConflicting={handleApplyNonConflicting}
    onApply={handleApply}
    onCancel={handleCancel}
  />

  <!-- Column Headers -->
  <div class="columns-header">
    <div class="header-col">{`Your version (${yoursBranch})`}</div>
    <div class="header-col-gutter"></div>
    <div class="header-col center-col">
      <span>Result</span>
      <span class="editable-badge">Editable</span>
    </div>
    <div class="header-col-gutter"></div>
    <div class="header-col">{`Their version (${theirsBranch})`}</div>
  </div>

  <!-- 3-Way Viewport -->
  <div class="viewport-wrapper">
    <!-- Left Editor (Yours) -->
    <div
      class="editor-pane left-editor"
      bind:this={leftEditor}
      onscroll={() => leftEditor && syncScroll(leftEditor)}
      onwheel={(e) => leftEditor && handleWheel(leftEditor, e)}
    >
      <div class="lines-container">
        {#each leftLines as line (line.id)}
          <div class={`editor-line ${line.extraClass}`.trim()}>
            <div class="gutter-num">{line.lineNo}</div>
            <div class="line-content">{@html highlightCode(line.text)}</div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Left Gutter (Yours -> Center) -->
    <div class="merge-gutter">
      <svg class="gutter-svg">
        {#each ribbons as ribbon}
          {#if ribbon.showLeft}
            <path d={ribbon.leftD} class={ribbon.leftRibbonClass} data-id={ribbon.id} />
          {/if}
        {/each}
      </svg>
      <div class="gutter-controls">
        {#each ribbons as ribbon}
          {#if ribbon.showLeft}
            {#if ribbon.leftStatus === "pending"}
              <button
                class="block-btn accept-left-btn"
                style={`top: ${ribbon.leftBtnY}px; left: 4px;`}
                title="Accept Yours (Left)"
                onclick={() => acceptLeft(ribbon.id)}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1.5 2L5 5L1.5 8M5 2L8.5 5L5 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              <button
                class="block-btn btn-ignore ignore-left-btn"
                style={`top: ${ribbon.leftBtnY}px; left: 24px;`}
                title="Ignore Yours (Left)"
                onclick={() => ignoreLeft(ribbon.id)}
              >
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <path d="M1.5 1.5L6.5 6.5M6.5 1.5L1.5 6.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                </svg>
              </button>
            {:else}
              <button
                class="block-btn btn-revert active-accepted"
                style={`top: ${ribbon.leftBtnY}px; left: 13px;`}
                title="Revert Left (re-open)"
                onclick={() => revertLeft(ribbon.id)}
              >
                <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.418A6 6 0 1 1 8 2v1z"/>
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M8 4.5a.5.5 0 0 1-.5-.5V1a.5.5 0 0 1 1 0v3a.5.5 0 0 1-.5.5z"/>
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M5.146 3.854a.5.5 0 0 1 0-.708l2.5-2.5a.5.5 0 0 1 .708.708L6.207 3.5l2.147 2.146a.5.5 0 0 1-.708.708l-2.5-2.5z"/>
                </svg>
              </button>
            {/if}
          {/if}
        {/each}
      </div>
    </div>

    <!-- Center Editor (Merged Result) -->
    <div
      class="editor-pane center-editor"
      bind:this={centerEditor}
      onscroll={() => centerEditor && syncScroll(centerEditor)}
      onwheel={(e) => centerEditor && handleWheel(centerEditor, e)}
    >
      <div class="lines-container">
        {#each centerLines as line, idx (line.id)}
          <div class={`editor-line ${line.extraClass}`.trim()} data-hunk-id={line.hunkId}>
            <div class="gutter-num">{line.lineNo}</div>
            <div
              class="line-content"
              contenteditable="plaintext-only"
              spellcheck="false"
              onkeydown={(e) => handleCenterKeyDown(e, idx)}
              onblur={(e) => handleCenterBlur(e, idx)}
              onpaste={(e) => handleCenterPaste(e, idx)}
            >
              {@html highlightCode(line.text)}
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Right Gutter (Center <- Theirs) -->
    <div class="merge-gutter">
      <svg class="gutter-svg">
        {#each ribbons as ribbon}
          {#if ribbon.showRight}
            <path d={ribbon.rightD} class={ribbon.rightRibbonClass} data-id={ribbon.id} />
          {/if}
        {/each}
      </svg>
      <div class="gutter-controls">
        {#each ribbons as ribbon}
          {#if ribbon.showRight}
            {#if ribbon.rightStatus === "pending"}
              <button
                class="block-btn btn-ignore ignore-right-btn"
                style={`top: ${ribbon.rightBtnY}px; left: 4px;`}
                title="Ignore Theirs (Right)"
                onclick={() => ignoreRight(ribbon.id)}
              >
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <path d="M1.5 1.5L6.5 6.5M6.5 1.5L1.5 6.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                </svg>
              </button>
              <button
                class="block-btn accept-right-btn"
                style={`top: ${ribbon.rightBtnY}px; left: 24px;`}
                title="Accept Theirs (Right)"
                onclick={() => acceptRight(ribbon.id)}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M8.5 2L5 5L8.5 8M5 2L1.5 5L5 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            {:else}
              <button
                class="block-btn btn-revert active-accepted"
                style={`top: ${ribbon.rightBtnY}px; left: 13px;`}
                title="Revert Right (re-open)"
                onclick={() => revertRight(ribbon.id)}
              >
                <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.418A6 6 0 1 1 8 2v1z"/>
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M8 4.5a.5.5 0 0 1-.5-.5V1a.5.5 0 0 1 1 0v3a.5.5 0 0 1-.5.5z"/>
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M5.146 3.854a.5.5 0 0 1 0-.708l2.5-2.5a.5.5 0 0 1 .708.708L6.207 3.5l2.147 2.146a.5.5 0 0 1-.708.708l-2.5-2.5z"/>
                </svg>
              </button>
            {/if}
          {/if}
        {/each}
      </div>
    </div>

    <!-- Right Editor (Theirs) -->
    <div
      class="editor-pane right-editor"
      bind:this={rightEditor}
      onscroll={() => rightEditor && syncScroll(rightEditor)}
      onwheel={(e) => rightEditor && handleWheel(rightEditor, e)}
    >
      <div class="lines-container">
        {#each rightLines as line (line.id)}
          <div class={`editor-line ${line.extraClass}`.trim()}>
            <div class="gutter-num">{line.lineNo}</div>
            <div class="line-content">{@html highlightCode(line.text)}</div>
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>

<style>
  :global(*) {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  :global(body),
  :global(html),
  :global(#app) {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background-color: var(--vscode-editor-background, #1e1f22);
    color: var(--vscode-editor-foreground, #bcbec4);
    font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
    font-size: 12px;
  }
  .merge-editor-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .columns-header {
    display: flex;
    height: 26px;
    background: var(--vscode-editorGroupHeader-tabsBackground, #232528);
    border-bottom: 1px solid var(--vscode-panel-border, #2f3136);
    font-size: 11px;
    font-weight: 600;
    color: var(--vscode-descriptionForeground, #7f848e);
    user-select: none;
  }
  .header-col {
    flex: 1;
    padding: 4px 16px;
    display: flex;
    align-items: center;
    gap: 6px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .header-col.center-col {
    color: #dfe1e5;
  }
  .header-col-gutter {
    width: 44px;
    min-width: 44px;
    max-width: 44px;
    background: var(--vscode-editorGutter-background, var(--vscode-editor-background, #1e1f22));
    border-left: 1px solid var(--vscode-panel-border, #2b2d30);
    border-right: 1px solid var(--vscode-panel-border, #2b2d30);
  }
  .editable-badge {
    font-size: 10px;
    font-weight: 500;
    padding: 1px 6px;
    border-radius: 3px;
    background: rgba(53, 116, 240, 0.18);
    color: #58a6ff;
    border: 1px solid rgba(53, 116, 240, 0.35);
  }

  .viewport-wrapper {
    flex: 1;
    min-height: 0;
    display: flex;
    position: relative;
    overflow: hidden;
    background: var(--vscode-editor-background, #1e1f22);
  }
  .editor-pane {
    flex: 1;
    overflow-x: auto;
    overflow-y: auto;
    background: var(--vscode-editor-background, #1e1f22);
    min-width: 0;
    position: relative;
    user-select: text !important;
    -webkit-user-select: text !important;
  }
  .editor-pane::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }
  .editor-pane::-webkit-scrollbar-thumb {
    background: #393b40;
    border-radius: 4px;
  }
  .editor-pane::-webkit-scrollbar-corner {
    background: transparent;
  }
  .lines-container {
    display: flex;
    flex-direction: column;
    min-width: 100%;
    width: max-content;
    position: relative;
    user-select: text !important;
    -webkit-user-select: text !important;
  }
  .editor-line {
    height: 20px;
    min-height: 20px;
    max-height: 20px;
    line-height: 20px;
    display: flex;
    align-items: stretch;
    min-width: 100%;
    width: max-content;
    font-family: "JetBrains Mono", "JetBrains Mono NL", JetBrainsMono, Consolas, Menlo, Monaco, monospace;
    font-size: var(--vscode-editor-font-size, 12px);
    color: var(--vscode-editor-foreground, #bcbec4);
    white-space: pre;
    user-select: text !important;
    -webkit-user-select: text !important;
    cursor: text;
  }
  .gutter-num {
    width: 44px;
    min-width: 44px;
    height: 20px;
    line-height: 20px;
    text-align: right;
    padding-right: 12px;
    color: var(--vscode-editorLineNumber-foreground, #5a5d63);
    user-select: none !important;
    -webkit-user-select: none !important;
    font-size: 11px;
    font-family: "JetBrains Mono", "JetBrains Mono NL", monospace;
    position: sticky;
    left: 0;
    background: inherit;
    z-index: 2;
    cursor: default;
  }
  .line-content {
    flex: 1;
    height: 20px;
    line-height: 20px;
    padding-left: 6px;
    padding-right: 24px;
    white-space: pre;
    overflow: visible;
    user-select: text !important;
    -webkit-user-select: text !important;
    cursor: text !important;
  }
  .editor-line ::selection,
  .editor-line::selection {
    background: var(--vscode-editor-selectionBackground, #264f78) !important;
    color: inherit !important;
  }

  .merge-gutter {
    width: 44px;
    min-width: 44px;
    max-width: 44px;
    align-self: stretch;
    height: 100%;
    overflow: hidden;
    position: relative;
    background: var(--vscode-editorGutter-background, var(--vscode-editor-background, #1e1f22));
    border-left: 1px solid var(--vscode-panel-border, #2b2d30);
    border-right: 1px solid var(--vscode-panel-border, #2b2d30);
    user-select: none !important;
    -webkit-user-select: none !important;
  }
  .gutter-svg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
  .gutter-controls {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
  .conflict-ribbon {
    fill: rgba(186, 68, 68, 0.35);
    transition: fill 0.15s ease;
  }
  .insert-ribbon {
    fill: rgba(46, 160, 67, 0.32);
    transition: fill 0.15s ease;
  }
  .modify-ribbon {
    fill: rgba(53, 116, 240, 0.32);
    transition: fill 0.15s ease;
  }
  .conflict-ribbon.resolved,
  .insert-ribbon.resolved {
    fill: rgba(46, 160, 67, 0.22);
  }
  .modify-ribbon.resolved {
    fill: rgba(53, 116, 240, 0.22);
  }
  .conflict-ribbon.ignored {
    fill: rgba(90, 95, 105, 0.14);
  }

  .block-btn {
    position: absolute;
    width: 18px;
    height: 18px;
    pointer-events: auto;
    z-index: 6;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--vscode-editor-background, #1e1f22);
    border: 1px solid rgba(255, 255, 255, 0.28);
    border-radius: 3px;
    color: var(--vscode-foreground, #bcbec4);
    cursor: pointer;
    padding: 0;
    box-sizing: border-box;
    transition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease, transform 0.12s ease;
  }
  .block-btn:hover {
    background: #3574f0;
    border-color: #3574f0;
    color: #ffffff;
    transform: scale(1.12);
  }
  .block-btn.btn-ignore {
    width: 16px;
    height: 16px;
    opacity: 0.65;
  }
  .block-btn.btn-ignore:hover {
    background: #ba4444;
    border-color: #ba4444;
    color: #ffffff;
    opacity: 1;
  }
  .block-btn.active-accepted,
  .block-btn.btn-revert {
    background: #2ea043;
    border-color: #2ea043;
    color: #ffffff;
  }
  .block-btn.btn-revert:hover {
    background: #ba4444;
    border-color: #ba4444;
    color: #ffffff;
    transform: scale(1.12);
  }
  .block-btn.append-mode {
    border-color: #3574f0;
    color: #58a6ff;
  }
  .block-btn.append-mode:hover {
    background: #3574f0;
    color: #ffffff;
  }

  .line-conflict {
    background: rgba(186, 68, 68, 0.20) !important;
  }
  .line-insert {
    background: rgba(46, 160, 67, 0.20) !important;
  }
  .line-modify {
    background: rgba(53, 116, 240, 0.20) !important;
  }
  .line-conflict-resolved {
    background: rgba(46, 160, 67, 0.14) !important;
  }
  .line-modify-resolved {
    background: rgba(53, 116, 240, 0.14) !important;
  }
  .line-placeholder {
    font-style: italic;
    color: #e5a50a;
    opacity: 0.8;
    background: rgba(229, 165, 10, 0.08);
    border-top: 1px dashed rgba(229, 165, 10, 0.3);
    border-bottom: 1px dashed rgba(229, 165, 10, 0.3);
  }

  .center-editor .line-content[contenteditable="plaintext-only"] {
    outline: none !important;
    cursor: text;
  }

  /* Syntax Highlighting */
  :global(.syn-kwd) { color: var(--syn-kwd, #fd6883) !important; }
  :global(.syn-type) { color: var(--syn-type, #85dacc) !important; }
  :global(.syn-fn) { color: var(--syn-fn, #adda78) !important; }
  :global(.syn-str) { color: var(--syn-str, #f9cc6c) !important; }
  :global(.syn-num) { color: var(--syn-num, #a8a9eb) !important; }
  :global(.syn-const) { color: var(--syn-const, #a8a9eb) !important; }
  :global(.syn-var) { color: var(--syn-var, #fff1f3) !important; }
  :global(.syn-comment) { color: var(--syn-comment, #72696a) !important; font-style: italic; }
  :global(.syn-anno) { color: var(--syn-anno, #85dacc) !important; }
  :global(.syn-punct) { color: var(--syn-punct, #948a8b) !important; }
</style>
