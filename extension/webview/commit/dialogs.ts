import { escapeHtml, escapeAttr } from '../shared/escape';
import { getFileIcon } from '../shared/fileIcons';
import { state } from './state';

let activeConflictsDialog: HTMLElement | null = null;
let activePushDialog: HTMLElement | null = null;
let currentUpdateConflictsDialog: (() => void) | null = null;

export function updateConflictsDialog(): void {
  if (typeof currentUpdateConflictsDialog === 'function') {
    currentUpdateConflictsDialog();
  }
}

export function closePushDialog(): void {
  if (activePushDialog) {
    activePushDialog.remove();
    activePushDialog = null;
  }
}

export function handlePushError(): void {
  if (activePushDialog) {
    const btn = activePushDialog.querySelector('#btn-push-submit') as HTMLButtonElement | null;
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Push';
      btn.style.opacity = '1';
    }
  }
}

export function openConflictsDialog(vscode: any): void {
  if (activeConflictsDialog) {
    activeConflictsDialog.remove();
    activeConflictsDialog = null;
  }

  const conflictInfo = state.conflictInfo || {
    hasConflicts: false,
    isMerging: false,
    isRebasing: false,
    yoursBranch: 'Yours',
    theirsBranch: 'Theirs',
    conflicts: [],
  };

  let conflicts = [...(conflictInfo.conflicts || [])];
  let selectedPath: string | null = conflicts.length > 0 ? conflicts[0].path : null;
  let groupByDir = false;

  const overlay = document.createElement('div');
  overlay.className = 'as-conflicts-dialog-overlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:99999;backdrop-filter:blur(2px);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;';

  const card = document.createElement('div');
  card.className = 'as-dialog-card';
  card.style.cssText = 'background:#2b2d30;border:1px solid #43454a;border-radius:8px;box-shadow:0 16px 48px rgba(0,0,0,0.8);width:680px;max-width:94vw;max-height:88vh;display:flex;flex-direction:column;overflow:hidden;color:#dfe1e5;';

  const yoursLabel = `Yours (${conflictInfo.yoursBranch || 'HEAD'})`;
  const theirsLabel = `Theirs (${conflictInfo.theirsBranch || 'MERGE_HEAD'})`;

  card.innerHTML = `
    <div style="position:relative;display:flex;align-items:center;padding:10px 14px;background:#212224;border-bottom:1px solid #323438;user-select:none;">
      <div style="display:flex;gap:7px;align-items:center;z-index:2;">
        <span class="as-dot-close" title="Close" style="width:11px;height:11px;border-radius:50%;background:#ff5f56;display:inline-block;cursor:pointer;"></span>
        <span style="width:11px;height:11px;border-radius:50%;background:#4a4a4a;display:inline-block;"></span>
        <span style="width:11px;height:11px;border-radius:50%;background:#27c93f;display:inline-block;"></span>
      </div>
      <div style="position:absolute;left:0;right:0;text-align:center;font-weight:600;font-size:13px;color:#dfe1e5;pointer-events:none;">
        Conflicts
      </div>
    </div>
    <div style="padding:14px 18px 8px;font-size:13px;color:#dfe1e5;font-weight:400;">
      The following files have unresolved conflicts. You need to resolve them before merge.
    </div>
    <div style="display:flex;flex:1;min-height:220px;max-height:450px;padding:8px 18px;gap:14px;">
      <div style="flex:1;min-width:0;display:flex;flex-direction:column;border:1px solid #43454a;border-radius:4px;background:#1e1f22;overflow:hidden;">
        <div style="display:flex;background:#2b2d30;border-bottom:1px solid #3c3f41;padding:6px 10px;font-size:12px;font-weight:600;color:#9aa0a6;user-select:none;">
          <div style="flex:1.8;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">Name</div>
          <div style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" id="lbl-yours">${escapeHtml(yoursLabel)}</div>
          <div style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" id="lbl-theirs">${escapeHtml(theirsLabel)}</div>
        </div>
        <div id="conflict-table-body" style="flex:1;overflow-y:auto;min-height:180px;">
        </div>
      </div>
      <div style="width:130px;display:flex;flex-direction:column;gap:8px;padding-top:2px;">
        <button id="btn-act-yours" style="background:#2b2d30;color:#dfe1e5;border:1px solid #4e5157;border-radius:4px;padding:6px 12px;font-size:12.5px;cursor:pointer;text-align:center;white-space:nowrap;">Accept Yours</button>
        <button id="btn-act-theirs" style="background:#2b2d30;color:#dfe1e5;border:1px solid #4e5157;border-radius:4px;padding:6px 12px;font-size:12.5px;cursor:pointer;text-align:center;white-space:nowrap;">Accept Theirs</button>
        <button id="btn-act-merge" style="background:#3574f0;color:#ffffff;border:none;border-radius:4px;padding:6px 12px;font-size:12.5px;font-weight:600;cursor:pointer;text-align:center;white-space:nowrap;margin-top:2px;">Merge...</button>
      </div>
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 18px 14px;background:#2b2d30;border-top:1px solid #323438;">
      <label style="display:inline-flex;align-items:center;gap:6px;font-size:12.5px;color:#dfe1e5;cursor:pointer;user-select:none;">
        <input type="checkbox" id="chk-group-dir" style="cursor:pointer;width:14px;height:14px;margin:0;">
        <span>Group files by directory</span>
      </label>
      <button id="btn-dialog-close" style="background:#2b2d30;color:#dfe1e5;border:1px solid #4e5157;border-radius:4px;padding:5px 18px;font-size:12.5px;cursor:pointer;">Close</button>
    </div>
  `;

  overlay.appendChild(card);
  document.body.appendChild(overlay);
  activeConflictsDialog = overlay;

  const tableBody = card.querySelector('#conflict-table-body') as HTMLElement;
  const chkGroup = card.querySelector('#chk-group-dir') as HTMLInputElement;
  const btnAcceptYours = card.querySelector('#btn-act-yours') as HTMLButtonElement;
  const btnAcceptTheirs = card.querySelector('#btn-act-theirs') as HTMLButtonElement;
  const btnMerge = card.querySelector('#btn-act-merge') as HTMLButtonElement;
  const btnClose = card.querySelector('#btn-dialog-close') as HTMLButtonElement;
  const dotClose = card.querySelector('.as-dot-close') as HTMLElement;

  function doMerge(): void {
    if (!selectedPath) return;
    vscode.postMessage({ type: 'openMergeEditor', payload: { path: selectedPath } });
  }

  function doAcceptYours(): void {
    if (!selectedPath) return;
    const target = selectedPath;
    vscode.postMessage({ type: 'acceptYours', payload: { path: target } });
    conflicts = conflicts.filter(c => c.path !== target);
    if (conflicts.length === 0) {
      close();
    } else {
      selectedPath = conflicts[0].path;
      renderTable();
    }
  }

  function doAcceptTheirs(): void {
    if (!selectedPath) return;
    const target = selectedPath;
    vscode.postMessage({ type: 'acceptTheirs', payload: { path: target } });
    conflicts = conflicts.filter(c => c.path !== target);
    if (conflicts.length === 0) {
      close();
    } else {
      selectedPath = conflicts[0].path;
      renderTable();
    }
  }

  function close(): void {
    window.removeEventListener('keydown', handleKey);
    overlay.remove();
    activeConflictsDialog = null;
    currentUpdateConflictsDialog = null;
  }

  function handleKey(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      close();
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
  }

  function renderTable(): void {
    if (conflicts.length === 0) {
      tableBody.innerHTML = '<div style="padding:24px;text-align:center;color:#808080;font-size:13px;">No unresolved conflicts.</div>';
      btnAcceptYours.disabled = true;
      btnAcceptYours.style.opacity = '0.5';
      btnAcceptTheirs.disabled = true;
      btnAcceptTheirs.style.opacity = '0.5';
      btnMerge.disabled = true;
      btnMerge.style.opacity = '0.5';
      return;
    }

    btnAcceptYours.disabled = false;
    btnAcceptYours.style.opacity = '1';
    btnAcceptTheirs.disabled = false;
    btnAcceptTheirs.style.opacity = '1';
    btnMerge.disabled = false;
    btnMerge.style.opacity = '1';

    if (!selectedPath || !conflicts.some(c => c.path === selectedPath)) {
      selectedPath = conflicts[0].path;
    }

    let html = '';
    if (!groupByDir) {
      conflicts.forEach(file => {
        const isSelected = file.path === selectedPath;
        const bg = isSelected ? '#2675bf' : 'transparent';
        const textColor = isSelected ? '#ffffff' : '#e06c75';
        const dirColor = isSelected ? '#b0d4f1' : '#808080';
        const statusColor = isSelected ? '#ffffff' : '#dfe1e5';
        html += `
          <div class="as-conflict-row" data-path="${escapeAttr(file.path)}" style="display:flex;align-items:center;padding:5px 10px;font-size:12.5px;cursor:pointer;user-select:none;background:${bg};border-bottom:1px solid rgba(255,255,255,0.03);">
            <div style="flex:1.8;min-width:0;display:flex;align-items:center;gap:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
              ${getFileIcon(file.name)}
              <span style="color:${textColor};font-weight:500;">${escapeHtml(file.name)}</span>
              ${file.dir ? `<span style="color:${dirColor};font-size:11.5px;margin-left:4px;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(file.dir)}</span>` : ''}
            </div>
            <div style="flex:1;min-width:0;color:${statusColor};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(file.yours)}</div>
            <div style="flex:1;min-width:0;color:${statusColor};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(file.theirs)}</div>
          </div>
        `;
      });
    } else {
      const groups = new Map<string, any[]>();
      conflicts.forEach(file => {
        const dir = file.dir || '';
        if (!groups.has(dir)) groups.set(dir, []);
        groups.get(dir)!.push(file);
      });

      for (const [dir, files] of groups.entries()) {
        html += `
          <div style="display:flex;align-items:center;gap:6px;padding:4px 8px;background:rgba(255,255,255,0.04);color:#9aa0a6;font-size:11.5px;font-weight:600;border-bottom:1px solid rgba(255,255,255,0.04);">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h3.879a1.5 1.5 0 0 1 1.06.44l1.122 1.12A.5.5 0 0 0 8.92 4H13.5A1.5 1.5 0 0 1 15 5.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 12.5v-9z"/></svg>
            <span>${escapeHtml(dir || 'root')}</span>
          </div>
        `;
        files.forEach(file => {
          const isSelected = file.path === selectedPath;
          const bg = isSelected ? '#2675bf' : 'transparent';
          const textColor = isSelected ? '#ffffff' : '#e06c75';
          const statusColor = isSelected ? '#ffffff' : '#dfe1e5';
          html += `
            <div class="as-conflict-row" data-path="${escapeAttr(file.path)}" style="display:flex;align-items:center;padding:5px 10px 5px 22px;font-size:12.5px;cursor:pointer;user-select:none;background:${bg};border-bottom:1px solid rgba(255,255,255,0.03);">
              <div style="flex:1.8;min-width:0;display:flex;align-items:center;gap:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                ${getFileIcon(file.name)}
                <span style="color:${textColor};font-weight:500;">${escapeHtml(file.name)}</span>
              </div>
              <div style="flex:1;min-width:0;color:${statusColor};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(file.yours)}</div>
              <div style="flex:1;min-width:0;color:${statusColor};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(file.theirs)}</div>
            </div>
          `;
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

  window.addEventListener('keydown', handleKey);

  chkGroup.addEventListener('change', () => {
    groupByDir = chkGroup.checked;
    renderTable();
  });

  btnMerge.addEventListener('click', doMerge);
  btnAcceptYours.addEventListener('click', doAcceptYours);
  btnAcceptTheirs.addEventListener('click', doAcceptTheirs);
  btnClose.addEventListener('click', close);
  dotClose.addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  currentUpdateConflictsDialog = function() {
    const updatedInfo = state.conflictInfo;
    if (updatedInfo) {
      conflicts = [...(updatedInfo.conflicts || [])];
      if (conflicts.length === 0) {
        close();
        return;
      }
      renderTable();
    }
  };

  renderTable();
}

export function openPushDialog(pushInfo: any, vscode: any): void {
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
  card.style.cssText = 'background:#1e1f22;border:1px solid #43454a;border-radius:8px;box-shadow:0 20px 60px rgba(0,0,0,0.85);width:760px;max-width:95vw;height:520px;max-height:90vh;display:flex;flex-direction:column;overflow:hidden;color:#dfe1e5;';

  const commits = pushInfo.commits || [];
  const totalFiles = pushInfo.totalFiles || [];
  let selectedCommitHash = 'ALL';
  let currentRemote = pushInfo.remote;
  let currentTargetBranch = pushInfo.remoteBranch || pushInfo.currentBranch;
  const availableRemotes = (pushInfo.remotes && pushInfo.remotes.length > 0) ? pushInfo.remotes : [currentRemote];

  card.innerHTML = `
    <div style="position:relative;display:flex;align-items:center;padding:10px 14px;background:#2b2d30;border-bottom:1px solid #323438;user-select:none;">
      <div style="display:flex;gap:7px;align-items:center;z-index:2;">
        <span class="as-push-dot-close" title="Close" style="width:11px;height:11px;border-radius:50%;background:#ff5f56;display:inline-block;cursor:pointer;"></span>
        <span style="width:11px;height:11px;border-radius:50%;background:#4a4a4a;display:inline-block;"></span>
        <span style="width:11px;height:11px;border-radius:50%;background:#27c93f;display:inline-block;"></span>
      </div>
      <div id="push-dialog-title" style="position:absolute;left:0;right:0;text-align:center;font-weight:600;font-size:13px;color:#dfe1e5;pointer-events:none;">
        Push Commits to ${escapeHtml(currentRemote)}
      </div>
    </div>
    <div style="display:flex;flex:1;min-height:0;overflow:hidden;">
      <div style="width:44%;border-right:1px solid #323438;display:flex;flex-direction:column;background:#1e1f22;overflow-y:auto;">
        <div id="push-branch-header" style="display:flex;align-items:center;padding:7px 12px;background:#2675bf;color:#ffffff;font-size:12.5px;font-weight:500;cursor:pointer;user-select:none;gap:4px;overflow:hidden;position:relative;">
          <span style="font-weight:600;white-space:nowrap;">${escapeHtml(pushInfo.currentBranch)}</span>
          <span style="opacity:0.7;margin:0 2px;">&rarr;</span>
          <div style="display:inline-flex;align-items:center;gap:2px;position:relative;">
            <span id="push-remote-label" title="Click to change remote" style="color:#ffffff;font-weight:600;cursor:pointer;border-bottom:1px dashed rgba(255,255,255,0.6);">${escapeHtml(currentRemote)}</span>
            <div id="push-remote-dropdown" style="display:none;position:absolute;top:22px;left:0;background:#2b2d30;border:1px solid #43454a;border-radius:4px;box-shadow:0 8px 24px rgba(0,0,0,0.8);z-index:200;min-width:110px;padding:4px 0;"></div>
          </div>
          <span style="opacity:0.7;margin:0 2px;">:</span>
          <span id="push-target-branch-display" title="Click to edit remote branch name" style="color:#d0e3ff;text-decoration:underline;cursor:pointer;font-weight:500;white-space:nowrap;padding:1px 4px;border-radius:3px;">${escapeHtml(currentTargetBranch)}</span>
          <input id="push-target-branch-input" type="text" value="${escapeAttr(currentTargetBranch)}" style="display:none;background:#1e1f22;color:#ffffff;border:1.5px solid #3574f0;border-radius:3px;padding:2px 6px;font-size:12px;font-family:inherit;outline:none;width:150px;">
          <span id="push-new-badge" style="background:rgba(255,255,255,0.22);color:#ffffff;font-size:10.5px;padding:1px 5px;border-radius:3px;margin-left:auto;white-space:nowrap;${pushInfo.isNew ? '' : 'display:none;'}">New</span>
        </div>
        <div id="push-commits-container" style="flex:1;overflow-y:auto;padding:4px 0;">
        </div>
      </div>

      <div style="width:56%;display:flex;flex-direction:column;background:#1e1f22;overflow:hidden;">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:7px 12px;background:#26282b;border-bottom:1px solid #323438;user-select:none;">
          <div style="display:flex;align-items:center;gap:6px;font-size:12.5px;font-weight:600;color:#dfe1e5;">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="#c49000"><path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h3.879a1.5 1.5 0 0 1 1.06.44l1.122 1.12A.5.5 0 0 0 8.92 4H13.5A1.5 1.5 0 0 1 15 5.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 12.5v-9z"/></svg>
            <span>${escapeHtml(pushInfo.repoName)}</span>
            <span id="push-files-count" style="color:#808080;font-size:11.5px;font-weight:normal;"></span>
          </div>
          <div style="display:flex;align-items:center;gap:6px;color:#9aa0a6;">
            <span title="View Options" style="cursor:pointer;font-size:12px;">👁</span>
          </div>
        </div>
        <div id="push-files-container" style="flex:1;overflow-y:auto;padding:6px 8px;">
        </div>
      </div>
    </div>

    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 16px;background:#2b2d30;border-top:1px solid #323438;user-select:none;">
      <div style="display:flex;align-items:center;gap:12px;">
        <span style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;border:1px solid #5c6164;color:#adb0b8;font-size:11.5px;cursor:pointer;" title="Help">?</span>
        <label style="display:inline-flex;align-items:center;gap:6px;font-size:12.5px;color:#dfe1e5;cursor:pointer;">
          <input type="checkbox" id="chk-push-tags" style="width:14px;height:14px;cursor:pointer;">
          <span>Push tags:</span>
        </label>
        <select id="sel-push-tags" style="background:#1e1f22;color:#dfe1e5;border:1px solid #4e5157;border-radius:3px;padding:3px 6px;font-size:12px;outline:none;">
          <option value="all">All</option>
          <option value="current">Current branch</option>
        </select>
      </div>
      <div style="display:flex;align-items:center;gap:10px;position:relative;">
        <button id="btn-push-cancel" style="background:#2b2d30;color:#dfe1e5;border:1px solid #4e5157;border-radius:4px;padding:6px 16px;font-size:12.5px;cursor:pointer;">Cancel</button>
        <div style="display:inline-flex;border-radius:4px;overflow:hidden;box-shadow:0 2px 6px rgba(0,0,0,0.3);">
          <button id="btn-push-submit" style="background:#3574f0;color:#ffffff;border:none;padding:6px 18px;font-size:12.5px;font-weight:600;cursor:pointer;">Push</button>
          <button id="btn-push-menu-trigger" style="background:#3574f0;color:#ffffff;border:none;border-left:1px solid rgba(255,255,255,0.25);padding:6px 8px;font-size:11px;cursor:pointer;" title="Push Options">▼</button>
        </div>
        <div id="push-dropdown-menu" style="display:none;position:absolute;bottom:36px;right:0;background:#2b2d30;border:1px solid #43454a;border-radius:4px;box-shadow:0 8px 24px rgba(0,0,0,0.7);padding:4px 0;z-index:100;min-width:180px;">
          <div id="btn-force-push-opt" style="padding:6px 14px;font-size:12.5px;color:#dfe1e5;cursor:pointer;">Force Push (no-verify)...</div>
        </div>
      </div>
    </div>
  `;

  overlay.appendChild(card);
  document.body.appendChild(overlay);
  activePushDialog = overlay;

  const titleEl = card.querySelector('#push-dialog-title');
  const branchHeader = card.querySelector('#push-branch-header') as HTMLElement;
  const remoteLabel = card.querySelector('#push-remote-label') as HTMLElement;
  const remoteDropdown = card.querySelector('#push-remote-dropdown') as HTMLElement;
  const branchDisplay = card.querySelector('#push-target-branch-display') as HTMLElement;
  const branchInput = card.querySelector('#push-target-branch-input') as HTMLInputElement;
  const newBadge = card.querySelector('#push-new-badge') as HTMLElement;
  const commitsContainer = card.querySelector('#push-commits-container') as HTMLElement;
  const filesContainer = card.querySelector('#push-files-container') as HTMLElement;
  const filesCountEl = card.querySelector('#push-files-count') as HTMLElement;
  const btnCancel = card.querySelector('#btn-push-cancel') as HTMLButtonElement;
  const btnSubmit = card.querySelector('#btn-push-submit') as HTMLButtonElement;
  const btnMenuTrigger = card.querySelector('#btn-push-menu-trigger') as HTMLButtonElement;
  const dropdownMenu = card.querySelector('#push-dropdown-menu') as HTMLElement;
  const btnForcePush = card.querySelector('#btn-force-push-opt') as HTMLElement;
  const chkTags = card.querySelector('#chk-push-tags') as HTMLInputElement;
  const dotClose = card.querySelector('.as-push-dot-close') as HTMLElement;

  if (availableRemotes.length > 0) {
    remoteDropdown.innerHTML = availableRemotes.map((r: string) => `
      <div class="as-remote-opt" data-remote="${escapeAttr(r)}" style="padding:5px 12px;font-size:12px;color:#dfe1e5;cursor:pointer;${r === currentRemote ? 'background:#3574f0;color:#fff;' : ''}">${escapeHtml(r)}</div>
    `).join('');
    remoteDropdown.querySelectorAll('.as-remote-opt').forEach((opt: any) => {
      opt.addEventListener('click', (e: MouseEvent) => {
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
    if (!e.target || (!(e.target as HTMLElement).closest('#push-remote-dropdown') && e.target !== remoteLabel)) {
      remoteDropdown.style.display = 'none';
    }
  });

  branchDisplay.addEventListener('click', (e) => {
    e.stopPropagation();
    branchDisplay.style.display = 'none';
    branchInput.style.display = 'inline-block';
    branchInput.value = currentTargetBranch;
    branchInput.focus();
    branchInput.select();
  });

  function finishEditBranch(): void {
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

  function renderCommits(): void {
    if (commits.length === 0) {
      commitsContainer.innerHTML = '<div style="padding:16px 12px;color:#808080;font-size:12px;">No unpushed commits on this branch.</div>';
      return;
    }
    let html = '';
    commits.forEach((c: any) => {
      const isSel = selectedCommitHash === c.hash;
      const bg = isSel ? '#2d4b73' : 'transparent';
      const textColor = isSel ? '#ffffff' : '#dfe1e5';
      html += `
        <div class="as-push-commit-item" data-hash="${escapeAttr(c.hash)}" style="display:flex;align-items:center;padding:5px 12px 5px 22px;background:${bg};color:${textColor};font-size:12.5px;cursor:pointer;user-select:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
          <span style="overflow:hidden;text-overflow:ellipsis;" title="${escapeHtml(c.message)}">${escapeHtml(c.message)}</span>
        </div>
      `;
    });
    commitsContainer.innerHTML = html;

    commitsContainer.querySelectorAll('.as-push-commit-item').forEach(el => {
      el.addEventListener('click', () => {
        selectedCommitHash = el.getAttribute('data-hash') || 'ALL';
        branchHeader.style.background = '#203248';
        renderCommits();
        renderFiles();
      });
    });
  }

  function renderFiles(): void {
    let currentFiles: any[] = [];
    if (selectedCommitHash === 'ALL') {
      currentFiles = totalFiles;
    } else {
      const c = commits.find((x: any) => x.hash === selectedCommitHash);
      currentFiles = c ? c.files : [];
    }

    filesCountEl.textContent = `${currentFiles.length} files`;

    if (currentFiles.length === 0) {
      filesContainer.innerHTML = '<div style="padding:20px;text-align:center;color:#808080;font-size:12px;">No files changed.</div>';
      return;
    }

    const groups = new Map<string, any[]>();
    currentFiles.forEach(f => {
      const d = f.dir || '';
      if (!groups.has(d)) groups.set(d, []);
      groups.get(d)!.push(f);
    });

    let html = '';
    for (const [dir, fList] of groups.entries()) {
      html += `
        <div style="display:flex;align-items:center;gap:6px;padding:3px 6px;color:#9aa0a6;font-size:11.5px;cursor:pointer;font-weight:500;">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h3.879a1.5 1.5 0 0 1 1.06.44l1.122 1.12A.5.5 0 0 0 8.92 4H13.5A1.5 1.5 0 0 1 15 5.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 12.5v-9z"/></svg>
          <span style="color:#dfe1e5;">${escapeHtml(dir || 'root')}</span>
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
          <div class="as-push-file-item" data-path="${escapeAttr(file.path)}" style="display:flex;align-items:center;gap:6px;padding:3px 8px 3px 26px;font-size:12.5px;color:#dfe1e5;cursor:pointer;user-select:none;">
            ${statusBadge}
            ${getFileIcon(file.name)}
            <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(file.name)}</span>
          </div>
        `;
      });
    }
    filesContainer.innerHTML = html;

    filesContainer.querySelectorAll('.as-push-file-item').forEach(el => {
      el.addEventListener('dblclick', () => {
        const filePath = el.getAttribute('data-path');
        if (filePath) {
          vscode.postMessage({
            type: 'openReviewInCenter',
            payload: { filePath, jumpDiff: true, fromFileList: true },
          });
        }
      });
    });
  }

  branchHeader.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('#push-remote-label') || (e.target as HTMLElement).closest('#push-remote-dropdown') ||
        (e.target as HTMLElement).closest('#push-target-branch-display') || (e.target as HTMLElement).closest('#push-target-branch-input')) {
      return;
    }
    selectedCommitHash = 'ALL';
    branchHeader.style.background = '#2675bf';
    renderCommits();
    renderFiles();
  });

  function close(): void {
    overlay.remove();
    activePushDialog = null;
  }

  function doPush(force: boolean): void {
    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Pushing...';
    btnSubmit.style.opacity = '0.7';
    vscode.postMessage({
      type: 'executePush',
      payload: {
        branch: pushInfo.currentBranch,
        targetBranch: currentTargetBranch,
        force: !!force,
        setUpstream: pushInfo.isNew || (currentTargetBranch !== pushInfo.currentBranch),
        remote: currentRemote,
        tags: chkTags.checked,
      },
    });
  }

  btnSubmit.addEventListener('click', () => doPush(false));
  btnCancel.addEventListener('click', close);
  dotClose.addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  btnMenuTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdownMenu.style.display = dropdownMenu.style.display === 'none' ? 'block' : 'none';
  });

  document.addEventListener('click', (e) => {
    if (!e.target || (!(e.target as HTMLElement).closest('#push-dropdown-menu') && e.target !== btnMenuTrigger)) {
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
