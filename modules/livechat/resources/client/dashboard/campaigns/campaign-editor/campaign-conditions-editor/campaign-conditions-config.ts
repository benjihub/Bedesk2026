import {FilterOperator} from '@common/datatable/filters/backend-filter';
import {message} from '@ui/i18n/message';
import {MessageDescriptor} from '@ui/i18n/message-descriptor';

export interface CampaignConditionConfig {
  label: MessageDescriptor;
  operators?: FilterOperator[];
  defaultValue?: string | number;
  defaultOperator?: FilterOperator;
  inputConfig?: {
    type:
      | 'number'
      | 'text'
      | 'hidden'
      | 'country'
      | 'browser'
      | 'platform'
      | 'device';
    description?: MessageDescriptor;
  };
}

export const CampaignConditionsConfig = {
  isReturningVisitor: {
    label: message('Is returning visitor'),
    defaultValue: 'true',
  },
  isFirstTimeVisitor: {
    label: message('Is first-time visitor'),
    defaultValue: 'true',
  },
  timeOnCurrentPage: {
    label: message('Time on current page'),
    defaultValue: 5,
    defaultOperator: FilterOperator.gt,
    operators: [FilterOperator.eq, FilterOperator.gt, FilterOperator.lt],
    inputConfig: {
      type: 'number',
      description: message('Seconds'),
    },
  },
  timeOnAllPages: {
    label: message('Time on all pages'),
    defaultValue: 30,
    defaultOperator: FilterOperator.gt,
    operators: [FilterOperator.eq, FilterOperator.gt, FilterOperator.lt],
    inputConfig: {
      type: 'number',
      description: message('Seconds'),
    },
  },
  currentPageUrl: {
    label: message('Current page URL'),
    defaultValue: '',
    operators: [
      FilterOperator.eq,
      FilterOperator.ne,
      FilterOperator.startsWith,
      FilterOperator.endsWith,
      FilterOperator.contains,
      FilterOperator.notContains,
    ],
    inputConfig: {
      type: 'text',
    },
  },
  anyVisitedPageUrl: {
    label: message('Any visited page URL'),
    defaultValue: '',
    operators: [
      FilterOperator.eq,
      FilterOperator.ne,
      FilterOperator.startsWith,
      FilterOperator.endsWith,
      FilterOperator.contains,
      FilterOperator.notContains,
    ],
    inputConfig: {
      type: 'text',
    },
  },
  neverInteractedWithWidget: {
    label: message('Never interacted with widget'),
    defaultValue: '',
  },
  numberOfViewedPages: {
    label: message('Number of viewed pages'),
    defaultValue: 3,
    defaultOperator: FilterOperator.gt,
    operators: [FilterOperator.eq, FilterOperator.gt, FilterOperator.lt],
    inputConfig: {
      type: 'number',
    },
  },
  signedUp: {
    label: message('Days since user signed up'),
    defaultValue: 3,
    defaultOperator: FilterOperator.gt,
    operators: [FilterOperator.eq, FilterOperator.gt, FilterOperator.lt],
    inputConfig: {
      type: 'number',
    },
  },
  userCountry: {
    label: message('User country'),
    defaultValue: 'us',
    operators: [FilterOperator.eq, FilterOperator.ne],
    inputConfig: {
      type: 'country',
    },
  },
  userBrowser: {
    label: message('User browser'),
    defaultValue: 'chrome',
    operators: [FilterOperator.eq, FilterOperator.ne],
    inputConfig: {
      type: 'browser',
    },
  },
  userPlatform: {
    label: message('User platform'),
    defaultValue: 'os x',
    operators: [FilterOperator.eq, FilterOperator.ne],
    inputConfig: {
      type: 'platform',
    },
  },
  userDevice: {
    label: message('User device'),
    defaultValue: 'desktop',
    operators: [FilterOperator.eq, FilterOperator.ne],
    inputConfig: {
      type: 'device',
    },
  },
  attribute: {
    label: message('Custom attribute'),
  },
} as const satisfies Record<string, CampaignConditionConfig>;

export type CampaignConditionName = keyof typeof CampaignConditionsConfig;
