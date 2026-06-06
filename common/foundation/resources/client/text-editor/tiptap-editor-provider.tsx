import {TextEditorContext} from '@common/text-editor/tiptap-editor-context';
import {
  TipTapEditorProps,
  useTipTapEditor,
} from '@common/text-editor/use-tiptap-editor';
import {type Editor} from '@tiptap/react';
import {ReactNode, useImperativeHandle, useMemo} from 'react';

export interface TextEditorApi {
  clearContents(): void;
  getEditor(): Editor | null;
}

interface TipTapEditorProviderProps extends TipTapEditorProps {
  children?: ReactNode;
  ref?: React.RefObject<TextEditorApi | null>;
}
export function TipTapEditorProvider({
  children,
  ref,
  ...props
}: TipTapEditorProviderProps) {
  const editor = useTipTapEditor(props);
  const contextValue = useMemo(() => ({editor}), [editor]);

  // might need to access editor above the context, for example to clear editor after submitting form, if form is above the editor
  useImperativeHandle(ref, () => ({
    clearContents: () => editor?.commands.clearContent(),
    getEditor: () => editor,
  }));

  return (
    <TextEditorContext.Provider value={contextValue}>
      {children}
    </TextEditorContext.Provider>
  );
}
