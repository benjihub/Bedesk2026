import {UploadType} from '@app/site-config';
import {BackgroundSelectorButton} from '@common/background-selector/background-selector-button';
import {BackgroundSelectorConfig} from '@common/background-selector/background-selector-config';
import {urlFromBackgroundImage} from '@common/background-selector/bg-config-from-css-props';
import {BgSelectorTabProps} from '@common/background-selector/bg-selector-tab-props';
import {cssPropsFromBgConfig} from '@common/background-selector/css-props-from-bg-config';
import {AdvancedBackgroundPositionSelector} from '@common/background-selector/image-background-tab/advanced-background-position-selector';
import {SimpleBackgroundPositionSelector} from '@common/background-selector/image-background-tab/simple-background-position-selector';
import {
  BaseImageBg,
  ImageBackgrounds,
} from '@common/background-selector/image-backgrounds';
import {FormImageSelector} from '@common/uploads/components/image-selector';
import {FileUploadProvider} from '@common/uploads/uploader/file-upload-provider';
import {Button} from '@ui/buttons/button';
import {Form} from '@ui/forms/form';
import {Trans} from '@ui/i18n/trans';
import {UploadIcon} from '@ui/icons/material/Upload';
import {Dialog} from '@ui/overlays/dialog/dialog';
import {DialogBody} from '@ui/overlays/dialog/dialog-body';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {DialogFooter} from '@ui/overlays/dialog/dialog-footer';
import {DialogHeader} from '@ui/overlays/dialog/dialog-header';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {useForm} from 'react-hook-form';

export function ImageBackgroundTab({
  value,
  onChange,
  className,
  positionSelector,
  uploadType,
  isInsideDialog,
}: BgSelectorTabProps<BackgroundSelectorConfig>) {
  return (
    <div>
      <div className={className}>
        <CustomImageTrigger
          value={value}
          onChange={onChange}
          uploadType={uploadType!}
          hideFooter={isInsideDialog}
        />
        {ImageBackgrounds.map(background => (
          <BackgroundSelectorButton
            key={background.id}
            onClick={() =>
              onChange?.({
                ...BaseImageBg,
                ...background,
              })
            }
            isActive={value?.id === background.id}
            style={{
              ...cssPropsFromBgConfig(background),
              backgroundAttachment: 'initial',
            }}
            label={<Trans {...background.label} />}
          />
        ))}
      </div>
      {positionSelector === 'advanced' ? (
        <AdvancedBackgroundPositionSelector value={value} onChange={onChange} />
      ) : (
        <SimpleBackgroundPositionSelector
          className="mt-20 border-t pt-14"
          value={value}
          onChange={onChange}
        />
      )}
    </div>
  );
}

interface CustomImageTrigger {
  value?: BackgroundSelectorConfig;
  onChange?: (value: BackgroundSelectorConfig | null) => void;
  uploadType: keyof typeof UploadType;
  hideFooter?: boolean;
}
function CustomImageTrigger({
  value,
  onChange,
  uploadType,
  hideFooter,
}: CustomImageTrigger) {
  // only seed form with custom uploaded image
  value = value?.id === BaseImageBg.id ? value : undefined;
  return (
    <DialogTrigger
      type="popover"
      onClose={(imageUrl?: string) => {
        onChange?.(
          imageUrl
            ? {
                ...BaseImageBg,
                backgroundImage: `url(${imageUrl})`,
              }
            : null,
        );
      }}
    >
      <BackgroundSelectorButton
        label={<Trans {...BaseImageBg.label} />}
        isActive={
          value?.id === BaseImageBg.id && value?.backgroundImage !== 'none'
        }
        className="border-2 border-dashed"
        style={cssPropsFromBgConfig(value)}
      >
        <span className="inline-block rounded bg-black/20 p-10 text-white">
          <UploadIcon size="lg" />
        </span>
      </BackgroundSelectorButton>
      <CustomImageDialog
        value={value}
        uploadType={uploadType}
        hideFooter={hideFooter}
      />
    </DialogTrigger>
  );
}

interface CustomImageDialogProps {
  value?: BackgroundSelectorConfig;
  uploadType: keyof typeof UploadType;
  hideFooter?: boolean;
}
export function CustomImageDialog({
  value,
  uploadType,
  hideFooter,
}: CustomImageDialogProps) {
  const defaultValue =
    !value?.backgroundImage || !value.backgroundImage.includes('url(')
      ? undefined
      : urlFromBackgroundImage(value.backgroundImage);
  const form = useForm<{imageUrl: string}>({
    defaultValues: {imageUrl: defaultValue},
  });
  const {close, formId} = useDialogContext();
  return (
    <Dialog size="sm">
      <DialogHeader>
        <Trans message="Upload image" />
      </DialogHeader>
      <DialogBody>
        <Form
          id={formId}
          form={form}
          onSubmit={values => close(values.imageUrl)}
        >
          <FileUploadProvider>
            <FormImageSelector
              autoFocus
              name="imageUrl"
              uploadType={uploadType}
              showRemoveButton
              onChange={hideFooter ? imageUrl => close(imageUrl) : undefined}
            />
          </FileUploadProvider>
        </Form>
      </DialogBody>
      {!hideFooter && (
        <DialogFooter>
          <Button onClick={() => close()}>
            <Trans message="Cancel" />
          </Button>
          <Button variant="flat" color="primary" type="submit" form={formId}>
            <Trans message="Select" />
          </Button>
        </DialogFooter>
      )}
    </Dialog>
  );
}
