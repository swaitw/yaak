import { openUrl } from '@tauri-apps/plugin-opener';
import { useLicense } from '@yaakapp-internal/license';
import { useRef } from 'react';
import { openSettings } from '../commands/openSettings';
import { useCheckForUpdates } from '../hooks/useCheckForUpdates';
import { useExportData } from '../hooks/useExportData';
import { useListenToTauriEvent } from '../hooks/useListenToTauriEvent';
import { appInfo } from '../lib/appInfo';
import { showDialog } from '../lib/dialog';
import { importData } from '../lib/importData';
import type { DropdownRef } from './core/Dropdown';
import { Dropdown } from './core/Dropdown';
import { Icon } from './core/Icon';
import { IconButton } from './core/IconButton';
import { KeyboardShortcutsDialog } from './KeyboardShortcutsDialog';

export function SettingsDropdown() {
  const exportData = useExportData();
  const dropdownRef = useRef<DropdownRef>(null);
  const checkForUpdates = useCheckForUpdates();
  const { check } = useLicense();

  useListenToTauriEvent('settings', () => openSettings.mutate(null));

  return (
    <Dropdown
      ref={dropdownRef}
      items={[
        {
          label: 'Settings',
          hotKeyAction: 'settings.show',
          leftSlot: <Icon icon="settings" />,
          onSelect: () => openSettings.mutate(null),
        },
        {
          label: 'Keyboard shortcuts',
          hotKeyAction: 'hotkeys.showHelp',
          leftSlot: <Icon icon="keyboard" />,
          onSelect: () => {
            showDialog({
              id: 'hotkey',
              title: 'Keyboard Shortcuts',
              size: 'dynamic',
              render: () => <KeyboardShortcutsDialog />,
            });
          },
        },
        {
          label: 'Import Data',
          leftSlot: <Icon icon="folder_input" />,
          onSelect: () => importData.mutate(),
        },
        {
          label: 'Export Data',
          leftSlot: <Icon icon="folder_output" />,
          onSelect: () => exportData.mutate(),
        },
        { type: 'separator', label: `Yaak v${appInfo.version}` },
        {
          label: 'Purchase License',
          color: 'success',
          hidden: check.data == null || check.data.type === 'commercial_use',
          leftSlot: <Icon icon="circle_dollar_sign" />,
          onSelect: () => openSettings.mutate('license'),
        },
        {
          label: 'Check for Updates',
          leftSlot: <Icon icon="update" />,
          onSelect: () => checkForUpdates.mutate(),
        },
        {
          label: 'Feedback',
          leftSlot: <Icon icon="chat" />,
          rightSlot: <Icon icon="external_link" color="secondary" />,
          onSelect: () => openUrl('https://yaak.app/feedback'),
        },
        {
          label: 'Changelog',
          leftSlot: <Icon icon="cake" />,
          rightSlot: <Icon icon="external_link" color="secondary" />,
          onSelect: () => openUrl(`https://yaak.app/changelog/${appInfo.version}`),
        },
      ]}
    >
      <IconButton
        size="sm"
        title="Main Menu"
        icon="settings"
        iconColor="secondary"
        className="pointer-events-auto"
      />
    </Dropdown>
  );
}
