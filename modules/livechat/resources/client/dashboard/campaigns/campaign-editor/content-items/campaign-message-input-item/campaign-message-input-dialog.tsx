import {Trans} from '@ui/i18n/trans';
import {useState} from 'react';
import {TextField} from '@ui/forms/input-field/text-field/text-field';
import {useTrans} from '@ui/i18n/use-trans';
import {message} from '@ui/i18n/message';
import {CampaignMessageInputContentItem} from '@livechat/dashboard/campaigns/campaign-editor/content-items/campaign-content-item';
import {CampaignContentItemDialog} from '@livechat/dashboard/campaigns/campaign-editor/content-items/campaign-content-item-dialog';

interface Props {
  defaultValue?: CampaignMessageInputContentItem['value'];
}
export function CampaignMessageInputDialog({defaultValue}: Props) {
  const {trans} = useTrans();
  const [value, setValue] = useState<CampaignMessageInputContentItem['value']>(
    defaultValue ?? {placeholder: 'Write a message...'},
  );

  return (
    <CampaignContentItemDialog defaultValue={defaultValue} value={value}>
      <Trans message="Message input" />
      <TextField
        required
        placeholder={trans(message('Write a message...'))}
        name="placeholder"
        value={value.placeholder}
        onChange={e => setValue({...value, placeholder: e.target.value})}
        label={<Trans message="Placeholder" />}
      />
    </CampaignContentItemDialog>
  );
}
