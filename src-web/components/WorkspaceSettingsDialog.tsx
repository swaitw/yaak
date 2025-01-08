import { useDeleteActiveWorkspace } from '../hooks/useDeleteActiveWorkspace';
import { useUpdateWorkspace } from '../hooks/useUpdateWorkspace';
import { useWorkspaces } from '../hooks/useWorkspaces';
import { Button } from './core/Button';
import { Input } from './core/Input';
import { VStack } from './core/Stacks';
import { MarkdownEditor } from './MarkdownEditor';
import { SelectFile } from './SelectFile';

interface Props {
  workspaceId: string | null;
  hide: () => void;
}

export function WorkspaceSettingsDialog({ workspaceId, hide }: Props) {
  const workspaces = useWorkspaces();
  const workspace = workspaces.find((w) => w.id === workspaceId);
  const { mutate: updateWorkspace } = useUpdateWorkspace(workspaceId ?? null);
  const { mutateAsync: deleteActiveWorkspace } = useDeleteActiveWorkspace();

  if (workspace == null) return null;

  return (
    <VStack space={3} alignItems="start" className="pb-3 max-h-[50vh]">
      <Input
        label="Workspace Name"
        defaultValue={workspace.name}
        onChange={(name) => updateWorkspace({ name })}
        stateKey={`name.${workspace.id}`}
      />

      <MarkdownEditor
        name="workspace-description"
        placeholder="Workspace description"
        className="min-h-[10rem] max-h-[25rem] border border-border px-2"
        defaultValue={workspace.description}
        stateKey={`description.${workspace.id}`}
        onChange={(description) => updateWorkspace({ description })}
        heightMode="auto"
      />

      <VStack space={3} className="mt-3" alignItems="start">
        <SelectFile
          directory
          noun="Sync Directory"
          filePath={workspace.settingSyncDir}
          onChange={({ filePath: settingSyncDir }) => updateWorkspace({ settingSyncDir })}
        />
        <Button
          onClick={async () => {
            await deleteActiveWorkspace();
            hide();
          }}
          color="danger"
          variant="border"
          size="sm"
        >
          Delete Workspace
        </Button>
      </VStack>
    </VStack>
  );
}
