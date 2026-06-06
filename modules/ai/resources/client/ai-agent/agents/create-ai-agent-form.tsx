import React from 'react';
import {useForm} from 'react-hook-form';
import {Form} from '@ui/forms/form';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {FormSwitch} from '@ui/forms/toggle/switch';
import {Button} from '@ui/buttons/button';
import {Trans} from '@ui/i18n/trans';
import {Dialog} from '@ui/overlays/dialog/dialog';
import {DialogBody} from '@ui/overlays/dialog/dialog-body';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {DialogFooter} from '@ui/overlays/dialog/dialog-footer';
import {DialogHeader} from '@ui/overlays/dialog/dialog-header';
import {useCreateAiAgent} from './use-create-ai-agent';

interface FormData {
  name: string;
  enabled: boolean;
  personality: string;
  greeting_type: string;
  basic_greeting_message: string;
}

export function CreateAiAgentForm() {
  const {formId, close} = useDialogContext();
  const form = useForm<FormData>({
    defaultValues: {
      name: '',
      enabled: true,
      personality: 'friendly',
      greeting_type: 'basicGreeting',
      basic_greeting_message: 'Hello! How can I help you today?',
    },
  });

  const createAgent = useCreateAiAgent(form);

  return (
    <Dialog size="sm">
      <DialogHeader showDivider>
        <Trans message="Add AI agent" />
      </DialogHeader>
      <DialogBody>
        <Form
          form={form}
          id={formId}
          onSubmit={(data: FormData) =>
            createAgent.mutate(data, {
              onSuccess: () => close(),
            })
          }
          className="space-y-16"
        >
          <FormTextField
            name="name"
            label={<Trans message="Agent name" />}
            autoFocus
            required
          />
          <FormSwitch name="enabled">
            <Trans message="Enabled" />
          </FormSwitch>
          <FormTextField name="personality" label={<Trans message="Personality" />} />
          <FormTextField name="greeting_type" label={<Trans message="Greeting type" />} />
          <FormTextField
            name="basic_greeting_message"
            label={<Trans message="Greeting message" />}
            inputElementType="textarea"
            rows={3}
          />
        </Form>
      </DialogBody>
      <DialogFooter dividerTop>
        <Button variant="flat" onClick={() => close()}>
          <Trans message="Cancel" />
        </Button>
        <Button
          type="submit"
          form={formId}
          variant="flat"
          color="primary"
          disabled={createAgent.isPending}
        >
          <Trans message="Create" />
        </Button>
      </DialogFooter>
    </Dialog>
  );
}