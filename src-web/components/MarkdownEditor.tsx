import classNames from 'classnames';
import { atom, useAtom } from 'jotai';
import { useRef } from 'react';
import type { Components } from 'react-markdown';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useStateWithDeps } from '../hooks/useStateWithDeps';
import { Button } from './core/Button';
import type { EditorProps } from './core/Editor/Editor';
import { Editor } from './core/Editor/Editor';
import { HStack, VStack } from './core/Stacks';
import { Prose } from './Prose';

type ViewMode = 'edit' | 'preview';

interface Props extends Pick<EditorProps, 'heightMode' | 'stateKey' | 'forceUpdateKey'> {
  placeholder: string;
  className?: string;
  defaultValue: string;
  onChange: (value: string) => void;
  name: string;
  defaultMode?: ViewMode;
  doneButtonLabel?: string;
}

const viewModeAtom = atom<Record<string, ViewMode>>({});

export function MarkdownEditor({
  className,
  defaultValue,
  onChange,
  name,
  defaultMode = 'preview',
  doneButtonLabel = 'Save',
  forceUpdateKey,
  ...editorProps
}: Props) {
  const [rawViewMode, setViewMode] = useAtom(viewModeAtom);
  const [value, setValue] = useStateWithDeps<string>(defaultValue, [forceUpdateKey]);

  const containerRef = useRef<HTMLDivElement>(null);
  const viewMode = rawViewMode[name] ?? defaultMode;

  const editor = (
    <Editor
      hideGutter
      wrapLines
      className="max-w-2xl max-h-full"
      language="markdown"
      defaultValue={defaultValue}
      onChange={setValue}
      autoFocus
      forceUpdateKey={forceUpdateKey}
      {...editorProps}
    />
  );

  const preview =
    defaultValue.length === 0 ? (
      <p className="text-text-subtle">No description</p>
    ) : (
      <Prose className="max-w-xl overflow-y-auto max-h-full">
        <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {value}
        </Markdown>
      </Prose>
    );

  const contents = viewMode === 'preview' ? preview : editor;

  return (
    <div
      ref={containerRef}
      className={classNames(
        'w-full h-full pt-1.5 group rounded-md grid grid-cols-[minmax(0,1fr)_auto] grid-rows-1 gap-x-1.5',
        className,
      )}
    >
      <div className="h-full w-full">{contents}</div>
      <VStack
        space={1}
        className="bg-surface opacity-20 group-hover:opacity-100 transition-opacity transform-gpu"
      >
        {viewMode === 'preview' && (
          <Button
            size="xs"
            variant="border"
            event={{ id: 'md_mode', mode: viewMode }}
            onClick={() => setViewMode((prev) => ({ ...prev, [name]: 'edit' }))}
          >
            Edit
          </Button>
        )}
        {viewMode === 'edit' && (
          <HStack space={2}>
            <Button
              size="xs"
              event={{ id: 'md_mode', mode: viewMode }}
              color="secondary"
              variant="border"
              onClick={() => {
                setViewMode((prev) => ({ ...prev, [name]: 'preview' }));
              }}
            >
              Cancel
            </Button>
            <Button
              size="xs"
              variant="border"
              color="primary"
              event={{ id: 'md_mode', mode: viewMode }}
              onClick={() => {
                onChange(value);
                setViewMode((prev) => ({ ...prev, [name]: 'preview' }));
              }}
            >
              {doneButtonLabel}
            </Button>
          </HStack>
        )}
      </VStack>
    </div>
  );
}

const markdownComponents: Partial<Components> = {
  // Ensure links open in external browser by adding target="_blank"
  a: ({ href, children, ...rest }) => {
    if (href && !href.match(/https?:\/\//)) {
      href = `http://${href}`;
    }
    return (
      <a target="_blank" rel="noreferrer noopener" href={href} {...rest}>
        {children}
      </a>
    );
  },
};
