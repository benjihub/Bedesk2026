import {useIsModuleInstalledAndSetup} from '@app/use-is-module-installed';
import {ModifyTextWithAiPopup} from '@common/ai/modify-text-with-ai/modify-text-with-ai-popup';
import {useCurrentTextEditor} from '@common/text-editor/tiptap-editor-context';
import {IconButton} from '@ui/buttons/icon-button';
import {Trans} from '@ui/i18n/trans';
import {WandSparklesIcon} from '@ui/icons/lucide/wand-sparkes';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {Tooltip} from '@ui/tooltip/tooltip';

interface Props {
  disabled?: boolean;
}
export function EnhanceTextWithAiButton({disabled}: Props) {
  const isAiSetup = useIsModuleInstalledAndSetup('ai');
  const editor = useCurrentTextEditor();

  if (!isAiSetup) return null;

  return (
    <DialogTrigger
      type="popover"
      mobileType="popover"
      placement="top"
      offset={14}
    >
      <Tooltip label={<Trans message="Enhance text" />}>
        <IconButton size="xs" iconSize="sm" disabled={disabled}>
          <WandSparklesIcon />
        </IconButton>
      </Tooltip>
      <ModifyTextWithAiPopup
        onModify={async handler => {
          if (!editor) return;
          const body = editor.getHTML();
          if (body) {
            return editor.commands.setContent(await handler(body));
          }
        }}
      />
    </DialogTrigger>
  );
}
