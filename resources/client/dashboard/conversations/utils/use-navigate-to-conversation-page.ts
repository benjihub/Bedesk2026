import {useNavigate} from '@common/ui/navigation/use-navigate';
import {useCallback} from 'react';
import {useSearchParams} from 'react-router';

export function useNavigateToConversationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  return useCallback(
    (conversationId: number | string) => {
      let link = `/dashboard/conversations/${conversationId}`;
      if (searchParams.has('viewId')) {
        link += `?viewId=${searchParams.get('viewId')}`;
      }
      navigate(link);
    },
    [navigate, searchParams],
  );
}

export function useConversationLink(conversationId: number | string) {
  const [searchParams] = useSearchParams();
  let link = `/dashboard/conversations/${conversationId}`;
  if (searchParams.has('viewId')) {
    link += `?viewId=${searchParams.get('viewId')}`;
  }
  return link;
}
