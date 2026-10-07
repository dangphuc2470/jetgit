<script lang="ts">
  import { postMessage } from '$shared/vscodeApi';

  interface CommitInfo {
    hash: string;
    subject: string;
    body?: string;
    author: string;
    authorEmail: string;
    authorDate: string;
    parents: string[];
  }

  interface FileChange {
    path: string;
    status: string;
    oldPath?: string;
  }

  interface Props {
    commit: CommitInfo | null;
    files: FileChange[];
  }

  let { commit = null, files = [] }: Props = $props();

  function handleFileClick(file: FileChange): void {
    if (!commit) return;
    postMessage('openDiff', {
      hash: commit.hash,
      file: { path: file.path, status: file.status, oldPath: file.oldPath }
    });
  }

  function statusLabel(status: string): string {
    switch (status) {
      case 'A': return 'Added';
      case 'M': return 'Modified';
      case 'D': return 'Deleted';
      case 'R': return 'Renamed';
      case 'C': return 'Copied';
      default: return status;
    }
  }

  function statusClass(status: string): string {
    switch (status) {
      case 'A': return 'status-added';
      case 'M': return 'status-modified';
      case 'D': return 'status-deleted';
      case 'R': return 'status-renamed';
      default: return '';
    }
  }

  function fileName(path: string): string {
    return path.split('/').pop() || path;
  }

  function dirName(path: string): string {
    const parts = path.split('/');
    if (parts.length <= 1) return '';
    return parts.slice(0, -1).join('/') + '/';
  }

  function formatFullDate(iso: string): string {
    return new Date(iso).toLocaleString();
  }
</script>

{#if commit}
  <div class="detail">
    <div class="header">
      <div class="subject">{commit.subject}</div>
      {#if commit.body}
        <div class="body">{commit.body}</div>
      {/if}
      <div class="meta">
        <div class="meta-row">
          <span class="meta-label">Hash</span>
          <span class="meta-value mono">{commit.hash}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Author</span>
          <span class="meta-value">{commit.author} &lt;{commit.authorEmail}&gt;</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Date</span>
          <span class="meta-value">{formatFullDate(commit.authorDate)}</span>
        </div>
        {#if commit.parents && commit.parents.length > 0}
          <div class="meta-row">
            <span class="meta-label">Parents</span>
            <span class="meta-value mono">{commit.parents.map(p => p.slice(0, 7)).join(', ')}</span>
          </div>
        {/if}
      </div>
    </div>

    <div class="files-header">Changed Files ({files.length})</div>
    {#if files.length === 0}
      <div class="loading-files">Loading...</div>
    {:else}
      <div class="files-list">
        {#each files as file}
          <button class="file-row" type="button" onclick={() => handleFileClick(file)}>
            <span class={`file-status ${statusClass(file.status)}`} title={statusLabel(file.status)}>
              {file.status}
            </span>
            <span class="file-path" title={file.path}>
              <span class="file-dir">{dirName(file.path)}</span>
              <span class="file-name">{fileName(file.path)}</span>
            </span>
          </button>
        {/each}
      </div>
    {/if}
  </div>
{/if}

<style>
  .detail {
    padding: 12px;
    position: relative;
  }
  .header {
    padding-bottom: 12px;
    border-bottom: 1px solid var(--vscode-panel-border);
    padding-right: 24px;
  }
  .subject {
    font-weight: 600;
    margin-bottom: 4px;
  }
  .body {
    white-space: pre-wrap;
    color: var(--vscode-descriptionForeground);
    font-size: 0.9em;
    margin-bottom: 8px;
  }
  .meta {
    font-size: 0.85em;
  }
  .meta-row {
    display: flex;
    gap: 8px;
    padding: 2px 0;
  }
  .meta-label {
    color: var(--vscode-descriptionForeground);
    width: 50px;
    flex-shrink: 0;
  }
  .meta-value {
    overflow: hidden;
    text-overflow: ellipsis;
    word-break: break-all;
  }
  .mono {
    font-family: var(--vscode-editor-font-family, monospace);
    font-size: 0.95em;
  }
  .files-header {
    padding: 8px 0 4px;
    font-weight: 600;
    font-size: 0.9em;
    color: var(--vscode-descriptionForeground);
  }
  .loading-files {
    padding: 8px 0;
    color: var(--vscode-descriptionForeground);
    font-size: 0.9em;
  }
  .files-list {
    display: flex;
    flex-direction: column;
  }
  .file-row {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 3px 4px;
    cursor: pointer;
    border-radius: 3px;
    background: none;
    border: none;
    color: inherit;
    font: inherit;
    text-align: left;
    width: 100%;
  }
  .file-row:hover {
    background: var(--vscode-list-hoverBackground);
  }
  .file-status {
    flex-shrink: 0;
    width: 16px;
    text-align: center;
    font-weight: 600;
    font-size: 0.85em;
  }
  .status-added { color: #73c991; }
  .status-modified { color: #e2c08d; }
  .status-deleted { color: #c74e39; }
  .status-renamed { color: #569cd6; }
  .file-path {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.9em;
  }
  .file-dir { color: var(--vscode-descriptionForeground); }
  .file-name { color: var(--vscode-foreground); }
</style>
