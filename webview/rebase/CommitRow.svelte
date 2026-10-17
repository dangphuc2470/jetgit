<script lang="ts">
  interface Props {
    item: any;
    index: number;
    selected: boolean;
    dragging: boolean;
    dropPosition?: 'top' | 'bottom' | null;
    onSelect: (index: number) => void;
    onChangeAction: (action: string) => void;
    onChangeMessage: (msg: string) => void;
    onOpenSquashEditor?: (index: number) => void;
    onDragStart: (index: number) => void;
    onDragOver: (e: DragEvent, index: number) => void;
    onDragEnd: () => void;
  }

  let {
    item,
    index,
    selected = false,
    dragging = false,
    dropPosition = null,
    onSelect,
    onChangeAction,
    onChangeMessage,
    onOpenSquashEditor,
    onDragStart,
    onDragOver,
    onDragEnd
  }: Props = $props();

  const ACTIONS = ["pick", "reword", "edit", "squash", "fixup", "drop"] as const;

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
  class:selected={selected}
  class:dragging={dragging}
  class:dropped={item.action === "drop"}
  class:drop-top={dropPosition === "top"}
  class:drop-bottom={dropPosition === "bottom"}
  draggable="true"
  role="row"
  tabindex="0"
  onclick={() => onSelect(index)}
  onkeydown={(e) => { if (e.key === 'Enter') onSelect(index); }}
  ondragstart={handleDragStart}
  ondragover={handleDragOver}
  ondragend={onDragEnd}
>
  <span class="drag-handle" title="Drag to reorder">&#x2630;</span>

  <select
    class="action-select"
    style:color={actionColor(item.action)}
    value={item.action}
    onclick={(e) => e.stopPropagation()}
    onchange={(e) => onChangeAction((e.currentTarget as HTMLSelectElement).value)}
  >
    {#each ACTIONS as action}
      <option value={action}>{action}</option>
    {/each}
  </select>

  <span class="hash">{item.abbreviatedHash || (item.hash ? item.hash.slice(0, 7) : '')}</span>

  {#if item.action === "reword"}
    <input
      class="message-input"
      type="text"
      value={item.newMessage ?? item.subject}
      placeholder={item.subject}
      onclick={(e) => e.stopPropagation()}
      oninput={(e) => onChangeMessage((e.currentTarget as HTMLInputElement).value)}
    />
  {:else if item.action === "squash"}
    <div class="squash-message-container">
      <span class="subject squash-subject">
        {item.newMessage ?? item.subject}
      </span>
      {#if onOpenSquashEditor}
        <button
          class="btn-edit-squash"
          title="Edit Combined Squash Message"
          onclick={(e) => { e.stopPropagation(); onOpenSquashEditor(index); }}
        >
          Edit Message
        </button>
      {/if}
    </div>
  {:else}
    <span class="subject" class:strike={item.action === "drop"}>
      {item.newMessage ?? item.subject}
    </span>
  {/if}

  <span class="author">{item.author}</span>
</div>

<style>
.commit-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 8px;
  background: var(--vscode-editor-background);
  border: 1px solid var(--vscode-panel-border, transparent);
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.1s, opacity 0.15s;
  box-sizing: border-box;
  user-select: none;
}
.commit-row:hover:not(.selected) {
  background: var(--vscode-list-hoverBackground, rgba(255, 255, 255, 0.04));
}
.commit-row.selected {
  background: var(--vscode-list-activeSelectionBackground, #094771) !important;
  color: var(--vscode-list-activeSelectionForeground, #ffffff) !important;
  border-color: var(--vscode-focusBorder, #007fd4);
}
.commit-row.dragging {
  opacity: 0.4;
}
.commit-row.dropped {
  opacity: 0.5;
}
.commit-row.drop-top {
  border-top: 2px solid var(--vscode-focusBorder, #007fd4) !important;
}
.commit-row.drop-bottom {
  border-bottom: 2px solid var(--vscode-focusBorder, #007fd4) !important;
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
  font-weight: 600;
  flex-shrink: 0;
  width: 82px;
  cursor: pointer;
}
.hash {
  font-family: var(--vscode-editor-font-family, monospace);
  font-size: 0.9em;
  color: var(--vscode-textLink-foreground, #4fc1ff);
  flex-shrink: 0;
  width: 65px;
}
.commit-row.selected .hash {
  color: var(--vscode-list-activeSelectionForeground, #ffffff);
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
.squash-message-container {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
}
.squash-subject {
  color: #c586c0;
}
.btn-edit-squash {
  background: rgba(197, 134, 192, 0.15);
  border: 1px solid rgba(197, 134, 192, 0.4);
  color: #c586c0;
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 3px;
  cursor: pointer;
  flex-shrink: 0;
}
.btn-edit-squash:hover {
  background: rgba(197, 134, 192, 0.25);
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
  width: 110px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: right;
}
.commit-row.selected .author {
  color: var(--vscode-list-activeSelectionForeground, #ffffff);
}
</style>
