import {CampaignCondition} from '@livechat/dashboard/campaigns/campaign-editor/campaign-conditions-editor/campaign-condition';
import {CampaignConditionsConfig} from '@livechat/dashboard/campaigns/campaign-editor/campaign-conditions-editor/campaign-conditions-config';
import {
  technologyAndLocaleSelects,
  TechnologyOrLocaleSelect,
  TechnologyOrLocaleSelectType,
} from '@livechat/dashboard/campaigns/campaign-editor/campaign-conditions-editor/technology-or-locale-select';
import {InputSize} from '@ui/forms/input-field/input-size';
import {TextField} from '@ui/forms/input-field/text-field/text-field';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {ReactNode} from 'react';

interface Props {
  name: CampaignCondition['name'];
  value: CampaignCondition['value'];
  className?: string;
  onChange?: (value: CampaignCondition['value']) => void;
  size?: InputSize;
  label?: ReactNode;
}
export function CampaignConditionValueField({
  name,
  value,
  className,
  onChange,
  size,
  label,
}: Props) {
  const {trans} = useTrans();
  const selectedCondition = CampaignConditionsConfig[name];

  if (!('inputConfig' in selectedCondition)) return null;

  const inputType = selectedCondition.inputConfig
    .type as TechnologyOrLocaleSelectType;
  if (technologyAndLocaleSelects.includes(inputType)) {
    return (
      <TechnologyOrLocaleSelect
        type={inputType}
        label={label}
        size={size}
        className={className}
        value={value}
        onChange={value => onChange?.(value)}
      />
    );
  }

  return (
    <TextField
      size={size}
      label={label}
      type={selectedCondition.inputConfig.type ?? 'text'}
      className={className}
      inputClassName="hide-number-input-arrows"
      value={value}
      onChange={e => onChange?.(e.target.value)}
      placeholder={trans(message('Enter value'))}
      endAdornment={
        'description' in selectedCondition.inputConfig && (
          <div className="pr-12 text-xs">
            <Trans {...selectedCondition.inputConfig.description} />
          </div>
        )
      }
    />
  );
}
