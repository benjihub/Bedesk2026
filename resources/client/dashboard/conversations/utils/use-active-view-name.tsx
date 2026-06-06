import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {useQuery} from '@tanstack/react-query';
import {useSearchParams} from 'react-router';

export function useActiveViewName(): string | null {
  const {data} = useQuery(helpdeskQueries.conversations.inboxViews);
  const [searchParams] = useSearchParams();
  const viewId = searchParams.get('viewId');
  const view = data?.views.find(v => `${v.id}` === viewId || v.key === viewId);
  return view?.name ?? null;
}
