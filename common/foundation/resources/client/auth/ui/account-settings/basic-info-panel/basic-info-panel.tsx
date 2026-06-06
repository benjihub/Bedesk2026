import {UploadType} from '@app/site-config';
import {AccountSettingsId} from '@common/auth/ui/account-settings/account-settings-sidenav';
import {apiClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {ImageSelector} from '@common/uploads/components/image-selector';
import {FileUploadProvider} from '@common/uploads/uploader/file-upload-provider';
import {useMutation} from '@tanstack/react-query';
import {Avatar} from '@ui/avatar/avatar';
import {Button} from '@ui/buttons/button';
import {Form} from '@ui/forms/form';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {Trans} from '@ui/i18n/trans';
import {AlternateEmailIcon} from '@ui/icons/material/AlternateEmail';
import {User} from '@ui/types/user';
import {useId, useState} from 'react';
import {useForm} from 'react-hook-form';
import {AccountSettingsPanel} from '../account-settings-panel';
import {useUpdateAccountDetails} from './update-account-details';

interface Props {
  user: User;
}
export function BasicInfoPanel({user}: Props) {
  const formId = useId();
  const form = useForm<Partial<Omit<User, 'subscriptions'>>>({
    defaultValues: {
      name: user.name || '',
      image: user.image,
    },
  });
  const updateAvatar = useUpdateAvatar(user.id);
  const updateDetails = useUpdateAccountDetails(user.id, form);

  return (
    <AccountSettingsPanel
      id={AccountSettingsId.AccountDetails}
      title={<Trans message="Update name and profile image" />}
      actions={
        <Button
          type="submit"
          variant="flat"
          color="primary"
          form={formId}
          disabled={
            updateDetails.isPending ||
            !form.formState.isValid ||
            !form.formState.isDirty
          }
        >
          <Trans message="Save" />
        </Button>
      }
    >
      <Form
        form={form}
        className="flex flex-col items-center gap-40 md:flex-row md:gap-60"
        onSubmit={newDetails => {
          updateDetails.mutate(newDetails, {
            onSuccess: () => {
              form.reset({
                ...form.getValues(),
                ...newDetails,
              });
            },
          });
        }}
        id={formId}
      >
        <FileUploadProvider>
          <AvatarSelector user={user} />
        </FileUploadProvider>
        <div className="w-full flex-auto">
          <div className="mb-16 flex items-center gap-4 text-muted">
            <AlternateEmailIcon size="sm" />
            {user.email}
          </div>
          <FormTextField name="name" label={<Trans message="Name" />} />
        </div>
      </Form>
    </AccountSettingsPanel>
  );
}

interface AvatarManagerProps {
  user: {
    id: User['id'];
    image?: User['image'];
    name: User['name'];
  };
}
function AvatarSelector({user}: AvatarManagerProps) {
  const [value, setValue] = useState(user.image);
  const updateAvatar = useUpdateAvatar(user.id);
  return (
    <FileUploadProvider>
      <ImageSelector
        value={value}
        uploadType={UploadType.avatars}
        variant="avatar"
        stretchPreview
        previewSize="w-90 h-90"
        placeholderIcon={
          <Avatar label={user.name} size="w-full h-full text-2xl" circle />
        }
        showRemoveButton
        onChange={(_, entry) => {
          setValue(entry?.url);
          updateAvatar.mutate({
            image: entry?.url ?? null,
            image_entry_id: entry?.id ?? null,
          });
        }}
      />
    </FileUploadProvider>
  );
}

function useUpdateAvatar(userId: number) {
  return useMutation({
    mutationFn: (payload: {
      image?: string | null;
      image_entry_id?: number | null;
    }) => apiClient.put(`users/${userId}`, payload).then(r => r.data),
    onError: r => showHttpErrorToast(r),
  });
}
