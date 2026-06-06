import {BackgroundColor} from '@common/text-editor/extensions/background-color';
import {Embed} from '@common/text-editor/extensions/embed';
import {Indent} from '@common/text-editor/extensions/indent';
import {InfoBlock} from '@common/text-editor/extensions/info-block';
import {lowlight} from '@common/text-editor/highlight/lowlight';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Image from '@tiptap/extension-image';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import {TableKit} from '@tiptap/extension-table';
import TextAlign from '@tiptap/extension-text-align';
import {Color, TextStyle} from '@tiptap/extension-text-style';
import {Placeholder} from '@tiptap/extensions';
import {AnyExtension} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

export const articleEditorTipTapExtensions: AnyExtension[] = [
  StarterKit.configure({
    codeBlock: false,
    link: {
      //inclusive: false,
      // only linkify links that start with a protocol
      shouldAutoLink: (value: string) => /^https?:\/\//.test(value),
    },
  }),
  TableKit.configure({
    table: {resizable: true},
  }),
  Placeholder.configure({
    placeholder: 'Write something...',
  }),
  Image,
  Superscript,
  Subscript,
  TextStyle,
  Color,
  BackgroundColor,
  Indent,
  CodeBlockLowlight.configure({
    lowlight,
  }),
  TextAlign.configure({
    types: ['heading', 'paragraph'],
  }),
  InfoBlock,
  Embed,
];
