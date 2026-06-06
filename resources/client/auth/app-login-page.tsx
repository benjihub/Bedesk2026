import {LoginPageWrapper} from '@common/auth/ui/login-page-wrapper';
import {LinkStyle} from '@ui/buttons/external-link';
import {Trans} from '@ui/i18n/trans';
import {useSettings} from '@ui/settings/use-settings';
import {Link} from 'react-router';

export function Component() {
  const {tickets} = useSettings();
  const guestTickets = tickets?.create_from_emails || tickets?.guest_tickets;
  return (
    <LoginPageWrapper
      bottomMessages={
        guestTickets && (
          <div>
            <Trans
              message="Emailed us for support? <a>Get a password.</a>"
              values={{
                a: parts => (
                  <Link className={LinkStyle} to="/forgot-password">
                    {parts}
                  </Link>
                ),
              }}
            />
          </div>
        )
      }
    />
  );
}
