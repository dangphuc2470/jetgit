import { pushDialogStyles } from './dialogs/pushDialogStyles';
import { getFileIconScript } from './dialogs/fileIconScript';
import { getPushDialogScript } from './dialogs/pushDialogScript';

export function getPushDialogHtml(rawPushInfo: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Push Commits</title>
  <style>
${pushDialogStyles}
  </style>
</head>
<body data-vscode-context='{"preventDefaultContextMenuItems": true}'>
  <div class="as-push-card">
    <div class="as-body" id="as-body-container">
      <!-- Left Column: Commits -->
      <div class="as-col-left" id="as-col-left">
        <div id="push-branch-header" class="as-branch-header">
          <span id="push-current-branch" style="font-weight:600;white-space:nowrap;"></span>
          <span style="opacity:0.7;margin:0 2px;">&rarr;</span>
          <div style="display:inline-flex;align-items:center;gap:2px;position:relative;">
            <span id="push-remote-label" title="Click to change remote" style="color:#ffffff;font-weight:600;cursor:pointer;border-bottom:1px dashed rgba(255,255,255,0.7);padding:0 2px;">origin</span>
            <div id="push-remote-dropdown" class="as-dropdown" style="display:none;top:26px;left:0;"></div>
          </div>
          <span style="opacity:0.7;margin:0 2px;">:</span>
          <span id="push-target-branch-display" title="Click to edit remote branch name" style="color:#d0e3ff;text-decoration:underline;cursor:pointer;font-weight:500;white-space:nowrap;padding:1px 4px;border-radius:3px;"></span>
          <input id="push-target-branch-input" type="text" style="display:none;background:var(--vscode-input-background, #1e1f22);color:var(--vscode-input-foreground, #ffffff);border:1.5px solid var(--vscode-focusBorder, #3574f0);border-radius:3px;padding:2px 6px;font-size:12px;outline:none;width:150px;">
          <span id="push-new-badge" style="background:rgba(255,255,255,0.22);color:#ffffff;font-size:10.5px;padding:1px 5px;border-radius:3px;margin-left:auto;white-space:nowrap;display:none;">New</span>
        </div>
        <div id="push-commits-container" style="flex:1;min-height:0;overflow-y:auto;padding:4px 0;"></div>
      </div>

      <!-- Splitter / Resizer -->
      <div class="as-splitter" id="as-splitter" title="Drag to resize"></div>

      <!-- Right Column: Files -->
      <div class="as-col-right" id="as-col-right">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:7px 12px;background:var(--vscode-sideBarSectionHeader-background, var(--vscode-sideBar-background, #26282b));border-bottom:1px solid var(--vscode-panel-border, #323438);flex-shrink:0;position:relative;z-index:10;">
          <div style="display:flex;align-items:center;gap:6px;font-size:12.5px;font-weight:600;color:var(--vscode-editor-foreground, #dfe1e5);">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="#c49000"><path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h3.879a1.5 1.5 0 0 1 1.06.44l1.122 1.12A.5.5 0 0 0 8.92 4H13.5A1.5 1.5 0 0 1 15 5.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 12.5v-9z"/></svg>
            <span id="push-repo-name">Repository</span>
            <span id="push-files-count" style="color:var(--vscode-descriptionForeground, #808080);font-size:11.5px;font-weight:normal;"></span>
          </div>
        </div>
        <div id="push-files-container" style="flex:1;min-height:0;overflow-y:auto;padding:6px 8px;"></div>
      </div>
    </div>

    <!-- Footer -->
    <div class="as-footer">
      <div style="display:flex;align-items:center;gap:12px;">
        <label style="display:inline-flex;align-items:center;gap:6px;font-size:12.5px;color:var(--vscode-editor-foreground, #dfe1e5);cursor:pointer;">
          <input type="checkbox" id="chk-push-tags" style="width:14px;height:14px;cursor:pointer;">
          <span>Push tags:</span>
        </label>
        <select id="sel-push-tags" style="background:var(--vscode-dropdown-background, #1e1f22);color:var(--vscode-dropdown-foreground, #dfe1e5);border:1px solid var(--vscode-dropdown-border, #4e5157);border-radius:3px;padding:3px 6px;font-size:12px;outline:none;">
          <option value="all">All</option>
          <option value="current">Current branch</option>
        </select>
      </div>

      <div style="display:flex;align-items:center;gap:10px;position:relative;">
        <button id="btn-push-cancel" class="as-btn">Cancel</button>
        <div style="display:inline-flex;border-radius:4px;overflow:hidden;box-shadow:0 2px 6px rgba(0,0,0,0.3);">
          <button id="btn-push-submit" class="as-btn-primary">Push</button>
          <button id="btn-push-menu-trigger" class="as-btn-primary" style="border-left:1px solid rgba(255,255,255,0.25);padding:6px 8px;font-size:11px;" title="Push Options">▼</button>
        </div>
        <div id="push-dropdown-menu" class="as-dropdown" style="display:none;bottom:36px;right:0;min-width:180px;">
          <div id="btn-force-push-opt" class="as-dropdown-item">Force Push (no-verify)...</div>
        </div>
      </div>
    </div>
  </div>

  <script>
${getFileIconScript}
${getPushDialogScript(rawPushInfo)}
  </script>
</body>
</html>`;
}
