import {CampaignEditorContentRow} from '@livechat/dashboard/campaigns/campaign-editor/content-items/campaign-editor-content-row';
import {CampaignMessageInputContentItem} from '@livechat/dashboard/campaigns/campaign-editor/content-items/campaign-content-item';
import {CampaignMessageInputDialog} from '@livechat/dashboard/campaigns/campaign-editor/content-items/campaign-message-input-item/campaign-message-input-dialog';
import {TextField} from '@ui/forms/input-field/text-field/text-field';
import {useTrans} from '@ui/i18n/use-trans';

interface Props {
  item: CampaignMessageInputContentItem;
}
export function CampaignMessageInputRow({item}: Props) {
  const {trans} = useTrans();
  return (
    <CampaignEditorContentRow
      item={item}
      editDialog={<CampaignMessageInputDialog defaultValue={item.value} />}
      pinnedToBottom
      displayName="Message input"
    >
      <TextField
        className="max-w-200"
        placeholder={trans({message: item.value.placeholder || ''})}
        size="xs"
      />
    </CampaignEditorContentRow>
  );
}
