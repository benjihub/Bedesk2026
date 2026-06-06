import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {PaginatedBackendResponse} from '@common/http/backend-response/pagination-response';
import {parseAbsoluteToLocal} from '@internationalized/date';
import {useQuery} from '@tanstack/react-query';
import {FormattedDuration} from '@ui/i18n/formatted-duration';
import {Trans} from '@ui/i18n/trans';
import {getCurrentDateTime} from '@ui/i18n/use-current-date-time';
import {ProgressCircle} from '@ui/progress/progress-circle';
import {Timeline, TimelineItem} from '@ui/timeline/timeline';
import {Tooltip} from '@ui/tooltip/tooltip';
import {memo, useState} from 'react';

export interface PageVisit {
  id: number;
  created_at: string;
  ended_at?: string;
  url: string;
  title: string;
}

interface Props {
  initialData?: PaginatedBackendResponse<PageVisit>;
  userId: number | string;
}
export function PageVisitsPanel({initialData, userId}: Props) {
  const {data} = useQuery({
    ...helpdeskQueries.pageVisits.index(userId, {perPage: '8'}),
    initialData,
  });
  const visits = data?.pagination?.data ?? [];

  if (!data) {
    return (
      <div className="flex justify-center">
        <ProgressCircle isIndeterminate size="xs" />
      </div>
    );
  }

  if (!visits.length) {
    return (
      <div className="font-italic text-xs text-muted">
        <Trans message="User has not visited any pages yet" />
      </div>
    );
  }

  return (
    <Timeline className="overflow-x-hidden">
      {visits.map((visit, index) => (
        <TimelineItem isActive={index === 0} key={visit.id} className="w-max">
          <Tooltip label={visit.url} delay={300}>
            <div>
              <a href={visit.url} target="_blank" rel="noreferrer">
                {visit.title}
              </a>
              <div className="text-xs text-muted">
                <VisitDuration
                  start={visit.created_at}
                  end={visit.ended_at}
                  isLive={index === 0}
                />
              </div>
            </div>
          </Tooltip>
        </TimelineItem>
      ))}
    </Timeline>
  );
}

interface VisitDurationProps {
  start: string;
  end?: string;
  isLive?: boolean;
}
const VisitDuration = memo(({start, end, isLive}: VisitDurationProps) => {
  const [ms] = useState<number>(() => {
    const startDate = parseAbsoluteToLocal(start);
    const endDate = end ? parseAbsoluteToLocal(end) : getCurrentDateTime();
    const diff = endDate.toDate().getTime() - startDate.toDate().getTime();
    return diff > 1000 ? diff : 1000;
  });
  return <FormattedDuration ms={ms} isLive={isLive} verbose />;
});
