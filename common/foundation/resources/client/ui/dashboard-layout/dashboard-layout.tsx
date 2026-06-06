import {useControlledState} from '@react-stately/utils';
import {Underlay} from '@ui/overlays/underlay';
import {
  getFromLocalStorage,
  setInLocalStorage,
} from '@ui/utils/hooks/local-storage';
import {useBlockBodyOverflow} from '@ui/utils/hooks/use-block-body-overflow';
import {useMediaQuery} from '@ui/utils/hooks/use-media-query';
import {usePrevious} from '@ui/utils/hooks/use-previous';
import clsx from 'clsx';
import {AnimatePresence} from 'framer-motion';
import {ComponentPropsWithoutRef, useCallback, useEffect, useMemo} from 'react';
import {
  DashboardLayoutContext,
  DashboardSidenavStatus,
} from './dashboard-layout-context';

interface DashboardLayoutProps extends ComponentPropsWithoutRef<'div'> {
  name: string;
  leftSidenavCanBeCompact?: boolean;
  leftSidenavStatus?: DashboardSidenavStatus;
  onLeftSidenavChange?: (status: DashboardSidenavStatus) => void;
  rightSidenavStatus?: DashboardSidenavStatus;
  compactByDefault?: boolean;
  initialRightSidenavStatus?: DashboardSidenavStatus;
  onRightSidenavChange?: (status: DashboardSidenavStatus) => void;
  height?: string;
  gridClassName?: string;
  blockBodyOverflow?: boolean;
}
export function DashboardLayout({
  children,
  leftSidenavStatus: leftSidenav,
  onLeftSidenavChange,
  rightSidenavStatus: rightSidenav,
  compactByDefault,
  initialRightSidenavStatus,
  onRightSidenavChange,
  name,
  leftSidenavCanBeCompact,
  height = 'h-screen',
  className,
  gridClassName = 'dashboard-grid',
  blockBodyOverflow = true,
  ...domProps
}: DashboardLayoutProps) {
  useBlockBodyOverflow(!blockBodyOverflow);
  const isMobile = useMediaQuery('(max-width: 1024px)');

  const isCompactModeInitially = useMemo(() => {
    if (!name) return compactByDefault ?? false;

    const stored = getFromLocalStorage(`${name}.sidenav.compact`);
    if (stored != null) {
      return stored;
    }

    return compactByDefault ?? false;
  }, [name, compactByDefault]);

  const defaultLeftSidenavStatus = isCompactModeInitially ? 'compact' : 'open';
  const [leftSidenavStatus, setLeftSidenavStatus] = useControlledState(
    leftSidenav,
    isMobile ? 'closed' : defaultLeftSidenavStatus,
    onLeftSidenavChange,
  );

  const rightSidenavStatusDefault = useMemo(() => {
    if (isMobile) {
      return 'closed';
    }
    if (initialRightSidenavStatus != null) {
      return initialRightSidenavStatus;
    }
    const userSelected = getFromLocalStorage(
      `${name}.sidenav.right.position`,
      'open',
    );
    if (userSelected != null) {
      return userSelected;
    }
    return initialRightSidenavStatus || 'closed';
  }, [isMobile, name, initialRightSidenavStatus]);
  const [rightSidenavStatus, _setRightSidenavStatus] = useControlledState(
    rightSidenav,
    rightSidenavStatusDefault,
    onRightSidenavChange,
  );
  const setRightSidenavStatus = useCallback(
    (status: DashboardSidenavStatus) => {
      _setRightSidenavStatus(status);
      setInLocalStorage(`${name}.sidenav.right.position`, status);
    },
    [_setRightSidenavStatus, name],
  );

  const previousIsMobile = usePrevious(isMobile);
  useEffect(() => {
    if (isMobile === previousIsMobile) return;

    if (!isMobile) {
      setLeftSidenavStatus(defaultLeftSidenavStatus);
      setRightSidenavStatus(rightSidenavStatusDefault);
    } else {
      setLeftSidenavStatus('closed');
      setRightSidenavStatus('closed');
    }
  }, [
    isMobile,
    defaultLeftSidenavStatus,
    rightSidenavStatusDefault,
    previousIsMobile,
    setLeftSidenavStatus,
    setRightSidenavStatus,
  ]);

  const shouldShowUnderlay =
    isMobile && (leftSidenavStatus === 'open' || rightSidenavStatus === 'open');

  return (
    <DashboardLayoutContext.Provider
      value={{
        leftSidenavStatus,
        setLeftSidenavStatus,
        rightSidenavStatus,
        setRightSidenavStatus,
        leftSidenavCanBeCompact,
        name,
        isMobileMode: isMobile,
      }}
    >
      <div
        {...domProps}
        className={clsx(
          'relative isolate',
          isMobile && 'dashboard-mobile-mode',
          gridClassName,
          className,
          height,
        )}
      >
        {children}
        <AnimatePresence>
          {shouldShowUnderlay && (
            <Underlay
              position="fixed"
              key="dashboard-underlay"
              onClick={() => {
                setLeftSidenavStatus('closed');
                setRightSidenavStatus('closed');
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </DashboardLayoutContext.Provider>
  );
}
