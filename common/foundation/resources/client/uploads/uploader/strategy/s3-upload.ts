import {getAxiosErrorMessage} from '@common/http/get-axios-error-message';
import {apiClient} from '@common/http/query-client';
import {UploadedFile} from '@ui/utils/files/uploaded-file';
import axios, {AxiosProgressEvent} from 'axios';
import {FileEntry} from '../../file-entry';
import {
  UploadStrategy,
  UploadStrategyConfigWithBackend,
} from './upload-strategy';

interface PresignedRequest {
  url: string;
  key: string;
  acl: string;
}

export class S3Upload implements UploadStrategy {
  private abortController: AbortController;
  private presignedRequest?: PresignedRequest;

  constructor(
    private file: UploadedFile,
    private config: UploadStrategyConfigWithBackend,
  ) {
    this.abortController = new AbortController();
  }

  async start() {
    this.presignedRequest = await this.presignPostUrl();
    if (!this.presignedRequest) return;

    const result = await this.uploadFileToS3();
    if (result !== 'uploaded') return;

    const response = await this.createFileEntry();
    if (response?.fileEntry) {
      this.config.onSuccess?.(response.fileEntry, this.file);
    } else if (!this.abortController.signal) {
      this.config.onError?.(null, this.file);
    }
  }

  abort() {
    this.abortController.abort();
    return Promise.resolve();
  }

  private presignPostUrl(): Promise<PresignedRequest> {
    return apiClient
      .post(
        's3/simple/presign',
        {
          clientName: this.file.name,
          clientMime: this.file.mime,
          clientSize: this.file.size,
          clientExtension: this.file.extension,
          uploadType: this.config.uploadType,
          backendId: this.config.backendId,
          ...this.config.metadata,
        },
        {signal: this.abortController.signal},
      )
      .then(r => r.data)
      .catch(err => {
        if (err.code !== 'ERR_CANCELED') {
          this.config.onError?.(getAxiosErrorMessage(err), this.file);
        }
      });
  }

  private uploadFileToS3() {
    const {url, acl} = this.presignedRequest!;
    return axios
      .put(url, this.file.native, {
        signal: this.abortController.signal,
        withCredentials: false,
        headers: {
          'Content-Type': this.file.mime,
          'x-amz-acl': acl,
        },
        onUploadProgress: (e: AxiosProgressEvent) => {
          if (e.event.lengthComputable) {
            this.config.onProgress?.({
              bytesUploaded: e.loaded,
              bytesTotal: e.total || 0,
            });
          }
        },
      })
      .then(() => 'uploaded')
      .catch(err => {
        if (err.code !== 'ERR_CANCELED') {
          this.config.onError?.(getAxiosErrorMessage(err), this.file);
        }
      });
  }

  private async createFileEntry() {
    return await apiClient
      .post('s3/entries', {
        ...this.config.metadata,
        clientMime: this.file.mime,
        clientName: this.file.name,
        clientSize: this.file.size,
        clientExtension: this.file.extension,
        filename: this.presignedRequest!.key.split('/').pop(),
        uploadType: this.config.uploadType,
        backendId: this.config.backendId,
      })
      .then(r => {
        return r.data as {fileEntry: FileEntry};
      })
      .catch(err => {
        if (err.code !== 'ERR_CANCELED') {
          this.config.onError?.(getAxiosErrorMessage(err), this.file);
        }
      });
  }

  static async create(
    file: UploadedFile,
    config: UploadStrategyConfigWithBackend,
  ): Promise<S3Upload> {
    return new S3Upload(file, config);
  }
}
