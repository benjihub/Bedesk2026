import {TeamIndexPageTabs} from '@app/dashboard/agents/agent-index-page/team-index-page-tabs';
import {GroupPromotion} from '@app/dashboard/groups/promotions/group-promotion';
import {
  CreateGroupPromotionPayload,
  useCreateGroupPromotion,
} from '@app/dashboard/groups/promotions/requests/use-create-group-promotion';
import {useDeleteGroupPromotion} from '@app/dashboard/groups/promotions/requests/use-delete-group-promotion';
import {useUpdateGroupPromotion} from '@app/dashboard/groups/promotions/requests/use-update-group-promotion';
import {helpdeskQueries} from '../../helpdesk-queries';
import {GlobalLoadingProgress} from '@common/core/global-loading-progress';
import {ColumnConfig} from '@common/datatable/column-config';
import {DataTableAddItemButton} from '@common/datatable/data-table-add-item-button';
import {DataTableHeader} from '@common/datatable/data-table-header';
import {DataTablePaginationFooter} from '@common/datatable/data-table-pagination-footer';
import {useDatatableSearchParams} from '@common/datatable/filters/utils/use-datatable-search-params';
import {DataTableEmptyStateMessage} from '@common/datatable/page/data-table-emty-state-message';
import {
  DatatablePageHeaderBar,
  DatatablePageScrollContainer,
  DatatablePageWithHeaderBody,
  DatatablePageWithHeaderLayout,
} from '@common/datatable/page/datatable-page-with-header-layout';
import {useDatatableQuery} from '@common/datatable/requests/use-datatable-query';
import {StaticPageTitle} from '@common/seo/static-page-title';
import {Table} from '@common/ui/tables/table';
import {Badge} from '@ui/badge/badge';
import {Button} from '@ui/buttons/button';
import {IconButton} from '@ui/buttons/icon-button';
import {Form} from '@ui/forms/form';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {FormCheckbox} from '@ui/forms/toggle/checkbox';
import {Item} from '@ui/forms/listbox/item';
import {Trans} from '@ui/i18n/trans';
import {message} from '@ui/i18n/message';
import {DeleteIcon} from '@ui/icons/material/Delete';
import {EditIcon} from '@ui/icons/material/Edit';
import {MoreHorizIcon} from '@ui/icons/material/MoreHoriz';
import {Menu, MenuTrigger} from '@ui/menu/menu-trigger';
import {ConfirmationDialog} from '@ui/overlays/dialog/confirmation-dialog';
import {Dialog} from '@ui/overlays/dialog/dialog';
import {DialogBody} from '@ui/overlays/dialog/dialog-body';
import {DialogHeader} from '@ui/overlays/dialog/dialog-header';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {Skeleton} from '@ui/skeleton/skeleton';
import {toast} from '@ui/toast/toast';
import {useQuery} from '@tanstack/react-query';
import {Fragment, useState} from 'react';
import {useForm} from 'react-hook-form';

const columnConfig: ColumnConfig<GroupPromotion & {group_name?: string}>[] = [
  {
    key: 'title',
    allowsSorting: true,
    visibleInMode: 'all',
    header: () => <Trans message="Promotion" />,
    width: 'flex-3',
    body: promotion => (
      <div>
        <div className="font-semibold">{promotion.title}</div>
        {promotion.code && (
          <div className="text-xs text-muted">
            <Trans message="Code:" /> {promotion.code}
          </div>
        )}
      </div>
    ),
  },
  {
    key: 'group_name',
    allowsSorting: true,
    header: () => <Trans message="Group" />,
    width: 'flex-2',
    body: promotion => (
      <div className="text-sm">{promotion.group_name || 'Unknown Group'}</div>
    ),
  },
  {
    key: 'discount',
    header: () => <Trans message="Discount" />,
    width: 'w-100',
    body: promotion =>
      promotion.discount ? (
        <Badge className="w-max">{promotion.discount}%</Badge>
      ) : (
        <span className="text-muted">—</span>
      ),
  },
  {
    key: 'active',
    header: () => <Trans message="Status" />,
    width: 'w-100',
    body: promotion =>
      promotion.active ? (
        <Badge color="positive" className="w-max">
          <Trans message="Active" />
        </Badge>
      ) : (
        <Badge color="neutral" className="w-max">
          <Trans message="Inactive" />
        </Badge>
      ),
  },
  {
    key: 'actions',
    header: () => <Trans message="Actions" />,
    hideHeader: true,
    align: 'end',
    width: 'w-84',
    visibleInMode: 'all',
    body: promotion => <RowActions promotion={promotion} />,
  },
];

interface RowActionsProps {
  promotion: GroupPromotion & {group_name?: string};
}

function RowActions({promotion}: RowActionsProps) {
  const deletePromotion = useDeleteGroupPromotion(promotion.group_id);

  return (
    <MenuTrigger>
      <IconButton size="md" className="text-muted">
        <MoreHorizIcon />
      </IconButton>
      <Menu>
        <DialogTrigger type="modal">
          <Item value="edit" startIcon={<EditIcon />}>
            <Trans message="Edit" />
          </Item>
          <EditPromotionDialog promotion={promotion} />
        </DialogTrigger>
        <DialogTrigger type="modal">
          <Item value="delete" startIcon={<DeleteIcon />}>
            <Trans message="Delete" />
          </Item>
          <ConfirmationDialog
            isDanger
            title={<Trans message="Delete promotion" />}
            body={
              <Trans message="Are you sure you want to delete this promotion?" />
            }
            confirm={<Trans message="Delete" />}
            onConfirm={() => {
              deletePromotion.mutate(promotion.id, {
                onSuccess: () => {
                  toast(message('Promotion deleted'));
                },
              });
            }}
          />
        </DialogTrigger>
      </Menu>
    </MenuTrigger>
  );
}

interface EditPromotionDialogProps {
  promotion: GroupPromotion;
}

function EditPromotionDialog({promotion}: EditPromotionDialogProps) {
  const form = useForm<CreateGroupPromotionPayload>({
    defaultValues: {
      title: promotion.title,
      description: promotion.description || '',
      discount: promotion.discount || null,
      code: promotion.code || '',
      terms: promotion.terms || '',
      how_to_claim: promotion.how_to_claim || '',
      active: promotion.active ?? true,
    },
  });

  const updatePromotion = useUpdateGroupPromotion(
    promotion.group_id,
    promotion.id,
    form,
  );

  return (
    <Dialog size="lg">
      <DialogHeader>
        <Trans message="Edit promotion" />
      </DialogHeader>
      <DialogBody>
        <Form
          form={form}
          onSubmit={values => {
            updatePromotion.mutate(values, {
              onSuccess: () => {
                toast(message('Promotion updated'));
              },
            });
          }}
        >
          <div className="grid grid-cols-1 gap-24 md:grid-cols-2">
            <FormTextField
              name="title"
              label={<Trans message="Title" />}
              required
            />
            <FormTextField name="code" label={<Trans message="Code" />} />
            <FormTextField
              name="discount"
              type="number"
              label={<Trans message="Discount %" />}
            />
            <FormCheckbox name="active">
              <Trans message="Active" />
            </FormCheckbox>
            <div className="md:col-span-2">
              <FormTextField
                name="description"
                label={<Trans message="Description" />}
                inputElementType="textarea"
                rows={3}
              />
            </div>
            <div className="md:col-span-2">
              <FormTextField
                name="terms"
                label={<Trans message="Terms" />}
                inputElementType="textarea"
                rows={3}
              />
            </div>
            <div className="md:col-span-2">
              <FormTextField
                name="how_to_claim"
                label={<Trans message="How to claim" />}
                inputElementType="textarea"
                rows={3}
              />
            </div>
          </div>

          <div className="mt-24 flex items-center justify-end gap-12">
            <Button
              type="submit"
              variant="flat"
              color="primary"
              disabled={updatePromotion.isPending}
            >
              <Trans message="Save" />
            </Button>
          </div>
        </Form>
      </DialogBody>
    </Dialog>
  );
}

function CreatePromotionDialog() {
  const {data: groupsData} = useQuery(
    helpdeskQueries.groups.normalizedList
  );
  const groups = (groupsData as {groups: any[], defaultGroupId: number})?.groups ?? [];
  const defaultGroupId = (groupsData as {groups: any[], defaultGroupId: number})?.defaultGroupId ?? groups[0]?.id ?? 0;

  const [selectedGroupId, setSelectedGroupId] = useState(defaultGroupId);

  const form = useForm<CreateGroupPromotionPayload>({
    defaultValues: {
      title: '',
      description: '',
      discount: null,
      code: '',
      terms: '',
      how_to_claim: '',
      active: true,
    },
  });

  const createPromotion = useCreateGroupPromotion(selectedGroupId, form);

  return (
    <Dialog size="lg">
      <DialogHeader>
        <Trans message="Create promotion" />
      </DialogHeader>
      <DialogBody>
        <Form
          form={form}
          onSubmit={values => {
            if (!selectedGroupId) {
              toast.danger(message('Please select a group'));
              return;
            }
            createPromotion.mutate(values, {
              onSuccess: () => {
                toast(message('Promotion created'));
                form.reset();
              },
            });
          }}
        >
          <div className="mb-24">
            <label className="mb-8 block text-sm font-semibold">
              <Trans message="Group" />
            </label>
            <select
              className="block w-full rounded border p-8"
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(Number(e.target.value))}
            >
              {groups.map((group: any) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-24 md:grid-cols-2">
            <FormTextField
              name="title"
              label={<Trans message="Title" />}
              required
            />
            <FormTextField name="code" label={<Trans message="Code" />} />
            <FormTextField
              name="discount"
              type="number"
              label={<Trans message="Discount %" />}
            />
            <FormCheckbox name="active">
              <Trans message="Active" />
            </FormCheckbox>
            <div className="md:col-span-2">
              <FormTextField
                name="description"
                label={<Trans message="Description" />}
                inputElementType="textarea"
                rows={3}
              />
            </div>
            <div className="md:col-span-2">
              <FormTextField
                name="terms"
                label={<Trans message="Terms" />}
                inputElementType="textarea"
                rows={3}
              />
            </div>
            <div className="md:col-span-2">
              <FormTextField
                name="how_to_claim"
                label={<Trans message="How to claim" />}
                inputElementType="textarea"
                rows={3}
              />
            </div>
          </div>

          <div className="mt-24 flex items-center justify-end gap-12">
            <Button
              type="submit"
              variant="flat"
              color="primary"
              disabled={createPromotion.isPending}
            >
              <Trans message="Create" />
            </Button>
          </div>
        </Form>
      </DialogBody>
    </Dialog>
  );
}

export function Component() {
  const {searchParams, setSearchQuery} = useDatatableSearchParams();
  const query = useDatatableQuery(
    helpdeskQueries.promotions.index(searchParams),
  );

  return (
    <Fragment>
      <StaticPageTitle>
        <Trans message="Promotions" />
      </StaticPageTitle>
      <DatatablePageWithHeaderLayout>
        <DatatablePageHeaderBar>
          <TeamIndexPageTabs />
        </DatatablePageHeaderBar>
        <DatatablePageWithHeaderBody>
          <DataTableHeader
            searchValue={searchParams.query}
            onSearchChange={setSearchQuery}
            actions={
              <DialogTrigger type="modal">
                <DataTableAddItemButton>
                  <Trans message="Add promotion" />
                </DataTableAddItemButton>
                <CreatePromotionDialog />
              </DialogTrigger>
            }
          />
          <DatatablePageScrollContainer>
            {query.isLoading ? (
              <PromotionsTableSkeleton />
            ) : (
              <Table
                columns={columnConfig}
                data={query.data?.pagination.data || []}
                meta={query.data?.pagination}
                enableSelection={false}
              />
            )}
            {query.data?.pagination.data.length === 0 && (
              <DataTableEmptyStateMessage
                isFiltering={false}
                title={<Trans message="No promotions yet" />}
                filteringTitle={<Trans message="No matching promotions" />}
              />
            )}
          </DatatablePageScrollContainer>
          <DataTablePaginationFooter query={query} />
        </DatatablePageWithHeaderBody>
      </DatatablePageWithHeaderLayout>
      <GlobalLoadingProgress query={query} />
    </Fragment>
  );
}

function PromotionsTableSkeleton() {
  return (
    <Table
      columns={columnConfig}
      data={Array(5)
        .fill(null)
        .map((_, index) => ({
          id: index,
          group_id: 0,
          title: '',
          group_name: '',
        }))}
      renderRowAs={() => (
        <tr>
          <td>
            <Skeleton variant="rect" size="w-full h-24" />
          </td>
          <td>
            <Skeleton variant="rect" size="w-full h-24" />
          </td>
          <td>
            <Skeleton variant="rect" size="w-60 h-24" />
          </td>
          <td>
            <Skeleton variant="rect" size="w-60 h-24" />
          </td>
          <td>
            <Skeleton variant="rect" size="w-24 h-24" />
          </td>
        </tr>
      )}
    />
  );
}
