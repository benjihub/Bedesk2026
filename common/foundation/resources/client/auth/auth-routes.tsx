import {NonIndexRouteObject, RouteObject} from 'react-router';

interface Config {
  loginRoute?: Omit<NonIndexRouteObject, 'path'>;
  registerRoute?: Omit<NonIndexRouteObject, 'path'>;
  accountSettingsRoute?: Omit<NonIndexRouteObject, 'path'>;
}

export function authRoutes({
  loginRoute,
  registerRoute,
  accountSettingsRoute,
}: Config = {}): RouteObject[] {
  return [
    {
      path: '/register',
      ...(registerRoute ? registerRoute : defaultRegisterRoute),
    },
    {
      path: '/login',
      ...(loginRoute ? loginRoute : defaultLoginRoute),
    },
    {
      path: '/workspace/join/register',
      ...(registerRoute ? registerRoute : defaultRegisterRoute),
    },
    {
      path: '/workspace/join/login',
      ...(loginRoute ? loginRoute : defaultLoginRoute),
    },
    {
      path: '/forgot-password',
      lazy: () => import('@common/auth/ui/forgot-password-page'),
    },
    {
      path: '/password/reset/:token',
      lazy: () => import('@common/auth/ui/reset-password-page'),
    },
    {
      path: '/account-settings',
      ...(accountSettingsRoute
        ? accountSettingsRoute
        : defaultAccountSettingsRoute),
    },
  ];
}

const defaultLoginRoute: NonIndexRouteObject = {
  lazy: async () => {
    const {LoginPageWrapper: Component} = await import(
      '@common/auth/ui/login-page-wrapper'
    );
    return {Component};
  },
};

const defaultRegisterRoute: NonIndexRouteObject = {
  lazy: async () => {
    const {RegisterPage: Component} = await import(
      '@common/auth/ui/register-page'
    );
    return {Component};
  },
};

const defaultAccountSettingsRoute: NonIndexRouteObject = {
  lazy: async () => {
    const {AccountSettingsPage: Component} = await import(
      '@common/auth/ui/account-settings/account-settings-page'
    );
    return {Component};
  },
};
