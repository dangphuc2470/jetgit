<script lang="ts">
  import { escapeHtml } from '../shared/escape';
  import { getFileIcon } from '../shared/fileIcons';
  import type { CommitFile } from './types';
  import { isFolderExpanded, buildDirectoryTree } from './treeView';

  interface Props {
    files: CommitFile[];
    selectedFile: string | null;
    checkedFiles: Set<string>;
    expandChanges: boolean;
    expandUnversioned: boolean;
    showPaths: boolean;
    groupByDirectory: boolean;
    groupByModule: boolean;
    repoName: string;
    showIgnoredFiles: boolean;
    expandedFolders: Set<string>;
    collapsedFolders: Set<string>;
    expandAllFolders: boolean | null;
    onSelectFile: (file: CommitFile) => void;
    onOpenFileDiff: (file: CommitFile) => void;
    onToggleStageFile: (file: CommitFile, checked: boolean) => void;
    onToggleStageFiles: (files: CommitFile[], checked: boolean) => void;
    onToggleFolder: (folderPath: string, isModule?: boolean) => void;
    onToggleExpandChanges: () => void;
    onToggleExpandUnversioned: () => void;
    onContextMenu: (e: MouseEvent, file: CommitFile) => void;
  }

  let {
    files,
    selectedFile,
    checkedFiles,
    expandChanges,
    expandUnversioned,
    showPaths,
    groupByDirectory,
    groupByModule,
    repoName,
    showIgnoredFiles,
    expandedFolders,
    collapsedFolders,
    expandAllFolders,
    onSelectFile,
    onOpenFileDiff,
    onToggleStageFile,
    onToggleStageFiles,
    onToggleFolder,
    onToggleExpandChanges,
    onToggleExpandUnversioned,
    onContextMenu,
  }: Props = $props();

  let changesFiles = $derived(
    files
      .filter((f) => !f.isUntracked)
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }) || a.path.localeCompare(b.path))
  );

  let unversionedFiles = $derived(
    files
      .filter((f) => f.isUntracked)
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }) || a.path.localeCompare(b.path))
  );

  function isFolderOpen(folderPath: string, isModule = false): boolean {
    if (expandAllFolders === true) return !collapsedFolders.has(folderPath);
    if (expandAllFolders === false) return expandedFolders.has(folderPath);
    if (collapsedFolders.has(folderPath)) return false;
    if (expandedFolders.has(folderPath)) return true;
    return true;
  }

  function getGroupCheckState(groupFiles: CommitFile[]) {
    if (groupFiles.length === 0) return { checked: false, indeterminate: false };
    const anyPartiallyStaged = groupFiles.some(
      (f: any) => f.partiallyStaged || (f.totalChanges > 0 && f.stagedChanges > 0 && f.stagedChanges < f.totalChanges)
    );
    const allChecked = groupFiles.every((f) => checkedFiles.has(f.path) || (f.staged && !f.partiallyStaged));
    const someChecked =
      anyPartiallyStaged ||
      (!allChecked && groupFiles.some((f: any) => checkedFiles.has(f.path) || f.staged || f.stagedChanges > 0));
    return {
      checked: allChecked,
      indeterminate: someChecked && !allChecked,
    };
  }
</script>

{#snippet fileItem(file: CommitFile, inTree: boolean)}
  {@const isSelected = selectedFile === file.path}
  {@const isPartiallyStaged = file.partiallyStaged || ((file as any).totalChanges > 0 && (file as any).stagedChanges > 0 && (file as any).stagedChanges < (file as any).totalChanges)}
  {@const isChecked = !isPartiallyStaged && (checkedFiles.has(file.path) || (file.staged && !isPartiallyStaged))}
  {@const nameColorClass = file.isUntracked ? 'name-unversioned' : 'name-modified'}
  <div
    class={`file-item tree-file-item ${inTree ? 'in-tree' : 'in-flat'} ${isSelected ? 'selected' : ''}`}
    data-path={file.path}
    onclick={() => onSelectFile(file)}
    ondblclick={() => onOpenFileDiff(file)}
    oncontextmenu={(e) => onContextMenu(e, file)}
    role="row"
    tabindex="0"
    onkeydown={(e) => {
      if (e.key === 'Enter') onOpenFileDiff(file);
    }}
  >
    {#if inTree}
      <span class="tree-item-spacer"></span>
    {/if}
    <input
      type="checkbox"
      class="file-chk tree-chk"
      checked={isChecked}
      indeterminate={isPartiallyStaged}
      onclick={(e) => e.stopPropagation()}
      onchange={(e) => {
        e.stopPropagation();
        onToggleStageFile(file, (e.target as HTMLInputElement).checked);
      }}
    />
    <span class="file-icon">{@html getFileIcon(file.name)}</span>
    <span class={`file-name ${nameColorClass}`}>{file.name}</span>
    {#if !inTree && showPaths && file.dir}
      <span class="file-dir">{file.dir}</span>
    {/if}
    {#if isPartiallyStaged}
      <span class="file-changes-badge">{(file as any).stagedChanges} of {(file as any).totalChanges} changes</span>
    {/if}
  </div>
{/snippet}

{#snippet folderNode(node: any, depth: number, groupTitle: string)}
  {@const folderPath = node.path || node.name}
  {@const isOpen = isFolderOpen(folderPath, false)}
  {@const allFiles = node.allFiles || []}
  {@const checkState = getGroupCheckState(allFiles)}
  <div class="tree-folder-node">
    <div
      class="tree-folder-header"
      data-folder-path={folderPath}
      onclick={() => onToggleFolder(folderPath, false)}
      role="button"
      tabindex="0"
      onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') onToggleFolder(folderPath, false); }}
    >
      <span class={`tree-arrow ${isOpen ? 'expanded' : ''}`}>
        <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M6 3.5L10.5 8L6 12.5L5 11.5L8.5 8L5 4.5L6 3.5Z"/>
        </svg>
      </span>
      <input
        type="checkbox"
        class="file-chk tree-chk group-chk"
        checked={checkState.checked}
        indeterminate={checkState.indeterminate}
        onclick={(e) => e.stopPropagation()}
        onchange={(e) => {
          e.stopPropagation();
          onToggleStageFiles(allFiles, (e.target as HTMLInputElement).checked);
        }}
      />
      <span class="tree-folder-icon">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M1.5 3.5C1.5 2.67157 2.17157 2 3 2H6.08579C6.48362 2 6.86514 2.15804 7.14645 2.43934L8.70711 4H13C13.8284 4 14.5 4.67157 14.5 5.5V12.5C14.5 13.3284 13.8284 14 13 14H3C2.17157 14 1.5 13.3284 1.5 12.5V3.5Z" stroke="#8C8C8C" stroke-width="1.2" fill="none"/>
        </svg>
      </span>
      <span class="tree-folder-name">{node.name}</span>
      <span class="tree-folder-count">{allFiles.length} {allFiles.length === 1 ? 'file' : 'files'}</span>
    </div>

    {#if isOpen}
      <div class="tree-folder-children">
        {#each Array.from(node.children.values()).sort((a: any, b: any) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })) as sub (sub.path || sub.name)}
          {@render folderNode(sub, depth + 1, groupTitle)}
        {/each}
        {#each [...node.files].sort((a: any, b: any) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })) as file (file.path)}
          {@render fileItem(file, true)}
        {/each}
      </div>
    {/if}
  </div>
{/snippet}

{#snippet fileGroup(title: string, groupFiles: CommitFile[], expanded: boolean, onToggleExpand: () => void)}
  {@const checkState = getGroupCheckState(groupFiles)}
  <div class="tree-group">
    <div
      class="group-header"
      onclick={onToggleExpand}
      role="button"
      tabindex="0"
      onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') onToggleExpand(); }}
    >
      <span class={`group-arrow ${expanded ? 'expanded' : ''}`}>
        <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M6 3.5L10.5 8L6 12.5L5 11.5L8.5 8L5 4.5L6 3.5Z"/>
        </svg>
      </span>
      <input
        type="checkbox"
        class="group-chk"
        checked={checkState.checked}
        indeterminate={checkState.indeterminate}
        onclick={(e) => e.stopPropagation()}
        onchange={(e) => {
          e.stopPropagation();
          onToggleStageFiles(groupFiles, (e.target as HTMLInputElement).checked);
        }}
      />
      <span class="group-title">{title}</span>
      <span class="group-count">{groupFiles.length} {groupFiles.length === 1 ? 'file' : 'files'}</span>
    </div>

    {#if expanded && groupFiles.length > 0}
      {@const isTreeMode = Boolean(groupByDirectory || groupByModule)}
      <div class={`group-items ${isTreeMode ? 'group-tree-mode' : ''}`}>
        {#if groupByModule}
          {@const moduleName = repoName || 'Project'}
          {@const modulePath = `__module__:${title}:${moduleName}`}
          {@const isModuleExpanded = isFolderOpen(modulePath, true)}
          <div class="tree-folder-node module-folder-node">
            <div
              class="tree-folder-header module-header"
              data-folder-path={modulePath}
              onclick={() => onToggleFolder(modulePath, true)}
              role="button"
              tabindex="0"
              onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') onToggleFolder(modulePath, true); }}
            >
              <span class={`tree-arrow ${isModuleExpanded ? 'expanded' : ''}`}>
                <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M6 3.5L10.5 8L6 12.5L5 11.5L8.5 8L5 4.5L6 3.5Z"/>
                </svg>
              </span>
              <input
                type="checkbox"
                class="file-chk tree-chk group-chk"
                checked={checkState.checked}
                indeterminate={checkState.indeterminate}
                onclick={(e) => e.stopPropagation()}
                onchange={(e) => {
                  e.stopPropagation();
                  onToggleStageFiles(groupFiles, (e.target as HTMLInputElement).checked);
                }}
              />
              <span class="tree-folder-icon">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M1.5 3.5C1.5 2.67157 2.17157 2 3 2H6.08579C6.48362 2 6.86514 2.15804 7.14645 2.43934L8.70711 4H13C13.8284 4 14.5 4.67157 14.5 5.5V12.5C14.5 13.3284 13.8284 14 13 14H3C2.17157 14 1.5 13.3284 1.5 12.5V3.5Z" stroke="#8C8C8C" stroke-width="1.2" fill="none"/>
                </svg>
              </span>
              <span class="tree-folder-name">{moduleName}</span>
              <span class="tree-folder-count">{groupFiles.length} {groupFiles.length === 1 ? 'file' : 'files'}</span>
            </div>

            {#if isModuleExpanded}
              <div class="tree-folder-children module-children">
                {#if groupByDirectory}
                  {@const treeRoot = buildDirectoryTree(groupFiles)}
                  {#each Array.from(treeRoot.children.values()).sort((a: any, b: any) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })) as sub (sub.path || sub.name)}
                    {@render folderNode(sub, 1, title)}
                  {/each}
                  {#each [...treeRoot.files].sort((a: any, b: any) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })) as file (file.path)}
                    {@render fileItem(file, true)}
                  {/each}
                {:else}
                  {#each groupFiles as file (file.path)}
                    {@render fileItem(file, false)}
                  {/each}
                {/if}
              </div>
            {/if}
          </div>
        {:else if groupByDirectory}
          {@const treeRoot = buildDirectoryTree(groupFiles)}
          {#each Array.from(treeRoot.children.values()).sort((a: any, b: any) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })) as sub (sub.path || sub.name)}
            {@render folderNode(sub, 0, title)}
          {/each}
          {#each [...treeRoot.files].sort((a: any, b: any) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })) as file (file.path)}
            {@render fileItem(file, true)}
          {/each}
        {:else}
          {#each groupFiles as file (file.path)}
            {@render fileItem(file, false)}
          {/each}
        {/if}
      </div>
    {/if}
  </div>
{/snippet}

<div class="file-tree-container">
  {@render fileGroup('Changes', changesFiles, expandChanges, onToggleExpandChanges)}

  {#if showIgnoredFiles !== false}
    {@render fileGroup('Unversioned Files', unversionedFiles, expandUnversioned, onToggleExpandUnversioned)}
  {/if}
</div>
