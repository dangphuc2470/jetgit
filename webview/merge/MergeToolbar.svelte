<script lang="ts">
  interface Props {
    filePath: string;
    remainingConflicts: number;
    onPrev: () => void;
    onNext: () => void;
    onApplyNonConflicting: () => void;
    onApply: () => void;
    onCancel: () => void;
  }

  let {
    filePath = "",
    remainingConflicts = 0,
    onPrev,
    onNext,
    onApplyNonConflicting,
    onApply,
    onCancel,
  }: Props = $props();
</script>

<div class="merge-toolbar">
  <div class="tool-group">
    <button class="tool-btn" onclick={onPrev} title="Previous Conflict (Shift+F7)">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M2.5 7.5L6 4L9.5 7.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Prev
    </button>
    <button class="tool-btn" onclick={onNext} title="Next Conflict (F7)">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Next
    </button>
    <div class="divider"></div>
    <button class="tool-btn" onclick={onApplyNonConflicting} title="Apply all non-conflicting changes">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M2 6L4.5 8.5L10 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Apply Non-Conflicting
    </button>
    <div class="divider"></div>
    <span class="status-counter" class:all-resolved={remainingConflicts === 0}>
      {remainingConflicts === 0
        ? "All conflicts resolved"
        : `${remainingConflicts} conflict${remainingConflicts > 1 ? "s" : ""} remaining`}
    </span>
  </div>

  <div class="file-path-title" title={filePath}>{filePath || "Resolving Conflicts"}</div>

  <div class="tool-group">
    <button
      class="action-btn btn-apply"
      onclick={onApply}
      title="Apply merge and stage file (Cmd+Enter / Ctrl+Enter)"
    >
      Apply
    </button>
    <button class="action-btn btn-cancel" onclick={onCancel}>Cancel</button>
  </div>
</div>

<style>
  .merge-toolbar {
    height: 38px;
    background: var(--vscode-sideBarSectionHeader-background, var(--vscode-editorGroupHeader-tabsBackground, #2b2d30));
    border-bottom: 1px solid var(--vscode-panel-border, #393b40);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 12px;
    flex-shrink: 0;
    gap: 12px;
    user-select: none;
  }
  .tool-group {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .tool-btn {
    background: transparent;
    border: 1px solid transparent;
    color: #9aa0a6;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    transition: all 0.12s;
  }
  .tool-btn:hover {
    background: #393b40;
    color: #dfe1e5;
  }
  .tool-btn svg {
    pointer-events: none;
  }
  .divider {
    width: 1px;
    height: 18px;
    background: #4e5157;
    margin: 0 4px;
  }
  .status-counter {
    font-size: 12px;
    font-weight: 500;
    padding: 2px 8px;
    border-radius: 10px;
    background: rgba(229, 165, 10, 0.18);
    color: #e5a50a;
    border: 1px solid rgba(229, 165, 10, 0.35);
  }
  .status-counter.all-resolved {
    background: rgba(46, 160, 67, 0.18);
    color: #3fb950;
    border: 1px solid rgba(46, 160, 67, 0.35);
  }
  .file-path-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--vscode-foreground, #bcbec4);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 400px;
  }
  .action-btn {
    padding: 5px 14px;
    font-size: 12px;
    font-weight: 500;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.15s ease;
    outline: none;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex-shrink: 0;
  }
  .action-btn.btn-apply {
    background: #3574f0;
    color: #ffffff;
    border: 1px solid #3574f0;
  }
  .action-btn.btn-apply:hover {
    background: #3068d9;
  }
  .action-btn.btn-cancel {
    background: transparent;
    color: #bcbec4;
    border: 1px solid #4e5157;
  }
  .action-btn.btn-cancel:hover {
    background: #393b40;
    color: #ffffff;
  }
</style>
