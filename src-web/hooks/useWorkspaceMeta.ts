import type { WorkspaceMeta } from '@yaakapp-internal/models';
import { atom, useAtomValue } from 'jotai';

export const workspaceMetaAtom = atom<WorkspaceMeta>();

export function useWorkspaceMeta() {
  const workspaceMeta = useAtomValue(workspaceMetaAtom);
  if (!workspaceMeta) {
    throw new Error('WorkspaceMeta not found');
  }

  return workspaceMeta;
}
