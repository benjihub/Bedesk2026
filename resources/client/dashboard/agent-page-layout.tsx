import {InboxViewsPanel} from '@app/dashboard/inbox/inbox-views-panel';
import {SearchTriggerButton} from '@app/help-center/search/search-trigger-button';
import {DashboardContent} from '@common/ui/dashboard-layout/dashboard-content';
import {DashboardLayout} from '@common/ui/dashboard-layout/dashboard-layout';
import {DashboardNavbar} from '@common/ui/dashboard-layout/dashboard-navbar';
import {
  DashboardSidenav,
  SidenavProps,
} from '@common/ui/dashboard-layout/dashboard-sidenav';
import {useNavigate} from '@common/ui/navigation/use-navigate';
import {Trans} from '@ui/i18n/trans';
import {ReactElement, ReactNode} from 'react';
import {Outlet} from 'react-router';

interface Props {
  children?: ReactNode;
  rightSidenav?: ReactElement<SidenavProps>;
}
export function AgentPageLayout({children, rightSidenav}: Props) {
  const navigate = useNavigate();

  const navbar = (
    <DashboardNavbar menuPosition="agent-mailbox" color="bg" size="md">
      <SearchTriggerButton
        size="sm"
        width="w-320"
        onTrigger={() => {
          navigate('/dashboard/search');
        }}
      >
        <Trans message="Search" />
      </SearchTriggerButton>
    </DashboardNavbar>
  );
  return (
    <DashboardLayout name="mailbox">
      {navbar}
      <DashboardSidenav position="left" className="bg-alt">
        <InboxViewsPanel />
      </DashboardSidenav>
      <DashboardContent>
        <main>{children ?? <Outlet />}</main>
      </DashboardContent>
      {rightSidenav}
    </DashboardLayout>
  );
}
