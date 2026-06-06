import {Trans} from '@ui/i18n/trans';
import {Tab} from '@ui/tabs/tab';
import {TabList} from '@ui/tabs/tab-list';
import {Tabs} from '@ui/tabs/tabs';
import {useMatch} from 'react-router';

export function MailTabs() {
  const match = useMatch('/admin/settings/email/:page');
  const tabIndex = match?.params.page === 'incoming' ? 1 : 0;
  return (
    <Tabs selectedTab={tabIndex}>
      <TabList className="mx-24">
        <Tab to="/admin/settings/email/outgoing">
          <Trans message="Outgoing" />
        </Tab>
        <Tab to="/admin/settings/email/incoming">
          <Trans message="Incoming" />
        </Tab>
      </TabList>
    </Tabs>
  );
}
