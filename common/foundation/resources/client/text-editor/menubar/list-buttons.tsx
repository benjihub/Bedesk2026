import {IconButton} from '@ui/buttons/icon-button';
import {Trans} from '@ui/i18n/trans';
import {FormatListBulletedIcon} from '@ui/icons/material/FormatListBulleted';
import {FormatListNumberedIcon} from '@ui/icons/material/FormatListNumbered';
import {Tooltip} from '@ui/tooltip/tooltip';
import clsx from 'clsx';
import {useCurrentTextEditor} from '../tiptap-editor-context';
import {MenubarButtonProps} from './menubar-button-props';

export function ListButtons({size}: MenubarButtonProps) {
  const editor = useCurrentTextEditor();
  const bulletActive = editor?.isActive('bulletList');
  const orderedActive = editor?.isActive('orderedList');
  return (
    <span className={clsx('flex-shrink-0', 'whitespace-nowrap')}>
      <Tooltip label={<Trans message="Bulleted list" />}>
        <IconButton
          disabled={!editor}
          size={size}
          color={bulletActive ? 'primary' : null}
          onClick={() => {
            editor?.commands.focus();
            editor?.commands.toggleBulletList();
          }}
        >
          <FormatListBulletedIcon />
        </IconButton>
      </Tooltip>
      <Tooltip label={<Trans message="Numbered list" />}>
        <IconButton
          disabled={!editor}
          size={size}
          color={orderedActive ? 'primary' : null}
          onClick={() => {
            editor?.commands.focus();
            editor?.commands.toggleOrderedList();
          }}
        >
          <FormatListNumberedIcon />
        </IconButton>
      </Tooltip>
    </span>
  );
}
