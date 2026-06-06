import {CheckIcon} from '@common/ui/library/icons/material/Check';
import {PriorityHighIcon} from '@common/ui/library/icons/material/PriorityHigh';
import {SyncIcon} from '@common/ui/library/icons/material/Sync';
import {SvgIconProps} from '@common/ui/library/icons/svg-icon';
import clsx from 'clsx';
import {cloneElement, ReactElement, ReactNode} from 'react';
import {Link} from 'react-router';

interface Props {
  name: ReactNode;
  icon: ReactElement<SvgIconProps>;
  scanPending?: boolean;
  scanFailed?: boolean;
  to: string;
  description?: ReactNode;
  actions?: ReactNode;
}
export function KnowledgeSectionItem({
  name,
  icon,
  to,
  description,
  actions,
  scanPending,
  scanFailed,
}: Props) {
  return (
    <div className="flex items-center gap-18 py-16 text-sm">
      <div
        className={clsx(
          'ml-6 flex size-24 items-center justify-center rounded-full',
          scanPending
            ? 'bg-chip text-primary'
            : scanFailed
              ? 'bg-danger-lighter text-main'
              : 'bg-positive-lighter text-main',
        )}
      >
        {scanPending ? (
          <SyncIcon size="xs" className="animate-spin" />
        ) : scanFailed ? (
          <PriorityHighIcon size="xs" />
        ) : (
          <CheckIcon size="xs" />
        )}
      </div>
      <Link
        className={clsx(
          'mr-auto flex flex-1 items-center gap-6 hover:underline',
          scanPending && 'pointer-events-none',
        )}
        to={to}
      >
        {cloneElement(icon, {size: 'xs'})}
        <div>{name}</div>
      </Link>
      {description && <div className="flex-1 text-muted">{description}</div>}
      {<div className="ml-auto min-w-100 flex-shrink-0">{actions}</div>}
    </div>
  );
}
