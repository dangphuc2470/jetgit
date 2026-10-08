<script lang="ts">
  interface Props {
    item: any;
    index: number;
    dragging: boolean;
    onChangeAction: (action: string) => void;
    onChangeMessage: (msg: string) => void;
    onDragStart: (index: number) => void;
    onDragOver: (e: DragEvent, index: number) => void;
    onDragEnd: () => void;
  }

  let {
    item,
    index,
    dragging = false,
    onChangeAction,
    onChangeMessage,
    onDragStart,
    onDragOver,
    onDragEnd
  }: Props = $props();

  const ACTIONS = ["pick", "reword", "edit", "squash", "fixup", "drop"];

  function actionColor(action: string) {
    switch (action) {
      case "pick":
        return "var(--vscode-foreground)";
      case "reword":
        return "#569cd6";
      case "edit":
        return "#dcdcaa";
      case "squash":
        return "#c586c0";
      case "fixup":
        return "#4ec9b0";
      case "drop":
        return "#d16969";
      default:
        return "inherit";
    }
  }

  function handleDragStart(e: DragEvent) {
    e.dataTransfer?.setData("text/plain", String(index));
    onDragStart(index);
  }

  function handleDragOver(e: DragEvent) {
    onDragOver(e, index);
  }
</script>

<div
  class="commit-row"
  class:dragging={dragging}
  class:dropped={item.action === "drop"}
  draggable="true"
  role="row"
  ondragstart={handleDragStart}
  ondragover={handleDragOver}
  ondragend={onDragEnd}
>
  <span class="drag-handle" title="Drag to reorder">&#x2630;</span>

  <select
    class="action-select"
    style:color={actionColor(item.action)}
    value={item.action}
    onchange={(e) => onChangeAction((e.currentTarget as HTMLSelectElement).value)}
  >
    {#each ACTIONS as action}
      <option value={action}>{action}</option>
    {/each}
  </select>

  <span class="hash">{item.abbreviatedHash}</span>

  {#if item.action === "reword"}
    <input
      class="message-input"
      type="text"
      value={item.newMessage ?? item.subject}
      placeholder={item.subject}
      oninput={(e) => onChangeMessage((e.currentTarget as HTMLInputElement).value)}
    />
  {:else}
    <span class="subject" class:strike={item.action === "drop"}>
      {item.subject}
    </span>
  {/if}

  <span class="author">{item.author}</span>
</div>

<style>
.commit-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: var(--vscode-editor-background);
  border: 1px solid var(--vscode-panel-border, transparent);
  border-radius: 3px;
  cursor: grab;
  transition: opacity 0.15s;
}
.commit-row.dragging {
  opacity: 0.5;
}
.commit-row.dropped {
  opacity: 0.5;
}
.drag-handle {
  color: var(--vscode-descriptionForeground);
  cursor: grab;
  font-size: 0.9em;
  flex-shrink: 0;
  user-select: none;
}
.action-select {
  background: var(--vscode-dropdown-background);
  color: var(--vscode-dropdown-foreground);
  border: 1px solid var(--vscode-dropdown-border, transparent);
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 0.9em;
  flex-shrink: 0;
  width: 80px;
  cursor: pointer;
}
.hash {
  font-family: var(--vscode-editor-font-family, monospace);
  font-size: 0.9em;
  color: var(--vscode-textLink-foreground);
  flex-shrink: 0;
  width: 60px;
}
.subject {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.subject.strike {
  text-decoration: line-through;
  color: var(--vscode-descriptionForeground);
}
.message-input {
  flex: 1;
  background: var(--vscode-input-background);
  color: var(--vscode-input-foreground);
  border: 1px solid var(--vscode-input-border, transparent);
  padding: 2px 6px;
  border-radius: 3px;
  font-size: inherit;
  outline: none;
}
.message-input:focus {
  border-color: var(--vscode-focusBorder);
}
.author {
  color: var(--vscode-descriptionForeground);
  font-size: 0.85em;
  flex-shrink: 0;
  width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
