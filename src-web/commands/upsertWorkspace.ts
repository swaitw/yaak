import type { Workspace } from '@yaakapp-internal/models';
import { createFastMutation } from '../hooks/useFastMutation';
import { invokeCmd } from '../lib/tauri';

export const upsertWorkspace = createFastMutation<
  Workspace,
  void,
  Workspace | Partial<Omit<Workspace, 'id'>>
>({
  mutationKey: ['upsert_workspace'],
  mutationFn: (workspace) => invokeCmd<Workspace>('cmd_update_workspace', { workspace }),
});
