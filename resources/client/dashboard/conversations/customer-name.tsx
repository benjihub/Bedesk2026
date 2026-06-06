import {message} from '@ui/i18n/message';
import {useTrans} from '@ui/i18n/use-trans';

const fallbackCustomerName = message('Visitor');

type PartialUser = {
  name?: string | null;
  email?: string | null;
  city?: string | null;
} | null;

interface Props {
  user?: PartialUser;
  className?: string;
}
export function CustomerName({user, className}: Props) {
  const name = useCustomerName(user);
  return <div className={className}>{name}</div>;
}

export function useCustomerName(user: PartialUser | undefined): string {
  const {trans} = useTrans();
  const actualName = user?.name ?? user?.email;
  if (actualName) {
    return actualName;
  }

  const fallbackName = trans(fallbackCustomerName);

  if (user?.city) {
    return trans({
      message: ':name from :city',
      values: {city: user.city, name: fallbackName},
    });
  }
  return fallbackName;
}
