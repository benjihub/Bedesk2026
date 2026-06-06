import {ReactElement} from 'react';
import {Navigate, Outlet, redirect} from 'react-router';
import {auth, useAuth} from '../use-auth';

interface GuestRouteProps {
  children: ReactElement;
}
export function SubscribedRoute({children}: GuestRouteProps) {
  const {isSubscribed} = useAuth();

  if (!isSubscribed) {
    return <Navigate to="/pricing" replace />;
  }

  return children || <Outlet />;
}

export function subscribedGuard() {
  if (!auth.isSubscribed) {
    return redirect('/pricing');
  }

  return null;
}
