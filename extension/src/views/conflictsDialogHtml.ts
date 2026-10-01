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
<body>
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
      const ext = (filename || '').split('.').pop().toLowerCase();
      if (ext === 'dart') {
        return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M4.5 12L12 4.5L19.5 12L12 19.5L4.5 12Z" stroke="#4fc3f7" stroke-width="2.5" fill="#0288d1"/><circle cx="12" cy="12" r="3" fill="#ffffff"/></svg>';
      }
      if (ext === 'ts' || ext === 'js' || ext === 'tsx' || ext === 'jsx') {
        return '<svg width="14" height="14" viewBox="0 0 16 16" fill="#64b5f6"><rect x="2" y="2" width="12" height="12" rx="2" fill="#1565c0"/><text x="4" y="11" fill="#ffffff" font-size="8" font-weight="bold">TS</text></svg>';
      }
      return '<svg width="14" height="14" viewBox="0 0 16 16" fill="#90a4ae"><path d="M3 2h7l3 3v9H3V2z" fill="#37474f" stroke="#78909c" stroke-width="1.2"/><path d="M10 2v3h3" fill="none" stroke="#78909c" stroke-width="1.2"/></svg>';
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

    renderTable();
  </script>
</body>
</html>`;
}
