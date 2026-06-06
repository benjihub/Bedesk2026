import {UploadType} from '@app/site-config';
import {PartialUploadType} from '@common/core/base-backend-bootstrap-data';
import {DEFAULT_CHUNK_SIZE} from '@common/core/settings/base-backend-settings';
import {getBootstrapData} from '@ui/bootstrap-data/bootstrap-data-store';
import {message} from '@ui/i18n/message';
import {toast} from '@ui/toast/toast';
import {UploadedFile} from '@ui/utils/files/uploaded-file';
import {validateFile} from '@ui/utils/files/validate-file';
import {FileUpload, FileUploadState} from './file-upload-store';
import {ProgressTimeout} from './progress-timeout';
import {AxiosUpload} from './strategy/axios-upload';
import {S3MultipartUpload} from './strategy/s3-multipart-upload';
import {S3Upload} from './strategy/s3-upload';
import {TusUpload} from './strategy/tus-upload';
import {
  UploadStrategy,
  UploadStrategyConfigWithBackend,
} from './strategy/upload-strategy';

export async function startUploading(
  upload: FileUpload,
  state: FileUploadState,
): Promise<UploadStrategy | null> {
  const settings = getBootstrapData().settings;
  const options = upload.options;
  const file = upload.file as UploadedFile;

  // validate file, if validation fails, error the upload and bail
  if (options?.restrictions) {
    const errorMessage = validateFile(file, options.restrictions);
    if (errorMessage) {
      state.updateFileUpload(file.id, {
        errorMessage,
        status: 'failed',
        request: undefined,
        timer: undefined,
      });

      if (options.showToastOnRestrictionFail) {
        toast.danger(errorMessage);
      }

      state.runQueue();
      return null;
    }
  }

  const backend = chooseBackend(options.uploadType);

  if (!backend) {
    throw new Error('No backend found for upload type ' + options.uploadType);
  }

  // prepare config for file upload strategy
  const timer = new ProgressTimeout();
  const config: UploadStrategyConfigWithBackend = {
    uploadType: options?.uploadType,
    backendId: backend.id,
    metadata: {
      ...options?.metadata,
      relativePath: file.relativePath,
      parentId: options?.metadata?.parentId || '',
    },
    chunkSize: settings.uploading?.chunk_size ?? DEFAULT_CHUNK_SIZE,
    baseUrl: settings.base_url,
    onError: errorMessage => {
      state.updateFileUpload(file.id, {
        errorMessage,
        status: 'failed',
      });
      state.runQueue();
      timer.done();
      options?.onError?.(errorMessage, file);
      if (options.showToastOnBackendError && errorMessage) {
        toast.danger(errorMessage);
      }
    },
    onSuccess: entry => {
      state.updateFileUpload(file.id, {
        status: 'completed',
        entry,
      });
      state.runQueue();
      timer.done();
      options?.onSuccess?.(entry, file);
    },
    onProgress: ({bytesUploaded, bytesTotal}) => {
      const percentage = (bytesUploaded / bytesTotal) * 100;
      state.updateFileUpload(file.id, {
        percentage,
        bytesUploaded,
      });
      timer.progress();
      options?.onProgress?.({bytesUploaded, bytesTotal});
    },
  };

  // choose and create upload strategy, based on file size and settings
  const strategy = chooseUploadStrategy(file, backend);
  const request = await strategy.create(file, config);

  // add handler for when upload times out (no progress for 30+ seconds)
  timer.timeoutHandler = () => {
    request.abort();
    state.updateFileUpload(file.id, {
      status: 'failed',
      errorMessage: message('Upload timed out'),
    });
    state.runQueue();
  };

  state.updateFileUpload(file.id, {
    status: 'inProgress',
    request,
  });
  request.start();

  return request;
}

const OneMB = 1024 * 1024;
const FourMB = 4 * OneMB;
const HundredMB = 100 * OneMB;

const chooseUploadStrategy = (
  file: UploadedFile,
  backend: PartialUploadType['backends'][number],
) => {
  if (backend.driver === 's3' && backend.direct_upload) {
    return file.size >= HundredMB ? S3MultipartUpload : S3Upload;
  } else {
    // 4MB = Axios, otherwise Tus
    return file.size >= FourMB ? TusUpload : AxiosUpload;
  }
};

function chooseBackend(uploadType: keyof typeof UploadType) {
  const uploadingTypes = getBootstrapData().uploading_types;
  if (uploadingTypes && uploadType) {
    const uploadTypeConfig = uploadingTypes[uploadType];
    // pick random backend
    return uploadTypeConfig.backends[
      Math.floor(Math.random() * uploadTypeConfig.backends.length)
    ];
  }
  return null;
}
