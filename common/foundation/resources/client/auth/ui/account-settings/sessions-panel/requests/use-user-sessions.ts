import {BackendResponse} from '@common/http/backend-response/backend-response';
import {apiClient} from '@common/http/query-client';
import {useQuery} from '@tanstack/react-query';

export interface UserSession {
  id: string;
  platform?: string;
  device?: 'mobile' | 'tablet' | 'desktop';
  browser?: string;
  country?: string;
  city?: string;
  ip_address?: string;
  token?: string;
  is_current_device: boolean;
  updated_at: string;
  created_at: string;
}

interface Response extends BackendResponse {
  sessions: UserSession[];
}

export function useUserSessions() {
  return useQuery({
    queryKey: ['user-sessions'],
    queryFn: () => fetchUserSessions(),
  });
}

function fetchUserSessions() {
  return apiClient
    .get<Response>(`user-sessions`)
    .then(response => response.data);
}
