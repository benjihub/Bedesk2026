import {UrlBackedTabConfig} from '@common/http/use-url-backed-tabs';
import {message} from '@ui/i18n/message';

export const editGroupPageTabs: UrlBackedTabConfig[] = [
  {uri: 'details', label: message('Details')},
  {uri: 'promotions', label: message('Promotions')},
  {uri: 'settings', label: message('Settings')},
  {uri: 'ai-rules', label: message('AI rules')},
];
