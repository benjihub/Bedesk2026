import {aiAgentQueries} from '@ai/ai-agent/ai-agent-queries';
import {AiAgentSettings} from '@ai/ai-agent/settings/ai-agent-settings';
import {PanelLayout} from '@ai/ai-agent/settings/panel-layout';
import {useSuspenseQuery} from '@tanstack/react-query';
import {useEffect} from 'react';
import {AccordionItemProps} from '@ui/accordion/accordion';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {FormRadio} from '@ui/forms/radio-group/radio';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {SupportAgentIcon} from '@ui/icons/material/SupportAgent';
import {useForm, useWatch} from 'react-hook-form';
import {useSearchParams} from 'react-router';

export function TransferPanel(props: Partial<AccordionItemProps>) {
  const {trans} = useTrans();
  const [searchParams] = useSearchParams();
  const activeGroupId = searchParams.get('groupId');
  const {data} = useSuspenseQuery(aiAgentQueries.settings.index(activeGroupId));
  const form = useForm<Partial<AiAgentSettings>>({
    defaultValues: {
      transfer: {
        type: data.settings.transfer?.type ?? 'basicTransfer',
        instruction: data.settings.transfer?.instruction ?? '',
      },
    },
  });
  useEffect(() => {
    form.reset({
      transfer: {
        type: data.settings.transfer?.type ?? 'basicTransfer',
        instruction: data.settings.transfer?.instruction ?? '',
      },
    });
  }, [data.settings.transfer?.instruction, data.settings.transfer?.type, form]);
  const transferType = useWatch({control: form.control, name: 'transfer.type'});

  return (
    <PanelLayout
      {...props}
      label={<Trans message="Transfer to human" />}
      description={<Trans message="If customer asks to speak to human agent" />}
      icon={<SupportAgentIcon />}
      form={form}
    >
      <div className="mb-28">
        <FormRadio name="transfer.type" value="basicTransfer" size="sm">
          <Trans message="Transfer customer to first available agent or put into queue" />
        </FormRadio>
      </div>
      <div>
        <FormRadio name="transfer.type" value="instruction" size="sm">
          <Trans message="Custom instruction" />
        </FormRadio>
        {transferType === 'instruction' && (
          <div className="pl-24 pt-16">
            <FormTextField
              required
              name="transfer.instruction"
              inputElementType="textarea"
              rows={2}
              className="mb-16"
              placeholder={trans({
                message:
                  'say that there are no available agents right now and ask if you can help instead',
              })}
            />
          </div>
        )}
      </div>
    </PanelLayout>
  );
}
