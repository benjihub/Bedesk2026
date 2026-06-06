import {commonAdminQueries} from '@common/admin/common-admin-queries';
import bugFixingImage from '@common/admin/logging/error/bug-fixing.svg';
import {ErrorLogDatatableColumns} from '@common/admin/logging/error/error-log-datatable-columns';
import {
  ErrorLogItem,
  ErrorLogsPageData,
} from '@common/admin/logging/error/error-log-item';
import {useDeleteErrorLog} from '@common/admin/logging/error/use-delete-error-log';
import {validateErrorLogDatatableSearch} from '@common/admin/logging/error/validate-error-log-datatable-search';
import {GlobalLoadingProgress} from '@common/core/global-loading-progress';
import {DataTableAddItemButton} from '@common/datatable/data-table-add-item-button';
import {DataTableHeader} from '@common/datatable/data-table-header';
import {DataTablePaginationFooter} from '@common/datatable/data-table-pagination-footer';
import {useDatatableSearchParams} from '@common/datatable/filters/utils/use-datatable-search-params';
import {DataTableEmptyStateMessage} from '@common/datatable/page/data-table-emty-state-message';
import {
  DatatablePageScrollContainer,
  DatatablePageWithHeaderBody,
  DatatablePageWithHeaderLayout,
} from '@common/datatable/page/datatable-page-with-header-layout';
import {useDatatableQuery} from '@common/datatable/requests/use-datatable-query';
import {Table} from '@common/ui/tables/table';
import {Button} from '@ui/buttons/button';
import {Item} from '@ui/forms/listbox/item';
import {Select} from '@ui/forms/select/select';
import {FormattedBytes} from '@ui/i18n/formatted-bytes';
import {Trans} from '@ui/i18n/trans';
import {DownloadIcon} from '@ui/icons/material/Download';
import {ConfirmationDialog} from '@ui/overlays/dialog/confirmation-dialog';
import {closeDialog, openDialog} from '@ui/overlays/store/dialog-store';
import {Skeleton} from '@ui/skeleton/skeleton';
import {Fragment, useEffect, useRef, useState} from 'react';

type ErrorLogFile = ErrorLogsPageData['files'][number];

export function Component() {
  const {
    searchParams,
    sortDescriptor,
    mergeIntoSearchParams,
    setSearchQuery,
    isFiltering,
  } = useDatatableSearchParams(validateErrorLogDatatableSearch);

  const query = useDatatableQuery({
    ...commonAdminQueries.logs.error(searchParams),
  } as any);

  return (
    <DatatablePageWithHeaderLayout>
      <GlobalLoadingProgress query={query} />
      <DatatablePageWithHeaderBody>
        <DataTableHeader
          searchValue={searchParams.query}
          onSearchChange={setSearchQuery}
          actions={
            <Actions
              data={query.data as ErrorLogsPageData}
              onParamsChange={mergeIntoSearchParams}
            />
          }
        />
        <DatatablePageScrollContainer>
          <Table
            columns={ErrorLogDatatableColumns}
            data={query.items as ErrorLogItem[]}
            sortDescriptor={sortDescriptor}
            onSortChange={mergeIntoSearchParams}
            enableSelection={false}
          />
          {query.isEmpty && (
            <DataTableEmptyStateMessage
              isFiltering={isFiltering}
              image={bugFixingImage}
              title={<Trans message="No errors have been logged yet" />}
              filteringTitle={<Trans message="No matching error log entries" />}
            />
          )}
          <DataTablePaginationFooter
            query={query}
            onPageChange={page => mergeIntoSearchParams({page})}
            onPerPageChange={perPage => mergeIntoSearchParams({perPage})}
          />
        </DatatablePageScrollContainer>
      </DatatablePageWithHeaderBody>
    </DatatablePageWithHeaderLayout>
  );
}

interface ActionsProps {
  data: ErrorLogsPageData;
  onParamsChange: (params: Record<string, string>) => void;
}
function Actions({data, onParamsChange}: ActionsProps) {
  const setOnce = useRef(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  // set initial selected file once files are loaded
  useEffect(() => {
    if (data.files.length && !setOnce.current) {
      setOnce.current = true;
      const firstFile = data.files[0].identifier;
      setSelectedFile(firstFile);
      // prevent unnecessary http call
      if (firstFile !== data.selectedFile) {
        onParamsChange({file: firstFile});
      }
    }
  }, [data, onParamsChange, setOnce]);

  return (
    <Fragment>
      <FileSelector
        files={data.files ?? null}
        selectedFile={selectedFile}
        onSelected={file => {
          setSelectedFile(file.identifier);
          onParamsChange({file: file.identifier});
        }}
      />
      <Button
        variant="outline"
        color="danger"
        disabled={!selectedFile}
        onClick={() =>
          openDialog(ConfirmDeleteDialog, {identifier: selectedFile})
        }
      >
        <Trans message="Delete" />
      </Button>
      {selectedFile && (
        <DataTableAddItemButton
          elementType="a"
          download={data.files.find(f => f.identifier === selectedFile)?.name}
          href={`api/v1/logs/error/${selectedFile}/download`}
          icon={<DownloadIcon />}
        >
          <Trans message="Download log" />
        </DataTableAddItemButton>
      )}
    </Fragment>
  );
}

interface FileSelectorProps {
  files: ErrorLogFile[] | null;
  selectedFile: string | null;
  onSelected: (file: ErrorLogFile) => void;
}
function FileSelector({files, selectedFile, onSelected}: FileSelectorProps) {
  // files have not loaded yet, show skeleton
  if (!files) {
    return <Skeleton variant="rect" className="max-w-[210px]" />;
  }

  // no error logs yet, hide select completely
  if (!files.length) {
    return null;
  }

  return (
    <Select
      appearance="dropdown"
      selectionMode="single"
      selectedValue={selectedFile}
      size="sm"
      minWidth="min-w-[210px]"
    >
      {files?.map(file => (
        <Item
          key={file.identifier}
          value={file.identifier}
          onSelected={() => onSelected(file)}
        >
          {file.name} (<FormattedBytes bytes={file.size} />)
        </Item>
      ))}
    </Select>
  );
}

interface ConfirmDeleteDialogProps {
  identifier: string;
}
function ConfirmDeleteDialog({identifier}: ConfirmDeleteDialogProps) {
  const deleteLog = useDeleteErrorLog();
  return (
    <ConfirmationDialog
      title={<Trans message="Delete log file" />}
      body={<Trans message="Are you sure you want to delete this log file?" />}
      confirm={<Trans message="Delete" />}
      onConfirm={() =>
        deleteLog.mutate({identifier}, {onSuccess: () => closeDialog()})
      }
      isLoading={deleteLog.isPending}
      isDanger
    />
  );
}
