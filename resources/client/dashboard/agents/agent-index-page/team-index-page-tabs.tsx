import {Trans} from '@ui/i18n/trans';
import {Tab} from '@ui/tabs/tab';
import {TabList} from '@ui/tabs/tab-list';
import {Tabs} from '@ui/tabs/tabs';
import {useState} from 'react';
import {Link, useMatches} from 'react-router';

const tabConfig = [
  {uri: 'members', label: {message: 'Members'}},
  {uri: 'groups', label: {message: 'Groups'}},
  {uri: 'invites', label: {message: 'Invites'}},
];

export function TeamIndexPageTabs() {
  const tabs = tabConfig;
  const matches = useMatches();
  const pathname = matches.at(-1)?.pathname;
  const [activeTab, setActiveTab] = useState(() => {
    if (pathname?.endsWith('invites')) {
      return tabs.findIndex(tab => tab.uri === 'invites');
    }
    if (pathname?.endsWith('groups')) {
      return tabs.findIndex(tab => tab.uri === 'groups');
    }
    const membersIndex = tabs.findIndex(tab => tab.uri === 'members');
    return membersIndex === -1 ? 0 : membersIndex;
  });
  return (
    <Tabs selectedTab={activeTab} onTabChange={setActiveTab}>
      <TabList className="mx-24">
        {tabs.map(tab => (
          <Tab key={tab.uri} elementType={Link} to={`../${tab.uri}`}>
            <Trans {...tab.label} />
          </Tab>
        ))}
      </TabList>
    </Tabs>
  );
}
