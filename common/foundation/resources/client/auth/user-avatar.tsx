import {SiteConfigContext} from '@common/core/settings/site-config-context';
import {Avatar, AvatarProps} from '@ui/avatar/avatar';
import {useContext} from 'react';

export interface UserAvatarProps
  extends Omit<AvatarProps, 'label' | 'src' | 'link'> {
  user: {id: number | string; name: string | null; image?: string | null};
  withLink?: boolean;
}
export function UserAvatar({user, withLink = true, ...props}: UserAvatarProps) {
  const {auth} = useContext(SiteConfigContext);
  return (
    <Avatar
      {...props}
      label={user?.name}
      src={user?.image}
      link={
        withLink && user?.id && user?.name
          ? auth?.getUserProfileLink?.(user as {id: number; name: string})
          : undefined
      }
    />
  );
}
