import {DashboardIcon, dashboardIcons} from '@app/dashboard/dashboard-icons';
import {View} from '@app/dashboard/views/view';
import {IconButton} from '@ui/buttons/icon-button';
import {Trans} from '@ui/i18n/trans';
import {EditIcon} from '@ui/icons/material/Edit';
import {Dialog} from '@ui/overlays/dialog/dialog';
import {DialogBody} from '@ui/overlays/dialog/dialog-body';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {DialogHeader} from '@ui/overlays/dialog/dialog-header';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {useFormContext, useWatch} from 'react-hook-form';

export function IconSelector() {
  const {setValue} = useFormContext<View>();
  const iconName = useWatch<View>({
    name: 'icon',
  }) as keyof typeof dashboardIcons;
  const buttonIcon = iconName ? (
    <DashboardIcon name={iconName} />
  ) : (
    <EditIcon />
  );
  return (
    <DialogTrigger
      type="popover"
      onClose={iconName => {
        if (iconName) {
          setValue('icon', iconName, {shouldDirty: true});
        }
      }}
    >
      <IconButton variant="outline" radius="rounded-l-input">
        {buttonIcon}
      </IconButton>
      <IconSelectorDialog />
    </DialogTrigger>
  );
}

function IconSelectorDialog() {
  const {close} = useDialogContext();
  return (
    <Dialog size="sm">
      <DialogHeader>
        <Trans message="Select icon" />
      </DialogHeader>
      <DialogBody padding="px-14 pb-14">
        <div className="grid grid-cols-8 gap-8">
          {Object.entries(dashboardIcons).map(([key, Icon]) => (
            <IconButton key={key} size="md" onClick={() => close(key)}>
              <Icon />
            </IconButton>
          ))}
        </div>
      </DialogBody>
    </Dialog>
  );
}
