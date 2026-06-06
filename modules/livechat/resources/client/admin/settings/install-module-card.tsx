import {SettingsMobileNav} from '@common/admin/settings/layout/settings-layout';
import {useAdminSettings} from '@common/admin/settings/requests/use-admin-settings';
import {DatatablePageHeaderBar} from '@common/datatable/page/datatable-page-with-header-layout';
import {Button} from '@ui/buttons/button';
import {Trans} from '@ui/i18n/trans';
import {OpenInNewIcon} from '@ui/icons/material/OpenInNew';
import {useIsMobileMediaQuery} from '@ui/utils/hooks/is-mobile-media-query';
import {ReactElement, ReactNode} from 'react';

type Props = {
  title: ReactNode;
  description: ReactNode;
  icon: ReactElement;
  getModuleLabel: ReactNode;
  moduleName: string;
};
export function InstallModuleCard({
  title,
  description,
  icon,
  getModuleLabel,
  moduleName,
}: Props) {
  const isMobile = useIsMobileMediaQuery();
  const {data} = useAdminSettings();
  const envatoItemId = data.modules?.[moduleName]?.envato_item_id;
  return (
    <div className="dashboard-grid-content dashboard-rounded-panel relative flex flex-auto flex-col">
      <DatatablePageHeaderBar
        showSidebarToggleButton={!!isMobile}
        title={<Trans message="Livechat" />}
        rightContent={isMobile && <SettingsMobileNav />}
      />
      <div className="p-24">
        <div className="max-w-680 rounded-panel border p-24 shadow">
          <div className="mb-24">{icon}</div>
          <div className="mb-10 text-base font-medium">{title}</div>
          <div className="text-sm text-muted">{description}</div>
          <div className="mt-24 flex items-center gap-12">
            <Button
              variant="raised"
              color="primary"
              elementType="a"
              href={`https://codecanyon.net/item/i/${envatoItemId}`}
              target="_blank"
              endIcon={<OpenInNewIcon />}
            >
              {getModuleLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
