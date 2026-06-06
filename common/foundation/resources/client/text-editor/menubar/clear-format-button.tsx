import {IconButton} from '@ui/buttons/icon-button';
import {Trans} from '@ui/i18n/trans';
import {FormatClearIcon} from '@ui/icons/material/FormatClear';
import {Tooltip} from '@ui/tooltip/tooltip';
import clsx from 'clsx';
import {useCurrentTextEditor} from '../tiptap-editor-context';
import {MenubarButtonProps} from './menubar-button-props';

export function ClearFormatButton({size}: MenubarButtonProps) {
  const editor = useCurrentTextEditor();
  return (
    <Tooltip label={<Trans message="Clear formatting" />}>
      <IconButton
        disabled={!editor}
        className={clsx('flex-shrink-0')}
        size={size}
        onClick={() => {
          editor?.chain().focus().clearNodes().unsetAllMarks().run();
        }}
      >
        <FormatClearIcon />
      </IconButton>
    </Tooltip>
  );
}
