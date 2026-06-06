import {auth, useAuth} from '@common/auth/use-auth';

export function useCanEditAgent(agentId: number): boolean {
  const {user, hasPermission} = useAuth();
  return user?.id === agentId || hasPermission('users.update');
}

export function canEditAgent(agentId: number): boolean {
  return auth.user?.id === agentId || auth.hasPermission('users.update');
}
