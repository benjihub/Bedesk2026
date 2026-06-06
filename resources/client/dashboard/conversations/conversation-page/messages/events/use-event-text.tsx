import {ConversationContentItem} from '@app/dashboard/conversations/conversation-page/messages/conversation-message';
import {message as msg} from '@ui/i18n/message';
import {MessageDescriptor} from '@ui/i18n/message-descriptor';
import {useSettings} from '@ui/settings/use-settings';

interface Props {
  message: ConversationContentItem;
  variant: 'agent' | 'customer';
}
export function useEventText({
  message,
  variant,
}: Props): MessageDescriptor | null {
  const {lc} = useSettings();
  const idleMin = lc?.timeout?.inactive ?? 10;
  const closedMin = lc?.timeout?.archive ?? 15;

  if (message.type === 'collectDetailsForm') {
    return msg('Collect details form shown');
  }

  if (message.type === 'cards') {
    return msg('Cards shown');
  }

  if (message.type !== 'event') return null;

  switch (message.body.name) {
    case 'closed.inactivity':
      if (variant === 'agent') {
        return msg('Automatically closed - :minutes min inactivity', {
          values: {minutes: closedMin},
        });
      } else {
        return msg('The chat has been closed due to long user inactivity.');
      }
    case 'closed.byTrigger':
      if (variant === 'agent') {
        return msg('Closed by trigger');
      } else {
        return msg('Chat was closed by one of our agents');
      }
    case 'closed.byAgent':
      if (variant === 'agent') {
        return msg('Closed by :agent', {
          values: {agent: message.body.closedBy},
        });
      } else {
        return msg(':agent has closed the chat', {
          values: {agent: message.body.closedBy},
        });
      }
    case 'closed.byCustomer':
      if (variant === 'agent') {
        return msg('Closed by customer', {
          values: {customer: message.body.closedBy},
        });
      } else {
        return msg('Ticket closed');
      }
    case 'closed.byAiAgent':
      if (variant === 'agent') {
        return msg('Closed by AI agent');
      } else {
        return msg('Chat closed');
      }
    case 'customer.enteredEmail':
      if (variant === 'agent') {
        return msg("Customer entered ':email' as email", {
          values: {email: message.body.email},
        });
      } else {
        return msg("You have entered ':email' as email", {
          values: {email: message.body.email},
        });
      }
    case 'customer.idle':
      if (variant === 'agent') {
        return msg('Idle - :minutes min inactivity', {
          values: {minutes: idleMin},
        });
      }
      return null;
    case 'customer.leftChat':
      if (variant === 'agent') {
        return msg('Closed - customer left the chat');
      } else {
        return msg('You have left the chat');
      }
    case 'agent.leftChat':
      if (variant === 'customer') {
        if (message.body.newAgent) {
          return msg('You have been transferred to: :agent', {
            values: {
              agent: message.body.newAgent,
            },
          });
        }
        return null;
      }

      if (message.body.oldAgent && message.body.newAgent) {
        return msg(
          'Chat assigned to :newAgent because :oldAgent left the chat',
          {
            values: {
              newAgent: message.body.newAgent,
              oldAgent: message.body.oldAgent,
            },
          },
        );
      } else if (message.body.oldAgent) {
        return msg(':agent left the chat', {
          values: {agent: message.body.oldAgent},
        });
      }
      return null;
    case 'agent.changed':
      if (message.body.newAgent) {
        if (variant === 'agent') {
          return msg('Reassigned to :agent', {
            values: {
              agent: message.body.newAgent,
            },
          });
        } else {
          return msg(':agent has joined the conversation', {
            values: {
              agent: message.body.newAgent,
            },
          });
        }
      } else {
        return msg('Conversation reassigned');
      }
    case 'customer.addedToQueue':
      if (variant === 'agent') {
        return msg('Added to queue');
      } else {
        return msg('Waiting for an agent');
      }
    case 'group.changed':
      if (message.body.newGroup) {
        return msg('Transfered to :name group', {
          values: {
            name: message.body.newGroup,
          },
        });
      } else {
        return msg('Group changed');
      }
    default:
      return null;
  }
}
