import {getBootstrapData} from '@ui/bootstrap-data/bootstrap-data-store';
import {UploadedFile} from '@ui/utils/files/uploaded-file';
import {Restrictions} from '@ui/utils/files/validate-file';
import {FileUpload, FileUploadStoreOptions} from './file-upload-store';
import {UploadStrategyConfig} from './strategy/upload-strategy';

export function createUpload(
  file: UploadedFile | File,
  strategyConfig: UploadStrategyConfig,
  storeOptions: FileUploadStoreOptions | undefined,
): FileUpload {
  let uploadedFile =
    file instanceof UploadedFile ? file : new UploadedFile(file);
  if (storeOptions?.modifyUploadedFile) {
    uploadedFile = storeOptions.modifyUploadedFile(uploadedFile);
  }
  return {
    file: uploadedFile,
    percentage: 0,
    bytesUploaded: 0,
    status: 'pending',
    options: {
      ...strategyConfig,
      restrictions: restrictionsFromConfig(strategyConfig),
    },
  };
}

export function restrictionsFromConfig(
  config: UploadStrategyConfig,
): Restrictions | null {
  if (config.restrictions) {
    return config.restrictions;
  }

  const uploadType = getBootstrapData().uploading_types[config.uploadType];
  if (uploadType.max_file_size || uploadType.accept) {
    return {
      maxFileSize: uploadType.max_file_size
        ? parseInt(`${uploadType.max_file_size}`)
        : undefined,
      allowedFileTypes: uploadType.accept?.map(function (type) {
        switch (type) {
          case 'image':
            return 'image/*';
          case 'video':
            return 'video/*';
          case 'audio':
            return 'audio/*';
          default:
            return type;
        }
      }),
    };
  }

  return null;
}
