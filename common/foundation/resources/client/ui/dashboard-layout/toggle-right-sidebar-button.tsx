import {DashboardLayoutContext} from '@common/ui/dashboard-layout/dashboard-layout-context';
import {IconButton} from '@ui/buttons/icon-button';
import {Trans} from '@ui/i18n/trans';
import {ToggleRightSidebarIcon} from '@ui/icons/toggle-right-sidebar-icon';
import {Tooltip} from '@ui/tooltip/tooltip';
import {useContext} from 'react';

export function ToggleRightSidebarButton() {
  const {rightSidenavStatus, setRightSidenavStatus} = useContext(
    DashboardLayoutContext,
  );
  return (
    <Tooltip label={<Trans message="Toggle sidebar" />}>
      <IconButton
        size="xs"
        onClick={() =>
          setRightSidenavStatus(
            rightSidenavStatus === 'open' ? 'closed' : 'open',
          )
        }
      >
        <ToggleRightSidebarIcon />
      </IconButton>
    </Tooltip>
  );
}
