<script lang="ts">
  interface Props {
    disabled: boolean;
    startRebase: () => void;
    abort: () => void;
  }

  let { disabled = false, startRebase, abort }: Props = $props();
</script>

<div class="controls">
  <button class="btn primary" {disabled} onclick={startRebase}>
    {disabled ? "Rebasing..." : "Start Rebase"}
  </button>
  <button class="btn secondary" onclick={abort}>Cancel</button>
</div>

<style>
.controls {
  display: flex;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--vscode-panel-border);
}
.btn {
  padding: 6px 16px;
  border: none;
  border-radius: 3px;
  font-size: inherit;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 0;
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.primary {
  background: var(--vscode-button-background);
  color: var(--vscode-button-foreground);
}
.primary:hover:not(:disabled) {
  background: var(--vscode-button-hoverBackground);
}
.secondary {
  background: var(--vscode-button-secondaryBackground);
  color: var(--vscode-button-secondaryForeground);
}
.secondary:hover {
  background: var(--vscode-button-secondaryHoverBackground);
}
</style>
