import {insertLinkIntoTextEditor} from '@common/text-editor/insert-link-into-text-editor';
import {Button} from '@ui/buttons/button';
import {IconButton} from '@ui/buttons/icon-button';
import {Form} from '@ui/forms/form';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {FormSelect, Option} from '@ui/forms/select/select';
import {Trans} from '@ui/i18n/trans';
import {LinkIcon} from '@ui/icons/material/Link';
import {Dialog} from '@ui/overlays/dialog/dialog';
import {DialogBody} from '@ui/overlays/dialog/dialog-body';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {DialogFooter} from '@ui/overlays/dialog/dialog-footer';
import {DialogHeader} from '@ui/overlays/dialog/dialog-header';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {Tooltip} from '@ui/tooltip/tooltip';
import clsx from 'clsx';
import {useForm} from 'react-hook-form';
import {useCurrentTextEditor} from '../tiptap-editor-context';
import {MenubarButtonProps} from './menubar-button-props';

interface FormValue {
  href: string;
  target?: string;
  text?: string;
}

export function LinkButton({size}: MenubarButtonProps) {
  const editor = useCurrentTextEditor();
  return (
    <DialogTrigger type="modal">
      <Tooltip label={<Trans message="Insert link" />}>
        <IconButton
          disabled={!editor}
          size={size}
          className={clsx('flex-shrink-0')}
        >
          <LinkIcon />
        </IconButton>
      </Tooltip>
      <LinkDialog />
    </DialogTrigger>
  );
}

function LinkDialog() {
  const editor = useCurrentTextEditor();
  const previousUrl = editor?.getAttributes('link').href;
  const previousText = editor?.state.doc.textBetween(
    editor?.state.selection.from,
    editor?.state.selection.to,
    '',
  );

  const form = useForm<FormValue>({
    defaultValues: {href: previousUrl, text: previousText, target: '_blank'},
  });
  const {formId, close} = useDialogContext();
  return (
    <Dialog>
      <DialogHeader>
        <Trans message="Insert link" />
      </DialogHeader>
      <DialogBody>
        <Form
          form={form}
          id={formId}
          onSubmit={value => {
            insertLinkIntoTextEditor(editor!, value);
            close();
          }}
        >
          <FormTextField
            required
            name="href"
            label={<Trans message="URL" />}
            autoFocus
            className="mb-20"
          />
          <FormTextField
            required
            name="text"
            label={<Trans message="Text to display" />}
            className="mb-20"
          />
          <FormSelect
            selectionMode="single"
            name="target"
            label={<Trans message="Open link in..." />}
          >
            <Option value="_self">
              <Trans message="Current window" />
            </Option>
            <Option value="_blank">
              <Trans message="New window" />
            </Option>
          </FormSelect>
        </Form>
      </DialogBody>
      <DialogFooter>
        <Button onClick={close} variant="text">
          <Trans message="Cancel" />
        </Button>
        <Button type="submit" form={formId} variant="flat" color="primary">
          <Trans message="Save" />
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
