import {CampaignContentItem} from '@livechat/dashboard/campaigns/campaign-editor/content-items/campaign-content-item';

export function sortPinnedCampaignItems(
  original: CampaignContentItem[],
): CampaignContentItem[] {
  const content: CampaignContentItem[] = [];
  const pinnedToBottom: CampaignContentItem[] = [];
  const pinnedToTop: CampaignContentItem[] = [];
  original.forEach(item => {
    if (item.name === 'messageInput') {
      pinnedToBottom.push(item);
    } else {
      content.push(item);
    }
  });
  return [...pinnedToTop, ...content, ...pinnedToBottom];
}
