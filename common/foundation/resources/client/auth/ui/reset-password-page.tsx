import {GuestRoute} from '@common/auth/guards/guest-route';
import {Button} from '@ui/buttons/button';
import {LinkStyle} from '@ui/buttons/external-link';
import {Form} from '@ui/forms/form';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {Trans} from '@ui/i18n/trans';
import {useForm} from 'react-hook-form';
import {Link, useParams} from 'react-router';
import {StaticPageTitle} from '../../seo/static-page-title';
import {
  ResetPasswordPayload,
  useResetPassword,
} from '../requests/reset-password';
import {AuthLayout} from './auth-layout/auth-layout';

export function Component() {
  const {token} = useParams();
  const form = useForm<ResetPasswordPayload>({defaultValues: {token}});
  const resetPassword = useResetPassword(form);

  const heading = <Trans message="Reset your account password" />;

  const message = (
    <Trans
      values={{
        a: parts => (
          <Link className={LinkStyle} to="/register">
            {parts}
          </Link>
        ),
      }}
      message="Don't have an account? <a>Sign up.</a>"
    />
  );

  return (
    <GuestRoute>
      <AuthLayout heading={heading} message={message}>
        <StaticPageTitle>
          <Trans message="Reset Password" />
        </StaticPageTitle>
        <Form
          form={form}
          onSubmit={payload => {
            resetPassword.mutate(payload);
          }}
        >
          <FormTextField
            className="mb-32"
            name="email"
            type="email"
            label={<Trans message="Email" />}
            required
          />
          <FormTextField
            className="mb-32"
            name="password"
            type="password"
            label={<Trans message="New password" />}
            required
          />
          <FormTextField
            className="mb-32"
            name="password_confirmation"
            type="password"
            label={<Trans message="Confirm password" />}
            required
          />
          <Button
            className="block w-full"
            type="submit"
            variant="flat"
            color="primary"
            size="md"
            disabled={resetPassword.isPending}
          >
            <Trans message="Reset password" />
          </Button>
        </Form>
      </AuthLayout>
    </GuestRoute>
  );
}
