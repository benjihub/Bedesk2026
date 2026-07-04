import {UploadType} from '@app/site-config';
import {ImageSelector} from '@common/uploads/components/image-selector';
import {FileUploadProvider} from '@common/uploads/uploader/file-upload-provider';
import {getBootstrapData} from '@ui/bootstrap-data/bootstrap-data-store';
import {Avatar} from '@ui/avatar/avatar';
import {Trans} from '@ui/i18n/trans';
import {UseFormReturn, useWatch} from 'react-hook-form';

interface Props {
  form: UseFormReturn<any>;
}

export function AiAgentAvatarField({form}: Props) {
  const image = useWatch({control: form.control, name: 'image'});
  const name = useWatch({control: form.control, name: 'name'});
  const uploadType = getAiAgentAvatarUploadType();

  return (
    <FileUploadProvider>
      <ImageSelector
        value={typeof image === 'string' ? image : ''}
        uploadType={uploadType}
        variant="avatar"
        stretchPreview
        previewSize="w-90 h-90"
        label={<Trans message="Avatar" />}
        className="max-w-400"
        showRemoveButton
        placeholderIcon={
          <Avatar
            label={typeof name === 'string' ? name : 'AI'}
            size="w-full h-full text-2xl"
            circle
          />
        }
        onChange={(value, entry) => {
          form.setValue('image', entry?.url ?? value ?? '', {
            shouldDirty: true,
            shouldTouch: true,
            shouldValidate: true,
          });
        }}
        descriptionPosition="bottom"
        description={<Trans message="Use a unique avatar for this AI agent." />}
      />
    </FileUploadProvider>
  );
}

function getAiAgentAvatarUploadType() {
  const uploadTypes = getBootstrapData().uploading_types;
  const brandingImages = uploadTypes?.[UploadType.brandingImages];

  if (brandingImages?.backends?.length) {
    return UploadType.brandingImages;
  }

  return UploadType.avatars;
}
