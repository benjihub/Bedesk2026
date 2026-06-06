import {UploadType} from '@app/site-config';
import {apiClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {ImageSelector} from '@common/uploads/components/image-selector';
import {FileUploadProvider} from '@common/uploads/uploader/file-upload-provider';
import {useMutation} from '@tanstack/react-query';
import {Avatar} from '@ui/avatar/avatar';
import {Chip} from '@ui/forms/input-field/chip-field/chip';
import {Trans} from '@ui/i18n/trans';
import {ErrorOutlineIcon} from '@ui/icons/material/ErrorOutline';
import {User} from '@ui/types/user';
import {ReactElement, useState} from 'react';

interface Props {
  user: {
    id: User['id'];
    email: User['email'];
    image: User['image'];
    name: User['name'];
    roles: User['roles'];
    banned_at: User['banned_at'];
    bans: User['bans'];
  };
  badge?: ReactElement;
}
export function UpdateUserPageHeader({user, badge}: Props) {
  const isSuspended = user.banned_at !== null;
  const banReason = user.bans?.[0]?.comment;
  return (
    <div className="container mx-auto mb-44 mt-38 flex-shrink-0 px-24">
      <div className="flex gap-32">
        <div className="relative">
          <AvatarSelector user={user} />
          <div className="absolute right-0 top-2">{badge}</div>
        </div>
        <div>
          {!!user.roles?.length && (
            <Chip radius="rounded-panel" size="sm" className="mb-6 w-max">
              {user.roles[0].name}
            </Chip>
          )}
          <h1 className="text-2xl font-semibold">{user.name}</h1>
          <div className="mt-4 text-sm text-muted">{user.email}</div>
        </div>
      </div>
      {isSuspended && (
        <div className="mt-24 flex w-max items-center gap-8 rounded-panel bg-danger-lighter px-10 py-6 text-sm text-danger-darker">
          <ErrorOutlineIcon size="sm" />
          {banReason ? (
            <Trans message="Suspended: :reason" values={{reason: banReason}} />
          ) : (
            <Trans message="Suspended" />
          )}
        </div>
      )}
    </div>
  );
}

interface AvatarManagerProps {
  user: {
    id: User['id'];
    image: User['image'];
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
