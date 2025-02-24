import { useFastMutation } from './useFastMutation';
import { invokeCmd } from '../lib/tauri';

export function useInstallPlugin() {
  return useFastMutation<void, unknown, string>({
    mutationKey: ['install_plugin'],
    mutationFn: async (directory: string) => {
      await invokeCmd('cmd_install_plugin', { directory });
    },
  });
}
