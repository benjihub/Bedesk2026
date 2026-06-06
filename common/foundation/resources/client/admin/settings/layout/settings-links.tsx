import {Button} from '@ui/buttons/button';
import {ButtonSize} from '@ui/buttons/button-size';
import {ExternalLink, LinkStyle} from '@ui/buttons/external-link';
import {IconButton} from '@ui/buttons/icon-button';
import {Trans} from '@ui/i18n/trans';
import {BookOpenIcon} from '@ui/icons/lucide/book-open';
import {SettingsIcon} from '@ui/icons/material/Settings';
import {SvgIconProps} from '@ui/icons/svg-icon';
import {useSettings} from '@ui/settings/use-settings';
import clsx from 'clsx';
import {cloneElement, ReactElement, ReactNode} from 'react';
import {Link} from 'react-router';

interface LearnMoreLinkProps {
  link: string;
  className?: string;
  children?: ReactNode;
  target?: string;
  variant?: 'link' | 'button';
  buttonVariant?: 'text' | 'icon';
  size?: ButtonSize;
  icon?: ReactElement<SvgIconProps>;
}
export function DocsLink({
  link,
  className,
  children,
  target = '_blank',
  variant = 'link',
  buttonVariant = 'text',
  size = 'sm',
  icon,
}: LearnMoreLinkProps) {
  const {site} = useSettings();
  if (site.hide_docs_button) {
    return null;
  }

  if (variant === 'button') {
    if (buttonVariant === 'icon') {
      return (
        <IconButton
          variant="outline"
          size={size}
          href={link}
          target={target as any}
        >
          <BookOpenIcon />
        </IconButton>
      );
    }
    return (
      <Button
        variant="outline"
        size={size}
        href={link}
        target={target as any}
        startIcon={<BookOpenIcon />}
      >
        {children ?? <Trans message="Learn more" />}
      </Button>
    );
  }

  return (
    <div className={clsx('flex items-center gap-8', className)}>
      {icon ? (
        cloneElement(icon, {size: 'sm', className: 'text-link'})
      ) : (
        <BookOpenIcon size="sm" className="text-link" />
      )}
      <ExternalLink href={link} target={target}>
        {children ?? <Trans message="Learn more" />}
      </ExternalLink>
    </div>
  );
}

export function ConfigureLink({
  link,
  className,
  children,
  target,
}: LearnMoreLinkProps) {
  return (
    <div className={clsx('flex items-center gap-8', className)}>
      <SettingsIcon size="sm" className="text-link" />
      <Link to={link} className={LinkStyle} target={target}>
        {children ?? <Trans message="Configure" />}
      </Link>
    </div>
  );
}
