import {HcSearchBar} from '@app/help-center/search/hc-search-bar';
import {DashboardContent} from '@common/ui/dashboard-layout/dashboard-content';
import {DashboardLayout} from '@common/ui/dashboard-layout/dashboard-layout';
import {DashboardNavbar} from '@common/ui/dashboard-layout/dashboard-navbar';
import {
  DashboardSidenav,
  DashboardSidenavChildrenProps,
} from '@common/ui/dashboard-layout/dashboard-sidenav';
import {ReactElement, ReactNode} from 'react';

interface Props {
  children: ReactNode;
  leftSidenav: ReactElement<DashboardSidenavChildrenProps>;
  rightSidenav?: ReactNode;
  categoryId?: number;
}
export function ArticlePageLayout({
  children,
  leftSidenav,
  rightSidenav,
  categoryId,
}: Props) {
  return (
    <DashboardLayout
      height="h-auto"
      gridClassName="hc-grid"
      name="hc-article"
      blockBodyOverflow={false}
    >
      <DashboardNavbar
        color="bg"
        menuPosition="header"
        className="sticky top-0 z-10 flex-shrink-0"
        size="md"
      >
        <HcSearchBar categoryId={categoryId} />
      </DashboardNavbar>
      <DashboardSidenav
        position="left"
        size="w-auto"
        overflow="overflow-initial"
        className="justify-end"
      >
        {leftSidenav}
      </DashboardSidenav>
      <DashboardContent isScrollable={false}>
        <div className="min-w-0 max-w-672 px-16 py-16 md:py-64 lg:max-w-none lg:px-32 xl:px-64">
          {children}
        </div>
      </DashboardContent>
      {rightSidenav}
    </DashboardLayout>
  );
}
