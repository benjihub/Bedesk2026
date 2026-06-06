import {Button} from '@ui/buttons/button';
import {Trans} from '@ui/i18n/trans';
import {IllustratedMessage} from '@ui/images/illustrated-message';
import {SvgImage} from '@ui/images/svg-image';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {useSettings} from '@ui/settings/use-settings';
import {Link} from 'react-router';
import notifySvg from './notify.svg';

interface NotificationEmptyStateMessageProps {
  settingsLink?: string | null;
}
export function NotificationEmptyStateMessage({
  settingsLink,
}: NotificationEmptyStateMessageProps) {
  const {notif} = useSettings();
  const dialogCtx = useDialogContext();
  return (
    <IllustratedMessage
      size="sm"
      image={<SvgImage src={notifySvg} />}
      title={<Trans message="Hang tight!" />}
      description={
        <Trans message="Notifications will start showing up here soon." />
      }
      action={
        notif.subs.integrated && (
          <Button
            elementType={Link}
            variant="outline"
            to={settingsLink || '/notifications/settings'}
            size="xs"
            color="primary"
            onClick={() => {
              dialogCtx?.close();
            }}
          >
            <Trans message="Notification settings" />
          </Button>
        )
      }
    />
  );
}
