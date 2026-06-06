import {IconButton} from '@ui/buttons/icon-button';
import {RedoIcon} from '@ui/icons/material/Redo';
import {UndoIcon} from '@ui/icons/material/Undo';
import {useCurrentTextEditor} from '../tiptap-editor-context';

export function HistoryButtons() {
  const editor = useCurrentTextEditor();
  return (
    <span className="flex items-center max-md:hidden">
      <IconButton
        size="md"
        disabled={!editor || !editor.can().undo()}
        onClick={() => {
          editor?.commands.focus();
          editor?.commands.undo();
        }}
      >
        <UndoIcon />
      </IconButton>
      <IconButton
        size="md"
        disabled={!editor || !editor.can().redo()}
        onClick={() => {
          editor?.commands.focus();
          editor?.commands.redo();
        }}
      >
        <RedoIcon />
      </IconButton>
    </span>
  );
}
