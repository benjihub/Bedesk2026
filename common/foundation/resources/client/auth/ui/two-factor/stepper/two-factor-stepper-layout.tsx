import {Fragment, ReactNode} from 'react';
import {Trans} from '@ui/i18n/trans';

interface Props {
  title: ReactNode;
  subtitle?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}
export function TwoFactorStepperLayout({
  title,
  subtitle,
  description,
  actions,
  children,
}: Props) {
  if (!subtitle) {
    subtitle = (
      <Trans message="When two factor authentication is enabled, you will be prompted for a secure, random token during authentication. You may retrieve this token from your phone's Google Authenticator application." />
    );
  }
  return (
    <Fragment>
      <div className="mb-16 text-base font-medium">{title}</div>
      <div className="mb-24 text-sm">{subtitle}</div>
      <p className="my-16 text-sm font-medium">{description}</p>
      {children}
      <div className="flex items-center gap-12">{actions}</div>
    </Fragment>
  );
}
