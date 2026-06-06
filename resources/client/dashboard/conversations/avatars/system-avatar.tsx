import {useWidgetLogoSrc} from '@livechat/widget/hooks/use-widget-logo-src';
import {Avatar, AvatarProps} from '@ui/avatar/avatar';
import {useSettings} from '@ui/settings/use-settings';

interface Props {
  size: AvatarProps['size'];
}
export function SystemAvatar({size}: Props) {
  const {branding} = useSettings();
  const logoSrc = useWidgetLogoSrc();
  return (
    <Avatar
      src={logoSrc || branding?.logo_light_mobile}
      label={branding?.site_name ?? 'Support'}
      fallback="initials"
      circle={false}
      size={size}
    />
  );
}
