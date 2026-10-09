export type SmartActionLabel = 'Checkout' | 'Update' | 'Merge' | 'Rebase' | 'Cherry-Pick' | 'Revert';

export function isDirtyTreeConflict(rawError: string): boolean {
  return (
    /Your local changes to the following files would be overwritten by (?:merge|checkout|rebase)/i.test(rawError) ||
    /The following untracked working tree files would be overwritten by (?:merge|checkout|rebase)/i.test(rawError) ||
    /cannot rebase: (?:You have unstaged changes|Your index contains uncommitted changes)/i.test(rawError) ||
    /cannot pull with rebase: (?:You have unstaged changes|Your index contains uncommitted changes)/i.test(rawError) ||
    /error: (?:cannot rebase|cannot cherry-pick|cannot revert):/i.test(rawError) ||
    /error: Your local changes to the following files would be overwritten/i.test(rawError) ||
    /Please commit (?:your changes )?or stash them before you (?:merge|rebase|cherry-pick|revert|switch branches)/i.test(rawError) ||
    /Please move or remove them before you (?:merge|rebase|switch branches)/i.test(rawError)
  );
}

export function isThreeWayConflict(rawError: string, hasActiveConflicts = false): boolean {
  return (
    hasActiveConflicts ||
    rawError.includes('CONFLICT') ||
    rawError.includes('Automatic merge failed') ||
    rawError.includes('fix conflicts') ||
    rawError.includes('could not apply') ||
    rawError.includes('could not revert') ||
    rawError.includes('git rebase --continue') ||
    rawError.includes('git cherry-pick --continue') ||
    rawError.includes('git revert --continue')
  );
}

export function extractOverwrittenFiles(rawError: string): string[] {
  const filesMatch = rawError.match(/overwritten by (?:merge|checkout|rebase):([\s\S]*?)(?:Please commit|Please move|Aborting|$)/i);
  if (!filesMatch) return [];
  return filesMatch[1]
    .split('\n')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('error:') && !s.startsWith('fatal:'));
}

export function makeStashName(actionLabel: string, targetRef: string, timestamp = Date.now()): string {
  const stashPrefix = actionLabel.toLowerCase().replace(/[^a-z0-9]/g, '');
  const safeRef = (targetRef || 'HEAD').replace(/[^a-zA-Z0-9_-]/g, '_');
  return `autostash-${stashPrefix}-${safeRef}-${timestamp}`;
}

export interface InProgressOperation {
  type: 'merge' | 'rebase' | 'cherry-pick' | 'revert';
  title: string;
}

export function detectInProgressOperation(rawError: string): InProgressOperation | null {
  if (
    /MERGE_HEAD exists/i.test(rawError) ||
    /You have not concluded your merge/i.test(rawError) ||
    /Cannot merge: You have not concluded your merge/i.test(rawError) ||
    /Automatic merge failed; fix conflicts/i.test(rawError)
  ) {
    return { type: 'merge', title: 'Merge' };
  }

  if (
    /cannot switch branch while rebasing/i.test(rawError) ||
    /A rebase is already in progress/i.test(rawError) ||
    /apply or drop previous rebase/i.test(rawError) ||
    (/git rebase --(?:continue|skip|abort)/i.test(rawError) && !isDirtyTreeConflict(rawError))
  ) {
    return { type: 'rebase', title: 'Rebase' };
  }

  if (
    /CHERRY_PICK_HEAD exists/i.test(rawError) ||
    /cherry-pick is already in progress/i.test(rawError) ||
    /git cherry-pick --(?:continue|skip|abort)/i.test(rawError)
  ) {
    return { type: 'cherry-pick', title: 'Cherry-Pick' };
  }

  if (
    /REVERT_HEAD exists/i.test(rawError) ||
    /revert is already in progress/i.test(rawError) ||
    /git revert --(?:continue|skip|abort)/i.test(rawError)
  ) {
    return { type: 'revert', title: 'Revert' };
  }

  return null;
}

export function isIndexLockError(rawError: string): boolean {
  return (
    /index\.lock/i.test(rawError) &&
    /(?:File exists|Unable to create|Another git process seems to be running)/i.test(rawError)
  );
}

export function isPushRejectedError(rawError: string): boolean {
  return (
    /\[rejected\]/i.test(rawError) ||
    /Updates were rejected because the remote contains work/i.test(rawError) ||
    /Updates were rejected because the tip of your current branch is behind/i.test(rawError) ||
    /fetch first/i.test(rawError) ||
    /non-fast-forward/i.test(rawError)
  );
}

export function isBranchAlreadyExistsError(rawError: string): string | null {
  const match = rawError.match(/fatal: (?:A|a) branch named '([^']+)' already exists/i);
  return match ? match[1] : null;
}
