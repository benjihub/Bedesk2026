import {IconButton} from '@ui/buttons/icon-button';
import {Trans} from '@ui/i18n/trans';
import {FormatIndentDecreaseIcon} from '@ui/icons/material/FormatIndentDecrease';
import {FormatIndentIncreaseIcon} from '@ui/icons/material/FormatIndentIncrease';
import {Tooltip} from '@ui/tooltip/tooltip';
import clsx from 'clsx';
import {useCurrentTextEditor} from '../tiptap-editor-context';
import {MenubarButtonProps} from './menubar-button-props';

export function IndentButtons({size}: MenubarButtonProps) {
  const editor = useCurrentTextEditor();
  return (
    <span className={clsx('flex-shrink-0', 'whitespace-nowrap')}>
      <Tooltip label={<Trans message="Decrease indent" />}>
        <IconButton
          size={size}
          disabled={!editor}
          onClick={() => {
            editor?.commands.focus();
            editor?.commands.outdent();
          }}
        >
          <FormatIndentDecreaseIcon />
        </IconButton>
      </Tooltip>
      <Tooltip label={<Trans message="Increase indent" />}>
        <IconButton
          size={size}
          disabled={!editor}
          onClick={() => {
            editor?.commands.focus();
            editor?.commands.indent();
          }}
        >
          <FormatIndentIncreaseIcon />
        </IconButton>
      </Tooltip>
    </span>
  );
}
