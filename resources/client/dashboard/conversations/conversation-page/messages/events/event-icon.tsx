import {ConversationContentItem} from '@app/dashboard/conversations/conversation-page/messages/conversation-message';
import {AlternateEmailIcon} from '@ui/icons/material/AlternateEmail';
import {CloseIcon} from '@ui/icons/material/Close';
import {DoneAllIcon} from '@ui/icons/material/DoneAll';
import {LogoutIcon} from '@ui/icons/material/Logout';
import {PendingIcon} from '@ui/icons/material/Pending';
import {SwapHorizIcon} from '@ui/icons/material/SwapHoriz';
import {ViewDayIcon} from '@ui/icons/material/ViewDay';
import {SvgIconProps} from '@ui/icons/svg-icon';
import clsx from 'clsx';

interface Props {
  message: ConversationContentItem;
  size?: SvgIconProps['size'];
  className?: string;
}
export function EventIcon({message, size, className}: Props) {
  const cls = clsx('text-muted', className);

  if (message.type === 'cards') {
    return <ViewDayIcon className={cls} size={size} />;
  }

  if (message.type === 'collectDetailsForm') {
    return <DoneAllIcon className={cls} size={size} />;
  }

  if (message.type !== 'event') return null;

  switch (message.body.name) {
    case 'closed.inactivity':
    case 'closed.byTrigger':
    case 'closed.byAgent':
    case 'closed.byCustomer':
    case 'closed.byAiAgent':
      return <CloseIcon size={size} className={cls} />;
    case 'customer.enteredEmail':
      return <AlternateEmailIcon size={size} className={cls} />;
    case 'customer.idle':
      return <PendingIcon size={size} className={cls} />;
    case 'customer.leftChat':
    case 'agent.leftChat':
      return <LogoutIcon size={size} className={cls} />;
    case 'agent.changed':
    case 'group.changed':
      return <SwapHorizIcon size={size} className={cls} />;
    default:
      return null;
  }
}
