import { queryClient } from '@common/http/query-client';
import { Button } from '@ui/buttons/button';
import { Form } from '@ui/forms/form';
import {
  FormTextField,
  TextField,
} from '@ui/forms/input-field/text-field/text-field';
import { Trans } from '@ui/i18n/trans';
import { ErrorIcon } from '@ui/icons/material/Error';
import { Dialog } from '@ui/overlays/dialog/dialog';
import { DialogBody } from '@ui/overlays/dialog/dialog-body';
import { useDialogContext } from '@ui/overlays/dialog/dialog-context';
import { DialogFooter } from '@ui/overlays/dialog/dialog-footer';
import { DialogHeader } from '@ui/overlays/dialog/dialog-header';
import useClipboard from '@ui/utils/hooks/use-clipboard';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  CreateAccessTokenPayload,
  useCreateAccessToken,
} from './create-new-token';

export function CreateNewTokenDialog() {
  const form = useForm<CreateAccessTokenPayload>();
  const {formId, close} = useDialogContext();
  const createToken = useCreateAccessToken(form);

  const [plainTextToken, setPlainTextToken] = useState<string>();

  const formNode = (
    <Form
      form={form}
      id={formId}
      onSubmit={values => {
        createToken.mutate(values, {
          onSuccess: response => {
            setPlainTextToken(response.plainTextToken);
            queryClient.invalidateQueries({queryKey: ['users']});
          },
        });
      }}
    >
      <FormTextField
        name="tokenName"
        label={<Trans message="Token name" />}
        required
        autoFocus
      />
    </Form>
  );

  return (
    <Dialog>
      <DialogHeader>
        <Trans message="Create new token" />
      </DialogHeader>
      <DialogBody>
        {plainTextToken ? (
          <PlainTextPreview plainTextToken={plainTextToken} />
        ) : (
          formNode
        )}
      </DialogBody>
      <DialogFooter>
        <Button variant="text" onClick={close}>
          <Trans message="Done" />
        </Button>
        {!plainTextToken && (
          <Button
            variant="flat"
            color="primary"
            type="submit"
            form={formId}
            disabled={createToken.isPending}
          >
            <Trans message="Create" />
          </Button>
        )}
      </DialogFooter>
    </Dialog>
  );
}

interface PlainTextPreviewProps {
  plainTextToken: string;
}
function PlainTextPreview({plainTextToken}: PlainTextPreviewProps) {
  const [isCopied, copyToClipboard] = useClipboard(plainTextToken || '', {
    successDuration: 1000,
  });

  return (
    <>
      <TextField
        readOnly
        value={plainTextToken}
        autoFocus
        onClick={e => {
          e.currentTarget.focus();
          e.currentTarget.select();
        }}
        endAppend={
          <Button variant="flat" color="primary" onClick={copyToClipboard}>
            {isCopied ? <Trans message="Copied!" /> : <Trans message="Copy" />}
          </Button>
        }
      />
      <div className="mt-14 flex items-center gap-10 text-sm">
        <ErrorIcon size="sm" className="text-danger" />
        <Trans message="Make sure to store the token in a safe place. After this dialog is closed, token will not be viewable anymore." />
      </div>
    </>
  );
}
