<script lang="ts">
  import type { TaskItem } from "$shared/protocol";

  interface Props {
    tasks: TaskItem[];
    onCancelTask: (id: string) => void;
    onDismissTask: (id: string) => void;
    onClearFinished: () => void;
  }

  let { tasks = [], onCancelTask, onDismissTask, onClearFinished }: Props = $props();

  let isExpanded = $state(false);

  let runningTasks = $derived(tasks.filter((t) => t.status === "running"));
  let finishedTasks = $derived(tasks.filter((t) => t.status !== "running"));
  let primaryTask = $derived(runningTasks[0] || tasks[0] || null);

  let hasVisibleTasks = $derived(tasks.length > 0);

  // Auto-dismiss completed/cancelled tasks if all are idle and not expanded
  let autoDismissTimer: any = null;
  $effect(() => {
    if (autoDismissTimer) clearTimeout(autoDismissTimer);
    if (!isExpanded && runningTasks.length === 0 && tasks.length > 0) {
      autoDismissTimer = setTimeout(() => {
        onClearFinished();
      }, 6000);
    }
    return () => {
      if (autoDismissTimer) clearTimeout(autoDismissTimer);
    };
  });

  function formatElapsed(task: TaskItem): string {
    const end = task.endTime || Date.now();
    const diff = Math.max(0, Math.floor((end - task.startTime) / 1000));
    if (diff < 1) return "just now";
    if (diff < 60) return `${diff}s`;
    const mins = Math.floor(diff / 60);
    const secs = diff % 60;
    return `${mins}m ${secs}s`;
  }
</script>

{#if hasVisibleTasks}
  <!-- Expanded Tasks Popup Drawer -->
  {#if isExpanded}
    <!-- Backdrop to close drawer when clicking outside -->
    <button
      type="button"
      class="task-drawer-backdrop"
      onclick={() => (isExpanded = false)}
      aria-label="Close task drawer"
    ></button>

    <div class="task-drawer" role="region" aria-label="Background Tasks">
      <div class="task-drawer-header">
        <div class="task-drawer-title">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" class="task-drawer-title-icon">
            <path d="M8 1.5V3.5M8 12.5V14.5M3.5 8H1.5M14.5 8H12.5M12.6 3.4L11.2 4.8M4.8 11.2L3.4 12.6M12.6 12.6L11.2 11.2M4.8 4.8L3.4 3.4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
          </svg>
          <span>Background Tasks</span>
          <span class="task-drawer-count">
            ({runningTasks.length} running{finishedTasks.length > 0 ? `, ${finishedTasks.length} finished` : ""})
          </span>
        </div>
        <div class="task-drawer-actions">
          {#if finishedTasks.length > 0}
            <button
              class="task-drawer-btn"
              title="Clear finished tasks"
              onclick={() => onClearFinished()}
            >
              Clear Finished
            </button>
          {/if}
          <button
            class="task-drawer-btn icon-only"
            title="Collapse drawer"
            onclick={() => (isExpanded = false)}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="task-list">
        {#each tasks as task (task.id)}
          <div class="task-item" class:running={task.status === "running"} class:failed={task.status === "failed"}>
            <div class="task-status-col">
              {#if task.status === "running"}
                <div class="task-spinner" title="Running..."></div>
              {:else if task.status === "completed"}
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" class="status-icon success" title="Completed">
                  <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="#73c991" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              {:else if task.status === "failed"}
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" class="status-icon failed" title="Failed">
                  <circle cx="8" cy="8" r="6.5" stroke="#f14c4c" stroke-width="1.3"/>
                  <path d="M5.5 5.5L10.5 10.5M10.5 5.5L5.5 10.5" stroke="#f14c4c" stroke-width="1.3" stroke-linecap="round"/>
                </svg>
              {:else if task.status === "cancelled"}
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" class="status-icon cancelled" title="Stopped">
                  <circle cx="8" cy="8" r="6.5" stroke="#8c8c8c" stroke-width="1.3"/>
                  <path d="M5.5 8H10.5" stroke="#8c8c8c" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
              {/if}
            </div>

            <div class="task-content-col">
              <div class="task-row-top">
                <span class="task-title" title={task.title}>{task.title}</span>
                <span class="task-time">{formatElapsed(task)}</span>
              </div>
              {#if task.detail}
                <div class="task-detail" class:error-text={task.status === "failed"} title={task.detail}>
                  {task.detail}
                </div>
              {/if}
            </div>

            <div class="task-action-col">
              {#if task.status === "running" && task.canCancel}
                <button
                  class="task-stop-btn"
                  title="Stop task (Dừng tác vụ)"
                  onclick={() => onCancelTask(task.id)}
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path
                      fill-rule="evenodd"
                      clip-rule="evenodd"
                      d="M8 1.5C4.41015 1.5 1.5 4.41015 1.5 8C1.5 11.5899 4.41015 14.5 8 14.5C11.5899 14.5 14.5 11.5899 14.5 8C14.5 4.41015 11.5899 1.5 8 1.5ZM8 7L9.9 5.1L10.9 6.1L9 8L10.9 9.9L9.9 10.9L8 9L6.1 10.9L5.1 9.9L7 8L5.1 6.1L6.1 5.1L8 7Z"
                      fill="currentColor"
                    />
                  </svg>
                </button>
              {:else}
                <button
                  class="task-dismiss-btn"
                  title="Dismiss (Bỏ qua)"
                  onclick={() => onDismissTask(task.id)}
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path
                      fill-rule="evenodd"
                      clip-rule="evenodd"
                      d="M8 1.5C4.41015 1.5 1.5 4.41015 1.5 8C1.5 11.5899 4.41015 14.5 8 14.5C11.5899 14.5 14.5 11.5899 14.5 8C14.5 4.41015 11.5899 1.5 8 1.5ZM8 7L9.9 5.1L10.9 6.1L9 8L10.9 9.9L9.9 10.9L8 9L6.1 10.9L5.1 9.9L7 8L5.1 6.1L6.1 5.1L8 7Z"
                      fill="currentColor"
                    />
                  </svg>
                </button>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Collapsed Bottom Status Strip (Aligned at the end / right side) -->
  <div class="task-status-bar" role="toolbar" aria-label="Git Status Bar">
    <div class="task-status-cluster">
      <button
        type="button"
        class="task-summary-btn"
        onclick={() => (isExpanded = !isExpanded)}
        title="Click to view all background tasks"
      >
        {#if primaryTask}
          {#if primaryTask.status === "running"}
            <div class="task-spinner mini" title="Running..."></div>
          {:else if primaryTask.status === "completed"}
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" class="status-icon success">
              <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="#73c991" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          {:else if primaryTask.status === "failed"}
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" class="status-icon failed">
              <circle cx="8" cy="8" r="6" stroke="#f14c4c" stroke-width="1.3"/>
              <path d="M5.5 5.5L10.5 10.5M10.5 5.5L5.5 10.5" stroke="#f14c4c" stroke-width="1.3" stroke-linecap="round"/>
            </svg>
          {:else}
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" class="status-icon cancelled">
              <circle cx="8" cy="8" r="6" stroke="#8c8c8c" stroke-width="1.3"/>
              <path d="M5.5 8H10.5" stroke="#8c8c8c" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          {/if}

          <span class="status-bar-title" title={primaryTask.title}>{primaryTask.title}</span>

          {#if primaryTask.detail}
            <span class="status-bar-detail" class:error-text={primaryTask.status === "failed"} title={primaryTask.detail}>
              - {primaryTask.detail}
            </span>
          {/if}
        {/if}

        {#if runningTasks.length > 1}
          <span class="status-bar-badge" title="{runningTasks.length} tasks running">
            +{runningTasks.length - 1} running
          </span>
        {:else if tasks.length > 1}
          <span class="status-bar-badge muted" title="{tasks.length} total tasks">
            {tasks.length} tasks
          </span>
        {/if}
      </button>

      {#if primaryTask && primaryTask.status === "running" && primaryTask.canCancel}
        <button
          type="button"
          class="status-bar-stop-btn"
          title="Stop task (Dừng tác vụ)"
          onclick={(e) => {
            e.stopPropagation();
            onCancelTask(primaryTask.id);
          }}
          aria-label="Stop task"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M8 1.5C4.41015 1.5 1.5 4.41015 1.5 8C1.5 11.5899 4.41015 14.5 8 14.5C11.5899 14.5 14.5 11.5899 14.5 8C14.5 4.41015 11.5899 1.5 8 1.5ZM8 7L9.9 5.1L10.9 6.1L9 8L10.9 9.9L9.9 10.9L8 9L6.1 10.9L5.1 9.9L7 8L5.1 6.1L6.1 5.1L8 7Z"
              fill="currentColor"
            />
          </svg>
        </button>
      {:else if primaryTask}
        <button
          type="button"
          class="status-bar-stop-btn dismiss"
          title="Dismiss (Bỏ qua)"
          onclick={(e) => {
            e.stopPropagation();
            onDismissTask(primaryTask.id);
          }}
          aria-label="Dismiss task"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M8 1.5C4.41015 1.5 1.5 4.41015 1.5 8C1.5 11.5899 4.41015 14.5 8 14.5C11.5899 14.5 14.5 11.5899 14.5 8C14.5 4.41015 11.5899 1.5 8 1.5ZM8 7L9.9 5.1L10.9 6.1L9 8L10.9 9.9L9.9 10.9L8 9L6.1 10.9L5.1 9.9L7 8L5.1 6.1L6.1 5.1L8 7Z"
              fill="currentColor"
            />
          </svg>
        </button>
      {/if}
    </div>
  </div>
{/if}

<style>
  .task-status-bar {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    height: 25px;
    min-height: 25px;
    background: var(--vscode-statusBar-background, #2b2d30);
    color: var(--vscode-statusBar-foreground, #dfe1e5);
    border-top: 1px solid var(--vscode-panel-border, #393b40);
    padding: 0 8px;
    box-sizing: border-box;
    font-size: 11.5px;
    user-select: none;
    z-index: 100;
    position: relative;
    flex-shrink: 0;
  }

  .task-status-cluster {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    max-width: 100%;
    margin-left: auto;
  }

  .task-summary-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    max-width: 520px;
    overflow: hidden;
    cursor: pointer;
    background: transparent;
    border: none;
    border-radius: 3px;
    padding: 2px 4px;
    margin: 0;
    color: inherit;
    font-family: inherit;
    text-align: left;
    transition: background 0.1s ease;
  }

  .task-summary-btn:hover {
    background: rgba(255, 255, 255, 0.08);
  }

  .task-summary-btn:hover .status-bar-title,
  .task-summary-btn:hover .status-bar-detail {
    color: var(--vscode-foreground, #ffffff);
  }

  .status-bar-title {
    font-size: 11.5px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--vscode-statusBar-foreground, #dfe1e5);
  }

  .status-bar-detail {
    font-size: 11.5px;
    font-weight: 400;
    color: var(--vscode-descriptionForeground, #9da0a8);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .status-bar-detail.error-text {
    color: var(--vscode-errorForeground, #f14c4c);
  }

  .status-bar-badge {
    background: var(--vscode-badge-background, #3574f0);
    color: var(--vscode-badge-foreground, #ffffff);
    padding: 1px 6px;
    border-radius: 9px;
    font-size: 10.5px;
    font-weight: 500;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .status-bar-badge.muted {
    background: rgba(255, 255, 255, 0.12);
    color: var(--vscode-descriptionForeground, #9da0a8);
  }

  .status-bar-stop-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    min-width: 18px;
    padding: 0;
    background: transparent;
    border: none;
    color: var(--vscode-descriptionForeground, #9da0a8);
    border-radius: 3px;
    cursor: pointer;
    outline: none;
    flex-shrink: 0;
    transition: background 0.1s ease, color 0.1s ease;
  }

  .status-bar-stop-btn:hover {
    background: rgba(247, 84, 100, 0.18);
    color: #f75464;
  }

  .status-bar-stop-btn.dismiss:hover {
    background: rgba(255, 255, 255, 0.12);
    color: var(--vscode-foreground, #ffffff);
  }

  /* Spinner */
  .task-spinner {
    width: 14px;
    height: 14px;
    border: 1.8px solid rgba(255, 255, 255, 0.2);
    border-top-color: var(--vscode-progressBar-background, #3574f0);
    border-radius: 50%;
    animation: taskSpin 0.85s linear infinite;
    flex-shrink: 0;
  }

  .task-spinner.mini {
    width: 12px;
    height: 12px;
    border-width: 1.6px;
  }

  @keyframes taskSpin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .status-icon {
    flex-shrink: 0;
  }

  /* Expanded Drawer */
  .task-drawer-backdrop {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 25px;
    background: rgba(0, 0, 0, 0.25);
    border: none;
    padding: 0;
    margin: 0;
    cursor: default;
    z-index: 101;
  }

  .task-drawer {
    position: absolute;
    right: 8px;
    left: auto;
    width: 440px;
    max-width: calc(100% - 16px);
    bottom: 25px;
    max-height: 240px;
    background: var(--vscode-editorWidget-background, #2b2d30);
    color: var(--vscode-foreground, #dfe1e5);
    border: 1px solid var(--vscode-panel-border, #393b40);
    border-radius: 6px 6px 0 0;
    box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.45);
    z-index: 102;
    display: flex;
    flex-direction: column;
    animation: drawerSlideUp 0.16s ease-out;
  }

  @keyframes drawerSlideUp {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .task-drawer-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 12px;
    background: rgba(0, 0, 0, 0.12);
    border-bottom: 1px solid var(--vscode-panel-border, #393b40);
    font-size: 11.5px;
  }

  .task-drawer-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 600;
  }

  .task-drawer-title-icon {
    color: var(--vscode-progressBar-background, #3574f0);
  }

  .task-drawer-count {
    font-weight: normal;
    color: var(--vscode-descriptionForeground, #9da0a8);
    font-size: 11px;
  }

  .task-drawer-actions {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .task-drawer-btn {
    background: transparent;
    border: 1px solid var(--vscode-button-secondaryBorder, rgba(255, 255, 255, 0.14));
    color: var(--vscode-foreground, #dfe1e5);
    border-radius: 3px;
    padding: 2px 8px;
    font-size: 11px;
    cursor: pointer;
    outline: none;
    transition: background 0.1s ease;
  }

  .task-drawer-btn:hover {
    background: rgba(255, 255, 255, 0.08);
  }

  .task-drawer-btn.icon-only {
    padding: 3px 5px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .task-list {
    overflow-y: auto;
    max-height: 200px;
    padding: 4px 0;
  }

  .task-item {
    display: flex;
    align-items: center;
    padding: 6px 12px;
    gap: 10px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    font-size: 12px;
    transition: background 0.08s ease;
  }

  .task-item:hover {
    background: rgba(255, 255, 255, 0.04);
  }

  .task-item:last-child {
    border-bottom: none;
  }

  .task-status-col {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    flex-shrink: 0;
  }

  .task-content-col {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex: 1;
    gap: 2px;
  }

  .task-row-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .task-title {
    font-size: 11.5px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--vscode-foreground, #dfe1e5);
  }

  .task-time {
    font-size: 10.5px;
    color: var(--vscode-descriptionForeground, #9da0a8);
    flex-shrink: 0;
  }

  .task-detail {
    font-size: 11.5px;
    color: var(--vscode-descriptionForeground, #9da0a8);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .task-detail.error-text {
    color: var(--vscode-errorForeground, #f14c4c);
  }

  .task-action-col {
    flex-shrink: 0;
  }

  .task-stop-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    background: transparent;
    border: none;
    color: var(--vscode-descriptionForeground, #9da0a8);
    border-radius: 3px;
    padding: 0;
    cursor: pointer;
    transition: background 0.1s ease, color 0.1s ease;
  }

  .task-stop-btn:hover {
    background: rgba(247, 84, 100, 0.18);
    color: #f75464;
  }

  .task-dismiss-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    color: var(--vscode-descriptionForeground, #9da0a8);
    border-radius: 3px;
    padding: 3px;
    cursor: pointer;
  }

  .task-dismiss-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: var(--vscode-foreground, #dfe1e5);
  }
</style>
