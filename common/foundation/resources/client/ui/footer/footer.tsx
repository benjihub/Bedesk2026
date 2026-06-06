import {LocaleSwitcher} from '@common/locale-switcher/locale-switcher';
import {Button} from '@ui/buttons/button';
import {Trans} from '@ui/i18n/trans';
import {DarkModeIcon} from '@ui/icons/material/DarkMode';
import {LightbulbIcon} from '@ui/icons/material/Lightbulb';
import {FacebookIcon} from '@ui/icons/social/facebook';
import {InstagramIcon} from '@ui/icons/social/instagram';
import {TwitterIcon} from '@ui/icons/social/twitter';
import {YoutubeIcon} from '@ui/icons/social/youtube';
import {useSettings} from '@ui/settings/use-settings';
import {useThemeSelector} from '@ui/themes/theme-selector-context';
import clsx from 'clsx';
import {CustomMenu, CustomMenuItem} from '../../menus/custom-menu';

interface Props {
  className?: string;
  padding?: string;
}

export function Footer({className, padding}: Props) {
  const year = new Date().getFullYear();
  const {branding} = useSettings();
  return (
    <footer
      className={clsx(
        'text-sm',
        padding ? padding : 'pb-28 pt-54 md:pb-54',
        className,
      )}
    >
      <Menus />
      <div className="items-center justify-between gap-30 text-center text-muted md:flex md:text-left">
        <Trans
          message="Copyright © :year :name, All Rights Reserved"
          values={{year, name: branding.site_name}}
        />
        <div>
          <ThemeSwitcher />
          <LocaleSwitcher />
        </div>
      </div>
    </footer>
  );
}

function Menus() {
  const settings = useSettings();
  const primaryMenu = settings.menus.find(m => m.positions?.includes('footer'));
  const secondaryMenu = settings.menus.find(m =>
    m.positions?.includes('footer-secondary'),
  );

  if (!primaryMenu && !secondaryMenu) return null;

  return (
    <div className="mb-14 items-center justify-between gap-30 overflow-x-auto border-b pb-14 md:flex">
      {primaryMenu && (
        <CustomMenu menu={primaryMenu} className="text-primary" />
      )}
      {secondaryMenu && (
        <CustomMenu menu={secondaryMenu} className="mb:mt-0 mt-14 text-muted">
          {(item, props) => {
            const icon =
              typeof item.icon === 'string' ? (
                <SocialIcon icon={item.icon} />
              ) : null;
            return (
              <CustomMenuItem
                key={item.id}
                {...props}
                item={item}
                icon={icon}
              />
            );
          }}
        </CustomMenu>
      )}
    </div>
  );
}

interface SocialIconProps {
  icon: string;
}
function SocialIcon({icon}: SocialIconProps) {
  switch (icon) {
    case 'facebook':
      return <FacebookIcon size="sm" />;
    case 'twitter':
      return <TwitterIcon size="sm" />;
    case 'instagram':
      return <InstagramIcon size="sm" />;
    case 'youtube':
      return <YoutubeIcon />;
    default:
      return null;
  }
}

function ThemeSwitcher() {
  const {themes} = useSettings();
  const {selectedTheme, selectTheme} = useThemeSelector();
  if (!selectedTheme || !themes?.user_change) return null;

  return (
    <Button
      variant="text"
      startIcon={selectedTheme.is_dark ? <DarkModeIcon /> : <LightbulbIcon />}
      onClick={() => {
        if (selectedTheme.is_dark) {
          selectTheme('light');
        } else {
          selectTheme('dark');
        }
      }}
    >
      {selectedTheme.is_dark ? (
        <Trans message="Light mode" />
      ) : (
        <Trans message="Dark mode" />
      )}
    </Button>
  );
}
