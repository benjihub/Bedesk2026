import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {FormSwitch} from '@ui/forms/toggle/switch';
import {Trans} from '@ui/i18n/trans';

type S3FormProps = {
  isInvalid?: boolean;
  formPrefix: string;
  showEndpointField?: boolean;
};
export function S3Form({
  isInvalid,
  formPrefix,
  showEndpointField,
}: S3FormProps) {
  return (
    <div>
      {showEndpointField && (
        <FormTextField
          size="sm"
          className="mb-20"
          invalid={isInvalid}
          name={`config.${formPrefix}.endpoint`}
          label={<Trans message="Endpoint" />}
        />
      )}
      <FormTextField
        size="sm"
        invalid={isInvalid}
        className="mb-20"
        name={`config.${formPrefix}.key`}
        label={<Trans message="Access key" />}
        required
      />
      <FormTextField
        size="sm"
        invalid={isInvalid}
        className="mb-20"
        name={`config.${formPrefix}.secret`}
        label={<Trans message="Secret key" />}
        required
      />
      <FormTextField
        size="sm"
        invalid={isInvalid}
        className="mb-20"
        name={`config.${formPrefix}.region`}
        label={<Trans message="Region" />}
        placeholder="us-east-1"
      />
      <FormTextField
        size="sm"
        className="mb-20"
        invalid={isInvalid}
        name={`config.${formPrefix}.bucket`}
        label={<Trans message="Bucket" />}
        required
      />
      <FormSwitch
        size="sm"
        name={`config.${formPrefix}.direct_upload`}
        description={
          <Trans message="Upload files directly from user's browser to cloud storage, bypassing your server. This improves upload speeds and reduces server bandwidth usage." />
        }
      >
        <Trans message="Enable direct upload" />
      </FormSwitch>
      {showEndpointField && (
        <FormSwitch
          className="mt-20"
          size="sm"
          name={`config.${formPrefix}.use_path_style_endpoint`}
          description={
            <Trans message="Use 'domain.com/bucket/file.jpg' url style instead of 'bucket.domain.com/file.jpg'" />
          }
        >
          <Trans message="Use path style endpoint" />
        </FormSwitch>
      )}
    </div>
  );
}
