import {aiAgentQueries} from '@ai/ai-agent/ai-agent-queries';
import {AiAgentSettings} from '@ai/ai-agent/settings/ai-agent-settings';
import {PanelLayout} from '@ai/ai-agent/settings/panel-layout';
import {AccordionItemProps} from '@common/ui/library/accordion/accordion';
import {FormTextField} from '@common/ui/library/forms/input-field/text-field/text-field';
import {Trans} from '@common/ui/library/i18n/trans';
import {BadgeIcon} from '@common/ui/library/icons/material/Badge';
import {useSuspenseQuery} from '@tanstack/react-query';
import {useEffect} from 'react';
import {useForm} from 'react-hook-form';
import {useSearchParams} from 'react-router';

export function IdentityPanel(props: Partial<AccordionItemProps>) {
  const [searchParams] = useSearchParams();
  const activeGroupId = searchParams.get('groupId');
  const {data} = useSuspenseQuery(aiAgentQueries.settings.index(activeGroupId));
  const form = useForm<Partial<AiAgentSettings>>({
    defaultValues: {
      name: data.settings.name,
    },
  });
  useEffect(() => {
    form.reset({
      name: data.settings.name,
    });
  }, [data.settings.name, form]);
  return (
    <PanelLayout
      {...props}
      label={<Trans message="Identity" />}
      description={<Trans message="Default display name" />}
      icon={<BadgeIcon />}
      form={form}
    >
      <FormTextField
        name="name"
        label={<Trans message="Name" />}
        description={<Trans message="The name your customers will see." />}
        required
        className="mb-16"
      />
    </PanelLayout>
  );
}
