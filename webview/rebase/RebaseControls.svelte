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
  height: 28px;
  padding: 0 14px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 0;
  box-sizing: border-box;
  user-select: none;
  transition: background 0.12s ease, border-color 0.12s ease;
}
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.primary {
  background: var(--vscode-button-background, #3574f0);
  color: var(--vscode-button-foreground, #ffffff);
  border: 1px solid var(--vscode-button-background, #3574f0);
}
.primary:hover:not(:disabled) {
  background: var(--vscode-button-hoverBackground, #3068d9);
  border-color: var(--vscode-button-hoverBackground, #3068d9);
}
.secondary {
  background: var(--vscode-button-secondaryBackground, #2b2d30);
  color: var(--vscode-button-secondaryForeground, #dfe1e5);
  border: 1px solid var(--vscode-widget-border, var(--vscode-input-border, #4e5157));
}
.secondary:hover {
  background: var(--vscode-button-secondaryHoverBackground, #35373c);
}
</style>
