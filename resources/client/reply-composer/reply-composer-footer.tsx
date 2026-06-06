import {useCurrentTextEditor} from '@common/text-editor/tiptap-editor-context';
import {ReactNode} from 'react';

interface Props {
  children?: ReactNode;
  submitButtons?: ReactNode;
}
export function ReplyComposerFooter({children, submitButtons}: Props) {
  const editor = useCurrentTextEditor();
  return (
    <div
      className="flex flex-shrink-0 items-end gap-24 p-8"
      onClick={() => {
        editor?.commands.focus();
      }}
    >
      {children && (
        <div className="flex items-center gap-6 overflow-x-auto text-muted">
          {children}
        </div>
      )}
      {submitButtons && (
        <div className="ml-auto flex items-center gap-4 pb-4">
          {submitButtons}
        </div>
      )}
    </div>
  );
}
