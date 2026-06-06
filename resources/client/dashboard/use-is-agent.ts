import {useAuth} from '@common/auth/use-auth';

export function useIsAgent(): boolean {
  const {user, hasPermission} = useAuth();
  return user ? hasPermission('tickets.update') : false;
}
