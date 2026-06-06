import {CompactAttribute} from '@app/attributes/compact-attribute';
import {Trans} from '@ui/i18n/trans';

type Props = {
  type: CompactAttribute['type'];
};
export function PrettyAttributeType({type}: Props) {
  switch (type) {
    case 'conversation':
      return <Trans message="Conversation" />;
    case 'user':
      return <Trans message="User" />;
    case 'aiAgentSession':
      return <Trans message="AI agent" />;
    default:
      return null;
  }
}
