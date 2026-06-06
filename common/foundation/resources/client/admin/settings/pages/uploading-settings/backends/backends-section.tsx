import {AdminSettings} from '@common/admin/settings/admin-settings';
import {supportedBackends} from '@common/admin/settings/pages/uploading-settings/backends/backends';
import {CreateBackendDialog} from '@common/admin/settings/pages/uploading-settings/backends/create-backend-dialog';
import {UpdateBackendDialog} from '@common/admin/settings/pages/uploading-settings/backends/update-backend-dialog';
import {useAdminSettings} from '@common/admin/settings/requests/use-admin-settings';
import {UploadingBackendSettings} from '@common/core/settings/base-backend-settings';
import {ColumnConfig} from '@common/datatable/column-config';
import {Table} from '@common/ui/tables/table';
import {Button} from '@ui/buttons/button';
import {IconButton} from '@ui/buttons/icon-button';
import {Item} from '@ui/forms/listbox/item';
import {FormattedBytes} from '@ui/i18n/formatted-bytes';
import {FormattedNumber} from '@ui/i18n/formatted-number';
import {Trans} from '@ui/i18n/trans';
import {AddIcon} from '@ui/icons/material/Add';
import {MoreHorizIcon} from '@ui/icons/material/MoreHoriz';
import {StorageIcon} from '@ui/icons/material/Storage';
import {Menu, MenuTrigger} from '@ui/menu/menu-trigger';
import {ConfirmationDialog} from '@ui/overlays/dialog/confirmation-dialog';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {openDialog} from '@ui/overlays/store/dialog-store';
import {useSettings} from '@ui/settings/use-settings';
import {useFormContext, useWatch} from 'react-hook-form';

const storageBackendsColumns: ColumnConfig<UploadingBackendSettings>[] = [
  {
    key: 'name',
    allowsSorting: true,
    width: 'min-w-200',
    visibleInMode: 'all',
    header: () => <Trans message="Name" />,
    body: backend => <span className="font-semibold">{backend.name}</span>,
  },
  {
    key: 'type',
    allowsSorting: true,
    header: () => <Trans message="Type" />,
    body: backend => {
      const label = supportedBackends.find(b => b.type === backend.type)?.label;
      return label ? <Trans {...label} /> : backend.type;
    },
  },
  {
    key: 'fileCount',
    allowsSorting: true,
    header: () => <Trans message="Files" />,
    body: backend => <FileCountColumn backend={backend} />,
  },
  {
    key: 'size',
    allowsSorting: true,
    header: () => <Trans message="Size" />,
    body: backend => <SizeColumn backend={backend} />,
  },
  {
    key: 'actions',
    visibleInMode: 'all',
    header: () => <Trans message="Actions" />,
    hideHeader: true,
    body: backend => <ActionsColumn backend={backend} />,
    width: 'w-36',
  },
];

type ColumnProps = {
  backend: UploadingBackendSettings;
};

function SizeColumn({backend}: ColumnProps) {
  const {data} = useAdminSettings();
  const size = data.uploading.file_counts?.find(
    f => f.backend_id === backend.id,
  )?.total_size;
  return size ? <FormattedBytes bytes={size} /> : '-';
}

function FileCountColumn({backend}: ColumnProps) {
  const {data} = useAdminSettings();
  const count = data.uploading.file_counts?.find(
    f => f.backend_id === backend.id,
  )?.file_count;
  return count ? <FormattedNumber value={count} /> : '-';
}

function ActionsColumn({backend}: ColumnProps) {
  const {setValue, getValues} = useFormContext<AdminSettings>();

  const handleUpdateBackend = async () => {
    const updatedBackend = await openDialog(UpdateBackendDialog, {
      backend,
    });
    if (updatedBackend) {
      const backends = (getValues('client.uploading.backends') ?? []).map(b =>
        b.id === backend.id ? {...b, ...updatedBackend} : b,
      );
      setValue('client.uploading.backends', backends, {
        shouldDirty: true,
      });
    }
  };

  const handleRemoveBackend = async () => {
    const confirmed = await openDialog(RemoveBackendDialog, {backend});
    if (confirmed) {
      const backends = (getValues('client.uploading.backends') ?? []).filter(
        b => b.id !== backend.id,
      );
      setValue('client.uploading.backends', backends, {
        shouldDirty: true,
      });
    }
  };

  return (
    <MenuTrigger>
      <IconButton className="text-muted" size="sm">
        <MoreHorizIcon />
      </IconButton>
      <Menu>
        <Item value="edit" onSelected={() => handleUpdateBackend()}>
          <Trans message="Edit" />
        </Item>
        <Item value="remove" onSelected={() => handleRemoveBackend()}>
          <Trans message="Remove" />
        </Item>
      </Menu>
    </MenuTrigger>
  );
}

export function BackendsSection() {
  const {setValue, getValues} = useFormContext<AdminSettings>();
  const backends =
    useWatch<AdminSettings>({
      name: 'client.uploading.backends',
    }) ?? [];
  return (
    <div>
      <div className="flex items-center gap-16 pl-8">
        <div className="flex size-32 items-center justify-center rounded-button bg-fg-base/6">
          <StorageIcon size="xs" />
        </div>
        <div className="text-base font-semibold">
          <Trans message="Storage backends" />
        </div>
      </div>
      <div>
        <div className="ml-24 h-24 w-2 bg-fg-base/6"></div>
        <div className="mb-12 overflow-hidden rounded-panel border-x border-t max-md:border-b">
          <Table
            tableStyle="html"
            enableSelection={false}
            columns={storageBackendsColumns}
            data={backends}
            cellHeight="h-44"
            headerCellHeight="h-36"
            headerRowBg="bg-fg-base/4"
          />
        </div>
        <DialogTrigger
          type="modal"
          onClose={(value: UploadingBackendSettings | null) => {
            if (value) {
              const existing = getValues('client.uploading.backends') ?? [];
              setValue('client.uploading.backends', [...existing, value], {
                shouldDirty: true,
              });
            }
          }}
        >
          <Button size="xs" variant="outline" startIcon={<AddIcon />}>
            <Trans message="Add backend" />
          </Button>
          <CreateBackendDialog />
        </DialogTrigger>
      </div>
    </div>
  );
}

type RemoveBackendDialogProps = {
  backend: UploadingBackendSettings;
};
function RemoveBackendDialog({backend}: RemoveBackendDialogProps) {
  const {close} = useDialogContext();
  const {base_url} = useSettings();
  const {data} = useAdminSettings();
  const isUsed = Object.entries(data.client.uploading?.types ?? {}).some(
    ([_, type]) => type.backends.includes(backend.id),
  );

  if (isUsed) {
    return (
      <ConfirmationDialog
        hideClose
        title={<Trans message="Remove backend" />}
        body={
          <Trans message="This backend is used by some upload types. Detach it first to remove." />
        }
        confirm={<Trans message="Got it" />}
        onConfirm={() => close(false)}
      />
    );
  }

  return (
    <ConfirmationDialog
      title={<Trans message="Remove backend" />}
      isDanger
      body={
        <div>
          <p className="mb-8">
            <Trans message="Are you sure you want to remove this backend?" />
          </p>
          <p className="mb-8">
            <Trans
              message="This <b>will not</b> delete files uploaded using this backend, so you can re-attach it later at the same path."
              values={{
                b: parts => <strong>{parts}</strong>,
              }}
            />
          </p>
          <p>
            <Trans
              message="If you want to delete the files first, you can do it from the <a>files</a> page, using backend filter."
              values={{
                a: parts => (
                  <a
                    className="font-semibold underline"
                    target="_blank"
                    href={`${base_url}/admin/files`}
                  >
                    {parts}
                  </a>
                ),
              }}
            />
          </p>
        </div>
      }
      confirm={<Trans message="Remove" />}
    />
  );
}
