import {SiteConfigContext} from '@common/core/settings/site-config-context';
import {User} from '@ui/types/user';
import clsx from 'clsx';
import {useContext, useMemo} from 'react';
import {Link, LinkProps} from 'react-router';

interface UserProfileLinkProps extends Omit<LinkProps, 'to'> {
  user: User;
  className?: string;
}
export function UserProfileLink({
  user,
  className,
  ...linkProps
}: UserProfileLinkProps) {
  const {auth} = useContext(SiteConfigContext);
  const finalUri = useMemo(() => {
    return auth?.getUserProfileLink!(user);
  }, [auth, user]);

  return (
    <Link
      {...linkProps}
      className={clsx('hover:underline', className)}
      to={finalUri ?? '/'}
    >
      {user.name}
    </Link>
  );
}
