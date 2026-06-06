import {GuestRoute} from '@common/auth/guards/guest-route';
import {CaptchaContainer} from '@common/captcha/captcha-container';
import {Button} from '@ui/buttons/button';
import {LinkStyle} from '@ui/buttons/external-link';
import {Form} from '@ui/forms/form';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {FormCheckbox} from '@ui/forms/toggle/checkbox';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {useSettings} from '@ui/settings/use-settings';
import {toast} from '@ui/toast/toast';
import {ReactNode} from 'react';
import {useForm} from 'react-hook-form';
import {Link, Navigate, useLocation, useSearchParams} from 'react-router';
import {useCaptcha} from '../../captcha/use-captcha';
import {CustomMenuItem} from '../../menus/custom-menu';
import {StaticPageTitle} from '../../seo/static-page-title';
import {RegisterPayload, useRegister} from '../requests/use-register';
import {AuthLayout} from './auth-layout/auth-layout';
import {SocialAuthSection} from './social-auth-section';

interface Props {
  inviteType?: string;
  fields?: ReactNode;
}
export function RegisterPage({inviteType, fields}: Props) {
  const {branding, registration, social} = useSettings();
  const {captchaToken, captchaEnabled, resetCaptcha} = useCaptcha('register');

  const {pathname} = useLocation();
  const [searchParams] = useSearchParams();

  const isRegisteringUsingInvite =
    pathname.includes('workspace') || !!inviteType;
  const isBillingRegister = searchParams.get('redirectFrom') === 'pricing';
  const searchParamsEmail = searchParams.get('email') || undefined;

  const form = useForm<RegisterPayload>({
    defaultValues: {email: searchParamsEmail},
  });
  const register = useRegister(form);

  if (registration?.disable && !isRegisteringUsingInvite) {
    return <Navigate to="/login" replace />;
  }

  let heading = <Trans message="Create a new account" />;
  if (isRegisteringUsingInvite) {
    heading = (
      <Trans
        values={{siteName: branding?.site_name}}
        message="To join your team on :siteName, create an account"
      />
    );
  } else if (isBillingRegister) {
    heading = <Trans message="First, let's create your account" />;
  }

  const footerMessage = (
    <Trans
      values={{
        a: parts => (
          <Link className={LinkStyle} to="/login">
            {parts}
          </Link>
        ),
      }}
      message="Already have an account? <a>Sign in.</a>"
    />
  );

  return (
    <GuestRoute>
      <AuthLayout heading={heading} message={footerMessage}>
        <StaticPageTitle>
          <Trans message="Register" />
        </StaticPageTitle>
        <Form
          form={form}
          onSubmit={async payload => {
            if (captchaEnabled && !captchaToken) {
              toast.danger(message('Please solve the captcha challenge.'));
              return;
            }
            register.mutate(
              {
                ...payload,
                captcha_token: captchaToken,
                invite_type: inviteType,
              },
              {onError: () => resetCaptcha()},
            );
          }}
        >
          <FormTextField
            className="mb-32"
            name="email"
            type="email"
            disabled={!!searchParamsEmail}
            label={<Trans message="Email" />}
            required
          />
          <FormTextField
            className="mb-32"
            name="password"
            type="password"
            label={<Trans message="Password" />}
            required
          />
          <FormTextField
            className="mb-32"
            name="password_confirmation"
            type="password"
            label={<Trans message="Confirm password" />}
            required
          />
          {fields}
          {captchaEnabled && <CaptchaContainer className="mb-32" />}
          <PolicyCheckboxes />
          <Button
            className="block w-full"
            type="submit"
            variant="flat"
            color="primary"
            size="md"
            disabled={register.isPending}
          >
            <Trans message="Create account" />
          </Button>
          <SocialAuthSection
            isUsingInvite={isRegisteringUsingInvite}
            dividerMessage={
              social?.compact_buttons ? (
                <Trans message="Or sign up with" />
              ) : (
                <Trans message="OR" />
              )
            }
          />
        </Form>
      </AuthLayout>
    </GuestRoute>
  );
}

function PolicyCheckboxes() {
  const {registration} = useSettings();

  if (!registration?.policies) return null;

  return (
    <div className="mb-32">
      {registration.policies.map(policy => (
        <FormCheckbox
          key={policy.id}
          name={policy.id}
          className="mb-4 block"
          required
        >
          <Trans
            message="I accept the :name"
            values={{
              name: (
                <CustomMenuItem
                  unstyled
                  className={() => LinkStyle}
                  item={policy}
                />
              ),
            }}
          />
        </FormCheckbox>
      ))}
    </div>
  );
}
