<script lang="ts">
  import { LINE_HEIGHT } from "./state";
  import type { DiffBlock } from "./types";

  interface Props {
    gutterEl?: HTMLDivElement | null;
    blocks: DiffBlock[];
    sLeft: number;
    sRight: number;
    viewH: number;
    readOnly: boolean;
    onRevertBlock: (block: DiffBlock) => void;
    onToggleStageBlock: (block: DiffBlock, checked: boolean) => void;
  }

  let {
    gutterEl = $bindable(null),
    blocks,
    sLeft,
    sRight,
    viewH,
    readOnly,
    onRevertBlock,
    onToggleStageBlock,
  }: Props = $props();

  const W = 54;
  const flat = 10;

  interface ComputedRibbon {
    block: DiffBlock;
    d: string;
    fillClass: string;
    showRevert: boolean;
    revertY: number;
    showCheck: boolean;
    checkY: number;
  }

  let computedRibbons = $derived.by(() => {
    const list: ComputedRibbon[] = [];
    const height = viewH || 800;

    for (const b of blocks) {
      const y1 = (b.leftStart - 1) * LINE_HEIGHT - sLeft;
      const y2 = b.isLeftEmpty ? y1 : (b.leftEnd * LINE_HEIGHT - sLeft);

      const y3 = (b.rightStart - 1) * LINE_HEIGHT - sRight;
      const y4 = b.isRightEmpty ? y3 : (b.rightEnd * LINE_HEIGHT - sRight);

      if (Math.max(y2, y4) < -20 || Math.min(y1, y3) > height + 20) {
        continue;
      }

      const d = `M 0,${y1} L ${flat},${y1} C ${flat + 10},${y1} ${W - flat - 10},${y3} ${W - flat},${y3} L ${W},${y3} L ${W},${y4} L ${W - flat},${y4} C ${W - flat - 10},${y4} ${flat + 10},${y2} ${flat},${y2} L 0,${y2} Z`;
      const fillClass = `ribbon-${b.type}`;

      let showRevert = false;
      let revertY = 0;
      let showCheck = false;
      let checkY = 0;

      if (!readOnly) {
        checkY = b.isRightEmpty ? (y3 - 7) : (y3 + 3);
        revertY = b.isLeftEmpty ? (y1 - 7) : (y1 + 3);
        showRevert = revertY >= -15 && revertY <= height + 15;
        showCheck = checkY >= -15 && checkY <= height + 15;
      }

      list.push({
        block: b,
        d,
        fillClass,
        showRevert,
        revertY,
        showCheck,
        checkY,
      });
    }

    return list;
  });
</script>

<div class="middle-gutter" bind:this={gutterEl}>
  <svg class="gutter-ribbon-svg" width="54" height="100%">
    {#each computedRibbons as r (r.block.id)}
      <path d={r.d} class={`diff-ribbon ${r.fillClass}`} data-block-id={r.block.id} />
    {/each}
  </svg>

  <div class="gutter-controls-layer">
    {#each computedRibbons as r (r.block.id)}
      {#if r.showRevert}
        <button
          type="button"
          class="block-revert-btn"
          style={`top: ${r.revertY}px;`}
          data-tooltip="Revert change (Accept base revision)"
          data-block-id={r.block.id}
          onclick={(e) => { e.stopPropagation(); onRevertBlock(r.block); }}
        >
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
            <path d="M7.5 11.5L12 7L7.5 2.5M2.5 11.5L7 7L2.5 2.5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.3"/>
          </svg>
        </button>
      {/if}

      {#if r.showCheck}
        <div class="gutter-block-control" style={`top: ${r.checkY}px;`} data-block-id={r.block.id}>
          <label class="studio-chk-wrap" data-tooltip="Stage / Unstage change">
            <input
              type="checkbox"
              class="block-chk"
              checked={r.block.staged}
              data-block-id={r.block.id}
              onchange={(e) => {
                e.stopPropagation();
                onToggleStageBlock(r.block, (e.target as HTMLInputElement).checked);
              }}
            />
            <span class="chk-custom">
              <svg class="chk-mark" width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1.8 5.2L4 7.4L8.2 2.8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <svg class="chk-indet" width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 5H8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
            </span>
          </label>
        </div>
      {/if}
    {/each}
  </div>
</div>
