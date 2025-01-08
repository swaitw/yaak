import { debounce } from '@yaakapp-internal/lib';
import type { AnyModel, ModelPayload } from '@yaakapp-internal/models';
import { watchWorkspaceFiles } from '@yaakapp-internal/sync';
import { syncWorkspace } from '../commands/commands';
import { listenToTauriEvent } from '../hooks/useListenToTauriEvent';
import { workspaceMetaAtom } from '../hooks/useWorkspaceMeta';
import { jotaiStore } from '../lib/jotai';

export function initSync() {
  let unsub: (() => void) | undefined;
  jotaiStore.sub(workspaceMetaAtom, () => {
    unsub?.(); // Unsub from any previous watcher
    const workspaceMeta = jotaiStore.get(workspaceMetaAtom);
    if (workspaceMeta == null) return;
    unsub = initForWorkspace(workspaceMeta.workspaceId, workspaceMeta.settingSyncDir);
  });
}

// TODO: This list should be derived from something, because we might forget something here
const relevantModels: AnyModel['model'][] = [
  'workspace',
  'folder',
  'environment',
  'http_request',
  'grpc_request',
];

function initForWorkspace(workspaceId: string, syncDir: string | null) {
  console.log('Initializing directory sync for', workspaceId, syncDir);

  const debouncedSync = debounce(() => {
    if (syncDir == null) return;
    syncWorkspace.mutate({ workspaceId, syncDir });
  });

  // Sync on model upsert
  listenToTauriEvent<ModelPayload>('upserted_model', (p) => {
    const isRelevant = relevantModels.includes(p.payload.model.model);
    if (isRelevant) debouncedSync();
  });

  // Sync on model deletion
  listenToTauriEvent<ModelPayload>('deleted_model', (p) => {
    const isRelevant = relevantModels.includes(p.payload.model.model);
    if (isRelevant) debouncedSync();
  });

  // Sync on sync dir changes
  if (syncDir != null) {
    return watchWorkspaceFiles(workspaceId, syncDir, debouncedSync);
  }

  // Perform an initial sync operation
  debouncedSync();
}
