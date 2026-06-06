import {NotFoundPage} from '@common/ui/not-found-page/not-found-page';
import {getBootstrapData} from '@ui/bootstrap-data/bootstrap-data-store';
import {useSettings} from '@ui/settings/use-settings';
import {ReactElement} from 'react';
import {Navigate, Outlet, redirect} from 'react-router';
import {auth, useAuth} from '../use-auth';

interface Props {
  children?: ReactElement;
  permission?: string;
  requireLogin?: boolean;
}
export function AuthRoute({children, permission, requireLogin = true}: Props) {
  const {isLoggedIn, hasPermission, isSubscribed} = useAuth();
  const {billing} = useSettings();
  if (
    (requireLogin && !isLoggedIn) ||
    (permission && !hasPermission(permission))
  ) {
    if (isLoggedIn) {
      return billing.enable && !isSubscribed ? (
        <Navigate to="/pricing" replace />
      ) : (
        <NotFoundPage />
      );
    }
    return <Navigate to="/login" replace />;
  }
  return children || <Outlet />;
}

interface AuthRouteLoaderProps {
  permission?: string;
  requireLogin?: boolean;
}
export function authGuard({
  permission,
  requireLogin = true,
}: AuthRouteLoaderProps = {}) {
  const billingEnabled = getBootstrapData().settings.billing.enable;

  if (
    (requireLogin && !auth.isLoggedIn) ||
    (permission && !auth.hasPermission(permission))
  ) {
    if (auth.isLoggedIn) {
      return billingEnabled && !auth.isSubscribed
        ? redirect('/pricing')
        : redirect('/404');
    }
    return redirect('/login');
  }

  return null;
}
