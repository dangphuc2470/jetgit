import { GraphActionHost } from './types';
import { handleBranchAction } from './branchActions';
import { handleRemoteAction } from './remoteActions';
import { handleCommitAction } from './commitActions';

export * from './types';
export * from './conflictResolution';
export * from './branchActions';
export * from './remoteActions';
export * from './commitActions';

export async function handleGraphAction(
  type: string,
  payload: any,
  host: GraphActionHost
): Promise<boolean> {
  if (await handleBranchAction(type, payload, host)) return true;
  if (await handleRemoteAction(type, payload, host)) return true;
  if (await handleCommitAction(type, payload, host)) return true;
  return false;
}
