import {bodyClassNameWithoutParagraphSpacing} from '@app/dashboard/conversations/conversation-page/messages/formatted-message-body';
import {VariableExtension} from '@app/reply-composer/variable-extension';
import {lowlight} from '@common/text-editor/highlight/lowlight';
import {TiptapEditorContent} from '@common/text-editor/tiptap-editor-content';
import {useCurrentTextEditor} from '@common/text-editor/tiptap-editor-context';
import {
  TextEditorApi,
  TipTapEditorProvider,
} from '@common/text-editor/tiptap-editor-provider';
import {TipTapEditorProps} from '@common/text-editor/use-tiptap-editor';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Image from '@tiptap/extension-image';
import {TextStyle} from '@tiptap/extension-text-style';
import StarterKit from '@tiptap/starter-kit';
import clsx from 'clsx';
import {ReactNode, RefObject} from 'react';

export const initialExtensions = [
  StarterKit.configure({
    codeBlock: false,
    link: {
      // only linkify links that start with a protocol
      shouldAutoLink: (value: string) => /^https?:\/\//.test(value),
    },
  }),
  Image,
  TextStyle,
  CodeBlockLowlight.configure({
    lowlight,
  }),
  VariableExtension,
];

interface Props
  extends Omit<TipTapEditorProps, 'extensions' | 'contentClassName'> {
  contentPadding?: string;
  bodyClassName?: string;
  height?: string;
  className?: string;
  header?: ReactNode;
  children?: ReactNode;
  ref?: RefObject<TextEditorApi | null>;
}
export default function ReplyComposerContainer({
  className,
  contentPadding,
  bodyClassName,
  height,
  header,
  children,
  ref,
  ...props
}: Props) {
  return (
    <TipTapEditorProvider
      extensions={initialExtensions}
      contentClassName={clsx(
        'flex-grow compact-scrollbar overflow-y-auto',
        bodyClassName ?? bodyClassNameWithoutParagraphSpacing,
        contentPadding ?? 'px-12 pt-8',
      )}
      ref={ref}
      {...props}
    >
      <div
        className={clsx(
          'flex flex-col rounded-input border transition-shadow focus-within:border-primary/90 focus-within:ring-1 focus-within:ring-inset focus-within:ring-primary/90',
          className,
          height ?? 'max-h-240 min-h-172',
        )}
      >
        {header ? <ComposerHeader>{header}</ComposerHeader> : null}
        <TiptapEditorContent />
        {children}
      </div>
    </TipTapEditorProvider>
  );
}

interface ComposerHeaderProps {
  children?: ReactNode;
}
export function ComposerHeader({children}: ComposerHeaderProps) {
  const editor = useCurrentTextEditor();
  return (
    <div
      className="flex-shrink-0 pt-8"
      onClick={e => {
        e.stopPropagation();
        editor?.commands.focus();
      }}
    >
      {children}
    </div>
  );
}
