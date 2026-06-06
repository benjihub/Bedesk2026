import {IconButton} from '@ui/buttons/icon-button';
import {Trans} from '@ui/i18n/trans';
import {CodeIcon} from '@ui/icons/material/Code';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {Tooltip} from '@ui/tooltip/tooltip';
import {AceDialog} from '../ace-editor/ace-dialog';
import {useCurrentTextEditor} from './tiptap-editor-context';

export function ModeButton() {
  const editor = useCurrentTextEditor();
  return (
    <DialogTrigger
      type="modal"
      onClose={newValue => {
        if (newValue != null) {
          editor?.commands.setContent(newValue);
        }
      }}
    >
      <Tooltip label={<Trans message="Source code" />}>
        <IconButton
          className="text-muted max-md:hidden"
          variant="text"
          disabled={!editor}
        >
          <CodeIcon />
        </IconButton>
      </Tooltip>
      <AceDialog
        title={<Trans message="Source code" />}
        defaultValue={editor?.getHTML() ?? ''}
      />
    </DialogTrigger>
  );
}
