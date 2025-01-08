import { useState } from 'react';
import { createWorkspace } from '../lib/commands';
import { Button } from './core/Button';
import { PlainInput } from './core/PlainInput';
import { VStack } from './core/Stacks';
import type { SyncToFilesystemSettingProps } from './SyncToFilesystemSetting';
import { SyncToFilesystemSetting } from './SyncToFilesystemSetting';

interface Props {
  hide: () => void;
}

export function CreateWorkspaceDialog({ hide }: Props) {
  const [name, setName] = useState<string>('');
  const [settingSyncDir, setSettingSyncDir] = useState<
    Parameters<SyncToFilesystemSettingProps['onChange']>[0]
  >({ value: null, enabled: false });

  return (
    <VStack
      as="form"
      space={3}
      alignItems="start"
      className="pb-3 max-h-[50vh]"
      onSubmit={async (e) => {
        e.preventDefault();
        const { enabled, value } = settingSyncDir ?? {};
        if (enabled && !value) return;
        await createWorkspace.mutateAsync({ name, settingSyncDir: value });
        hide();
      }}
    >
      <PlainInput require label="Workspace Name" defaultValue={name} onChange={setName} />

      <SyncToFilesystemSetting onChange={setSettingSyncDir} value={settingSyncDir.value} />
      <Button
        type="submit"
        color="primary"
        className="ml-auto mt-3"
        disabled={settingSyncDir.enabled && !settingSyncDir.value}
      >
        Create Workspace
      </Button>
    </VStack>
  );
}
