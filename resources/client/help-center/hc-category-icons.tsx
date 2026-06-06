import {dashboardIcons} from '@app/dashboard/dashboard-icons';
import {BookOpenIcon} from '@ui/icons/lucide/book-open';
import {FileClockIcon} from '@ui/icons/lucide/file-clock';
import {AltRouteIcon} from '@ui/icons/material/AltRoute';
import {AppsIcon} from '@ui/icons/material/Apps';
import {ArticleIcon} from '@ui/icons/material/Article';
import {ChromeReaderModeIcon} from '@ui/icons/material/ChromeReaderMode';
import {DnsIcon} from '@ui/icons/material/Dns';
import {EmailIcon} from '@ui/icons/material/Email';
import {EventIcon} from '@ui/icons/material/Event';
import {FileCopyIcon} from '@ui/icons/material/FileCopy';
import {FileUploadIcon} from '@ui/icons/material/FileUpload';
import {InfoIcon} from '@ui/icons/material/Info';
import {LanguageIcon} from '@ui/icons/material/Language';
import {ManageAccountsIcon} from '@ui/icons/material/ManageAccounts';
import {ScheduleIcon} from '@ui/icons/material/Schedule';
import {SearchIcon} from '@ui/icons/material/Search';
import {SettingsIcon} from '@ui/icons/material/Settings';
import {SupportAgentIcon} from '@ui/icons/material/SupportAgent';
import {TextFieldsIcon} from '@ui/icons/material/TextFields';
import {TranslateIcon} from '@ui/icons/material/Translate';
import {TuneIcon} from '@ui/icons/material/Tune';
import {SvgIconProps} from '@ui/icons/svg-icon';
import clsx from 'clsx';

export const hcCategoryIcons = {
  ...dashboardIcons,
  settings: SettingsIcon,
  bookOpen: BookOpenIcon,
  accounts: ManageAccountsIcon,
  email: EmailIcon,
  apps: AppsIcon,
  reader: ChromeReaderModeIcon,
  fileUpload: FileUploadIcon,
  fileCopy: FileCopyIcon,
  translate: TranslateIcon,
  dns: DnsIcon,
  tune: TuneIcon,
  fileClock: FileClockIcon,
  textFields: TextFieldsIcon,
  altRoute: AltRouteIcon,
  support: SupportAgentIcon,
  search: SearchIcon,
  info: InfoIcon,
  schedule: ScheduleIcon,
  language: LanguageIcon,
  event: EventIcon,
  article: ArticleIcon,
} satisfies Record<string, React.ComponentType<SvgIconProps>>;

export type HcCategoryIconName = keyof typeof hcCategoryIcons;

interface Props {
  src: HcCategoryIconName | string;
  iconSize?: string;
  className?: string;
  radius?: string;
}
export function HcCategoryImage({
  src,
  iconSize,
  className,
  radius = 'rounded-panel',
}: Props) {
  if (!src) return null;
  const Icon = hcCategoryIcons[src as HcCategoryIconName];
  return (
    <div
      className={clsx(
        'flex flex-shrink-0 items-center justify-center overflow-hidden',
        className,
        radius,
      )}
    >
      {Icon ? (
        <Icon size={iconSize} />
      ) : (
        <img className={clsx('object-cover', iconSize)} src={src} alt="" />
      )}
    </div>
  );
}
