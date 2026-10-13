<script lang="ts">
  interface Props {
    fileName: string;
    fileDir: string;
    diffCount: number;
    hasPrev: boolean;
    hasNext: boolean;
    readOnly: boolean;
    highlightWords: boolean;
    isMasterChecked: boolean;
    isMasterIndeterminate: boolean;
    onToggleHighlightWords: () => void;
    onPrevDiff: () => void;
    onNextDiff: () => void;
    onTickAll: () => void;
    onToggleMasterStage: () => void;
    onOpenFile: () => void;
    onRollbackAll: () => void;
    onPrevFile: () => void;
    onNextFile: () => void;
    onRefresh: () => void;
  }

  let {
    fileName,
    fileDir,
    diffCount,
    hasPrev,
    hasNext,
    readOnly,
    highlightWords,
    isMasterChecked,
    isMasterIndeterminate,
    onToggleHighlightWords,
    onPrevDiff,
    onNextDiff,
    onTickAll,
    onToggleMasterStage,
    onOpenFile,
    onRollbackAll,
    onPrevFile,
    onNextFile,
    onRefresh,
  }: Props = $props();
</script>

<div class="studio-toolbar">
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

    <button
      type="button"
      class="dropdown-pill"
      id="pill-highlight-words"
      data-tooltip={highlightWords ? "Highlight words" : "Do not highlight"}
      onclick={onToggleHighlightWords}
    >
      <span class="pill-text">{highlightWords ? "Highlight words" : "Do not highlight"}</span>
      <span class="pill-arrow">
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
          <path d="M1.5 2.75L4 5.25L6.5 2.75" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>
    </button>

    <div class="file-breadcrumb">
      <span class="file-name-main">{fileName}</span>
      {#if fileDir}
        <span class="file-dir-sub">{fileDir}</span>
      {/if}
    </div>
  </div>

  <div class="toolbar-right-group">
    <div class="diff-counter-pill">
      <span class="counter-text">{diffCount} {diffCount === 1 ? "difference" : "differences"}</span>
      <button
        type="button"
        class="arrow-btn"
        id="btn-prev-diff"
        data-tooltip="Previous Difference"
        data-shortcut="Shift+F7"
        onclick={onPrevDiff}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M2 6.5L5 3.5L8 6.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <button
        type="button"
        class="arrow-btn"
        id="btn-next-diff"
        data-tooltip="Next Difference"
        data-shortcut="F7"
        onclick={onNextDiff}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>

    <div class="toolbar-divider"></div>

    {#if !readOnly}
      <button
        type="button"
        class="icon-tool-btn"
        id="btn-tick-all"
        data-tooltip="Tick All Differences in File"
        title="Tick All Differences in File"
        onclick={onTickAll}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
        </svg>
      </button>

      <label class="current-version-label" data-tooltip="Stage / Unstage entire file">
        <span class="studio-chk-wrap">
          <input
            type="checkbox"
            id="chk-master-version"
            checked={isMasterChecked}
            indeterminate={isMasterIndeterminate}
            onchange={onToggleMasterStage}
          />
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
    {/if}

    <button
      type="button"
      class="icon-tool-btn"
      id="btn-open-file"
      data-tooltip="Jump to Source / Open in Editor"
      data-shortcut="F4"
      onclick={onOpenFile}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M3.5 10.5L10.5 3.5M10.5 3.5H5.5M10.5 3.5V8.5" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>

    {#if !readOnly}
      <button
        type="button"
        class="icon-tool-btn"
        id="btn-rollback-all"
        data-tooltip="Rollback All Changes in File"
        data-shortcut="Ctrl+Alt+Z"
        onclick={onRollbackAll}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M4 2.5L1.5 5L4 7.5" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M2 5H7.75C9.8 5 11.5 6.7 11.5 8.75C11.5 10.8 9.8 12.5 7.75 12.5H3.5" stroke="currentColor" stroke-width="1.25" stroke-linecap="round"/>
        </svg>
      </button>
    {/if}

    <div class="toolbar-divider"></div>

    <button
      type="button"
      class={`icon-tool-btn ${!hasPrev ? "disabled" : ""}`}
      id="btn-prev-file"
      data-tooltip="Previous File"
      data-shortcut="Alt+Left"
      disabled={!hasPrev}
      onclick={onPrevFile}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M8.5 3.5L5 7L8.5 10.5" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>

    <button
      type="button"
      class={`icon-tool-btn ${!hasNext ? "disabled" : ""}`}
      id="btn-next-file"
      data-tooltip="Next File"
      data-shortcut="Alt+Right"
      disabled={!hasNext}
      onclick={onNextFile}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M5.5 3.5L9 7L5.5 10.5" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>

    <button
      type="button"
      class="icon-tool-btn"
      id="btn-refresh"
      data-tooltip="Refresh"
      data-shortcut="Cmd+R"
      onclick={onRefresh}
    >
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <path d="M3 8C3 5.24 5.24 3 8 3C9.8 3 11.38 3.96 12.25 5.4M13 8C13 10.76 10.76 13 8 13C6.2 13 4.62 12.04 3.75 10.6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
        <path d="M12.5 2.5V5.5H9.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M3.5 13.5V10.5H6.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  </div>
</div>
