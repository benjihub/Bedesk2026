import {useUser} from '@common/auth/ui/use-user';
import {Trans} from '@ui/i18n/trans';
import {Button} from '@ui/buttons/button';
import {useIsDarkMode} from '@ui/themes/use-is-dark-mode';
import {useSettings} from '@ui/settings/use-settings';
import {useLogout} from '@common/auth/requests/logout';
import {useTrans} from '@ui/i18n/use-trans';
import {KeyboardArrowLeftIcon} from '@ui/icons/material/KeyboardArrowLeft';
import {createBrowserRouter} from 'react-router';
import {FullPageLoader} from '@ui/progress/full-page-loader';
import React from 'react';

export const userSuspendedRouter = createBrowserRouter([
  {
    path: '*',
    element: <UserSuspendedPage />,
    hydrateFallbackElement: <FullPageLoader screen />,
  },
]);

export function UserSuspendedPage() {
  const {trans} = useTrans();
  const {data} = useUser('me');
  const {
    branding: {logo_light, logo_dark, site_name},
  } = useSettings();
  const isDarkMode = useIsDarkMode();
  const logoSrc = isDarkMode ? logo_light : logo_dark;
  const logout = useLogout();

  return (
    <div className="flex min-h-screen w-screen bg-alt p-24">
      <div className="mx-auto mt-40 max-w-440">
        <Button
          variant="outline"
          onClick={() => logout.mutate()}
          startIcon={<KeyboardArrowLeftIcon />}
          size="xs"
          className="mb-54 mr-auto"
        >
          <Trans message="Logout" />
        </Button>
        {logoSrc && (
          <img
            src={logoSrc}
            alt="Site logo"
            className="mx-auto mb-44 block h-42 w-auto"
          />
        )}
        <div className="text-center">
          <h1 className="mb-24 text-3xl">
            <Trans message="Your account is suspended" />
          </h1>
          <p className="text-base">
            <Trans
              message="You can't open :name because your account is suspended. Contact the Admin to re-activate your account."
              values={{name: site_name}}
            />
          </p>
        </div>
      </div>
    </div>
  );
}
