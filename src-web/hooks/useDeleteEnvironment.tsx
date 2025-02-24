import type { Environment } from '@yaakapp-internal/models';
import { useSetAtom } from 'jotai';
import { InlineCode } from '../components/core/InlineCode';
import { showConfirmDelete } from '../lib/confirm';
import { invokeCmd } from '../lib/tauri';
import { environmentsAtom } from './useEnvironments';
import { useFastMutation } from './useFastMutation';
import { removeModelById } from './useSyncModelStores';

export function useDeleteEnvironment(environment: Environment | null) {
  const setEnvironments = useSetAtom(environmentsAtom);

  return useFastMutation<Environment | null, string>({
    mutationKey: ['delete_environment', environment?.id],
    mutationFn: async () => {
      const confirmed = await showConfirmDelete({
        id: 'delete-environment',
        title: 'Delete Environment',
        description: (
          <>
            Permanently delete <InlineCode>{environment?.name}</InlineCode>?
          </>
        ),
      });
      if (!confirmed) return null;
      return invokeCmd('cmd_delete_environment', { environmentId: environment?.id });
    },
    onSuccess: (environment) => {
      if (environment == null) return;

      setEnvironments(removeModelById(environment));
    },
  });
}
