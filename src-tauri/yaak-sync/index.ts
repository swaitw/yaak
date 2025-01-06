import { Channel, invoke } from '@tauri-apps/api/core';
import { emit } from '@tauri-apps/api/event';
import { Workspace } from '@yaakapp-internal/models';
import { useEffect } from 'react';
import { SyncOp } from './bindings/sync';
import { WatchEvent, WatchResult } from './bindings/watch';

export async function calculateSync(workspace: Workspace) {
  if (!workspace.settingSyncDir) throw new Error('Workspace sync dir not configured');

  return invoke<SyncOp[]>('plugin:yaak-sync|calculate', {
    workspaceId: workspace.id,
    dir: workspace.settingSyncDir,
  });
}

export async function applySync(workspace: Workspace, syncOps: SyncOp[]) {
  console.log('Applying sync', syncOps);
  return invoke<void>('plugin:yaak-sync|apply', {
    workspaceId: workspace.id,
    dir: workspace.settingSyncDir,
    syncOps: syncOps,
  });
}

export function useWatchWorkspace(workspace: Workspace | null, cb: (e: WatchEvent) => void) {
  const workspaceId = workspace?.id ?? null;

  useEffect(() => {
    if (workspaceId == null) return;

    console.log('Watching workspace', workspaceId);
    const channel = new Channel<WatchEvent>();
    channel.onmessage = (event) => {
      cb(event);
    };
    const promise = invoke<WatchResult>('plugin:yaak-sync|watch', { workspaceId, channel });

    return () => {
      promise
        .then(({ unlistenEvent }) => {
          console.log('Cancelling workspace watch', workspaceId, unlistenEvent);
          return emit(unlistenEvent);
        })
        .catch(console.error);
    };
  }, [workspaceId]);
}
