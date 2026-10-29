<script lang="ts">
  import { onMount } from 'svelte';
  import CommitGraph from './CommitGraph.svelte';
  import BranchLabels from './BranchLabels.svelte';
  import {
    postMessage,
    openCreateBranchDialog,
    openCreateTagDialog,
    openRenameBranchDialog,
    openCheckoutBranchDialog
  } from '$shared/vscodeApi';

  interface Props {
    commits: any[];
    selectedHash: string | null;
    graphWidth: number;
    scrollToIndex: number;
    onSelectCommit: (hash: string) => void;
    onRebaseFromHere: (hash: string) => void;
    onLoadMore: () => void;
  }

  let {
    commits = [],
    selectedHash = null,
    graphWidth = 1,
    scrollToIndex = -1,
    onSelectCommit,
    onRebaseFromHere,
    onLoadMore
  }: Props = $props();

  const ROW_HEIGHT = 25;
  const OVERSCAN = 5;

  let containerEl = $state<HTMLElement | undefined>(undefined);
  let scrollTop = $state(0);
  let containerHeight = $state(600);
  let contextMenuHash = $state<string | null>(null);
  let contextMenuPos = $state({ x: 0, y: 0 });
  let showContextMenu = $state(false);

  function showToast(text: string) {
    const old = document.querySelector('.as-mini-toast');
    if (old) old.remove();
    const t = document.createElement('div');
    t.className = 'as-mini-toast';
    t.innerText = text;
    document.body.appendChild(t);
    setTimeout(() => t.classList.add('visible'), 10);
    setTimeout(() => {
      t.classList.remove('visible');
      setTimeout(() => t.remove(), 250);
    }, 2000);
  }
  if (typeof window !== 'undefined') {
    (window as any).showToast = showToast;
  }

  $effect(() => {
    if (!containerEl) return;
    (window as any).__commitListContainer__ = containerEl;
    (window as any).__commitListSetScrollTop__ = (st: number) => { scrollTop = st; };
    const obs = new ResizeObserver((entries) => {
      if (!entries || !entries.length) return;
      window.requestAnimationFrame(() => {
        if (!entries[0]) return;
        const h = entries[0].contentRect.height;
        if (h && Math.abs(h - containerHeight) > 1) {
          containerHeight = h;
        }
      });
    });
    obs.observe(containerEl);
    return () => {
      obs.disconnect();
      if ((window as any).__commitListContainer__ === containerEl) {
        (window as any).__commitListContainer__ = null;
        (window as any).__commitListSetScrollTop__ = null;
      }
    };
  });

  let isLoadingMore = false;
  let hasReachedEnd = false;
  let prevCommitCount = 0;

  function onScroll(e: Event) {
    const el = e.target as HTMLElement;
    scrollTop = el.scrollTop;
    const curCount = commits ? commits.length : 0;
    if (curCount !== prevCommitCount) {
      isLoadingMore = false;
      hasReachedEnd = false;
      prevCommitCount = curCount;
    }
    const totalHeight = curCount * ROW_HEIGHT;
    if (!isLoadingMore && !hasReachedEnd && curCount >= 50 && el.scrollTop + containerHeight > totalHeight - 350) {
      isLoadingMore = true;
      onLoadMore();
    }
  }

  let startIndex = $derived(Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN));
  let endIndex = $derived(Math.min(commits.length, Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + OVERSCAN));
  let visibleCommits = $derived(commits.slice(startIndex, endIndex));
  let graphNodes = $derived(commits.map((c) => c.graph));

  function formatDate(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return `Today ${timeStr}`;
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return `Yesterday ${timeStr}`;
    const day = d.getDate();
    const month = d.getMonth() + 1;
    const year = String(d.getFullYear()).slice(-2);
    return `${day}/${month}/${year}, ${timeStr}`;
  }

  const ICON_COPY = '<svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M4 2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H6zM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1H2z"/></svg>';
  const ICON_PLUS = '<svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M12.1232 2.67714C11.7828 2.33692 11.3696 2.16676 10.8834 2.16676C10.3975 2.16676 9.98427 2.33682 9.64395 2.67714C9.30375 3.01737 9.13366 3.43051 9.13366 3.91672C9.13366 4.23268 9.21242 4.52588 9.37041 4.79626C9.52838 5.06666 9.74087 5.27787 10.0084 5.42971C10.0084 5.74567 9.98273 6.02377 9.93118 6.26375C9.87939 6.50373 9.79441 6.71478 9.67597 6.8972C9.55721 7.07953 9.43442 7.23436 9.30672 7.36203C9.17899 7.4897 8.99973 7.60961 8.76885 7.72208C8.538 7.83449 8.32366 7.92857 8.12624 8.00464C7.92881 8.08047 7.66288 8.17008 7.32869 8.27342C6.72097 8.46187 6.25317 8.63491 5.92501 8.793V4.26292C6.19238 4.11111 6.40507 3.89993 6.56303 3.62953C6.72097 3.35912 6.79995 3.06589 6.79995 2.74993C6.79995 2.26388 6.62988 1.85064 6.28956 1.51042C5.94937 1.17022 5.53623 1 5.05005 1C4.56383 1 4.15069 1.1701 3.81037 1.51042C3.47018 1.85064 3.29999 2.26388 3.29999 2.74993C3.29999 3.06589 3.37897 3.35912 3.5369 3.62953C3.69487 3.89993 3.90752 4.11111 4.17492 4.26292V11.7371C3.90752 11.8888 3.69487 12.1002 3.5369 12.3705C3.37897 12.641 3.29999 12.9343 3.29999 13.2501C3.29999 13.7362 3.47005 14.1494 3.81037 14.4896C4.15069 14.8298 4.56393 15 5.05005 15C5.53614 15 5.94937 14.8298 6.28956 14.4896C6.62979 14.1494 6.79995 13.7362 6.79995 13.2501C6.79995 12.9343 6.72097 12.641 6.56303 12.3705C6.40504 12.1002 6.19238 11.8888 5.92501 11.7371V11.5001C5.92501 11.0809 6.05109 10.7772 6.30323 10.5888C6.55537 10.4003 7.07035 10.1846 7.84823 9.94163C8.66867 9.68029 9.28553 9.43405 9.6987 9.20307C11.0598 8.43155 11.7464 7.17367 11.7585 5.42968C12.0261 5.27787 12.2386 5.06663 12.3965 4.79622C12.5544 4.52582 12.6335 4.23265 12.6335 3.91669C12.6336 3.4306 12.4634 3.01746 12.1232 2.67714Z"/></svg>';
  const ICON_CHERRY = '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" style="display:block;"><path fill-rule="evenodd" clip-rule="evenodd" d="M6.5 11C6.5 12.1046 5.60457 13 4.5 13C3.39543 13 2.5 12.1046 2.5 11C2.5 9.89543 3.39543 9 4.5 9C5.60457 9 6.5 9.89543 6.5 11ZM4.5 14C6.15685 14 7.5 12.6569 7.5 11C7.5 9.34315 6.15685 8 4.5 8C2.84315 8 1.5 9.34315 1.5 11C1.5 12.6569 2.84315 14 4.5 14ZM13.5 11C13.5 12.1046 12.6046 13 11.5 13C10.3954 13 9.5 12.1046 9.5 11C9.5 9.89543 10.3954 9 11.5 9C12.6046 9 13.5 9.89543 13.5 11ZM11.5 14C13.1569 14 14.5 12.6569 14.5 11C14.5 9.34315 13.1569 8 11.5 8C9.84315 8 8.5 9.34315 8.5 11C8.5 12.6569 9.84315 14 11.5 14Z" fill="currentColor"/><path fill-rule="evenodd" clip-rule="evenodd" d="M11.8537 1.14647C11.7934 1.08617 11.7216 1.04449 11.6453 1.02143C11.5869 1.00372 11.5244 0.996452 11.46 1.00164L11.4585 1.00175L11.4577 1.00183C8.89299 1.21581 7.10682 2.51359 5.92996 4.03112C4.76214 5.53699 4.18349 7.26955 4.00588 8.424C3.9639 8.69693 4.15111 8.95222 4.42404 8.99421C4.69697 9.0362 4.95227 8.84899 4.99426 8.57606C5.14998 7.56384 5.67133 5.9964 6.72018 4.64394C7.43375 3.72381 8.38624 2.9082 9.6361 2.42686L10.8329 1.87283L10.1507 2.48553C9.63716 3.45813 9.48624 4.482 9.53842 5.42758C9.61459 6.8079 10.1221 8.0385 10.5761 8.76503C10.7225 8.9992 11.031 9.07038 11.2651 8.92403C11.4993 8.77767 11.5705 8.4692 11.4241 8.23503C11.0449 7.62822 10.6024 6.55883 10.5369 5.37248C10.4723 4.20114 10.7737 2.93361 11.8537 1.85358C12.049 1.65832 12.049 1.34174 11.8537 1.14647Z" fill="currentColor"/></svg>';
  const ICON_RESET = '<svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><g fill-rule="evenodd" transform="translate(2 1)"><polygon points="0 0 4 4 0 8" transform="matrix(-1 0 0 1 4 0)"/><path d="M4.15058343,11 L8.06891179,11 C9.72576604,11 11.0689118,9.65685425 11.0689118,8 C11.0689118,6.34314575 9.72576604,5 8.06891179,5 L4.03764586,5 L4,3 L8,3 C10.7614237,3 13,5.23857625 13,8 C13,10.7614237 10.7614237,13 8,13 L4.18822929,13 L4.15058343,11 Z"/></g></svg>';
  const ICON_WEB = '<svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>';

  function closeCommitContextMenu() {
    const menus = document.querySelectorAll('.commit-context-menu');
    menus.forEach((m) => m.remove());
  }

  function closeBranchContextMenu() {
    window.dispatchEvent(new CustomEvent('closeAllGraphMenus'));
  }

  function openEditCommitMessageDialog(commit: any) {
    if (!commit) return;
    const existing = document.querySelector('.as-dialog-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'as-dialog-overlay';

    const card = document.createElement('div');
    card.className = 'as-dialog-card';

    const shortHash = commit.hash ? commit.hash.slice(0, 8) : '';
    card.innerHTML = `
      <div class="as-dialog-header">
        <span>Edit Commit Message (${shortHash})</span>
        <span class="as-dialog-close">✕</span>
      </div>
      <div class="as-dialog-body">
        <div class="as-dialog-field-label">Summary (Title)</div>
        <input type="text" class="as-dialog-input" id="as-edit-summary" placeholder="Commit summary...">
        <div class="as-dialog-field-label">Description (Details)</div>
        <textarea class="as-dialog-textarea" id="as-edit-desc" placeholder="Detailed commit description (optional)..."></textarea>
      </div>
      <div class="as-dialog-footer">
        <div style="margin-right:auto;font-size:11px;opacity:0.6;">Ctrl+Enter to save, Esc to cancel</div>
        <button class="as-dialog-btn as-dialog-btn-secondary" id="as-edit-cancel">Cancel</button>
        <button class="as-dialog-btn as-dialog-btn-primary" id="as-edit-ok">Save</button>
      </div>
    `;

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    const summaryInput = card.querySelector('#as-edit-summary') as HTMLInputElement;
    const descInput = card.querySelector('#as-edit-desc') as HTMLTextAreaElement;
    const btnCancel = card.querySelector('#as-edit-cancel') as HTMLButtonElement;
    const btnOk = card.querySelector('#as-edit-ok') as HTMLButtonElement;
    const btnClose = card.querySelector('.as-dialog-close') as HTMLElement;

    summaryInput.value = commit.subject || '';
    descInput.value = commit.body ? commit.body.trim() : '';

    const closeDialog = () => {
      overlay.remove();
      document.removeEventListener('keydown', onKeyDown);
    };

    const submitDialog = () => {
      const title = summaryInput.value.trim();
      if (!title) {
        summaryInput.focus();
        return;
      }
      const desc = descInput.value.trim();
      const fullMessage = desc ? title + '\n\n' + desc : title;
      postMessage('editCommitMessage', { hash: commit.hash, message: fullMessage });
      closeDialog();
    };

    btnCancel.addEventListener('click', closeDialog);
    btnClose.addEventListener('click', closeDialog);
    btnOk.addEventListener('click', submitDialog);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeDialog();
    });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeDialog();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        submitDialog();
      }
    };

    document.addEventListener('keydown', onKeyDown);

    summaryInput.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        descInput.focus();
      }
    });

    setTimeout(() => {
      summaryInput.focus();
      summaryInput.select();
    }, 50);
  }

  function positionContextMenu(menu: HTMLElement, targetX: number, targetY: number) {
    const margin = 8;
    const maxAvailHeight = Math.max(80, window.innerHeight - margin * 2);
    menu.style.maxHeight = `${maxAvailHeight}px`;
    menu.style.overflowY = 'auto';

    const rect = menu.getBoundingClientRect();
    let x = targetX;
    let y = targetY;

    if (x + rect.width > window.innerWidth - margin) {
      x = Math.max(margin, window.innerWidth - rect.width - margin);
    }

    if (rect.height >= maxAvailHeight) {
      y = margin;
    } else {
      const spaceBelow = window.innerHeight - targetY - margin;
      const spaceAbove = targetY - margin;
      if (spaceBelow >= rect.height) {
        y = targetY;
      } else if (spaceAbove >= rect.height) {
        y = targetY - rect.height;
      } else {
        y = Math.max(margin, window.innerHeight - rect.height - margin);
      }
    }

    menu.style.left = Math.max(0, Math.round(x)) + 'px';
    menu.style.top = Math.max(0, Math.round(y)) + 'px';
  }

  function positionSubMenu(anchorItem: HTMLElement, subMenu: HTMLElement) {
    const margin = 8;
    const maxAvailHeight = Math.max(80, window.innerHeight - margin * 2);
    subMenu.style.maxHeight = `${maxAvailHeight}px`;
    subMenu.style.overflowY = 'auto';

    const bRect = anchorItem.getBoundingClientRect();
    let sx = bRect.right + 2;
    let sy = bRect.top;
    const sRect = subMenu.getBoundingClientRect();

    if (sx + sRect.width > window.innerWidth - margin) {
      sx = Math.max(margin, bRect.left - sRect.width - 2);
    }

    if (sRect.height >= maxAvailHeight) {
      sy = margin;
    } else if (sy + sRect.height > window.innerHeight - margin) {
      sy = Math.max(margin, window.innerHeight - sRect.height - margin);
    }

    subMenu.style.left = Math.max(0, Math.round(sx)) + 'px';
    subMenu.style.top = Math.max(0, Math.round(sy)) + 'px';
  }

  function showCommitContextMenu(e: MouseEvent, commit: any) {
    e.preventDefault();
    e.stopPropagation();
    (window as any).__lastGraphMenuOpenedAt = Date.now();
    window.dispatchEvent(new CustomEvent('closeAllGraphMenus'));
    closeCommitContextMenu();

    const commitList = commits || [];
    const isHead = commitList.length > 0 && commitList[0].hash === commit.hash;
    const menu = document.createElement('div');
    menu.className = 'commit-context-menu';
    menu.setAttribute('data-vscode-context', JSON.stringify({ preventDefaultContextMenuItems: true }));
    menu.addEventListener('contextmenu', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
    });

    function addItem(label: string, shortcut: string, iconSvg: string, onClick: () => void, disabled = false) {
      const it = document.createElement('div');
      it.className = 'ccm-item' + (disabled ? ' disabled' : '');

      const iconSpan = document.createElement('span');
      iconSpan.className = 'ccm-icon';
      if (iconSvg) iconSpan.innerHTML = iconSvg;
      it.appendChild(iconSpan);

      const lblSpan = document.createElement('span');
      lblSpan.className = 'ccm-label';
      lblSpan.innerText = label;
      it.appendChild(lblSpan);

      if (shortcut) {
        const scSpan = document.createElement('span');
        scSpan.className = 'ccm-shortcut';
        scSpan.innerText = shortcut;
        it.appendChild(scSpan);
      }

      if (!disabled && onClick) {
        it.addEventListener('click', (ev) => {
          ev.stopPropagation();
          closeCommitContextMenu();
          onClick();
        });
      }
      menu.appendChild(it);
      return it;
    }

    function addDivider() {
      const d = document.createElement('div');
      d.className = 'ccm-divider';
      menu.appendChild(d);
    }

    addItem('Copy Revision Number', '⌥⇧⌘C', ICON_COPY, () => {
      navigator.clipboard.writeText(commit.hash);
      showToast('Copied ' + commit.hash.slice(0, 8) + ' to clipboard');
    });

    addItem('Create Patch...', '', ICON_PLUS, () => {
      postMessage('createPatch', { hash: commit.hash });
    });

    addItem('Cherry-Pick', '', ICON_CHERRY, () => {
      postMessage('cherryPick', { hash: commit.hash });
    });

    addDivider();

    addItem('Checkout Revision', '', '', () => {
      postMessage('checkout', commit.hash);
    });

    addItem('Show Repository at Revision', '', '', () => {
      postMessage('showRepoAtRevision', { hash: commit.hash });
    });

    addItem('Compare with Local', '', '', () => {
      postMessage('compareWithLocal', { hash: commit.hash });
    });

    addDivider();

    addItem('Reset Current Branch to Here...', '', ICON_RESET, () => {
      postMessage('resetToCommit', { hash: commit.hash });
    });

    addItem('Revert Commit', '', '', () => {
      postMessage('revertCommit', { hash: commit.hash });
    });

    addItem('Undo Commit...', '', '', () => {
      postMessage('undoCommit', { hash: commit.hash });
    }, !isHead);

    addDivider();

    addItem('Edit Commit Message...', 'F2', '', () => {
      openEditCommitMessageDialog(commit);
    });

    addItem('Fixup...', '', '', () => {
      postMessage('fixupCommit', { hash: commit.hash });
    });

    addItem('Squash Into...', '', '', () => {
      postMessage('rebaseFromHere', commit.hash);
    });

    addItem('Drop Commit', '', '', () => {
      postMessage('dropCommit', { hash: commit.hash });
    });

    addItem('Interactively Rebase from Here...', '', '', () => {
      postMessage('rebaseFromHere', commit.hash);
    });

    addItem('Push All up to Here...', '', '', () => {
      showToast('Pushing up to ' + commit.hash.slice(0, 8) + '...');
      postMessage('pushUpToHere', { hash: commit.hash });
    });

    addDivider();

    const headCommit = (commits || []).find((c: any) => (c.refs || []).some((r: string) => r.startsWith('HEAD')));
    const activeBranch = headCommit?.refs?.find((r: string) => r.startsWith('HEAD -> '))?.replace('HEAD -> ', '') || 'HEAD';

    const branchRef = (commit.refs || []).find((r: string) => !r.startsWith('tag: ') && r !== 'HEAD') || (commit.refs && commit.refs[0] && !commit.refs[0].startsWith('tag: ') ? commit.refs[0] : null);
    if (branchRef) {
      const cleanBranch = branchRef.replace(/^HEAD -> /, '');
      const isCur = cleanBranch === activeBranch;
      const branchItem = document.createElement('div');
      branchItem.className = 'ccm-item has-submenu';
      branchItem.innerHTML = `<span class="ccm-icon"></span><span class="ccm-label">Branch '${cleanBranch}'</span><span class="ccm-arrow">›</span>`;

      const subMenu = document.createElement('div');
      subMenu.className = 'commit-context-menu ccm-submenu';

      function addSubItem(label: string, onClick: () => void) {
        const it = document.createElement('div');
        it.className = 'ccm-item';
        it.innerHTML = `<span class="ccm-icon"></span><span class="ccm-label">${label}</span>`;
        it.addEventListener('click', (ev) => {
          ev.stopPropagation();
          closeCommitContextMenu();
          onClick();
        });
        subMenu.appendChild(it);
      }

      if (isCur) {
        addSubItem(`New Branch from '${cleanBranch}'...`, () => openCreateBranchDialog(cleanBranch));
        addSubItem('Show Diff with Working Tree', () => postMessage('showDiff', { branch: cleanBranch }));
        addSubItem('Update', () => {
          showToast("Updating '" + cleanBranch + "'...");
          postMessage('pull', cleanBranch);
        });
        addSubItem('Push...', () => postMessage('push', cleanBranch));
        addSubItem('Rename...', () => openRenameBranchDialog(cleanBranch));
      } else {
        addSubItem('Checkout', () => {
          if (cleanBranch.includes('/')) {
            const slashIdx = cleanBranch.indexOf('/');
            const defaultName = cleanBranch.slice(slashIdx + 1);
            const branchData = (window as any).__GIT_BRANCH_DATA__;
            const branches: any[] = branchData?.branches || [];
            const localExists = branches.some((b) => !b.remote && b.name === defaultName);
            if (localExists) {
              openCheckoutBranchDialog({
                remoteRef: cleanBranch,
                defaultName,
                localBranches: branches.filter((b) => !b.remote).map((b) => b.name)
              });
              return;
            }
          }
          postMessage('checkout', cleanBranch);
        });
        addSubItem(`New Branch from '${cleanBranch}'...`, () => openCreateBranchDialog(cleanBranch));
        addSubItem('Merge into Current', () => postMessage('mergeBranch', cleanBranch));
        addSubItem('Rebase Current onto Selected', () => postMessage('rebase', cleanBranch));
        addSubItem('Compare with Current', () => {
          postMessage('compareBranch', { branch: cleanBranch, withBranch: activeBranch });
        });
        addSubItem('Show Diff with Working Tree', () => postMessage('showDiff', { branch: cleanBranch }));
        addSubItem('Update', () => {
          showToast("Updating '" + cleanBranch + "'...");
          postMessage('pull', cleanBranch);
        });
        addSubItem('Push...', () => postMessage('push', cleanBranch));
        addSubItem('Rename...', () => openRenameBranchDialog(cleanBranch));
      }

      let subMenuTimer: any;
      branchItem.addEventListener('mouseenter', () => {
        clearTimeout(subMenuTimer);
        document.body.appendChild(subMenu);
        subMenu.style.display = 'block';
        positionSubMenu(branchItem, subMenu);
      });
      branchItem.addEventListener('mouseleave', () => {
        clearTimeout(subMenuTimer);
        subMenuTimer = setTimeout(() => subMenu.remove(), 150);
      });
      subMenu.addEventListener('mouseenter', () => clearTimeout(subMenuTimer));
      subMenu.addEventListener('mouseleave', () => {
        clearTimeout(subMenuTimer);
        subMenuTimer = setTimeout(() => subMenu.remove(), 150);
      });
      menu.appendChild(branchItem);
    }

    const tagRef = (commit.refs || []).find((r: string) => r.startsWith('tag: '));
    if (tagRef) {
      const cleanTag = tagRef.replace(/^tag: /, '');
      const tagItem = document.createElement('div');
      tagItem.className = 'ccm-item has-submenu';
      tagItem.innerHTML = `<span class="ccm-icon"></span><span class="ccm-label">Tag '${cleanTag}'</span><span class="ccm-arrow">›</span>`;

      const tagSubMenu = document.createElement('div');
      tagSubMenu.className = 'commit-context-menu ccm-submenu';

      function addTagSubItem(label: string, onClick: () => void) {
        const it = document.createElement('div');
        it.className = 'ccm-item';
        it.innerHTML = `<span class="ccm-icon"></span><span class="ccm-label">${label}</span>`;
        it.addEventListener('click', (ev) => {
          ev.stopPropagation();
          closeCommitContextMenu();
          onClick();
        });
        tagSubMenu.appendChild(it);
      }

      addTagSubItem(`Checkout Tag '${cleanTag}'`, () => postMessage('checkout', cleanTag));
      addTagSubItem(`New Branch from '${cleanTag}'...`, () => openCreateBranchDialog(cleanTag));
      addTagSubItem(`Compare with Current`, () => postMessage('compareBranch', { branch: cleanTag, withBranch: activeBranch }));
      addTagSubItem('Show Diff with Working Tree', () => postMessage('showDiff', { branch: cleanTag }));
      addTagSubItem(`Push Tag '${cleanTag}'`, () => postMessage('pushTag', cleanTag));
      addTagSubItem(`Delete Tag '${cleanTag}'`, () => postMessage('deleteTag', cleanTag));

      let tagTimer: any;
      tagItem.addEventListener('mouseenter', () => {
        clearTimeout(tagTimer);
        document.body.appendChild(tagSubMenu);
        tagSubMenu.style.display = 'block';
        positionSubMenu(tagItem, tagSubMenu);
      });
      tagItem.addEventListener('mouseleave', () => {
        clearTimeout(tagTimer);
        tagTimer = setTimeout(() => tagSubMenu.remove(), 150);
      });
      tagSubMenu.addEventListener('mouseenter', () => clearTimeout(tagTimer));
      tagSubMenu.addEventListener('mouseleave', () => {
        clearTimeout(tagTimer);
        tagTimer = setTimeout(() => tagSubMenu.remove(), 150);
      });
      menu.appendChild(tagItem);
    }

    addItem('New Branch...', '⌥⌘N', '', () => {
      openCreateBranchDialog(commit.hash);
    });

    addItem('New Tag...', '', '', () => {
      openCreateTagDialog(commit.hash);
    });

    addDivider();

    let childCommit = commitList.find((c: any) => c.parents && c.parents.includes(commit.hash));
    addItem('Go to Child Commit', '←', '', () => {
      if (childCommit) onSelectCommit(childCommit.hash);
    }, !childCommit);

    const hasParent = commit.parents && commit.parents.length > 0;
    addItem('Go to Parent Commit', '→', '', () => {
      if (hasParent) onSelectCommit(commit.parents[0]);
    }, !hasParent);

    addDivider();

    addItem('View in browser', '', ICON_WEB, () => {
      postMessage('openInBrowser', { hash: commit.hash });
    });

    document.body.appendChild(menu);
    positionContextMenu(menu, e.clientX, e.clientY);
  }

  function showBranchLabelContextMenu(e: MouseEvent, branchName: string) {
    e.preventDefault();
    e.stopPropagation();
    (window as any).__lastGraphMenuOpenedAt = Date.now();
    window.dispatchEvent(new CustomEvent('closeAllGraphMenus'));
    closeCommitContextMenu();

    const isTag = branchName.startsWith('tag: ');
    const cleanName = branchName.replace(/^refs\/(heads|remotes)\//, '').replace(/^HEAD -> /, '').replace(/^tag: /, '');
    const headCommit = (commits || []).find((c: any) => (c.refs || []).some((r: string) => r.startsWith('HEAD')));
    const activeBranch = headCommit?.refs?.find((r: string) => r.startsWith('HEAD -> '))?.replace('HEAD -> ', '') || 'HEAD';

    const menu = document.createElement('div');
    menu.className = 'commit-context-menu branch-context-menu';
    menu.setAttribute('data-vscode-context', JSON.stringify({ preventDefaultContextMenuItems: true }));
    menu.addEventListener('contextmenu', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
    });

    function addMenuItem(label: string, onClick: () => void, disabled = false) {
      const it = document.createElement('div');
      it.className = 'ccm-item' + (disabled ? ' disabled' : '');
      it.innerHTML = `<span class="ccm-icon"></span><span class="ccm-label">${label}</span>`;
      if (!disabled && onClick) {
        it.addEventListener('click', (ev) => {
          ev.stopPropagation();
          closeCommitContextMenu();
          onClick();
        });
      }
      menu.appendChild(it);
    }

    function addDivider() {
      const d = document.createElement('div');
      d.className = 'ccm-divider';
      menu.appendChild(d);
    }

    if (isTag) {
      addMenuItem(`Checkout Tag '${cleanName}'`, () => postMessage('checkout', cleanName));
      addMenuItem(`New Branch from '${cleanName}'...`, () => openCreateBranchDialog(cleanName));
      addDivider();
      addMenuItem(`Compare with Current (${activeBranch})`, () => postMessage('compareBranch', { branch: cleanName, withBranch: activeBranch }));
      addMenuItem('Show Diff with Working Tree', () => postMessage('showDiff', { branch: cleanName }));
      addDivider();
      addMenuItem(`Push Tag '${cleanName}'`, () => postMessage('pushTag', cleanName));
      addMenuItem(`Delete Tag '${cleanName}'`, () => postMessage('deleteTag', cleanName));
    } else {
      const isCurrent = cleanName === activeBranch;
      if (isCurrent) {
        addMenuItem(`New Branch from '${cleanName}'...`, () => openCreateBranchDialog(cleanName));
        addMenuItem('Show Diff with Working Tree', () => postMessage('showDiff', { branch: cleanName }));
        addDivider();
        addMenuItem('Update', () => {
          showToast("Updating '" + cleanName + "'...");
          postMessage('pull', cleanName);
        });
        addMenuItem('Push...', () => postMessage('push', cleanName));
        addDivider();
        addMenuItem('Rename...', () => openRenameBranchDialog(cleanName));
      } else {
        addMenuItem(`Checkout '${cleanName}'`, () => postMessage('checkout', cleanName));
        addMenuItem(`New Branch from '${cleanName}'...`, () => openCreateBranchDialog(cleanName));
        addMenuItem(`Checkout and Rebase onto '${activeBranch}'`, () => postMessage('checkoutAndRebase', { branch: cleanName, onto: activeBranch }));
        addDivider();
        addMenuItem(`Compare with Current (${activeBranch})`, () => postMessage('compareBranch', { branch: cleanName, withBranch: activeBranch }));
        addMenuItem('Show Diff with Working Tree', () => postMessage('showDiff', { branch: cleanName }));
        addDivider();
        addMenuItem(`Rebase '${activeBranch}' onto '${cleanName}'`, () => postMessage('rebase', cleanName));
        addMenuItem(`Merge '${cleanName}' into '${activeBranch}'`, () => postMessage('mergeBranch', cleanName));
        addDivider();
        addMenuItem('Update', () => {
          showToast("Updating '" + cleanName + "'...");
          postMessage('pull', cleanName);
        });
        addMenuItem('Push...', () => postMessage('push', cleanName));
        addDivider();
        addMenuItem('Rename...', () => openRenameBranchDialog(cleanName));
        addMenuItem('Delete', () => postMessage('deleteBranch', cleanName));
      }
    }

    document.body.appendChild(menu);
    positionContextMenu(menu, e.clientX, e.clientY);
  }

  function onContextMenu(e: MouseEvent, commit: any) {
    if (commit && commit.hash) {
      onSelectCommit(commit.hash);
    }
    showCommitContextMenu(e, commit);
  }

  function closeContextMenu() {
    showContextMenu = false;
    contextMenuHash = null;
  }

  function handleRebase() {
    if (contextMenuHash) {
      onRebaseFromHere(contextMenuHash);
    }
    closeContextMenu();
  }

  $effect(() => {
    if (scrollToIndex >= 0 && containerEl) {
      const targetY = scrollToIndex * ROW_HEIGHT;
      containerEl.scrollTo({
        top: targetY - containerHeight / 2 + ROW_HEIGHT,
        behavior: 'smooth'
      });
    }
  });

  onMount(() => {
    const closeAllMenus = () => {
      closeContextMenu();
      closeCommitContextMenu();
    };

    const mousedownHandler = (ev: MouseEvent) => {
      const target = ev.target && (ev.target as HTMLElement).nodeType === 1 ? (ev.target as HTMLElement) : (ev.target as HTMLElement)?.parentElement;
      if (!target || (!target.closest?.('.commit-context-menu') && !target.closest?.('.branch-context-menu'))) {
        window.dispatchEvent(new CustomEvent('closeAllGraphMenus'));
      }
    };

    const keydownHandler = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        window.dispatchEvent(new CustomEvent('closeAllGraphMenus'));
        return;
      }
      if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;
      const selHash = selectedHash;
      if (!selHash) return;
      const commitList = commits || [];
      const commit = commitList.find((c: any) => c.hash === selHash);
      if (!commit) return;

      if (ev.key === 'F2') {
        ev.preventDefault();
        openEditCommitMessageDialog(commit);
      } else if ((ev.metaKey || ev.ctrlKey) && (ev.key === 'c' || ev.key === 'C') && !window.getSelection()?.toString()) {
        ev.preventDefault();
        navigator.clipboard.writeText(commit.hash);
        showToast('Copied ' + commit.hash.slice(0, 8) + ' to clipboard');
      } else if (ev.key === 'ArrowLeft') {
        const childCommit = commitList.find((c: any) => c.parents && c.parents.includes(commit.hash));
        if (childCommit) {
          ev.preventDefault();
          onSelectCommit(childCommit.hash);
        }
      } else if (ev.key === 'ArrowRight') {
        if (commit.parents && commit.parents.length > 0) {
          ev.preventDefault();
          onSelectCommit(commit.parents[0]);
        }
      }
    };

    document.addEventListener('mousedown', mousedownHandler);
    window.addEventListener('keydown', keydownHandler);
    window.addEventListener('closeAllGraphMenus', closeAllMenus);

    const blurHandler = () => {
      if (Date.now() - ((window as any).__lastGraphMenuOpenedAt || 0) > 200) {
        closeAllMenus();
      }
    };
    window.addEventListener('blur', blurHandler);

    const visHandler = () => {
      if (document.hidden) closeAllMenus();
    };
    document.addEventListener('visibilitychange', visHandler);
    const msgHandler = (ev: MessageEvent) => {
      if (ev.data?.type === 'closeAllMenus') {
        if (Date.now() - ((window as any).__lastGraphMenuOpenedAt || 0) > 200) {
          closeAllMenus();
        }
      }
    };
    window.addEventListener('message', msgHandler);

    return () => {
      document.removeEventListener('mousedown', mousedownHandler);
      window.removeEventListener('keydown', keydownHandler);
      window.removeEventListener('closeAllGraphMenus', closeAllMenus);
      window.removeEventListener('blur', blurHandler);
      document.removeEventListener('visibilitychange', visHandler);
      window.removeEventListener('message', msgHandler);
    };
  });

  function isMyCommit(commit: any): boolean {
    const cUser = typeof window !== 'undefined' ? (window as any).__GIT_CURRENT_USER__ : null;
    if (!cUser) return false;
    const ca = (commit.author || '').trim().toLowerCase();
    const ce = (commit.authorEmail || '').trim().toLowerCase();
    const un = (cUser.name || '').trim().toLowerCase();
    const ue = (cUser.email || '').trim().toLowerCase();
    if (un && ca && (ca === un || ca.includes(un) || un.includes(ca))) return true;
    if (ue && ce && (ce === ue || ce.includes(ue) || ue.includes(ce))) return true;
    if (ue && ca && ca === ue.split('@')[0]) return true;
    return false;
  }

  function computeGraphWidth(commit: any): number {
    const g = commit.graph;
    let maxCol = g ? g.column : 0;
    if (g && g.lines) {
      for (let li = 0; li < g.lines.length; li++) {
        const l = g.lines[li];
        if (l.fromColumn > maxCol) maxCol = l.fromColumn;
        if (l.toColumn > maxCol) maxCol = l.toColumn;
      }
    }
    const rowBranches = Math.max(4, maxCol + 1);
    return rowBranches * 16 + 20;
  }
</script>

<div class="commit-list-container" bind:this={containerEl} onscroll={onScroll}>
  <div
    class="scroll-content"
    style="height: {commits.length * ROW_HEIGHT}px; position: relative; min-width: 100%; width: max-content;"
  >
    <div
      class="visible-rows"
      style="transform: translateY({startIndex * ROW_HEIGHT}px); min-width: 100%; width: max-content;"
    >
      <div class="graph-column">
        <CommitGraph
          nodes={graphNodes}
          {graphWidth}
          {startIndex}
          visibleCount={endIndex - startIndex}
          rowHeight={ROW_HEIGHT}
        />
      </div>
      <div class="rows-column">
        {#each visibleCommits as commit (commit.hash)}
          {@const isMerge = (commit.parents && commit.parents.length > 1) || (commit.subject && commit.subject.startsWith('Merge '))}
          {@const isCur = commit.isCurrentBranch !== false}
          {@const isHead = commit.refs && commit.refs.some((r: string) => r === 'HEAD' || r.startsWith('HEAD -> '))}
          {@const isMy = isMyCommit(commit)}
          {@const gw = computeGraphWidth(commit)}
          <div
            role="row"
            tabindex="0"
            class="commit-row"
            class:is-merge={isMerge}
            class:is-current-branch={isCur}
            class:is-head={isHead}
            class:selected={commit.hash === selectedHash}
            style="height: 25px;"
            onclick={() => onSelectCommit(commit.hash)}
            oncontextmenu={(e) => onContextMenu(e, commit)}
            onkeydown={(e) => { if (e.key === 'Enter') onSelectCommit(commit.hash); }}
          >
            <span class="hash" style="width: {gw}px; min-width: {gw}px;"></span>
            {#if commit.refs && commit.refs.length > 0}
              <BranchLabels
                refs={commit.refs}
                onBranchContextMenu={showBranchLabelContextMenu}
                onBranchCheckout={(name) => postMessage('checkout', name.replace(/^refs\/(heads|remotes)\//, '').replace(/^HEAD -> /, ''))}
              />
            {/if}
            <span class="subject" title={commit.subject}>{commit.subject}</span>
            <span class="author" class:is-my-commit={isMy}>{commit.author}</span>
            <span class="date">{formatDate(commit.authorDate)}</span>
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>

{#if showContextMenu}
  <div class="context-menu" style="left: {contextMenuPos.x}px; top: {contextMenuPos.y}px;">
    <button class="context-item" onclick={handleRebase}>Interactively Rebase from Here...</button>
  </div>
{/if}

<style>
  .commit-list-container {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    overflow-y: auto;
    overflow-x: auto;
  }
  .commit-list-container::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  .commit-list-container::-webkit-scrollbar-track {
    background: transparent;
  }
  .commit-list-container::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.18);
    border-radius: 3px;
  }
  .commit-list-container::-webkit-scrollbar-thumb:hover {
    background: rgba(255,255,255,0.35);
  }
  .commit-list-container::-webkit-scrollbar-corner {
    background: transparent;
  }
  .scroll-content {
    min-width: 100%;
    width: max-content;
  }
  .visible-rows {
    position: relative;
    display: block;
    min-width: 100%;
    width: max-content;
  }
  .graph-column {
    position: absolute;
    top: 0;
    left: 244px;
    pointer-events: none;
    z-index: 1;
  }
  .rows-column {
    min-width: 100%;
    width: max-content;
  }
  .commit-row {
    box-sizing: border-box !important;
    height: 25px !important;
    min-height: 25px !important;
    max-height: 25px !important;
    line-height: 25px !important;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 8px;
    cursor: pointer;
    white-space: nowrap;
    position: relative;
    border-bottom: none;
    min-width: 100%;
    width: max-content;
  }
  .commit-row * {
    box-sizing: border-box;
  }
  .commit-row:hover {
    background: var(--vscode-list-hoverBackground);
  }
  .commit-row.selected {
    background: var(--vscode-list-activeSelectionBackground) !important;
    color: var(--vscode-list-activeSelectionForeground, #ffffff) !important;
    box-shadow: inset 0 0 0 999px rgba(255,255,255,0.08) !important;
  }
  .commit-row.selected:hover {
    background: var(--vscode-list-activeSelectionBackground) !important;
    filter: brightness(1.18);
    box-shadow: inset 0 0 0 999px rgba(255,255,255,0.14) !important;
  }
  .commit-row.selected .author,
  .commit-row.selected .date,
  .commit-row.selected .subject,
  .commit-row.selected .hash,
  .commit-row.selected * {
    color: var(--vscode-list-activeSelectionForeground, #ffffff) !important;
  }
  .author {
    order: 1;
    flex-shrink: 0;
    font-weight: 400;
    color: #9aa0a6;
    font-size: 0.92em;
    width: 95px;
    min-width: 95px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .date {
    order: 2;
    flex-shrink: 0;
    color: #8c8c8c;
    font-size: 0.88em;
    width: 125px;
    min-width: 125px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .hash {
    order: 3;
    flex-shrink: 0;
    color: transparent;
    user-select: none;
    font-size: 0;
  }
  .subject {
    order: 4;
    flex: 0 0 auto;
    min-width: max-content;
    white-space: nowrap;
    color: #dfe1e5;
    font-size: 0.92em;
  }
  .commit-row.is-head .subject {
    font-weight: 600;
    color: #ffffff;
  }
  :global(body.hl-my-commits) .author.is-my-commit {
    font-weight: 700 !important;
    color: #ffffff !important;
  }
  :global(body.hl-merge-commits) .commit-row.is-merge .subject {
    color: #8c8c8c !important;
    font-weight: 400;
  }
  :global(body.hl-merge-commits) .commit-row.is-merge .author {
    color: #8c8c8c !important;
    font-weight: 400;
  }
  :global(body.hl-merge-commits) .commit-row.selected .subject,
  :global(body.hl-merge-commits) .commit-row.selected .author {
    color: var(--vscode-list-activeSelectionForeground, #ffffff) !important;
  }
  :global(body.hl-current-branch) .commit-row.is-current-branch:not(.selected) {
    background: rgba(255,255,255,0.038) !important;
    box-shadow: none !important;
  }
  :global(body.hl-current-branch) .commit-row.is-current-branch:not(.selected):hover {
    background: var(--vscode-list-hoverBackground) !important;
    box-shadow: none !important;
  }
  :global(body.hl-current-branch) .commit-row.selected {
    background: var(--vscode-list-activeSelectionBackground) !important;
  }
  :global(body.hl-current-branch) .commit-row.selected:hover {
    background: var(--vscode-list-activeSelectionBackground) !important;
    filter: brightness(1.18);
  }
  .context-menu {
    position: fixed;
    background: var(--vscode-menu-background, #252526);
    border: 1px solid var(--vscode-menu-border, #454545);
    border-radius: 4px;
    padding: 4px 0;
    z-index: 1000;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  }
  .context-item {
    display: block;
    width: 100%;
    padding: 6px 20px;
    border: none;
    background: none;
    color: var(--vscode-menu-foreground, #ccc);
    font-size: inherit;
    text-align: left;
    cursor: pointer;
  }
  .context-item:hover {
    background: var(--vscode-menu-selectionBackground, #094771);
    color: var(--vscode-menu-selectionForeground, #fff);
  }

  :global(.as-dialog-overlay) {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.55);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 99999;
    backdrop-filter: blur(1px);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  :global(.as-dialog-card) {
    background: var(--vscode-editorWidget-background, var(--vscode-editor-background, #1e1f22));
    border: 1px solid var(--vscode-widget-border, var(--vscode-panel-border, #393b40));
    border-radius: 6px;
    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.55);
    width: 480px;
    max-width: 92vw;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    color: var(--vscode-editor-foreground, #dfe1e5);
  }
  :global(.as-dialog-header) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    background: var(--vscode-sideBar-background, var(--vscode-editorWidget-background, #2b2d30));
    border-bottom: 1px solid var(--vscode-widget-border, var(--vscode-panel-border, #393b40));
    font-weight: 600;
    font-size: 13px;
    user-select: none;
  }
  :global(.as-dialog-close) {
    cursor: pointer;
    opacity: 0.7;
    font-size: 14px;
    padding: 2px 6px;
    border-radius: 4px;
  }
  :global(.as-dialog-close:hover) {
    opacity: 1;
    background: rgba(255, 255, 255, 0.1);
  }
  :global(.as-dialog-body) {
    padding: 16px 20px 12px 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  :global(.as-dialog-field-label) {
    font-size: 12px;
    font-weight: 500;
    color: var(--vscode-descriptionForeground, #8c9199);
  }
  :global(.as-dialog-input),
  :global(.as-dialog-textarea) {
    background: var(--vscode-input-background, #1e1f22);
    color: var(--vscode-input-foreground, #dfe1e5);
    border: 1px solid var(--vscode-input-border, #4e5157);
    border-radius: 4px;
    padding: 6px 10px;
    font-size: 13px;
    outline: none;
    font-family: inherit;
    box-sizing: border-box;
    width: 100%;
  }
  :global(.as-dialog-input:focus),
  :global(.as-dialog-textarea:focus) {
    border-color: var(--vscode-focusBorder, #3574f0);
  }
  :global(.as-dialog-textarea) {
    height: 90px;
    resize: vertical;
  }
  :global(.as-dialog-footer) {
    padding: 10px 20px 14px 20px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
    background: var(--vscode-editorWidget-background, var(--vscode-editor-background, #1e1f22));
    border-top: 1px solid var(--vscode-widget-border, var(--vscode-panel-border, #393b40));
  }
  :global(.as-dialog-btn) {
    height: 28px;
    padding: 0 16px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    user-select: none;
    box-sizing: border-box;
    transition: background 0.12s ease, border-color 0.12s ease;
  }
  :global(.as-dialog-btn-secondary) {
    background: var(--vscode-button-secondaryBackground, #2b2d30);
    color: var(--vscode-button-secondaryForeground, #dfe1e5);
    border: 1px solid var(--vscode-widget-border, var(--vscode-input-border, #4e5157));
  }
  :global(.as-dialog-btn-secondary:hover) {
    background: var(--vscode-button-secondaryHoverBackground, #35373c);
  }
  :global(.as-dialog-btn-primary) {
    background: var(--vscode-button-background, #3574f0);
    color: var(--vscode-button-foreground, #ffffff);
    border: 1px solid var(--vscode-button-background, #3574f0);
  }
  :global(.as-dialog-btn-primary:hover) {
    background: var(--vscode-button-hoverBackground, #3068d9);
    border-color: var(--vscode-button-hoverBackground, #3068d9);
  }
</style>
