import {useCampaignEditorStore} from '@livechat/dashboard/campaigns/campaign-editor/campaign-editor-store';
import {CampaignContentItem} from '@livechat/dashboard/campaigns/campaign-editor/content-items/campaign-content-item';
import {Button} from '@ui/buttons/button';
import {IconButton} from '@ui/buttons/icon-button';
import {Trans} from '@ui/i18n/trans';
import {CloseIcon} from '@ui/icons/material/Close';
import {DragIndicatorIcon} from '@ui/icons/material/DragIndicator';
import {EditIcon} from '@ui/icons/material/Edit';
import {useSortable} from '@ui/interactions/dnd/sortable/use-sortable';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import clsx from 'clsx';
import {ReactNode, useRef} from 'react';

interface Props {
  item: CampaignContentItem;
  children: ReactNode;
  editDialog: ReactNode;
  pinnedToBottom?: boolean;
  pinnedToTop?: boolean;
  displayName?: string;
}
export function CampaignEditorContentRow({
  item,
  children,
  editDialog,
  pinnedToBottom,
  pinnedToTop,
  displayName,
}: Props) {
  const sortContent = useCampaignEditorStore(s => s.sortContent);
  const updateContentItem = useCampaignEditorStore(s => s.updateContentItem);
  const removeContentItem = useCampaignEditorStore(s => s.removeContentItem);
  const items = useCampaignEditorStore(s => s.content);
  const itemRef = useRef<HTMLDivElement>(null);
  const pinned = pinnedToBottom || pinnedToTop;
  const {sortableProps, dragHandleRef} = useSortable({
    item: item || 'noop',
    items: items,
    type: 'campaignEditorSortable',
    ref: itemRef,
    disabled: pinned,
    onSortEnd: (oldIndex, newIndex) => {
      sortContent(oldIndex, newIndex);
    },
  });

  return (
    <div
      key={item.id}
      className="mb-20 flex h-86 items-stretch overflow-hidden rounded-panel border bg-elevated shadow"
      ref={itemRef}
      {...sortableProps}
    >
      <button
        type="button"
        className={clsx(
          'shrink-0 border-r px-10 transition-colors hover:text-primary',
          pinned ? 'pointer-events-none text-disabled' : 'text-muted',
        )}
        ref={dragHandleRef}
        disabled={pinnedToBottom}
      >
        <DragIndicatorIcon />
      </button>
      <div className="min-w-0 flex-auto px-14 pb-10 pt-6">
        <div className="flex items-center">
          <div className="mb-4 mr-auto flex-auto overflow-hidden overflow-ellipsis whitespace-nowrap text-sm font-semibold first-letter:capitalize">
            {displayName || item.name}
          </div>
          <DialogTrigger
            type="modal"
            onClose={value => {
              if (value != null) {
                updateContentItem(item.id, value);
              }
            }}
          >
            <Button
              startIcon={<EditIcon />}
              color="primary"
              size="sm"
              className="ml-20"
            >
              <Trans message="Edit" />
            </Button>
            {editDialog}
          </DialogTrigger>
          <IconButton
            className="text-muted"
            onClick={() => removeContentItem(item.id)}
            size="sm"
          >
            <CloseIcon />
          </IconButton>
        </div>
        <div className="flex items-end justify-between gap-10">
          {children}
          {pinned && (
            <div className="whitespace-nowrap rounded-full border px-10 py-2 text-xs text-muted">
              <span className="max-md:hidden">
                {pinnedToBottom ? (
                  <Trans message="Pinned to bottom" />
                ) : (
                  <Trans message="Pinned to top" />
                )}
              </span>
              <span className="md:hidden">
                <Trans message="Pinned" />
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
