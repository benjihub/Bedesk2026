import {UploadType} from '@app/site-config';
import {DEFAULT_CHUNK_SIZE} from '@common/core/settings/base-backend-settings';
import {MessageDescriptor} from '@ui/i18n/message-descriptor';
import {Settings} from '@ui/settings/settings';
import {
  UploadedFile,
  UploadedFileFromEntry,
} from '@ui/utils/files/uploaded-file';
import {Draft, enableMapSet} from 'immer';
import {create} from 'zustand';
import {immer} from 'zustand/middleware/immer';
import {FileEntry} from '../file-entry';
import {createUpload} from './create-file-upload';
import {ProgressTimeout} from './progress-timeout';
import {startUploading} from './start-uploading';
import {S3MultipartUpload} from './strategy/s3-multipart-upload';
import {TusUpload} from './strategy/tus-upload';
import {UploadStrategy, UploadStrategyConfig} from './strategy/upload-strategy';

enableMapSet();

export interface FileUpload {
  file: UploadedFile | UploadedFileFromEntry;
  percentage: number;
  bytesUploaded: number;
  status: 'pending' | 'inProgress' | 'aborted' | 'failed' | 'completed';
  errorMessage?: string | MessageDescriptor | null;
  entry?: FileEntry;
  request?: UploadStrategy;
  timer?: ProgressTimeout;
  options: UploadStrategyConfig;
  meta?: unknown;
}

interface FileUploadStoreState {
  // If false, then we are showing file selection list UI where user can manage selected files.
  uploadStarted: boolean;
  concurrency: number;
  fileUploads: Map<string, FileUpload>;
  // uploads with pending and inProgress status
  activeUploadsCount: number;
  // uploads with inProgress status
  inProgressUploadsCount: number;
  pendingUploadsCount: number;
  completedUploadsCount: number;
}

const initialState: FileUploadStoreState = {
  uploadStarted: false,
  concurrency: 3,
  fileUploads: new Map(),
  activeUploadsCount: 0,
  inProgressUploadsCount: 0,
  pendingUploadsCount: 0,
  completedUploadsCount: 0,
};

export interface FileUploadStoreActions {
  uploadMultiple: (
    files: (File | UploadedFile)[] | FileList,
    strategyConfig: Omit<
      UploadStrategyConfig,
      // progress would be called for each upload simultaneously
      'onProgress'
    >,
    options?: {
      startUpload?: boolean;
    },
  ) => string[];
  uploadSingle: (
    file: File | UploadedFile,
    options: UploadStrategyConfig,
  ) => string;
  startUpload: () => void;
  removeUpload: (id: string) => void;
  clearInactive: () => void;
  abortUpload: (id: string) => void;
  updateFileUpload: (id: string, state: Partial<FileUpload>) => void;
  addCompletedFileUpload: (
    entry: FileEntry,
    uploadType: keyof typeof UploadType,
  ) => void;
  getUpload: (id: string) => FileUpload | undefined;
  getCompletedFileEntries: () => FileEntry[];
  runQueue: () => Promise<void>;
  reset: () => void;
}

export type FileUploadState = FileUploadStoreState & FileUploadStoreActions;

export interface FileUploadStoreOptions {
  modifyUploadedFile?: (file: UploadedFile) => UploadedFile;
}

interface StoreProps {
  settings: Settings;
  options?: FileUploadStoreOptions;
}
export const createFileUploadStore = ({settings, options}: StoreProps) =>
  create<FileUploadState>()(
    immer((set, get) => {
      return {
        ...initialState,
        reset: () => {
          set(initialState);
        },

        getUpload: uploadId => {
          return get().fileUploads.get(uploadId);
        },

        getCompletedFileEntries: () => {
          return [...get().fileUploads.values()]
            .filter(u => !!u.entry)
            .map(u => u.entry) as FileEntry[];
        },

        clearInactive: () => {
          set(state => {
            state.fileUploads.forEach((upload, key) => {
              if (upload.status !== 'inProgress') {
                state.fileUploads.delete(key);
              }
            });
            updateTotals(state);
          });
          get().runQueue();
        },

        abortUpload: id => {
          const upload = get().fileUploads.get(id);
          if (upload) {
            upload.request?.abort();
            if (!get().uploadStarted) {
              get().removeUpload(id);
            } else {
              get().updateFileUpload(id, {status: 'aborted', percentage: 0});
              get().runQueue();
            }
          }
        },

        updateFileUpload: (id, newUploadState) => {
          set(state => {
            const fileUpload = state.fileUploads.get(id);
            if (fileUpload) {
              state.fileUploads.set(id, {
                ...fileUpload,
                ...newUploadState,
              });

              // only need to update inProgress count if status of the uploads in queue change
              if ('status' in newUploadState) {
                updateTotals(state);
              }
            }
          });
        },

        addCompletedFileUpload: (entry, uploadType) => {
          set(state => {
            state.fileUploads.set(`${entry.id}`, {
              file: new UploadedFileFromEntry(entry),
              status: 'completed',
              entry,
              percentage: 100,
              bytesUploaded: entry.file_size || 0,
              options: {
                uploadType,
              },
            });
            updateTotals(state);
          });
        },

        uploadSingle: (file, userOptions) => {
          const upload = createUpload(file, userOptions, options);
          const fileUploads = new Map(get().fileUploads);
          fileUploads.set(upload.file.id, upload);

          set(state => {
            updateTotals(state);
            state.fileUploads = fileUploads;
            state.uploadStarted = true;
          });

          get().runQueue();

          return upload.file.id;
        },

        removeUpload: (id: string) => {
          set(state => {
            state.fileUploads.delete(id);
            updateTotals(state);
          });
        },

        uploadMultiple: (files, strategyConfig, {startUpload = true} = {}) => {
          // create file upload items from specified files
          const uploads = new Map<string, FileUpload>(get().fileUploads);
          [...files].forEach(file => {
            const upload = createUpload(file, strategyConfig, options);
            uploads.set(upload.file.id, upload);
          });

          // set state only once, there might be thousands of files, don't want to trigger a rerender for each one
          set(state => {
            state.uploadStarted = startUpload;
            state.fileUploads = uploads;
            updateTotals(state);
          });

          if (startUpload) {
            get().runQueue();
          }

          return [...uploads.keys()];
        },

        startUpload: () => {
          set(state => {
            state.uploadStarted = true;
          });
          get().runQueue();
        },

        runQueue: async () => {
          if (get().uploadStarted === false) return;
          const uploads = [...get().fileUploads.values()];
          const activeUploads = uploads.filter(u => u.status === 'inProgress');

          let concurrency = get().concurrency;
          if (
            activeUploads.filter(
              activeUpload =>
                // only upload one file from folder at a time to avoid creating duplicate folders
                activeUpload.file.relativePath ||
                // only allow one s3 multipart upload at a time, it will already upload multiple parts in parallel
                activeUpload.request instanceof S3MultipartUpload ||
                // only allow one tus upload if file is larger than chunk size, tus will have parallel uploads already in that case
                (activeUpload.request instanceof TusUpload &&
                  activeUpload.file.size >
                    (settings.uploading?.chunk_size ?? DEFAULT_CHUNK_SIZE)),
            ).length
          ) {
            concurrency = 1;
          }

          if (activeUploads.length < concurrency) {
            //const pendingUploads = uploads.filter(u => u.status === 'pending');
            //const next = pendingUploads.find(a => !!a.request);
            const next = uploads.find(u => u.status === 'pending');
            if (next) {
              await startUploading(next, get());
            } else {
              set(state => {
                state.uploadStarted = false;
              });
            }
          }
        },
      };
    }),
  );

const updateTotals = (state: Draft<FileUploadState>) => {
  const uploads = [...state.fileUploads.values()];
  state.completedUploadsCount = uploads.filter(
    u => u.status === 'completed',
  ).length;
  state.inProgressUploadsCount = uploads.filter(
    u => u.status === 'inProgress',
  ).length;
  state.pendingUploadsCount = uploads.filter(
    u => u.status === 'pending',
  ).length;
  state.activeUploadsCount = uploads.filter(
    u => u.status === 'inProgress' || u.status === 'pending',
  ).length;
};
