import {AiAgentSettings} from '@ai/ai-agent/settings/ai-agent-settings';
import {PanelLayout} from '@ai/ai-agent/settings/panel-layout';
import {AccordionItemProps} from '@common/ui/library/accordion/accordion';
import {FormTextField} from '@common/ui/library/forms/input-field/text-field/text-field';
import {Trans} from '@common/ui/library/i18n/trans';
import {FeedbackIcon} from '@common/ui/library/icons/material/Feedback';
import {useSuspenseQuery} from '@tanstack/react-query';
import {useEffect} from 'react';
import {useTrans} from '@ui/i18n/use-trans';
import {useSearchParams} from 'react-router';
import {useForm} from 'react-hook-form';
import {aiAgentQueries} from '../ai-agent-queries';

export function CantAssistPanel(props: Partial<AccordionItemProps>) {
  const {trans} = useTrans();
  const [searchParams] = useSearchParams();
  const activeGroupId = searchParams.get('groupId');
  const {data} = useSuspenseQuery(aiAgentQueries.settings.index(activeGroupId));
  const form = useForm<Partial<AiAgentSettings>>({
    defaultValues: {
      cantAssist: {
        instruction: data.settings.cantAssist?.instruction ?? '',
      },
    },
  });
  useEffect(() => {
    form.reset({
      cantAssist: {
        instruction: data.settings.cantAssist?.instruction ?? '',
      },
    });
  }, [data.settings.cantAssist?.instruction, form]);

  return (
    <PanelLayout
      {...props}
      label={<Trans message="If AI agent is unable to assist user" />}
      description={
        <Trans message="Choose what happens when AI agent is unable to help the customer" />
      }
      icon={<FeedbackIcon />}
      form={form}
    >
      <FormTextField
        name="cantAssist.instruction"
        label={<Trans message="Instruction (optional)" />}
        inputElementType="textarea"
        rows={2}
        className="mb-16"
        placeholder={trans({
          message:
            'say why you are unable to help and ask if you can help with something else.',
        })}
      />
    </PanelLayout>
  );
}
