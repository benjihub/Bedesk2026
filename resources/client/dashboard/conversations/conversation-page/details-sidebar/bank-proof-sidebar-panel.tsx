import {useConversationMessages} from '@app/dashboard/conversations/conversation-page/requests/use-conversation-messages';
import {Trans} from '@ui/i18n/trans';
import {BankProofCard} from '@app/dashboard/conversations/conversation-page/messages/bank-proof-card';
import {ConversationContentItem, ConversationMessage} from '@app/dashboard/conversations/conversation-page/messages/conversation-message';

interface Props {
  conversationId: number;
}

// Local copy of bank proof data shape used by BankProofCard
type BankProofData = {
  from_bank: string | null;
  from_account_name: string | null;
  from_account_number?: string | null;
  to_bank: string | null;
  to_account_name: string | null;
  to_account_number?: string | null;
  occurred_at: string | null;
  amount: number | null;
  currency?: string | null;
  reference_number?: string | null;
  confidence?: number | null;
};

export function BankProofSidebarPanel({conversationId}: Props) {
  const query = useConversationMessages(conversationId);
  const items = query.data?.items ?? [];

  // Find latest message with bank_proof data
  let latestProof: BankProofData | undefined;
  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i] as ConversationContentItem;
    if (item && item.type === 'message') {
      const msg = item as ConversationMessage;
      if (msg.data?.bank_proof) {
        latestProof = msg.data.bank_proof;
        break;
      }
    }
  }

  if (!query.data) {
    return (
      <div className="text-sm text-muted">
        <Trans message="Loading…" />
      </div>
    );
  }

  if (!latestProof) {
    return (
      <div className="text-sm text-muted">
        <Trans message="No bank proof detected yet." />
      </div>
    );
  }

  return <BankProofCard data={latestProof} />;
}
