import type { Workspace } from '@yaakapp-internal/models';
import { getWorkspace } from '../lib/store';
import { invokeCmd } from '../lib/tauri';
import { useFastMutation } from './useFastMutation';

export function useUpdateWorkspace(id: string | null) {
  return useFastMutation<Workspace, unknown, Partial<Workspace> | ((w: Workspace) => Workspace)>({
    mutationKey: ['update_workspace', id],
    mutationFn: async (v) => {
      const workspace = await getWorkspace(id);
      if (workspace == null) {
        throw new Error("Can't update a null workspace");
      }

      const newWorkspace = typeof v === 'function' ? v(workspace) : { ...workspace, ...v };
      return invokeCmd('cmd_update_workspace', { workspace: newWorkspace });
    },
  });
}
