<script lang="ts">
  import { onMount, tick } from "svelte";
  import { highlightCode } from "$shared/syntaxHighlight";
  import { postMessage } from "$shared/vscodeApi";
  import type { ConflictHunk, ExtensionToMergeMessage } from "$shared/protocol";
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
    resolved: boolean;
    chosen: "yours" | "theirs" | "custom" | "ignored" | null;
  }

  interface RenderLine {
    lineNo: number;
    text: string;
    extraClass: string;
    editable?: boolean;
    hunkId?: number;
  }

  interface RibbonItem {
    id: number;
    leftD: string;
    rightD: string;
    ribbonClass: string;
    leftBtnY: number;
    rightBtnY: number;
    leftAcceptActive: boolean;
    rightAcceptActive: boolean;
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

  let leftEditor: HTMLElement | null = $state(null);
  let centerEditor: HTMLElement | null = $state(null);
  let rightEditor: HTMLElement | null = $state(null);

  let sLeft = $state(0);
  let sCenter = $state(0);
  let sRight = $state(0);

  let remainingConflicts = $derived(conflictBlocks.filter((b) => !b.resolved).length);

  let ribbons = $derived.by(() => {
    const W = GUTTER_WIDTH;
    const items: RibbonItem[] = [];

    for (const b of conflictBlocks) {
      // Left -> Center
      const ly1 = (b.leftStart - 1) * LINE_HEIGHT - sLeft;
      const ly2 = b.leftCount === 0 ? ly1 : b.leftEnd * LINE_HEIGHT - sLeft;
      const cy1 = (b.centerStart - 1) * LINE_HEIGHT - sCenter;
      const cy2 = b.centerEnd * LINE_HEIGHT - sCenter;

      const leftD = `M 0,${ly1} L 6,${ly1} C 16,${ly1} ${W - 16},${cy1} ${W - 6},${cy1} L ${W},${cy1} L ${W},${cy2} L ${W - 6},${cy2} C ${W - 16},${cy2} 16,${ly2} 6,${ly2} L 0,${ly2} Z`;

      // Center <- Right
      const ry1 = (b.rightStart - 1) * LINE_HEIGHT - sRight;
      const ry2 = b.rightCount === 0 ? ry1 : b.rightEnd * LINE_HEIGHT - sRight;

      const rightD = `M 0,${cy1} L 6,${cy1} C 16,${cy1} ${W - 16},${ry1} ${W - 6},${ry1} L ${W},${ry1} L ${W},${ry2} L ${W - 6},${ry2} C ${W - 16},${ry2} 16,${cy2} 6,${cy2} L 0,${cy2} Z`;

      const ribbonClass = b.resolved
        ? b.chosen === "ignored"
          ? "conflict-ribbon ignored"
          : "conflict-ribbon resolved"
        : "conflict-ribbon";

      const leftBtnY = Math.max(0, ly1 + 2);
      const rightBtnY = Math.max(0, ry1 + 2);

      items.push({
        id: b.id,
        leftD,
        rightD,
        ribbonClass,
        leftBtnY,
        rightBtnY,
        leftAcceptActive: b.resolved && b.chosen === "yours",
        rightAcceptActive: b.resolved && b.chosen === "theirs",
      });
    }

    return items;
  });

  function rebuildLines() {
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
          nextLeft.push({ lineNo: leftNo++, text, extraClass: "" });
          nextCenter.push({ lineNo: centerNo++, text, extraClass: "", editable: true, hunkId: hunk.id });
          nextRight.push({ lineNo: rightNo++, text, extraClass: "" });
        }
      } else if (hunk.type === "conflict") {
        const yLines = hunk.yoursLines || [];
        const tLines = hunk.theirsLines || [];

        const leftStart = leftNo;
        for (const text of yLines) {
          nextLeft.push({ lineNo: leftNo++, text, extraClass: "line-conflict" });
        }
        const leftEnd = leftNo - 1;

        const rightStart = rightNo;
        for (const text of tLines) {
          nextRight.push({ lineNo: rightNo++, text, extraClass: "line-conflict" });
        }
        const rightEnd = rightNo - 1;

        const centerStart = centerNo;
        const rLines = hunk.resultLines || [];
        if (hunk.resolved && rLines.length > 0) {
          for (const text of rLines) {
            nextCenter.push({
              lineNo: centerNo++,
              text,
              extraClass: "line-conflict-resolved",
              editable: true,
              hunkId: hunk.id,
            });
          }
        } else if (hunk.resolved && rLines.length === 0) {
          // Empty result (ignored)
        } else {
          // Unresolved placeholder
          nextCenter.push({
            lineNo: centerNo++,
            text: `// Unresolved conflict #${hunk.id}`,
            extraClass: "line-placeholder",
            editable: true,
            hunkId: hunk.id,
          });
        }
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
          resolved: hunk.resolved || false,
          chosen: hunk.chosen || null,
        });
      }
    }

    leftLines = nextLeft;
    centerLines = nextCenter;
    rightLines = nextRight;
    conflictBlocks = nextBlocks;
  }

  function acceptConflict(id: number, choice: "yours" | "theirs" | "ignored") {
    const hunk = hunks.find((h) => h.id === id);
    if (!hunk) return;

    hunk.resolved = true;
    hunk.chosen = choice;
    if (choice === "yours") {
      hunk.resultLines = [...(hunk.yoursLines || [])];
    } else if (choice === "theirs") {
      hunk.resultLines = [...(hunk.theirsLines || [])];
    } else if (choice === "ignored") {
      hunk.resultLines = [];
    }

    rebuildLines();
  }

  function handleApplyNonConflicting() {
    for (const h of hunks) {
      if (h.type === "conflict" && !h.resolved) {
        if ((h.yoursLines || []).length === 0 && (h.theirsLines || []).length > 0) {
          h.resolved = true;
          h.chosen = "theirs";
          h.resultLines = [...h.theirsLines];
        } else if ((h.theirsLines || []).length === 0 && (h.yoursLines || []).length > 0) {
          h.resolved = true;
          h.chosen = "yours";
          h.resultLines = [...h.yoursLines];
        }
      }
    }
    rebuildLines();
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
    postMessage({ type: "cancelMerge" });
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

    window.addEventListener("message", messageListener);
    window.addEventListener("keydown", keyListener);

    postMessage({ type: "ready" });

    return () => {
      window.removeEventListener("message", messageListener);
      window.removeEventListener("keydown", keyListener);
      if (rafId) cancelAnimationFrame(rafId);
    };
  });
</script>

<div id="app">
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
        {#each leftLines as line}
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
          <path d={ribbon.leftD} class={ribbon.ribbonClass} data-id={ribbon.id} />
        {/each}
      </svg>
      <div class="gutter-controls">
        {#each ribbons as ribbon}
          <button
            class={`block-btn accept-left-btn ${ribbon.leftAcceptActive ? "active-accepted" : ""}`.trim()}
            style={`top: ${ribbon.leftBtnY}px; left: 4px;`}
            title="Accept Yours (Left)"
            onclick={() => acceptConflict(ribbon.id, "yours")}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1.5 2L5 5L1.5 8M5 2L8.5 5L5 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button
            class="block-btn btn-ignore ignore-left-btn"
            style={`top: ${ribbon.leftBtnY}px; left: 24px;`}
            title="Ignore Yours"
            onclick={() => acceptConflict(ribbon.id, "ignored")}
          >
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <path d="M1.5 1.5L6.5 6.5M6.5 1.5L1.5 6.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
            </svg>
          </button>
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
        {#each centerLines as line}
          <div class={`editor-line ${line.extraClass}`.trim()} data-hunk-id={line.hunkId}>
            <div class="gutter-num">{line.lineNo}</div>
            <div
              class="line-content"
              contenteditable="plaintext-only"
              spellcheck="false"
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
          <path d={ribbon.rightD} class={ribbon.ribbonClass} data-id={ribbon.id} />
        {/each}
      </svg>
      <div class="gutter-controls">
        {#each ribbons as ribbon}
          <button
            class="block-btn btn-ignore ignore-right-btn"
            style={`top: ${ribbon.rightBtnY}px; left: 4px;`}
            title="Ignore Theirs"
            onclick={() => acceptConflict(ribbon.id, "ignored")}
          >
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <path d="M1.5 1.5L6.5 6.5M6.5 1.5L1.5 6.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
            </svg>
          </button>
          <button
            class={`block-btn accept-right-btn ${ribbon.rightAcceptActive ? "active-accepted" : ""}`.trim()}
            style={`top: ${ribbon.rightBtnY}px; left: 22px;`}
            title="Accept Theirs (Right)"
            onclick={() => acceptConflict(ribbon.id, "theirs")}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M8.5 2L5 5L8.5 8M5 2L1.5 5L5 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
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
        {#each rightLines as line}
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
  :global(html) {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background-color: var(--vscode-editor-background, #1e1f22);
    color: var(--vscode-editor-foreground, #bcbec4);
    font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
    font-size: 12px;
  }
  #app {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
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
  .conflict-ribbon.resolved {
    fill: rgba(46, 160, 67, 0.25);
  }
  .conflict-ribbon.ignored {
    fill: rgba(90, 95, 105, 0.15);
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
    transition: all 0.12s ease;
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
  .block-btn.active-accepted {
    background: #2ea043;
    border-color: #2ea043;
    color: #ffffff;
  }

  .line-conflict {
    background: rgba(186, 68, 68, 0.18) !important;
  }
  .line-conflict-resolved {
    background: rgba(46, 160, 67, 0.15) !important;
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
