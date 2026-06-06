import {AiAgentSettings} from '@ai/ai-agent/settings/ai-agent-settings';
import {PanelLayout} from '@ai/ai-agent/settings/panel-layout';
import {AccordionItemProps} from '@common/ui/library/accordion/accordion';
import {Button} from '@common/ui/library/buttons/button';
import {message} from '@common/ui/library/i18n/message';
import {Trans} from '@common/ui/library/i18n/trans';
import {BadgeIcon} from '@common/ui/library/icons/material/Badge';
import {SentimentNeutralIcon} from '@common/ui/library/icons/material/SentimentNeutral';
import {SentimentSatisfiedIcon} from '@common/ui/library/icons/material/SentimentSatisfied';
import {SentimentVerySatisfiedIcon} from '@common/ui/library/icons/material/SentimentVerySatisfied';
import {useSuspenseQuery} from '@tanstack/react-query';
import {useForm, useWatch} from 'react-hook-form';
import {aiAgentQueries} from '../ai-agent-queries';

const personalities = [
  {
    name: 'friendly',
    label: message('Friendly'),
    icon: SentimentSatisfiedIcon,
  },
  {
    name: 'neutral',
    label: message('Neutral'),
    icon: SentimentNeutralIcon,
  },
  {
    name: 'professional',
    label: message('Professional'),
    icon: BadgeIcon,
  },
  {
    name: 'humorous',
    label: message('Humorous'),
    icon: SentimentVerySatisfiedIcon,
  },
];

export function PersonalityPanel(props: Partial<AccordionItemProps>) {
  const {data} = useSuspenseQuery(aiAgentQueries.settings.index());
  const form = useForm<Partial<AiAgentSettings>>({
    defaultValues: {
      personality: data.settings.personality ?? 'neutral',
    },
  });
  const value = useWatch({control: form.control, name: 'personality'});
  return (
    <PanelLayout
      {...props}
      label={<Trans message="Personality" />}
      description={
        <Trans message="Determines tone of voice for AI generated messages" />
      }
      icon={<SentimentSatisfiedIcon />}
      form={form}
    >
      <div className="flex items-center gap-12">
        {personalities.map(personality => (
          <Button
            key={personality.name}
            value={personality.name}
            startIcon={<personality.icon />}
            variant="outline"
            color={value === personality.name ? 'primary' : undefined}
            onClick={() => form.setValue('personality', personality.name)}
            size="sm"
            className="min-h-46 min-w-208"
          >
            <Trans {...personality.label} />
          </Button>
        ))}
      </div>
    </PanelLayout>
  );
}
