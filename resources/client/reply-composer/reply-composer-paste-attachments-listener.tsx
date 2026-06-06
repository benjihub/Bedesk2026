import {ConversationAttachment} from '@app/dashboard/types/conversation-attachment';
import {useUploadAttachments} from '@app/reply-composer/use-upload-attachments';
import {useCurrentTextEditor} from '@common/text-editor/tiptap-editor-context';
import {UploadedFile} from '@ui/utils/files/uploaded-file';
import {useEffect} from 'react';

interface Props {
  onUpload: (attachment: ConversationAttachment) => void;
}

export function ReplyComposerPasteAttachmentsListener({onUpload}: Props) {
  const editor = useCurrentTextEditor();
  const upload = useUploadAttachments({
    onSuccess: entry => {
      onUpload(entry);
    },
  });

  useEffect(() => {
    if (!editor) return;

    const handlePaste = (event: ClipboardEvent) => {
      // only handle paste when editor is editable
      const editable =
        typeof editor.isEditable === 'function'
          ? editor.isEditable()
          : (editor as any).isEditable;
      if (!editable) return;

      const data = event.clipboardData;
      if (!data) return;

      const files: File[] = [];
      for (const item of Array.from(data.items)) {
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file && file.type.startsWith('image/')) {
            files.push(file);
          }
        }
      }

      if (!files.length) return;

      event.preventDefault();
      upload(files.map(file => new UploadedFile(file)));
    };

    const dom = editor.view.dom;
    dom.addEventListener('paste', handlePaste as any);
    return () => {
      dom.removeEventListener('paste', handlePaste as any);
    };
  }, [editor, upload]);

  return null;
}
