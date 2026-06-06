import clsx from 'clsx';
import {m} from 'framer-motion';
import {cloneElement, ReactElement, useContext} from 'react';
import {DashboardLayoutContext} from './dashboard-layout-context';

export interface DashboardSidenavChildrenProps {
  className?: string;
  isCompactMode?: boolean;
  isOverlayMode?: boolean;
}

export interface SidenavProps {
  className?: string;
  children: ReactElement<DashboardSidenavChildrenProps>;
  position?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg' | string;
  mode?: 'overlay';
  // absolute will place sidenav between navbar/footer, fixed will overlay it over nav/footer.
  overlayPosition?: 'absolute' | 'fixed';
  display?: 'flex' | 'block';
  overflow?: string;
  forceClosed?: boolean;
}
export function DashboardSidenav({
  className,
  position,
  children,
  size = 'md',
  mode,
  overlayPosition = 'fixed',
  display = 'flex',
  overflow = 'overflow-hidden',
  forceClosed = false,
}: SidenavProps) {
  const {
    isMobileMode,
    leftSidenavStatus,
    setLeftSidenavStatus,
    rightSidenavStatus,
    setRightSidenavStatus,
  } = useContext(DashboardLayoutContext);
  const isOverlayMode = isMobileMode || mode === 'overlay';
  let status = position === 'left' ? leftSidenavStatus : rightSidenavStatus;
  // on mobile always overlay full size sidebar, instead of compact
  if (isOverlayMode && status === 'compact') {
    status = 'open';
  }

  const variants = {
    open: {
      display,
      width: getAnimateSize(status === 'compact' ? 'compact' : size) as any,
    },
    closed: {
      width: 0,
      transitionEnd: {
        display: 'none',
      },
    },
  };

  const sizeClassName = getSizeClassName(
    status === 'compact' ? 'compact' : size,
  );

  return (
    <m.div
      variants={variants}
      initial={false}
      animate={forceClosed || status === 'closed' ? 'closed' : 'open'}
      transition={{type: 'tween', duration: 0.15}}
      onClick={e => {
        // close sidenav when user clicks a link or button on mobile
        const target = e.target as HTMLElement;
        if (isMobileMode && (target.closest('button') || target.closest('a'))) {
          setLeftSidenavStatus('closed');
          setRightSidenavStatus('closed');
        }
      }}
      className={clsx(
        className,
        position === 'left'
          ? 'dashboard-grid-sidenav-left'
          : 'dashboard-grid-sidenav-right',
        overflow,
        sizeClassName,
        isOverlayMode && `${overlayPosition} bottom-0 top-0 z-20 shadow-2xl`,
        isOverlayMode && position === 'left' && 'left-0',
        isOverlayMode && position === 'right' && 'right-0',
      )}
    >
      {cloneElement<DashboardSidenavChildrenProps>(children, {
        className: clsx(
          children.props.className,
          'w-full h-full overflow-y-auto compact-scrollbar',
          status === 'compact' && 'hidden-scrollbar',
        ),
        isCompactMode: status === 'compact',
        isOverlayMode,
      })}
    </m.div>
  );
}

function getSizeClassName(size: SidenavProps['size'] | 'compact'): string {
  switch (size) {
    case 'compact':
      return 'w-60';
    case 'sm':
      return 'w-224';
    case 'md':
      return 'w-240';
    case 'lg':
      return 'w-288';
    case 'xl':
      return 'w-340';
    default:
      return size || '';
  }
}

function getAnimateSize(size: SidenavProps['size'] | 'compact') {
  switch (size) {
    case 'compact':
      return 60;
    case 'sm':
      return 224;
    case 'md':
      return 240;
    case 'lg':
      return 288;
    case 'xl':
      return 340;
    default:
      return size ? parseInt(size.replace(/^\D+/g, '')) : null;
  }
}
