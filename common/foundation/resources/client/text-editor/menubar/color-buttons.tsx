import {IconButton} from '@ui/buttons/icon-button';
import {ColorPickerDialog} from '@ui/color-picker/color-picker-dialog';
import {FormatColorFillIcon} from '@ui/icons/material/FormatColorFill';
import {FormatColorTextIcon} from '@ui/icons/material/FormatColorText';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import clsx from 'clsx';
import {Fragment, useState} from 'react';
import {useCurrentTextEditor} from '../tiptap-editor-context';
import {MenubarButtonProps} from './menubar-button-props';

export function ColorButtons({size}: MenubarButtonProps) {
  const editor = useCurrentTextEditor();
  const [dialog, setDialog] = useState<'text' | 'bg' | false>(false);
  const textActive = editor?.getAttributes('textStyle').color;
  const backgroundActive = editor?.getAttributes('textStyle').backgroundColor;
  return (
    <Fragment>
      <span className={clsx('flex-shrink-0 whitespace-nowrap')}>
        <IconButton
          disabled={!editor}
          size={size}
          color={textActive ? 'primary' : null}
          onClick={() => {
            setDialog('text');
          }}
        >
          <FormatColorTextIcon />
        </IconButton>
        <IconButton
          disabled={!editor}
          size={size}
          color={backgroundActive ? 'primary' : null}
          onClick={() => {
            setDialog('bg');
          }}
        >
          <FormatColorFillIcon />
        </IconButton>
      </span>
      <DialogTrigger
        defaultValue={dialog === 'text' ? '#000000' : '#FFFFFF'}
        type="modal"
        isOpen={!!dialog}
        onClose={newValue => {
          if (newValue) {
            if (dialog === 'text') {
              editor?.commands.setColor(newValue);
            } else {
              editor?.commands.setBackgroundColor(newValue);
            }
          }
          setDialog(false);
        }}
      >
        <ColorPickerDialog />
      </DialogTrigger>
    </Fragment>
  );
}
