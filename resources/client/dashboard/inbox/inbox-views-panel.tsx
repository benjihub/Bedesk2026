import {DashboardIcon, DashboardIconName} from '@app/dashboard/dashboard-icons';
import {InboxSectionHeader} from '@app/dashboard/dashboard-layout/inbox-section-header';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {InboxView} from '@app/dashboard/types/views';
import {useQuery} from '@tanstack/react-query';
import {IconButton} from '@ui/buttons/icon-button';
import {FormattedNumber} from '@ui/i18n/formatted-number';
import {Trans} from '@ui/i18n/trans';
import {AddIcon} from '@ui/icons/material/Add';
import {KeyboardArrowRightIcon} from '@ui/icons/material/KeyboardArrowRight';
import {SearchIcon} from '@ui/icons/material/Search';
import {TuneIcon} from '@ui/icons/material/Tune';
import {Tooltip} from '@ui/tooltip/tooltip';
import {useLocalStorage} from '@ui/utils/hooks/local-storage';
import clsx from 'clsx';
import {Fragment, ReactElement, ReactNode, useMemo} from 'react';
import {Link, NavLink, useSearchParams} from 'react-router';

export function InboxViewsPanel() {
  const {data} = useQuery(helpdeskQueries.conversations.inboxViews);

  const {views, pinnedViews, groupViews} = useMemo(() => {
    const pinnedViews: InboxView[] = [];
    const views: InboxView[] = [];
    const groupViews: InboxView[] = [];
    data?.views.forEach(view => {
      if (view.pinned) {
        pinnedViews.push(view);
      } else if (view.isGroupView) {
        groupViews.push(view);
      } else {
        views.push(view);
      }
    });
    return {views, pinnedViews, groupViews};
  }, [data?.views]);

  return (
    <Fragment>
      <Toolbar />
      <div className="compact-scrollbar flex-auto overflow-y-auto pl-12">
        <ViewList views={pinnedViews} />
        <Section
          name="views"
          actions={
            <IconButton
              size="xs"
              iconSize="sm"
              elementType={Link}
              to="/dashboard/views"
              target="_blank"
            >
              <TuneIcon />
            </IconButton>
          }
        >
          <Trans message="Views" />
          <ViewList views={views} className="pl-4" />
        </Section>
        <Section name="groups">
          <Trans message="Groups" />
          {groupViews.length > 0 ? (
            <ViewList views={groupViews} className="pl-4" />
          ) : null}
        </Section>
      </div>
    </Fragment>
  );
}

function Toolbar() {
  return (
    <InboxSectionHeader showSeparator={false} padding="pl-24 pr-12">
      <Trans message="Chats" />
      <Tooltip label={<Trans message="Search conversations" />}>
        <IconButton
          elementType={Link}
          to="/dashboard/conversations/search"
          size="sm"
          radius="rounded-full"
          className="ml-auto text-muted"
        >
          <SearchIcon />
        </IconButton>
      </Tooltip>
      <Tooltip label={<Trans message="New conversation" />}>
        <IconButton
          elementType={Link}
          to="/dashboard/conversations/new"
          size="sm"
          radius="rounded-full"
          className="text-muted"
        >
          <AddIcon />
        </IconButton>
      </Tooltip>
    </InboxSectionHeader>
  );
}

interface SectionProps {
  name: string;
  children: [ReactElement, ReactElement | null];
  actions?: ReactNode;
}
function Section({name, children, actions}: SectionProps) {
  const [isExpanded, setIsExpanded] = useLocalStorage(
    `inbox-${name}-expanded`,
    true,
  );
  return (
    <Fragment>
      <div className="group mb-2 flex items-center gap-8 pl-10 pr-14 pt-20">
        <div className="mr-auto text-sm font-semibold">{children[0]}</div>
        <div className="hidden group-hover:block">{actions}</div>
        <IconButton
          size="xs"
          iconSize="sm"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <KeyboardArrowRightIcon
            className={clsx('transition-transform', isExpanded && 'rotate-90')}
          />
        </IconButton>
      </div>
      {isExpanded && children[1]}
    </Fragment>
  );
}

interface ViewListProps {
  views: InboxView[];
  className?: string;
}
function ViewList({views, className}: ViewListProps) {
  return (
    <div className={clsx('cursor-pointer text-sm', className)}>
      {views.map(view => (
        <ViewListItem view={view} key={view.id} />
      ))}
    </div>
  );
}

interface ViewListItemProps {
  view: InboxView;
}
function ViewListItem({view}: ViewListItemProps) {
  const [searchParams] = useSearchParams();
  const activeId = searchParams.get('viewId');
  const isActive =
    `${view.id}` === activeId || (view.key && view.key === activeId);
  return (
    <NavLink
      className={clsx(
        'mr-12 flex h-40 items-center justify-between gap-8 rounded-lg px-12',
        isActive
          ? 'bg-primary/10 font-semibold hover:bg-primary/12'
          : 'hover:bg-hover',
      )}
      to={`/dashboard/conversations?viewId=${view.key ?? view.id}`}
      end={true}
    >
      <DashboardIcon name={view.icon as DashboardIconName} size="xs" />
      <span className="text-overflow-ellipsis mr-12 block min-w-0 flex-auto overflow-hidden whitespace-nowrap">
        <Trans message={view.name} />
      </span>
      {view.count ? (
        <div className="ml-auto text-[11px] text-muted">
          <FormattedNumber value={view.count} />
        </div>
      ) : null}
    </NavLink>
  );
}
