import {MessageField} from '@app/dashboard/conversations/new-conversation-page/message-field';
import {NewConversationPayload} from '@app/dashboard/conversations/new-conversation-page/new-conversation-payload';
import {StatusColorDot} from '@app/dashboard/conversations/utils/get-status-color';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {useIsModuleInstalled} from '@app/use-is-module-installed';
import {FormNormalizedModelField} from '@common/ui/normalized-model/normalized-model-field';
import {useSuspenseQuery} from '@tanstack/react-query';
import {Button} from '@ui/buttons/button';
import {getInputFieldClassNames} from '@ui/forms/input-field/get-input-field-class-names';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {Item} from '@ui/forms/listbox/item';
import {FormSelect} from '@ui/forms/select/select';
import {Trans} from '@ui/i18n/trans';
import {useFormContext, useWatch} from 'react-hook-form';

interface Props {
  onSubmit: () => void;
  isPending: boolean;
}
export function NewConversationForm({onSubmit, isPending}: Props) {
  const form = useFormContext<NewConversationPayload>();
  const livechatEnabled = useIsModuleInstalled('livechat');

  const bodyError = form.formState.errors?.message?.body?.message;
  const inputFieldClassNames = getInputFieldClassNames();

  return (
    <form
      onSubmit={e => {
        form.clearErrors();
        form.handleSubmit(onSubmit)(e);
      }}
    >
      {livechatEnabled && (
        <FormSelect
          name="type"
          label={<Trans message="Type" />}
          selectionMode="single"
          className="mb-24"
        >
          <Item value="ticket">
            <Trans message="Ticket" />
          </Item>
          <Item value="chat">
            <Trans message="Chat" />
          </Item>
        </FormSelect>
      )}
      <FormNormalizedModelField
        name="user_id"
        endpoint="helpdesk/normalized-models/customer"
        label={<Trans message="Customer" />}
        className="mb-24"
      />
      <StatusField />
      {form.watch('type') === 'ticket' && (
        <FormTextField
          name="subject"
          label={<Trans message="Subject" />}
          className="mb-24"
          required
        />
      )}
      <div className="mb-24">
        <div className={inputFieldClassNames.label}>
          <Trans message="Message" />
        </div>
        <MessageField
          errorMessage={
            bodyError && (
              <div className={inputFieldClassNames.error}>{bodyError}</div>
            )
          }
        />
      </div>
      <Button variant="flat" color="primary" type="submit" disabled={isPending}>
        <Trans message="Create" />
      </Button>
    </form>
  );
}

function StatusField() {
  const statusQuery = useSuspenseQuery(
    helpdeskQueries.statuses.dropdownList('agent'),
  );
  const type = useWatch<NewConversationPayload, 'type'>({name: 'type'});

  if (type === 'chat') {
    return null;
  }

  return (
    <FormSelect
      name="status_id"
      label={<Trans message="Status" />}
      selectionMode="single"
      className="mb-24"
    >
      {statusQuery.data.statuses.map(status => (
        <Item
          key={status.id}
          value={status.id}
          startIcon={<StatusColorDot category={status.category} />}
        >
          {status.label}
        </Item>
      ))}
    </FormSelect>
  );
}
