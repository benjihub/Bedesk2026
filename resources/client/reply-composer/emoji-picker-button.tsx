import {useCurrentTextEditor} from '@common/text-editor/tiptap-editor-context';
import {IconButton, IconButtonProps} from '@ui/buttons/icon-button';
import {Trans} from '@ui/i18n/trans';
import {SmileIcon} from '@ui/icons/lucide/smile-icon';
import {Dialog} from '@ui/overlays/dialog/dialog';
import {DialogBody} from '@ui/overlays/dialog/dialog-body';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {
  DialogTrigger,
  DialogTriggerProps,
} from '@ui/overlays/dialog/dialog-trigger';
import {Tooltip} from '@ui/tooltip/tooltip';
import {Fragment} from 'react';

type ReplyComposerEmojiPickerButtonProps = {
  size?: IconButtonProps['size'];
} & Partial<DialogTriggerProps>;
export function ReplyComposerEmojiPickerButton({
  size = 'xs',
  ...props
}: ReplyComposerEmojiPickerButtonProps) {
  const editor = useCurrentTextEditor();
  return (
    <EmojiPickerButton
      onSelected={emoji => editor?.commands.insertContent(emoji)}
      size={size}
      iconSize="sm"
      {...props}
    />
  );
}

type Props = Partial<DialogTriggerProps> & {
  onSelected: (emoji: string) => void;
  className?: string;
  size?: IconButtonProps['size'];
  iconSize?: IconButtonProps['iconSize'];
};
export function EmojiPickerButton({
  onSelected,
  className,
  size,
  iconSize,
  ...triggerProps
}: Props) {
  return (
    <Fragment>
      <DialogTrigger
        type="popover"
        mobileType="popover"
        placement="top"
        offset={14}
        {...triggerProps}
      >
        <Tooltip label={<Trans message="Emoji" />}>
          <IconButton size={size} className={className} iconSize={iconSize}>
            <SmileIcon />
          </IconButton>
        </Tooltip>
        <EmojiDialog onSelected={emoji => onSelected(emoji)} />
      </DialogTrigger>
    </Fragment>
  );
}

const emojiList = [
  '🙂',
  '😁',
  '😐',
  '😂',
  '😍',
  '🤔',
  '😒',
  '😭',
  '😢',
  '😎',
  '🎉',
  '👍',
  '❤️',
  '👌',
  '🙏',
];

interface EmojiDialogProps {
  onSelected: (emoji: string) => void;
}
function EmojiDialog({onSelected}: EmojiDialogProps) {
  const {close} = useDialogContext();
  return (
    <Dialog size="w-auto">
      <DialogBody padding="p-10">
        <div className="grid grid-cols-5">
          {emojiList.map(emoji => (
            <IconButton
              key={emoji}
              onClick={() => {
                onSelected(emoji);
                close();
              }}
            >
              <span className="text-xl">{emoji}</span>
            </IconButton>
          ))}
        </div>
      </DialogBody>
    </Dialog>
  );
}
