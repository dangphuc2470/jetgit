<script lang="ts">
  interface Props {
    commitMessage: string;
    isAmend: boolean;
    isGeneratingAi: boolean;
    recentMessages: string[];
    recentOpen: boolean;
    commitOptionsOpen: boolean;
    onChangeMessage: (msg: string) => void;
    onToggleAmend: (amend: boolean) => void;
    onToggleRecentOpen: () => void;
    onToggleCommitOptions: () => void;
    onSelectRecentMessage: (msg: string) => void;
    onGenerateAi: () => void;
    onCommit: () => void;
    onCommitAndPush: () => void;
  }

  let {
    commitMessage,
    isAmend,
    isGeneratingAi,
    recentMessages,
    recentOpen,
    commitOptionsOpen,
    onChangeMessage,
    onToggleAmend,
    onToggleRecentOpen,
    onToggleCommitOptions,
    onSelectRecentMessage,
    onGenerateAi,
    onCommit,
    onCommitAndPush,
  }: Props = $props();

  let textareaEl: HTMLTextAreaElement | null = $state(null);

  export function focusTextarea(errorPulse = false) {
    if (textareaEl) {
      textareaEl.focus();
      if (errorPulse) {
        textareaEl.classList.add('error-pulse');
        setTimeout(() => textareaEl?.classList.remove('error-pulse'), 1000);
      }
    }
  }
</script>

<div class="commit-box" style="flex: 1; height: 100%;">
  <div class="commit-options-bar">
    <div class="amend-tools-group">
      <label class="checkbox-label amend-label" title="Amend previous commit" data-tooltip="Amend previous commit">
        <input
          type="checkbox"
          id="chk-amend"
          class="amend-chk"
          checked={isAmend}
          onchange={(e) => onToggleAmend((e.target as HTMLInputElement).checked)}
        />
        <span>Amend</span>
      </label>
      <div class="commit-icon-tools">
        <button
          type="button"
          class="tool-btn-sm"
          id="btn-recent-msgs"
          title="Recent Commit Messages (Cmd+M)"
          data-tooltip="Recent Commit Messages"
          data-shortcut="Cmd+M"
          onclick={(e) => {
            e.stopPropagation();
            onToggleRecentOpen();
          }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
            <circle cx="8" cy="8" r="6.5"/>
            <polyline points="8 4 8 8 10.5 9.5"/>
          </svg>
        </button>
        <button
          type="button"
          class={`tool-btn-sm ${isGeneratingAi ? 'spinning' : ''}`}
          id="btn-generate-ai"
          title={isGeneratingAi ? 'Generating commit message with AI... Please wait.' : 'Generate Commit Message with AI'}
          data-tooltip={isGeneratingAi ? 'Generating commit message with AI... Please wait.' : 'Generate Commit Message with AI'}
          disabled={isGeneratingAi}
          onclick={(e) => {
            e.stopPropagation();
            onGenerateAi();
          }}
        >
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style="display:block;">
            <path d="M11.5973 7.65471L13.6882 5.56049C14.1053 5.15406 14.1003 4.49602 13.6948 4.08627L12.0267 2.3136L12.0224 2.30932C11.6123 1.90004 10.942 1.89327 10.5331 2.31079L8.3867 4.44406M11.5973 7.65471L8.3867 4.44406M11.5973 7.65471L5.74041 13.5H2.50036L2.5 10.32L8.3867 4.44406" stroke="currentColor" stroke-miterlimit="10"/>
            <path d="M13.3214 10.1903L13.8295 11.1171C14.0739 11.5622 14.4413 11.9297 14.8901 12.1742L15.8056 12.675C16.0648 12.817 16.0648 13.1845 15.8056 13.3265L14.8901 13.8272C14.4413 14.0717 14.0739 14.4392 13.8295 14.8843L13.3214 15.8111C13.1837 16.063 12.8163 16.063 12.6786 15.8111L12.1705 14.8829C11.9261 14.4378 11.5587 14.0703 11.1113 13.8258L10.1944 13.325C9.93519 13.183 9.93519 12.8155 10.1944 12.6735L11.1099 12.1728C11.5587 11.9283 11.9261 11.5608 12.1705 11.1157L12.6786 10.1889C12.8163 9.93704 13.1837 9.93704 13.3214 10.1889V10.1903Z" fill="#A571E6"/>
          </svg>
        </button>
      </div>
    </div>
  </div>

  <div class="commit-input-wrapper">
    <textarea
      id="commit-message-input"
      bind:this={textareaEl}
      class={isGeneratingAi ? 'ai-generating' : ''}
      placeholder={isGeneratingAi ? 'Generating commit message with AI... Please wait...' : 'Commit message...'}
      value={commitMessage}
      oninput={(e) => onChangeMessage((e.target as HTMLTextAreaElement).value)}
    ></textarea>
    {#if isGeneratingAi}
      <div class="ai-status-bar">
        <span class="ai-status-dot"></span>
        <span>AI is generating commit message...</span>
      </div>
    {/if}
    {#if recentOpen}
      <div class="recent-messages-dropdown" id="recent-dropdown">
        <div class="recent-dropdown-title">Recent Commit Messages</div>
        <div class="recent-list">
          {#if recentMessages.length === 0}
            <div class="recent-msg-empty">No recent commit messages</div>
          {:else}
            {#each recentMessages as msg}
              <div
                class="recent-msg-item"
                data-msg={msg}
                onclick={() => onSelectRecentMessage(msg)}
                role="button"
                tabindex="0"
                onkeydown={(e) => { if (e.key === 'Enter') onSelectRecentMessage(msg); }}
              >
                <span class="recent-clock">🕒</span>
                <span class="recent-text">{msg}</span>
              </div>
            {/each}
          {/if}
        </div>
      </div>
    {/if}
  </div>

  <div class="commit-actions-bar">
    <div class="action-buttons-group">
      <button type="button" class="btn-commit-primary" id="btn-commit" title="Commit" onclick={onCommit}>Commit</button>
      <button type="button" class="btn-commit-secondary" id="btn-commit-push" title="Commit and Push..." onclick={onCommitAndPush}>Commit and Push...</button>
    </div>
    <div class="commit-gear-wrapper">
      <button
        type="button"
        class="tool-btn-sm"
        id="btn-commit-gear"
        title="Before Commit Settings"
        data-tooltip="Before Commit Settings"
        onclick={(e) => {
          e.stopPropagation();
          onToggleCommitOptions();
        }}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style="display:block;">
          <path d="M9.1 4.4L8.6 2H7.4l-.5 2.4-.7.3-2-1.3-.9.8 1.3 2-.2.7-2.4.5v1.2l2.4.5.3.8-1.3 2 .8.8 2-1.3.8.3.4 2.3h1.2l.5-2.4.8-.3 2 1.3.8-.8-1.3-2 .3-.8 2.3-.4V7.4l-2.4-.5-.3-.8 1.3-2-.8-.8-2 1.3-.7-.2zM9.4 1l.5 2.4L12 2.1l2 2-1.4 2.1 2.4.4v2.8l-2.4.5L14 12l-2 2-2.1-1.4-.5 2.4H6.6l-.5-2.4L4 13.9l-2-2 1.4-2.1L1 9.4V6.6l2.4-.5L2.1 4l2-2 2.1 1.4.4-2.4h2.8zm.6 7c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zM8 9c.6 0 1-.4 1-1s-.4-1-1-1-1 .4-1 1 .4 1 1 1z"/>
        </svg>
      </button>
      {#if commitOptionsOpen}
        <div class="commit-gear-dropdown" id="gear-dropdown">
          <div class="gear-title">Before Commit</div>
          <label class="gear-item"><input type="checkbox" class="file-chk tree-chk"/> Reformat code</label>
          <label class="gear-item"><input type="checkbox" class="file-chk tree-chk"/> Rearrange code</label>
          <label class="gear-item"><input type="checkbox" class="file-chk tree-chk"/> Optimize imports</label>
          <label class="gear-item"><input type="checkbox" class="file-chk tree-chk"/> Clean up</label>
          <div class="gear-divider"></div>
          <label class="gear-item"><input type="checkbox" class="file-chk tree-chk"/> Check TODO (0)</label>
        </div>
      {/if}
    </div>
  </div>
</div>
