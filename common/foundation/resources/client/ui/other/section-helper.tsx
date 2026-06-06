import {IconButton} from '@ui/buttons/icon-button';
import {CloseIcon} from '@ui/icons/material/Close';
import clsx from 'clsx';
import {ReactNode} from 'react';

export interface SectionHelperProps {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  color?:
    | 'positive'
    | 'danger'
    | 'warning'
    | 'primary'
    | 'neutral'
    | 'bgAlt'
    | 'elevated';
  className?: string;
  size?: 'sm' | 'md';
  leadingIcon?: ReactNode;
  onClose?: () => void;
}
export function SectionHelper({
  title,
  description,
  actions,
  color = 'primary',
  className,
  size = 'md',
  leadingIcon,
  onClose,
}: SectionHelperProps) {
  return (
    <div
      className={clsx(
        className,
        'rounded-panel border px-12',
        leadingIcon || onClose ? 'py-8' : 'py-12',
        size === 'sm' ? 'text-xs' : 'text-sm',
        color === 'positive' && 'border-positive/30 bg-positive/focus',
        color === 'warning' && 'border-warning/30 bg-warning/focus',
        color === 'danger' && 'border-danger/30 bg-danger/focus',
        color === 'primary' && 'border-primary/30 bg-primary/focus',
        color === 'neutral' && 'bg',
        color === 'bgAlt' && 'bg-alt',
        color === 'elevated' && 'bg-elevated',
      )}
    >
      {title && (
        <div
          className={clsx(
            'flex items-center gap-6',
            (description || actions) && 'mb-4',
          )}
        >
          {leadingIcon}
          <div className="font-medium">{title}</div>
          {onClose ? (
            <IconButton size="xs" className="ml-auto" onClick={() => onClose()}>
              <CloseIcon />
            </IconButton>
          ) : null}
        </div>
      )}
      {description && <div>{description}</div>}
      {actions && <div className="mt-14">{actions}</div>}
    </div>
  );
}
