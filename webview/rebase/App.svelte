<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import CommitRow from "./CommitRow.svelte";
  import RebaseControls from "./RebaseControls.svelte";
  import { onMessage, postMessage } from "$shared/vscodeApi";

  interface RebaseItem {
    hash: string;
    abbreviatedHash?: string;
    subject: string;
    author: string;
    authorDate?: string;
    action: "pick" | "reword" | "edit" | "squash" | "fixup" | "drop";
    newMessage?: string;
    squashedMessages?: string[];
  }

  let items = $state<RebaseItem[]>([]);
  let loading = $state(true);
  let rebasing = $state(false);
  let error = $state<string | null>(null);
  let baseHash = $state("");
  let currentBranch = $state("");

  let selectedIndex = $state<number>(0);
  let dragIndex = $state<number | null>(null);
  let dropTargetIndex = $state<number | null>(null);
  let dropPosition = $state<"top" | "bottom" | null>(null);

  // Squash Modal state
  let isSquashModalOpen = $state(false);
  let editingSquashIndex = $state<number | null>(null);
  let squashModalText = $state("");

  let unsubscribe: (() => void) | undefined;

  onMount(() => {
    unsubscribe = onMessage((msg: any) => {
      switch (msg.type) {
        case "commits": {
          const data = msg.payload;
          const rawCommits = Array.isArray(data) ? data : data?.commits || [];
          baseHash = Array.isArray(data) ? "" : data?.baseHash || "";
          currentBranch = Array.isArray(data) ? "" : data?.currentBranch || "";
          items = (rawCommits || []).map((c: any) => ({
            ...c,
            action: "pick" as const,
            newMessage: c.subject
          }));
          selectedIndex = 0;
          loading = false;
          break;
        }
        case "rebaseStarted":
          rebasing = true;
          error = null;
          break;
        case "rebaseError":
          rebasing = false;
          error = msg.payload;
          break;
      }
    });

    window.addEventListener("keydown", handleKeyDown);
  });

  onDestroy(() => {
    unsubscribe?.();
    window.removeEventListener("keydown", handleKeyDown);
  });

  function handleKeyDown(e: KeyboardEvent) {
    if (isSquashModalOpen) return;

    const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
    if (targetTag === "input" || targetTag === "textarea" || targetTag === "select") {
      return;
    }

    // Moving commits up/down with Alt+Shift+Up/Down or Ctrl+Up/Down
    if ((e.altKey && e.shiftKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) ||
        (e.ctrlKey && (e.key === "ArrowUp" || e.key === "ArrowDown"))) {
      e.preventDefault();
      moveItem(selectedIndex, e.key === "ArrowUp" ? -1 : 1);
      return;
    }

    // Navigation with Arrow keys
    if (e.key === "ArrowUp") {
      e.preventDefault();
      selectedIndex = Math.max(0, selectedIndex - 1);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      selectedIndex = Math.min(items.length - 1, selectedIndex + 1);
      return;
    }

    // Rebase Action Hotkeys (matching IntelliJ IDEA)
    const key = e.key.toLowerCase();
    switch (key) {
      case "p":
        e.preventDefault();
        onChangeAction(selectedIndex, "pick");
        break;
      case "r":
        e.preventDefault();
        onChangeAction(selectedIndex, "reword");
        break;
      case "e":
        e.preventDefault();
        onChangeAction(selectedIndex, "edit");
        break;
      case "s":
        e.preventDefault();
        onSquash(selectedIndex);
        break;
      case "f":
        e.preventDefault();
        onChangeAction(selectedIndex, "fixup");
        break;
      case "d":
        e.preventDefault();
        onChangeAction(selectedIndex, "drop");
        break;
    }
  }

  function moveItem(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const moved = items[index];
    const newItems = [...items];
    newItems.splice(index, 1);
    newItems.splice(target, 0, moved);
    items = newItems;
    selectedIndex = target;
  }

  function onChangeAction(index: number, action: any) {
    if (action === "squash") {
      onSquash(index);
    } else {
      items[index].action = action;
    }
  }

  function onSquash(index: number) {
    if (index === 0) {
      error = "Cannot squash the first commit (no preceding commit to squash into).";
      return;
    }
    error = null;
    items[index].action = "squash";

    // Combine squash message with preceding non-drop commit
    let targetParentIndex = -1;
    for (let i = index - 1; i >= 0; i--) {
      if (items[i].action !== "drop") {
        targetParentIndex = i;
        break;
      }
    }

    if (targetParentIndex !== -1) {
      const parent = items[targetParentIndex];
      const combined = `${parent.newMessage || parent.subject}\n\n# Squashed commit:\n${items[index].subject}`;
      items[index].newMessage = combined;
    }
  }

  function openSquashEditor(index: number) {
    editingSquashIndex = index;
    squashModalText = items[index].newMessage || items[index].subject;
    isSquashModalOpen = true;
  }

  function saveSquashModal() {
    if (editingSquashIndex !== null && editingSquashIndex >= 0 && editingSquashIndex < items.length) {
      items[editingSquashIndex].newMessage = squashModalText;
    }
    isSquashModalOpen = false;
    editingSquashIndex = null;
  }

  function closeSquashModal() {
    isSquashModalOpen = false;
    editingSquashIndex = null;
  }

  function onChangeMessage(index: number, message: string) {
    items[index].newMessage = message;
  }

  function onDragStart(index: number) {
    dragIndex = index;
    selectedIndex = index;
  }

  function onDragOver(e: DragEvent, index: number) {
    e.preventDefault();
    if (dragIndex === null) return;
    dropTargetIndex = index;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    dropPosition = offsetY < rect.height / 2 ? "top" : "bottom";
  }

  function onDragEnd() {
    if (dragIndex !== null && dropTargetIndex !== null && dragIndex !== dropTargetIndex) {
      let targetPos = dropPosition === "bottom" ? dropTargetIndex + 1 : dropTargetIndex;
      if (dragIndex < targetPos) targetPos--;
      const moved = items[dragIndex];
      const newItems = [...items];
      newItems.splice(dragIndex, 1);
      newItems.splice(targetPos, 0, moved);
      items = newItems;
      selectedIndex = targetPos;
    }
    dragIndex = null;
    dropTargetIndex = null;
    dropPosition = null;
  }

  function startRebase() {
    if (items.length > 0 && (items[0].action === "squash" || items[0].action === "fixup")) {
      error = "Cannot squash or fixup the first commit in the rebase list.";
      return;
    }
    const todo = items.map((item) => ({
      action: item.action,
      hash: item.hash,
      message: (item.action === "reword" || item.action === "squash") && item.newMessage ? item.newMessage : item.subject
    }));
    postMessage("startRebase", todo);
  }

  function abort() {
    postMessage("abort");
  }
</script>

<div class="rebase-app">
  <div class="header-banner">
    <div class="title-row">
      <span class="title">Interactive Rebase</span>
      {#if currentBranch}
        <span class="branch-tag">{currentBranch}</span>
      {/if}
    </div>
    {#if baseHash}
      <div class="base-info">
        Rebasing onto: <span class="base-hash">{baseHash.slice(0, 10)}</span>
      </div>
    {/if}
  </div>

  <!-- IntelliJ-style Rebase Action Toolbar -->
  <div class="rebase-toolbar">
    <div class="toolbar-group">
      <button
        class="tb-btn"
        title="Move selected commit up (Alt+Shift+Up)"
        disabled={selectedIndex <= 0}
        onclick={() => moveItem(selectedIndex, -1)}
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 3.5l4.5 5.5h-3v4h-3v-4h-3z"/>
        </svg>
        Up
      </button>
      <button
        class="tb-btn"
        title="Move selected commit down (Alt+Shift+Down)"
        disabled={selectedIndex >= items.length - 1}
        onclick={() => moveItem(selectedIndex, 1)}
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 12.5l-4.5-5.5h3v-4h3v4h3z"/>
        </svg>
        Down
      </button>
    </div>

    <div class="tb-divider"></div>

    <div class="toolbar-group">
      <button class="tb-btn" title="Pick (P)" onclick={() => onChangeAction(selectedIndex, "pick")}>Pick</button>
      <button class="tb-btn" title="Reword message (R)" onclick={() => onChangeAction(selectedIndex, "reword")}>Reword</button>
      <button class="tb-btn" title="Edit commit (E)" onclick={() => onChangeAction(selectedIndex, "edit")}>Edit</button>
      <button class="tb-btn" title="Squash into previous commit (S)" onclick={() => onSquash(selectedIndex)}>Squash</button>
      <button class="tb-btn" title="Fixup discard message (F)" onclick={() => onChangeAction(selectedIndex, "fixup")}>Fixup</button>
      <button class="tb-btn" title="Drop commit (D)" onclick={() => onChangeAction(selectedIndex, "drop")}>Drop</button>
    </div>
  </div>

  {#if loading}
    <div class="loading">Loading commits...</div>
  {:else if items.length === 0}
    <div class="empty">No commits to rebase.</div>
  {:else}
    {#if error}
      <div class="error">{error}</div>
    {/if}

    <div class="commit-list">
      {#each items as item, i (item.hash)}
        <CommitRow
          {item}
          index={i}
          selected={selectedIndex === i}
          dragging={dragIndex === i}
          dropPosition={dropTargetIndex === i ? dropPosition : null}
          onSelect={(idx) => { selectedIndex = idx; }}
          onChangeAction={(action) => onChangeAction(i, action)}
          onChangeMessage={(msg) => onChangeMessage(i, msg)}
          onOpenSquashEditor={(idx) => openSquashEditor(idx)}
          {onDragStart}
          {onDragOver}
          {onDragEnd}
        />
      {/each}
    </div>

    <RebaseControls
      disabled={rebasing}
      {startRebase}
      {abort}
    />
  {/if}
</div>

<!-- Squash Message Editor Modal -->
{#if isSquashModalOpen}
  <div class="modal-backdrop" onclick={closeSquashModal} role="presentation">
    <div class="modal-dialog" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
      <div class="modal-header">
        <span class="modal-title">Edit Combined Squash Commit Message</span>
        <button class="modal-close-btn" onclick={closeSquashModal}>&times;</button>
      </div>
      <div class="modal-body">
        <textarea
          class="squash-textarea"
          bind:value={squashModalText}
          rows="10"
          placeholder="Enter unified commit message..."
        ></textarea>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary" onclick={saveSquashModal}>Save Message</button>
        <button class="btn btn-secondary" onclick={closeSquashModal}>Cancel</button>
      </div>
    </div>
  </div>
{/if}

<style>
:global(body) {
  margin: 0;
  padding: 0;
  font-family: var(--vscode-font-family, system-ui, sans-serif);
  font-size: var(--vscode-font-size, 13px);
  color: var(--vscode-foreground);
  background: var(--vscode-editor-background);
}
.rebase-app {
  padding: 16px;
  max-width: 900px;
  margin: 0 auto;
}
.header-banner {
  margin-bottom: 12px;
}
.title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.title {
  font-size: 1.25em;
  font-weight: 600;
}
.branch-tag {
  background: rgba(87, 171, 90, 0.15);
  color: #57ab5a;
  border: 1px solid rgba(87, 171, 90, 0.4);
  font-size: 11px;
  font-weight: 600;
  padding: 1px 8px;
  border-radius: 4px;
}
.base-info {
  margin-top: 4px;
  font-size: 12px;
  color: var(--vscode-descriptionForeground);
}
.base-hash {
  font-family: var(--vscode-editor-font-family, monospace);
  color: var(--vscode-textLink-foreground, #4fc1ff);
}
.rebase-toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--vscode-sideBarSectionHeader-background, rgba(255, 255, 255, 0.03));
  border: 1px solid var(--vscode-panel-border, #393b40);
  border-radius: 4px;
  padding: 4px 8px;
  margin-bottom: 12px;
  user-select: none;
}
.toolbar-group {
  display: flex;
  align-items: center;
  gap: 4px;
}
.tb-btn {
  background: transparent;
  border: 1px solid transparent;
  color: var(--vscode-foreground);
  padding: 3px 8px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.tb-btn:hover:not(:disabled) {
  background: var(--vscode-list-hoverBackground, rgba(255, 255, 255, 0.08));
}
.tb-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.tb-divider {
  width: 1px;
  height: 16px;
  background: var(--vscode-panel-border, #4e5157);
  margin: 0 4px;
}
.loading, .empty {
  color: var(--vscode-descriptionForeground);
  padding: 20px 0;
}
.error {
  background: rgba(200, 50, 50, 0.15);
  color: var(--vscode-errorForeground, #f48771);
  padding: 8px 12px;
  border-radius: 4px;
  margin-bottom: 12px;
  font-size: 0.9em;
}
.commit-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-bottom: 16px;
}

/* Modal styling */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-dialog {
  background: var(--vscode-editor-background, #1e1e1e);
  border: 1px solid var(--vscode-panel-border, #454545);
  border-radius: 6px;
  width: 580px;
  max-width: 90vw;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--vscode-panel-border, #333333);
}
.modal-title {
  font-weight: 600;
  font-size: 13px;
}
.modal-close-btn {
  background: transparent;
  border: none;
  color: var(--vscode-descriptionForeground);
  font-size: 18px;
  cursor: pointer;
  line-height: 1;
}
.modal-close-btn:hover {
  color: var(--vscode-foreground);
}
.modal-body {
  padding: 16px;
}
.squash-textarea {
  width: 100%;
  box-sizing: border-box;
  background: var(--vscode-input-background);
  color: var(--vscode-input-foreground);
  border: 1px solid var(--vscode-input-border, transparent);
  border-radius: 4px;
  padding: 8px;
  font-family: var(--vscode-editor-font-family, monospace);
  font-size: 12px;
  resize: vertical;
  outline: none;
}
.squash-textarea:focus {
  border-color: var(--vscode-focusBorder);
}
.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid var(--vscode-panel-border, #333333);
}
.btn {
  padding: 5px 14px;
  border-radius: 3px;
  font-size: 12px;
  cursor: pointer;
  border: none;
}
.btn-primary {
  background: var(--vscode-button-background);
  color: var(--vscode-button-foreground);
}
.btn-primary:hover {
  background: var(--vscode-button-hoverBackground);
}
.btn-secondary {
  background: var(--vscode-button-secondaryBackground);
  color: var(--vscode-button-secondaryForeground);
}
.btn-secondary:hover {
  background: var(--vscode-button-secondaryHoverBackground);
}
</style>
