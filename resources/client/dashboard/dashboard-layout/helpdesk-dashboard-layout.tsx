import {HelpdeskDashboardSidebar} from '@app/dashboard/dashboard-layout/helpdesk-dashboard-sidebar';
import {MobileBottomNavbar} from '@app/dashboard/dashboard-layout/mobile-bottom-navbar';
import {dashboardChatUpdatesNotifier} from '@app/dashboard/websockets/dashboard-websocket-updates-notifier';
import {useDashboardWebsocketListener} from '@app/dashboard/websockets/use-dashboard-websocket-listener';
import {useAgentPresenceKeepAlive} from '@app/dashboard/hooks/use-agent-presence-keep-alive';
import {useCompactAgents} from '@app/dashboard/agents/use-compact-agents';
import {useAuth} from '@common/auth/use-auth';
import {DashboardLayout} from '@common/ui/dashboard-layout/dashboard-layout';
import {DashboardSidenav} from '@common/ui/dashboard-layout/dashboard-sidenav';
import {useMediaQuery} from '@ui/utils/hooks/use-media-query';
import {Fragment, useEffect} from 'react';
import {Outlet, useMatch, useMatches} from 'react-router';

export function Component() {
  const isCompactLayout = useMediaQuery('(max-width: 1024px)');
  const matches = useMatches();
  const customDashboardLayout = matches.some(
    m => (m.handle as any)?.customDashboardLayout,
  );

  return (
    <Fragment>
      <GlobalDashboardHooks />
      <DashboardLayout
        name="dashboard"
        leftSidenavCanBeCompact
        compactByDefault
        className="dashboard-layout-with-spacing"
      >
        <DashboardSidenav position="left" size="sm">
          <HelpdeskDashboardSidebar />
        </DashboardSidenav>
        {customDashboardLayout ? (
          <Outlet />
        ) : (
          <div className="dashboard-grid-content dashboard-rounded-panel">
            <Outlet />
          </div>
        )}
        {isCompactLayout && <MobileBottomNavbar />}
      </DashboardLayout>
    </Fragment>
  );
}

// prevent re-rendering of the whole layout when any of these hooks cause a re-render
function GlobalDashboardHooks() {
  const {user} = useAuth();
  useDashboardWebsocketListener();
  useAgentPresenceKeepAlive();

  // this will poll agents every 30 seconds and touch updated_at date for current user
  const compactAgentQuery = useCompactAgents();

  if (!dashboardChatUpdatesNotifier.isInitialized && compactAgentQuery.agents) {
    const agent = compactAgentQuery.agents.find(a => a.id === user?.id);
    if (agent) {
      dashboardChatUpdatesNotifier.init(agent);
    }
  }

  const match = useMatch('dashboard/conversations/*');
  const isInboxOpen = !!match;
  const conversationId = match?.params['*'];

  useEffect(() => {
    dashboardChatUpdatesNotifier.setPageStatus({
      activeConversationId: conversationId ? +conversationId : null,
      isInboxOpen: isInboxOpen,
    });
  }, [isInboxOpen, conversationId]);

  return null;
}
