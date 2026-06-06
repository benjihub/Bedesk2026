import {aiAgentQueries} from '@ai/ai-agent/ai-agent-queries';
import {UploadType} from '@app/site-config';
import {queryClient} from '@common/http/query-client';
import {restrictionsFromConfig} from '@common/uploads/uploader/create-file-upload';
import {useFileUploadStore} from '@common/uploads/uploader/file-upload-provider';
import {UploadQueueItem} from '@common/uploads/uploader/ui/upload-queue-item';
import {Button} from '@ui/buttons/button';
import {Option, Select} from '@ui/forms/select/select';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {UploadFileIcon} from '@ui/icons/material/UploadFile';
import {MixedDraggable} from '@ui/interactions/dnd/use-draggable';
import {useDroppable} from '@ui/interactions/dnd/use-droppable';
import {Dialog} from '@ui/overlays/dialog/dialog';
import {DialogBody} from '@ui/overlays/dialog/dialog-body';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {DialogFooter} from '@ui/overlays/dialog/dialog-footer';
import {DialogHeader} from '@ui/overlays/dialog/dialog-header';
import {openUploadWindow} from '@ui/utils/files/open-upload-window';
import {UploadedFile} from '@ui/utils/files/uploaded-file';
import {getLanguageList} from '@ui/utils/intl/languages';
import clsx from 'clsx';
import {useRef, useState} from 'react';
import {useDebouncedCallback} from 'use-debounce';

export function IngestDocumentsDialog() {
  const {close} = useDialogContext();
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const uploadMultiple = useFileUploadStore(s => s.uploadMultiple);
  const haveSelectedFiles = useFileUploadStore(s => s.fileUploads.size > 0);
  const startUpload = useFileUploadStore(s => s.startUpload);
  const startedUpload = useFileUploadStore(s => s.uploadStarted);
  const havePendingUploads = useFileUploadStore(s => s.pendingUploadsCount > 0);
  const invalidateKnowledge = useDebouncedCallback(
    () => {
      queryClient.invalidateQueries({
        queryKey: aiAgentQueries.knowledge.invalidateKey,
      });
    },
    1000,
    {leading: true, trailing: true},
  );

  const addFilesForUploading = (files: UploadedFile[]) => {
    uploadMultiple(
      files,
      {
        uploadType: UploadType.aiDocuments,
        onSuccess: () => invalidateKnowledge(),
        metadata: {
          documentLanguage: selectedLanguage,
        },
      },
      {startUpload: false},
    );
  };

  return (
    <Dialog size="xl">
      <DialogHeader showDivider disableDismissButton={startedUpload}>
        <Trans message="Upload documents" />
      </DialogHeader>
      <DialogBody>
        {haveSelectedFiles ? (
          <SelectedFilesPreview
            onFilesSelected={files => addFilesForUploading(files)}
          />
        ) : (
          <Dropzone onFilesSelected={files => addFilesForUploading(files)} />
        )}
      </DialogBody>
      <DialogFooter
        dividerTop
        startAction={
          <LanguageSelect
            value={selectedLanguage}
            onChange={setSelectedLanguage}
          />
        }
      >
        <Button
          onClick={() => close()}
          disabled={startedUpload}
          className="max-md:hidden"
        >
          <Trans message="Close" />
        </Button>
        <Button
          variant="flat"
          color="primary"
          disabled={startedUpload || !havePendingUploads}
          onClick={() => startUpload()}
        >
          <Trans message="Upload" />
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

interface SelectedFilesPreviewProps {
  onFilesSelected: (files: UploadedFile[]) => void;
}
function SelectedFilesPreview({onFilesSelected}: SelectedFilesPreviewProps) {
  const uploads = useFileUploadStore(s => [...s.fileUploads.values()]);
  return (
    <div>
      <div className="mb-14 space-y-14">
        {uploads.map(upload => (
          <UploadQueueItem file={upload.file} key={upload.file.id} />
        ))}
      </div>
      <Button
        variant="outline"
        className="mt-10"
        size="xs"
        onClick={async () => {
          const files = await openDocumentUploadWindow();
          onFilesSelected(files);
        }}
      >
        <Trans message="Add more files" />
      </Button>
    </div>
  );
}

interface DropzoneProps {
  onFilesSelected: (files: UploadedFile[]) => void;
}

function Dropzone({onFilesSelected}: DropzoneProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const {droppableProps} = useDroppable({
    id: 'ingestDocuments',
    ref,
    types: ['nativeFile'],
    onDragEnter: () => {
      setIsDragOver(true);
    },
    onDragLeave: () => {
      setIsDragOver(false);
    },
    onDrop: async (draggable: MixedDraggable) => {
      if (draggable.type === 'nativeFile') {
        const files = await draggable.getData();
        onFilesSelected(files);
      }
    },
  });

  return (
    <div className="items-center gap-24 md:flex">
      <div
        ref={ref}
        {...droppableProps}
        className={clsx(
          'relative flex min-h-160 flex-1 flex-col items-center justify-center rounded-panel border border-dashed',
          isDragOver && 'border-primary',
        )}
      >
        <Button
          startIcon={<UploadFileIcon />}
          variant="flat"
          color="primary"
          onClick={async () => {
            const files = await openDocumentUploadWindow();
            onFilesSelected(files);
          }}
        >
          <Trans message="Select files" />
        </Button>
        <div className="mt-8 text-sm text-muted">
          <Trans message="Or drag and drop here" />
        </div>
      </div>
      <div className="flex-1 max-md:mt-24">
        <ul className="list-inside list-disc leading-6 text-muted">
          <li>
            <Trans message="Provide files and we'll fetch all the text data inside." />
          </li>
          <li>
            <Trans message="Only text based formats are supported, including: PDF, Office, PowerPoint, Excel, CSV, JSON, XML" />
          </li>
          <li>
            <Trans message="Maximum file size is 40MB." />
          </li>
        </ul>
      </div>
    </div>
  );
}

async function openDocumentUploadWindow() {
  const restrictions = restrictionsFromConfig({
    uploadType: UploadType.aiDocuments,
  });
  return await openUploadWindow({
    multiple: true,
    types: restrictions?.allowedFileTypes,
  });
}

interface LanguageSelectProps {
  value: string;
  onChange: (value: string) => void;
}
function LanguageSelect({value, onChange}: LanguageSelectProps) {
  const {trans} = useTrans();
  const languages = getLanguageList();
  return (
    <Select
      required
      selectedValue={value}
      onSelectionChange={v => onChange(v as string)}
      name="language"
      selectionMode="single"
      showSearchField
      placeholder={trans(message('Select language'))}
      searchPlaceholder={trans(message('Search...'))}
      size="xs"
      floatingWidth="auto"
    >
      {languages.map(language => (
        <Option value={language.code} key={language.code}>
          {language.name}
        </Option>
      ))}
    </Select>
  );
}
