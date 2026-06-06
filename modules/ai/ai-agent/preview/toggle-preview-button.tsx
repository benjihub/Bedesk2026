import {useIsModuleInstalled} from '@app/use-is-module-installed';
import {Button} from '@ui/buttons/button';
import {Trans} from '@ui/i18n/trans';
import {ChatbotIcon} from '@ui/icons/lucide/chatbot-icon';
import {useIsMobileMediaQuery} from '@ui/utils/hooks/is-mobile-media-query';

export function TogglePreviewButton({
  previewIsVisible,
  onTogglePreview,
}: {
  previewIsVisible: boolean;
  onTogglePreview: () => void;
}) {
  const isMobile = useIsMobileMediaQuery();
  const isLivechatInstalled = useIsModuleInstalled('livechat');

  if (!isLivechatInstalled) {
    return null;
  }

  return (
    <Button
      startIcon={<ChatbotIcon />}
      size="xs"
      variant="outline"
      color={previewIsVisible ? 'primary' : undefined}
      onClick={() => {
        onTogglePreview();
      }}
    >
      {isMobile ? <Trans message="Test" /> : <Trans message="Test AI Agent" />}
    </Button>
  );
}
