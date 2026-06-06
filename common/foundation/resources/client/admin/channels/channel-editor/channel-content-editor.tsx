import {ChannelContentSearchFieldProps} from '@common/admin/channels/channel-editor/channel-content-search-field';
import {useAddToChannel} from '@common/admin/channels/requests/use-add-to-channel';
import {useRemoveFromChannel} from '@common/admin/channels/requests/use-remove-from-channel';
import {useReorderChannelContent} from '@common/admin/channels/requests/use-reorder-channel-content';
import {UpdateChannelPayload} from '@common/admin/channels/requests/use-update-channel';
import {useUpdateChannelContent} from '@common/admin/channels/requests/use-update-channel-content';
import {Channel, ChannelContentItem} from '@common/channels/channel';
import {useChannelContent} from '@common/channels/requests/use-channel-content';
import {ColumnConfig} from '@common/datatable/column-config';
import {NameWithAvatar} from '@common/datatable/column-templates/name-with-avatar';
import {PaginationResponse} from '@common/http/backend-response/pagination-response';
import {queryClient} from '@common/http/query-client';
import {PaginationControls} from '@common/ui/navigation/pagination-controls';
import {Table} from '@common/ui/tables/table';
import {TableContext} from '@common/ui/tables/table-context';
import {RowElementProps} from '@common/ui/tables/table-row';
import {mergeProps} from '@react-aria/utils';
import {UseQueryResult} from '@tanstack/react-query';
import {Button} from '@ui/buttons/button';
import {IconButton} from '@ui/buttons/icon-button';
import {Item} from '@ui/forms/listbox/item';
import {Select} from '@ui/forms/select/select';
import {Trans} from '@ui/i18n/trans';
import {CloseIcon} from '@ui/icons/material/Close';
import {DragHandleIcon} from '@ui/icons/material/DragHandle';
import {RefreshIcon} from '@ui/icons/material/Refresh';
import {WarningIcon} from '@ui/icons/material/Warning';
import {IllustratedMessage} from '@ui/images/illustrated-message';
import {SvgImage} from '@ui/images/svg-image';
import {DragPreview} from '@ui/interactions/dnd/drag-preview';
import {
  DropPosition,
  useSortable,
} from '@ui/interactions/dnd/sortable/use-sortable';
import {DragPreviewRenderer} from '@ui/interactions/dnd/use-draggable';
import {NormalizedModel} from '@ui/types/normalized-model';
import {moveItemInNewArray} from '@ui/utils/array/move-item-in-new-array';
import {useIsTouchDevice} from '@ui/utils/hooks/is-touch-device';
import clsx from 'clsx';
import React, {
  cloneElement,
  ReactElement,
  ReactNode,
  useContext,
  useRef,
  useState,
} from 'react';
import {useFormContext} from 'react-hook-form';
import {Link, useParams} from 'react-router';
import playlist from '../playlist.svg';

const columnConfig: ColumnConfig<NormalizedModel>[] = [
  {
    key: 'dragHandle',
    width: 'w-42 flex-shrink-0',
    header: () => <Trans message="Drag handle" />,
    hideHeader: true,
    body: () => (
      <DragHandleIcon className="cursor-pointer text-muted hover:text" />
    ),
  },
  {
    key: 'name',
    header: () => <Trans message="Content item" />,
    visibleInMode: 'all',
    body: item => {
      return (
        <NameWithAvatar
          image={item.image}
          label={
            item.model_type === 'channel' ? (
              <Link
                className="hover:underline"
                to={`/admin/channels/${item.id}/edit`}
                target="_blank"
              >
                {item.name}
              </Link>
            ) : (
              item.name
            )
          }
          description={item.description}
        />
      );
    },
  },
  {
    key: 'type',
    header: () => <Trans message="Content type" />,
    width: 'w-100 flex-shrink-0',
    body: item => <span className="capitalize">{item.model_type}</span>,
  },
  {
    key: 'actions',
    header: () => <Trans message="Actions" />,
    hideHeader: true,
    align: 'end',
    width: 'w-42 flex-shrink-0',
    visibleInMode: 'all',
    body: item => <RemoveItemColumn item={item} />,
  },
];

interface Props {
  searchField: ReactElement<ChannelContentSearchFieldProps>;
  title?: ReactNode;
  noResultsMessage?: ReactNode;
}
export function ChannelContentEditor({
  searchField,
  title,
  noResultsMessage,
}: Props) {
  const {watch, getValues} = useFormContext<UpdateChannelPayload>();
  const channel = getValues() as Channel<ChannelContentItem<NormalizedModel>>;
  const [perPage, setPerPage] = useState<string | number>(
    channel.content?.per_page ?? 100,
  );
  const contentType = watch('config.contentType');
  const contentOrder = watch('config.contentOrder');
  const addToChannel = useAddToChannel();
  const query = useChannelContent<ChannelContentItem<NormalizedModel>>(
    channel,
    {loader: 'editChannelPage', paginate: 'simple', perPage: `${perPage}`},
  );
  const pagination = query.data!;

  const filteredColumns = columnConfig.filter(col => {
    // only show delete button when channel content is managed manually
    if (col.key === 'actions' && contentType !== 'manual') {
      return false;
    }
    // only show drag button when channel content and sorting is set to manual
    if (
      col.key === 'dragHandle' &&
      (contentType !== 'manual' || contentOrder !== 'channelables.order:asc')
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="mt-40">
      <div className="mb-40">
        <h2 className="mb-10 text-2xl">
          {title || <Trans message="Channel content" />}
        </h2>
        <ContentNotEditableWarning />
        <UpdateContentButton />
        {contentType === 'manual'
          ? cloneElement<ChannelContentSearchFieldProps>(searchField, {
              onResultSelected: result => {
                addToChannel.mutate({
                  channelId: channel.id,
                  item: result,
                });
              },
            })
          : null}
      </div>
      <Pagination
        query={query}
        perPage={perPage}
        onPageChange={setPerPage}
        className="mb-24"
      />
      <Table
        className="mt-24"
        columns={filteredColumns}
        data={pagination?.data || []}
        meta={query.queryKey}
        renderRowAs={contentType === 'manual' ? ContentTableRow : undefined}
        enableSelection={false}
        hideHeaderRow
      />
      {!pagination?.data?.length
        ? noResultsMessage || (
            <IllustratedMessage
              title={<Trans message="Channel is empty" />}
              description={
                contentType === 'manual' ? (
                  <Trans message="No content is attached to this channel yet." />
                ) : (
                  <Trans message="No content to show for this channel yet." />
                )
              }
              image={<SvgImage src={playlist} />}
            />
          )
        : null}
      <Pagination
        query={query}
        perPage={perPage}
        onPageChange={setPerPage}
        className="mt-24"
      />
    </div>
  );
}

interface PaginationProps {
  query: UseQueryResult<PaginationResponse<unknown>, unknown>;
  perPage: number | string;
  onPageChange: (perPage: number | string) => void;
  className?: string;
}
function Pagination({
  query,
  perPage,
  onPageChange,
  className,
}: PaginationProps) {
  if (!query.data) return;

  return (
    <div
      className={clsx('flex items-center justify-between gap-24', className)}
    >
      <PaginationControls pagination={query.data} type="simple" />
      {query.data?.data.length >= query.data?.per_page && (
        <Select
          minWidth="min-w-auto"
          disabled={query.isLoading}
          labelPosition="side"
          size="xs"
          label={<Trans message="Per page" />}
          selectedValue={`${perPage}`}
          selectionMode="single"
          onSelectionChange={value => onPageChange(value)}
          className="ml-auto"
        >
          <Item value="50">50</Item>
          <Item value="100">100</Item>
          <Item value="200">200</Item>
          <Item value="500">500</Item>
        </Select>
      )}
    </div>
  );
}

function ContentTableRow({
  item,
  children,
  className,
  ...domProps
}: RowElementProps<NormalizedModel>) {
  const isTouchDevice = useIsTouchDevice();
  const {data, meta} = useContext(TableContext);
  const {getValues} = useFormContext<UpdateChannelPayload>();
  const domRef = useRef<HTMLTableRowElement>(null);
  const reorderContent = useReorderChannelContent();
  const previewRef = useRef<DragPreviewRenderer>(null);
  const [dropPosition, setDropPosition] = useState<DropPosition>(null);

  const {sortableProps} = useSortable({
    ref: domRef,
    disabled: isTouchDevice ?? false,
    item,
    items: data,
    type: 'channelContentItem',
    preview: previewRef,
    strategy: 'line',
    onDropPositionChange: position => {
      setDropPosition(position);
    },
    onSortEnd: (oldIndex, newIndex) => {
      // do optimistic reorder
      const newPagination = queryClient.setQueryData<
        PaginationResponse<unknown>
      >(meta, pagination => {
        if (pagination) {
          pagination = {
            ...pagination,
            data: moveItemInNewArray(pagination.data, oldIndex, newIndex),
          };
        }
        return pagination;
      });

      // reorder on backend
      if (newPagination) {
        reorderContent.mutate({
          channelId: getValues('id'),
          modelType: item.model_type,
          ids: newPagination.data.map(item => (item as NormalizedModel).id),
        });
      }
    },
  });

  return (
    <div
      className={clsx(
        className,
        dropPosition === 'before' && 'sort-preview-before',
        dropPosition === 'after' && 'sort-preview-after',
      )}
      ref={domRef}
      {...mergeProps(sortableProps, domProps)}
    >
      {children}
      {!item.isPlaceholder && <RowDragPreview item={item} ref={previewRef} />}
    </div>
  );
}

interface RowDragPreviewProps {
  item: NormalizedModel;
}
const RowDragPreview = React.forwardRef<
  DragPreviewRenderer,
  RowDragPreviewProps
>(({item}, ref) => {
  return (
    <DragPreview ref={ref}>
      {() => (
        <div className="rounded bg-chip p-8 text-base shadow">{item.name}</div>
      )}
    </DragPreview>
  );
});

interface RemoveItemColumnProps {
  item: NormalizedModel;
}
function RemoveItemColumn({item}: RemoveItemColumnProps) {
  const removeFromChannel = useRemoveFromChannel();
  const {getValues} = useFormContext<UpdateChannelPayload>();
  return (
    <IconButton
      size="md"
      className="text-muted"
      disabled={removeFromChannel.isPending}
      onClick={() => {
        removeFromChannel.mutate({
          channelId: getValues('id'),
          item: item,
        });
      }}
    >
      <CloseIcon />
    </IconButton>
  );
}

function ContentNotEditableWarning() {
  const {watch} = useFormContext<UpdateChannelPayload>();
  const contentType = watch('config.contentType');

  if (contentType === 'manual') {
    return null;
  }

  return (
    <div className="mb-20 mt-4 flex items-center gap-8">
      <WarningIcon size="xs" />
      <div className="text-xs text-muted">
        {contentType === 'listAll' ? (
          <Trans message="This channel is listing all available content of specified type, and can't be curated manually." />
        ) : null}
        {contentType === 'autoUpdate' ? (
          <Trans message="This channel content is set to update automatically and can't be curated manually." />
        ) : null}
      </div>
    </div>
  );
}

function UpdateContentButton() {
  const {slugOrId} = useParams();
  const updateContent = useUpdateChannelContent(slugOrId!);
  const {setValue, watch, getValues} = useFormContext<UpdateChannelPayload>();

  if (watch('config.contentType') !== 'autoUpdate') {
    return null;
  }

  return (
    <Button
      size="xs"
      variant="outline"
      color="primary"
      startIcon={<RefreshIcon />}
      onClick={() => {
        updateContent.mutate(
          {
            channelConfig: (getValues as any)('config'),
          },
          {
            onSuccess: response => {
              if (response.channel.content) {
                (setValue as any)('content', response.channel.content);
              }
            },
          },
        );
      }}
      disabled={
        updateContent.isPending ||
        !watch('config.autoUpdateMethod') ||
        !watch('id')
      }
    >
      <Trans message="Update content now" />
    </Button>
  );
}
