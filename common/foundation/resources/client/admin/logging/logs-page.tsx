import {AdminDocsUrls} from '@app/admin/admin-config';
import {DocsLink} from '@common/admin/settings/layout/settings-links';
import {DatatablePageHeaderBar} from '@common/datatable/page/datatable-page-with-header-layout';
import {
  UrlBackedTabConfig,
  useUrlBackedTabs,
} from '@common/http/use-url-backed-tabs';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {Tab} from '@ui/tabs/tab';
import {TabList} from '@ui/tabs/tab-list';
import {Tabs} from '@ui/tabs/tabs';
import {Fragment} from 'react';
import {Link, Outlet} from 'react-router';

const tabs: UrlBackedTabConfig[] = [
  {uri: 'schedule', label: message('Schedule')},
  {uri: 'error', label: message('Error')},
  {uri: 'outgoing-email', label: message('Email')},
];

export function Component() {
  const [activeTab, setActiveTab] = useUrlBackedTabs(tabs);

  return (
    <Fragment>
      <DatatablePageHeaderBar
        title={<Title tab={tabs[activeTab].uri} />}
        showSidebarToggleButton
        border="border-none"
        rightContent={
          <DocsLink
            variant="button"
            link={AdminDocsUrls.pages.logs}
            size="xs"
          />
        }
      />
      <Tabs selectedTab={activeTab} onTabChange={setActiveTab}>
        <TabList className="px-24">
          <Tab
            elementType={Link}
            to="/admin/logs/schedule"
            className="min-w-100"
            replace
          >
            <Trans message="Schedule" />
          </Tab>
          <Tab
            elementType={Link}
            to="/admin/logs/error"
            className="min-w-100"
            replace
          >
            <Trans message="Error" />
          </Tab>
          <Tab
            elementType={Link}
            to="/admin/logs/outgoing-email"
            className="min-w-100"
            replace
          >
            <Trans message="Email" />
          </Tab>
        </TabList>
        <Outlet />
      </Tabs>
    </Fragment>
  );
}

interface TitleProps {
  tab: string;
}
function Title({tab}: TitleProps) {
  switch (tab) {
    case 'schedule':
      return <Trans message="CRON schedule log" />;
    case 'error':
      return <Trans message="Error log" />;
    case 'outgoing-email':
      return <Trans message="Outgoing email log" />;
  }
}
