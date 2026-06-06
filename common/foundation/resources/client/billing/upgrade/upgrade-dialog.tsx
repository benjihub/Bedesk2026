import {ReactNode} from 'react';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {Dialog} from '@ui/overlays/dialog/dialog';
import {DialogHeader} from '@ui/overlays/dialog/dialog-header';
import {Trans} from '@ui/i18n/trans';
import {DialogBody} from '@ui/overlays/dialog/dialog-body';
import {SvgImage} from '@ui/images/svg-image';
import upgradeSvg from '@common/billing/upgrade/upgrade.svg';
import {DialogFooter} from '@ui/overlays/dialog/dialog-footer';
import {Button} from '@ui/buttons/button';
import {Link} from 'react-router';

interface UpgradeDialogProps {
  message?: ReactNode;
  messageSuffix?: ReactNode;
}
export function UpgradeDialog({message, messageSuffix}: UpgradeDialogProps) {
  const {close} = useDialogContext();

  return (
    <Dialog size="sm">
      <DialogHeader>
        <Trans message="Join the PROs" />
      </DialogHeader>
      <DialogBody>
        <div className="mb-20 text-center">
          <SvgImage src={upgradeSvg} className="mx-auto" height="h-100" />
        </div>
        <div>
          {message} {messageSuffix}
        </div>
      </DialogBody>
      <DialogFooter>
        <Button
          variant="text"
          size="xs"
          onClick={() => {
            close();
          }}
        >
          <Trans message="Maybe later" />
        </Button>
        <Button
          autoFocus
          variant="flat"
          size="xs"
          color="primary"
          elementType={Link}
          to="/pricing"
          target="_blank"
          onClick={() => close()}
        >
          <Trans message="Find out more" />
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
