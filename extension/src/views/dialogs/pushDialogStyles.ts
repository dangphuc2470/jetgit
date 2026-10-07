export const pushDialogStyles = `
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
    .as-push-card {
      width: 100vw;
      height: 100vh;
      display: flex;
      flex-direction: column;
      background: var(--vscode-editor-background, #1e1f22);
    }
    .as-body {
      display: flex;
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }
    .as-col-left {
      width: 45%;
      min-width: 180px;
      max-width: calc(100% - 180px);
      border-right: 1px solid var(--vscode-panel-border, #323438);
      display: flex;
      flex-direction: column;
      background: var(--vscode-sideBar-background, var(--vscode-editor-background, #1e1f22));
      overflow: hidden;
      position: relative;
    }
    .as-splitter {
      width: 6px;
      margin-left: -3px;
      margin-right: -3px;
      cursor: col-resize;
      background: transparent;
      position: relative;
      z-index: 50;
      flex-shrink: 0;
      transition: background-color 0.12s ease;
    }
    .as-splitter:hover,
    .as-splitter.dragging {
      background: var(--vscode-focusBorder, #3574f0);
    }
    .as-col-right {
      flex: 1;
      min-width: 180px;
      display: flex;
      flex-direction: column;
      background: var(--vscode-editor-background, #1e1f22);
      overflow: hidden;
      position: relative;
      z-index: 10;
    }
    .as-branch-header {
      display: flex;
      align-items: center;
      padding: 7px 12px;
      background: var(--vscode-button-background, #2675bf);
      color: var(--vscode-button-foreground, #ffffff);
      font-size: 12.5px;
      font-weight: 500;
      cursor: pointer;
      gap: 4px;
      overflow: visible;
      position: relative;
      z-index: 5;
      flex-shrink: 0;
      white-space: nowrap;
    }
    .as-commit-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px 6px 26px;
      cursor: pointer;
      font-size: 12.5px;
      color: var(--vscode-editor-foreground, #dfe1e5);
    }
    .as-commit-item:hover {
      background: var(--vscode-list-hoverBackground, rgba(255, 255, 255, 0.05));
    }
    .as-commit-item.selected {
      background: var(--vscode-list-activeSelectionBackground, #2e436e) !important;
      color: var(--vscode-list-activeSelectionForeground, #ffffff) !important;
    }
    .as-file-item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 8px 4px 24px;
      font-size: 12.5px;
      color: var(--vscode-editor-foreground, #dfe1e5);
      cursor: pointer;
      border-radius: 3px;
    }
    .as-file-item:hover {
      background: var(--vscode-list-hoverBackground, rgba(255, 255, 255, 0.05));
    }
    .as-file-item.selected {
      background: var(--vscode-list-activeSelectionBackground, #2e436e) !important;
      color: var(--vscode-list-activeSelectionForeground, #ffffff) !important;
    }
    .as-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 16px;
      background: var(--vscode-editorGroupHeader-tabsBackground, var(--vscode-sideBar-background, #2b2d30));
      border-top: 1px solid var(--vscode-panel-border, #323438);
      height: 48px;
      flex-shrink: 0;
    }
    .as-btn {
      background: var(--vscode-button-secondaryBackground, #2b2d30);
      color: var(--vscode-button-secondaryForeground, #dfe1e5);
      border: 1px solid var(--vscode-button-border, #4e5157);
      border-radius: 4px;
      padding: 6px 16px;
      font-size: 12.5px;
      cursor: pointer;
      transition: background 0.15s;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex-shrink: 0;
    }
    .as-btn:hover {
      background: var(--vscode-button-secondaryHoverBackground, #35373b);
    }
    .as-btn-primary {
      background: var(--vscode-button-background, #3574f0);
      color: var(--vscode-button-foreground, #ffffff);
      border: none;
      padding: 6px 18px;
      font-size: 12.5px;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex-shrink: 0;
    }
    .as-btn-primary:hover {
      background: var(--vscode-button-hoverBackground, #3068d8);
    }
    .as-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .as-dropdown {
      position: absolute;
      background: var(--vscode-menu-background, #2b2d30);
      border: 1px solid var(--vscode-menu-border, #43454a);
      border-radius: 4px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.6);
      z-index: 999;
      min-width: 140px;
      padding: 4px 0;
    }
    .as-dropdown-item {
      padding: 6px 12px;
      font-size: 12px;
      color: var(--vscode-menu-foreground, #dfe1e5);
      cursor: pointer;
    }
    .as-dropdown-item:hover {
      background: var(--vscode-menu-selectionBackground, #3574f0);
      color: var(--vscode-menu-selectionForeground, #ffffff);
    }
    input[type="checkbox"] {
      appearance: none;
      -webkit-appearance: none;
      width: 14px;
      height: 14px;
      border: 1px solid var(--vscode-checkbox-border, #6C707E);
      border-radius: 2.5px;
      background: transparent !important;
      background-color: transparent !important;
      cursor: pointer;
      position: relative;
      outline: none;
      margin: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      vertical-align: middle;
      box-sizing: border-box;
      transition: border-color 0.12s ease, background-color 0.12s ease;
    }
    input[type="checkbox"]:hover {
      border-color: var(--vscode-focusBorder, #CED0D6);
      background-color: rgba(255, 255, 255, 0.06) !important;
    }
    input[type="checkbox"]:checked {
      background: transparent !important;
      background-color: transparent !important;
      border-color: var(--vscode-focusBorder, #CED0D6);
    }
    input[type="checkbox"]:checked::after {
      content: '';
      position: absolute;
      top: 1px;
      left: 4px;
      width: 3.5px;
      height: 7px;
      border: solid var(--vscode-editor-foreground, #CED0D6);
      border-width: 0 1.8px 1.8px 0;
      transform: rotate(45deg);
    }
`;
