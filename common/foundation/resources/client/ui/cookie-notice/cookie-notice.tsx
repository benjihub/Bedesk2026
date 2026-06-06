import {getBootstrapData} from '@ui/bootstrap-data/bootstrap-data-store';
import {Button} from '@ui/buttons/button';
import {Trans} from '@ui/i18n/trans';
import {useSettings} from '@ui/settings/use-settings';
import {useCookie} from '@ui/utils/hooks/use-cookie';
import clsx from 'clsx';
import {useState} from 'react';
import {CustomMenuItem} from '../../menus/custom-menu';

export function CookieNotice() {
  const {cookie_notice} = useSettings();

  const [, setCookie] = useCookie('cookie_notice');

  const [alreadyAccepted, setAlreadyAccepted] = useState(() => {
    return !getBootstrapData().show_cookie_notice;
  });

  if (!cookie_notice?.enable || alreadyAccepted) {
    return null;
  }

  return (
    <div
      className={clsx(
        'fixed z-50 flex w-full justify-center gap-14 bg-toast p-14 text-sm text-white shadow max-md:flex-col md:items-center md:gap-30',
        cookie_notice?.position == 'top' ? 'top-0' : 'bottom-0',
      )}
    >
      <Trans
        message="We use cookies to optimize site functionality and provide you with the
      best possible experience."
      />
      <InfoLink />
      <Button
        variant="flat"
        color="primary"
        size="xs"
        className="max-w-100"
        onClick={() => {
          setCookie('true', {days: 30, path: '/'});
          setAlreadyAccepted(true);
        }}
      >
        <Trans message="OK" />
      </Button>
    </div>
  );
}

function InfoLink() {
  const {cookie_notice} = useSettings();

  if (!cookie_notice?.button?.label) {
    return null;
  }

  return (
    <CustomMenuItem
      className={() => 'text-primary-light hover:underline'}
      item={cookie_notice?.button}
    />
  );
}
