<script lang="ts">
  import { escapeHtml } from '../shared/escape';
  import { getFileIcon } from '../shared/fileIcons';
  import type { CommitFile, SkippedFile } from './types';
  import { isFolderExpanded, buildDirectoryTree } from './treeView';

  interface Props {
    files: CommitFile[];
    skippedFiles?: SkippedFile[];
    expandSkipped?: boolean;
    isLoadingSkipped?: boolean;
    hasLoadedSkipped?: boolean;
    selectedFile: string | null;
    checkedFiles: Set<string>;
    expandChanges: boolean;
    expandUnversioned: boolean;
    showPaths: boolean;
    groupByDirectory: boolean;
    groupByModule: boolean;
    repoName: string;
    showIgnoredFiles: boolean;
    showSkippedWorktree?: boolean;
    checkedSkippedFiles?: Set<string>;
    expandedFolders: Set<string>;
    collapsedFolders: Set<string>;
    expandAllFolders: boolean | null;
    changelists?: { name: string; files: string[] }[];
    activeChangelist?: string;
    expandedChangelists?: Set<string>;
    onSelectFile: (file: CommitFile) => void;
    onOpenFileDiff: (file: CommitFile) => void;
    onToggleStageFile: (file: CommitFile, checked: boolean) => void;
    onToggleStageFiles: (files: CommitFile[], checked: boolean) => void;
    onToggleFolder: (folderPath: string, isModule?: boolean) => void;
    onToggleExpandChanges: () => void;
    onToggleExpandUnversioned: () => void;
    onToggleExpandSkipped?: () => void;
    onContextMenu: (e: MouseEvent, file: CommitFile) => void;
    onSkippedContextMenu?: (e: MouseEvent, file: SkippedFile) => void;
    onSelectSkippedFile?: (file: SkippedFile) => void;
    onToggleSkippedFileChecked?: (path: string, checked: boolean) => void;
    onToggleAllSkipped?: (items: SkippedFile[], checked: boolean) => void;
    onToggleChangelist?: (name: string) => void;
    onChangelistContextMenu?: (e: MouseEvent, name: string, isActive: boolean) => void;
    onMoveFilesToChangelist?: (files: string[], changelist: string) => void;
  }

  let {
    files,
    skippedFiles = [],
    expandSkipped = false,
    isLoadingSkipped = false,
    hasLoadedSkipped = false,
    selectedFile,
    checkedFiles,
    expandChanges,
    expandUnversioned,
    showPaths,
    groupByDirectory,
    groupByModule,
    repoName,
    showIgnoredFiles,
    showSkippedWorktree = false,
    checkedSkippedFiles = new Set(),
    expandedFolders,
    collapsedFolders,
    expandAllFolders,
    changelists,
    activeChangelist,
    expandedChangelists,
    onSelectFile,
    onOpenFileDiff,
    onToggleStageFile,
    onToggleStageFiles,
    onToggleFolder,
    onToggleExpandChanges,
    onToggleExpandUnversioned,
    onToggleExpandSkipped,
    onContextMenu,
    onSkippedContextMenu,
    onSelectSkippedFile,
    onToggleSkippedFileChecked,
    onToggleAllSkipped,
    onToggleChangelist,
    onChangelistContextMenu,
    onMoveFilesToChangelist,
  }: Props = $props();

  let changesFiles = $derived(
    files
      .filter((f) => !f.isUntracked)
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }) || a.path.localeCompare(b.path))
  );

  let changelistFilesMap = $derived.by(() => {
    const map = new Map<string, CommitFile[]>();
    const effectiveLists = (changelists && changelists.length > 0)
      ? changelists
      : [{ name: 'Changes', files: [] }];
    for (const cl of effectiveLists) {
      map.set(cl.name, []);
    }
    const assigned = new Set<string>();
    for (const cl of effectiveLists) {
      const set = new Set(cl.files);
      const list: CommitFile[] = [];
      for (const f of changesFiles) {
        if (set.has(f.path)) {
          list.push(f);
          assigned.add(f.path);
        }
      }
      map.set(cl.name, list);
    }
    const activeName = activeChangelist || effectiveLists[0]?.name || 'Changes';
    const activeList = map.get(activeName) || [];
    for (const f of changesFiles) {
      if (!assigned.has(f.path)) {
        activeList.push(f);
      }
    }
    map.set(activeName, activeList);
    return map;
  });

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

  function getRepoGroups(filesList: CommitFile[]): { name: string; files: CommitFile[] }[] {
    const map = new Map<string, CommitFile[]>();
    for (const f of filesList) {
      const rName = f.repoName || repoName || 'Project';
      if (!map.has(rName)) map.set(rName, []);
      map.get(rName)!.push(f);
    }
    return Array.from(map.entries()).map(([name, groupList]) => ({ name, files: groupList }));
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
    draggable="true"
    ondragstart={(e) => {
      e.dataTransfer?.setData('text/plain', file.path);
      if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
    }}
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

{#snippet groupBody(groupFiles: CommitFile[], groupTitle: string)}
  {@const repoGroups = getRepoGroups(groupFiles)}
  {@const isMultiRepo = repoGroups.length > 1}
  {@const shouldGroupByRepo = Boolean(groupByModule || isMultiRepo)}
  {@const isTreeMode = Boolean(groupByDirectory || shouldGroupByRepo)}
  <div class={`group-items ${isTreeMode ? 'group-tree-mode' : ''}`}>
    {#if shouldGroupByRepo}
      {#each repoGroups as rg (rg.name)}
        {@const repoFiles = rg.files}
        {@const repoCheckState = getGroupCheckState(repoFiles)}
        {@const repoFolderKey = `__repo__:${groupTitle}:${rg.name}`}
        {@const isRepoExpanded = isFolderOpen(repoFolderKey, true)}
        <div class="tree-folder-node module-folder-node repo-folder-node">
          <div
            class="tree-folder-header module-header repo-header"
            data-folder-path={repoFolderKey}
            onclick={() => onToggleFolder(repoFolderKey, true)}
            role="button"
            tabindex="0"
            onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') onToggleFolder(repoFolderKey, true); }}
          >
            <span class={`tree-arrow ${isRepoExpanded ? 'expanded' : ''}`}>
              <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M6 3.5L10.5 8L6 12.5L5 11.5L8.5 8L5 4.5L6 3.5Z"/>
              </svg>
            </span>
            <input
              type="checkbox"
              class="file-chk tree-chk group-chk repo-chk"
              checked={repoCheckState.checked}
              indeterminate={repoCheckState.indeterminate}
              onclick={(e) => e.stopPropagation()}
              onchange={(e) => {
                e.stopPropagation();
                onToggleStageFiles(repoFiles, (e.target as HTMLInputElement).checked);
              }}
            />
            <span class="tree-folder-icon repo-icon">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M1.5 3.5C1.5 2.67157 2.17157 2 3 2H6.08579C6.48362 2 6.86514 2.15804 7.14645 2.43934L8.70711 4H13C13.8284 4 14.5 4.67157 14.5 5.5V12.5C14.5 13.3284 13.8284 14 13 14H3C2.17157 14 1.5 13.3284 1.5 12.5V3.5Z" stroke="#8C8C8C" stroke-width="1.2" fill="none"/>
              </svg>
            </span>
            <span class="tree-folder-name repo-name">{rg.name}</span>
            <span class="tree-folder-count">{repoFiles.length} {repoFiles.length === 1 ? 'file' : 'files'}</span>
          </div>

          {#if isRepoExpanded}
            <div class="tree-folder-children module-children repo-children">
              {#if groupByDirectory}
                {@const treeRoot = buildDirectoryTree(repoFiles)}
                {#each Array.from(treeRoot.children.values()).sort((a: any, b: any) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })) as sub (sub.path || sub.name)}
                  {@render folderNode(sub, 1, `${groupTitle}:${rg.name}`)}
                {/each}
                {#each [...treeRoot.files].sort((a: any, b: any) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })) as file (file.path)}
                  {@render fileItem(file, true)}
                {/each}
              {:else}
                {#each repoFiles as file (file.path)}
                  {@render fileItem(file, false)}
                {/each}
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    {:else if groupByDirectory}
      {@const treeRoot = buildDirectoryTree(groupFiles)}
      {#each Array.from(treeRoot.children.values()).sort((a: any, b: any) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })) as sub (sub.path || sub.name)}
        {@render folderNode(sub, 0, groupTitle)}
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
      {@render groupBody(groupFiles, title)}
    {/if}
  </div>
{/snippet}

{#snippet changelistGroup(name: string, groupFiles: CommitFile[], expanded: boolean, isActive: boolean)}
  {@const checkState = getGroupCheckState(groupFiles)}
  {@const isSingleList = !changelists || changelists.length <= 1}
  {@const displayName = isSingleList ? 'Changes' : (name === 'Default' ? 'Changes' : name)}
  <div class="tree-group changelist-group" data-changelist={name}>
    <div
      class={`group-header changelist-header ${isActive ? 'is-active' : ''}`}
      onclick={() => onToggleChangelist ? onToggleChangelist(name) : null}
      oncontextmenu={(e) => onChangelistContextMenu ? onChangelistContextMenu(e, name, isActive) : null}
      ondragover={(e) => {
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
        (e.currentTarget as HTMLElement).classList.add('drag-over');
      }}
      ondragleave={(e) => {
        (e.currentTarget as HTMLElement).classList.remove('drag-over');
      }}
      ondrop={(e) => {
        e.preventDefault();
        (e.currentTarget as HTMLElement).classList.remove('drag-over');
        const filePath = e.dataTransfer?.getData('text/plain');
        if (filePath && onMoveFilesToChangelist) {
          onMoveFilesToChangelist([filePath], name);
        }
      }}
      role="button"
      tabindex="0"
      onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') onToggleChangelist?.(name); }}
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
      {#if !isSingleList}
        <span class="changelist-icon">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path fill-rule="evenodd" d="M2,2 L14,2 L14,14 L2,14 L2,2 Z M4,4 L4,12 L12,12 L12,4 L4,4 Z M5,5 H11 V6 H5 Z M5,7 H11 V8 H5 Z M5,9 H11 V10 H5 Z"/>
          </svg>
        </span>
      {/if}
      <span class="group-title changelist-name">{displayName}</span>
      {#if !isSingleList && isActive}
        <span class="changelist-active-badge">(active)</span>
      {/if}
      <span class="group-count">{groupFiles.length} {groupFiles.length === 1 ? 'file' : 'files'}</span>
    </div>

    {#if expanded && groupFiles.length > 0}
      {@render groupBody(groupFiles, name)}
    {/if}
  </div>
{/snippet}

{#snippet skippedItem(file: SkippedFile)}
  {@const isSelected = selectedFile === file.path}
  {@const isChecked = checkedSkippedFiles.has(file.path)}
  <div
    class={`file-item tree-file-item ${isSelected ? 'selected' : ''}`}
    data-path={file.path}
    onclick={() => onSelectSkippedFile ? onSelectSkippedFile(file) : null}
    ondblclick={() => onSelectSkippedFile ? onSelectSkippedFile(file) : null}
    oncontextmenu={(e) => onSkippedContextMenu ? onSkippedContextMenu(e, file) : null}
    role="button"
    tabindex="0"
    onkeydown={(e) => {
      if (e.key === 'Enter') onSelectSkippedFile?.(file);
    }}
  >
    <input
      type="checkbox"
      class="file-chk tree-chk"
      checked={isChecked}
      onclick={(e) => e.stopPropagation()}
      onchange={(e) => {
        e.stopPropagation();
        onToggleSkippedFileChecked?.(file.path, (e.target as HTMLInputElement).checked);
      }}
    />
    <span class="file-icon">{@html getFileIcon(file.name)}</span>
    <span class={`file-name name-skipped ${file.hasLocalChanges ? 'has-local-changes' : ''}`}>{file.name}</span>
    {#if showPaths && file.dir}
      <span class="file-dir">{file.dir}</span>
    {/if}
  </div>
{/snippet}

{#snippet skippedGroup(items: SkippedFile[], expanded: boolean, onToggle: (() => void) | undefined)}
  {@const allChecked = items.length > 0 && items.every((f) => checkedSkippedFiles.has(f.path))}
  {@const someChecked = items.length > 0 && items.some((f) => checkedSkippedFiles.has(f.path))}
  <div class="tree-group skipped-group">
    <div
      class="group-header"
      onclick={() => onToggle?.()}
      role="button"
      tabindex="0"
      onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') onToggle?.(); }}
    >
      <span class={`group-arrow ${expanded ? 'expanded' : ''}`}>
        <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M6 3.5L10.5 8L6 12.5L5 11.5L8.5 8L5 4.5L6 3.5Z"/>
        </svg>
      </span>
      <input
        type="checkbox"
        class="group-chk"
        checked={allChecked}
        indeterminate={someChecked && !allChecked}
        onclick={(e) => e.stopPropagation()}
        onchange={(e) => {
          e.stopPropagation();
          onToggleAllSkipped?.(items, (e.target as HTMLInputElement).checked);
        }}
      />
      <span class="group-title">Skipped Worktree</span>
      {#if isLoadingSkipped}
        <span class="skipped-loading-spinner" title="Scanning skipped files...">
          <svg class="spin-icon" width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor">
            <circle cx="8" cy="8" r="6" stroke-width="2" stroke-dasharray="28" stroke-dashoffset="10" stroke-linecap="round"/>
          </svg>
        </span>
      {:else if hasLoadedSkipped}
        <span class="group-count">{items.length} {items.length === 1 ? 'file' : 'files'}</span>
      {/if}
    </div>

    {#if expanded}
      <div class="group-items">
        {#if isLoadingSkipped}
          <div class="skipped-loading-hint">Loading skipped files...</div>
        {:else if items.length > 0}
          {#each items as file (file.path)}
            {@render skippedItem(file)}
          {/each}
        {:else if hasLoadedSkipped}
          <div class="skipped-empty-hint">No files skipped (skip-worktree or assume-unchanged)</div>
        {/if}
      </div>
    {/if}
  </div>
{/snippet}

<div class="file-tree-container" style="flex: 1; height: 100%;">
  {#if changelists && changelists.length > 0}
    {#each changelists as cl (cl.name)}
      {@const clFiles = changelistFilesMap.get(cl.name) || []}
      {@const isClExpanded = expandedChangelists ? expandedChangelists.has(cl.name) : true}
      {@const isClActive = cl.name === activeChangelist}
      {@render changelistGroup(cl.name, clFiles, isClExpanded, isClActive)}
    {/each}
  {:else}
    {@render fileGroup('Changes', changesFiles, expandChanges, onToggleExpandChanges)}
  {/if}

  {#if showIgnoredFiles !== false}
    {@render fileGroup('Unversioned Files', unversionedFiles, expandUnversioned, onToggleExpandUnversioned)}
  {/if}

  {#if showSkippedWorktree}
    {@render skippedGroup(skippedFiles, expandSkipped ?? false, onToggleExpandSkipped)}
  {/if}
</div>
