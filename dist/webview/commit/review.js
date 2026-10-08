(() => {
  // webview/shared/escape.ts
  function escapeHtml(str) {
    if (!str)
      return "";
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // webview/shared/syntaxHighlight.ts
  var TOKEN_REGEX = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b(?:0x[0-9a-fA-F]+|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b)|(@[a-zA-Z_$][a-zA-Z0-9_$]*)|(\b(?:abstract|as|assert|async|await|break|case|catch|class|const|continue|covariant|default|deferred|do|dynamic|else|enum|export|extends|extension|external|factory|final|finally|for|Function|get|hide|if|implements|import|in|interface|is|late|library|mixin|native|new|of|on|operator|part|rethrow|return|set|show|static|super|switch|sync|this|throw|try|typedef|var|void|while|with|yield|let|function|package|public|private|protected)\b)|(\b(?:true|false|null|undefined|nil|None)\b)|(\b(?:int|double|num|bool|boolean|String|string|List|Map|Set|Iterable|Future|Stream|Duration|DateTime|Uri|Object|Never|any|number|char|float|long|short|byte)\b)|(\b[a-zA-Z_$][a-zA-Z0-9_$]*(?=\s*\())|(\b[A-Z][a-zA-Z0-9_$]*\b)|(\b[a-zA-Z_$][a-zA-Z0-9_$]*\b)/g;
  function highlightCode(code) {
    if (!code)
      return "";
    let result = "";
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
  function tokenize(str) {
    if (!str)
      return [];
    const regex = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|([a-zA-Z0-9_$]+|[^\sa-zA-Z0-9_$]+|\s+)/g;
    return str.match(regex) || [str];
  }
  function computeWordDiff(leftStr, rightStr, highlightWords = true) {
    if (!highlightWords) {
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
    let leftHtml = "";
    for (let i = 0; i < leftTokens.length; i++) {
      const token = leftTokens[i];
      if (i >= start && i <= endLeft) {
        leftHtml += `<span class="diff-word-delete">${highlightCode(token)}</span>`;
      } else {
        leftHtml += highlightCode(token);
      }
    }
    let rightHtml = "";
    for (let i = 0; i < rightTokens.length; i++) {
      const token = rightTokens[i];
      if (i >= start && i <= endRight) {
        rightHtml += `<span class="diff-word-insert">${highlightCode(token)}</span>`;
      } else {
        rightHtml += highlightCode(token);
      }
    }
    return { leftHtml, rightHtml };
  }

  // webview/review/state.ts
  var LINE_HEIGHT = 20;
  var MAX_HISTORY = 50;
  var state = {
    filePath: "",
    fileName: "",
    fileDir: "",
    diff: "",
    stagedDiff: "",
    baseContent: "",
    currentContent: "",
    baseLines: [],
    currentLines: [],
    filesList: [],
    currentFileIndex: 0,
    highlightWords: true,
    blocks: [],
    segments: [],
    currentDiffIndex: 0,
    readOnly: false,
    focusTarget: null,
    baseTitle: "",
    targetTitle: "",
    pendingJumpDirection: null,
    pendingFromFileList: null
  };
  var runtime = {
    savedScrollTop: null,
    isSyncing: false,
    isRendering: false,
    activeScroller: null,
    scrollerTimeout: null,
    scrollAnimId: null,
    updateRibbonsFn: null
  };
  var undoStack = [];
  var redoStack = [];

  // webview/review/diffParser.ts
  function isBlockStaged(block, stagedDiff, baseLines, currentLines) {
    if (!stagedDiff || !stagedDiff.trim())
      return false;
    if (block.type === "add" || block.type === "mod") {
      for (let i = 0; i < (block.addCount || 0); i++) {
        const line = currentLines[block.rightStart - 1 + i];
        if (line !== void 0 && stagedDiff.includes("+" + line)) {
          return true;
        }
      }
    }
    if (block.type === "del" || block.type === "mod") {
      for (let i = 0; i < (block.delCount || 0); i++) {
        const line = baseLines[block.leftStart - 1 + i];
        if (line !== void 0 && stagedDiff.includes("-" + line)) {
          return true;
        }
      }
    }
    return false;
  }
  function buildStagedContent(baseContent, currentContent, blocks) {
    const baseLines = (baseContent || "").split("\n");
    const currentLines = (currentContent || "").split("\n");
    const result = [];
    let curBaseLine = 1;
    const sorted = [...blocks].sort((a, b) => a.leftStart - b.leftStart);
    for (const b of sorted) {
      while (curBaseLine < b.leftStart && curBaseLine <= baseLines.length) {
        result.push(baseLines[curBaseLine - 1]);
        curBaseLine++;
      }
      if (b.staged) {
        if (b.addCount && b.addCount > 0) {
          for (let i = 0; i < b.addCount; i++) {
            const cIdx = b.rightStart - 1 + i;
            if (cIdx >= 0 && cIdx < currentLines.length) {
              result.push(currentLines[cIdx]);
            }
          }
        }
        curBaseLine += b.delCount || 0;
      } else {
        if (b.delCount && b.delCount > 0) {
          for (let i = 0; i < b.delCount; i++) {
            if (curBaseLine <= baseLines.length) {
              result.push(baseLines[curBaseLine - 1]);
              curBaseLine++;
            }
          }
        }
      }
    }
    while (curBaseLine <= baseLines.length) {
      result.push(baseLines[curBaseLine - 1]);
      curBaseLine++;
    }
    return result.join("\n");
  }
  function parseDiffData(rawDiff) {
    state.baseLines = state.baseContent ? state.baseContent.split("\n") : [];
    state.currentLines = state.currentContent ? state.currentContent.split("\n") : [];
    const L_total = state.baseLines.length;
    const R_total = state.currentLines.length;
    if (!rawDiff || !rawDiff.trim()) {
      if (L_total === 0 && R_total > 0) {
        state.blocks = [{
          id: 0,
          type: "add",
          leftStart: 1,
          leftEnd: 1,
          isLeftEmpty: true,
          rightStart: 1,
          rightEnd: R_total,
          isRightEmpty: false,
          staged: false,
          patchContent: ""
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
          type: "del",
          leftStart: 1,
          leftEnd: L_total,
          isLeftEmpty: false,
          rightStart: 1,
          rightEnd: 1,
          isRightEmpty: true,
          staged: false,
          patchContent: ""
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
    const lines = rawDiff.split("\n");
    const hunks = [];
    let currentHunk = null;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith("@@")) {
        const match = line.match(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
        if (match) {
          currentHunk = {
            header: line,
            oldStart: parseInt(match[1], 10),
            oldCount: match[2] !== void 0 ? parseInt(match[2], 10) : 1,
            newStart: parseInt(match[3], 10),
            newCount: match[4] !== void 0 ? parseInt(match[4], 10) : 1,
            diffLines: [],
            rawLines: [line]
          };
          hunks.push(currentHunk);
        }
      } else if (currentHunk) {
        currentHunk.rawLines.push(line);
        if (line.startsWith("+") || line.startsWith("-") || line.startsWith(" ")) {
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
        if (d.startsWith(" ")) {
          bLine++;
          cLine++;
          dIdx++;
        } else {
          const startLeft = bLine;
          const startRight = cLine;
          let delCount = 0;
          let addCount = 0;
          while (dIdx < hunk.diffLines.length && (hunk.diffLines[dIdx].startsWith("-") || hunk.diffLines[dIdx].startsWith("+"))) {
            const cur = hunk.diffLines[dIdx];
            if (cur.startsWith("-")) {
              delCount++;
              bLine++;
            } else if (cur.startsWith("+")) {
              addCount++;
              cLine++;
            }
            dIdx++;
          }
          let blockType = "mod";
          if (delCount > 0 && addCount === 0)
            blockType = "del";
          else if (addCount > 0 && delCount === 0)
            blockType = "add";
          else
            blockType = "mod";
          let patch = `--- a/${state.filePath}
+++ b/${state.filePath}
${hunk.header}
`;
          hunk.rawLines.slice(1).forEach((l) => {
            patch += l + "\n";
          });
          const bObj = {
            id: blocks.length,
            type: blockType,
            leftStart: startLeft,
            leftEnd: delCount > 0 ? startLeft + delCount - 1 : startLeft,
            isLeftEmpty: delCount === 0,
            rightStart: startRight,
            rightEnd: addCount > 0 ? startRight + addCount - 1 : startRight,
            isRightEmpty: addCount === 0,
            delCount,
            addCount,
            staged: false,
            patchContent: patch
          };
          bObj.staged = isBlockStaged(bObj, state.stagedDiff, state.baseLines, state.currentLines);
          blocks.push(bObj);
        }
      }
    });
    state.blocks = blocks;
    state.segments = buildSegments(hunks, L_total, R_total);
  }
  function buildSegments(hunks, L_total, R_total) {
    const segments = [];
    let curL = 1;
    let curR = 1;
    hunks.forEach((hunk) => {
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
      let dIdx = 0;
      while (dIdx < hunk.diffLines.length) {
        const d = hunk.diffLines[dIdx];
        if (d.startsWith(" ")) {
          let ctxCount = 0;
          while (dIdx < hunk.diffLines.length && hunk.diffLines[dIdx].startsWith(" ")) {
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
          while (dIdx < hunk.diffLines.length && (hunk.diffLines[dIdx].startsWith("-") || hunk.diffLines[dIdx].startsWith("+"))) {
            if (hunk.diffLines[dIdx].startsWith("-"))
              delCount++;
            else if (hunk.diffLines[dIdx].startsWith("+"))
              addCount++;
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
  function mapLeftToRight(sLeft) {
    if (sLeft <= 0 || state.segments.length === 0)
      return 0;
    for (let i = 0; i < state.segments.length; i++) {
      const seg = state.segments[i];
      if (sLeft >= seg.leftY && sLeft <= seg.leftY + seg.hLeft) {
        if (!seg.isDiff) {
          return seg.rightY + (sLeft - seg.leftY);
        } else {
          if (seg.hLeft === 0 || seg.hRight === 0) {
            return seg.rightY;
          }
          const ratio = (sLeft - seg.leftY) / seg.hLeft;
          return seg.rightY + ratio * seg.hRight;
        }
      }
    }
    const last = state.segments[state.segments.length - 1];
    return last ? last.rightY + last.hRight : sLeft;
  }
  function mapRightToLeft(sRight) {
    if (sRight <= 0 || state.segments.length === 0)
      return 0;
    for (let i = 0; i < state.segments.length; i++) {
      const seg = state.segments[i];
      if (sRight >= seg.rightY && sRight <= seg.rightY + seg.hRight) {
        if (!seg.isDiff) {
          return seg.leftY + (sRight - seg.rightY);
        } else {
          if (seg.hRight === 0 || seg.hLeft === 0) {
            return seg.leftY;
          }
          const ratio = (sRight - seg.rightY) / seg.hRight;
          return seg.leftY + ratio * seg.hLeft;
        }
      }
    }
    const last = state.segments[state.segments.length - 1];
    return last ? last.leftY + last.hLeft : sRight;
  }

  // webview/review/editorHistory.ts
  var saveTimer = null;
  function pushHistoryState(content, scrollY) {
    if (!content)
      return;
    if (undoStack.length > 0 && undoStack[undoStack.length - 1].content === content) {
      return;
    }
    undoStack.push({
      content,
      scrollTop: scrollY !== void 0 && scrollY !== null ? scrollY : runtime.savedScrollTop || 0
    });
    if (undoStack.length > MAX_HISTORY) {
      undoStack.shift();
    }
    redoStack.length = 0;
  }
  function performUndo(vscode2) {
    if (state.readOnly || undoStack.length === 0)
      return;
    const curContent = state.currentLines.join("\n");
    const prevState = undoStack.pop();
    const rightPane = document.querySelector(".editor-pane.right-pane");
    const curScroll = rightPane ? rightPane.scrollTop : runtime.savedScrollTop || 0;
    redoStack.push({
      content: curContent,
      scrollTop: curScroll
    });
    runtime.savedScrollTop = prevState.scrollTop;
    state.currentLines = prevState.content.split("\n");
    state.currentContent = prevState.content;
    vscode2.postMessage({
      type: "saveFileContent",
      payload: {
        filePath: state.filePath,
        content: prevState.content,
        focusLine: null,
        focusOffset: null
      }
    });
  }
  function performRedo(vscode2) {
    if (state.readOnly || redoStack.length === 0)
      return;
    const curContent = state.currentLines.join("\n");
    const nextState = redoStack.pop();
    const rightPane = document.querySelector(".editor-pane.right-pane");
    const curScroll = rightPane ? rightPane.scrollTop : runtime.savedScrollTop || 0;
    undoStack.push({
      content: curContent,
      scrollTop: curScroll
    });
    runtime.savedScrollTop = nextState.scrollTop;
    state.currentLines = nextState.content.split("\n");
    state.currentContent = nextState.content;
    vscode2.postMessage({
      type: "saveFileContent",
      payload: {
        filePath: state.filePath,
        content: nextState.content,
        focusLine: null,
        focusOffset: null
      }
    });
  }
  function triggerSave(vscode2, focusLine, focusOffset) {
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }
    if (state.readOnly || !state.filePath)
      return;
    const rightPane = document.querySelector(".editor-pane.right-pane");
    if (rightPane) {
      runtime.savedScrollTop = rightPane.scrollTop;
    }
    const newContent = state.currentLines.join("\n");
    state.currentContent = newContent;
    vscode2.postMessage({
      type: "saveFileContent",
      payload: {
        filePath: state.filePath,
        content: newContent,
        focusLine: focusLine || null,
        focusOffset: focusOffset !== void 0 ? focusOffset : null
      }
    });
  }
  function queueDebouncedSave(vscode2, focusLine, focusOffset) {
    if (saveTimer)
      clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      triggerSave(vscode2, focusLine, focusOffset);
    }, 1200);
  }
  function revertBlock(block, vscode2, onRender) {
    const rightPane = document.querySelector(".editor-pane.right-pane");
    if (rightPane) {
      runtime.savedScrollTop = rightPane.scrollTop;
    }
    pushHistoryState(state.currentLines.join("\n"), runtime.savedScrollTop || 0);
    const currentLines = [...state.currentLines];
    const baseLines = [...state.baseLines];
    const replaceStart = block.rightStart - 1;
    const replaceCount = block.isRightEmpty ? 0 : block.addCount || 0;
    const insertLines = [];
    if (!block.isLeftEmpty && block.delCount && block.delCount > 0) {
      for (let i = 0; i < block.delCount; i++) {
        const bIdx = block.leftStart - 1 + i;
        if (bIdx >= 0 && bIdx < baseLines.length) {
          insertLines.push(baseLines[bIdx]);
        }
      }
    }
    currentLines.splice(replaceStart, replaceCount, ...insertLines);
    const newContent = currentLines.join("\n");
    state.currentLines = currentLines;
    state.currentContent = newContent;
    onRender();
    vscode2.postMessage({
      type: "revertBlockContent",
      payload: {
        filePath: state.filePath,
        newContent
      }
    });
  }
  function setCaretPosition(el, offset) {
    if (!el)
      return;
    el.focus();
    const sel = window.getSelection();
    if (!sel)
      return;
    const range = document.createRange();
    let charCount = 0;
    let nodeToSet = el;
    let nodeOffset = 0;
    function traverse(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const textLen = (node.nodeValue || "").length;
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
          if (traverse(node.childNodes[i]))
            return true;
        }
      }
      return false;
    }
    traverse(el);
    try {
      range.setStart(nodeToSet, Math.min(nodeOffset, (nodeToSet.nodeValue || "").length));
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    } catch (e) {
    }
  }
  function getCaretOffset(element) {
    let caretOffset = 0;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      try {
        const range = sel.getRangeAt(0);
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(element);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        caretOffset = preCaretRange.toString().length;
      } catch (e) {
      }
    }
    return caretOffset;
  }

  // webview/review/navigation.ts
  var pendingNextFile = false;
  var pendingPrevFile = false;
  var hintTimeout = null;
  function hideDiffNavigationHint() {
    pendingNextFile = false;
    pendingPrevFile = false;
    if (hintTimeout) {
      clearTimeout(hintTimeout);
      hintTimeout = null;
    }
    const el = document.getElementById("diff-nav-hint");
    if (el) {
      el.style.opacity = "0";
      el.style.transform = "translate(-50%, 8px)";
      setTimeout(() => {
        if (el && el.parentNode)
          el.parentNode.removeChild(el);
      }, 200);
    }
  }
  function showDiffNavigationHint(kbdText, messageText, duration = 3500) {
    if (hintTimeout) {
      clearTimeout(hintTimeout);
      hintTimeout = null;
    }
    let el = document.getElementById("diff-nav-hint");
    if (!el) {
      el = document.createElement("div");
      el.id = "diff-nav-hint";
      document.body.appendChild(el);
    }
    el.innerHTML = `<span class="hint-kbd">${escapeHtml(kbdText)}</span><span class="hint-msg">${escapeHtml(messageText)}</span>`;
    el.style.opacity = "1";
    el.style.transform = "translate(-50%, 0)";
    hintTimeout = setTimeout(() => {
      hideDiffNavigationHint();
    }, duration);
  }
  function highlightActiveBlock(blockId) {
    const svgEl = document.querySelector(".gutter-ribbon-svg");
    if (!svgEl)
      return;
    const ribbon = svgEl.querySelector(`[data-block-id="${blockId}"]`);
    if (ribbon) {
      ribbon.classList.add("diff-ribbon-active");
      setTimeout(() => {
        ribbon.classList.remove("diff-ribbon-active");
      }, 700);
    }
  }
  function smoothScrollBoth(leftPane, rightPane, targetLeft, targetRight, duration = 240, onComplete) {
    if (runtime.scrollAnimId) {
      cancelAnimationFrame(runtime.scrollAnimId);
      runtime.scrollAnimId = null;
    }
    const startLeft = leftPane.scrollTop;
    const startRight = rightPane.scrollTop;
    const diffLeft = targetLeft - startLeft;
    const diffRight = targetRight - startRight;
    if (Math.abs(diffLeft) < 1 && Math.abs(diffRight) < 1) {
      if (onComplete)
        onComplete();
      return;
    }
    runtime.isSyncing = true;
    let startTime = null;
    function step(timestamp) {
      if (!startTime)
        startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      leftPane.scrollTop = Math.round(startLeft + diffLeft * ease);
      rightPane.scrollTop = Math.round(startRight + diffRight * ease);
      runtime.savedScrollTop = rightPane.scrollTop;
      if (runtime.updateRibbonsFn)
        runtime.updateRibbonsFn();
      if (progress < 1) {
        runtime.scrollAnimId = requestAnimationFrame(step);
      } else {
        leftPane.scrollTop = targetLeft;
        rightPane.scrollTop = targetRight;
        runtime.savedScrollTop = targetRight;
        if (runtime.updateRibbonsFn)
          runtime.updateRibbonsFn();
        runtime.scrollAnimId = null;
        requestAnimationFrame(() => {
          runtime.isSyncing = false;
        });
        if (onComplete)
          onComplete();
      }
    }
    runtime.scrollAnimId = requestAnimationFrame(step);
  }
  function jumpToBlock(index, smooth = false) {
    if (!state.blocks || state.blocks.length === 0)
      return;
    if (index < 0)
      index = state.blocks.length - 1;
    if (index >= state.blocks.length)
      index = 0;
    state.currentDiffIndex = index;
    const b = state.blocks[index];
    if (!b)
      return;
    const leftPane = document.querySelector(".editor-pane.left-pane");
    const rightPane = document.querySelector(".editor-pane.right-pane");
    if (!leftPane || !rightPane)
      return;
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
      if (runtime.updateRibbonsFn)
        runtime.updateRibbonsFn();
      requestAnimationFrame(() => {
        runtime.isSyncing = false;
      });
      highlightActiveBlock(b.id);
    }
  }
  function jumpFirstOrLastDiff(direction) {
    if (!state.blocks || state.blocks.length === 0)
      return;
    const targetIdx = direction > 0 ? 0 : state.blocks.length - 1;
    hideDiffNavigationHint();
    jumpToBlock(targetIdx, true);
    window.focus();
    const rightPane = document.querySelector(".editor-pane.right-pane");
    if (rightPane)
      rightPane.focus();
  }
  function jumpDiff(direction, vscode2) {
    if (!state.blocks || state.blocks.length === 0) {
      if (direction > 0 && state.currentFileIndex < state.filesList.length - 1) {
        if (pendingNextFile) {
          hideDiffNavigationHint();
          vscode2.postMessage({ type: "navigateFile", payload: state.currentFileIndex + 1 });
        } else {
          pendingNextFile = true;
          showDiffNavigationHint("F7", "Press F7 again to go to the next file");
        }
      }
      return;
    }
    const rightPane = document.querySelector(".editor-pane.right-pane");
    const currentScroll = rightPane ? rightPane.scrollTop : 0;
    const getBlockY = (b) => {
      return b.isRightEmpty ? mapLeftToRight((b.leftStart - 1) * LINE_HEIGHT) : (b.rightStart - 1) * LINE_HEIGHT;
    };
    if (direction > 0) {
      let targetIdx = state.blocks.findIndex((b) => getBlockY(b) > currentScroll + 70);
      if (targetIdx !== -1) {
        hideDiffNavigationHint();
        jumpToBlock(targetIdx, true);
      } else {
        const hasNextFile = state.currentFileIndex < state.filesList.length - 1;
        if (hasNextFile) {
          if (pendingNextFile) {
            hideDiffNavigationHint();
            vscode2.postMessage({ type: "navigateFile", payload: state.currentFileIndex + 1 });
          } else {
            pendingNextFile = true;
            showDiffNavigationHint("F7", "Press F7 again to go to the next file");
          }
        } else {
          showDiffNavigationHint("F7", "You are at the last change of the last file");
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
            vscode2.postMessage({ type: "navigateFile", payload: state.currentFileIndex - 1 });
          } else {
            pendingPrevFile = true;
            showDiffNavigationHint("Shift+F7", "Press Shift+F7 again to go to the previous file");
          }
        } else {
          showDiffNavigationHint("Shift+F7", "You are at the first change of the first file");
        }
      }
    }
  }

  // webview/review/main.ts
  var vscode = acquireVsCodeApi();
  var app = document.getElementById("app");
  function render() {
    if (!app)
      return;
    const rPaneOld = document.querySelector(".editor-pane.right-pane");
    if (rPaneOld) {
      runtime.savedScrollTop = rPaneOld.scrollTop;
    }
    runtime.isRendering = true;
    if (runtime.scrollAnimId) {
      cancelAnimationFrame(runtime.scrollAnimId);
      runtime.scrollAnimId = null;
    }
    app.innerHTML = "";
    parseDiffData(state.diff);
    const root = document.createElement("div");
    root.className = "studio-diff-container";
    const toolbar = document.createElement("div");
    toolbar.className = "studio-toolbar";
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
      <div class="dropdown-pill" id="pill-highlight-words" data-tooltip="${state.highlightWords ? "Highlight words" : "Do not highlight"}">
        <span class="pill-text">${state.highlightWords ? "Highlight words" : "Do not highlight"}</span>
        <span class="pill-arrow">
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M1.5 2.75L4 5.25L6.5 2.75" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
      </div>
      <div class="file-breadcrumb">
        <span class="file-name-main">${escapeHtml(state.fileName || state.filePath)}</span>
        ${state.fileDir ? `<span class="file-dir-sub">${escapeHtml(state.fileDir)}</span>` : ""}
      </div>
    </div>

    <div class="toolbar-right-group">
      <div class="diff-counter-pill">
        <span class="counter-text">${diffCount} ${diffCount === 1 ? "difference" : "differences"}</span>
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
      ` : ""}
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
      </button>` : ""}
      <div class="toolbar-divider"></div>
      <button class="icon-tool-btn ${!hasPrev ? "disabled" : ""}" id="btn-prev-file" data-tooltip="Previous File" data-shortcut="Alt+Left">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M8.5 3.5L5 7L8.5 10.5" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <button class="icon-tool-btn ${!hasNext ? "disabled" : ""}" id="btn-next-file" data-tooltip="Next File" data-shortcut="Alt+Right">
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
    const colHeader = document.createElement("div");
    colHeader.className = "studio-diff-columns-header";
    colHeader.innerHTML = `
    <div class="col-header-pane left-header">
      <span class="pane-title">${state.baseTitle || "Base revision (HEAD)"}</span>
    </div>
    <div class="col-header-gutter"></div>
    <div class="col-header-pane right-header">
      <span class="pane-title">${state.targetTitle || "Current version"}</span>
      ${state.readOnly ? '<span class="readonly-badge" title="Historical commit is read-only">Read-only</span>' : '<span class="editable-badge" title="You can edit this file directly">\u270E Editable</span>'}
    </div>
  `;
    root.appendChild(colHeader);
    const viewportWrapper = document.createElement("div");
    viewportWrapper.className = "studio-diff-viewport-wrapper";
    const leftPane = document.createElement("div");
    leftPane.className = "editor-pane left-pane";
    const rightPane = document.createElement("div");
    rightPane.className = "editor-pane right-pane";
    rightPane.tabIndex = 0;
    const leftLineMap = {};
    const rightLineMap = {};
    state.blocks.forEach((b) => {
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
    let leftHtml = "";
    state.baseLines.forEach((line, idx) => {
      const lineNum = idx + 1;
      const b = leftLineMap[lineNum];
      let rowClass = "editor-line";
      let contentHtml = highlightCode(line);
      if (b) {
        if (b.type === "del") {
          rowClass += " line-del";
          contentHtml = highlightCode(line);
        } else if (b.type === "mod") {
          rowClass += " line-mod";
          const rOffset = lineNum - b.leftStart;
          const matchingRightLineNum = b.rightStart + rOffset;
          const rightText = matchingRightLineNum <= b.rightEnd && state.currentLines[matchingRightLineNum - 1] !== void 0 ? state.currentLines[matchingRightLineNum - 1] : "";
          const wDiff = computeWordDiff(line, rightText);
          contentHtml = wDiff.leftHtml;
        }
      }
      leftHtml += `
      <div class="${rowClass}" data-line="${lineNum}">
        <span class="gutter-num">${lineNum}</span>
        <span class="line-content">${contentHtml || "&nbsp;"}</span>
      </div>
    `;
    });
    let leftInsertionsHtml = "";
    state.blocks.forEach((b) => {
      if (b.isLeftEmpty) {
        const topY = (b.leftStart - 1) * LINE_HEIGHT;
        leftInsertionsHtml += `<div class="diff-insertion-line insertion-add" style="top: ${topY}px;"></div>`;
      }
    });
    leftPane.innerHTML = `<div class="editor-lines-container">${leftHtml}${leftInsertionsHtml}</div>`;
    let rightHtml = "";
    state.currentLines.forEach((line, idx) => {
      const lineNum = idx + 1;
      const b = rightLineMap[lineNum];
      let rowClass = "editor-line";
      let contentHtml = highlightCode(line);
      if (b) {
        if (b.type === "add") {
          rowClass += " line-add";
          contentHtml = highlightCode(line);
        } else if (b.type === "mod") {
          rowClass += " line-mod";
          const lOffset = lineNum - b.rightStart;
          const matchingLeftLineNum = b.leftStart + lOffset;
          const leftText = matchingLeftLineNum <= b.leftEnd && state.baseLines[matchingLeftLineNum - 1] !== void 0 ? state.baseLines[matchingLeftLineNum - 1] : "";
          const wDiff = computeWordDiff(leftText, line);
          contentHtml = wDiff.rightHtml;
        }
      }
      const isEditable = !state.readOnly;
      const editableAttr = isEditable ? 'contenteditable="plaintext-only" spellcheck="false"' : "";
      rightHtml += `
      <div class="${rowClass}" data-line="${lineNum}">
        <span class="gutter-num">${lineNum}</span>
        <span class="line-content" ${editableAttr}>${contentHtml || "&nbsp;"}</span>
      </div>
    `;
    });
    let rightInsertionsHtml = "";
    state.blocks.forEach((b) => {
      if (b.isRightEmpty) {
        const topY = (b.rightStart - 1) * LINE_HEIGHT;
        rightInsertionsHtml += `<div class="diff-insertion-line insertion-del" style="top: ${topY}px;"></div>`;
      }
    });
    rightPane.innerHTML = `<div class="editor-lines-container">${rightHtml}${rightInsertionsHtml}</div>`;
    if (!state.readOnly) {
      let isEditingSession = false;
      rightPane.querySelectorAll(".line-content").forEach((span) => {
        const lineRow = span.closest(".editor-line");
        const lineNum = parseInt(lineRow?.getAttribute("data-line") || "1", 10);
        span.addEventListener("focus", () => {
          isEditingSession = false;
        });
        span.addEventListener("blur", () => {
          isEditingSession = false;
          const curText = (span.textContent || "").replace(/\u00A0/g, " ");
          if (state.currentLines[lineNum - 1] !== curText) {
            pushHistoryState(state.currentLines.join("\n"), rightPane.scrollTop);
            state.currentLines[lineNum - 1] = curText;
            triggerSave(vscode);
          }
        });
        span.addEventListener("input", () => {
          if (!isEditingSession) {
            pushHistoryState(state.currentLines.join("\n"), rightPane.scrollTop);
            isEditingSession = true;
          }
          const curText = (span.textContent || "").replace(/\u00A0/g, " ");
          state.currentLines[lineNum - 1] = curText;
          queueDebouncedSave(vscode, lineNum, getCaretOffset(span));
        });
        span.addEventListener("keydown", (e) => {
          const isUndo = (e.metaKey || e.ctrlKey) && !e.shiftKey && (e.key === "z" || e.key === "Z");
          const isRedo = (e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === "z" || e.key === "Z") || (e.ctrlKey || e.metaKey) && (e.key === "y" || e.key === "Y");
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
          if ((e.metaKey || e.ctrlKey) && (e.key === "x" || e.key === "X")) {
            const sel = window.getSelection();
            const selectedText = sel ? sel.toString() : "";
            if (!selectedText) {
              e.preventDefault();
              pushHistoryState(state.currentLines.join("\n"), rightPane.scrollTop);
              const lineText = state.currentLines[lineNum - 1] || "";
              if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(lineText + "\n").catch(() => {
                });
              }
              if (state.currentLines.length > 1) {
                state.currentLines.splice(lineNum - 1, 1);
              } else {
                state.currentLines[0] = "";
              }
              const nextLine = Math.min(lineNum, state.currentLines.length);
              triggerSave(vscode, nextLine, 0);
              return;
            }
          }
          if ((e.metaKey || e.ctrlKey) && (e.key === "s" || e.keyCode === 83)) {
            e.preventDefault();
            const curText = (span.textContent || "").replace(/\u00A0/g, " ");
            state.currentLines[lineNum - 1] = curText;
            triggerSave(vscode, lineNum, getCaretOffset(span));
            return;
          }
          if (e.key === "Tab") {
            e.preventDefault();
            pushHistoryState(state.currentLines.join("\n"), rightPane.scrollTop);
            const caret = getCaretOffset(span);
            const fullText = state.currentLines[lineNum - 1] || "";
            const updated = fullText.slice(0, caret) + "  " + fullText.slice(caret);
            state.currentLines[lineNum - 1] = updated;
            span.textContent = updated;
            setCaretPosition(span, caret + 2);
            queueDebouncedSave(vscode, lineNum, caret + 2);
            return;
          }
          if (e.key === "Enter") {
            e.preventDefault();
            pushHistoryState(state.currentLines.join("\n"), rightPane.scrollTop);
            const caret = getCaretOffset(span);
            const fullText = state.currentLines[lineNum - 1] || "";
            const before = fullText.slice(0, caret);
            const after = fullText.slice(caret);
            const matchIndent = before.match(/^(\s*)/);
            const indent = matchIndent ? matchIndent[1] : "";
            const newLineText = indent + after;
            state.currentLines[lineNum - 1] = before;
            state.currentLines.splice(lineNum, 0, newLineText);
            triggerSave(vscode, lineNum + 1, indent.length);
            return;
          }
          if (e.key === "Backspace") {
            const caret = getCaretOffset(span);
            if (caret === 0 && lineNum > 1) {
              e.preventDefault();
              pushHistoryState(state.currentLines.join("\n"), rightPane.scrollTop);
              const prevText = state.currentLines[lineNum - 2] || "";
              const curText = state.currentLines[lineNum - 1] || "";
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
    const middleGutter = document.createElement("div");
    middleGutter.className = "middle-gutter";
    const svgEl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgEl.setAttribute("class", "gutter-ribbon-svg");
    svgEl.setAttribute("width", "54");
    svgEl.setAttribute("height", "100%");
    middleGutter.appendChild(svgEl);
    const controlsContainer = document.createElement("div");
    controlsContainer.className = "gutter-controls-layer";
    middleGutter.appendChild(controlsContainer);
    viewportWrapper.appendChild(leftPane);
    viewportWrapper.appendChild(middleGutter);
    viewportWrapper.appendChild(rightPane);
    const overviewRuler = document.createElement("div");
    overviewRuler.className = "studio-overview-ruler";
    const totalLines = Math.max(state.currentLines.length, state.baseLines.length, 1);
    state.blocks.forEach((b) => {
      const lineStart = b.isRightEmpty ? b.leftStart : b.rightStart;
      const lineCount = b.isRightEmpty ? b.leftEnd - b.leftStart + 1 : b.rightEnd - b.rightStart + 1;
      const topPct = lineStart / totalLines * 100;
      const heightPct = Math.max(lineCount / totalLines * 100, 1.2);
      const stripe = document.createElement("div");
      stripe.className = `ruler-stripe stripe-${b.type}`;
      stripe.style.top = `${topPct}%`;
      stripe.style.height = `${heightPct}%`;
      stripe.setAttribute("title", `${b.type.toUpperCase()}: Line ${lineStart}`);
      stripe.addEventListener("click", () => {
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
    function updateRibbons() {
      runtime.updateRibbonsFn = updateRibbons;
      const sLeft = leftPane.scrollTop;
      const sRight = rightPane.scrollTop;
      const viewH = middleGutter.clientHeight || 800;
      const W = 54;
      let svgHtml = "";
      let ctrlHtml = "";
      state.blocks.forEach((b) => {
        let y1 = (b.leftStart - 1) * LINE_HEIGHT - sLeft;
        let y2 = b.isLeftEmpty ? y1 : b.leftEnd * LINE_HEIGHT - sLeft;
        let y3 = (b.rightStart - 1) * LINE_HEIGHT - sRight;
        let y4 = b.isRightEmpty ? y3 : b.rightEnd * LINE_HEIGHT - sRight;
        if (Math.max(y2, y4) < -20 || Math.min(y1, y3) > viewH + 20) {
          return;
        }
        const flat = 10;
        const d = `M 0,${y1} L ${flat},${y1} C ${flat + 10},${y1} ${W - flat - 10},${y3} ${W - flat},${y3} L ${W},${y3} L ${W},${y4} L ${W - flat},${y4} C ${W - flat - 10},${y4} ${flat + 10},${y2} ${flat},${y2} L 0,${y2} Z`;
        const fillClass = `ribbon-${b.type}`;
        svgHtml += `<path d="${d}" class="diff-ribbon ${fillClass}" data-block-id="${b.id}"/>`;
        if (!state.readOnly) {
          const checkY = b.isRightEmpty ? y3 - 7 : y3 + 3;
          const revertY = b.isLeftEmpty ? y1 - 7 : y1 + 3;
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
                <input type="checkbox" class="block-chk" ${b.staged ? "checked" : ""} data-block-id="${b.id}"/>
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
      controlsContainer.querySelectorAll(".block-revert-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const blockId = parseInt(btn.getAttribute("data-block-id") || "0", 10);
          const block = state.blocks.find((b) => b.id === blockId);
          if (block) {
            revertBlock(block, vscode, render);
          }
        });
      });
      controlsContainer.querySelectorAll(".block-chk").forEach((chk) => {
        chk.addEventListener("change", (e) => {
          e.stopPropagation();
          const blockId = parseInt(chk.getAttribute("data-block-id") || "0", 10);
          const block = state.blocks.find((b) => b.id === blockId);
          if (!block)
            return;
          const check = chk.checked;
          block.staged = check;
          const stagedCount = state.blocks.filter((b) => b.staged).length;
          const totalCount = state.blocks.length;
          const stagedContent = buildStagedContent(state.baseContent, state.currentContent, state.blocks);
          const masterChk = document.querySelector("#chk-master-version");
          if (masterChk) {
            masterChk.checked = stagedCount === totalCount && totalCount > 0;
            masterChk.indeterminate = stagedCount > 0 && stagedCount < totalCount;
          }
          vscode.postMessage({
            type: "updateBlockStage",
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
    const setScroller = (side) => {
      if (runtime.scrollAnimId) {
        cancelAnimationFrame(runtime.scrollAnimId);
        runtime.scrollAnimId = null;
        runtime.isSyncing = false;
      }
      runtime.activeScroller = side;
      if (runtime.scrollerTimeout)
        clearTimeout(runtime.scrollerTimeout);
      runtime.scrollerTimeout = setTimeout(() => {
        runtime.activeScroller = null;
      }, 150);
    };
    const handleWheel = (pane, side, e) => {
      setScroller(side);
      if (e.shiftKey && e.deltaY !== 0 && e.deltaX === 0) {
        pane.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    };
    leftPane.addEventListener("wheel", (e) => handleWheel(leftPane, "left", e), { passive: false });
    rightPane.addEventListener("wheel", (e) => handleWheel(rightPane, "right", e), { passive: false });
    leftPane.addEventListener("pointerdown", () => setScroller("left"), { passive: true });
    rightPane.addEventListener("pointerdown", () => setScroller("right"), { passive: true });
    leftPane.addEventListener("touchstart", () => setScroller("left"), { passive: true });
    rightPane.addEventListener("touchstart", () => setScroller("right"), { passive: true });
    leftPane.addEventListener("scroll", () => {
      if (runtime.isRendering || runtime.isSyncing || runtime.activeScroller === "right")
        return;
      runtime.isSyncing = true;
      rightPane.scrollTop = mapLeftToRight(leftPane.scrollTop);
      runtime.savedScrollTop = rightPane.scrollTop;
      updateRibbons();
      requestAnimationFrame(() => {
        runtime.isSyncing = false;
      });
    }, { passive: true });
    rightPane.addEventListener("scroll", () => {
      if (runtime.isRendering)
        return;
      runtime.savedScrollTop = rightPane.scrollTop;
      if (runtime.isSyncing || runtime.activeScroller === "left")
        return;
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
        const rp = document.querySelector(".editor-pane.right-pane");
        if (rp)
          rp.focus();
      });
    }
    attachToolbarEvents(toolbar, vscode);
    if (state.focusTarget) {
      const target = state.focusTarget;
      state.focusTarget = null;
      requestAnimationFrame(() => {
        const lineEl = rightPane.querySelector(`.editor-line[data-line="${target.focusLine}"] .line-content`);
        if (lineEl) {
          lineEl.focus();
          setCaretPosition(lineEl, target.focusOffset || 0);
        }
      });
    }
  }
  function attachToolbarEvents(toolbar, vscode2) {
    toolbar.querySelector("#btn-prev-diff")?.addEventListener("click", () => jumpDiff(-1, vscode2));
    toolbar.querySelector("#btn-next-diff")?.addEventListener("click", () => jumpDiff(1, vscode2));
    toolbar.querySelector("#btn-prev-file")?.addEventListener("click", () => {
      if (state.currentFileIndex > 0) {
        vscode2.postMessage({ type: "navigateFile", payload: state.currentFileIndex - 1 });
      }
    });
    toolbar.querySelector("#btn-next-file")?.addEventListener("click", () => {
      if (state.currentFileIndex < state.filesList.length - 1) {
        vscode2.postMessage({ type: "navigateFile", payload: state.currentFileIndex + 1 });
      }
    });
    toolbar.querySelector("#btn-refresh")?.addEventListener("click", () => {
      vscode2.postMessage({ type: "refreshDiff", payload: state.filePath });
    });
    toolbar.querySelector("#pill-highlight-words")?.addEventListener("click", () => {
      state.highlightWords = !state.highlightWords;
      render();
    });
    const masterChk = toolbar.querySelector("#chk-master-version");
    if (masterChk) {
      const stagedCount = state.blocks.filter((b) => b.staged).length;
      const totalCount = state.blocks.length;
      masterChk.checked = stagedCount === totalCount && totalCount > 0;
      masterChk.indeterminate = stagedCount > 0 && stagedCount < totalCount;
      masterChk.addEventListener("change", () => {
        const check = masterChk.checked;
        state.blocks.forEach((b) => {
          b.staged = check;
        });
        document.querySelectorAll(".block-chk").forEach((c) => {
          c.checked = check;
        });
        const newStagedCount = check ? state.blocks.length : 0;
        const stagedContent = check ? state.currentContent : state.baseContent;
        vscode2.postMessage({
          type: "updateBlockStage",
          payload: {
            filePath: state.filePath,
            stagedContent,
            stagedCount: newStagedCount,
            totalCount: state.blocks.length
          }
        });
      });
    }
    toolbar.querySelector("#btn-tick-all")?.addEventListener("click", (e) => {
      e.stopPropagation();
      const anyUnstaged = state.blocks.some((b) => !b.staged);
      const targetCheck = anyUnstaged;
      if (masterChk) {
        masterChk.checked = targetCheck;
        masterChk.indeterminate = false;
      }
      state.blocks.forEach((b) => {
        b.staged = targetCheck;
      });
      document.querySelectorAll(".block-chk").forEach((c) => {
        c.checked = targetCheck;
      });
      const newStagedCount = targetCheck ? state.blocks.length : 0;
      const stagedContent = targetCheck ? state.currentContent : state.baseContent;
      vscode2.postMessage({
        type: "updateBlockStage",
        payload: {
          filePath: state.filePath,
          stagedContent,
          stagedCount: newStagedCount,
          totalCount: state.blocks.length
        }
      });
    });
    toolbar.querySelector("#btn-open-file")?.addEventListener("click", () => {
      if (state.filePath) {
        vscode2.postMessage({ type: "openFile", payload: state.filePath });
      }
    });
    toolbar.querySelector("#btn-rollback-all")?.addEventListener("click", () => {
      if (state.blocks.length > 0 && state.blocks[0].patchContent) {
        vscode2.postMessage({ type: "rollbackHunk", payload: { patch: state.blocks[0].patchContent } });
      }
    });
  }
  window.addEventListener("keydown", (e) => {
    if (!state.readOnly) {
      const isUndo = (e.metaKey || e.ctrlKey) && !e.shiftKey && (e.key === "z" || e.key === "Z");
      const isRedo = (e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === "z" || e.key === "Z") || (e.ctrlKey || e.metaKey) && (e.key === "y" || e.key === "Y");
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
    if (e.key === "F4" || e.keyCode === 115) {
      e.preventDefault();
      if (state.filePath) {
        vscode.postMessage({ type: "openFile", payload: state.filePath });
      }
    } else if (e.key === "F7" || e.keyCode === 118) {
      e.preventDefault();
      if (e.shiftKey) {
        jumpDiff(-1, vscode);
      } else {
        jumpDiff(1, vscode);
      }
    }
  });
  window.addEventListener("message", (event) => {
    const msg = event.data;
    switch (msg.type) {
      case "fileDiff": {
        hideDiffNavigationHint();
        const data = msg.payload;
        const isSameFile = state.filePath && state.filePath === (data.path || "");
        const isIdentical = isSameFile && state.diff === (data.diff || "") && state.stagedDiff === (data.stagedDiff || "") && state.baseContent === (data.baseContent !== void 0 ? data.baseContent : "") && state.currentContent === (data.currentContent !== void 0 ? data.currentContent : "") && state.readOnly === (data.readOnly === true) && !data.focusTarget;
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
        state.filePath = data.path || "";
        state.fileName = data.fileName || state.filePath.split("/").pop() || "";
        state.fileDir = data.fileDir || state.filePath.split("/").slice(0, -1).join("/");
        state.diff = data.diff || "";
        state.stagedDiff = data.stagedDiff || "";
        state.baseContent = data.baseContent !== void 0 ? data.baseContent : "";
        state.currentContent = data.currentContent !== void 0 ? data.currentContent : "";
        state.filesList = data.filesList || [];
        state.currentFileIndex = data.currentFileIndex || 0;
        state.currentDiffIndex = 0;
        state.readOnly = data.readOnly === true;
        state.baseTitle = data.baseTitle || "";
        state.targetTitle = data.targetTitle || "";
        if (data.focusTarget) {
          state.focusTarget = data.focusTarget;
        }
        render();
        break;
      }
      case "stagedDiffUpdated": {
        state.stagedDiff = msg.payload.stagedDiff || "";
        state.blocks.forEach((b) => {
          b.staged = isBlockStaged(b, state.stagedDiff, state.baseLines, state.currentLines);
        });
        const masterChk = document.querySelector("#chk-master-version");
        if (masterChk) {
          const stagedCount = state.blocks.filter((b) => b.staged).length;
          const totalCount = state.blocks.length;
          masterChk.checked = stagedCount === totalCount && totalCount > 0;
          masterChk.indeterminate = stagedCount > 0 && stagedCount < totalCount;
        }
        if (runtime.updateRibbonsFn)
          runtime.updateRibbonsFn();
        break;
      }
      case "jumpDiff": {
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
          const rightPane = document.querySelector(".editor-pane.right-pane");
          if (rightPane) {
            rightPane.focus();
          }
        });
        break;
      }
      case "themeTokens": {
        const tokens = msg.payload;
        if (!tokens)
          break;
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
  });
  if (typeof document !== "undefined") {
    if (document.body) {
      document.body.setAttribute("data-vscode-context", JSON.stringify({ preventDefaultContextMenuItems: true }));
    } else {
      document.addEventListener("DOMContentLoaded", () => {
        if (document.body)
          document.body.setAttribute("data-vscode-context", JSON.stringify({ preventDefaultContextMenuItems: true }));
      });
    }
  }
  window.addEventListener("contextmenu", (e) => {
    e.preventDefault();
  }, true);
  function initTooltips() {
    let tooltipEl = document.getElementById("studio-tooltip");
    if (!tooltipEl) {
      tooltipEl = document.createElement("div");
      tooltipEl.id = "studio-tooltip";
      tooltipEl.className = "studio-floating-tooltip";
      document.body.appendChild(tooltipEl);
    }
    let hoverTimer = null;
    let currentTarget = null;
    document.addEventListener("mouseover", (e) => {
      const target = e.target?.closest("[data-tooltip], [title]");
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
      if (currentTarget === target)
        return;
      currentTarget = target;
      if (hoverTimer)
        clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => {
        showTooltip(target);
      }, 180);
    }, true);
    document.addEventListener("mouseout", (e) => {
      const related = e.relatedTarget;
      if (currentTarget && (!related || !currentTarget.contains(related))) {
        hideTooltip();
      }
    }, true);
    document.addEventListener("click", () => {
      hideTooltip();
    }, true);
    window.addEventListener("scroll", () => {
      hideTooltip();
    }, true);
    function showTooltip(target) {
      const text = target.getAttribute("data-tooltip");
      if (!text || !tooltipEl)
        return;
      const shortcut = target.getAttribute("data-shortcut");
      tooltipEl.innerHTML = `
      <span class="tooltip-text">${escapeHtml(text)}</span>
      ${shortcut ? `<span class="tooltip-shortcut">${escapeHtml(shortcut)}</span>` : ""}
    `;
      tooltipEl.style.display = "flex";
      tooltipEl.classList.remove("visible");
      const rect = target.getBoundingClientRect();
      const tipRect = tooltipEl.getBoundingClientRect();
      let top = rect.bottom + 6;
      let left = rect.left + rect.width / 2 - tipRect.width / 2;
      if (top + tipRect.height > window.innerHeight - 6) {
        top = rect.top - tipRect.height - 6;
      }
      if (left < 6)
        left = 6;
      if (left + tipRect.width > window.innerWidth - 6) {
        left = window.innerWidth - tipRect.width - 6;
      }
      tooltipEl.style.top = `${Math.round(top)}px`;
      tooltipEl.style.left = `${Math.round(left)}px`;
      requestAnimationFrame(() => {
        if (tooltipEl)
          tooltipEl.classList.add("visible");
      });
    }
    function hideTooltip() {
      if (hoverTimer) {
        clearTimeout(hoverTimer);
        hoverTimer = null;
      }
      currentTarget = null;
      if (tooltipEl) {
        tooltipEl.classList.remove("visible");
        tooltipEl.style.display = "none";
      }
    }
  }
  initTooltips();
  vscode.postMessage({ type: "ready" });
})();
