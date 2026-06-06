import {Trans} from '@ui/i18n/trans';
import {MessageDescriptor} from '@ui/i18n/message-descriptor';
import {useTrans} from '@ui/i18n/use-trans';
import {UpgradeDialog} from '@common/billing/upgrade/upgrade-dialog';

interface FeatureLockedDialogProps {
  resourceName: MessageDescriptor;
}
export function OverQuotaDialog({resourceName}: FeatureLockedDialogProps) {
  const {trans} = useTrans();
  return (
    <UpgradeDialog
      message={
        <Trans
          message="You've reached the maximum number of :resource allowed for your current plan."
          values={{resource: trans(resourceName)}}
        />
      }
      messageSuffix={
        <Trans message="Upgrade to increase this limit and unlock other features." />
      }
    />
  );
}
