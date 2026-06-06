import {AttributeSelector} from '@app/attributes/attribute-selector/attribute-selector';
import {ReplyComposerEmojiPickerButton} from '@app/reply-composer/emoji-picker-button';
import {VariableExtension} from '@app/reply-composer/variable-extension';
import {TiptapEditorContent} from '@common/text-editor/tiptap-editor-content';
import {useCurrentTextEditor} from '@common/text-editor/tiptap-editor-context';
import {TipTapEditorProvider} from '@common/text-editor/tiptap-editor-provider';
import type {Editor, Extensions} from '@tiptap/core';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import {Placeholder, UndoRedo} from '@tiptap/extensions';
import {IconButton} from '@ui/buttons/icon-button';
import {getInputFieldClassNames} from '@ui/forms/input-field/get-input-field-class-names';
import {useDefaultValidationRules} from '@ui/forms/use-default-validation-rules';
import {Trans} from '@ui/i18n/trans';
import {DataObjectIcon} from '@ui/icons/material/DataObject';
import {Tooltip} from '@ui/tooltip/tooltip';
import clsx from 'clsx';
import {ReactNode, useEffect, useMemo, useRef, useState} from 'react';
import {useController} from 'react-hook-form';

interface Props {
  label?: ReactNode;
  labelPosition?: 'top' | 'side';
  labelDisplay?: string;
  name?: string;
  errorMessageName?: string;
  required?: boolean;
  placeholder?: string;
  height?: string;
  maxLength?: number;
  className?: string;
  multiline?: boolean;
  size?: 'sm' | 'md' | 'lg';
  children?: ReactNode;
  hideEmojiPicker?: boolean;
  invalid?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  errorMessage?: string;
  ref?: (instance: {focus: () => void}) => void;
}
export function TipTapTextField({
  label,
  labelPosition,
  labelDisplay,
  name,
  placeholder,
  className,
  multiline = false,
  size = 'md',
  children,
  hideEmojiPicker = false,
  invalid = false,
  value,
  onBlur,
  onChange,
  errorMessage: error,
  ref,
}: Props) {
  const [initialValue] = useState(() => value);
  const valueRef = useRef<string | undefined>(initialValue);
  const editorRef = useRef<Editor | null>(null);

  const extensions = useMemo(() => {
    const extensions: Extensions = [
      multiline
        ? Document
        : Document.extend({
            content: 'block',
          }),
      Paragraph,
      Text,
      UndoRedo,
      VariableExtension,
    ];

    if (placeholder) {
      extensions.push(
        Placeholder.configure({
          placeholder,
        }),
      );
    }

    return extensions;
  }, [placeholder]);

  const fieldClassNames = getInputFieldClassNames({
    invalid,
    labelDisplay,
    labelPosition,
  });

  useEffect(() => {
    if (editorRef.current && value && value !== valueRef.current) {
      editorRef.current.commands.setContent(value);
    }
  }, [value]);

  return (
    <div className={clsx(className, fieldClassNames.wrapper)}>
      <TipTapEditorProvider
        preventNewLine={!multiline}
        submitToClosestForm={!!name}
        autoFocus={false}
        extensions={extensions}
        contentClassName={clsx(
          'flex-grow text-sm overflow-y-auto',
          multiline
            ? 'compact-scrollbar'
            : 'min-w-0 hidden-scrollbar [&>p]:whitespace-nowrap [&_.ProseMirror-separator]:hidden',
        )}
        initialContent={initialValue}
        changesAsText
        onBlur={() => {
          onBlur?.();
        }}
        onChange={value => {
          onChange?.(value);
          valueRef.current = value;
        }}
        onCreate={({editor}) => {
          editorRef.current = editor;
          ref?.({
            focus: () => editor.commands.focus(),
          });
        }}
      >
        {label && <div className={fieldClassNames.label}>{label}</div>}
        <div
          className={clsx(
            'relative flex flex-auto rounded-input border transition-shadow focus-within:ring-1 focus-within:ring-inset',
            multiline ? 'flex-col' : 'hidden-scrollbar h-42 items-center',
            error
              ? 'focus-within:border-danger/90 focus-within:ring-danger/90'
              : 'focus-within:border-primary/90 focus-within:ring-primary/90',
            getSizeClassName(size, multiline),
          )}
        >
          <TiptapEditorContent />
          <ActionButtons
            multiline={multiline}
            hideEmojiPicker={hideEmojiPicker}
          >
            {children}
          </ActionButtons>
        </div>
      </TipTapEditorProvider>
      {error && <div className={fieldClassNames.error}>{error}</div>}
    </div>
  );
}

type FormTipTapTextFieldProps = Props & {
  name: string;
};
export function FormTipTapTextField(props: FormTipTapTextFieldProps) {
  const {name, errorMessageName, required, maxLength} = props;

  const rules = useDefaultValidationRules({
    name,
    errorMessageName,
    required,
    maxLength,
  });

  const {
    field: {onChange, onBlur, value, ref},
    fieldState: {error},
  } = useController({
    name,
    rules,
  });

  return (
    <TipTapTextField
      {...props}
      invalid={!!error}
      onChange={onChange}
      value={value}
      onBlur={onBlur}
      errorMessage={error?.message}
      ref={ref}
    />
  );
}

type ActionButtonsProps = {
  children: ReactNode;
  hideEmojiPicker?: boolean;
  multiline?: boolean;
};
function ActionButtons({
  children,
  hideEmojiPicker,
  multiline,
}: ActionButtonsProps) {
  const editor = useCurrentTextEditor();
  const buttonSize = !multiline ? 'xs' : '2xs';

  return (
    <div
      className={clsx(
        'flex flex-shrink-0 items-end text-muted',
        multiline ? '-mx-2 -my-2 gap-8 pt-8' : 'pl-12',
      )}
    >
      <AttributeSelector
        showReadonly
        floatingWidth="auto"
        offset={6}
        onChange={value => {
          if (value && editor) {
            editor.commands.insertContent(
              `<be-variable name="${value.name}" type="${value.type}"/>`,
            );
          }
        }}
      >
        <Tooltip label={<Trans message="Add attribute" />}>
          <IconButton size={buttonSize} iconSize="sm">
            <DataObjectIcon />
          </IconButton>
        </Tooltip>
      </AttributeSelector>
      {children}
      {!hideEmojiPicker && (
        <ReplyComposerEmojiPickerButton size={buttonSize} offset={6} />
      )}
    </div>
  );
}

function getSizeClassName(size: Props['size'], multiline: boolean) {
  if (!multiline) {
    switch (size) {
      case 'sm':
        return 'h-36 px-12';
      case 'lg':
        return 'h-50 px-12';
      default:
        return 'h-42 px-12';
    }
  }

  switch (size) {
    case 'sm':
      return 'max-h-172 px-12 py-[7px] max-h-74';
    case 'lg':
      return 'max-h-240 min-h-172 px-12 py-10';
    default:
      return 'max-h-172 px-12 py-10 min-h-90';
  }
}
