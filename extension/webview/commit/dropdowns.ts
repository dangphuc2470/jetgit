import { escapeHtml, escapeAttr } from '../shared/escape';
import { state } from './state';

export function renderRecentMessagesDropdown(): string {
  let listHtml = state.recentMessages.map(msg => `
    <div class="recent-msg-item" data-msg="${escapeAttr(msg)}">
      <span class="recent-clock">🕒</span>
      <span class="recent-text">${escapeHtml(msg)}</span>
    </div>
  `).join('');

  if (state.recentMessages.length === 0) {
    listHtml = '<div class="recent-msg-empty">No recent commit messages</div>';
  }

  return `
    <div class="recent-messages-dropdown" id="recent-dropdown">
      <div class="recent-dropdown-title">Recent Commit Messages</div>
      <div class="recent-list">${listHtml}</div>
    </div>
  `;
}

export function renderCommitGearDropdown(): string {
  return `
    <div class="commit-gear-dropdown" id="gear-dropdown">
      <div class="gear-title">Before Commit</div>
      <label class="gear-item"><input type="checkbox" class="file-chk tree-chk"/> Reformat code</label>
      <label class="gear-item"><input type="checkbox" class="file-chk tree-chk"/> Rearrange code</label>
      <label class="gear-item"><input type="checkbox" class="file-chk tree-chk"/> Optimize imports</label>
      <label class="gear-item"><input type="checkbox" class="file-chk tree-chk"/> Clean up</label>
      <div class="gear-divider"></div>
      <label class="gear-item"><input type="checkbox" class="file-chk tree-chk"/> Check TODO (0)</label>
    </div>
  `;
}

export function renderViewOptionsDropdown(): string {
  return `
    <div class="as-view-options-menu" id="view-options-menu">
      <div class="as-menu-section-header">Group By</div>
      <div class="as-menu-item ${state.groupByDirectory ? 'active' : ''}" data-action="toggle-groupBy-directory">
        <div class="as-menu-item-left">
          <span class="as-menu-check">${state.groupByDirectory ? '✓' : ''}</span>
          <span class="as-menu-label">Directory</span>
        </div>
        <span class="as-menu-shortcut">^P</span>
      </div>
      <div class="as-menu-item ${state.groupByModule ? 'active' : ''}" data-action="toggle-groupBy-module">
        <div class="as-menu-item-left">
          <span class="as-menu-check">${state.groupByModule ? '✓' : ''}</span>
          <span class="as-menu-label">Module</span>
        </div>
      </div>
      <div class="as-menu-section-header" style="margin-top: 6px;">Show</div>
      <div class="as-menu-item ${state.showIgnoredFiles !== false ? 'active' : ''}" data-action="toggle-ignored">
        <div class="as-menu-item-left">
          <span class="as-menu-check">${state.showIgnoredFiles !== false ? '✓' : ''}</span>
          <span class="as-menu-label">Ignored Files</span>
        </div>
      </div>
    </div>
  `;
}
