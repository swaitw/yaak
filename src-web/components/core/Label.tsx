import classNames from 'classnames';
import type { HTMLAttributes } from 'react';

export function Label({
  htmlFor,
  className,
  optional,
  children,
  visuallyHidden,
  otherTags = [],
  ...props
}: HTMLAttributes<HTMLLabelElement> & {
  htmlFor: string;
  optional?: boolean;
  otherTags?: string[];
  visuallyHidden?: boolean;
}) {
  const tags = optional ? ['optional', ...otherTags] : otherTags;
  return (
    <label
      className={classNames(
        className,
        visuallyHidden && 'sr-only',
        'flex-shrink-0',
        'text-text-subtle whitespace-nowrap flex items-center gap-1',
      )}
      htmlFor={htmlFor}
      {...props}
    >
      {children}
      {tags.map((tag, i) => (
        <span key={i} className="text-xs text-text-subtlest">
          ({tag})
        </span>
      ))}
    </label>
  );
}
