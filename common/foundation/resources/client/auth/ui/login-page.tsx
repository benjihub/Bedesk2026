import {Button} from '@ui/buttons/button';
import {LinkStyle} from '@ui/buttons/external-link';
import {Form} from '@ui/forms/form';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {FormCheckbox} from '@ui/forms/toggle/checkbox';
import {Trans} from '@ui/i18n/trans';
import {useSettings} from '@ui/settings/use-settings';
import {ReactNode, useContext} from 'react';
import {useForm} from 'react-hook-form';
import {Link, useLocation, useSearchParams} from 'react-router';
import {
  SiteConfigContext,
  SiteConfigContextValue,
} from '../../core/settings/site-config-context';
import {StaticPageTitle} from '../../seo/static-page-title';
import {LoginPayload, useLogin} from '../requests/use-login';
import {AuthLayout} from './auth-layout/auth-layout';
import {SocialAuthSection} from './social-auth-section';

interface Props {
  onTwoFactorChallenge: () => void;
  bottomMessages?: ReactNode;
}
export function LoginPage({onTwoFactorChallenge, bottomMessages}: Props) {
  const [searchParams] = useSearchParams();
  const {pathname} = useLocation();

  const isWorkspaceLogin = pathname.includes('workspace');
  const searchParamsEmail = searchParams.get('email') || undefined;

  const {branding, registration, site, social} = useSettings();
  const registrationEnabled = !registration?.disable;
  const siteConfig = useContext(SiteConfigContext);

  const demoDefaults =
    site.demo && !searchParamsEmail ? getDemoFormDefaults(siteConfig) : {};
  const form = useForm<LoginPayload>({
    defaultValues: {remember: true, email: searchParamsEmail, ...demoDefaults},
  });
  const login = useLogin(form);

  const heading = isWorkspaceLogin ? (
    <Trans
      values={{siteName: branding?.site_name}}
      message="To join your team on :siteName, login to your account"
    />
  ) : (
    <Trans message="Sign in to your account" />
  );

  const messages = (registrationEnabled || bottomMessages) && (
    <div className="space-y-8">
      {registrationEnabled && (
        <div>
          <Trans
            message="Don't have an account? <a>Sign up.</a>"
            values={{
              a: parts => (
                <Link className={LinkStyle} to="/register">
                  {parts}
                </Link>
              ),
            }}
          />
        </div>
      )}
      {bottomMessages}
    </div>
  );

  const isInvalid = !!Object.keys(form.formState.errors).length;

  return (
    <AuthLayout heading={heading} message={messages}>
      <StaticPageTitle>
        <Trans message="Login" />
      </StaticPageTitle>
      <Form
        form={form}
        onSubmit={payload => {
          login.mutate(payload, {
            onSuccess: response => {
              if (response.two_factor) {
                onTwoFactorChallenge();
              }
            },
          });
        }}
      >
        <FormTextField
          className="mb-32"
          name="email"
          type="email"
          label={<Trans message="Email" />}
          disabled={!!searchParamsEmail}
          invalid={isInvalid}
          errorMessage={
            form.formState.errors.email?.message && (
              <InvalidCredentialsMessage />
            )
          }
          required
        />
        <FormTextField
          className="mb-12"
          name="password"
          type="password"
          label={<Trans message="Password" />}
          invalid={isInvalid}
          labelSuffix={
            <Link className={LinkStyle} to="/forgot-password" tabIndex={-1}>
              <Trans message="Forgot your password?" />
            </Link>
          }
          required
        />
        <FormCheckbox name="remember" className="mb-32 block">
          <Trans message="Stay signed in for a month" />
        </FormCheckbox>
        <Button
          className="block w-full"
          type="submit"
          variant="flat"
          color="primary"
          size="md"
          disabled={login.isPending}
        >
          <Trans message="Continue" />
        </Button>
      </Form>
      <SocialAuthSection
        dividerMessage={
          social?.compact_buttons ? (
            <Trans message="Or sign in with" />
          ) : (
            <Trans message="OR" />
          )
        }
      />
    </AuthLayout>
  );
}

function InvalidCredentialsMessage() {
  return (
    <Trans
      message="These credentials do not match our records. Try again or <a>get a new password</a>."
      values={{
        a: text => (
          <Link
            className="font-semibold underline"
            to="/forgot-password"
            tabIndex={-1}
          >
            {text}
          </Link>
        ),
      }}
    />
  );
}

function getDemoFormDefaults(siteConfig: SiteConfigContextValue) {
  return {
    email: siteConfig.demo?.email ?? 'admin@admin.com',
    password: siteConfig.demo?.password ?? 'admin',
  };
}
