import {EditorContent} from '@tiptap/react';
import {useCurrentTextEditor} from './tiptap-editor-context';

interface Props {
  className?: string;
}
export function TiptapEditorContent({className = 'contents'}: Props) {
  const editor = useCurrentTextEditor();
  return <EditorContent editor={editor} className={className} />;
}
