import {Radio} from '@ui/forms/radio-group/radio';
import {RadioGroup, RadioGroupProps} from '@ui/forms/radio-group/radio-group';
import {Trans} from '@ui/i18n/trans';
import {Product} from '../product';
import {UpsellBillingCycle} from './find-best-price';
import {UpsellLabel} from './upsell-label';

interface BillingCycleRadioProps
  extends Omit<RadioGroupProps, 'children' | 'onChange'> {
  selectedCycle: UpsellBillingCycle;
  onChange: (value: UpsellBillingCycle) => void;
  products?: Product[];
}
export function BillingCycleRadio({
  selectedCycle,
  onChange,
  products,
  ...radioGroupProps
}: BillingCycleRadioProps) {
  return (
    <RadioGroup
      {...radioGroupProps}
      value={selectedCycle}
      onChange={value => onChange(value as UpsellBillingCycle)}
    >
      <Radio value="yearly">
        <Trans message="Annual" />
        <UpsellLabel products={products} />
      </Radio>
      <Radio value="monthly">
        <Trans message="Monthly" />
      </Radio>
    </RadioGroup>
  );
}
