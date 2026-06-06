import {ReactElement} from 'react';
import {Navigate, Outlet, useLocation} from 'react-router';
import {useSettingsPreviewMode} from '../../admin/settings/preview/use-settings-preview-mode';
import {useAuth} from '../use-auth';

interface GuestRouteProps {
  children: ReactElement;
}
export function GuestRoute({children}: GuestRouteProps) {
  const {isLoggedIn, getRedirectUri} = useAuth();
  const {isInsideSettingsPreview: isAppearanceEditorActive} =
    useSettingsPreviewMode();
  const redirectUri = getRedirectUri();
  const {pathname} = useLocation();

  if (isLoggedIn && !isAppearanceEditorActive) {
    // prevent recursive redirects
    if (redirectUri !== pathname) {
      return <Navigate to={redirectUri} replace />;
    }
  }

  return children || <Outlet />;
}
