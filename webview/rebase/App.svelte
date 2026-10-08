<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import CommitRow from "./CommitRow.svelte";
  import RebaseControls from "./RebaseControls.svelte";
  import { onMessage, postMessage } from "$shared/vscodeApi";

  let items = $state<any[]>([]);
  let loading = $state(true);
  let rebasing = $state(false);
  let error = $state<string | null>(null);
  let dragIndex = $state<number | null>(null);
  let unsubscribe: (() => void) | undefined;

  onMount(() => {
    unsubscribe = onMessage((msg: any) => {
      switch (msg.type) {
        case "commits": {
          const commits = msg.payload;
          items = (commits || []).map((c: any) => ({ ...c, action: "pick" }));
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
  });

  onDestroy(() => unsubscribe?.());

  function onChangeAction(index: number, action: string) {
    items[index].action = action;
  }

  function onChangeMessage(index: number, message: string) {
    items[index].newMessage = message;
  }

  function onDragStart(index: number) {
    dragIndex = index;
  }

  function onDragOver(e: DragEvent, index: number) {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    const dragged = items[dragIndex];
    const newItems = [...items];
    newItems.splice(dragIndex, 1);
    newItems.splice(index, 0, dragged);
    items = newItems;
    dragIndex = index;
  }

  function onDragEnd() {
    dragIndex = null;
  }

  function startRebase() {
    const todo = items.map((item) => ({
      action: item.action,
      hash: item.hash,
      message: item.action === "reword" && item.newMessage ? item.newMessage : item.subject
    }));
    postMessage("startRebase", todo);
  }

  function abort() {
    postMessage("abort");
  }
</script>

<div class="rebase-app">
  <div class="title">Interactive Rebase</div>

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
          dragging={dragIndex === i}
          onChangeAction={(action) => onChangeAction(i, action)}
          onChangeMessage={(msg) => onChangeMessage(i, msg)}
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
.title {
  font-size: 1.3em;
  font-weight: 600;
  margin-bottom: 16px;
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
  gap: 2px;
  margin-bottom: 16px;
}
</style>
