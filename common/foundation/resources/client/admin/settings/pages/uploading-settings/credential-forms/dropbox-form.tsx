import {apiClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {useMutation} from '@tanstack/react-query';
import {Button} from '@ui/buttons/button';
import {Form} from '@ui/forms/form';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {Trans} from '@ui/i18n/trans';
import {Dialog} from '@ui/overlays/dialog/dialog';
import {DialogBody} from '@ui/overlays/dialog/dialog-body';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {DialogFooter} from '@ui/overlays/dialog/dialog-footer';
import {DialogHeader} from '@ui/overlays/dialog/dialog-header';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {Fragment} from 'react';
import {useForm, useFormContext} from 'react-hook-form';

type Props = {
  isInvalid?: boolean;
  formPrefix: string;
};
export function DropboxForm({isInvalid, formPrefix}: Props) {
  const {watch, setValue} = useFormContext();
  const appKey = watch(`credentials.${formPrefix}.app_key`);
  const appSecret = watch(`credentials.${formPrefix}.app_secret`);

  return (
    <Fragment>
      <FormTextField
        invalid={isInvalid}
        className="mb-20"
        name={`credentials.${formPrefix}.app_key`}
        label={<Trans message="Dropbox application key" />}
        required
      />
      <FormTextField
        invalid={isInvalid}
        className="mb-20"
        name={`credentials.${formPrefix}.app_secret`}
        label={<Trans message="Dropbox application secret" />}
        required
      />
      <FormTextField
        invalid={isInvalid}
        className="mb-20"
        name={`credentials.${formPrefix}.refresh_token`}
        label={<Trans message="Dropbox refresh token" />}
        required
      />
      <DialogTrigger
        type="modal"
        onClose={refreshToken => {
          if (refreshToken) {
            setValue(`credentials.${formPrefix}.refresh_token`, refreshToken, {
              shouldDirty: true,
            });
          }
        }}
      >
        <Button
          variant="outline"
          color="primary"
          size="xs"
          disabled={!appKey || !appSecret}
        >
          <Trans message="Get dropbox refresh token" />
        </Button>
        <DropboxRefreshTokenDialog appKey={appKey!} appSecret={appSecret!} />
      </DialogTrigger>
    </Fragment>
  );
}

interface DropboxRefreshTokenDialogProps {
  appKey: string;
  appSecret: string;
}
function DropboxRefreshTokenDialog({
  appKey,
  appSecret,
}: DropboxRefreshTokenDialogProps) {
  const form = useForm<{accessCode: string}>();
  const {formId, close} = useDialogContext();
  const generateRefreshToken = useGenerateDropboxRefreshToken();
  return (
    <Dialog>
      <DialogHeader>
        <Trans message="Connect dropbox account" />
      </DialogHeader>
      <DialogBody>
        <Form
          id={formId}
          form={form}
          onSubmit={data => {
            generateRefreshToken.mutate(
              {
                app_key: appKey,
                app_secret: appSecret,
                access_code: data.accessCode,
              },
              {
                onSuccess: response => {
                  close(response.refreshToken);
                },
              },
            );
          }}
        >
          <div className="mb-20 border-b pb-20">
            <div className="mb-10 text-sm text-muted">
              <Trans message="Click the 'get access code' button to get dropbox access code, then paste it into the field below." />
            </div>
            <Button
              variant="outline"
              color="primary"
              size="xs"
              elementType="a"
              target="_blank"
              href={`https://www.dropbox.com/oauth2/authorize?client_id=${appKey}&token_access_type=offline&response_type=code`}
            >
              <Trans message="Get access code" />
            </Button>
          </div>
          <FormTextField
            name="accessCode"
            label={<Trans message="Dropbox access code" />}
            required
          />
        </Form>
      </DialogBody>
      <DialogFooter>
        <Button
          onClick={() => {
            close();
          }}
        >
          <Trans message="Cancel" />
        </Button>
        <Button
          variant="flat"
          color="primary"
          form={formId}
          type="submit"
          disabled={!appKey || !appSecret || generateRefreshToken.isPending}
        >
          <Trans message="Connect" />
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

function useGenerateDropboxRefreshToken() {
  return useMutation({
    mutationFn: (payload: {
      app_key: string;
      app_secret: string;
      access_code: string;
    }) =>
      apiClient
        .post<{
          refreshToken: string;
        }>('settings/uploading/dropbox-refresh-token', payload)
        .then(r => r.data),
    onError: err => showHttpErrorToast(err),
  });
}
