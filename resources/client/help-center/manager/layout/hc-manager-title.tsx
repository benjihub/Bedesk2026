import {Trans} from '@ui/i18n/trans';
import {OpenInNewIcon} from '@ui/icons/material/OpenInNew';
import {ReactNode} from 'react';
import {Link, useLocation} from 'react-router';

interface Props {
  children: ReactNode;
}
export function HcManagerTitle({children}: Props) {
  const location = useLocation();
  return (
    <div className="mb-10 flex items-center justify-between gap-12">
      <h2 className="text-sm font-semibold text-muted">{children}</h2>
      <Link
        to={`${location.pathname.includes('admin') ? '/admin' : '/dashboard'}/hc/articles`}
        className="flex items-center gap-4 text-sm font-medium hover:underline"
        target="_blank"
      >
        <OpenInNewIcon size="xs" />
        <Trans message="View all articles" />
      </Link>
    </div>
  );
}
