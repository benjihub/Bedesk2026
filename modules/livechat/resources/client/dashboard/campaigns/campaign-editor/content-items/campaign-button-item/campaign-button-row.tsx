import {CampaignEditorContentRow} from '@livechat/dashboard/campaigns/campaign-editor/content-items/campaign-editor-content-row';
import {CampaignButtonContentItem} from '@livechat/dashboard/campaigns/campaign-editor/content-items/campaign-content-item';
import {CampaignButtonDialog} from '@livechat/dashboard/campaigns/campaign-editor/content-items/campaign-button-item/campaign-button-dialog';
import {Button} from '@ui/buttons/button';
import {Trans} from '@ui/i18n/trans';

interface Props {
  item: CampaignButtonContentItem;
}
export function CampaignButtonRow({item}: Props) {
  return (
    <CampaignEditorContentRow
      item={item}
      editDialog={<CampaignButtonDialog defaultValue={item.value} />}
    >
      <Button
        variant={item.value.variant || undefined}
        color={item.value.color ?? 'primary'}
        size="xs"
      >
        <Trans message={item.value.label ?? 'Text'} />
      </Button>
    </CampaignEditorContentRow>
  );
}
