import {Link} from 'react-router';
import {CustomMenu} from '@common/menus/custom-menu';
import {useSettings} from '@ui/settings/use-settings';

export function AuthLayoutFooter() {
  const {branding} = useSettings();
  return (
    <div className="mt-auto flex items-center gap-30 pb-32 pt-42 text-sm text-muted">
      <Link className="transition-colors hover:text-fg-base" to="/">
        © {branding.site_name}
      </Link>
      <CustomMenu
        menu="auth-page-footer"
        orientation="horizontal"
        itemClassName="hover:text-fg-base transition-colors"
      />
    </div>
  );
}
