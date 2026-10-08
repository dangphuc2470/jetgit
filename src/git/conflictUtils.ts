export type SmartActionLabel = 'Checkout' | 'Update' | 'Merge' | 'Rebase' | 'Cherry-Pick' | 'Revert';

export function isDirtyTreeConflict(rawError: string): boolean {
  return (
    /Your local changes to the following files would be overwritten by (merge|checkout)/i.test(rawError) ||
    /The following untracked working tree files would be overwritten by (merge|checkout)/i.test(rawError) ||
    /cannot rebase: (?:You have unstaged changes|Your index contains uncommitted changes)/i.test(rawError) ||
    /cannot pull with rebase: (?:You have unstaged changes|Your index contains uncommitted changes)/i.test(rawError) ||
    /error: (?:cannot rebase|cannot cherry-pick|cannot revert):/i.test(rawError) ||
    /error: Your local changes to the following files would be overwritten/i.test(rawError) ||
    /Please commit or stash them before you (?:merge|rebase|cherry-pick|revert)/i.test(rawError)
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
    rawError.includes('git rebase --continue')
  );
}

export function extractOverwrittenFiles(rawError: string): string[] {
  const filesMatch = rawError.match(/overwritten by (?:merge|checkout):([\s\S]*?)(?:Please commit|Aborting|$)/i);
  if (!filesMatch) return [];
  return filesMatch[1]
    .split('\n')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('error:'));
}

export function makeStashName(actionLabel: string, targetRef: string, timestamp = Date.now()): string {
  const stashPrefix = actionLabel.toLowerCase().replace(/[^a-z0-9]/g, '');
  const safeRef = (targetRef || 'HEAD').replace(/[^a-zA-Z0-9_-]/g, '_');
  return `autostash-${stashPrefix}-${safeRef}-${timestamp}`;
}
