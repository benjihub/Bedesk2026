import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {Trans} from '@ui/i18n/trans';

export function ChatScreenSettings() {
  return (
    <div>
      <FormTextField
        name="client.chatWidget.defaultMessage"
        label={<Trans message="Welcome message" />}
        className="mb-16"
        required
      />
      <FormTextField
        name="client.chatWidget.inputPlaceholder"
        label={<Trans message="Input placeholder" />}
        className="mb-16"
        required
      />
      <FormTextField
        name="client.chatWidget.agentsAwayMessage"
        label={<Trans message="No agents available" />}
        className="mb-16"
        inputElementType="textarea"
        rows={4}
        required
      />
      <FormTextField
        name="client.chatWidget.inQueueMessage"
        label={<Trans message="Customer is in queue" />}
        inputElementType="textarea"
        rows={6}
        required
      />
    </div>
  );
}
