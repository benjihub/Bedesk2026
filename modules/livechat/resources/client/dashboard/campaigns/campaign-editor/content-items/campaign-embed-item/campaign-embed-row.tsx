import {CampaignEditorContentRow} from '@livechat/dashboard/campaigns/campaign-editor/content-items/campaign-editor-content-row';
import {CampaignEmbedContentItem} from '@livechat/dashboard/campaigns/campaign-editor/content-items/campaign-content-item';
import {CampaignEmbedDialog} from '@livechat/dashboard/campaigns/campaign-editor/content-items/campaign-embed-item/campaign-embed-dialog';

interface Props {
  item: CampaignEmbedContentItem;
}
export function CampaignEmbedRow({item}: Props) {
  return (
    <CampaignEditorContentRow
      item={item}
      editDialog={<CampaignEmbedDialog defaultValue={item.value} />}
    >
      {item.value.url ? (
        <a href={item.value.url} target="_blank" className="hover:underline">
          {new URL(item.value.url).hostname}
        </a>
      ) : null}
    </CampaignEditorContentRow>
  );
}
