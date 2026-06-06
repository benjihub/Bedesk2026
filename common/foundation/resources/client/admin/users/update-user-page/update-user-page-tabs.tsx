import {UpdateUserPageUser} from '@common/admin/users/update-user-page/update-user-page-user';
import {useAuth} from '@common/auth/use-auth';
import {
  UrlBackedTabConfig,
  useUrlBackedTabs,
} from '@common/http/use-url-backed-tabs';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {useSettings} from '@ui/settings/use-settings';
import {Tab} from '@ui/tabs/tab';
import {TabList} from '@ui/tabs/tab-list';
import {Tabs} from '@ui/tabs/tabs';
import {useMemo} from 'react';
import {Link, Outlet} from 'react-router';

export const updateUserPageTabs: UrlBackedTabConfig[] = [
  {uri: 'details', label: message('Details')},
  {uri: 'permissions', label: message('Roles & permissions')},
  {uri: 'security', label: message('Security')},
  {uri: 'date', label: message('Date & time')},
  {uri: 'api', label: message('API')},
];

interface Props {
  tabs: UrlBackedTabConfig[];
  user: UpdateUserPageUser;
}
export function UpdateUserPageTabs({user, tabs}: Props) {
  const {user: authUser, hasPermission} = useAuth();
  const {api} = useSettings();
  const apiEnabled = api?.integrated && hasPermission('api.access');
  const filteredTabs = useMemo(() => {
    return tabs.filter(tab => {
      if (tab.uri === 'api' && !apiEnabled) {
        return false;
      }
      if (tab.uri === 'security' && user.id !== authUser?.id) {
        return false;
      }
      return true;
    });
  }, [user.id, authUser?.id, apiEnabled, tabs]);

  const [activeTab, setActiveTab] = useUrlBackedTabs(filteredTabs);

  return (
    <div className="container mx-auto px-24">
      <Tabs
        selectedTab={activeTab}
        onTabChange={setActiveTab}
        overflow="overflow-visible"
      >
        <TabList className="mb-24">
          {filteredTabs.map(tab => (
            <Tab key={tab.uri} elementType={Link} to={tab.uri}>
              <Trans {...tab.label} />
            </Tab>
          ))}
        </TabList>
        <Outlet context={user} />
      </Tabs>
    </div>
  );
}
