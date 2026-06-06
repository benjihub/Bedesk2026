import {Component as BaseCaptchaSettings} from '@common/admin/settings/pages/base-captcha-settings';
import {FormSwitch} from '@ui/forms/toggle/switch';
import {Trans} from '@ui/i18n/trans';

export function Component() {
  return (
    <BaseCaptchaSettings actions={['new_ticket']}>
      <FormSwitch
        className="mb-20"
        name="client.captcha.enable.new_ticket"
        description={
          <Trans message="Enable captcha integration on new ticket page when user is not logged in." />
        }
      >
        <Trans message="New ticket" />
      </FormSwitch>
    </BaseCaptchaSettings>
  );
}
