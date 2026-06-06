import {UpdateUserPayload} from '@common/admin/users/requests/user-update-user';
import {UpdateUserForm} from '@common/admin/users/update-user-page/update-user-form';
import {UpdateUserPageUser} from '@common/admin/users/update-user-page/update-user-page-user';
import {UserRoleSection} from '@common/admin/users/update-user-page/user-role-section';
import {useResendVerificationEmail} from '@common/auth/requests/use-resend-verification-email';
import {Button} from '@ui/buttons/button';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {FormSwitch} from '@ui/forms/toggle/switch';
import {Trans} from '@ui/i18n/trans';
import {useSettings} from '@ui/settings/use-settings';
import {useForm} from 'react-hook-form';
import {useOutletContext} from 'react-router';

export function Component() {
  const user = useOutletContext() as UpdateUserPageUser;
  const form = useForm<UpdateUserPayload>({
    defaultValues: {
      name: user.name ?? '',
      roles: user.roles,
      email_verified_at: !!user.email_verified_at,
    },
  });

  return (
    <UpdateUserForm form={form}>
      <FormTextField
        name="name"
        label={<Trans message="Name" />}
        className="mb-24"
      />
      <EmailConfirmSection user={user} />
      <UserRoleSection />
    </UpdateUserForm>
  );
}

interface EmailConfirmSectionProps {
  user: UpdateUserPageUser;
}
function EmailConfirmSection({user}: EmailConfirmSectionProps) {
  const resendConfirmationEmail = useResendVerificationEmail();
  const {require_email_confirmation} = useSettings();
  return (
    <div className="mb-44">
      <FormSwitch
        className="mb-30"
        disabled={!require_email_confirmation}
        name="email_verified_at"
        description={
          <Trans message="Whether email address has been confirmed. User will not be able to login until address is confirmed, unless confirmation is disabled from settings page." />
        }
      >
        <Trans message="Email confirmed" />
      </FormSwitch>
      <Button
        size="xs"
        variant="outline"
        color="primary"
        disabled={
          !require_email_confirmation ||
          resendConfirmationEmail.isPending ||
          !!user.email_verified_at
        }
        onClick={() => {
          resendConfirmationEmail.mutate({email: user.email});
        }}
      >
        <Trans message="Resend email" />
      </Button>
    </div>
  );
}
