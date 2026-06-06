import {CampaignEditorContentRow} from '@livechat/dashboard/campaigns/campaign-editor/content-items/campaign-editor-content-row';
import {CampaignTextContentItem} from '@livechat/dashboard/campaigns/campaign-editor/content-items/campaign-content-item';
import {CampaignTextDialog} from '@livechat/dashboard/campaigns/campaign-editor/content-items/campaign-text-item/campaign-text-dialog';
import {useMemo} from 'react';

interface Props {
  item: CampaignTextContentItem;
}
export function CampaignTextRow({item}: Props) {
  const textWithTagsStripped = useMemo(() => {
    return item.value.text.replace(/<[^>]*>?/gm, '');
  }, [item.value.text]);

  return (
    <CampaignEditorContentRow
      item={item}
      editDialog={<CampaignTextDialog defaultValue={item.value} />}
    >
      <div className="overflow-hidden text-ellipsis whitespace-nowrap text-sm">
        {textWithTagsStripped}
      </div>
    </CampaignEditorContentRow>
  );
}
