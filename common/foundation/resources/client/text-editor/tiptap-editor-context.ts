import type {Editor} from '@tiptap/react';
import {createContext, useContext} from 'react';

export const TextEditorContext = createContext<{editor: Editor | null}>(null!);

export function useCurrentTextEditor() {
  const ctx = useContext(TextEditorContext);
  return ctx?.editor;
}
