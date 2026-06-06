import {message} from '@ui/i18n/message';
import {UrlBackedTabConfig} from '@common/http/use-url-backed-tabs';

export const editAgentPageTabs: UrlBackedTabConfig[] = [
  {uri: 'details', label: message('Details')},
  {uri: 'permissions', label: message('Roles & permissions')},
  {uri: 'conversations', label: message('Conversations')},
  {uri: 'security', label: message('Security')},
  {uri: 'date', label: message('Date & time')},
  {uri: 'api', label: message('API')},
];
