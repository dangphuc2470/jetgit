<script lang="ts">
  import { parseRef, type ParsedRef } from '$labelUtils';

  interface Props {
    refs: string[];
    compact?: boolean;
    showTags?: boolean;
    onBranchContextMenu?: (e: MouseEvent, branchName: string) => void;
    onBranchCheckout?: (branchName: string) => void;
  }

  let {
    refs = [],
    compact = true,
    showTags = true,
    onBranchContextMenu,
    onBranchCheckout
  }: Props = $props();

  let isExpanded = $state(false);

  $effect(() => {
    if (!compact) {
      isExpanded = false;
    }
  });

  let parsedRefs: ParsedRef[] = $derived.by(() => {
    const list = refs.map(parseRef);
    const priority: Record<string, number> = { head: 0, branch: 1, remote: 2, tag: 3 };
    return list.sort((a, b) => (priority[a.type] ?? 4) - (priority[b.type] ?? 4));
  });

  let displayedRefs = $derived.by(() => {
    if (!compact || isExpanded || parsedRefs.length <= 1) {
      return parsedRefs;
    }
    return parsedRefs.slice(0, 1);
  });

  let remainingCount = $derived(
    compact && !isExpanded && parsedRefs.length > 1 ? parsedRefs.length - 1 : 0
  );

  let remainingTooltip = $derived(
    parsedRefs.slice(1).map((r) => r.displayName).join(', ')
  );
</script>

<span class="labels" class:compact>
  {#each displayedRefs as item}
    {@const isIconOnly = item.type === 'tag' && !showTags}
    <span
      class="label {item.type}"
      class:compact
      class:icon-only={isIconOnly}
      title={item.displayName}
      role="button"
      tabindex="0"
      oncontextmenu={(e) => {
        if (onBranchContextMenu && item.type !== 'head') {
          e.preventDefault();
          e.stopPropagation();
          onBranchContextMenu(e, item.displayName);
        }
      }}
      ondblclick={(e) => {
        if (onBranchCheckout && (item.type === 'branch' || item.type === 'remote')) {
          e.stopPropagation();
          onBranchCheckout(item.displayName);
        }
      }}
      onkeydown={(e) => {
        if (e.key === 'Enter' && onBranchCheckout && (item.type === 'branch' || item.type === 'remote')) {
          onBranchCheckout(item.displayName);
        }
      }}
    >
      <span class="label-icon">
        {#if item.type === 'head'}
          <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1a7 7 0 1 0 7 7A7 7 0 0 0 8 1zm3.1 5.3l-3.8 4.2a.8.8 0 0 1-1.2 0l-1.9-2a.8.8 0 1 1 1.1-1.1l1.3 1.4 3.3-3.6a.8.8 0 0 1 1.2 1.1z"/>
          </svg>
        {:else if item.type === 'tag'}
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M7.707 2.293L1.295 8.705a2 2 0 0 0 0 2.828l4.586 4.586a2 2 0 0 0 2.828 0l6.412-6.412A2 2 0 0 0 15.707 8.3V3a1 1 0 0 0-1-1H9.414a2 2 0 0 0-1.707.293z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
            <circle cx="11.5" cy="5.5" r="1.5" fill="currentColor"/>
          </svg>
        {:else if item.type === 'remote'}
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
            <circle cx="4.5" cy="4.5" r="1.8" stroke="currentColor" stroke-width="1.3" fill="none"/>
            <circle cx="11.5" cy="11.5" r="1.8" stroke="currentColor" stroke-width="1.3" fill="none"/>
            <line x1="4.5" y1="6.3" x2="4.5" y2="11.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
            <path d="M4.5 9H9.5C10.5 9 11.5 9.8 11.5 10.7" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" fill="none"/>
            <path d="M8 4.5H13M10.5 2L13 4.5L10.5 7" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        {:else}
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
            <circle cx="4.5" cy="4.5" r="1.8" stroke="currentColor" stroke-width="1.3" fill="none"/>
            <circle cx="11.5" cy="6.5" r="1.8" stroke="currentColor" stroke-width="1.3" fill="none"/>
            <line x1="4.5" y1="6.3" x2="4.5" y2="14" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
            <path d="M4.5 9.8H9.7C10.6 9.8 11.5 9.0 11.5 8.1V8.0" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          </svg>
        {/if}
      </span>
      {#if !isIconOnly}
        <span class="label-text">{item.shortName}</span>
      {/if}
    </span>
  {/each}

  {#if remainingCount > 0}
    <span
      class="label more-badge"
      role="button"
      tabindex="0"
      title="{remainingTooltip} (click to expand)"
      onclick={(e) => { e.stopPropagation(); isExpanded = true; }}
      onkeydown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); isExpanded = true; } }}
    >
      +{remainingCount}
    </span>
  {/if}
</span>

<style>
  .labels {
    margin-left: 0;
    margin-right: 8px;
    display: inline-flex;
    gap: 5px;
    flex-shrink: 0;
    padding-right: 0;
    min-width: max-content;
    overflow: visible;
    align-items: center;
  }
  :global(.refs-on-left) .labels,
  :global(body.refs-on-left) .labels {
    margin-left: 0;
    margin-right: 8px;
  }
  :global(:not(.refs-on-left)) .labels,
  :global(body:not(.refs-on-left)) .labels {
    margin-left: 10px;
    margin-right: 0;
  }
  .label {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 1px 5px 2px 5px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 500;
    line-height: 14px;
    white-space: nowrap;
    flex-shrink: 0;
    box-sizing: border-box;
    cursor: default;
    user-select: none;
    transition: all 0.1s ease;
  }
  .label.compact,
  :global(body.compact-refs) .label {
    padding: 0 4px;
    font-size: 10.5px;
    max-width: 140px;
  }
  .label.compact .label-text,
  :global(body.compact-refs) .label-text {
    max-width: 115px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .label.icon-only {
    padding: 1px 4px 2px 4px;
  }
  .label.icon-only .label-icon {
    margin-right: 0;
  }
  .label.more-badge {
    background: rgba(255, 255, 255, 0.1);
    color: #c9d1d9;
    border: 1px solid rgba(255, 255, 255, 0.22);
    cursor: pointer;
    font-size: 10px;
    font-weight: 600;
    padding: 1px 5px;
    border-radius: 6px;
    line-height: 14px;
    transition: all 0.15s ease;
  }
  .label.more-badge:hover {
    background: rgba(255, 255, 255, 0.22);
    color: #ffffff;
    border-color: rgba(255, 255, 255, 0.4);
  }
  .label-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 0;
    margin-right: 1px;
  }
  .label-text {
    display: inline-block;
  }
  .branch {
    color: #57ab5a;
    background: rgba(87, 171, 90, 0.12);
    border: 1px solid rgba(87, 171, 90, 0.45);
  }
  .remote {
    color: #b392f0;
    background: rgba(179, 146, 240, 0.12);
    border: 1px solid rgba(179, 146, 240, 0.45);
  }
  .tag {
    color: #e5a50a;
    background: rgba(229, 165, 10, 0.12);
    border: 1px solid rgba(229, 165, 10, 0.45);
  }
  .head {
    color: #e5c07b;
    background: rgba(229, 192, 123, 0.18);
    border: 1px solid rgba(229, 192, 123, 0.65);
    font-weight: 600;
  }
</style>
