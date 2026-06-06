import {editAgentPageTabs} from '@app/dashboard/agents/edit-agent-page/tabs/edit-agent-page-tabs';
import {useCanEditAgent} from '@app/dashboard/agents/use-agent-permissions';
import {useAgentWasActiveRecently} from '@app/dashboard/agents/use-compact-agents';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {CrupdateResourceHeader} from '@common/admin/crupdate-resource-layout';
import {UpdateUserPageActions} from '@common/admin/users/update-user-page/update-user-page-actions';
import {UpdateUserPageHeader} from '@common/admin/users/update-user-page/update-user-page-header';
import {UpdateUserPageTabs} from '@common/admin/users/update-user-page/update-user-page-tabs';
import {StaticPageTitle} from '@common/seo/static-page-title';
import {useRequiredParams} from '@common/ui/navigation/use-required-params';
import {useSuspenseQuery} from '@tanstack/react-query';
import {OnlineStatusCircle} from '@ui/badge/online-status-circle';
import {Breadcrumb} from '@ui/breadcrumbs/breadcrumb';
import {BreadcrumbItem} from '@ui/breadcrumbs/breadcrumb-item';
import {Trans} from '@ui/i18n/trans';
import {Navigate} from 'react-router';

export function Component() {
  const {agentId} = useRequiredParams(['agentId']);
  const query = useSuspenseQuery(helpdeskQueries.agents.get(agentId));
  const canEditAgent = useCanEditAgent(query.data.agent.id);

  if (!canEditAgent) {
    return <Navigate to=".." replace />;
  }

  return (
    <div className="flex h-full flex-col">
      <StaticPageTitle>
        <Trans message="Edit member" />
      </StaticPageTitle>
      <CrupdateResourceHeader
        endActions={<UpdateUserPageActions user={query.data.agent} />}
      >
        <Breadcrumb size="xl">
          <BreadcrumbItem to="../members">
            <Trans message="Team members" />
          </BreadcrumbItem>
          <BreadcrumbItem>{query.data.agent.name}</BreadcrumbItem>
        </Breadcrumb>
      </CrupdateResourceHeader>
      <div className="flex-auto overflow-y-auto">
        <UpdateUserPageHeader
          badge={<OnlineIndicator agent={query.data.agent} />}
          user={query.data.agent}
        />
        <UpdateUserPageTabs user={query.data.agent} tabs={editAgentPageTabs} />
      </div>
    </div>
  );
}

interface OnlineIndicatorProps {
  agent: {id: number};
}
export function OnlineIndicator({agent}: OnlineIndicatorProps) {
  const isOnline = useAgentWasActiveRecently(agent.id);
  return (
    <OnlineStatusCircle
      isOnline={isOnline}
      size="md"
      color={isOnline ? 'bg-positive' : 'bg-danger'}
    />
  );
}
