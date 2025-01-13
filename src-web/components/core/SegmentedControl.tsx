import { useRef } from 'react';
import { useStateWithDeps } from '../../hooks/useStateWithDeps';
import type { IconProps } from './Icon';
import type { IconButtonProps } from './IconButton';
import { IconButton } from './IconButton';
import { HStack } from './Stacks';

interface Props<T extends string> {
  options: { value: T; label: string; icon: IconProps['icon']; event?: IconButtonProps['event'] }[];
  onChange: (value: T) => void;
  value: T;
  name: string;
}

export function SegmentedControl<T extends string>({ value, onChange, options, name }: Props<T>) {
  const [selectedValue, setSelectedValue] = useStateWithDeps<T>(value, [value]);
  const containerRef = useRef<HTMLDivElement>(null);
  return (
    <HStack
      ref={containerRef}
      space={1}
      role="group"
      dir="ltr"
      className="mb-auto bg-surface opacity-0 group-focus-within/markdown:opacity-100 group-hover/markdown:opacity-100 transition-opacity transform-gpu"
      onKeyDown={(e) => {
        const selectedIndex = options.findIndex((o) => o.value === selectedValue);
        if (e.key === 'ArrowRight') {
          const newIndex = Math.abs((selectedIndex + 1) % options.length);
          setSelectedValue(options[newIndex]!.value);
          const child = containerRef.current?.children[newIndex] as HTMLButtonElement;
          child.focus();
        } else if (e.key === 'ArrowLeft') {
          const newIndex = Math.abs((selectedIndex - 1) % options.length);
          setSelectedValue(options[newIndex]!.value);
          const child = containerRef.current?.children[newIndex] as HTMLButtonElement;
          child.focus();
        }
      }}
    >
      {options.map((o, i) => (
        <IconButton
          size="xs"
          variant={value === o.value ? 'solid' : 'border'}
          color={value === o.value ? 'secondary' : 'default'}
          role="radio"
          event={{ id: name, value: String(o.value) }}
          tabIndex={selectedValue === o.value ? 0 : -1}
          key={i}
          title={o.label}
          icon={o.icon}
          onClick={() => onChange(o.value)}
        />
      ))}
    </HStack>
  );
}
