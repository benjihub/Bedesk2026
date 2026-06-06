import {ButtonBase} from '@ui/buttons/button-base';
import {Trans} from '@ui/i18n/trans';
import {useFilter} from '@ui/i18n/use-filter';
import {elementToTree, IconTree} from '@ui/icons/create-svg-icon';
import * as Icons from '@ui/icons/material/all-icons';
import {AmazonIcon} from '@ui/icons/social/amazon';
import {AppleIcon} from '@ui/icons/social/apple';
import {BandcampIcon} from '@ui/icons/social/bandcamp';
import {EnvatoIcon} from '@ui/icons/social/envato';
import {FacebookIcon} from '@ui/icons/social/facebook';
import {InstagramIcon} from '@ui/icons/social/instagram';
import {LinkedinIcon} from '@ui/icons/social/linkedin';
import {PatreonIcon} from '@ui/icons/social/patreon';
import {PinterestIcon} from '@ui/icons/social/pinterest';
import {SnapchatIcon} from '@ui/icons/social/snapchat';
import {SoundcloudIcon} from '@ui/icons/social/soundcloud';
import {SpotifyIcon} from '@ui/icons/social/spotify';
import {TelegramIcon} from '@ui/icons/social/telegram';
import {TiktokIcon} from '@ui/icons/social/tiktok';
import {TwitchIcon} from '@ui/icons/social/twitch';
import {TwitterIcon} from '@ui/icons/social/twitter';
import {WhatsappIcon} from '@ui/icons/social/whatsapp';
import {YoutubeIcon} from '@ui/icons/social/youtube';
import {SvgIconProps} from '@ui/icons/svg-icon';
import clsx from 'clsx';
import {ComponentType, Fragment} from 'react';
import {iconGridStyle} from './icon-grid-style';

const socialIcons: [string, ComponentType<SvgIconProps>][] = [
  ['amazon', AmazonIcon],
  ['apple', AppleIcon],
  ['bandcamp', BandcampIcon],
  ['envato', EnvatoIcon],
  ['facebook', FacebookIcon],
  ['instagram', InstagramIcon],
  ['linkedin', LinkedinIcon],
  ['patreon', PatreonIcon],
  ['pinterest', PinterestIcon],
  ['snapchat', SnapchatIcon],
  ['soundcloud', SoundcloudIcon],
  ['spotify', SpotifyIcon],
  ['telegram', TelegramIcon],
  ['tiktok', TiktokIcon],
  ['twitch', TwitchIcon],
  ['twitter', TwitterIcon],
  ['whatsapp', WhatsappIcon],
  ['youtube', YoutubeIcon],
];
const entries = Object.entries(Icons)
  .map(([name, cmp]) => {
    const prettyName = name
      .replace('Icon', '')
      .replace(/[A-Z]/g, letter => ` ${letter.toLowerCase()}`);
    return [prettyName, cmp] as [string, ComponentType<SvgIconProps>];
  })
  .concat(socialIcons);

interface IconListProps {
  onIconSelected: (icon: IconTree[] | null) => void;
  searchQuery: string;
}
export default function IconList({onIconSelected, searchQuery}: IconListProps) {
  const {contains} = useFilter({
    sensitivity: 'base',
  });
  const matchedEntries = entries.filter(([name]) =>
    contains(name, searchQuery),
  );

  return (
    <Fragment>
      <ButtonBase
        className={clsx(iconGridStyle.button, 'diagonal-lines')}
        onClick={e => {
          onIconSelected(null);
        }}
      >
        <Trans message="None" />
      </ButtonBase>
      {matchedEntries.map(([name, Icon]) => (
        <ButtonBase
          key={name}
          className={iconGridStyle.button}
          onClick={e => {
            const svgTree = elementToTree(
              e.currentTarget.querySelector('svg') as SVGElement,
            );
            // only emit svg children, and not svg tag itself
            onIconSelected(svgTree.child as IconTree[]);
          }}
        >
          <Icon className="block text-muted icon-lg" />
          <span className="mt-16 block whitespace-normal text-xs capitalize">
            {name}
          </span>
        </ButtonBase>
      ))}
    </Fragment>
  );
}
