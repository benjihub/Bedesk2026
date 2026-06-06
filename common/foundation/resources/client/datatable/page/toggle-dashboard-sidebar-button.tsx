import {DashboardLayoutContext} from '@common/ui/dashboard-layout/dashboard-layout-context';
import {useToggleDashboardLeftSidebar} from '@common/ui/dashboard-layout/use-toggle-dashboard-left-sidebar';
import {IconButton} from '@ui/buttons/icon-button';
import {Trans} from '@ui/i18n/trans';
import {ToggleLeftSidebarIcon} from '@ui/icons/toggle-left-sidebar-icon';
import {Tooltip} from '@ui/tooltip/tooltip';
import {use} from 'react';

export function ToggleDashboardSidebarButton() {
  const ctx = use(DashboardLayoutContext);
  return !ctx ? null : <ToggleButton />;
}

function ToggleButton() {
  const {leftSidenavStatus, toggleLeftSidenav} =
    useToggleDashboardLeftSidebar();
  const isCollapsed = leftSidenavStatus === 'compact';
  return (
    <Tooltip
      placement="bottom"
      label={
        isCollapsed ? (
          <Trans message="Expand sidebar" />
        ) : (
          <Trans message="Collapse sidebar" />
        )
      }
    >
      <IconButton size="xs" onClick={() => toggleLeftSidenav()}>
        <ToggleLeftSidebarIcon />
      </IconButton>
    </Tooltip>
  );
}
