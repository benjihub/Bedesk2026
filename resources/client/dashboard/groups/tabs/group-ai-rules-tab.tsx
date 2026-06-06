import {Group} from '@app/dashboard/groups/group';
import {
  UpdateGroupAiAgentSettingsPayload,
  useUpdateGroupAiAgentSettings,
} from '@app/dashboard/groups/settings/requests/use-update-group-ai-agent-settings';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {useQuery} from '@tanstack/react-query';
import {Button} from '@ui/buttons/button';
import {Form} from '@ui/forms/form';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {Item} from '@ui/forms/listbox/item';
import {FormSelect} from '@ui/forms/select/select';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {toast} from '@ui/toast/toast';
import {useEffect} from 'react';
import {useForm} from 'react-hook-form';
import {useOutletContext} from 'react-router';

type FormValues = {
  enabledMode: 'inherit' | 'enabled' | 'disabled';
  name?: string;
  personality?: string;
  initialFlowId: 'inherit' | number;
  transferInstruction?: string;
  cantAssistInstruction?: string;
  bigmanToken?: string;
  bigmanUsernameToken?: string;
};

export function Component() {
  const group = useOutletContext() as Group;
  const query = useQuery(helpdeskQueries.groupAiAgentSettings.get(group.id));

  const form = useForm<FormValues>({
    defaultValues: {
      enabledMode: 'inherit',
      personality: '',
      initialFlowId: 'inherit',
      transferInstruction: '',
      cantAssistInstruction: '',
      bigmanToken: '',
      bigmanUsernameToken: '',
    },
  });

  useEffect(() => {
    const overrides = query.data?.overrides ?? {};
    form.reset({
      enabledMode:
        typeof (overrides as any).enabled === 'boolean'
          ? ((overrides as any).enabled ? 'enabled' : 'disabled')
          : 'inherit',
      name: typeof (overrides as any).name === 'string' ? ((overrides as any).name as string) : '',
      personality: typeof (overrides as any).personality === 'string' ? ((overrides as any).personality as string) : '',
      initialFlowId:
        typeof (overrides as any).initialFlowId === 'number'
          ? ((overrides as any).initialFlowId as number)
          : 'inherit',
      transferInstruction:
        typeof (overrides as any)?.transfer?.instruction === 'string'
          ? ((overrides as any).transfer.instruction as string)
          : '',
      cantAssistInstruction:
        typeof (overrides as any)?.cantAssist?.instruction === 'string'
          ? ((overrides as any).cantAssist.instruction as string)
          : '',
      bigmanToken:
        typeof (overrides as any)?.bigman?.token === 'string'
          ? ((overrides as any).bigman.token as string)
          : '',
      bigmanUsernameToken:
        typeof (overrides as any)?.bigman?.usernameToken === 'string'
          ? ((overrides as any).bigman.usernameToken as string)
          : '',

    });
  }, [query.data, form]);

  const mutation = useUpdateGroupAiAgentSettings(group.id, form as any);

  const flows = query.data?.flows ?? [];

  return (
    <div className="container mx-auto px-24">
      <div className="mb-24">
        <div className="text-xl font-semibold">
          <Trans message="AI rules" />
        </div>
        <div className="text-sm text-muted">
          <Trans message="Override AI agent behavior for this group. Leave fields empty to inherit global settings." />
        </div>
      </div>

      <div className="rounded border p-24">
        <Form
          form={form}
          onSubmit={values => {
            const overrides: Record<string, unknown> = {};

            if (values.enabledMode === 'enabled') {
              overrides.enabled = true;
            }
            if (values.enabledMode === 'disabled') {
              overrides.enabled = false;
            }

            if (values.name && values.name.trim() !== '') {
              overrides.name = values.name.trim();
            }

            if (values.personality && values.personality.trim() !== '') {
              overrides.personality = values.personality;
            }

            if (typeof values.initialFlowId === 'number') {
              overrides.initialFlowId = values.initialFlowId;
            }

            if (values.transferInstruction && values.transferInstruction.trim() !== '') {
              overrides.transfer = {
                type: 'instruction',
                instruction: values.transferInstruction,
              };
            }

            if (values.cantAssistInstruction && values.cantAssistInstruction.trim() !== '') {
              overrides.cantAssist = {
                instruction: values.cantAssistInstruction,
              };
            }

            let bigmanOverrides: Record<string, unknown> | undefined;

            if (values.bigmanToken && values.bigmanToken.trim() !== '') {
              bigmanOverrides = {
                ...(bigmanOverrides ?? {}),
                token: values.bigmanToken.trim(),
              };
            }

            if (values.bigmanUsernameToken && values.bigmanUsernameToken.trim() !== '') {
              bigmanOverrides = {
                ...(bigmanOverrides ?? {}),
                usernameToken: values.bigmanUsernameToken.trim(),
              };
            }


            if (bigmanOverrides) {
              (overrides as any).bigman = bigmanOverrides;
            }

            const payload: UpdateGroupAiAgentSettingsPayload = {overrides};
            mutation.mutate(payload, {
              onSuccess: () => toast(message('AI rules saved')),
            });
          }}
        >
          
          <div className="grid grid-cols-1 gap-24 md:grid-cols-2">
            {/* Hide 'Enabled' selector while we iterate on automatic behavior */}
            {false && (
              <FormSelect
                name="enabledMode"
                selectionMode="single"
                label={<Trans message="Enabled" />}
              >
                <Item value="enabled">
                  <Trans message="Enabled" />
                </Item>
                {/* <Item value="inherit">
                  <Trans message="Inherit global" />
                </Item> */}
                {/* <Item value="disabled">
                  <Trans message="Disabled" />
                </Item> */}
              </FormSelect>
            )}

            <div />

            <div className="md:col-span-2">
              <FormTextField
                name="name"
                label={<Trans message="Assistant name" />}
                description={<Trans message="Name used when the assistant introduces itself (e.g. when asked if it's AI)." />}
              />

              <FormTextField
                name="personality"
                label={<Trans message="System prompt (Personality)" />}
                inputElementType="textarea"
                rows={5}
              />

              <FormTextField
                name="bigmanToken"
                label={<Trans message="BigMan API token" />}
                description={
                  <Trans message="Per-group token used when validating deposit/withdraw tickets with BigMan." />
                }
              />

              <FormTextField
                name="bigmanUsernameToken"
                label={<Trans message="BigMan username token" />}
                description={
                  <Trans message="Per-group token used when validating usernames with BigMan. If empty, the BigMan API token above will be used." />
                }
              />
            </div>

            {/* <FormSelect
              name="initialFlowId"
              selectionMode="single"
              label={<Trans message="Initial flow" />}
            >
              <Item value="inherit">
                <Trans message="Inherit global" />
              </Item>
              {flows.map(flow => (
                <Item key={flow.id} value={flow.id}>
                  {flow.name}
                </Item>
              ))}
            </FormSelect>

            <div /> */}

            {/* Temporarily hide manual override fields until automatic detection/behaviour is finalized */}
            {false && (
              <>
                <div className="md:col-span-2">
                  <FormTextField
                    name="transferInstruction"
                    label={<Trans message="Transfer instruction" />}
                    inputElementType="textarea"
                    rows={3}
                  />
                </div>

                <div className="md:col-span-2">
                  <FormTextField
                    name="cantAssistInstruction"
                    label={<Trans message="Can't assist instruction" />}
                    inputElementType="textarea"
                    rows={3}
                  />
                </div>
              </>
            )}

            
          </div>

          <div className="mt-24 flex items-center justify-end gap-12">
            <Button
              type="submit"
              variant="flat"
              color="primary"
              disabled={mutation.isPending}
            >
              <Trans message="Save" />
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}
