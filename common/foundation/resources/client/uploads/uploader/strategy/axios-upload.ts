import {getAxiosErrorMessage} from '@common/http/get-axios-error-message';
import {apiClient} from '@common/http/query-client';
import {UploadedFile} from '@ui/utils/files/uploaded-file';
import {AxiosProgressEvent} from 'axios';
import {
  UploadStrategy,
  UploadStrategyConfigWithBackend,
} from './upload-strategy';

export class AxiosUpload implements UploadStrategy {
  private abortController: AbortController;
  constructor(
    private file: UploadedFile,
    private config: UploadStrategyConfigWithBackend,
  ) {
    this.abortController = new AbortController();
  }

  async start() {
    const formData = new FormData();
    const {onSuccess, onError, onProgress, metadata} = this.config;

    formData.set('file', this.file.native);
    formData.set('clientMime', this.file.mime);
    formData.set('clientExtension', this.file.extension);
    formData.set('uploadType', this.config.uploadType);
    formData.set('backendId', this.config.backendId);

    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        formData.set(key, `${value}`);
      });
    }

    const response = await apiClient
      .post('file-entries', formData, {
        onUploadProgress: (e: AxiosProgressEvent) => {
          if (e.event.lengthComputable) {
            onProgress?.({
              bytesUploaded: e.loaded,
              bytesTotal: e.total || 0,
            });
          }
        },
        signal: this.abortController.signal,
      })
      .catch(err => {
        if (err.code !== 'ERR_CANCELED') {
          onError?.(getAxiosErrorMessage(err), this.file);
        }
      });

    // if upload was aborted, it will be handled and set
    // as "aborted" already, no need to set it as "failed"
    if (this.abortController.signal.aborted) {
      return;
    }

    if (response && response.data.fileEntry) {
      onSuccess?.(response.data.fileEntry, this.file);
    }
  }

  abort() {
    this.abortController.abort();
    return Promise.resolve();
  }

  static async create(
    file: UploadedFile,
    config: UploadStrategyConfigWithBackend,
  ): Promise<AxiosUpload> {
    return new AxiosUpload(file, config);
  }
}
