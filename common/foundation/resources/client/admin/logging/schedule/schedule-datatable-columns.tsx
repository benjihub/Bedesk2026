import {ColumnConfig} from '@common/datatable/column-config';
import {Trans} from '@ui/i18n/trans';
import {NameWithAvatar} from '@common/datatable/column-templates/name-with-avatar';
import {BooleanIndicator} from '@common/datatable/column-templates/boolean-indicator';
import {Tooltip} from '@ui/tooltip/tooltip';
import {IconButton} from '@ui/buttons/icon-button';
import React from 'react';
import {ScheduleLogItem} from '@common/admin/logging/schedule/schedule-log-item';
import {useRerunScheduledCommand} from '@common/admin/logging/schedule/use-rerurun-scheduled-command';
import {EventRepeatIcon} from '@ui/icons/material/EventRepeat';
import {FormattedRelativeTime} from '@ui/i18n/formatted-relative-time';

export const ScheduleDatatableColumns: ColumnConfig<ScheduleLogItem>[] = [
  {
    key: 'command',
    allowsSorting: true,
    visibleInMode: 'all',
    width: 'flex-3 min-w-200',
    header: () => <Trans message="Name" />,
    body: item => (
      <NameWithAvatar label={item.command} description={item.output} />
    ),
  },
  {
    key: 'ran_at',
    allowsSorting: true,
    header: () => <Trans message="Last ran at" />,
    body: item => <FormattedRelativeTime date={item.ran_at} />,
  },
  {
    key: 'duration',
    allowsSorting: true,
    header: () => <Trans message="Duration" />,
    body: item => `${item.duration}ms`,
  },
  {
    key: 'exit_code',
    allowsSorting: true,
    header: () => <Trans message="Completed" />,
    body: item => <BooleanIndicator value={item.exit_code === 0} />,
  },
  {
    key: 'actions',
    header: () => <Trans message="Actions" />,
    hideHeader: true,
    align: 'end',
    width: 'w-42 flex-shrink-0',
    visibleInMode: 'all',
    body: item => <RerunButton item={item} />,
  },
];

interface RerunButtonProps {
  item: ScheduleLogItem;
}
function RerunButton({item}: RerunButtonProps) {
  const rerunCommand = useRerunScheduledCommand();
  return (
    <Tooltip label={<Trans message="Rerun now" />}>
      <IconButton
        size="md"
        className="text-muted"
        disabled={rerunCommand.isPending}
        onClick={() => {
          rerunCommand.mutate({id: item.id});
        }}
      >
        <EventRepeatIcon />
      </IconButton>
    </Tooltip>
  );
}
