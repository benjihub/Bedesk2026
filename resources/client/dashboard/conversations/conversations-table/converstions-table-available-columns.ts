import {message} from '@ui/i18n/message';

export const conversationsTableAvailableColumns = [
  {
    key: 'id',
    label: message('ID'),
  },
  {
    key: 'type',
    label: message('Type'),
  },
  {
    key: 'channel',
    label: message('Channel'),
  },
  {
    key: 'status',
    label: message('Status'),
  },
  {
    key: 'priority',
    label: message('Priority'),
  },
  {
    key: 'user_id',
    label: message('Customer'),
  },
  {
    key: 'subject',
    label: message('Subject'),
  },
  {
    key: 'summary',
    label: message('Summary'),
  },
  {
    key: 'assignee_id',
    label: message('Assignee'),
  },
  {
    key: 'group_id',
    label: message('Group'),
  },
  {
    key: 'updated_at',
    label: message('Last updated'),
  },
  {
    key: 'created_at',
    label: message('Request date'),
  },
  {
    key: 'closed_at',
    label: message('Solved at'),
  },
  {
    key: 'assigned_at',
    label: message('Assigned at'),
  },
  {
    key: 'human_support_status',
    label: message('Human support'),
  },
  {
    key: 'closed_by',
    label: message('Closed by'),
  },
];

export const defaultConversationsTableColumns = [
  'status',
  'user_id',
  'summary',
  'assignee_id',
  'group_id',
  'updated_at',
];
