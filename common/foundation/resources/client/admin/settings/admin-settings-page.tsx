import {useAdminSettingsPageNavConfig} from '@common/admin/settings/use-admin-settings-page-nav-config';
import {DatatablePageHeaderBar} from '@common/datatable/page/datatable-page-with-header-layout';
import {Trans} from '@ui/i18n/trans';
import {useIsMobileMediaQuery} from '@ui/utils/hooks/is-mobile-media-query';
import clsx from 'clsx';
import {NavLink, Outlet, useLocation} from 'react-router';
import {Fragment} from 'react/jsx-runtime';
import {StaticPageTitle} from '../../seo/static-page-title';

export function Component() {
  const isMobile = useIsMobileMediaQuery();

  return (
    <Fragment>
      <StaticPageTitle>
        <Trans message="Settings" />
      </StaticPageTitle>
      {!isMobile && <DesktopNav />}
      <Outlet />
    </Fragment>
  );
}

function DesktopNav() {
  const {pathname} = useLocation();
  const navConfig = useAdminSettingsPageNavConfig();
  return (
    <div className="dashboard-rounded-panel dashboard-grid-sidenav-left-2 flex w-256 flex-col lg:mr-8">
      <DatatablePageHeaderBar
        title={<Trans message="Settings" />}
        showSidebarToggleButton
      />
      <div className="compact-scrollbar flex-auto overflow-y-auto p-12 md:py-24">
        {navConfig.map(item => (
          <NavLink
            key={item.to as string}
            to={item.to}
            state={{prevPath: pathname}}
            className={({isActive}) =>
              clsx(
                'mb-8 block whitespace-nowrap rounded-panel px-12 py-8 text-sm transition-bg-color',
                isActive
                  ? 'bg-primary/6 font-semibold text-primary'
                  : 'hover:bg-hover',
              )
            }
          >
            <Trans {...item.label} />
          </NavLink>
        ))}
      </div>
    </div>
  );
}
