import {ConversationTag} from '@app/dashboard/conversation';
import {useRemoveTagFromConversations} from '@app/dashboard/conversations/conversations-table/conversation-actions/add-tag-to-conversations-button';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {queryClient} from '@common/http/query-client';
import {Chip} from '@ui/forms/input-field/chip-field/chip';
import {
  ChipList,
  ChipListProps,
} from '@ui/forms/input-field/chip-field/chip-list';
import {toast} from '@ui/toast/toast';
import {message} from '@ui/i18n/message';

interface Props extends ChipListProps {
  conversationId: number | string;
  tags: ConversationTag[];
}
export function ConversationTagList({
  conversationId,
  size = 'xs',
  tags,
  ...chipListProps
}: Props) {
  const removeTag = useRemoveTagFromConversations();

  if (!tags.length) {
    return null;
  }

  return (
    <ChipList {...chipListProps} size={size}>
      {tags.map(tag => (
        <Chip
          key={tag.id}
          disabled={removeTag.isPending}
          onRemove={() =>
            removeTag.mutate(
              {
                tagId: tag.id,
                conversationIds: [conversationId],
              },
              {
                onSuccess: () => {
                  // Ensure fresh data and reflect server-side restore immediately.
                  try {
                    // show toast for human support tag removal
                    if (/human support/i.test(tag.name)) {
                      toast(message('Support handoff resolved — AI will resume'));
                    }
                  } catch (err) {
                    // best-effort only
                  }

                  // Invalidate related queries so UI updates in background
                  // without a full page reload.
                  Promise.allSettled([
                    queryClient.invalidateQueries({
                      queryKey:
                        helpdeskQueries.conversations.get(conversationId)
                          .queryKey,
                    }),
                    queryClient.invalidateQueries({
                      queryKey:
                        helpdeskQueries.conversations.messages(conversationId)
                          .queryKey,
                    }),
                    queryClient.invalidateQueries({
                      queryKey: helpdeskQueries.conversations.invalidateKey,
                    }),
                  ]).catch(() => {
                    // best-effort only
                  });
                },
              },
            )
          }
        >
          {tag.name}
        </Chip>
      ))}
    </ChipList>
  );
}
