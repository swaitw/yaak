import { useFastMutation } from './useFastMutation';
import type { Plugin } from '@yaakapp-internal/models';
import { invokeCmd } from '../lib/tauri';

export function useUninstallPlugin(pluginId: string) {
  return useFastMutation<Plugin | null, string>({
    mutationKey: ['uninstall_plugin'],
    mutationFn: async () => {
      return invokeCmd('cmd_uninstall_plugin', { pluginId });
    },
  });
}
