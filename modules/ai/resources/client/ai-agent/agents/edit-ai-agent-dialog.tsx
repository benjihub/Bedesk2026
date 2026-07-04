import {apiClient, queryClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {useMutation} from '@tanstack/react-query';
import {Button} from '@ui/buttons/button';
import {Form} from '@ui/forms/form';
import {FormSwitch} from '@ui/forms/toggle/switch';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {Trans} from '@ui/i18n/trans';
import {Dialog} from '@ui/overlays/dialog/dialog';
import {DialogBody} from '@ui/overlays/dialog/dialog-body';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {DialogFooter} from '@ui/overlays/dialog/dialog-footer';
import {DialogHeader} from '@ui/overlays/dialog/dialog-header';
import {toast} from '@ui/toast/toast';
import {message} from '@ui/i18n/message';
import {useForm} from 'react-hook-form';
import {AiAgent} from './use-ai-agents';
import {AiAgentGroupSelectField} from './ai-agent-group-select';
import {aiAgentQueries} from '@ai/ai-agent/ai-agent-queries';
import {AiAgentAvatarField} from './ai-agent-avatar-field';

interface Props {
  agent: AiAgent;
}

interface UpdateAiAgentPayload {
  groupId: string | null;
  name: string;
  image?: string;
  enabled: boolean;
  personality?: string;
  greeting_type?: string;
  basic_greeting_message?: string;
}

export function EditAiAgentDialog({agent}: Props) {
  const {formId, close} = useDialogContext();

  const form = useForm<UpdateAiAgentPayload>({
    defaultValues: {
      groupId: agent.group_id ? String(agent.group_id) : '',
      name: agent.name,
      image: agent.image ?? '',
      enabled: agent.enabled,
      personality: agent.personality,
      greeting_type: agent.greeting_type,
      basic_greeting_message: agent.basic_greeting_message,
    },
  });

  const updateAgent = useMutation({
    mutationFn: (payload: UpdateAiAgentPayload) =>
      apiClient.put(`lc/ai-agent/agents/${agent.id}`, {
        ...payload,
        groupId: payload.groupId || null,
        image: payload.image || null,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({queryKey: ['ai-agents']});
      await queryClient.invalidateQueries({queryKey: ['lc', 'ai-agent', 'agents']});
      await queryClient.invalidateQueries({queryKey: aiAgentQueries.status.invalidateKey});
      toast(message('Agent updated'));
      close();
    },
    onError: err => showHttpErrorToast(err),
  });

  return (
    <Dialog size="sm">
      <DialogHeader showDivider>
        <Trans message="Edit AI agent" />
      </DialogHeader>
      <DialogBody>
        <Form
          form={form}
          id={formId}
          onSubmit={data =>
            updateAgent.mutate({
              ...data,
              groupId: data.groupId || null,
            })
          }
          className="space-y-16"
        >
          <AiAgentGroupSelectField />
          <FormTextField name="name" label={<Trans message="Agent name" />} autoFocus required />
          <AiAgentAvatarField form={form} />
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
          disabled={updateAgent.isPending}
        >
          <Trans message="Save" />
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
