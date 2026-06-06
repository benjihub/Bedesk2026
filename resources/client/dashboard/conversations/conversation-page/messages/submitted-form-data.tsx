import {AttributeRenderer} from '@app/attributes/rendering/attribute-renderer';
import {SubmittedFormDataMessage} from '@app/dashboard/conversations/conversation-page/messages/conversation-message';
import {Trans} from '@ui/i18n/trans';

interface Props {
  message: SubmittedFormDataMessage;
  className?: string;
}
export function SubmittedFormData({message, className}: Props) {
  return (
    <div className={className}>
      <div className="mb-14 text-left font-semibold">
        <Title message={message} />
      </div>
      <div className="space-y-14 text-left">
        {message.body.attributes.map(attribute => (
          <div key={attribute.key}>
            <div className="mb-2 text-muted">{attribute.name}</div>
            <div>
              <AttributeRenderer attribute={attribute} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface TitleProps {
  message: SubmittedFormDataMessage;
}
function Title({message}: TitleProps) {
  switch (message.body.formType) {
    case 'preChat':
      return <Trans message="Pre-chat form" />;
    case 'postChat':
      return <Trans message="Post-chat form" />;
    default:
      return <Trans message="Submitted details" />;
  }
}
