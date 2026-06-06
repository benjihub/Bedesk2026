import {useAdminSettings} from '@common/admin/settings/requests/use-admin-settings';
import {SectionHelper} from '@common/ui/other/section-helper';
import {Button} from '@ui/buttons/button';
import {Trans} from '@ui/i18n/trans';
import {ErrorIcon} from '@ui/icons/material/Error';
import {Link, useMatch} from 'react-router';
import {Fragment} from 'react/jsx-runtime';

export function OutoingEmailNotSetupWarning() {
  const match = useMatch('/admin/settings/email/:page');
  const {data} = useAdminSettings();
  const mailSetup = data?.server.mail_setup;
  if (mailSetup) return null;

  const isOutgoingPage = match?.params.page === 'outgoing';

  return (
    <SectionHelper
      color="neutral"
      className="mb-24"
      leadingIcon={<ErrorIcon size="xs" className="text-danger" />}
      title={<Trans message="Outgoing email is not configured" />}
      description={
        <Trans
          message="Please configure outgoing email or app emails will not be sent out properly. <a>Fix now</a>"
          values={{
            a: text =>
              isOutgoingPage ? (
                <Fragment />
              ) : (
                <Button
                  elementType={Link}
                  variant="outline"
                  size="xs"
                  display="flex"
                  className="mt-10 max-w-max"
                  to="/admin/settings/email/outgoing#provider"
                >
                  {text}
                </Button>
              ),
          }}
        />
      }
    />
  );
}
