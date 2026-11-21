import * as vscode from 'vscode';

export interface AdvancedActionsSettings {
  fetchBranch: boolean;
  fetchBranchShallow: boolean;
  trackIntoCurrent: boolean;
}

export interface JetGitSettings {
  fontSize: {
    log: number;
    commit: number;
    merge: number;
  };
  ui: {
    advanced: AdvancedActionsSettings;
  };
  merge: {
    noFastForward: boolean;
  };
}

export const DEFAULT_JETGIT_SETTINGS: JetGitSettings = {
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
};

function clampFontSize(val: unknown): number {
  const num = typeof val === 'number' ? val : Number(val);
  if (!Number.isFinite(num) || num <= 0) {
    return 0;
  }
  return Math.min(28, Math.max(9, Math.round(num)));
}

export function getJetGitSettings(): JetGitSettings {
  const cfg = vscode.workspace.getConfiguration('jetgit');
  return {
    fontSize: {
      log: clampFontSize(cfg.get<number>('fontSize.log', DEFAULT_JETGIT_SETTINGS.fontSize.log)),
      commit: clampFontSize(cfg.get<number>('fontSize.commit', DEFAULT_JETGIT_SETTINGS.fontSize.commit)),
      merge: clampFontSize(cfg.get<number>('fontSize.merge', DEFAULT_JETGIT_SETTINGS.fontSize.merge)),
    },
    ui: {
      advanced: {
        fetchBranch: cfg.get<boolean>(
          'ui.advanced.fetchBranch',
          DEFAULT_JETGIT_SETTINGS.ui.advanced.fetchBranch,
        ),
        fetchBranchShallow: cfg.get<boolean>(
          'ui.advanced.fetchBranchShallow',
          DEFAULT_JETGIT_SETTINGS.ui.advanced.fetchBranchShallow,
        ),
        trackIntoCurrent: cfg.get<boolean>(
          'ui.advanced.trackIntoCurrent',
          DEFAULT_JETGIT_SETTINGS.ui.advanced.trackIntoCurrent,
        ),
      },
    },
    merge: {
      noFastForward: cfg.get<boolean>(
        'merge.noFastForward',
        DEFAULT_JETGIT_SETTINGS.merge.noFastForward,
      ),
    },
  };
}

export async function updateJetGitSetting(key: string, value: unknown): Promise<void> {
  const cfg = vscode.workspace.getConfiguration('jetgit');
  const inspected = cfg.inspect(key);
  const target =
    inspected && inspected.workspaceValue !== undefined
      ? vscode.ConfigurationTarget.Workspace
      : vscode.ConfigurationTarget.Global;
  await cfg.update(key, value, target);
}

export async function resetAllJetGitSettings(): Promise<void> {
  const keys = [
    'fontSize.log',
    'fontSize.commit',
    'fontSize.merge',
    'ui.advanced.fetchBranch',
    'ui.advanced.fetchBranchShallow',
    'ui.advanced.trackIntoCurrent',
    'merge.noFastForward',
  ];
  const cfg = vscode.workspace.getConfiguration('jetgit');
  for (const key of keys) {
    const inspected = cfg.inspect(key);
    if (inspected?.workspaceValue !== undefined) {
      await cfg.update(key, undefined, vscode.ConfigurationTarget.Workspace);
    }
    if (inspected?.globalValue !== undefined) {
      await cfg.update(key, undefined, vscode.ConfigurationTarget.Global);
    }
  }
}
