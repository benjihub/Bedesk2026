import {
  hcCategoryIcons,
  HcCategoryImage,
} from '@app/help-center/hc-category-icons';
import {helpCenterQueries} from '@app/help-center/help-center-queries';
import {ManagedByField} from '@app/help-center/managed-by-field';
import {CreateCategoryPayload} from '@app/help-center/manager/crupdate-category-dialog/use-create-category';
import {VisibleToField} from '@app/help-center/visible-to-field';
import {UploadType} from '@app/site-config';
import {ImageSelector} from '@common/uploads/components/image-selector';
import {FileUploadProvider} from '@common/uploads/uploader/file-upload-provider';
import {useQuery} from '@tanstack/react-query';
import {ButtonBase} from '@ui/buttons/button-base';
import {IconButton} from '@ui/buttons/icon-button';
import {Form} from '@ui/forms/form';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {Item} from '@ui/forms/listbox/item';
import {FormSelect} from '@ui/forms/select/select';
import {FormSwitch} from '@ui/forms/toggle/switch';
import {Trans} from '@ui/i18n/trans';
import {AddPhotoAlternateIcon} from '@ui/icons/material/AddPhotoAlternate';
import {Dialog} from '@ui/overlays/dialog/dialog';
import {DialogBody} from '@ui/overlays/dialog/dialog-body';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {DialogHeader} from '@ui/overlays/dialog/dialog-header';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {useFormContext, UseFormReturn, useWatch} from 'react-hook-form';

interface CrupdateTagFormProps {
  onSubmit: (values: CreateCategoryPayload) => void;
  formId: string;
  form: UseFormReturn<CreateCategoryPayload>;
  hideParentId?: boolean;
}
export function CrupdateCategoryForm({
  form,
  onSubmit,
  formId,
  hideParentId,
}: CrupdateTagFormProps) {
  const {data} = useQuery(helpCenterQueries.categories.normalizedList());
  return (
    <Form id={formId} form={form} onSubmit={onSubmit}>
      <div className="mb-24 flex items-center gap-12">
        <ImageSelectorButton />
        <FormTextField
          name="name"
          label={<Trans message="Name" />}
          className="flex-auto"
          required
          autoFocus
        />
      </div>
      <FormTextField
        name="description"
        label={<Trans message="Description" />}
        inputElementType="textarea"
        rows={4}
        className="mb-24"
      />
      {hideParentId && (
        <FormSelect
          name="parent_id"
          selectionMode="single"
          label="Parent category"
          className="mb-24"
        >
          {data?.categories.map(category => (
            <Item key={category.id} value={category.id}>
              <Trans message={category.name} />
            </Item>
          ))}
        </FormSelect>
      )}
      <VisibleToField
        className="mb-24"
        description={
          <Trans message="Control who can see this category in help center" />
        }
      />
      <ManagedByField
        description={<Trans message="Control who can edit this category" />}
        className="mb-24"
      />
      <FormSwitch
        name="hide_from_structure"
        description={
          <Trans message="Will hide this category name in the help center and only show it's contents." />
        }
      >
        <Trans message="Hide from structure" />
      </FormSwitch>
    </Form>
  );
}

function ImageSelectorButton() {
  const selectedImage = useWatch({name: 'image'});
  const {setValue} = useFormContext();

  const renderedImage = !selectedImage ? (
    <AddPhotoAlternateIcon />
  ) : (
    <HcCategoryImage iconSize="h-28 w-28" src={selectedImage} />
  );

  return (
    <div>
      <div className="mb-4 text-sm">
        <Trans message="Image" />
      </div>
      <DialogTrigger
        type="popover"
        onClose={newImage => {
          if (newImage) {
            setValue('image', newImage, {shouldDirty: true});
          }
        }}
      >
        <ButtonBase className="flex h-42 w-42 items-center justify-center rounded-input border hover:bg-hover">
          {renderedImage}
        </ButtonBase>
        <ImageSelectorDialog selectedImage={selectedImage} />
      </DialogTrigger>
    </div>
  );
}

type ImageSelectorDialogProps = {
  selectedImage: string | null;
};
function ImageSelectorDialog({selectedImage}: ImageSelectorDialogProps) {
  const {close} = useDialogContext();

  return (
    <Dialog size="sm">
      <DialogHeader>
        <Trans message="Category icon" />
      </DialogHeader>
      <DialogBody>
        <section className="mb-44">
          <div className="-mx-8 grid grid-cols-8 gap-8">
            {Object.entries(hcCategoryIcons).map(([name, Icon]) => (
              <IconButton
                color={selectedImage === name ? 'primary' : undefined}
                key={name}
                size="md"
                onClick={() => close(name)}
              >
                <Icon />
              </IconButton>
            ))}
          </div>
        </section>
        <section>
          <div className="mb-12 text-sm font-semibold">
            <Trans message="Upload custom icon" />
          </div>
          <FileUploadProvider>
            <ImageSelector
              uploadType={UploadType.brandingImages}
              className="mb-24"
              showRemoveButton
              onChange={newImage => close(newImage)}
            />
          </FileUploadProvider>
        </section>
      </DialogBody>
    </Dialog>
  );
}
