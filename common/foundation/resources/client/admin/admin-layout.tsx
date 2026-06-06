import {
  AdminSetupAlert,
  useAdminSiteAlerts,
} from '@common/admin/use-admin-site-alerts';
import {DashboardContent} from '@common/ui/dashboard-layout/dashboard-content';
import {DashboardLayout} from '@common/ui/dashboard-layout/dashboard-layout';
import {DashboardSidenav} from '@common/ui/dashboard-layout/dashboard-sidenav';
import {SectionHelper} from '@common/ui/other/section-helper';
import {ErrorIcon} from '@ui/icons/material/Error';
import {InfoIcon} from '@ui/icons/material/Info';
import {
  getFromLocalStorage,
  setInLocalStorage,
  useLocalStorage,
} from '@ui/utils/hooks/local-storage';
import clsx from 'clsx';
import {Outlet, useMatches} from 'react-router';
import {Fragment} from 'react/jsx-runtime';
import {AdminSidebar} from './admin-sidebar';

export function Component() {
  const matches = useMatches();
  const customDashboardLayout = matches.some(
    m => (m.handle as any)?.customDashboardLayout,
  );
  return (
    <DashboardLayout
      name="admin"
      leftSidenavCanBeCompact
      className="dashboard-layout-with-spacing"
    >
      <DashboardSidenav position="left" size="sm">
        <AdminSidebar />
      </DashboardSidenav>
      {customDashboardLayout ? (
        <Fragment>
          <SiteAlertsList />
          <Outlet />
        </Fragment>
      ) : (
        <DashboardContent isScrollable={true} stableScrollbar={false}>
          <div className="dashboard-rounded-panel">
            <SiteAlertsList />
            <Outlet />
          </div>
        </DashboardContent>
      )}
    </DashboardLayout>
  );
}

type DismissedAlert = {
  id: string;
  timestamp: number;
};

function SiteAlertsList() {
  const {data} = useAdminSiteAlerts();
  const [dismissedAlerts] = useLocalStorage<DismissedAlert[]>(
    'dismissed-site-alerts',
    [],
  );

  // show alert if 1 day passed since last dismiss
  const alerts = data?.alerts.filter(
    alert =>
      !dismissedAlerts?.some(
        d => d.id === alert.id && Date.now() - d.timestamp < 86400000,
      ),
  );

  if (!alerts?.length) {
    return null;
  }

  return (
    <div className="fixed bottom-24 right-24 z-10 mx-auto flex w-[742px] max-w-[calc(100%-48px)] flex-col gap-12">
      {alerts.map(alert => (
        <SetupAlert key={alert.id} alert={alert} />
      ))}
    </div>
  );
}

interface SetupAlertProps {
  alert: AdminSetupAlert;
}
function SetupAlert({alert}: SetupAlertProps) {
  const description = (
    <div dangerouslySetInnerHTML={{__html: alert.description}}></div>
  );

  const handleDismiss = () => {
    const dismissedAlerts =
      getFromLocalStorage<DismissedAlert[]>('dismissed-site-alerts') || [];
    const value = {
      id: alert.id,
      timestamp: Date.now(),
    };
    const i = dismissedAlerts.findIndex(v => v.id === alert.id);
    if (i === -1) {
      dismissedAlerts.push(value);
    } else {
      dismissedAlerts[i] = value;
    }
    setInLocalStorage('dismissed-site-alerts', dismissedAlerts);
  };

  const icon =
    alert.severity === 'error' ? (
      <ErrorIcon size="xs" className="text-danger" />
    ) : (
      <InfoIcon size="xs" />
    );

  return (
    <div className={clsx('overflow-hidden rounded-panel bg shadow-lg')}>
      <SectionHelper
        leadingIcon={icon}
        onClose={() => handleDismiss()}
        key={alert.title}
        title={alert.title}
        description={description}
        color={alert.severity === 'error' ? 'danger' : 'neutral'}
      />
    </div>
  );
}
