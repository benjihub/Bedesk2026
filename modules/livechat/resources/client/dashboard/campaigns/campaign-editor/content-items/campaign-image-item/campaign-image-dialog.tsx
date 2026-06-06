import {UploadType} from '@app/site-config';
import {ImageSelector} from '@common/uploads/components/image-selector';
import {FileUploadProvider} from '@common/uploads/uploader/file-upload-provider';
import {CampaignImageContentItem} from '@livechat/dashboard/campaigns/campaign-editor/content-items/campaign-content-item';
import {CampaignContentItemDialog} from '@livechat/dashboard/campaigns/campaign-editor/content-items/campaign-content-item-dialog';
import {TextField} from '@ui/forms/input-field/text-field/text-field';
import {Item} from '@ui/forms/listbox/item';
import {Select} from '@ui/forms/select/select';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {Fragment, useState} from 'react';

interface Props {
  defaultValue?: CampaignImageContentItem['value'];
}
export function CampaignImageDialog({defaultValue}: Props) {
  const {trans} = useTrans();
  const [value, setValue] = useState<CampaignImageContentItem['value']>(
    defaultValue ?? {size: 'stretch', radius: 'none'},
  );

  return (
    <CampaignContentItemDialog defaultValue={defaultValue} value={value}>
      <Trans message="Image" />
      <Fragment>
        <FileUploadProvider>
          <ImageSelector
            uploadType={UploadType.brandingImages}
            onChange={url => setValue(prev => ({...prev, url}))}
            value={value.url}
            className="mb-24"
            required
            onFileSelected={async file => {
              const {width, height} = await getImageDimensions(file);
              setValue(prev => ({...prev, width, height}));
            }}
          />
        </FileUploadProvider>
        <Select
          selectionMode="single"
          selectedValue={value.size}
          label={<Trans message="Image size" />}
          className="mb-24"
          onItemSelected={size => {
            setValue({
              ...value,
              size: size as CampaignImageContentItem['value']['size'],
            });
          }}
        >
          <Item value="stretch">
            <Trans message="Stretch to fit" />
          </Item>
          <Item value="original">
            <Trans message="Original" />
          </Item>
        </Select>
        <Select
          selectionMode="single"
          selectedValue={value.radius}
          label={<Trans message="Rounding" />}
          className="mb-24"
          onItemSelected={size => {
            setValue({
              ...value,
              radius: size as CampaignImageContentItem['value']['radius'],
            });
          }}
        >
          <Item value="none">
            <Trans message="None" />
          </Item>
          <Item value="sm">
            <Trans message="Small" />
          </Item>
          <Item value="md">
            <Trans message="Medium" />
          </Item>
          <Item value="circle">
            <Trans message="Circle" />
          </Item>
        </Select>
        <TextField
          placeholder={trans(message('Optional'))}
          name="destinationUrl"
          type="url"
          value={value.destinationUrl}
          onChange={e => setValue({...value, destinationUrl: e.target.value})}
          label={<Trans message="Destination url" />}
          description={
            <Trans message="Open this link in new window when clicking the image." />
          }
        />
      </Fragment>
    </CampaignContentItemDialog>
  );
}

function getImageDimensions(
  file: File,
): Promise<{width: number; height: number}> {
  return new Promise<{width: number; height: number}>(resolve => {
    const img = new Image();
    img.onload = () => {
      resolve({width: img.width, height: img.height});
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  });
}
