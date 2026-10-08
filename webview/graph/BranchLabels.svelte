<script lang="ts">
  interface Props {
    refs: string[];
  }

  let { refs = [] }: Props = $props();

  function labelClass(ref: string): string {
    if (ref.startsWith('tag: ')) return 'label tag';
    if (ref.startsWith('HEAD') || ref === 'HEAD') return 'label head';
    if (ref.includes('/')) return 'label remote';
    return 'label branch';
  }

  function labelText(ref: string): string {
    if (ref.startsWith('HEAD -> ')) return ref.slice(8);
    if (ref.startsWith('tag: ')) return ref.slice(5);
    return ref;
  }

  function labelIcon(ref: string): string {
    if (ref.startsWith('tag: ')) {
      return '<span class="label-icon"><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M7.70708 2.29289L1.29497 8.705C0.904444 9.09553 0.904444 9.72869 1.29497 10.1192L5.88075 14.705C6.27128 15.0955 6.90444 15.0955 7.29497 14.705L13.7071 8.29289C13.8946 8.10536 14 7.851 14 7.58579V3C14 2.44772 13.5523 2 13 2H8.41418C8.14897 2 7.89461 2.10536 7.70708 2.29289ZM10 8C11.1046 8 12 7.10457 12 6C12 4.89543 11.1046 4 10 4C8.89543 4 8 4.89543 8 6C8 7.10457 8.89543 8 10 8Z" fill="#F2C55C"/></svg></span>';
    }
    return '<span class="label-icon"><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><circle cx="4.5" cy="4.5" r="1.8" stroke="currentColor" stroke-width="1.2" fill="none"/><circle cx="10.8" cy="6.2" r="1.8" stroke="currentColor" stroke-width="1.2" fill="none"/><line x1="4.5" y1="6.3" x2="4.5" y2="14" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><path d="M4.5 9.8H9.3C10.13 9.8 10.8 9.13 10.8 8.3V8.0" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg></span>';
  }
</script>

<span class="labels">
  {#each refs as ref}
    <span class={labelClass(ref)}>
      {@html labelIcon(ref)}
      <span>{labelText(ref)}</span>
    </span>
  {/each}
</span>

<style>
  .labels {
    order: 5;
    margin-left: 16px;
    display: inline-flex;
    gap: 5px;
    flex-shrink: 0;
    padding-right: 16px;
    min-width: max-content;
    overflow: visible;
    align-items: center;
  }
  .label {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 0 5px;
    border-radius: 3px;
    font-size: 0.8em;
    font-weight: 500;
    line-height: 1.3;
    white-space: nowrap;
    flex-shrink: 0;
    background: transparent;
  }
  :global(.label-icon) {
    display: inline-flex;
    align-items: center;
    vertical-align: -1px;
    margin-right: 2px;
  }
  .branch {
    color: #3fb950;
    border: 1px solid #238636;
  }
  .remote {
    color: #bc8cff;
    border: 1px solid #8957e5;
  }
  .tag {
    color: #d29922;
    border: 1px solid #9e6a03;
  }
  .head {
    color: #e5a50a;
    border: 1px solid #e5a50a;
    font-weight: 600;
  }
</style>
