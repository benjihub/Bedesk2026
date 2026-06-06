import {useEditorState} from '@tiptap/react';
import {IconButton} from '@ui/buttons/icon-button';
import {Trans} from '@ui/i18n/trans';
import {FormatBoldIcon} from '@ui/icons/material/FormatBold';
import {FormatItalicIcon} from '@ui/icons/material/FormatItalic';
import {FormatUnderlinedIcon} from '@ui/icons/material/FormatUnderlined';
import {Tooltip} from '@ui/tooltip/tooltip';
import clsx from 'clsx';
import {useCurrentTextEditor} from '../tiptap-editor-context';
import {MenubarButtonProps} from './menubar-button-props';

export function FontStyleButtons({size}: MenubarButtonProps) {
  const editor = useCurrentTextEditor();

  const state = useEditorState({
    editor,
    selector: snapshot => ({
      isBoldActive: snapshot.editor?.isActive('bold'),
      isItalicActive: snapshot.editor?.isActive('italic'),
      isUnderlineActive: snapshot.editor?.isActive('underline'),
    }),
  });

  return (
    <span className={clsx('flex-shrink-0 whitespace-nowrap')}>
      <Tooltip label={<Trans message="Bold" />}>
        <IconButton
          disabled={!editor}
          size={size}
          color={state?.isBoldActive ? 'primary' : null}
          onClick={() => {
            editor?.commands.focus();
            editor?.commands.toggleBold();
          }}
        >
          <FormatBoldIcon />
        </IconButton>
      </Tooltip>
      <Tooltip label={<Trans message="Italic" />}>
        <IconButton
          size={size}
          disabled={!editor}
          color={state?.isItalicActive ? 'primary' : null}
          onClick={() => {
            editor?.commands.focus();
            editor?.commands.toggleItalic();
          }}
        >
          <FormatItalicIcon />
        </IconButton>
      </Tooltip>
      <Tooltip label={<Trans message="Underline" />}>
        <IconButton
          size={size}
          disabled={!editor}
          color={state?.isUnderlineActive ? 'primary' : null}
          onClick={() => {
            editor?.commands.focus();
            editor?.commands.toggleUnderline();
          }}
        >
          <FormatUnderlinedIcon />
        </IconButton>
      </Tooltip>
    </span>
  );
}
