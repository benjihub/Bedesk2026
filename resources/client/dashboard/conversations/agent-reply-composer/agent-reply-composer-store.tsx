import {
  ConversationTag,
  FullConversationResponse,
} from '@app/dashboard/conversation';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {statusCategory} from '@app/dashboard/statuses/status-category';
import {ConversationAttachment} from '@app/dashboard/types/conversation-attachment';
import {CompactStatus} from '@app/dashboard/types/statuses';
import {queryClient} from '@common/http/query-client';
import {
  getFromLocalStorage,
  removeFromLocalStorage,
  setInLocalStorage,
} from '@ui/utils/hooks/local-storage';
import {createContext, ReactNode, useContext, useRef} from 'react';
import {createStore, useStore} from 'zustand';

const makeDraftKey = (conversationId: number | string) =>
  `conversation-${conversationId}-draft`;

const defaultDraftValue: Required<DraftValue> = {
  body: '',
  attachments: [],
  tags: [],
};

interface AgentReplyComposerStoreProps {
  conversation: FullConversationResponse['conversation'];
  statuses: CompactStatus[];
  storedDraft: DraftValue | null;
}

export interface DraftValue {
  body?: string;
  attachments?: ConversationAttachment[];
  tags?: ConversationTag[];
}

type MessageType = 'message' | 'note';

interface AgentReplyComposerState {
  conversation: AgentReplyComposerStoreProps['conversation'];
  statuses: AgentReplyComposerStoreProps['statuses'];
  messageType: MessageType;
  setMessageType: (type: MessageType) => void;

  addAttachment: (attachment: ConversationAttachment) => void;
  removeAttachment: (attachment: ConversationAttachment) => void;

  removeTag: (tag: ConversationTag) => void;

  draft: Required<DraftValue>;
  updateDraft: (value: Partial<DraftValue>) => void;
  deleteDraft: () => void;

  selectedStatus: number | null;
  updateSelectedStatus: (statusId: number) => void;

  getData: () => AgentReplyComposerState;
}

type ReplyComposerStore = ReturnType<typeof createReplyComposerStore>;

const createReplyComposerStore = ({
  conversation,
  statuses,
  storedDraft,
}: AgentReplyComposerStoreProps) => {
  const draftKey = makeDraftKey(conversation.id);

  const statusKey = `${conversation.type}-composer-status`;
  return createStore<AgentReplyComposerState>()((set, get) => ({
    conversation,
    statuses,

    // make sure we are not sending any status when submit reply to chat
    selectedStatus:
      conversation.type === 'ticket'
        ? (conversation.status_id ?? getFromLocalStorage(
            statusKey,
            statuses.find(s => s.category === statusCategory.closed)?.id,
          ))
        : null,
    updateSelectedStatus: (statusId: number) => {
      set({selectedStatus: statusId});
      setInLocalStorage(statusKey, statusId);
    },

    messageType: 'message',
    setMessageType: (type: MessageType) => set({messageType: type}),

    addAttachment: (attachment: ConversationAttachment) => {
      const newAttachments = [...get().draft.attachments, attachment];
      set({draft: {...get().draft, attachments: newAttachments}});
      get().updateDraft({attachments: newAttachments});
    },
    removeAttachment: (attachment: ConversationAttachment) => {
      const newAttachments = get().draft.attachments.filter(
        a => a.id !== attachment.id,
      );
      set({draft: {...get().draft, attachments: newAttachments}});
      get().updateDraft({attachments: newAttachments});
    },

    removeTag: (tag: ConversationTag) => {
      const newTags = get().draft.tags.filter(t => t.id !== tag.id);
      set({draft: {...get().draft, tags: newTags}});
      get().updateDraft({tags: newTags});
    },
    draft: {
      ...defaultDraftValue,
      ...storedDraft,
    },
    updateDraft: (value: Partial<DraftValue>) => {
      set({draft: {...get().draft, ...value}});
      setInLocalStorage(draftKey, {
        ...(getFromLocalStorage<DraftValue>(draftKey) ?? {}),
        ...value,
      });
    },
    deleteDraft: () => {
      removeFromLocalStorage(draftKey);
      set({draft: {body: '', attachments: [], tags: []}});
    },

    getData: () => get(),
  }));
};

const ReplyComposerStoreContext = createContext<ReplyComposerStore | null>(
  null,
);

interface AgentReplyComposerStoreProviderProps {
  children: ReactNode;
  conversation: FullConversationResponse['conversation'];
}
export function AgentReplyComposerStoreProvider({
  children,
  conversation,
}: AgentReplyComposerStoreProviderProps) {
  const storeRef = useRef<ReplyComposerStore>(null);
  if (!storeRef.current) {
    storeRef.current = createReplyComposerStore({
      conversation,
      statuses: queryClient.getQueryData(
        helpdeskQueries.statuses.dropdownList('agent').queryKey,
      )!.statuses,
      storedDraft: getFromLocalStorage(makeDraftKey(conversation.id)),
    });
  }
  return (
    <ReplyComposerStoreContext.Provider value={storeRef.current}>
      {children}
    </ReplyComposerStoreContext.Provider>
  );
}

export function useAgentReplyComposerStore<T>(
  selector: (state: AgentReplyComposerState) => T,
): T {
  const store = useContext(ReplyComposerStoreContext);
  return useStore(store!, selector);
}
