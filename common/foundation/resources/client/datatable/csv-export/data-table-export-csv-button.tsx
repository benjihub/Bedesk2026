import {IconButton} from '@ui/buttons/icon-button';
import {FileDownloadIcon} from '@ui/icons/material/FileDownload';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {downloadFileFromUrl} from '@ui/utils/files/download-file-from-url';
import {Fragment, useState} from 'react';
import {ExportCsvPayload, useExportCsv} from '../requests/use-export-csv';
import {CsvExportInfoDialog} from './csv-export-info-dialog';

interface DataTableExportCsvButtonProps {
  endpoint: string;
  payload?: ExportCsvPayload;
}
export function DataTableExportCsvButton({
  endpoint,
  payload,
}: DataTableExportCsvButtonProps) {
  const [dialogIsOpen, setDialogIsOpen] = useState(false);
  const exportCsv = useExportCsv(endpoint);

  return (
    <Fragment>
      <IconButton
        variant="outline"
        color="primary"
        size="sm"
        className="flex-shrink-0"
        disabled={exportCsv.isPending}
        onClick={() => {
          exportCsv.mutate(payload, {
            onSuccess: response => {
              if (response.downloadPath) {
                downloadFileFromUrl(response.downloadPath);
              } else {
                setDialogIsOpen(true);
              }
            },
          });
        }}
      >
        <FileDownloadIcon />
      </IconButton>
      <DialogTrigger
        type="modal"
        isOpen={dialogIsOpen}
        onOpenChange={setDialogIsOpen}
      >
        <CsvExportInfoDialog />
      </DialogTrigger>
    </Fragment>
  );
}
