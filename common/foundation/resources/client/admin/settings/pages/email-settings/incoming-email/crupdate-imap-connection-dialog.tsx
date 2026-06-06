import {ImapConnectionCredentials} from '@common/admin/settings/pages/email-settings/incoming-email/imap-connection-credentials';
import {Button} from '@ui/buttons/button';
import {Form} from '@ui/forms/form';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {Item} from '@ui/forms/listbox/item';
import {FormSelect} from '@ui/forms/select/select';
import {FormSwitch} from '@ui/forms/toggle/switch';
import {Trans} from '@ui/i18n/trans';
import {Dialog} from '@ui/overlays/dialog/dialog';
import {DialogBody} from '@ui/overlays/dialog/dialog-body';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {DialogFooter} from '@ui/overlays/dialog/dialog-footer';
import {DialogHeader} from '@ui/overlays/dialog/dialog-header';
import {nanoid} from 'nanoid';
import {useForm, useWatch} from 'react-hook-form';

interface Props {
  connection?: ImapConnectionCredentials;
}

export function CrupdateImapConnectionDialog({connection}: Props) {
  const form = useForm<ImapConnectionCredentials>({
    defaultValues: connection
      ? {
          ...connection,
          authentication: connection.authentication || 'basic',
        }
      : {
          id: nanoid(6).toLowerCase(),
          authentication: 'basic',
          createTickets: true,
          createReplies: true,
        },
  });
  const {formId, close} = useDialogContext();

  return (
    <Dialog size="lg">
      <DialogHeader>
        {connection ? (
          <Trans message="Edit connection" />
        ) : (
          <Trans message="New connection" />
        )}
      </DialogHeader>
      <DialogBody>
        <Form
          className="space-y-16"
          form={form}
          id={formId}
          disableNativeValidation
          onSubmit={values => {
            // clear lastUid if folder changed
            if (connection?.folder && connection.folder !== values.folder) {
              values.lastUid = null;
            }

            close(values);
          }}
        >
          <FormTextField
            autoFocus
            required
            name="name"
            label={<Trans message="Name" />}
          />
          <FormTextField
            required
            name="host"
            placeholder="imap.gmail.com"
            label={<Trans message="Host" />}
          />
          <FormSelect
            required
            name="authentication"
            label={<Trans message="Authentication" />}
          >
            <Item value="basic">
              <Trans message="Basic" />
            </Item>
            <Item value="oauth">
              <Trans message="OAuth" />
            </Item>
          </FormSelect>
          <FormTextField
            required
            name="username"
            placeholder="username@gmail.com"
            type="email"
            label={<Trans message="Username" />}
          />
          <PasswordField />
          <FormTextField
            name="port"
            type="number"
            label={<Trans message="Port" />}
            placeholder="993"
          />
          <FormTextField
            name="folder"
            label={<Trans message="Folder" />}
            className="mb-14"
            description={
              <Trans message="From which folder emails should be imported. Leave empty to import all emails in the inbox." />
            }
          />
          <FormSwitch
            name="createTickets"
            className="mt-28"
            description={
              <Trans message="Create new tickets from emails received via this connection." />
            }
          >
            <Trans message="Create new tickets" />
          </FormSwitch>
          <FormSwitch
            name="createReplies"
            description={
              <Trans message="If email is in reply to existing ticket, create a new reply." />
            }
          >
            <Trans message="Create replies" />
          </FormSwitch>
        </Form>
      </DialogBody>
      <DialogFooter>
        <Button onClick={() => close()}>
          <Trans message="Cancel" />
        </Button>
        <Button type="submit" form={formId} variant="flat" color="primary">
          <Trans message="Save" />
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

function PasswordField() {
  const auth = useWatch({name: 'authentication'});
  return (
    <FormTextField
      required
      type={auth === 'oauth' ? 'text' : 'password'}
      name="password"
      label={
        auth === 'oauth' ? (
          <Trans message="Access token" />
        ) : (
          <Trans message="Password" />
        )
      }
    />
  );
}
