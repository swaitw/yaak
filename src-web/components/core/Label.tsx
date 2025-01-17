import classNames from 'classnames';
import type { HTMLAttributes } from 'react';

export function Label({
  htmlFor,
  className,
  optional,
  children,
  ...props
}: HTMLAttributes<HTMLLabelElement> & { htmlFor: string; optional?: boolean }) {
  return (
    <label
      className={classNames(className, 'text-text-subtle whitespace-nowrap flex items-center gap-1')}
      htmlFor={htmlFor}
      {...props}
    >
      {children}
      {optional ? (
        <>
          {' '}
          <span className="text-xs text-text-subtlest">(optional)</span>
        </>
      ) : null}
    </label>
  );
}
