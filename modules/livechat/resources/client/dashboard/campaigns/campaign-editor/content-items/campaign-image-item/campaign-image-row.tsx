import {CampaignEditorContentRow} from '@livechat/dashboard/campaigns/campaign-editor/content-items/campaign-editor-content-row';
import {CampaignImageContentItem} from '@livechat/dashboard/campaigns/campaign-editor/content-items/campaign-content-item';
import {CampaignImageDialog} from '@livechat/dashboard/campaigns/campaign-editor/content-items/campaign-image-item/campaign-image-dialog';

interface Props {
  item: CampaignImageContentItem;
}
export function CampaignImageRow({item}: Props) {
  return (
    <CampaignEditorContentRow
      item={item}
      editDialog={<CampaignImageDialog defaultValue={item.value} />}
    >
      <img
        src={item.value.url}
        alt=""
        className="h-32 overflow-hidden rounded-panel"
      />
    </CampaignEditorContentRow>
  );
}
