import {Trans} from '@ui/i18n/trans';
import {useState} from 'react';
import {TextField} from '@ui/forms/input-field/text-field/text-field';
import {CampaignEmbedContentItem} from '@livechat/dashboard/campaigns/campaign-editor/content-items/campaign-content-item';
import {CampaignContentItemDialog} from '@livechat/dashboard/campaigns/campaign-editor/content-items/campaign-content-item-dialog';

interface Props {
  defaultValue?: CampaignEmbedContentItem['value'];
}
export function CampaignEmbedDialog({defaultValue}: Props) {
  const [value, setValue] = useState<CampaignEmbedContentItem['value']>(
    defaultValue ?? {url: '', width: 0, height: 0},
  );

  return (
    <CampaignContentItemDialog defaultValue={defaultValue} value={value}>
      <Trans message="Embed" />
      <TextField
        required
        autoFocus
        type="url"
        value={value.url}
        onChange={e => setValue({...value, url: e.target.value})}
        label={<Trans message="Embed URL" />}
      />
    </CampaignContentItemDialog>
  );
}
