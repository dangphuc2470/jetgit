<script lang="ts">
  import { onMount } from "svelte";
  import { postMessage, onMessage } from "$shared/vscodeApi";
  import { getFileIcon } from "$shared/fileIcons";

  interface ConflictFile {
    name: string;
    path: string;
    dir?: string;
    yours: string;
    theirs: string;
  }

  interface ConflictInfo {
    hasConflicts?: boolean;
    yoursBranch?: string;
    theirsBranch?: string;
    conflicts?: ConflictFile[];
  }

  let conflictInfo = $state<ConflictInfo>({});
  let selectedPath = $state<string | null>(null);
  let groupByDir = $state(false);

  const conflicts = $derived<ConflictFile[]>(conflictInfo?.conflicts || []);
  const yoursBranch = $derived(conflictInfo?.yoursBranch || "HEAD");
  const theirsBranch = $derived(conflictInfo?.theirsBranch || "MERGE_HEAD");

  $effect(() => {
    if (conflicts.length > 0) {
      if (!selectedPath || !conflicts.some((c) => c.path === selectedPath)) {
        selectedPath = conflicts[0].path;
      }
    } else {
      selectedPath = null;
    }
  });

  const groupedConflicts = $derived.by(() => {
    if (!groupByDir) return [];
    const map = new Map<string, ConflictFile[]>();
    for (const file of conflicts) {
      const d = file.dir || "root";
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(file);
    }
    return Array.from(map.entries()).map(([dir, files]) => ({ dir, files }));
  });

  function doMerge() {
    if (!selectedPath) return;
    postMessage("openMergeEditor", { path: selectedPath });
  }

  function doAcceptYours() {
    if (!selectedPath) return;
    postMessage("acceptYours", { path: selectedPath });
  }

  function doAcceptTheirs() {
    if (!selectedPath) return;
    postMessage("acceptTheirs", { path: selectedPath });
  }

  function closeDialog() {
    postMessage("close");
  }

  onMount(() => {
    const unsubscribe = onMessage((msg: any) => {
      if (msg.type === "updateConflictInfo") {
        conflictInfo = msg.payload || {};
      }
    });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeDialog();
      } else if (e.key === "Enter") {
        doMerge();
      } else if (e.key === "ArrowDown") {
        if (conflicts.length === 0) return;
        const idx = conflicts.findIndex((c) => c.path === selectedPath);
        if (idx < conflicts.length - 1) {
          selectedPath = conflicts[idx + 1].path;
          e.preventDefault();
        }
      } else if (e.key === "ArrowUp") {
        if (conflicts.length === 0) return;
        const idx = conflicts.findIndex((c) => c.path === selectedPath);
        if (idx > 0) {
          selectedPath = conflicts[idx - 1].path;
          e.preventDefault();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);

    postMessage("ready");

    return () => {
      unsubscribe();
      window.removeEventListener("keydown", onKeyDown);
    };
  });
</script>

<div class="as-dialog-container">
  <div class="as-banner">
    The following files have unresolved conflicts. You need to resolve them before continuing.
  </div>

  <div class="as-content-area">
    <div class="as-table-box">
      <div class="as-table-header">
        <div class="as-col-name">Name</div>
        <div class="as-col-yours">Yours ({yoursBranch})</div>
        <div class="as-col-theirs">Theirs ({theirsBranch})</div>
      </div>

      <div class="as-table-body">
        {#if conflicts.length === 0}
          <div class="as-empty-state">
            All conflicts have been resolved!
          </div>
        {:else if !groupByDir}
          {#each conflicts as file (file.path)}
            {@const isSelected = file.path === selectedPath}
            <div
              class="as-conflict-row"
              class:selected={isSelected}
              onclick={() => (selectedPath = file.path)}
              ondblclick={doMerge}
              role="row"
              tabindex="0"
              onkeydown={(e) => { if (e.key === 'Enter') doMerge(); }}
            >
              <div class="as-col-name">
                <span class="file-icon">{@html getFileIcon(file.name)}</span>
                <span class="file-name" class:selected={isSelected}>{file.name}</span>
                {#if file.dir}
                  <span class="file-dir" class:selected={isSelected}>{file.dir}</span>
                {/if}
              </div>
              <div class="as-col-yours" class:selected={isSelected}>{file.yours}</div>
              <div class="as-col-theirs" class:selected={isSelected}>{file.theirs}</div>
            </div>
          {/each}
        {:else}
          {#each groupedConflicts as group (group.dir)}
            <div class="as-dir-group-header">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                <path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h3.879a1.5 1.5 0 0 1 1.06.44l1.122 1.12A.5.5 0 0 0 8.92 4H13.5A1.5 1.5 0 0 1 15 5.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 12.5v-9z"/>
              </svg>
              <span>{group.dir}</span>
            </div>
            {#each group.files as file (file.path)}
              {@const isSelected = file.path === selectedPath}
              <div
                class="as-conflict-row grouped"
                class:selected={isSelected}
                onclick={() => (selectedPath = file.path)}
                ondblclick={doMerge}
                role="row"
                tabindex="0"
                onkeydown={(e) => { if (e.key === 'Enter') doMerge(); }}
              >
                <div class="as-col-name">
                  <span class="file-icon">{@html getFileIcon(file.name)}</span>
                  <span class="file-name" class:selected={isSelected}>{file.name}</span>
                  {#if file.dir}
                    <span class="file-dir" class:selected={isSelected}>{file.dir}</span>
                  {/if}
                </div>
                <div class="as-col-yours" class:selected={isSelected}>{file.yours}</div>
                <div class="as-col-theirs" class:selected={isSelected}>{file.theirs}</div>
              </div>
            {/each}
          {/each}
        {/if}
      </div>
    </div>

    <div class="as-action-panel">
      <button class="as-btn" disabled={!selectedPath} onclick={doAcceptYours}>
        Accept Yours
      </button>
      <button class="as-btn" disabled={!selectedPath} onclick={doAcceptTheirs}>
        Accept Theirs
      </button>
      <button class="as-btn-primary" disabled={!selectedPath} onclick={doMerge}>
        Merge...
      </button>
    </div>
  </div>

  <div class="as-footer">
    <label class="as-group-label">
      <input type="checkbox" bind:checked={groupByDir} class="as-checkbox" />
      <span>Group files by directory</span>
    </label>
    <button class="as-btn as-btn-close" onclick={closeDialog}>Close</button>
  </div>
</div>

<style>
  :global(*) {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  :global(html, body) {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: var(--vscode-editor-background, #1e1f22);
    color: var(--vscode-editor-foreground, #dfe1e5);
    font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif);
    font-size: var(--vscode-font-size, 13px);
    user-select: none;
  }

  .as-dialog-container {
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--vscode-editor-background, #1e1f22);
  }

  .as-banner {
    padding: 14px 20px 10px;
    font-size: 13px;
    color: var(--vscode-editor-foreground, #dfe1e5);
    flex-shrink: 0;
  }

  .as-content-area {
    display: flex;
    flex: 1;
    min-height: 0;
    padding: 0 20px 14px;
    gap: 16px;
  }

  .as-table-box {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    border: 1px solid var(--vscode-panel-border, #43454a);
    border-radius: 4px;
    background: var(--vscode-editor-background, #1e1f22);
    overflow: hidden;
  }

  .as-table-header {
    display: flex;
    background: var(--vscode-sideBarSectionHeader-background, var(--vscode-sideBar-background, #2b2d30));
    border-bottom: 1px solid var(--vscode-panel-border, #3c3f41);
    padding: 7px 12px;
    font-size: 12px;
    font-weight: 600;
    color: var(--vscode-descriptionForeground, #9aa0a6);
    flex-shrink: 0;
  }

  .as-col-name {
    flex: 2;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .file-icon {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
  }

  .file-name {
    font-weight: 500;
    color: #e06c75;
    flex-shrink: 0;
  }

  .file-name.selected {
    color: inherit;
  }

  .file-dir {
    font-size: 11.5px;
    color: var(--vscode-descriptionForeground, #808080);
    margin-left: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .file-dir.selected {
    color: inherit;
    opacity: 0.85;
  }

  .as-col-yours,
  .as-col-theirs {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--vscode-editor-foreground, #dfe1e5);
  }

  .as-col-yours.selected,
  .as-col-theirs.selected {
    color: inherit;
  }

  .as-table-body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }

  .as-empty-state {
    padding: 40px;
    text-align: center;
    color: var(--vscode-descriptionForeground, #808080);
    font-size: 13px;
  }

  .as-conflict-row {
    display: flex;
    align-items: center;
    padding: 6px 12px;
    font-size: 12.5px;
    cursor: pointer;
    user-select: none;
    transition: background 0.1s;
    outline: none;
  }

  .as-conflict-row.grouped {
    padding-left: 24px;
  }

  .as-conflict-row:hover {
    background: var(--vscode-list-hoverBackground, rgba(255, 255, 255, 0.05));
  }

  .as-conflict-row.selected {
    background: var(--vscode-list-activeSelectionBackground, #2675bf) !important;
    color: var(--vscode-list-activeSelectionForeground, #ffffff) !important;
  }

  .as-dir-group-header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    background: rgba(255, 255, 255, 0.04);
    color: var(--vscode-descriptionForeground, #9aa0a6);
    font-size: 11.5px;
    font-weight: 600;
  }

  .as-action-panel {
    width: 130px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-top: 2px;
    flex-shrink: 0;
  }

  .as-btn {
    background: var(--vscode-button-secondaryBackground, #2b2d30);
    color: var(--vscode-button-secondaryForeground, #dfe1e5);
    border: 1px solid var(--vscode-button-border, #4e5157);
    border-radius: 4px;
    padding: 7px 14px;
    font-size: 12.5px;
    cursor: pointer;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex-shrink: 0;
    transition: background 0.15s;
  }

  .as-btn:hover {
    background: var(--vscode-button-secondaryHoverBackground, #35373b);
  }

  .as-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .as-btn-primary {
    background: var(--vscode-button-background, #3574f0);
    color: var(--vscode-button-foreground, #ffffff);
    border: none;
    border-radius: 4px;
    padding: 7px 14px;
    font-size: 12.5px;
    font-weight: 600;
    cursor: pointer;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex-shrink: 0;
    transition: background 0.15s;
    margin-top: 4px;
  }

  .as-btn-primary:hover {
    background: var(--vscode-button-hoverBackground, #3068d8);
  }

  .as-btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .as-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 20px 14px;
    background: var(--vscode-editorGroupHeader-tabsBackground, var(--vscode-sideBar-background, #2b2d30));
    border-top: 1px solid var(--vscode-panel-border, #323438);
    flex-shrink: 0;
  }

  .as-group-label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12.5px;
    color: var(--vscode-editor-foreground, #dfe1e5);
    cursor: pointer;
  }

  .as-checkbox {
    cursor: pointer;
    width: 14px;
    height: 14px;
    margin: 0;
  }

  .as-btn-close {
    padding: 6px 20px;
  }
</style>
