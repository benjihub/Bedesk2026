import {ConversationCategoryAttribute} from '@app/attributes/compact-attribute';
import {getDefaultValuesForFormWithAttributes} from '@app/attributes/utils/get-default-values-for-form-with-attributes';
import {useSearchTermLogger} from '@app/help-center/search/use-search-term-logger';
import {CreateTicketAsCustomerPayload} from '@app/help-center/tickets-portal/new-ticket-page/create-ticket-as-customer-payload';
import {CustomerNewTicketPageData} from '@app/help-center/tickets-portal/new-ticket-page/customer-new-ticket-page-data';
import {useMemo} from 'react';
import {useForm} from 'react-hook-form';

export function useCustomerNewTicketForm(data: CustomerNewTicketPageData) {
  const form = useForm<CreateTicketAsCustomerPayload>({
    defaultValues: {
      email: !data.customerHasVerifiedEmail ? data.customerEmail : undefined,
      attributes: getDefaultValuesForFormWithAttributes(data.attributes),
      message: {
        body: '',
        attachments: [],
      },
    },
  });

  const attachments = form.watch('message.attachments');

  const searchQuery = form.watch('subject');
  const searchTermLogger = useSearchTermLogger();

  const categoryAttribute = data.attributes.find(
    attribute => attribute.key === 'category',
  ) as ConversationCategoryAttribute | undefined;
  const selectedCategory = form.watch('attributes.category');
  const hcCategoryIds = categoryAttribute?.config?.options?.find(
    o => o.value === selectedCategory,
  )?.hcCategories;

  // sort and filter on frontend instead of backend so that
  // live preview in appearance editor works properly as well
  const attributes = useMemo(
    () =>
      data.config.attributeIds?.map(id =>
        data.attributes.find(attribute => attribute.id === id),
      ) ?? [],
    [data],
  );

  return {
    form,
    attachments,
    searchQuery,
    searchTermLogger,
    hcCategoryIds,
    attributes,
  };
}
