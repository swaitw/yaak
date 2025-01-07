import type { Folder, Workspace } from '@yaakapp-internal/models';
import { getActiveWorkspaceId } from '../hooks/useActiveWorkspace';
import { createFastMutation } from '../hooks/useFastMutation';
import { trackEvent } from './analytics';
import { showPrompt } from './prompt';
import { router } from './router';
import { invokeCmd } from './tauri';

export const createWorkspace = createFastMutation<Workspace, void, Partial<Workspace>>({
  mutationKey: ['create_workspace'],
  mutationFn: (patch) => invokeCmd<Workspace>('cmd_update_workspace', { workspace: patch }),
  onSuccess: async (workspace) => {
    await router.navigate({
      to: '/workspaces/$workspaceId',
      params: { workspaceId: workspace.id },
    });
  },
  onSettled: () => trackEvent('workspace', 'create'),
});

export const createFolder = createFastMutation<
  Folder | null,
  void,
  Partial<Pick<Folder, 'name' | 'sortPriority' | 'folderId'>>
>({
  mutationKey: ['create_folder'],
  mutationFn: async (patch) => {
    const workspaceId = getActiveWorkspaceId();
    if (workspaceId == null) {
      throw new Error("Cannot create folder when there's no active workspace");
    }

    if (!patch.name) {
      const name = await showPrompt({
        id: 'new-folder',
        label: 'Name',
        defaultValue: 'Folder',
        title: 'New Folder',
        confirmText: 'Create',
        placeholder: 'Name',
      });
      if (name == null) return null;

      patch.name = name;
    }

    patch.sortPriority = patch.sortPriority || -Date.now();
    return invokeCmd<Folder>('cmd_update_folder', { folder: { workspaceId, ...patch } });
  },
  onSettled: () => trackEvent('folder', 'create'),
});
