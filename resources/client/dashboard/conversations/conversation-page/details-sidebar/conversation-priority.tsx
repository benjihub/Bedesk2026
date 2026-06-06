import {Trans} from '@ui/i18n/trans';

interface Props {
  priority: number;
}
export function ConversationPriority({priority}: Props) {
  switch (priority) {
    case 1:
      return <Trans message="Low" />;
    case 2:
      return <Trans message="Normal" />;
    default:
      return <Trans message="High" />;
  }
}
