export const helpdeskChannel = {
  name: 'helpdesk',
  events: {
    conversations: {
      created: 'conversations.created',
      updated: 'conversations.updated',
      newMessage: 'conversations.newMessage',
      typing: 'conversations.typing',
    },
    agents: {
      updated: 'agents.updated',
    },
    users: {
      created: 'users.created',
      pageVisitCreated: 'users.pageVisitCreated',
    },
  },
} as const;
