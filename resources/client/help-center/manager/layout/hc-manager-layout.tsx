import {AdminDocsUrls} from '@app/admin/admin-config';
import {DocsLink} from '@common/admin/settings/layout/settings-links';
import {DatatablePageHeaderBar} from '@common/datatable/page/datatable-page-with-header-layout';
import {StaticPageTitle} from '@common/seo/static-page-title';
import {Trans} from '@ui/i18n/trans';
import {Fragment, ReactNode} from 'react';

interface Props {
  actionButton?: ReactNode;
  children: ReactNode;
  breadcrumb: ReactNode;
}
export function HcManagerLayout({actionButton, children, breadcrumb}: Props) {
  return (
    <div className="flex h-full flex-col">
      <StaticPageTitle>
        <Trans message="Help center" />
      </StaticPageTitle>
      <DatatablePageHeaderBar
        title={breadcrumb}
        showSidebarToggleButton
        rightContent={
          <Fragment>
            <DocsLink
              variant="button"
              link={AdminDocsUrls.pages.helpCenter}
              size="xs"
            />
            {actionButton}
          </Fragment>
        }
      />
      <main className="dashboard-stable-scrollbar flex-auto overflow-auto p-12 md:p-24">
        <p className="mb-20 text-sm text-muted">
          <Trans message="Arrange help center categories, sections and articles." />
        </p>
        {children}
      </main>
    </div>
  );
}
