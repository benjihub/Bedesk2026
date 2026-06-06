import {useCustomerName} from '@app/dashboard/conversations/customer-name';
import {Avatar, AvatarProps} from '@ui/avatar/avatar';

interface Props {
  user?: {
    id: number;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    city?: string | null;
  } | null;
  size?: AvatarProps['size'];
  className?: string;
}
export function CustomerAvatar({user, className, size}: Props) {
  const name = useCustomerName(user);
  const label = name;
  const initialsLabel =
    name || user?.city || (user?.id ? `${user?.id}` : '') || name;

  return (
    <Avatar
      circle
      fallback="initials"
      label={label}
      labelForBackground={initialsLabel}
      src={user?.image}
      className={className}
      size={size}
    />
  );
}
