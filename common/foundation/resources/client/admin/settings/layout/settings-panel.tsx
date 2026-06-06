import clsx from 'clsx';
import {Children, ReactElement, ReactNode} from 'react';

interface SettingsSectionHeaderProps {
  children: ReactNode;
  margin?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
export function SettingsSectionHeader({
  children,
  margin = 'mb-24',
  size = 'md',
  className,
}: SettingsSectionHeaderProps) {
  const [title, description] = Children.toArray(children);

  let textStyle = 'text-base font-medium';
  if (size === 'sm') {
    textStyle = 'text-sm font-semibold';
  } else if (size === 'lg') {
    textStyle = 'text-lg font-medium';
  }

  return (
    <div className={clsx(margin, className)}>
      <div className={clsx(textStyle, description && 'mb-2')}>{title}</div>
      {description && <div className="text-sm text-muted">{description}</div>}
    </div>
  );
}

interface SettingsPanelProps {
  title: ReactNode;
  description?: ReactElement;
  link?: ReactElement | null;
  children: ReactNode;
  className?: string;
  id?: string;
  layout?: 'vertical' | 'horizontal';
}
export function SettingsPanel({
  title,
  description,
  link,
  children,
  className,
  id,
  layout = 'horizontal',
}: SettingsPanelProps) {
  return (
    <div
      id={id}
      className={clsx(
        'items-center gap-24 rounded-panel border px-24 pb-36 pt-30',
        className,
        layout === 'horizontal' && '@[900px]/settings-form:flex',
      )}
    >
      <div
        className={clsx(
          'px-12',
          layout === 'horizontal'
            ? 'mb-34 @[900px]/settings-form:w-1/2 @[900px]:mb-0'
            : link
              ? 'mb-24'
              : 'mb-12',
        )}
      >
        <SettingsSectionHeader margin="mb-0">
          {title}
          <div
            className={clsx(
              layout === 'horizontal' && '@[900px]:max-w-[340px]',
            )}
          >
            {description}
          </div>
        </SettingsSectionHeader>
        {link && <div className="mt-12 text-sm">{link}</div>}
      </div>
      <div
        className={clsx('px-12', layout === 'horizontal' && '@[900px]:w-1/2')}
      >
        {children}
      </div>
    </div>
  );
}
