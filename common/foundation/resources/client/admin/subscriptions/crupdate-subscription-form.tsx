import {billingQueries} from '@common/billing/billing-queries';
import {useQuery} from '@tanstack/react-query';
import {Form} from '@ui/forms/form';
import {FormDatePicker} from '@ui/forms/input-field/date/date-picker/date-picker';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {Item} from '@ui/forms/listbox/item';
import {FormSelect} from '@ui/forms/select/select';
import {Trans} from '@ui/i18n/trans';
import {UseFormReturn} from 'react-hook-form';
import {FormattedPrice} from '../../billing/formatted-price';
import {Subscription} from '../../billing/subscription';
import {FormNormalizedModelField} from '../../ui/normalized-model/normalized-model-field';

interface CrupdateSubscriptionForm {
  onSubmit: (values: Partial<Subscription>) => void;
  formId: string;
  form: UseFormReturn<Partial<Subscription>>;
}
export function CrupdateSubscriptionForm({
  form,
  onSubmit,
  formId,
}: CrupdateSubscriptionForm) {
  const query = useQuery(billingQueries.products.index());
  // @ts-ignore
  const watchedProductId = form.watch('product_id');
  const selectedProduct = query.data?.products.find(
    p => p.id === watchedProductId,
  );

  return (
    <Form id={formId} form={form} onSubmit={onSubmit}>
      <FormNormalizedModelField
        name="user_id"
        className="mb-20"
        endpoint="normalized-models/user"
        label={<Trans message="User" />}
      />
      <FormSelect
        name="product_id"
        selectionMode="single"
        className="mb-20"
        label={<Trans message="Plan" />}
      >
        {query.data?.products
          .filter(p => !p.free)
          .map(product => (
            <Item key={product.id} value={product.id}>
              <Trans message={product.name} />
            </Item>
          ))}
      </FormSelect>
      {!selectedProduct?.free && (
        <FormSelect
          name="price_id"
          selectionMode="single"
          className="mb-20"
          label={<Trans message="Price" />}
        >
          {selectedProduct?.prices.map(price => (
            <Item key={price.id} value={price.id}>
              <FormattedPrice price={price} />
            </Item>
          ))}
        </FormSelect>
      )}
      <FormTextField
        inputElementType="textarea"
        rows={3}
        name="description"
        label={<Trans message="Description" />}
        className="mb-20"
      />
      <FormDatePicker
        className="mb-20"
        name="renews_at"
        granularity="day"
        label={<Trans message="Renews at" />}
        description={
          <Trans message="This will only change local records. User will continue to be billed on their original cycle on the payment gateway." />
        }
      />
      <FormDatePicker
        className="mb-20"
        name="ends_at"
        granularity="day"
        label={<Trans message="Ends at" />}
        description={
          <Trans message="This will only change local records. User will continue to be billed on their original cycle on the payment gateway." />
        }
      />
    </Form>
  );
}
