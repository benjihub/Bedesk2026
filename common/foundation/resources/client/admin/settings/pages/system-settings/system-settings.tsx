import {CacheSettings} from '@common/admin/settings/pages/system-settings/cache-settings';
import {LoggingSettings} from '@common/admin/settings/pages/system-settings/logging-settings';
import {QueueSettings} from '@common/admin/settings/pages/system-settings/queue-settings';
import {WebsocketSettings} from '@common/admin/settings/pages/system-settings/websocket-settings';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {useSettings} from '@ui/settings/use-settings';
import {Tab} from '@ui/tabs/tab';
import {TabList} from '@ui/tabs/tab-list';
import {Tabs} from '@ui/tabs/tabs';
import {Fragment, ReactElement, useMemo} from 'react';
import {useSearchParams} from 'react-router';

const allTabs = [
  {
    name: 'cache',
    label: message('Cache'),
  },
  {
    name: 'queue',
    label: message('Queue'),
  },
  {
    name: 'logging',
    label: message('Logging'),
  },
  {
    name: 'websockets',
    label: message('Websockets'),
  },
] as const;

type TabName = (typeof allTabs)[number]['name'];

export function Component() {
  const {websockets} = useSettings();
  const [searchParams, setSearchParams] = useSearchParams();

  const filteredTabs = useMemo(
    () =>
      allTabs.filter(
        tab => tab.name !== 'websockets' || websockets?.integrated,
      ),
    [websockets],
  );

  const tabName = (searchParams.get('tab') ?? 'cache') as TabName;
  const tabIndex = filteredTabs.findIndex(tab => tab.name === tabName) ?? 0;

  return (
    <Fragment>
      <TabContent
        tabName={tabName}
        tabs={
          <Tabs
            selectedTab={tabIndex}
            onTabChange={tabIndex => {
              const tab = filteredTabs[tabIndex];
              setSearchParams({tab: tab.name}, {replace: true});
            }}
          >
            <TabList className="mx-24">
              {filteredTabs.map(tab => (
                <Tab key={tab.name}>
                  <Trans {...tab.label} />
                </Tab>
              ))}
            </TabList>
          </Tabs>
        }
      />
    </Fragment>
  );
}

interface TabContentProps {
  tabName: TabName;
  tabs: ReactElement;
}
function TabContent({tabName, tabs}: TabContentProps) {
  const title = <Trans message="System" />;
  switch (tabName) {
    case 'cache':
      return <CacheSettings tabs={tabs} title={title} />;
    case 'queue':
      return <QueueSettings tabs={tabs} title={title} />;
    case 'logging':
      return <LoggingSettings tabs={tabs} title={title} />;
    case 'websockets':
      return <WebsocketSettings tabs={tabs} title={title} />;
  }
}
