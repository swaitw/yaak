import { useState } from 'react';
import { Checkbox } from './core/Checkbox';
import { VStack } from './core/Stacks';
import { SelectFile } from './SelectFile';

export interface SyncToFilesystemSettingProps {
  onChange: (args: { value: string | null; enabled: boolean }) => void;
  value: string | null;
}

export function SyncToFilesystemSetting({ onChange, value }: SyncToFilesystemSettingProps) {
  const [useSyncDir, setUseSyncDir] = useState<boolean>(!!value);

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
      {useSyncDir && (
        <>
          <SelectFile
            directory
            size="xs"
            noun="Directory"
            filePath={value}
            onChange={({ filePath }) => {
              if (filePath == null) setUseSyncDir(false);
              onChange({ value: filePath, enabled: useSyncDir });
            }}
          />
        </>
      )}
    </VStack>
  );
}
