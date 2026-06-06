import {UploadType} from '@app/site-config';
import {UploadedFile} from '@ui/utils/files/uploaded-file';
import {Restrictions} from '@ui/utils/files/validate-file';
import {FileEntry} from '../../file-entry';
import {BackendMetadata} from '../backend-metadata';

export interface UploadStrategyConfig {
  chunkSize?: number;
  baseUrl?: string;
  restrictions?: Restrictions | null;
  showToastOnRestrictionFail?: boolean;
  showToastOnBackendError?: boolean;
  onProgress?: (progress: {bytesUploaded: number; bytesTotal: number}) => void;
  onSuccess?: (entry: FileEntry, file: UploadedFile) => void;
  onError?: (message: string | undefined | null, file: UploadedFile) => void;
  metadata?: BackendMetadata;
  uploadType: keyof typeof UploadType;
}

export interface UploadStrategyConfigWithBackend extends UploadStrategyConfig {
  backendId: string;
}

export interface UploadStrategy {
  start: () => void;
  abort: () => Promise<void>;
}
