import {AdminSettings} from '@common/admin/settings/admin-settings';
import {useSocialLogin} from '@common/auth/requests/use-social-login';
import {Button} from '@ui/buttons/button';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {toast} from '@ui/toast/toast';
import {Fragment} from 'react';
import {useFormContext} from 'react-hook-form';
import {GmailIcon} from './gmail-icon';

export function ConnectGmailPanel() {
  const {watch, setValue} = useFormContext<AdminSettings>();
  const {connectSocial} = useSocialLogin();
  const connectedEmail = watch('server.connectedGmailAccount');

  const handleGmailConnect = async () => {
    const e = await connectSocial('secure/settings/mail/gmail/connect');
    if (e?.status === 'SUCCESS') {
      const email = (e.callbackData as any).profile.email;
      setValue('server.connectedGmailAccount', email);
      toast(message('Connected gmail account: :email', {values: {email}}));
    }
  };

  const connectButton = (
    <Button
      variant="outline"
      color="primary"
      startIcon={<GmailIcon />}
      onClick={() => handleGmailConnect()}
    >
      <Trans message="Connect gmail account" />
    </Button>
  );

  const reconnectPanel = (
    <div className="flex items-center gap-14 rounded border bg-alt px-14 py-6 text-sm">
      <GmailIcon size="lg" />
      {connectedEmail}
      <Button
        variant="text"
        color="primary"
        className="ml-auto"
        onClick={() => handleGmailConnect()}
      >
        <Trans message="Reconnect" />
      </Button>
    </div>
  );

  return (
    <Fragment>
      <div className="mb-6 text-sm">
        <Trans message="Gmail account" />
      </div>
      {connectedEmail ? reconnectPanel : connectButton}
    </Fragment>
  );
}
