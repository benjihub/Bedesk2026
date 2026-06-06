import {CustomerSession} from '@app/dashboard/conversation';
import {
  DetailsList,
  DetailsListItem,
} from '@app/dashboard/conversations/conversation-page/details-sidebar/details-list';
import {Trans} from '@ui/i18n/trans';
import {useSettings} from '@ui/settings/use-settings';

interface Props {
  session: CustomerSession;
}
export function TechnologyPanel({session}: Props) {
  return (
    <DetailsList>
      <DetailsListItem label={<Trans message="IP address" />}>
        {session.ip_address}
      </DetailsListItem>
      {!!session.platform && (
        <DetailsListItem label={<Trans message="Platform" />}>
          <PlatformIcon platformName={session.platform} />{' '}
          <span className="capitalize">
            <Trans message={session.platform} />
          </span>
        </DetailsListItem>
      )}
      {!!session.browser && (
        <DetailsListItem label={<Trans message="Browser" />}>
          <BrowserIcon browserName={session.browser} />{' '}
          <span className="capitalize">
            <Trans message={session.browser} />
          </span>
        </DetailsListItem>
      )}
      {!!session.device && (
        <DetailsListItem label={<Trans message="Device" />}>
          <span className="capitalize">
            <Trans message={session.device} />
          </span>
        </DetailsListItem>
      )}
    </DetailsList>
  );
}

const browsers = ['chrome', 'firefox', 'safari', 'edge', 'brave', 'opera'];
interface BrowserIconProps {
  browserName: string;
}
export function BrowserIcon({browserName}: BrowserIconProps) {
  const {base_url} = useSettings();
  const normalizedName = browsers.find(b =>
    browserName.toLowerCase().includes(b.toLowerCase()),
  );
  if (normalizedName) {
    return (
      <img
        src={`${base_url}/images/browsers/${normalizedName}.svg`}
        alt={browserName}
        className="inline-block h-12 w-12 align-middle"
      />
    );
  }
}

const platforms = ['windows', 'osx', 'linux', 'android', 'ios'];
interface PlatformIconProps {
  platformName: string;
}
export function PlatformIcon({platformName}: PlatformIconProps) {
  const {base_url} = useSettings();
  const normalizedName = platforms.find(p => {
    return platformName
      .toLowerCase()
      .replace(' ', '')
      .includes(p.replace(' ', '').toLowerCase());
  });
  if (normalizedName) {
    return (
      <img
        src={`${base_url}/images/platforms/${normalizedName}.png`}
        alt={platformName}
        className="mb-2 inline-block h-12 w-12 align-middle"
      />
    );
  }
}
