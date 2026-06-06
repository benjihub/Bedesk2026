import {AttributeSelectorExtraItemsContext} from '@app/attributes/attribute-selector/attribute-selector-extra-items-context';
import {
  AttributeSelectorItem,
  AttributeSelectorItemType,
} from '@app/attributes/attribute-selector/attribute-selector-item';
import {CompactAttribute} from '@app/attributes/compact-attribute';
import {getDefaultValuesForFormWithAttributes} from '@app/attributes/utils/get-default-values-for-form-with-attributes';
import {getOperatorsForAttribute} from '@app/attributes/utils/get-operators-for-attribute';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {
  ALL_STRING_OPERATORS,
  FilterOperator,
} from '@common/datatable/filters/backend-filter';
import {
  CampaignConditionConfig,
  CampaignConditionsConfig,
} from '@livechat/dashboard/campaigns/campaign-editor/campaign-conditions-editor/campaign-conditions-config';
import {useQuery} from '@tanstack/react-query';
import {message} from '@ui/i18n/message';
import {useTrans} from '@ui/i18n/use-trans';
import {use, useCallback, useMemo} from 'react';

const stableArray: CompactAttribute[] = [];
const attributeKeysToExclude = ['description'];

const internalUserAttributes = [
  {
    name: 'signedUp',
    displayName: message('Signed up'),
  },
  {
    name: 'browser',
    displayName: message('Browser'),
  },
  {
    name: 'device',
    displayName: message('Device'),
  },
  {
    name: 'platform',
    displayName: message('Platform'),
  },
] as const;

const internalConversationAttributes = [
  {
    name: 'latestUserMessage',
    displayName: message('Latest user message'),
    operators: ALL_STRING_OPERATORS,
  },
] as const;

const pageVisitAttributes: (keyof typeof CampaignConditionsConfig)[] = [
  'isReturningVisitor',
  'isFirstTimeVisitor',
  'timeOnCurrentPage',
  'timeOnAllPages',
  'currentPageUrl',
  'anyVisitedPageUrl',
  'numberOfViewedPages',
];

export type AttributeSelectorItemConfig = {
  name: string;
  displayName: string;
  type: AttributeSelectorItem['type'];
  key: string;
  attribute?: CompactAttribute;
  defaultValue?: string | number;
  inputConfig?: {
    type: string;
    description?: string;
  };
  // when using as condition, these operators should be used
  operators?: FilterOperator[];
  // can't set value for readonly attribute, only use it for showing existing value or as condition
  isReadonly?: boolean;
};

type Options = {
  showReadonly?: boolean;
  showPageVisitAttributes?: boolean;
};

export function useAttributeSelectorItems({
  showReadonly = false,
  showPageVisitAttributes = false,
}: Options = {}) {
  const {trans} = useTrans();

  const {data} = useQuery(
    helpdeskQueries.attributes.normalizedList({
      for: 'agent',
    }),
  );
  const attributes = data?.attributes ?? stableArray;

  const extraItems = use(AttributeSelectorExtraItemsContext) ?? [];

  const {allItems, filteredItems, groupedItems} = useMemo(() => {
    let allItems: AttributeSelectorItemConfig[] = [];

    // attributes (custom and internal)
    const attributeDefaultValues =
      getDefaultValuesForFormWithAttributes(attributes);
    attributes
      .filter(a => !attributeKeysToExclude.includes(a.key))
      .forEach(attribute => {
        allItems.push({
          name: attribute.key,
          displayName: trans({message: attribute.name}),
          type: attribute.type as AttributeSelectorItemType,
          key: `${attribute.type}.${attribute.key}`,
          attribute: attribute,
          operators: getOperatorsForAttribute(attribute),
          defaultValue: attributeDefaultValues[attribute.key],
        });
      });

    // page visit attributes
    pageVisitAttributes.forEach(key => {
      const condition = CampaignConditionsConfig[
        key
      ] as CampaignConditionConfig;
      allItems.push({
        name: key,
        displayName: trans(condition.label),
        type: AttributeSelectorItemType.PageVisit,
        key: `${AttributeSelectorItemType.PageVisit}.${key}`,
        defaultValue: condition.defaultValue,
        operators: condition.operators,
        inputConfig: condition.inputConfig
          ? {
              type: condition.inputConfig.type,
              description: condition.inputConfig.description
                ? trans(condition.inputConfig.description)
                : undefined,
            }
          : undefined,
        isReadonly: true,
      });
    });

    // internal attributes for flow editor and ai agent
    internalUserAttributes.forEach(item => {
      allItems.push({
        name: item.name,
        displayName: trans(item.displayName),
        type: AttributeSelectorItemType.User,
        key: `${AttributeSelectorItemType.User}.${item.name}`,
        isReadonly: true,
      });
    });
    internalConversationAttributes.forEach(item => {
      allItems.push({
        name: item.name,
        displayName: trans(item.displayName),
        type: AttributeSelectorItemType.Conversation,
        key: `${AttributeSelectorItemType.Conversation}.${item.name}`,
        isReadonly: true,
        operators: 'operators' in item ? item.operators : ALL_STRING_OPERATORS,
      });
    });

    extraItems.forEach(item => {
      if (!allItems.find(i => i.key === item.key)) {
        allItems.push(item);
      }
    });

    // create groups manually so we can ensure order and that groups are always present, event if no items
    const groupedItems = {} as Record<
      AttributeSelectorItemType,
      AttributeSelectorItemConfig[]
    >;
    Object.values(AttributeSelectorItemType).forEach(type => {
      groupedItems[type] = [];
    });

    const filteredItems = allItems.filter(
      item =>
        (showReadonly || !item.isReadonly) &&
        (showPageVisitAttributes ||
          item.type !== AttributeSelectorItemType.PageVisit),
    );

    filteredItems.forEach(item => {
      groupedItems[item.type].push(item);
    });

    return {
      allItems,
      filteredItems,
      groupedItems,
    };
  }, [attributes, extraItems, showReadonly, trans]);

  const getItem = useCallback(
    (item: Omit<AttributeSelectorItem, 'value'>) => {
      if (!item) return null;
      return allItems.find(i => i.name === item.name && i.type === item.type);
    },
    [allItems],
  );

  return {groupedItems, items: filteredItems, getItem};
}
