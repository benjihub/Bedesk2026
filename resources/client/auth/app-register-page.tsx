import {RegisterPage} from '@common/auth/ui/register-page';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {Trans} from '@ui/i18n/trans';
import {useSettings} from '@ui/settings/use-settings';
import {useLocation} from 'react-router';

export function Component() {
  const {envato} = useSettings();
  const {pathname} = useLocation();
  const isAgentRoute = pathname.includes('agents/join');
  const showEnvatoField =
    envato?.enable && envato?.require_purchase_code && !isAgentRoute;
  return (
    <RegisterPage
      inviteType={isAgentRoute ? 'agentInvite' : undefined}
      fields={
        showEnvatoField && (
          <FormTextField
            className="mb-32"
            name="envato_purchase_code"
            label={<Trans message="Envato purchase code" />}
            required
          />
        )
      }
    />
  );
}
