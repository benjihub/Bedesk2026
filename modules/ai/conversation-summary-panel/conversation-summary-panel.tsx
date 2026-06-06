import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {WandSparkleIcon} from '@common/ai/wand-sparkle-icon';
import {Trans} from '@common/ui/library/i18n/trans';
import {ProgressCircle} from '@common/ui/library/progress/progress-circle';
import {useRequiredParams} from '@common/ui/navigation/use-required-params';
import {useQuery} from '@tanstack/react-query';
import {Button} from '@ui/buttons/button';
import {Chip} from '@ui/forms/input-field/chip-field/chip';
import {ChipList} from '@ui/forms/input-field/chip-field/chip-list';
import {FormattedDate} from '@ui/i18n/formatted-date';
import {
  ConversationSummary,
  setConversationSummaryQueryData,
} from './conversation-summary';
import {useDeleteConversationSummary} from './use-delete-conversation-summary';
import {useGenerateConversationSummary} from './use-generate-conversation-summary';

interface Props {
  initialData?: ConversationSummary | null;
}
export function ConversationSummaryPanel({initialData}: Props) {
  const {conversationId} = useRequiredParams(['conversationId']);
  const generateSummary = useGenerateConversationSummary();
  const deleteSummary = useDeleteConversationSummary();
  const {data} = useQuery(
    helpdeskQueries.conversations.summary(conversationId, initialData),
  );

  return (
    <div>
      {data?.summary ? <SummaryPanel summary={data.summary} /> : null}
      {!data?.summary ? (
        <div className="mb-10 text-xs text-muted">
          <Trans message="Use AI to generate a concise conversation summary, keywords and overall customer sentiment." />
        </div>
      ) : null}
      <div className="flex items-center gap-8">
        <Button
          variant="flat"
          color="primary"
          size="xs"
          startIcon={
            generateSummary.isPending ? (
              <ProgressCircle isIndeterminate size="xs" />
            ) : (
              <WandSparkleIcon />
            )
          }
          disabled={generateSummary.isPending}
          onClick={() => {
            generateSummary.mutate(
              {conversationId},
              {
                onSuccess: r => {
                  setConversationSummaryQueryData(conversationId, r.summary);
                },
              },
            );
          }}
        >
          <Trans message="Generate summary" />
        </Button>
        {data?.summary ? (
          <Button
            variant="outline"
            size="xs"
            disabled={deleteSummary.isPending}
            onClick={() => {
              deleteSummary.mutate(
                {conversationId},
                {
                  onSuccess: () => {
                    setConversationSummaryQueryData(conversationId, null);
                  },
                },
              );
            }}
          >
            <Trans message="Remove" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}

interface SummaryPanelProps {
  summary: ConversationSummary;
}
function SummaryPanel({summary}: SummaryPanelProps) {
  return (
    <div className="mb-24">
      <ul className="list-inside list-disc text-sm">
        {summary.content.summary.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
      <ChipList size="sm" className="mt-12">
        {summary.content.keywords.map((keyword, index) => (
          <Chip key={index}>{keyword}</Chip>
        ))}
      </ChipList>
      <div className="mt-12 text-xs text-muted">
        <Trans message="Customer sentiment" />: {summary.content.sentiment}
      </div>
      <div className="mt-6 text-xs text-muted">
        <Trans
          message="Generated on :date by :name"
          values={{
            date: <FormattedDate date={summary.created_at} preset="long" />,
            name: summary.user?.name || 'agent',
          }}
        />
      </div>
    </div>
  );
}
