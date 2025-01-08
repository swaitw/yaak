import { readDir } from '@tauri-apps/plugin-fs';
import { useState } from 'react';
import { Checkbox } from './core/Checkbox';
import { VStack } from './core/Stacks';
import { SelectFile } from './SelectFile';

export interface SyncToFilesystemSettingProps {
  onChange: (args: { value: string | null; enabled: boolean }) => void;
  value: string | null;
  allowNonEmptyDirectory?: boolean;
}

export function SyncToFilesystemSetting({
  onChange,
  value,
  allowNonEmptyDirectory,
}: SyncToFilesystemSettingProps) {
  const [useSyncDir, setUseSyncDir] = useState<boolean>(!!value);
  const [error, setError] = useState<string | null>(null);

  return (
    <VStack space={1.5} className="w-full">
      <Checkbox
        checked={useSyncDir}
        onChange={(enabled) => {
          setUseSyncDir(enabled);
          if (!enabled) {
            // Set value to null when disabling
            onChange({ value: null, enabled });
          } else {
            onChange({ value, enabled });
          }
        }}
        title="Sync to a filesystem directory"
      />
      {error && <div className="text-danger">{error}</div>}
      {useSyncDir && (
        <SelectFile
          directory
          size="xs"
          noun="Directory"
          filePath={value}
          onChange={async ({ filePath }) => {
            setError(null);
            if (filePath == null) {
              setUseSyncDir(false);
            } else {
              const files = await readDir(filePath);
              if (files.length > 0 && !allowNonEmptyDirectory) {
                setError('Directory must be empty');
                return;
              }
            }

            onChange({ value: filePath, enabled: useSyncDir });
          }}
        />
      )}
    </VStack>
  );
}
