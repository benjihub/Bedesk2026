import {makeDatatableFiltersFromAttributes} from '@app/attributes/rendering/make-datatable-filters-from-attributes';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {
  statusCategory,
  statusCategoryNames,
} from '@app/dashboard/statuses/status-category';
import {
  ALL_NUMBER_OPERATORS,
  BackendFilter,
  FilterControlType,
  FilterNumberInputControl,
  FilterOperator,
} from '@common/datatable/filters/backend-filter';
import {
  createdAtFilter,
  timestampFilter,
  updatedAtFilter,
} from '@common/datatable/filters/timestamp-filters';
import {queryClient} from '@common/http/query-client';
import {
  prefetchNormalizedModels,
  useNormalizedModels,
} from '@common/ui/normalized-model/use-normalized-models';
import {useQuery} from '@tanstack/react-query';
import {message} from '@ui/i18n/message';
import {MessageDescriptor} from '@ui/i18n/message-descriptor';
import {USER_MODEL} from '@ui/types/user';
import {getCountryList} from '@ui/utils/intl/countries';
import {useMemo} from 'react';

const hoursSinceFilter = ({
  key,
  label,
}: {
  key: string;
  label: MessageDescriptor;
}): BackendFilter<FilterNumberInputControl> => {
  return {
    key,
    label,
    defaultOperator: FilterOperator.lt,
    operators: [FilterOperator.gt, FilterOperator.lt],
    control: {
      type: FilterControlType.Input,
      inputType: 'number',
      placeholder: message('Hours'),
      defaultValue: 1,
      minValue: 1,
    },
  };
};

export function useConversationsTableFilterValues() {
  const tagQuery = useNormalizedModels('helpdesk/normalized-models/tags');
  const agentQuery = useQuery(helpdeskQueries.agents.normalizedList);
  const groupQuery = useQuery(helpdeskQueries.groups.normalizedList);
  const attributesQuery = useQuery(
    helpdeskQueries.attributes.normalizedList({
      type: 'conversation',
      for: 'agent',
    }),
  );

  const tags = tagQuery.data?.results;
  const agents = agentQuery.data?.agents;
  const groups = groupQuery.data?.groups;
  const countries = getCountryList();
  const attributes = attributesQuery.data?.attributes;

  if (!tags || !countries || !attributes || !agents || !groups) {
    return null;
  }

  return {
    tags,
    agents,
    groups,
    countries,
    attributes,
  };
}

export function prefetchConversationsTableFilterValues() {
  return Promise.all([
    prefetchNormalizedModels('helpdesk/normalized-models/tags'),
    queryClient.ensureQueryData(helpdeskQueries.agents.normalizedList),
    queryClient.ensureQueryData(helpdeskQueries.groups.normalizedList),
    queryClient.ensureQueryData(
      helpdeskQueries.attributes.normalizedList({
        type: 'conversation',
        for: 'agent',
      }),
    ),
  ]);
}

export function useConversationListFilters(): BackendFilter[] {
  const filterLists = useConversationsTableFilterValues();

  return useMemo(() => {
    if (!filterLists) return [];

    const defaultFilters: BackendFilter[] = [
      {
        key: 'status_category',
        label: message('Status'),
        operators: ALL_NUMBER_OPERATORS,
        defaultOperator: FilterOperator.eq,
        control: {
          type: FilterControlType.Select,
          defaultValue: statusCategory.open,
          options: Object.entries(statusCategory).map(([key, value]) => ({
            key: value,
            label:
              statusCategoryNames[key as keyof typeof statusCategory].message,
            value,
          })),
        },
      },
      {
        key: 'type',
        label: message('Type'),
        defaultOperator: FilterOperator.eq,
        control: {
          type: FilterControlType.Select,
          defaultValue: '01',
          options: [
            {
              key: 'ticket',
              label: message('Ticket'),
              value: 'ticket',
            },
            {
              key: 'chat',
              label: message('Chat'),
              value: 'pending',
            },
          ],
        },
      },
      {
        key: 'channel',
        label: message('Channel'),
        defaultOperator: FilterOperator.eq,
        control: {
          type: FilterControlType.Select,
          defaultValue: '01',
          options: [
            {
              key: 'email',
              label: message('Email'),
              value: 'email',
            },
            {
              key: 'widget',
              label: message('Widget'),
              value: 'widget',
            },
            {
              key: 'website',
              label: message('Website'),
              value: 'website',
            },
          ],
        },
      },
      hoursSinceFilter({
        key: 'created_at_hours',
        label: message('Hours since created'),
      }),
      hoursSinceFilter({
        key: 'updated_at_hours',
        label: message('Hours since updated'),
      }),
      hoursSinceFilter({
        key: 'closed_at_hours',
        label: message('Hours since closed'),
      }),
      createdAtFilter(),
      updatedAtFilter(),
      timestampFilter({
        key: 'closed_at',
        label: message('Closed at'),
      }),
      {
        key: 'tags',
        label: message('Tags'),
        defaultOperator: FilterOperator.has,
        control: {
          type: FilterControlType.ChipField,
          autocompleteEndpoint: 'helpdesk/normalized-models/tags',
          placeholder: message('Find tag'),
          defaultValue: [],
        },
      },
      {
        key: 'assignee_id',
        label: message('Assignee'),
        defaultOperator: FilterOperator.eq,
        control: {
          type: FilterControlType.Select,
          showSearchField: true,
          placeholder: message('Select agent'),
          showAvatar: true,
          options: [
            {
              key: 'currentUser',
              label: message('(Current user)'),
              value: 'currentUser',
            },
            {
              key: 'null',
              label: message('(Unassigned)'),
              value: 'null',
            },
            ...filterLists.agents.map(agent => ({
              key: agent.id,
              label: agent.name,
              value: agent.id,
              image: agent.image,
              description: agent.description,
            })),
          ],
        },
      },
      {
        key: 'group_id',
        label: message('Group'),
        defaultOperator: FilterOperator.eq,
        control: {
          type: FilterControlType.Select,
          placeholder: message('Select group'),
          showAvatar: true,
          options: filterLists.groups.map(group => ({
            key: group.id,
            label: group.name,
            value: group.id,
          })),
        },
      },
      {
        key: 'user_id',
        label: message('Customer'),
        defaultOperator: FilterOperator.eq,
        control: {
          type: FilterControlType.SelectModel,
          model: USER_MODEL,
        },
      },
      {
        key: 'country',
        label: message("Customer's country"),
        defaultOperator: FilterOperator.eq,
        control: {
          type: FilterControlType.Select,
          showSearchField: true,
          searchPlaceholder: message('Search for country'),
          defaultValue: 'us',
          options: filterLists.countries.map(country => ({
            key: country.code,
            label: message(country.name),
            value: country.code,
          })),
        },
      },
      {
        key: 'needs_human_support',
        label: message('Needs human support'),
        defaultOperator: FilterOperator.eq,
        control: {
          type: FilterControlType.BooleanToggle,
          defaultValue: true,
        },
      },
    ];

    const defaultKeys = defaultFilters.map(f => f.key);

    // if we are hardcoding an internal filter above, exclude it
    // from fields so there are no duplicate filters for same key
    return [
      ...defaultFilters,
      ...makeDatatableFiltersFromAttributes(
        filterLists.attributes.filter(f => !defaultKeys.includes(f.key)),
      ),
    ];
  }, [filterLists]);
}
