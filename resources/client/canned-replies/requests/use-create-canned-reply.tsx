import {CannedReply} from '@app/canned-replies/canned-reply';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {ConversationAttachment} from '@app/dashboard/types/conversation-attachment';
import {onFormQueryError} from '@common/errors/on-form-query-error';
import {apiClient, queryClient} from '@common/http/query-client';
import {useMutation} from '@tanstack/react-query';
import {message} from '@ui/i18n/message';
import {toast} from '@ui/toast/toast';
import {UseFormReturn} from 'react-hook-form';

interface Response {
  reply: CannedReply;
}

export interface CreateCannedReplyPayload {
  name: string;
  shortcut?: string | null;
  body: string | null;
  attachments?: ConversationAttachment[];
  shared?: boolean;
  groupId?: number;
  tags?: {name: string; id: number}[];
}

export function useCreateCannedReply(
  form: UseFormReturn<CreateCannedReplyPayload>,
) {
  return useMutation({
    mutationFn: (payload: CreateCannedReplyPayload) =>
      createCannedReply(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: helpdeskQueries.cannedReplies.invalidateKey,
      });
      toast(message('Saved reply created'));
    },
    onError: err => onFormQueryError(err, form),
  });
}

function createCannedReply(payload: CreateCannedReplyPayload) {
  return apiClient
    .post<Response>(
      `helpdesk/canned-replies`,
      prepareCannedReplyPayload(payload),
    )
    .then(r => r.data);
}

export function prepareCannedReplyPayload(payload: CreateCannedReplyPayload) {
  return {
    ...payload,
    tags: payload.tags?.map(tag => tag.name),
    attachments: payload.attachments?.map(attachment => attachment.id),
  };
}
