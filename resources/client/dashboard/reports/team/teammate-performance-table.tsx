import {ReportMetric} from '@common/admin/analytics/report-metric';
import {
  ReportTable,
  ReportTableCell,
  ReportTableItem,
} from '@common/charts/report-table';
import {ColumnConfig} from '@common/datatable/column-config';
import {
  NameWithAvatar,
  NameWithAvatarPlaceholder,
} from '@common/datatable/column-templates/name-with-avatar';
import {LinkStyle} from '@ui/buttons/external-link';
import {Trans} from '@ui/i18n/trans';
import {Link} from 'react-router';

export interface TeammatePerformanceTableItem {
  id: number;
  email: string;
  name: string;
  image: string;
  replyCount: number;
  conversationCount: number;
  conversationsSolved: number;
  averageResponseTime: number;
  averageResolutionTime: number;
  percentageOfConversations: number;
}

const TeammatePerformanceTableColumns: ColumnConfig<
  ReportTableItem<TeammatePerformanceTableItem>
>[] = [
  {
    key: 'name',
    visibleInMode: 'all',
    header: () => <Trans message="Teammate" />,
    body: (item, row) => {
      return row.isPlaceholder ? (
        <NameWithAvatarPlaceholder avatarCircle />
      ) : (
        <NameWithAvatar
          image={item.data.image}
          avatarLabel={item.data.name}
          alwaysShowAvatar
          avatarCircle
          label={
            <Link
              className={LinkStyle}
              to={`/dashboard/team/members/${item.data.id}`}
            >
              {item.data.name}
            </Link>
          }
        />
      );
    },
  },
  {
    key: 'conversations',
    header: () => <Trans message="Conversations" />,
    body: (item, row) => (
      <ReportTableCell
        name="conversationCount"
        item={item}
        isPlaceholder={row.isPlaceholder}
      />
    ),
  },
  {
    key: 'percentageOfConversations',
    header: () => <Trans message="% of all conversations" />,
    body: (item, row) => (
      <ReportTableCell
        name="percentageOfConversations"
        item={item}
        type="percent"
        isPlaceholder={row.isPlaceholder}
      />
    ),
  },
  {
    key: 'conversationsClosed',
    header: () => <Trans message="Conversations closed" />,
    body: (item, row) => (
      <ReportTableCell
        name="conversationsSolved"
        item={item}
        isPlaceholder={row.isPlaceholder}
      />
    ),
  },
  {
    key: 'resolutionTime',
    header: () => <Trans message="Avg. resolution time" />,
    body: (item, row) => (
      <ReportTableCell
        name="averageResolutionTime"
        item={item}
        type="duration"
        compareType="smallerIsBetter"
        isPlaceholder={row.isPlaceholder}
      />
    ),
  },
  {
    key: 'responseTime',
    header: () => <Trans message="Avg. response time" />,
    body: (item, row) => (
      <ReportTableCell
        name="averageResponseTime"
        item={item}
        type="duration"
        compareType="smallerIsBetter"
        isPlaceholder={row.isPlaceholder}
      />
    ),
  },
];

interface Props {
  report: ReportMetric<TeammatePerformanceTableItem> | undefined;
}
export function TeammatePerformanceTable({report}: Props) {
  return (
    <ReportTable columns={TeammatePerformanceTableColumns} report={report} />
  );
}
