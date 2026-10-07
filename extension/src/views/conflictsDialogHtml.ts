export function getConflictsDialogHtml(rawConflictInfo: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resolve Conflicts</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: var(--vscode-editor-background, #1e1f22);
      color: var(--vscode-editor-foreground, #dfe1e5);
      font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif);
      font-size: var(--vscode-font-size, 13px);
      user-select: none;
    }
    .as-dialog-container {
      width: 100vw;
      height: 100vh;
      display: flex;
      flex-direction: column;
      background: var(--vscode-editor-background, #1e1f22);
    }
    .as-banner {
      padding: 14px 20px 10px;
      font-size: 13px;
      color: var(--vscode-editor-foreground, #dfe1e5);
      flex-shrink: 0;
    }
    .as-content-area {
      display: flex;
      flex: 1;
      min-height: 0;
      padding: 0 20px 14px;
      gap: 16px;
    }
    .as-table-box {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      border: 1px solid var(--vscode-panel-border, #43454a);
      border-radius: 4px;
      background: var(--vscode-editor-background, #1e1f22);
      overflow: hidden;
    }
    .as-table-header {
      display: flex;
      background: var(--vscode-sideBarSectionHeader-background, var(--vscode-sideBar-background, #2b2d30));
      border-bottom: 1px solid var(--vscode-panel-border, #3c3f41);
      padding: 7px 12px;
      font-size: 12px;
      font-weight: 600;
      color: var(--vscode-descriptionForeground, #9aa0a6);
      flex-shrink: 0;
    }
    .as-col-name {
      flex: 2;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .as-col-yours {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .as-col-theirs {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .as-table-body {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
    }
    .as-conflict-row {
      display: flex;
      align-items: center;
      padding: 6px 12px;
      font-size: 12.5px;
      cursor: pointer;
      user-select: none;
      transition: background 0.1s;
    }
    .as-conflict-row:hover {
      background: var(--vscode-list-hoverBackground, rgba(255, 255, 255, 0.05));
    }
    .as-conflict-row.selected {
      background: var(--vscode-list-activeSelectionBackground, #2675bf) !important;
      color: var(--vscode-list-activeSelectionForeground, #ffffff) !important;
    }
    .as-action-panel {
      width: 130px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding-top: 2px;
      flex-shrink: 0;
    }
    .as-btn {
      background: var(--vscode-button-secondaryBackground, #2b2d30);
      color: var(--vscode-button-secondaryForeground, #dfe1e5);
      border: 1px solid var(--vscode-button-border, #4e5157);
      border-radius: 4px;
      padding: 7px 14px;
      font-size: 12.5px;
      cursor: pointer;
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex-shrink: 0;
      transition: background 0.15s;
    }
    .as-btn:hover {
      background: var(--vscode-button-secondaryHoverBackground, #35373b);
    }
    .as-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .as-btn-primary {
      background: var(--vscode-button-background, #3574f0);
      color: var(--vscode-button-foreground, #ffffff);
      border: none;
      border-radius: 4px;
      padding: 7px 14px;
      font-size: 12.5px;
      font-weight: 600;
      cursor: pointer;
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex-shrink: 0;
      transition: background 0.15s;
    }
    .as-btn-primary:hover {
      background: var(--vscode-button-hoverBackground, #3068d8);
    }
    .as-btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .as-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 20px 14px;
      background: var(--vscode-editorGroupHeader-tabsBackground, var(--vscode-sideBar-background, #2b2d30));
      border-top: 1px solid var(--vscode-panel-border, #323438);
      flex-shrink: 0;
    }
  </style>
</head>
<body data-vscode-context='{"preventDefaultContextMenuItems": true}'>
  <div class="as-dialog-container">
    <div class="as-banner">
      The following files have unresolved conflicts. You need to resolve them before continuing.
    </div>

    <div class="as-content-area">
      <div class="as-table-box">
        <div class="as-table-header">
          <div class="as-col-name">Name</div>
          <div class="as-col-yours" id="lbl-yours">Yours</div>
          <div class="as-col-theirs" id="lbl-theirs">Theirs</div>
        </div>
        <div class="as-table-body" id="conflict-table-body"></div>
      </div>

      <div class="as-action-panel">
        <button id="btn-act-yours" class="as-btn">Accept Yours</button>
        <button id="btn-act-theirs" class="as-btn">Accept Theirs</button>
        <button id="btn-act-merge" class="as-btn-primary" style="margin-top:4px;">Merge...</button>
      </div>
    </div>

    <div class="as-footer">
      <label style="display:inline-flex;align-items:center;gap:6px;font-size:12.5px;color:var(--vscode-editor-foreground, #dfe1e5);cursor:pointer;">
        <input type="checkbox" id="chk-group-dir" style="accent-color:var(--vscode-focusBorder, #3574f0);cursor:pointer;width:14px;height:14px;margin:0;">
        <span>Group files by directory</span>
      </label>
      <button id="btn-dialog-close" class="as-btn" style="padding:6px 20px;">Close</button>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    let conflictInfo = ${rawConflictInfo};
    let conflicts = [...(conflictInfo.conflicts || [])];
    let selectedPath = conflicts.length > 0 ? conflicts[0].path : null;
    let groupByDir = false;

    const tableBody = document.getElementById('conflict-table-body');
    const chkGroup = document.getElementById('chk-group-dir');
    const btnAcceptYours = document.getElementById('btn-act-yours');
    const btnAcceptTheirs = document.getElementById('btn-act-theirs');
    const btnMerge = document.getElementById('btn-act-merge');
    const btnClose = document.getElementById('btn-dialog-close');
    const lblYours = document.getElementById('lbl-yours');
    const lblTheirs = document.getElementById('lbl-theirs');

    function escapeHtml(str) {
      if (!str) return '';
      return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    function escapeAttr(str) {
      return escapeHtml(str);
    }

    function getFileIcon(filename) {
      if (!filename) return '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="2.5" y="2.5" width="11" height="11" rx="1.5" fill="#2B2D30" stroke="#7F848E"/><path d="M7.325 9.03c0-.227.039-.425.115-.595.08-.173.175-.32.285-.44.114-.123.26-.263.44-.42.16-.14.285-.257.375-.35.094-.097.17-.208.23-.335.064-.127.095-.268.095-.425 0-.25-.076-.453-.23-.61-.153-.16-.356-.24-.61-.24-.28 0-.505.09-.675.27-.166.18-.248.415-.245.705H5.725c0-.46.094-.855.28-1.185.187-.333.454-.587.8-.76.35-.177.762-.265 1.235-.265.457 0 .854.082 1.19.245.337.163.596.395.776.695.18.297.268.647.265 1.05 0 .303-.048.565-.145.785-.097.22-.212.4-.345.54-.134.14-.309.298-.525.475-.15.12-.269.22-.355.3a.96.96 0 00-.21.275c-.054.1-.08.212-.08.335v.175H7.325V9.03zm1.415 2.47H7.24V10h1.5v1.5z" fill="#7F848E"/></svg>';
      const base = filename.toLowerCase();
      const ext = base.split('.').pop();
      if (ext === 'dart') {
        return '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M3.379 10.272L3.373 3.374L1.191 7.926c-.255.542-.363 1.206.382 1.95l2.138 2.138c-.379-.379-.327-.997-.332-1.742zM12.526 4.223l-.511-.512c-.379-.379-.997-.327-1.743-.332L3.373 3.374 12 12h3l.001-5.303-2.475-2.474z" fill="#01579B"/><path d="M3.374 3.373l6.897.006c.088.001.173 0 .257 0 .631-.001 1.152-.003 1.487.332l-2.138-2.138C9.133.829 8.469.936 7.925 1.191L3.374 3.373z" fill="#29B6F6"/><path d="M12 12L3.374 3.373l.006 6.898c.001.088 0 .173 0 .257-.001.631-.003 1.152.332 1.486l.51.512 2.474 2.474H12V12z" fill="#29B6F6"/></svg>';
      }
      if (ext === 'kt' || ext === 'kts') {
        return '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M13.334 12.631c.336.309.118.869-.338.869H3c-.276 0-.5-.224-.5-.5V3c0-.276.224-.5.5-.5h9.996c.456 0 .674.56.338.869L8.683 7.631a.508.508 0 000 .738l4.651 4.262z" fill="#2F2936"/><path fill-rule="evenodd" clip-rule="evenodd" d="M2 3c0-.552.448-1 1-1h9.996c.912 0 1.348 1.121.676 1.737L9.021 8l4.651 4.263c.672.616.236 1.737-.676 1.737H3c-.552 0-1-.448-1-1V3zm10.996 0L3 3v10h9.996L8.345 8.737a1.008 1.008 0 010-1.474L12.996 3z" fill="#A571E6"/></svg>';
      }
      if (ext === 'gradle') {
        return '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M14.894 3.545c-.362-.756-1.556-1.65-2.893-.481m2.893.481c.463.881-.331 2.525-1.931 2.525-2.086 0-4.275-3.457-9.039-1.108-.421.207-.608.701-.464 1.148l.116.36m11.318-2.925s1.335 2.815-2.33 5.557c-1.033.773-1.411 2.292-1.45 3.644a.1.1 0 01-.1.098H9.873a.1.1 0 01-.1-.07c-.172-.64-.756-1.092-1.435-1.092-.678 0-1.26.456-1.434 1.094a.1.1 0 01-.1.068H5.512a.1.1 0 01-.1-.068c-.174-.638-.756-1.094-1.434-1.094-.678 0-1.26.456-1.434 1.095a.1.1 0 01-.1.068H1.036a.07.07 0 01-.07-.09c-.294-2.844.53-4.951 2.639-6.287m0 0l.581 1.911c.216.635 1.084.74 1.614.443.658-.356 1.264-.777 1.821-1.279" stroke="#CED0D6" stroke-linecap="round"/><path fill-rule="evenodd" clip-rule="evenodd" d="M9.259 7.32a.18.18 0 01-.115-.28c.1-.286.356-.497.668-.53a.81.81 0 01.844.542.8.8 0 01-.206.828.18.18 0 01-.302.012l-.889-.572z" fill="#CED0D6"/></svg>';
      }
      if (ext === 'json') {
        return '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3.988 9.778c.01-.385-.118-.693-.383-.923s-.622-.345-1.072-.345H2V7.43h.533c.45 0 .807-.115 1.072-.345s.393-.538.383-.923L3.958 4.58c-.01-.52.097-.975.322-1.365.23-.39.558-.69.983-.9s.925-.315 1.5-.315H7.5v1.005h-.73c-.52 0-.932.145-1.237.435-.3.285-.448.672-.443 1.162l.03 1.568c.01.51-.128.927-.413 1.252-.285.32-.67.498-1.155.533.485.09.87.3 1.155.63.285.325.423.72.413 1.185l-.03 1.778c-.01.44.123.79.398 1.05.28.265.657.397 1.132.397H7.5V14h-.888c-.535 0-1.005-.1-1.41-.305-.4-.195-.71-.478-.93-.848-.215-.365-.32-.792-.315-1.282l.03-1.792zM12.015 9.778c-.01-.385.118-.693.382-.923s.623-.345 1.073-.345H14V7.43h-.533c-.45 0-.808-.115-1.073-.345s-.392-.538-.382-.923l.03-1.582c.01-.52-.1-.975-.33-1.365-.225-.39-.55-.69-.975-.9s-.925-.315-1.5-.315H8.5v1.005h.732c.52 0 .93.145 1.23.435.305.285.455.672.45 1.162l-.03 1.568c-.01.51.127.927.412 1.252.285.32.67.498 1.155.533-.485.09-.87.3-1.155.63-.285.325-.422.72-.412 1.185l.03 1.778c.01.44-.125.79-.405 1.05-.275.265-.65.397-1.125.397H8.5V14h.89c.535 0 1.002-.1 1.402-.305.405-.195.715-.478.93-.848.22-.365.327-.792.322-1.282l-.03-1.792z" fill="#B589EC"/></svg>';
      }
      if (ext === 'yaml' || ext === 'yml') {
        return '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M11 2c.552 0 1 .448 1 1v6h-1c-.552 0-1 .448-1 1v4H5c-.552 0-1-.448-1-1V6h2c1.105 0 2-.895 2-2V2h3z" fill="#402929"/><path d="M7 4c0 .069-.007.136-.02.201-.094.456-.497.8-.98.8H4.414L7 2.414V4z" fill="#402929"/><path fill-rule="evenodd" clip-rule="evenodd" d="M11 1c1.105 0 2 .895 2 2v6h-1V3c0-.552-.448-1-1-1H8v2c0 1.105-.895 2-2 2H4v7c0 .552.448 1 1 1h5v1H5c-1.105 0-2-.895-2-2V5.414c0-.265.105-.519.293-.707L6.707 1.293C6.895 1.105 7.149 1 7.414 1H11zM4.414 5H6c.552 0 1-.448 1-1V2.414L4.414 5z" fill="#DB5C5C"/><path d="M12.402 16v-2.173L10.647 10.014h1.074l.935 2.075c.071.164.131.325.18.484.05.158.083.281.1.369.021-.088.054-.211.098-.369.05-.159.11-.32.18-.484l.91-2.075h1.066l-1.755 3.813V16h-1.033z" fill="#CED0D6"/></svg>';
      }
      if (ext === 'xml') {
        return '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M10.078 2.44a.82.82 0 00-.42-.738.818.818 0 00-.737.42L5.765 13.56a.82.82 0 00.419.738c.32.088.65-.1.738-.42L10.078 2.44zM5.413 4.667a.747.747 0 01-.094.843L1.96 8.197l3.359 2.687a.747.747 0 01-.75 1.297l-3.944-3.155-.586-.469.586-.468 3.944-3.156a.747.747 0 01.844.094zm5.174 7.06a.747.747 0 01.094-.843L14.04 8.197l-3.359-2.687a.747.747 0 01.75-1.297l3.944 3.155.586.469-.586.468-3.944 3.156a.747.747 0 01-.844-.094z" fill="#C77D55"/></svg>';
      }
      if (ext === 'sh' || ext === 'bash' || ext === 'zsh') {
        return '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="2.5" width="13" height="11" rx="1.5" fill="#43454A" stroke="#CED0D6"/><path d="M4 6l2 2-2 2M7.5 10.5h4" stroke="#CED0D6" stroke-width="1.2"/></svg>';
      }
      if (base === '.gitignore' || ext === 'gitignore') {
        return '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M8.707 1.305a1 1 0 00-1.414 0L6.38 2.217l.955.955c.502-.297 1.159-.23 1.59.201.432.432.499 1.089.202 1.591l1.909 1.909c.501-.297 1.159-.23 1.59.201a1.2 1.2 0 010 1.697 1.2 1.2 0 01-1.697 0 1.206 1.206 0 01-.202-1.59L8.664 5.427a1.14 1.14 0 01-.336.138v4.868c.219.057.426.17.597.342a1.2 1.2 0 010 1.697 1.2 1.2 0 01-1.697 0 1.2 1.2 0 010-1.697c.172-.172.379-.285.598-.342V5.565a1.14 1.14 0 01-.598-.342c-.43-.43-.498-1.087-.203-1.588L6.07 2.68 1.457 7.292a1 1 0 000 1.414l5.988 5.988a1 1 0 001.414 0l5.988-5.988a1 1 0 000-1.414L8.707 1.305z" fill="#F34E29"/></svg>';
      }
      if (ext === 'ts' || ext === 'tsx') {
        return '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="1.5" width="13" height="13" rx="2" fill="#3178C6"/><path d="M7.75 5.25H5.53v6.61H3.91V5.25H1.7V4.07h6.05v1.18zm5 4.61c0-.15-.03-.28-.08-.39-.06-.11-.13-.22-.23-.33-.08-.07-.21-.15-.37-.23-.11-.04-.3-.12-.58-.23l-.17-.06c-.9-.26-1.61-.59-2.14-.98-.47-.4-.71-.9-.71-1.5 0-.65.28-1.17.85-1.56.51-.39 1.19-.57 2.04-.57s1.57.24 2.12.73c.51.46.77 1.02.77 1.68h-1.5c0-.19-.03-.36-.1-.5-.06-.14-.15-.28-.29-.42-.28-.21-.62-.31-1.04-.31-.42 0-.73.08-.96.25-.22.17-.33.4-.33.71 0 .25.13.47.39.66.11.08.28.17.5.25.17.07.43.16.79.27.84.25 1.49.57 1.93.96.44.37.66.9.66 1.58 0 .33-.07.64-.21.91-.12.26-.31.48-.56.64-.53.39-1.22.58-2.08.58s-1.51-.22-2.07-.66c-.65-.51-.95-1.14-.89-1.87h1.56c0 .44.15.79.46 1.04.12.1.29.17.5.23.21.06.43.08.66.08.47 0 .8-.08.98-.25.17-.26.25-.5.25-.71z" fill="#ffffff"/></svg>';
      }
      if (ext === 'js' || ext === 'jsx' || ext === 'mjs' || ext === 'cjs') {
        return '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="1.5" width="13" height="13" rx="2" fill="#F7DF1E"/><path d="M5.03 4.12h1.75v4.91c0 1.06-.25 1.83-.74 2.31-.45.44-1.13.66-2.04.66-.21 0-.43-.01-.68-.04-.25-.04-.45-.1-.6-.16l.19-1.4c.26.12.56.19.91.19.38 0 .67-.1.87-.31.23-.25.35-.66.35-1.24V4.12zm3.3 5.94c.25.14.54.25.87.35.37.11.72.16 1.05.16.41 0 .72-.07.93-.21.21-.15.31-.36.31-.62 0-.26-.1-.47-.29-.62-.19-.16-.53-.33-1.01-.49-1.42-.49-2.12-1.26-2.12-2.31 0-.69.26-1.24.78-1.67.54-.44 1.26-.66 2.19-.66.73 0 1.4.13 2 .39l-.39 1.42-.12-.06c-.25-.1-.45-.16-.6-.21-.29-.08-.58-.12-.89-.12-.37 0-.66.08-.87.23-.19.14-.29.32-.29.56s.11.43.33.58c.16.12.52.3 1.07.52.69.26 1.19.58 1.51.95.33.37.49.82.49 1.36 0 .69-.26 1.24-.78 1.67-.56.48-1.35.72-2.37.72-.4 0-.82-.06-1.26-.16-.34-.07-.65-.16-.93-.29l.39-1.48z" fill="#000000"/></svg>';
      }
      return '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="2.5" y="2.5" width="11" height="11" rx="1.5" fill="#2B2D30" stroke="#7F848E"/><path d="M7.325 9.03c0-.227.039-.425.115-.595.08-.173.175-.32.285-.44.114-.123.26-.263.44-.42.16-.14.285-.257.375-.35.094-.097.17-.208.23-.335.064-.127.095-.268.095-.425 0-.25-.076-.453-.23-.61-.153-.16-.356-.24-.61-.24-.28 0-.505.09-.675.27-.166.18-.248.415-.245.705H5.725c0-.46.094-.855.28-1.185.187-.333.454-.587.8-.76.35-.177.762-.265 1.235-.265.457 0 .854.082 1.19.245.337.163.596.395.776.695.18.297.268.647.265 1.05 0 .303-.048.565-.145.785-.097.22-.212.4-.345.54-.134.14-.309.298-.525.475-.15.12-.269.22-.355.3a.96.96 0 00-.21.275c-.054.1-.08.212-.08.335v.175H7.325V9.03zm1.415 2.47H7.24V10h1.5v1.5z" fill="#7F848E"/></svg>';
    }

    function updateHeaders() {
      lblYours.textContent = 'Yours (' + (conflictInfo.yoursBranch || 'HEAD') + ')';
      lblTheirs.textContent = 'Theirs (' + (conflictInfo.theirsBranch || 'MERGE_HEAD') + ')';
    }

    function renderTable() {
      updateHeaders();

      if (conflicts.length === 0) {
        tableBody.innerHTML = '<div style="padding:40px;text-align:center;color:var(--vscode-descriptionForeground, #808080);font-size:13px;">All conflicts have been resolved!</div>';
        btnAcceptYours.disabled = true;
        btnAcceptTheirs.disabled = true;
        btnMerge.disabled = true;
        return;
      }

      btnAcceptYours.disabled = false;
      btnAcceptTheirs.disabled = false;
      btnMerge.disabled = false;

      if (!selectedPath || !conflicts.some(c => c.path === selectedPath)) {
        selectedPath = conflicts[0].path;
      }

      let html = '';
      if (!groupByDir) {
        conflicts.forEach(file => {
          const isSelected = file.path === selectedPath;
          const statusColor = isSelected ? 'inherit' : 'var(--vscode-editor-foreground, #dfe1e5)';
          const dirColor = isSelected ? 'inherit' : 'var(--vscode-descriptionForeground, #808080)';
          html += '<div class="as-conflict-row' + (isSelected ? ' selected' : '') + '" data-path="' + escapeAttr(file.path) + '">';
          html += '<div class="as-col-name" style="display:flex;align-items:center;gap:6px;">';
          html += getFileIcon(file.name);
          html += '<span style="font-weight:500;color:' + (isSelected ? 'inherit' : '#e06c75') + ';">' + escapeHtml(file.name) + '</span>';
          if (file.dir) {
            html += '<span style="font-size:11.5px;color:' + dirColor + ';margin-left:4px;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(file.dir) + '</span>';
          }
          html += '</div>';
          html += '<div class="as-col-yours" style="color:' + statusColor + ';">' + escapeHtml(file.yours) + '</div>';
          html += '<div class="as-col-theirs" style="color:' + statusColor + ';">' + escapeHtml(file.theirs) + '</div>';
          html += '</div>';
        });
      } else {
        const groups = new Map();
        conflicts.forEach(file => {
          const dir = file.dir || '';
          if (!groups.has(dir)) groups.set(dir, []);
          groups.get(dir).push(file);
        });

        for (const [dir, files] of groups.entries()) {
          html += '<div style="display:flex;align-items:center;gap:6px;padding:4px 8px;background:rgba(255,255,255,0.04);color:var(--vscode-descriptionForeground, #9aa0a6);font-size:11.5px;font-weight:600;">';
          html += '<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h3.879a1.5 1.5 0 0 1 1.06.44l1.122 1.12A.5.5 0 0 0 8.92 4H13.5A1.5 1.5 0 0 1 15 5.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 12.5v-9z"/></svg>';
          html += '<span>' + escapeHtml(dir || 'root') + '</span>';
          html += '</div>';

          files.forEach(file => {
            const isSelected = file.path === selectedPath;
            const statusColor = isSelected ? 'inherit' : 'var(--vscode-editor-foreground, #dfe1e5)';
            html += '<div class="as-conflict-row' + (isSelected ? ' selected' : '') + '" data-path="' + escapeAttr(file.path) + '" style="padding-left:22px;">';
            html += '<div class="as-col-name" style="display:flex;align-items:center;gap:6px;">';
            html += getFileIcon(file.name);
            html += '<span style="font-weight:500;color:' + (isSelected ? 'inherit' : '#e06c75') + ';">' + escapeHtml(file.name) + '</span>';
            html += '</div>';
            html += '<div class="as-col-yours" style="color:' + statusColor + ';">' + escapeHtml(file.yours) + '</div>';
            html += '<div class="as-col-theirs" style="color:' + statusColor + ';">' + escapeHtml(file.theirs) + '</div>';
            html += '</div>';
          });
        }
      }

      tableBody.innerHTML = html;

      tableBody.querySelectorAll('.as-conflict-row').forEach(row => {
        row.addEventListener('click', () => {
          selectedPath = row.getAttribute('data-path');
          renderTable();
        });
        row.addEventListener('dblclick', () => {
          selectedPath = row.getAttribute('data-path');
          doMerge();
        });
      });
    }

    function doMerge() {
      if (!selectedPath) return;
      vscode.postMessage({ type: 'openMergeEditor', payload: { path: selectedPath } });
    }

    function doAcceptYours() {
      if (!selectedPath) return;
      vscode.postMessage({ type: 'acceptYours', payload: { path: selectedPath } });
    }

    function doAcceptTheirs() {
      if (!selectedPath) return;
      vscode.postMessage({ type: 'acceptTheirs', payload: { path: selectedPath } });
    }

    function closeDialog() {
      vscode.postMessage({ type: 'close' });
    }

    btnAcceptYours.addEventListener('click', doAcceptYours);
    btnAcceptTheirs.addEventListener('click', doAcceptTheirs);
    btnMerge.addEventListener('click', doMerge);
    btnClose.addEventListener('click', closeDialog);

    chkGroup.addEventListener('change', () => {
      groupByDir = chkGroup.checked;
      renderTable();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeDialog();
      } else if (e.key === 'Enter') {
        doMerge();
      } else if (e.key === 'ArrowDown') {
        const idx = conflicts.findIndex(c => c.path === selectedPath);
        if (idx < conflicts.length - 1) {
          selectedPath = conflicts[idx + 1].path;
          renderTable();
          e.preventDefault();
        }
      } else if (e.key === 'ArrowUp') {
        const idx = conflicts.findIndex(c => c.path === selectedPath);
        if (idx > 0) {
          selectedPath = conflicts[idx - 1].path;
          renderTable();
          e.preventDefault();
        }
      }
    });

    window.addEventListener('message', (event) => {
      const msg = event.data;
      if (msg.type === 'updateConflictInfo') {
        conflictInfo = msg.payload || {};
        conflicts = [...(conflictInfo.conflicts || [])];
        renderTable();
      }
    });

    window.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    }, true);

    renderTable();
  </script>
</body>
</html>`;
}
