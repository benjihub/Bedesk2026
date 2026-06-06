import {AccountSettingsPanel} from '@common/auth/ui/account-settings/account-settings-panel';
import {AccountSettingsId} from '@common/auth/ui/account-settings/account-settings-sidenav';
import {Trans} from '@ui/i18n/trans';
import {TwoFactorStepper} from '@common/auth/ui/two-factor/stepper/two-factor-auth-stepper';

interface Props {
  user: {
    two_factor_confirmed_at?: string;
    two_factor_recovery_codes?: string[];
  };
}
export function TwoFactorPanel({user}: Props) {
  return (
    <AccountSettingsPanel
      id={AccountSettingsId.TwoFactor}
      title={<Trans message="Two factor authentication" />}
    >
      <div className="max-w-580">
        <TwoFactorStepper user={user} />
      </div>
    </AccountSettingsPanel>
  );
}
