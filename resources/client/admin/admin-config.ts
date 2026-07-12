import {dashboardIcons} from '@app/dashboard/dashboard-icons';
import {SettingsNavItem} from '@common/admin/settings/settings-nav-config';
import {message} from '@ui/i18n/message';
import {FileClockIcon} from '@ui/icons/lucide/file-clock';
import {AltRouteIcon} from '@ui/icons/material/AltRoute';
import {ChromeReaderModeIcon} from '@ui/icons/material/ChromeReaderMode';
import {FileCopyIcon} from '@ui/icons/material/FileCopy';
import {ManageAccountsIcon} from '@ui/icons/material/ManageAccounts';
import {SellIcon} from '@ui/icons/material/Sell';
import {SettingsIcon} from '@ui/icons/material/Settings';
import {TextFieldsIcon} from '@ui/icons/material/TextFields';
import {TranslateIcon} from '@ui/icons/material/Translate';

// icons
export const AdminSidebarIcons = {
  '/admin/settings': SettingsIcon,
  '/admin/settings/livechat': dashboardIcons.chats,
  '/admin/roles': ManageAccountsIcon,
  '/admin/custom-pages': ChromeReaderModeIcon,
  '/admin/tags': SellIcon,
  '/admin/files': FileCopyIcon,
  '/admin/localizations': TranslateIcon,
  '/admin/logs': FileClockIcon,
  '/admin/attributes': TextFieldsIcon,
  '/admin/triggers': AltRouteIcon,
  '/admin/ai-agent': dashboardIcons.aiAgent,
  '/admin/billing': dashboardIcons.billing,
  '/admin/campaigns': dashboardIcons.campaigns,
  '/admin/team': dashboardIcons.team,
  '/admin/views': dashboardIcons.views,
  '/admin/statuses': dashboardIcons.status,
  '/admin/reports/tickets': dashboardIcons.reports,
  '/admin/hc/arrange': dashboardIcons.library,
  '/admin/customers': dashboardIcons.users,
  '/admin/saved-replies': dashboardIcons.saveReplies,
};

// settings nav config
export const AppSettingsNavConfig: SettingsNavItem[] = [
  {label: message('Tickets'), to: 'tickets', position: 2},
  {label: message('AI & Agents'), to: 'ai', position: 4},
  {label: message('Help center'), to: 'hc', position: 5},
  {label: message('Search'), to: 'search', position: 7},
];

// docs urls - removed external links
export const AdminDocsUrls = {
  manualUpdate: '',
  settings: {
    general: '',
    search: '',
    tickets: '',
    liveChat: '',
    ai: '',
    themes: '',
    helpCenter: '',
    menus: '',
    localization: '',
    authentication: '',
    uploading: '',
    incomingEmail: '',
    outgoingEmail: '',
    cache: '',
    queue: '',
    websockets: '',
    logging: '',
    googleAnalytics: '',
    customCode: '',
    captcha: '',
    gdpr: '',
    seo: '',
    s3: '',
    backblaze: '',
    purchaseCode: '',
  },
  pages: {
    triggers: '',
    views: '',
    statuses: '',
    attributes: '',
    helpCenter: '',
    team: '',
    groups: '',
    agentInvites: '',
    customers: '',
    roles: '',
    savedReplies: '',
    translations: '',
    files: '',
    customPages: '',
    logs: '',
    aiAgentSettings: '',
    aiAgentKnowledge: '',
    flows: '',
    tools: '',
  },
};
