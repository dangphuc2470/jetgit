declare function acquireVsCodeApi(): any;

let api: any = null;

export function getVsCodeApi(): any {
  if (!api && typeof acquireVsCodeApi === 'function') {
    api = acquireVsCodeApi();
  }
  return api;
}

export function postMessage(type: string, payload?: any): void {
  const vscode = getVsCodeApi();
  if (vscode) {
    vscode.postMessage({ type, payload });
  }
}

export function onMessage(handler: (data: any) => void): () => void {
  const listener = (event: MessageEvent) => {
    handler(event.data);
  };
  window.addEventListener('message', listener);
  return () => window.removeEventListener('message', listener);
}

function escapePushHtml(str: any): string {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeAttr(str: any): string {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function getPushFileIcon(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'dart') {
    return '<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M4.5 12L12 4.5L19.5 12L12 19.5L4.5 12Z" stroke="#4fc3f7" stroke-width="2.5" fill="#0288d1"/><circle cx="12" cy="12" r="3" fill="#ffffff"/></svg>';
  }
  if (ext === 'xml') {
    return '<svg width="15" height="15" viewBox="0 0 16 16" fill="#e57373"><path d="M8 2L13 6L8 14L3 6L8 2Z" stroke="#ef5350" stroke-width="1.2" fill="#c62828"/></svg>';
  }
  if (ext === 'json') {
    return '<svg width="15" height="15" viewBox="0 0 16 16" fill="#ce93d8"><text x="2" y="12" fill="#ab47bc" font-size="12" font-weight="bold">{ }</text></svg>';
  }
  return '<svg width="15" height="15" viewBox="0 0 16 16" fill="#90a4ae"><path d="M3 2h7l3 3v9H3V2z" fill="#37474f" stroke="#78909c" stroke-width="1.2"/><path d="M10 2v3h3" fill="none" stroke="#78909c" stroke-width="1.2"/></svg>';
}

export function openCreateBranchDialog(startPoint?: string): void {
  const existing = document.querySelector('.as-branch-dialog-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'as-branch-dialog-overlay';
  overlay.style.cssText = "position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:99999;backdrop-filter:blur(1px);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;";

  const baseName = startPoint || 'HEAD';
  const displayBase = baseName.length > 30 ? baseName.slice(0, 27) + '...' : baseName;

  const card = document.createElement('div');
  card.className = 'as-dialog-card';
  card.style.cssText = 'background:var(--vscode-editorWidget-background,var(--vscode-editor-background,#1e1f22));border:1px solid var(--vscode-widget-border,var(--vscode-panel-border,#393b40));border-radius:6px;box-shadow:0 12px 36px rgba(0,0,0,0.55);width:460px;max-width:92vw;display:flex;flex-direction:column;overflow:hidden;color:var(--vscode-editor-foreground,#dfe1e5);';

  card.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--vscode-sideBar-background,var(--vscode-editorWidget-background,#2b2d30));border-bottom:1px solid var(--vscode-widget-border,var(--vscode-panel-border,#393b40));user-select:none;">
      <span class="as-cb-title" style="font-weight:600;font-size:13px;color:var(--vscode-editor-foreground,#dfe1e5);">
      </span>
      <button class="as-dialog-close-btn as-dot-close" title="Close" type="button" style="background:none;border:none;color:var(--vscode-icon-foreground,var(--vscode-descriptionForeground,#8c9199));width:24px;height:24px;display:flex;align-items:center;justify-content:center;cursor:pointer;border-radius:4px;padding:0;outline:none;">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>
      </button>
    </div>
    <div style="padding:18px 20px 14px 20px;display:flex;flex-direction:column;gap:12px;">
      <div style="display:flex;align-items:center;gap:12px;">
        <label for="as-cb-name" style="font-size:13px;color:var(--vscode-editor-foreground,#dfe1e5);white-space:nowrap;font-weight:500;">Branch Name:</label>
        <input type="text" id="as-cb-name" style="flex:1;background:var(--vscode-input-background,#1e1f22);color:var(--vscode-input-foreground,#dfe1e5);border:1px solid var(--vscode-focusBorder,#3574f0);border-radius:4px;padding:5px 8px;font-size:13px;outline:none;font-family:inherit;">
      </div>
      <div style="display:flex;align-items:center;gap:20px;padding-left:102px;">
        <label style="display:inline-flex;align-items:center;gap:6px;font-size:12.5px;cursor:pointer;color:var(--vscode-editor-foreground,#dfe1e5);user-select:none;">
          <input type="checkbox" id="as-cb-checkout" class="as-custom-chk" checked style="width:14px;height:14px;cursor:pointer;margin:0;">
          <span>Checkout branch</span>
        </label>
        <label style="display:inline-flex;align-items:center;gap:6px;font-size:12.5px;cursor:pointer;color:var(--vscode-editor-foreground,#dfe1e5);user-select:none;">
          <input type="checkbox" id="as-cb-overwrite" class="as-custom-chk" style="width:14px;height:14px;cursor:pointer;margin:0;">
          <span>Overwrite existing branch</span>
        </label>
      </div>
    </div>
    <div style="padding:10px 20px 16px 20px;display:flex;align-items:center;justify-content:flex-end;gap:10px;background:var(--vscode-editorWidget-background,var(--vscode-editor-background,#1e1f22));border-top:1px solid var(--vscode-widget-border,var(--vscode-panel-border,#393b40));">
      <button class="as-dialog-btn" id="as-cb-cancel" style="background:var(--vscode-button-secondaryBackground,#2b2d30);color:var(--vscode-button-secondaryForeground,#dfe1e5);border:1px solid var(--vscode-widget-border,var(--vscode-input-border,#4e5157));border-radius:4px;padding:6px 16px;font-size:12.5px;cursor:pointer;">Cancel</button>
      <button class="as-dialog-btn" id="as-cb-create" style="background:var(--vscode-button-background,#3574f0);color:var(--vscode-button-foreground,#ffffff);border:none;border-radius:4px;padding:6px 18px;font-size:12.5px;font-weight:600;cursor:pointer;">Create</button>
    </div>
  `;

  overlay.appendChild(card);
  document.body.appendChild(overlay);

  const titleEl = card.querySelector('.as-cb-title') as HTMLElement;
  titleEl.textContent = 'New Branch from \'' + displayBase + '\'';
  const nameInput = card.querySelector('#as-cb-name') as HTMLInputElement;
  nameInput.value = '';
  nameInput.placeholder = 'New branch name (e.g. feature/...)';
  const checkoutBox = card.querySelector('#as-cb-checkout') as HTMLInputElement;
  const overwriteBox = card.querySelector('#as-cb-overwrite') as HTMLInputElement;
  const btnCancel = card.querySelector('#as-cb-cancel') as HTMLElement;
  const btnCreate = card.querySelector('#as-cb-create') as HTMLElement;
  const dotClose = card.querySelector('.as-dot-close') as HTMLElement;

  const closeDialog = () => {
    overlay.remove();
    document.removeEventListener('keydown', onKeyDown);
  };

  const submitDialog = () => {
    const name = nameInput.value.trim();
    if (!name) {
      nameInput.focus();
      return;
    }
    const checkout = checkoutBox.checked;
    const force = overwriteBox.checked;
    postMessage('createBranch', { name, startPoint: baseName, checkout, force });
    closeDialog();
  };

  btnCancel.addEventListener('click', closeDialog);
  if (dotClose) dotClose.addEventListener('click', closeDialog);
  btnCreate.addEventListener('click', submitDialog);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeDialog();
  });

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeDialog();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      submitDialog();
    }
  };

  document.addEventListener('keydown', onKeyDown);

  setTimeout(() => {
    nameInput.focus();
    nameInput.select();
  }, 50);
}

export function openRenameBranchDialog(oldName: string): void {
  const existing = document.querySelector('.as-branch-dialog-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'as-branch-dialog-overlay';
  overlay.style.cssText = "position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:99999;backdrop-filter:blur(1px);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;";

  const card = document.createElement('div');
  card.className = 'as-dialog-card';
  card.style.cssText = 'background:var(--vscode-editorWidget-background,var(--vscode-editor-background,#1e1f22));border:1px solid var(--vscode-widget-border,var(--vscode-panel-border,#393b40));border-radius:6px;box-shadow:0 12px 36px rgba(0,0,0,0.55);width:460px;max-width:92vw;display:flex;flex-direction:column;overflow:hidden;color:var(--vscode-editor-foreground,#dfe1e5);';

  card.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--vscode-sideBar-background,var(--vscode-editorWidget-background,#2b2d30));border-bottom:1px solid var(--vscode-widget-border,var(--vscode-panel-border,#393b40));user-select:none;">
      <span class="as-rb-title" style="font-weight:600;font-size:13px;color:var(--vscode-editor-foreground,#dfe1e5);">
      </span>
      <button class="as-dialog-close-btn as-dot-close" title="Close" type="button" style="background:none;border:none;color:var(--vscode-icon-foreground,var(--vscode-descriptionForeground,#8c9199));width:24px;height:24px;display:flex;align-items:center;justify-content:center;cursor:pointer;border-radius:4px;padding:0;outline:none;">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>
      </button>
    </div>
    <div style="padding:18px 20px 14px 20px;display:flex;flex-direction:column;gap:12px;">
      <div style="display:flex;align-items:center;gap:12px;">
        <label for="as-rb-name" style="font-size:13px;color:var(--vscode-editor-foreground,#dfe1e5);white-space:nowrap;font-weight:500;">Branch Name:</label>
        <input type="text" id="as-rb-name" style="flex:1;background:var(--vscode-input-background,#1e1f22);color:var(--vscode-input-foreground,#dfe1e5);border:1px solid var(--vscode-focusBorder,#3574f0);border-radius:4px;padding:5px 8px;font-size:13px;outline:none;font-family:inherit;">
      </div>
    </div>
    <div style="padding:10px 20px 16px 20px;display:flex;align-items:center;justify-content:flex-end;gap:10px;background:var(--vscode-editorWidget-background,var(--vscode-editor-background,#1e1f22));border-top:1px solid var(--vscode-widget-border,var(--vscode-panel-border,#393b40));">
      <button class="as-dialog-btn" id="as-rb-cancel" style="background:var(--vscode-button-secondaryBackground,#2b2d30);color:var(--vscode-button-secondaryForeground,#dfe1e5);border:1px solid var(--vscode-widget-border,var(--vscode-input-border,#4e5157));border-radius:4px;padding:6px 16px;font-size:12.5px;cursor:pointer;">Cancel</button>
      <button class="as-dialog-btn" id="as-rb-ok" style="background:var(--vscode-button-background,#3574f0);color:var(--vscode-button-foreground,#ffffff);border:none;border-radius:4px;padding:6px 18px;font-size:12.5px;font-weight:600;cursor:pointer;">Rename</button>
    </div>
  `;

  overlay.appendChild(card);
  document.body.appendChild(overlay);

  const titleEl = card.querySelector('.as-rb-title') as HTMLElement;
  titleEl.textContent = "Rename Branch '" + (oldName || '') + "'";
  const nameInput = card.querySelector('#as-rb-name') as HTMLInputElement;
  nameInput.value = oldName || '';
  const btnCancel = card.querySelector('#as-rb-cancel') as HTMLElement;
  const btnOk = card.querySelector('#as-rb-ok') as HTMLElement;
  const dotClose = card.querySelector('.as-dot-close') as HTMLElement;

  const closeDialog = () => {
    overlay.remove();
    document.removeEventListener('keydown', onKeyDown);
  };

  const submitDialog = () => {
    const newName = nameInput.value.trim();
    if (!newName) {
      nameInput.focus();
      return;
    }
    if (newName !== oldName) {
      postMessage('renameBranch', { oldName, newName });
    }
    closeDialog();
  };

  btnCancel.addEventListener('click', closeDialog);
  if (dotClose) dotClose.addEventListener('click', closeDialog);
  btnOk.addEventListener('click', submitDialog);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeDialog();
  });

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeDialog();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      submitDialog();
    }
  };

  document.addEventListener('keydown', onKeyDown);

  setTimeout(() => {
    nameInput.focus();
    nameInput.select();
  }, 50);
}

export function openCreateTagDialog(hash?: string): void {
  const existing = document.querySelector('.as-branch-dialog-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'as-branch-dialog-overlay';
  overlay.style.cssText = "position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:99999;backdrop-filter:blur(1px);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;";

  const shortHash = hash ? hash.slice(0, 8) : '';

  const card = document.createElement('div');
  card.className = 'as-dialog-card';
  card.style.cssText = 'background:var(--vscode-editorWidget-background,var(--vscode-editor-background,#1e1f22));border:1px solid var(--vscode-widget-border,var(--vscode-panel-border,#393b40));border-radius:6px;box-shadow:0 12px 36px rgba(0,0,0,0.55);width:460px;max-width:92vw;display:flex;flex-direction:column;overflow:hidden;color:var(--vscode-editor-foreground,#dfe1e5);';

  card.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--vscode-sideBar-background,var(--vscode-editorWidget-background,#2b2d30));border-bottom:1px solid var(--vscode-widget-border,var(--vscode-panel-border,#393b40));user-select:none;">
      <span class="as-tag-title" style="font-weight:600;font-size:13px;color:var(--vscode-editor-foreground,#dfe1e5);">
      </span>
      <button class="as-dialog-close-btn as-dot-close" title="Close" type="button" style="background:none;border:none;color:var(--vscode-icon-foreground,var(--vscode-descriptionForeground,#8c9199));width:24px;height:24px;display:flex;align-items:center;justify-content:center;cursor:pointer;border-radius:4px;padding:0;outline:none;">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>
      </button>
    </div>
    <div style="padding:18px 20px 14px 20px;display:flex;flex-direction:column;gap:12px;">
      <div style="display:flex;align-items:center;gap:12px;">
        <label for="as-tag-name" style="font-size:13px;color:var(--vscode-editor-foreground,#dfe1e5);white-space:nowrap;font-weight:500;">Tag Name:</label>
        <input type="text" id="as-tag-name" placeholder="v1.0.0" style="flex:1;background:var(--vscode-input-background,#1e1f22);color:var(--vscode-input-foreground,#dfe1e5);border:1px solid var(--vscode-focusBorder,#3574f0);border-radius:4px;padding:5px 8px;font-size:13px;outline:none;font-family:inherit;">
      </div>
    </div>
    <div style="padding:10px 20px 16px 20px;display:flex;align-items:center;justify-content:flex-end;gap:10px;background:var(--vscode-editorWidget-background,var(--vscode-editor-background,#1e1f22));border-top:1px solid var(--vscode-widget-border,var(--vscode-panel-border,#393b40));">
      <button class="as-dialog-btn" id="as-tag-cancel" style="background:var(--vscode-button-secondaryBackground,#2b2d30);color:var(--vscode-button-secondaryForeground,#dfe1e5);border:1px solid var(--vscode-widget-border,var(--vscode-input-border,#4e5157));border-radius:4px;padding:6px 16px;font-size:12.5px;cursor:pointer;">Cancel</button>
      <button class="as-dialog-btn" id="as-tag-ok" style="background:var(--vscode-button-background,#3574f0);color:var(--vscode-button-foreground,#ffffff);border:none;border-radius:4px;padding:6px 18px;font-size:12.5px;font-weight:600;cursor:pointer;">Create</button>
    </div>
  `;

  overlay.appendChild(card);
  document.body.appendChild(overlay);

  const titleEl = card.querySelector('.as-tag-title') as HTMLElement;
  titleEl.textContent = 'Create Tag at ' + shortHash;
  const nameInput = card.querySelector('#as-tag-name') as HTMLInputElement;
  const btnCancel = card.querySelector('#as-tag-cancel') as HTMLElement;
  const btnOk = card.querySelector('#as-tag-ok') as HTMLElement;
  const dotClose = card.querySelector('.as-dot-close') as HTMLElement;

  const closeDialog = () => {
    overlay.remove();
    document.removeEventListener('keydown', onKeyDown);
  };

  const submitDialog = () => {
    const name = nameInput.value.trim();
    if (!name) {
      nameInput.focus();
      return;
    }
    postMessage('createTag', { name, hash });
    closeDialog();
  };

  btnCancel.addEventListener('click', closeDialog);
  if (dotClose) dotClose.addEventListener('click', closeDialog);
  btnOk.addEventListener('click', submitDialog);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeDialog();
  });

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeDialog();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      submitDialog();
    }
  };

  document.addEventListener('keydown', onKeyDown);

  setTimeout(() => {
    nameInput.focus();
    nameInput.select();
  }, 50);
}

// Bind to window for global access
if (typeof window !== 'undefined') {
  (window as any).openCreateBranchDialog = openCreateBranchDialog;
  (window as any).openRenameBranchDialog = openRenameBranchDialog;
  (window as any).openCreateTagDialog = openCreateTagDialog;
}

  export let activeAuthDialog: HTMLElement | null = null;

  export function openGitAuthDialog(authInfo) {
    if (activeAuthDialog) {
      activeAuthDialog.remove();
      activeAuthDialog = null;
    }

    const overlay = document.createElement("div");
    overlay.className = "as-branch-dialog-overlay as-auth-dialog-overlay";
    overlay.style.cssText = "position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.55);display:flex;align-items:center;justify-content:center;z-index:99999;backdrop-filter:blur(1px);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;";

    const remote = authInfo?.remote || "origin";
    const rawUrl = authInfo?.url || "";
    let hostName = authInfo?.host || remote;
    if (!authInfo?.host && rawUrl) {
      try { hostName = new URL(rawUrl).host; } catch {}
    }
    const defaultUsername = authInfo?.defaultUsername || "phucdnh";

    const card = document.createElement("div");
    card.className = "as-dialog-card";
    card.style.cssText = "background:var(--vscode-editorWidget-background,var(--vscode-editor-background,#1e1f22));border:1px solid var(--vscode-widget-border,var(--vscode-panel-border,#393b40));border-radius:6px;box-shadow:0 12px 36px rgba(0,0,0,0.55);width:490px;max-width:92vw;display:flex;flex-direction:column;overflow:hidden;color:var(--vscode-editor-foreground,#dfe1e5);";

    card.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--vscode-sideBar-background,var(--vscode-editorWidget-background,#2b2d30));border-bottom:1px solid var(--vscode-widget-border,var(--vscode-panel-border,#393b40));user-select:none;">
        <span class="as-auth-title" style="font-weight:600;font-size:13px;color:var(--vscode-editor-foreground,#dfe1e5);">
          Log In to ${escapePushHtml(hostName)}
        </span>
        <button class="as-dialog-close-btn as-dot-close" title="Close" type="button" style="background:none;border:none;color:var(--vscode-icon-foreground,var(--vscode-descriptionForeground,#8c9199));width:24px;height:24px;display:flex;align-items:center;justify-content:center;cursor:pointer;border-radius:4px;padding:0;outline:none;">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>
        </button>
      </div>
      <div style="padding:16px 20px 12px 20px;display:flex;flex-direction:column;gap:12px;">
        <div style="font-size:12.5px;color:var(--vscode-descriptionForeground,#9aa0a6);line-height:1.4;">
          Authentication required for remote <strong style="color:var(--vscode-editor-foreground,#dfe1e5);">${escapePushHtml(remote)}</strong>:
          <div style="color:var(--vscode-textLink-foreground,#56a8f5);font-family:monospace;font-size:11.5px;margin-top:3px;word-break:break-all;user-select:text;">${escapePushHtml(rawUrl)}</div>
        </div>

        <div style="display:flex;border-bottom:1px solid var(--vscode-widget-border,var(--vscode-panel-border,#393b40));gap:16px;margin-top:2px;">
          <button id="as-auth-tab-token" type="button" style="background:none;border:none;border-bottom:2px solid var(--vscode-button-background,#3574f0);color:var(--vscode-editor-foreground,#dfe1e5);font-weight:600;font-size:13px;padding:6px 2px;cursor:pointer;outline:none;">
            Token
          </button>
          <button id="as-auth-tab-password" type="button" style="background:none;border:none;border-bottom:2px solid transparent;color:var(--vscode-descriptionForeground,#8c9199);font-weight:500;font-size:13px;padding:6px 2px;cursor:pointer;outline:none;">
            Username / Password
          </button>
        </div>

        <div id="as-auth-token-pane" style="display:flex;flex-direction:column;gap:10px;">
          <div style="display:flex;flex-direction:column;gap:4px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <label for="as-auth-token-input" style="font-size:12.5px;color:var(--vscode-editor-foreground,#dfe1e5);font-weight:500;">Personal Access Token:</label>
              <span style="font-size:11.5px;color:var(--vscode-descriptionForeground,#8c9199);">(scope: read/write repository)</span>
            </div>
            <div style="position:relative;display:flex;align-items:center;">
              <input type="password" id="as-auth-token-input" placeholder="e.g. glpat-... or ghp_..." style="width:100%;box-sizing:border-box;background:var(--vscode-input-background,#1e1f22);color:var(--vscode-input-foreground,#dfe1e5);border:1px solid var(--vscode-input-border,#4e5157);border-radius:4px;padding:6px 30px 6px 8px;font-size:13px;outline:none;font-family:monospace;">
              <span id="as-auth-token-toggle" title="Show/Hide" style="position:absolute;right:8px;cursor:pointer;color:var(--vscode-icon-foreground,var(--vscode-descriptionForeground,#8c9199));display:flex;align-items:center;">
                <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor"><path d="M8 3c-4 0-7 5-7 5s3 5 7 5 7-5 7-5-3-5-7-5zm0 8.5A3.5 3.5 0 1 1 8 4.5a3.5 3.5 0 0 1 0 7zm0-5.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/></svg>
              </span>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:4px;">
            <label for="as-auth-token-username" style="font-size:12.5px;color:var(--vscode-editor-foreground,#dfe1e5);font-weight:500;">Username:</label>
            <input type="text" id="as-auth-token-username" value="${escapeAttr(defaultUsername)}" placeholder="e.g. phucdnh" style="background:var(--vscode-input-background,#1e1f22);color:var(--vscode-input-foreground,#dfe1e5);border:1px solid var(--vscode-input-border,#4e5157);border-radius:4px;padding:6px 8px;font-size:13px;outline:none;font-family:inherit;">
          </div>
        </div>

        <div id="as-auth-password-pane" style="display:none;flex-direction:column;gap:10px;">
          <div style="display:flex;flex-direction:column;gap:4px;">
            <label for="as-auth-user-input" style="font-size:12.5px;color:var(--vscode-editor-foreground,#dfe1e5);font-weight:500;">Username:</label>
            <input type="text" id="as-auth-user-input" value="${escapeAttr(defaultUsername)}" placeholder="Username" style="background:var(--vscode-input-background,#1e1f22);color:var(--vscode-input-foreground,#dfe1e5);border:1px solid var(--vscode-input-border,#4e5157);border-radius:4px;padding:6px 8px;font-size:13px;outline:none;font-family:inherit;">
          </div>
          <div style="display:flex;flex-direction:column;gap:4px;">
            <label for="as-auth-pass-input" style="font-size:12.5px;color:var(--vscode-editor-foreground,#dfe1e5);font-weight:500;">Password:</label>
            <div style="position:relative;display:flex;align-items:center;">
              <input type="password" id="as-auth-pass-input" placeholder="Password" style="width:100%;box-sizing:border-box;background:var(--vscode-input-background,#1e1f22);color:var(--vscode-input-foreground,#dfe1e5);border:1px solid var(--vscode-input-border,#4e5157);border-radius:4px;padding:6px 30px 6px 8px;font-size:13px;outline:none;font-family:inherit;">
              <span id="as-auth-pass-toggle" title="Show/Hide" style="position:absolute;right:8px;cursor:pointer;color:var(--vscode-icon-foreground,var(--vscode-descriptionForeground,#8c9199));display:flex;align-items:center;">
                <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor"><path d="M8 3c-4 0-7 5-7 5s3 5 7 5 7-5 7-5-3-5-7-5zm0 8.5A3.5 3.5 0 1 1 8 4.5a3.5 3.5 0 0 1 0 7zm0-5.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/></svg>
              </span>
            </div>
          </div>
        </div>

        <div style="display:flex;align-items:center;margin-top:2px;">
          <label style="display:inline-flex;align-items:center;gap:7px;font-size:12.5px;cursor:pointer;color:var(--vscode-editor-foreground,#dfe1e5);user-select:none;">
            <input type="checkbox" id="as-auth-remember" class="as-custom-chk" checked style="width:14px;height:14px;cursor:pointer;margin:0;">
            <span>Remember credentials (save into repository remote configuration)</span>
          </label>
        </div>

        <div id="as-auth-error-msg" style="display:none;color:var(--vscode-inputValidation-errorForeground,#ff5252);font-size:12px;line-height:1.35;padding:6px 10px;background:var(--vscode-inputValidation-errorBackground,rgba(255,82,82,0.12));border-radius:4px;border-left:3px solid var(--vscode-inputValidation-errorBorder,#ff5252);"></div>
      </div>
      <div style="padding:10px 20px 16px 20px;display:flex;align-items:center;justify-content:flex-end;gap:10px;background:var(--vscode-editorWidget-background,var(--vscode-editor-background,#1e1f22));border-top:1px solid var(--vscode-widget-border,var(--vscode-panel-border,#393b40));">
        <button class="as-dialog-btn" id="as-auth-cancel" style="background:var(--vscode-button-secondaryBackground,#2b2d30);color:var(--vscode-button-secondaryForeground,#dfe1e5);border:1px solid var(--vscode-widget-border,var(--vscode-input-border,#4e5157));border-radius:4px;padding:6px 16px;font-size:12.5px;cursor:pointer;">Cancel</button>
        <button class="as-dialog-btn" id="as-auth-submit" style="background:var(--vscode-button-background,#3574f0);color:var(--vscode-button-foreground,#ffffff);border:none;border-radius:4px;padding:6px 22px;font-size:12.5px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:6px;">
          <span id="as-auth-spinner" style="display:none;width:12px;height:12px;border:2px solid var(--vscode-button-foreground,#fff);border-top-color:transparent;border-radius:50%;animation:asAuthSpin 0.7s linear infinite;"></span>
          <span id="as-auth-btn-text">Log In</span>
        </button>
      </div>
    `;

    overlay.appendChild(card);
    document.body.appendChild(overlay);
    activeAuthDialog = overlay;

    if (!document.getElementById("as-checkbox-transparent-style")) {
      const cs = document.createElement("style");
      cs.id = "as-checkbox-transparent-style";
      cs.textContent = `
        input[type="checkbox"],
        .as-custom-chk {
          appearance: none !important;
          -webkit-appearance: none !important;
          width: 14px !important;
          height: 14px !important;
          min-width: 14px !important;
          min-height: 14px !important;
          border: 1px solid var(--vscode-checkbox-border, var(--vscode-input-border, #6C707E)) !important;
          border-radius: 2.5px !important;
          background: transparent !important;
          background-color: transparent !important;
          cursor: pointer !important;
          position: relative !important;
          outline: none !important;
          margin: 0 !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          vertical-align: middle !important;
          box-sizing: border-box !important;
          transition: border-color 0.12s ease, background-color 0.12s ease !important;
          flex-shrink: 0 !important;
        }
        input[type="checkbox"]:hover,
        .as-custom-chk:hover {
          border-color: var(--vscode-focusBorder, #CED0D6) !important;
          background-color: rgba(255, 255, 255, 0.06) !important;
        }
        input[type="checkbox"]:checked,
        .as-custom-chk:checked {
          background: transparent !important;
          background-color: transparent !important;
          border-color: var(--vscode-focusBorder, #CED0D6) !important;
        }
        input[type="checkbox"]:checked::after,
        .as-custom-chk:checked::after {
          content: '' !important;
          position: absolute !important;
          top: 1px !important;
          left: 4px !important;
          width: 3.5px !important;
          height: 7px !important;
          border: solid var(--vscode-editor-foreground, #CED0D6) !important;
          border-width: 0 1.8px 1.8px 0 !important;
          transform: rotate(45deg) !important;
        }
        input[type="checkbox"]:indeterminate,
        .as-custom-chk:indeterminate {
          background: transparent !important;
          background-color: transparent !important;
          border-color: var(--vscode-focusBorder, #CED0D6) !important;
        }
        input[type="checkbox"]:indeterminate::after,
        .as-custom-chk:indeterminate::after {
          content: '' !important;
          position: absolute !important;
          top: 5px !important;
          left: 3px !important;
          width: 6px !important;
          height: 2px !important;
          background: var(--vscode-editor-foreground, #CED0D6) !important;
        }
      `;
      document.head.appendChild(cs);
    }

    if (!document.getElementById("as-auth-spin-style")) {
      const s = document.createElement("style");
      s.id = "as-auth-spin-style";
      s.textContent = "@keyframes asAuthSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }";
      document.head.appendChild(s);
    }

    let currentAuthMode = "token";
    const tabToken = card.querySelector("#as-auth-tab-token");
    const tabPassword = card.querySelector("#as-auth-tab-password");
    const paneToken = card.querySelector("#as-auth-token-pane");
    const panePassword = card.querySelector("#as-auth-password-pane");
    const tokenInput = card.querySelector("#as-auth-token-input");
    const tokenUserInput = card.querySelector("#as-auth-token-username");
    const userInput = card.querySelector("#as-auth-user-input");
    const passInput = card.querySelector("#as-auth-pass-input");
    const rememberBox = card.querySelector("#as-auth-remember");
    const errorMsg = card.querySelector("#as-auth-error-msg");
    const btnCancel = card.querySelector("#as-auth-cancel");
    const btnSubmit = card.querySelector("#as-auth-submit");
    const btnText = card.querySelector("#as-auth-btn-text");
    const spinner = card.querySelector("#as-auth-spinner");
    const dotClose = card.querySelector(".as-dot-close");
    const tokenToggle = card.querySelector("#as-auth-token-toggle");
    const passToggle = card.querySelector("#as-auth-pass-toggle");

    if (dotClose) {
      dotClose.onmouseenter = () => {
        dotClose.style.background = "var(--vscode-toolbar-hoverBackground, rgba(128,128,128,0.2))";
        dotClose.style.color = "var(--vscode-editor-foreground, #dfe1e5)";
      };
      dotClose.onmouseleave = () => {
        dotClose.style.background = "none";
        dotClose.style.color = "var(--vscode-icon-foreground, var(--vscode-descriptionForeground, #8c9199))";
      };
    }

    btnCancel.onmouseenter = () => { btnCancel.style.background = "var(--vscode-button-secondaryHoverBackground, #35383d)"; };
    btnCancel.onmouseleave = () => { btnCancel.style.background = "var(--vscode-button-secondaryBackground, #2b2d30)"; };
    btnSubmit.onmouseenter = () => { btnSubmit.style.background = "var(--vscode-button-hoverBackground, #4682f7)"; };
    btnSubmit.onmouseleave = () => { btnSubmit.style.background = "var(--vscode-button-background, #3574f0)"; };

    tabToken.onclick = () => {
      currentAuthMode = "token";
      tabToken.style.borderBottomColor = "var(--vscode-button-background, #3574f0)";
      tabToken.style.color = "var(--vscode-editor-foreground, #dfe1e5)";
      tabToken.style.fontWeight = "600";
      tabPassword.style.borderBottomColor = "transparent";
      tabPassword.style.color = "var(--vscode-descriptionForeground, #8c9199)";
      tabPassword.style.fontWeight = "500";
      paneToken.style.display = "flex";
      panePassword.style.display = "none";
      tokenInput.focus();
    };

    tabPassword.onclick = () => {
      currentAuthMode = "password";
      tabPassword.style.borderBottomColor = "var(--vscode-button-background, #3574f0)";
      tabPassword.style.color = "var(--vscode-editor-foreground, #dfe1e5)";
      tabPassword.style.fontWeight = "600";
      tabToken.style.borderBottomColor = "transparent";
      tabToken.style.color = "var(--vscode-descriptionForeground, #8c9199)";
      tabToken.style.fontWeight = "500";
      panePassword.style.display = "flex";
      paneToken.style.display = "none";
      userInput.focus();
    };

    tokenToggle.onclick = () => {
      tokenInput.type = tokenInput.type === "password" ? "text" : "password";
    };
    passToggle.onclick = () => {
      passInput.type = passInput.type === "password" ? "text" : "password";
    };

    const closeDialog = () => {
      overlay.remove();
      activeAuthDialog = null;
      document.removeEventListener("keydown", onKeyDown);
    };

    btnCancel.onclick = closeDialog;
    if (dotClose) dotClose.onclick = closeDialog;
    overlay.onclick = (e) => {
      if (e.target === overlay) closeDialog();
    };

    const submit = () => {
      errorMsg.style.display = "none";
      let username = "";
      let secret = "";

      if (currentAuthMode === "token") {
        secret = tokenInput.value.trim();
        username = tokenUserInput.value.trim();
        if (!secret) {
          tokenInput.style.borderColor = "#ff5252";
          tokenInput.focus();
          return;
        }
      } else {
        username = userInput.value.trim();
        secret = passInput.value.trim();
        if (!username) {
          userInput.style.borderColor = "#ff5252";
          userInput.focus();
          return;
        }
        if (!secret) {
          passInput.style.borderColor = "#ff5252";
          passInput.focus();
          return;
        }
      }

      btnSubmit.disabled = true;
      spinner.style.display = "inline-block";
      btnText.textContent = "Verifying...";

      postMessage("saveGitCredentials", {
        remote,
        url: rawUrl,
        authType: currentAuthMode,
        username,
        token: currentAuthMode === "token" ? secret : undefined,
        password: currentAuthMode === "password" ? secret : undefined,
        remember: rememberBox.checked,
      });
    };

    btnSubmit.onclick = submit;

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeDialog();
      } else if (e.key === "Enter") {
        e.preventDefault();
        submit();
      }
    };
    document.addEventListener("keydown", onKeyDown);

    setTimeout(() => {
      tokenInput.focus();
    }, 50);
  }

  window.openGitAuthDialog = openGitAuthDialog;

  export let activePushDialog: HTMLElement | null = null;

  export function openPushDialog(pushInfo) {
    if (activePushDialog) {
      activePushDialog.remove();
      activePushDialog = null;
    }

    if (!pushInfo) return;

    const overlay = document.createElement('div');
    overlay.className = 'as-push-dialog-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.65);display:flex;align-items:center;justify-content:center;z-index:99999;backdrop-filter:blur(2px);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;';

    const card = document.createElement('div');
    card.className = 'as-push-dialog-card';
    card.style.cssText = 'background:var(--vscode-editorWidget-background,var(--vscode-editor-background,#1e1f22));border:1px solid var(--vscode-widget-border,var(--vscode-panel-border,#43454a));border-radius:6px;box-shadow:0 12px 36px rgba(0,0,0,0.55);width:760px;max-width:95vw;height:520px;max-height:90vh;display:flex;flex-direction:column;overflow:hidden;color:var(--vscode-editor-foreground,#dfe1e5);';

    const commits = pushInfo.commits || [];
    const totalFiles = pushInfo.totalFiles || [];
    let selectedCommitHash = 'ALL';
    let currentRemote = pushInfo.remote;
    let currentTargetBranch = pushInfo.remoteBranch || pushInfo.currentBranch;
    const availableRemotes = (pushInfo.remotes && pushInfo.remotes.length > 0) ? pushInfo.remotes : [currentRemote];

    card.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--vscode-sideBar-background,var(--vscode-editorWidget-background,#2b2d30));border-bottom:1px solid var(--vscode-widget-border,var(--vscode-panel-border,#323438));user-select:none;">
        <span id="push-dialog-title" style="font-weight:600;font-size:13px;color:var(--vscode-editor-foreground,#dfe1e5);">
          Push Commits to ${escapePushHtml(currentRemote)}
        </span>
        <button class="as-dialog-close-btn as-push-dot-close" title="Close" type="button" style="background:none;border:none;color:var(--vscode-icon-foreground,var(--vscode-descriptionForeground,#8c9199));width:24px;height:24px;display:flex;align-items:center;justify-content:center;cursor:pointer;border-radius:4px;padding:0;outline:none;">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>
        </button>
      </div>
      <div style="display:flex;flex:1;min-height:0;overflow:hidden;">
        <!-- Left Column: Branches & Commits -->
        <div style="width:44%;border-right:1px solid var(--vscode-widget-border,var(--vscode-panel-border,#323438));display:flex;flex-direction:column;background:var(--vscode-editorWidget-background,var(--vscode-editor-background,#1e1f22));overflow-y:auto;">
          <div id="push-branch-header" style="display:flex;align-items:center;padding:7px 12px;background:var(--vscode-button-background,#2675bf);color:var(--vscode-button-foreground,#ffffff);font-size:12.5px;font-weight:500;cursor:pointer;user-select:none;gap:4px;overflow:hidden;position:relative;">
            <span style="font-weight:600;white-space:nowrap;">${escapePushHtml(pushInfo.currentBranch)}</span>
            <span style="opacity:0.7;margin:0 2px;">&rarr;</span>
            <div style="display:inline-flex;align-items:center;gap:2px;position:relative;">
              <span id="push-remote-label" title="Click to change remote" style="color:var(--vscode-button-foreground,#ffffff);font-weight:600;cursor:pointer;border-bottom:1px dashed rgba(255,255,255,0.6);">${escapePushHtml(currentRemote)}</span>
              <div id="push-remote-dropdown" style="display:none;position:absolute;top:22px;left:0;background:var(--vscode-dropdown-background,var(--vscode-editorWidget-background,#2b2d30));border:1px solid var(--vscode-dropdown-border,var(--vscode-widget-border,#43454a));border-radius:4px;box-shadow:0 8px 24px rgba(0,0,0,0.8);z-index:200;min-width:110px;padding:4px 0;"></div>
            </div>
            <span style="opacity:0.7;margin:0 2px;">:</span>
            <span id="push-target-branch-display" title="Click to edit remote branch name" style="color:var(--vscode-textLink-activeForeground,#d0e3ff);text-decoration:underline;cursor:pointer;font-weight:500;white-space:nowrap;padding:1px 4px;border-radius:3px;">${escapePushHtml(currentTargetBranch)}</span>
            <input id="push-target-branch-input" type="text" value="${escapeAttr(currentTargetBranch)}" style="display:none;background:var(--vscode-input-background,#1e1f22);color:var(--vscode-input-foreground,#ffffff);border:1.5px solid var(--vscode-focusBorder,#3574f0);border-radius:3px;padding:2px 6px;font-size:12px;font-family:inherit;outline:none;width:150px;">
            <span id="push-new-badge" style="background:rgba(255,255,255,0.22);color:#ffffff;font-size:10.5px;padding:1px 5px;border-radius:3px;margin-left:auto;white-space:nowrap;${pushInfo.isNew ? '' : 'display:none;'}">New</span>
          </div>
          <div id="push-commits-container" style="flex:1;overflow-y:auto;padding:4px 0;">
          </div>
        </div>

        <!-- Right Column: Files Tree -->
        <div style="width:56%;display:flex;flex-direction:column;background:var(--vscode-editorWidget-background,var(--vscode-editor-background,#1e1f22));overflow:hidden;">
          <div style="display:flex;align-items:center;justify-content:space-between;padding:7px 12px;background:var(--vscode-sideBar-background,var(--vscode-editorWidget-background,#26282b));border-bottom:1px solid var(--vscode-widget-border,var(--vscode-panel-border,#323438));user-select:none;">
            <div style="display:flex;align-items:center;gap:6px;font-size:12.5px;font-weight:600;color:var(--vscode-editor-foreground,#dfe1e5);">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="#c49000"><path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h3.879a1.5 1.5 0 0 1 1.06.44l1.122 1.12A.5.5 0 0 0 8.92 4H13.5A1.5 1.5 0 0 1 15 5.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 12.5v-9z"/></svg>
              <span>${escapePushHtml(pushInfo.repoName)}</span>
              <span id="push-files-count" style="color:var(--vscode-descriptionForeground,#808080);font-size:11.5px;font-weight:normal;"></span>
            </div>
            <div style="display:flex;align-items:center;gap:6px;color:var(--vscode-icon-foreground,#9aa0a6);">
              <span title="View Options" style="cursor:pointer;font-size:12px;">👁</span>
            </div>
          </div>
          <div id="push-files-container" style="flex:1;overflow-y:auto;padding:6px 8px;">
          </div>
        </div>
      </div>

      <!-- Footer Bar -->
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 16px;background:var(--vscode-sideBar-background,var(--vscode-editorWidget-background,#2b2d30));border-top:1px solid var(--vscode-widget-border,var(--vscode-panel-border,#323438));user-select:none;">
        <div style="display:flex;align-items:center;gap:12px;">
          <span style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;border:1px solid var(--vscode-widget-border,#5c6164);color:var(--vscode-descriptionForeground,#adb0b8);font-size:11.5px;cursor:pointer;" title="Help">?</span>
          <label style="display:inline-flex;align-items:center;gap:6px;font-size:12.5px;color:var(--vscode-editor-foreground,#dfe1e5);cursor:pointer;">
            <input type="checkbox" id="chk-push-tags" class="as-custom-chk" style="width:14px;height:14px;cursor:pointer;">
            <span>Push tags:</span>
          </label>
          <select id="sel-push-tags" style="background:var(--vscode-dropdown-background,var(--vscode-input-background,#1e1f22));color:var(--vscode-dropdown-foreground,var(--vscode-input-foreground,#dfe1e5));border:1px solid var(--vscode-dropdown-border,var(--vscode-input-border,#4e5157));border-radius:3px;padding:3px 6px;font-size:12px;outline:none;">
            <option value="all">All</option>
            <option value="current">Current branch</option>
          </select>
        </div>
        <div style="display:flex;align-items:center;gap:10px;position:relative;">
          <button id="btn-push-cancel" style="background:var(--vscode-button-secondaryBackground,#2b2d30);color:var(--vscode-button-secondaryForeground,#dfe1e5);border:1px solid var(--vscode-widget-border,var(--vscode-input-border,#4e5157));border-radius:4px;padding:6px 16px;font-size:12.5px;cursor:pointer;">Cancel</button>
          <div style="display:inline-flex;border-radius:4px;overflow:hidden;box-shadow:0 2px 6px rgba(0,0,0,0.3);">
            <button id="btn-push-submit" style="background:var(--vscode-button-background,#3574f0);color:var(--vscode-button-foreground,#ffffff);border:none;padding:6px 18px;font-size:12.5px;font-weight:600;cursor:pointer;">Push</button>
            <button id="btn-push-menu-trigger" style="background:var(--vscode-button-background,#3574f0);color:var(--vscode-button-foreground,#ffffff);border:none;border-left:1px solid rgba(255,255,255,0.25);padding:6px 8px;font-size:11px;cursor:pointer;" title="Push Options">▼</button>
          </div>
          <div id="push-dropdown-menu" style="display:none;position:absolute;bottom:36px;right:0;background:var(--vscode-dropdown-background,var(--vscode-editorWidget-background,#2b2d30));border:1px solid var(--vscode-dropdown-border,var(--vscode-widget-border,#43454a));border-radius:4px;box-shadow:0 8px 24px rgba(0,0,0,0.7);padding:4px 0;z-index:100;min-width:180px;">
            <div id="btn-force-push-opt" style="padding:6px 14px;font-size:12.5px;color:var(--vscode-editor-foreground,#dfe1e5);cursor:pointer;">Force Push (no-verify)...</div>
          </div>
        </div>
      </div>
    `;

    overlay.appendChild(card);
    document.body.appendChild(overlay);
    activePushDialog = overlay;

    const titleEl = card.querySelector('#push-dialog-title');
    const branchHeader = card.querySelector('#push-branch-header');
    const remoteLabel = card.querySelector('#push-remote-label');
    const remoteDropdown = card.querySelector('#push-remote-dropdown');
    const branchDisplay = card.querySelector('#push-target-branch-display');
    const branchInput = card.querySelector('#push-target-branch-input');
    const newBadge = card.querySelector('#push-new-badge');
    const commitsContainer = card.querySelector('#push-commits-container');
    const filesContainer = card.querySelector('#push-files-container');
    const filesCountEl = card.querySelector('#push-files-count');
    const btnCancel = card.querySelector('#btn-push-cancel');
    const btnSubmit = card.querySelector('#btn-push-submit');
    const btnMenuTrigger = card.querySelector('#btn-push-menu-trigger');
    const dropdownMenu = card.querySelector('#push-dropdown-menu');
    const btnForcePush = card.querySelector('#btn-force-push-opt');
    const chkTags = card.querySelector('#chk-push-tags');
    const dotClose = card.querySelector('.as-push-dot-close');

    // Remote dropdown setup
    if (availableRemotes.length > 0) {
      remoteDropdown.innerHTML = availableRemotes.map(r => `
        <div class="as-remote-opt" data-remote="${escapeAttr(r)}" style="padding:5px 12px;font-size:12px;color:#dfe1e5;cursor:pointer;${r === currentRemote ? 'background:#3574f0;color:#fff;' : ''}">${escapePushHtml(r)}</div>
      `).join('');
      remoteDropdown.querySelectorAll('.as-remote-opt').forEach(opt => {
        opt.addEventListener('click', (e) => {
          e.stopPropagation();
          currentRemote = opt.getAttribute('data-remote');
          remoteLabel.textContent = currentRemote;
          if (titleEl) titleEl.textContent = 'Push Commits to ' + currentRemote;
          remoteDropdown.style.display = 'none';
        });
      });
    }

    remoteLabel.addEventListener('click', (e) => {
      e.stopPropagation();
      if (availableRemotes.length > 1) {
        remoteDropdown.style.display = remoteDropdown.style.display === 'none' ? 'block' : 'none';
      }
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('#push-remote-dropdown') && e.target !== remoteLabel) {
        remoteDropdown.style.display = 'none';
      }
    });

    // Inline edit target branch
    branchDisplay.addEventListener('click', (e) => {
      e.stopPropagation();
      branchDisplay.style.display = 'none';
      branchInput.style.display = 'inline-block';
      branchInput.value = currentTargetBranch;
      branchInput.focus();
      branchInput.select();
    });

    function finishEditBranch() {
      const val = branchInput.value.trim();
      if (val) {
        currentTargetBranch = val;
        branchDisplay.textContent = currentTargetBranch;
        if (currentTargetBranch !== pushInfo.currentBranch || pushInfo.isNew) {
          newBadge.style.display = 'inline-block';
        }
      }
      branchInput.style.display = 'none';
      branchDisplay.style.display = 'inline-block';
    }

    branchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        finishEditBranch();
        e.stopPropagation();
      } else if (e.key === 'Escape') {
        branchInput.value = currentTargetBranch;
        branchInput.style.display = 'none';
        branchDisplay.style.display = 'inline-block';
        e.stopPropagation();
      }
    });

    branchInput.addEventListener('blur', () => {
      finishEditBranch();
    });

    function renderCommits() {
      if (commits.length === 0) {
        commitsContainer.innerHTML = '<div style="padding:16px 12px;color:#808080;font-size:12px;">No unpushed commits on this branch.</div>';
        return;
      }
      let html = '';
      commits.forEach(c => {
        const isSel = selectedCommitHash === c.hash;
        const bg = isSel ? '#2d4b73' : 'transparent';
        const textColor = isSel ? '#ffffff' : '#dfe1e5';
        html += `
          <div class="as-push-commit-item" data-hash="${escapePushHtml(c.hash)}" style="display:flex;align-items:center;padding:5px 12px 5px 22px;background:${bg};color:${textColor};font-size:12.5px;cursor:pointer;user-select:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
            <span style="overflow:hidden;text-overflow:ellipsis;" title="${escapePushHtml(c.message)}">${escapePushHtml(c.message)}</span>
          </div>
        `;
      });
      commitsContainer.innerHTML = html;

      commitsContainer.querySelectorAll('.as-push-commit-item').forEach(el => {
        el.addEventListener('click', () => {
          selectedCommitHash = el.getAttribute('data-hash');
          branchHeader.style.background = '#203248';
          renderCommits();
          renderFiles();
        });
      });
    }

    function renderFiles() {
      let currentFiles = [];
      if (selectedCommitHash === 'ALL') {
        currentFiles = totalFiles;
      } else {
        const c = commits.find(x => x.hash === selectedCommitHash);
        currentFiles = c ? c.files : [];
      }

      filesCountEl.textContent = `${currentFiles.length} files`;

      if (currentFiles.length === 0) {
        filesContainer.innerHTML = '<div style="padding:20px;text-align:center;color:#808080;font-size:12px;">No files changed.</div>';
        return;
      }

      const groups = new Map();
      currentFiles.forEach(f => {
        const d = f.dir || '';
        if (!groups.has(d)) groups.set(d, []);
        groups.get(d).push(f);
      });

      let html = '';
      for (const [dir, fList] of groups.entries()) {
        html += `
          <div style="display:flex;align-items:center;gap:6px;padding:3px 6px;color:#9aa0a6;font-size:11.5px;cursor:pointer;font-weight:500;">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h3.879a1.5 1.5 0 0 1 1.06.44l1.122 1.12A.5.5 0 0 0 8.92 4H13.5A1.5 1.5 0 0 1 15 5.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 12.5v-9z"/></svg>
            <span style="color:#dfe1e5;">${escapePushHtml(dir || 'root')}</span>
            <span style="color:#808080;font-size:11px;">${fList.length} file${fList.length > 1 ? 's' : ''}</span>
          </div>
        `;
        fList.forEach(file => {
          let statusBadge = '';
          if (file.status === 'M') {
            statusBadge = '<span style="display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;border:1px solid #499c54;border-radius:2px;font-size:9.5px;color:#499c54;font-weight:bold;margin-right:2px;">M</span>';
          } else if (file.status === 'A') {
            statusBadge = '<span style="display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;border:1px solid #62b543;border-radius:2px;font-size:9.5px;color:#62b543;font-weight:bold;margin-right:2px;">A</span>';
          } else if (file.status === 'D') {
            statusBadge = '<span style="display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;border:1px solid #e05555;border-radius:2px;font-size:9.5px;color:#e05555;font-weight:bold;margin-right:2px;">D</span>';
          }
          html += `
            <div class="as-push-file-item" data-path="${escapePushHtml(file.path)}" style="display:flex;align-items:center;gap:6px;padding:3px 8px 3px 26px;font-size:12.5px;color:#dfe1e5;cursor:pointer;user-select:none;">
              ${statusBadge}
              ${getPushFileIcon(file.name)}
              <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapePushHtml(file.name)}</span>
            </div>
          `;
        });
      }
      filesContainer.innerHTML = html;

      filesContainer.querySelectorAll('.as-push-file-item').forEach(el => {
        el.addEventListener('dblclick', () => {
          const filePath = el.getAttribute('data-path');
          if (filePath) {
            postMessage('openReviewInCenter', { filePath, jumpDiff: true, fromFileList: true });
          }
        });
      });
    }

    branchHeader.addEventListener('click', (e) => {
      if (e.target.closest('#push-remote-label') || e.target.closest('#push-remote-dropdown') ||
          e.target.closest('#push-target-branch-display') || e.target.closest('#push-target-branch-input')) {
        return;
      }
      selectedCommitHash = 'ALL';
      branchHeader.style.background = '#2675bf';
      renderCommits();
      renderFiles();
    });

    function close() {
      overlay.remove();
      activePushDialog = null;
    }

    function doPush(force) {
      btnSubmit.disabled = true;
      btnSubmit.textContent = 'Pushing...';
      btnSubmit.style.opacity = '0.7';
      showToast("Pushing '" + (pushInfo.currentBranch || 'branch') + "'...");
      postMessage('executePush', {
        branch: pushInfo.currentBranch,
        targetBranch: currentTargetBranch,
        force: !!force,
        setUpstream: pushInfo.isNew || (currentTargetBranch !== pushInfo.currentBranch),
        remote: currentRemote,
        tags: chkTags.checked,
      });
    }

    btnSubmit.addEventListener('click', () => doPush(false));
    btnCancel.addEventListener('click', close);
    if (dotClose) {
      dotClose.addEventListener('click', close);
      dotClose.onmouseenter = () => {
        dotClose.style.background = 'var(--vscode-toolbar-hoverBackground, rgba(128,128,128,0.2))';
        dotClose.style.color = 'var(--vscode-editor-foreground, #dfe1e5)';
      };
      dotClose.onmouseleave = () => {
        dotClose.style.background = 'none';
        dotClose.style.color = 'var(--vscode-icon-foreground, var(--vscode-descriptionForeground, #8c9199))';
      };
    }
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });

    btnMenuTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdownMenu.style.display = dropdownMenu.style.display === 'none' ? 'block' : 'none';
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('#push-dropdown-menu') && e.target !== btnMenuTrigger) {
        dropdownMenu.style.display = 'none';
      }
    });

    btnForcePush.addEventListener('click', () => {
      dropdownMenu.style.display = 'none';
      doPush(true);
    });

    renderCommits();
    renderFiles();
  }

  if (typeof window !== "undefined") {
  (window as any).openGitAuthDialog = openGitAuthDialog;
  (window as any).openPushDialog = openPushDialog;
}
