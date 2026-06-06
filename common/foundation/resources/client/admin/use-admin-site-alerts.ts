import {apiClient} from '@common/http/query-client';
import {useQuery} from '@tanstack/react-query';

export interface AdminSetupAlert {
  id: string;
  severity: 'info' | 'error';
  title: string;
  description: string;
}

export function useAdminSiteAlerts() {
  return useQuery<{alerts: AdminSetupAlert[]}>({
    queryKey: ['admin-site-alerts'],
    queryFn: () => apiClient.get(`admin/site-alerts`).then(r => r.data),
  });
}
