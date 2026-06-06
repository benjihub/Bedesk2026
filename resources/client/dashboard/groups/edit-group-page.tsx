import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {useRequiredParams} from '@common/ui/navigation/use-required-params';
import {useSuspenseQuery} from '@tanstack/react-query';
import {editGroupPageTabs} from '@app/dashboard/groups/edit-group-page-tabs';
import {CrupdateResourceHeader} from '@common/admin/crupdate-resource-layout';
import {useUrlBackedTabs} from '@common/http/use-url-backed-tabs';
import {StaticPageTitle} from '@common/seo/static-page-title';
import {Breadcrumb} from '@ui/breadcrumbs/breadcrumb';
import {BreadcrumbItem} from '@ui/breadcrumbs/breadcrumb-item';
import {Trans} from '@ui/i18n/trans';
import {Tab} from '@ui/tabs/tab';
import {TabList} from '@ui/tabs/tab-list';
import {Tabs} from '@ui/tabs/tabs';
import {Link, Outlet} from 'react-router';

export function Component() {
  const {groupId} = useRequiredParams(['groupId']);
  const query = useSuspenseQuery(helpdeskQueries.groups.get(groupId));
  const group = query.data.group;

  const [activeTab, setActiveTab] = useUrlBackedTabs(editGroupPageTabs);

  return (
    <div className="flex h-full flex-col">
      <StaticPageTitle>
        <Trans message="Edit group" />
      </StaticPageTitle>
      <CrupdateResourceHeader>
        <Breadcrumb size="xl">
          <BreadcrumbItem to="/dashboard/team/groups">
            <Trans message="Groups" />
          </BreadcrumbItem>
          <BreadcrumbItem>{group.name}</BreadcrumbItem>
        </Breadcrumb>
      </CrupdateResourceHeader>
      <div className="flex-auto overflow-y-auto">
        <div className="container mx-auto px-24">
          <Tabs selectedTab={activeTab} onTabChange={setActiveTab}>
            <TabList className="mb-24">
              {editGroupPageTabs.map(tab => (
                <Tab key={tab.uri} elementType={Link} to={tab.uri}>
                  <Trans {...tab.label} />
                </Tab>
              ))}
            </TabList>
            <Outlet context={group} />
          </Tabs>
        </div>
      </div>
    </div>
  );
}
