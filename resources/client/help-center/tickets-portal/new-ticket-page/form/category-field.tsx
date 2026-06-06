import {ConversationCategoryAttribute} from '@app/attributes/compact-attribute';
import {helpCenterQueries} from '@app/help-center/help-center-queries';
import {CreateTicketAsCustomerPayload} from '@app/help-center/tickets-portal/new-ticket-page/create-ticket-as-customer-payload';
import {useSuspenseQuery} from '@tanstack/react-query';
import {Item} from '@ui/forms/listbox/item';
import {FormSelect} from '@ui/forms/select/select';
import {Trans} from '@ui/i18n/trans';
import {useWatch} from 'react-hook-form';

interface Props {
  attribute: ConversationCategoryAttribute;
}
export function CategoryField({attribute}: Props) {
  const query = useSuspenseQuery(
    helpCenterQueries.customerConversations.newTicketPageData(),
  );

  const categories = attribute.config?.options
    ? attribute.config.options.filter(option => !option.agentOnly)
    : [];

  const selectedCategory = useWatch<CreateTicketAsCustomerPayload>({
    name: 'attributes.category',
  });
  const optionConfig = categories.find(
    option => option.value === selectedCategory,
  );
  const supportExpired = optionConfig?.envatoItems?.some(
    itemId =>
      query.data?.envatoItems?.find(item => item.id === itemId)
        ?.support_expired,
  );

  return (
    <FormSelect
      required
      name="attributes.category"
      selectionMode="single"
      className="mb-24"
      label={<Trans message={attribute.name} />}
      errorMessage={
        supportExpired && (
          <Trans
            message="Your support for this item has expired. <a>Click here to renew</a>"
            values={{
              a: content => (
                <a
                  href="https://codecanyon.net/downloads"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold underline"
                >
                  {content}
                </a>
              ),
            }}
          />
        )
      }
    >
      {categories.map(category => (
        <Item key={category.value} value={category.value}>
          {category.label}
        </Item>
      ))}
    </FormSelect>
  );
}
