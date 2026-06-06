import {queryClient} from '@common/http/query-client';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';

export interface ConversationSummary {
  id: number;
  conversation_id: number;
  created_at: string;
  updated_at: string;
  content: {
    sentiment: string;
    summary: string[];
    keywords: string[];
  };
  generated_by: number;
  user?: {
    id: number;
    name: string;
    image?: string;
  };
}

export function setConversationSummaryQueryData(
  conversationId: number | string,
  summary: ConversationSummary | null,
) {
  queryClient.setQueryData<{summary: ConversationSummary | null}>(
    helpdeskQueries.conversations.summary(conversationId).queryKey,
    {
      summary: summary as any,
    },
  );
}
