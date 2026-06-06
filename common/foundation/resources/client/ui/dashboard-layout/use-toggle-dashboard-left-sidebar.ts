import {DashboardLayoutContext} from '@common/ui/dashboard-layout/dashboard-layout-context';
import {setInLocalStorage} from '@ui/utils/hooks/local-storage';
import {useCallback, useContext} from 'react';

export function useToggleDashboardLeftSidebar() {
  const {leftSidenavStatus, setLeftSidenavStatus, name, isMobileMode} =
    useContext(DashboardLayoutContext);

  const toggleLeftSidenav = useCallback(() => {
    const newStatus = leftSidenavStatus === 'open' ? 'compact' : 'open';
    setLeftSidenavStatus(newStatus);
    setInLocalStorage(`${name}.sidenav.compact`, newStatus === 'compact');
  }, [leftSidenavStatus, setLeftSidenavStatus, name]);

  return {leftSidenavStatus, toggleLeftSidenav, isMobileMode};
}
