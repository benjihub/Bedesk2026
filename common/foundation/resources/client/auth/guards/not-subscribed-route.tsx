import {ReactElement} from 'react';
import {Navigate, Outlet, redirect} from 'react-router';
import {auth, useAuth} from '../use-auth';

interface GuestRouteProps {
  children: ReactElement;
}
export function NotSubscribedRoute({children}: GuestRouteProps) {
  const {isLoggedIn, isSubscribed} = useAuth();

  if (!isLoggedIn) {
    return <Navigate to="/register" replace />;
  }

  if (isLoggedIn && isSubscribed) {
    return <Navigate to="/billing" replace />;
  }

  return children || <Outlet />;
}

export function notSubscribedGuard() {
  if (!auth.isLoggedIn) {
    return redirect('/register');
  }

  if (auth.isLoggedIn && auth.isSubscribed) {
    return redirect('/billing');
  }

  return null;
}
