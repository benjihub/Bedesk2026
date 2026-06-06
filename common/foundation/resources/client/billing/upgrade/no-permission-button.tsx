import {FeatureLockedDialog} from '@common/billing/upgrade/feature-locked-dialog';
import {Button} from '@ui/buttons/button';
import {IconButton} from '@ui/buttons/icon-button';
import {Trans} from '@ui/i18n/trans';
import {LockIcon} from '@ui/icons/material/Lock';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {useSettings} from '@ui/settings/use-settings';
import {Tooltip} from '@ui/tooltip/tooltip';
import clsx from 'clsx';
import {ReactNode} from 'react';

interface UpgradeButtonProps {
  message?: ReactNode;
  className?: string;
  iconButton?: boolean;
}
export function NoPermissionButton({
  message,
  className,
  iconButton,
}: UpgradeButtonProps) {
  const {billing} = useSettings();

  if (!billing.enable) {
    return <GenericButton className={className} />;
  }

  return (
    <DialogTrigger type="popover" triggerOnHover>
      {iconButton ? (
        <IconButton className={className} color="primary" size="sm">
          <LockIcon />
        </IconButton>
      ) : (
        <Button
          variant="flat"
          color="primary"
          size="2xs"
          startIcon={<LockIcon />}
          className={className}
        >
          <Trans message="Upgrade" />
        </Button>
      )}
      <FeatureLockedDialog message={message} />
    </DialogTrigger>
  );
}

interface GenericButtonProps {
  className?: string;
}
function GenericButton({className}: GenericButtonProps) {
  return (
    <Tooltip
      label={
        <Trans message="You don't have permissions to access this feature." />
      }
    >
      <LockIcon size="sm" className={clsx('text-muted', className)} />
    </Tooltip>
  );
}
