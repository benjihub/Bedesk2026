import {useCampaignEditorStore} from '@livechat/dashboard/campaigns/campaign-editor/campaign-editor-store';
import {CampaignAgentDialog} from '@livechat/dashboard/campaigns/campaign-editor/content-items/campaign-agent-item/campaign-agent-dialog';
import {CampaignAgentRow} from '@livechat/dashboard/campaigns/campaign-editor/content-items/campaign-agent-item/campaign-agent-row';
import {CampaignButtonDialog} from '@livechat/dashboard/campaigns/campaign-editor/content-items/campaign-button-item/campaign-button-dialog';
import {CampaignButtonRow} from '@livechat/dashboard/campaigns/campaign-editor/content-items/campaign-button-item/campaign-button-row';
import {CampaignContentItem} from '@livechat/dashboard/campaigns/campaign-editor/content-items/campaign-content-item';
import {CampaignEmbedDialog} from '@livechat/dashboard/campaigns/campaign-editor/content-items/campaign-embed-item/campaign-embed-dialog';
import {CampaignEmbedRow} from '@livechat/dashboard/campaigns/campaign-editor/content-items/campaign-embed-item/campaign-embed-row';
import {CampaignImageDialog} from '@livechat/dashboard/campaigns/campaign-editor/content-items/campaign-image-item/campaign-image-dialog';
import {CampaignImageRow} from '@livechat/dashboard/campaigns/campaign-editor/content-items/campaign-image-item/campaign-image-row';
import {CampaignMessageInputDialog} from '@livechat/dashboard/campaigns/campaign-editor/content-items/campaign-message-input-item/campaign-message-input-dialog';
import {CampaignMessageInputRow} from '@livechat/dashboard/campaigns/campaign-editor/content-items/campaign-message-input-item/campaign-message-input-row';
import {CampaignTextDialog} from '@livechat/dashboard/campaigns/campaign-editor/content-items/campaign-text-item/campaign-text-dialog';
import {CampaignTextRow} from '@livechat/dashboard/campaigns/campaign-editor/content-items/campaign-text-item/campaign-text-row';
import {sortPinnedCampaignItems} from '@livechat/dashboard/campaigns/campaign-editor/content-items/sort-pinned-campaign-items';
import campaignSvg from '@livechat/dashboard/campaigns/campaign-index-page/email-campaign.svg';
import {Button} from '@ui/buttons/button';
import {ButtonSize} from '@ui/buttons/button-size';
import {Item} from '@ui/forms/listbox/item';
import {Trans} from '@ui/i18n/trans';
import {AddIcon} from '@ui/icons/material/Add';
import {ImageIcon} from '@ui/icons/material/Image';
import {InputIcon} from '@ui/icons/material/Input';
import {MouseIcon} from '@ui/icons/material/Mouse';
import {SupportAgentIcon} from '@ui/icons/material/SupportAgent';
import {TextFieldsIcon} from '@ui/icons/material/TextFields';
import {VideoLibraryIcon} from '@ui/icons/material/VideoLibrary';
import {IllustratedMessage} from '@ui/images/illustrated-message';
import {SvgImage} from '@ui/images/svg-image';
import {Menu, MenuTrigger} from '@ui/menu/menu-trigger';
import {openDialog} from '@ui/overlays/store/dialog-store';
import {nanoid} from 'nanoid';
import {ComponentType, ReactElement, useMemo} from 'react';

const Dialogs: Record<CampaignContentItem['name'], ComponentType> = {
  text: CampaignTextDialog,
  image: CampaignImageDialog,
  embed: CampaignEmbedDialog,
  button: CampaignButtonDialog,
  messageInput: CampaignMessageInputDialog,
  agent: CampaignAgentDialog,
};

export function CampaignContentEditor() {
  const originalContent = useCampaignEditorStore(s => s.content);
  const sortedContent = useMemo(() => {
    return sortPinnedCampaignItems(originalContent);
  }, [originalContent]);

  const noContentMessage = (
    <IllustratedMessage
      className="mt-84"
      title={<Trans message="This campaign has no content yet" />}
      description={<AddContentButton size="xs" className="mt-12" />}
      image={<SvgImage src={campaignSvg} />}
    />
  );

  return (
    <div className="min-w-0 flex-auto">
      <AddContentButton />
      <div className="mt-20">
        {sortedContent.map(item => (
          <ContentItem key={item.id} item={item} />
        ))}
        {sortedContent.length === 0 && noContentMessage}
      </div>
    </div>
  );
}

interface ContentItemProps {
  item: CampaignContentItem;
}
function ContentItem({item}: ContentItemProps): ReactElement {
  switch (item.name) {
    case 'text':
      return <CampaignTextRow item={item} />;
    case 'image':
      return <CampaignImageRow item={item} />;
    case 'button':
      return <CampaignButtonRow item={item} />;
    case 'messageInput':
      return <CampaignMessageInputRow item={item} />;
    case 'agent':
      return <CampaignAgentRow item={item} />;
    case 'embed':
      return <CampaignEmbedRow item={item} />;
  }
}

interface AddContentButtonProps {
  size?: ButtonSize;
  className?: string;
}
function AddContentButton({size = 'xs', className}: AddContentButtonProps) {
  const originalContent = useCampaignEditorStore(s => s.content);
  const setContent = useCampaignEditorStore(s => s.setContent);
  return (
    <MenuTrigger
      onItemSelected={async name => {
        const contentName = name as CampaignContentItem['name'];
        const value = await openDialog(Dialogs[contentName]);
        if (value != null) {
          setContent([
            ...originalContent,
            {id: nanoid(6), name: contentName, value},
          ]);
        }
      }}
    >
      <Button
        variant="flat"
        color="primary"
        size={size}
        startIcon={<AddIcon />}
        className={className}
      >
        <Trans message="Add content" />
      </Button>
      <Menu>
        <Item value="image" startIcon={<ImageIcon />}>
          <Trans message="Image" />
        </Item>
        <Item value="text" startIcon={<TextFieldsIcon />}>
          <Trans message="Text" />
        </Item>
        <Item value="button" startIcon={<MouseIcon />}>
          <Trans message="Button" />
        </Item>
        <Item value="agent" startIcon={<SupportAgentIcon />}>
          <Trans message="Agent name" />
        </Item>
        <Item value="messageInput" startIcon={<InputIcon />}>
          <Trans message="Message input" />
        </Item>
        <Item value="embed" startIcon={<VideoLibraryIcon />}>
          <Trans message="Embed" />
        </Item>
      </Menu>
    </MenuTrigger>
  );
}
