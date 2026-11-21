<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { postMessage, onMessage } from "$shared/vscodeApi";

  interface SettingsState {
    fontSize: {
      log: number;
      commit: number;
      merge: number;
    };
    ui: {
      advanced: {
        fetchBranch: boolean;
        fetchBranchShallow: boolean;
        trackIntoCurrent: boolean;
      };
    };
    merge: {
      noFastForward: boolean;
    };
  }

  type AdvancedActionKey = "fetchBranch" | "fetchBranchShallow" | "trackIntoCurrent";

  let settings = $state<SettingsState>({
    fontSize: {
      log: 0,
      commit: 0,
      merge: 0,
    },
    ui: {
      advanced: {
        fetchBranch: false,
        fetchBranchShallow: false,
        trackIntoCurrent: false,
      },
    },
    merge: {
      noFastForward: false,
    },
  });

  let loaded = $state(false);
  let unsub: (() => void) | undefined;

  onMount(() => {
    unsub = onMessage((msg: any) => {
      if (msg?.type === "settingsUpdate" && msg.payload) {
        settings = msg.payload;
        loaded = true;
      }
    });
    postMessage("ready");
  });

  onDestroy(() => {
    unsub?.();
  });

  function updateSetting(key: string, value: unknown) {
    postMessage("updateSetting", { key, value });
  }

  function stepFontSize(panel: "log" | "commit" | "merge", delta: number) {
    const current = settings.fontSize[panel];
    let next: number;
    if (current <= 0) {
      next = delta > 0 ? 13 : 0;
    } else {
      next = current + delta;
      if (next < 9) next = 0;
      if (next > 28) next = 28;
    }
    settings.fontSize[panel] = next;
    updateSetting(`fontSize.${panel}`, next);
  }

  function onFontInput(panel: "log" | "commit" | "merge", raw: string) {
    const parsed = parseInt(raw, 10);
    const next = !Number.isFinite(parsed) || parsed <= 0 ? 0 : Math.min(28, Math.max(9, parsed));
    settings.fontSize[panel] = next;
    updateSetting(`fontSize.${panel}`, next);
  }

  function resetFont(panel: "log" | "commit" | "merge") {
    settings.fontSize[panel] = 0;
    updateSetting(`fontSize.${panel}`, 0);
  }

  function toggleAdvancedItem(key: AdvancedActionKey, checked: boolean) {
    settings.ui.advanced[key] = checked;
    updateSetting(`ui.advanced.${key}`, checked);
  }

  function toggleNoFf(checked: boolean) {
    settings.merge.noFastForward = checked;
    updateSetting("merge.noFastForward", checked);
  }
</script>

<div class="settings-page">
  <header class="settings-header">
    <div class="title-block">
      <h1>JetGit Settings</h1>
      <p class="subtitle">Configure panel typography, menu density, and Git merge behaviour. Changes are saved immediately.</p>
    </div>
    <div class="header-actions">
      <button class="btn-secondary" onclick={() => postMessage("openJson")}>
        Open settings.json
      </button>
      <button class="btn-secondary" onclick={() => postMessage("resetAll")}>
        Reset Defaults
      </button>
    </div>
  </header>

  {#if !loaded}
    <div class="loading">Loading settings...</div>
  {:else}
    <section class="card">
      <div class="section-head">
        <h2>Panel Font Sizes</h2>
        <span class="section-hint">Set to 0 to follow VS Code's default editor font size, or pick 9–28 px per panel.</span>
      </div>

      <div class="setting-row">
        <div class="setting-info">
          <div class="setting-label">Jet Log</div>
          <div class="setting-desc">Commit graph, branch sidebar, filter bar, and commit details panel.</div>
        </div>
        <div class="font-control">
          <button class="step-btn" title="Decrease font size" onclick={() => stepFontSize("log", -1)}>−</button>
          <input
            class="num-input"
            type="number"
            min="0"
            max="28"
            value={settings.fontSize.log}
            onchange={(e) => onFontInput("log", (e.currentTarget as HTMLInputElement).value)}
          />
          <button class="step-btn" title="Increase font size" onclick={() => stepFontSize("log", 1)}>+</button>
          {#if settings.fontSize.log === 0}
            <span class="unit-badge">Auto</span>
          {:else}
            <button class="link-btn unit-badge" title="Reset to Auto" onclick={() => resetFont("log")}>Auto</button>
          {/if}
        </div>
      </div>

      <div class="setting-row">
        <div class="setting-info">
          <div class="setting-label">Jet Changes (Commit)</div>
          <div class="setting-desc">Changelists, uncommitted file tree, commit message box, and diff preview.</div>
        </div>
        <div class="font-control">
          <button class="step-btn" title="Decrease font size" onclick={() => stepFontSize("commit", -1)}>−</button>
          <input
            class="num-input"
            type="number"
            min="0"
            max="28"
            value={settings.fontSize.commit}
            onchange={(e) => onFontInput("commit", (e.currentTarget as HTMLInputElement).value)}
          />
          <button class="step-btn" title="Increase font size" onclick={() => stepFontSize("commit", 1)}>+</button>
          {#if settings.fontSize.commit === 0}
            <span class="unit-badge">Auto</span>
          {:else}
            <button class="link-btn unit-badge" title="Reset to Auto" onclick={() => resetFont("commit")}>Auto</button>
          {/if}
        </div>
      </div>

      <div class="setting-row">
        <div class="setting-info">
          <div class="setting-label">Merge, Diff &amp; Dialogs</div>
          <div class="setting-desc">3-Way Merge tool, side-by-side Diff Review, Interactive Rebase, and Push dialog.</div>
        </div>
        <div class="font-control">
          <button class="step-btn" title="Decrease font size" onclick={() => stepFontSize("merge", -1)}>−</button>
          <input
            class="num-input"
            type="number"
            min="0"
            max="28"
            value={settings.fontSize.merge}
            onchange={(e) => onFontInput("merge", (e.currentTarget as HTMLInputElement).value)}
          />
          <button class="step-btn" title="Increase font size" onclick={() => stepFontSize("merge", 1)}>+</button>
          {#if settings.fontSize.merge === 0}
            <span class="unit-badge">Auto</span>
          {:else}
            <button class="link-btn unit-badge" title="Reset to Auto" onclick={() => resetFont("merge")}>Auto</button>
          {/if}
        </div>
      </div>
    </section>

    <section class="card">
      <div class="section-head">
        <h2>Advanced Options</h2>
        <span class="section-hint">Extra actions in remote branch context menus. Disabled by default to keep menus clean like Android Studio.</span>
      </div>

      <label class="setting-row clickable">
        <div class="setting-info">
          <div class="setting-label"><code>Fetch Branch</code></div>
          <div class="setting-desc">Fetch updates for a single remote branch instead of fetching the entire remote.</div>
        </div>
        <div class="toggle-wrap">
          <input
            type="checkbox"
            checked={settings.ui.advanced.fetchBranch}
            onchange={(e) => toggleAdvancedItem("fetchBranch", (e.currentTarget as HTMLInputElement).checked)}
          />
        </div>
      </label>

      <label class="setting-row clickable">
        <div class="setting-info">
          <div class="setting-label"><code>Fetch (--depth=1)</code></div>
          <div class="setting-desc">Show shallow-fetch (<code>--depth=1</code>) on remote and remote branch context menus.</div>
        </div>
        <div class="toggle-wrap">
          <input
            type="checkbox"
            checked={settings.ui.advanced.fetchBranchShallow}
            onchange={(e) => toggleAdvancedItem("fetchBranchShallow", (e.currentTarget as HTMLInputElement).checked)}
          />
        </div>
      </label>

      <label class="setting-row clickable">
        <div class="setting-info">
          <div class="setting-label"><code>Track Upstream Actions</code></div>
          <div class="setting-desc">Show <code>Track into '&lt;current&gt;'</code> and <code>Track All Local Branches</code> on remote menus.</div>
        </div>
        <div class="toggle-wrap">
          <input
            type="checkbox"
            checked={settings.ui.advanced.trackIntoCurrent}
            onchange={(e) => toggleAdvancedItem("trackIntoCurrent", (e.currentTarget as HTMLInputElement).checked)}
          />
        </div>
      </label>
    </section>

    <section class="card">
      <div class="section-head">
        <h2>Merge &amp; Git Behaviour</h2>
        <span class="section-hint">Control how Git operations behave across JetGit panels.</span>
      </div>

      <label class="setting-row clickable">
        <div class="setting-info">
          <div class="setting-label">Always create merge commit (<code>--no-ff</code>)</div>
          <div class="setting-desc">
            Prevent fast-forward merges so every merged branch preserves an explicit merge commit in history.
          </div>
        </div>
        <div class="toggle-wrap">
          <input
            type="checkbox"
            checked={settings.merge.noFastForward}
            onchange={(e) => toggleNoFf((e.currentTarget as HTMLInputElement).checked)}
          />
        </div>
      </label>
    </section>
  {/if}
</div>

<style>
  :global(html), :global(body) {
    margin: 0;
    padding: 0;
    background: var(--vscode-editor-background);
    color: var(--vscode-foreground);
    font-family: var(--vscode-font-family, system-ui, sans-serif);
    font-size: var(--vscode-font-size, 13px);
  }

  .settings-page {
    max-width: 780px;
    margin: 0 auto;
    padding: 24px 28px 40px;
    display: flex;
    flex-direction: column;
    gap: 18px;
    box-sizing: border-box;
  }

  .settings-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--vscode-panel-border, rgba(128, 128, 128, 0.25));
    flex-wrap: wrap;
  }

  .title-block h1 {
    margin: 0 0 4px;
    font-size: 20px;
    font-weight: 600;
    color: var(--vscode-foreground);
  }

  .subtitle {
    margin: 0;
    font-size: 12px;
    color: var(--vscode-descriptionForeground);
  }

  .header-actions {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-shrink: 0;
  }

  .btn-secondary {
    background: var(--vscode-button-secondaryBackground, rgba(128, 128, 128, 0.2));
    color: var(--vscode-button-secondaryForeground, var(--vscode-foreground));
    border: 1px solid var(--vscode-panel-border, transparent);
    border-radius: 4px;
    padding: 5px 11px;
    font-size: 12px;
    cursor: pointer;
  }

  .btn-secondary:hover {
    background: var(--vscode-button-secondaryHoverBackground, rgba(128, 128, 128, 0.3));
  }

  .loading {
    padding: 32px 0;
    text-align: center;
    color: var(--vscode-descriptionForeground);
  }

  .card {
    background: var(--vscode-sideBar-background, rgba(128, 128, 128, 0.06));
    border: 1px solid var(--vscode-panel-border, rgba(128, 128, 128, 0.22));
    border-radius: 6px;
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .section-head {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding-bottom: 6px;
    border-bottom: 1px solid var(--vscode-panel-border, rgba(128, 128, 128, 0.16));
  }

  .section-head h2 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
  }

  .section-hint {
    font-size: 11.5px;
    color: var(--vscode-descriptionForeground);
  }

  .setting-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    padding: 6px 4px;
    border-radius: 4px;
  }

  .setting-row.clickable {
    cursor: pointer;
  }

  .setting-row.clickable:hover {
    background: var(--vscode-list-hoverBackground, rgba(128, 128, 128, 0.1));
  }

  .setting-info {
    display: flex;
    flex-direction: column;
    gap: 3px;
    flex: 1;
    min-width: 0;
  }

  .setting-label {
    font-weight: 500;
    font-size: 13px;
  }

  .setting-desc {
    font-size: 11.5px;
    color: var(--vscode-descriptionForeground);
    line-height: 1.4;
  }

  .setting-desc code, .setting-label code {
    font-family: var(--vscode-editor-font-family, monospace);
    font-size: 11px;
    padding: 1px 4px;
    border-radius: 3px;
    background: var(--vscode-textCodeBlock-background, rgba(128, 128, 128, 0.16));
  }

  .font-control {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }

  .step-btn {
    width: 24px;
    height: 24px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--vscode-button-secondaryBackground, rgba(128, 128, 128, 0.2));
    color: var(--vscode-button-secondaryForeground, var(--vscode-foreground));
    border: 1px solid var(--vscode-input-border, transparent);
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    line-height: 1;
  }

  .step-btn:hover {
    background: var(--vscode-button-secondaryHoverBackground, rgba(128, 128, 128, 0.35));
  }

  .num-input {
    width: 52px;
    height: 24px;
    box-sizing: border-box;
    text-align: center;
    background: var(--vscode-input-background);
    color: var(--vscode-input-foreground);
    border: 1px solid var(--vscode-input-border, rgba(128, 128, 128, 0.35));
    border-radius: 4px;
    font-size: 12px;
    outline: none;
  }

  .num-input:focus {
    border-color: var(--vscode-focusBorder);
  }

  .unit-badge {
    min-width: 38px;
    text-align: center;
    font-size: 11.5px;
    color: var(--vscode-descriptionForeground);
  }

  .link-btn {
    background: transparent;
    border: none;
    color: var(--vscode-textLink-foreground, #3794ff);
    cursor: pointer;
    font-size: 11.5px;
    padding: 2px 4px;
  }

  .link-btn:hover {
    text-decoration: underline;
  }

  .toggle-wrap {
    flex-shrink: 0;
    display: flex;
    align-items: center;
  }

  .toggle-wrap input[type="checkbox"] {
    width: 16px;
    height: 16px;
    cursor: pointer;
    accent-color: var(--vscode-focusBorder, #007fd4);
  }
</style>
