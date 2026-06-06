import {Campaign} from '@livechat/dashboard/campaigns/campaign';
import {useCampaignEditorStore} from '@livechat/dashboard/campaigns/campaign-editor/campaign-editor-store';
import {sortPinnedCampaignItems} from '@livechat/dashboard/campaigns/campaign-editor/content-items/sort-pinned-campaign-items';
import {CampaignRenderer} from '@livechat/widget/campaigns/renderers/campaign-renderer';
import {Chip} from '@ui/forms/input-field/chip-field/chip';
import {Trans} from '@ui/i18n/trans';
import {useMemo} from 'react';

export function CampaignEditorPreviewSidebar() {
  return (
    <div className="sticky top-0 mr-auto hidden flex-shrink-0 lg:block">
      <Chip
        size="sm"
        color="positive"
        radius="rounded"
        className="m-auto mb-24 w-max"
      >
        <Trans message="Live preview" />
      </Chip>
      <CampaignEditorRenderer />
    </div>
  );
}

export function CampaignEditorRenderer() {
  const size = useCampaignEditorStore(s => s.appearance.size);
  const appearance = useCampaignEditorStore(s => s.appearance);
  const originalContent = useCampaignEditorStore(s => s.content);
  const sortedContent = useMemo(() => {
    return sortPinnedCampaignItems(originalContent);
  }, [originalContent]);
  return (
    <div className={getWidth(size)}>
      <CampaignRenderer campaign={{content: sortedContent, appearance}} />
    </div>
  );
}

function getWidth(size: Campaign['appearance']['size']) {
  switch (size) {
    case 'sm':
      return 'w-240';
    case 'md':
      return 'w-[300px]';
    case 'lg':
      return 'w-375';
    default:
      return 'w-240';
  }
}
