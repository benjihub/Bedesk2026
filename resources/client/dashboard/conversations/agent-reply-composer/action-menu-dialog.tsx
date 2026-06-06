import {ComboBox} from '@ui/forms/combobox/combobox';
import {Item} from '@ui/forms/listbox/item';
import {MessageDescriptor} from '@ui/i18n/message-descriptor';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {CheckIcon} from '@ui/icons/material/Check';
import {SearchIcon} from '@ui/icons/material/Search';
import {Dialog} from '@ui/overlays/dialog/dialog';
import {DialogBody} from '@ui/overlays/dialog/dialog-body';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import clsx from 'clsx';
import {ReactElement, ReactNode} from 'react';

interface ActionMenuItemData {
  title: string | ReactElement<MessageDescriptor>;
  description?: ReactNode;
  startIcon?: ReactNode;
  selected?: boolean;
  onSelected?: (item: unknown) => void;
}

export interface ActionMenuDataWithId extends ActionMenuItemData {
  id: number | string;
}

interface Props<T extends {id: number | string}> {
  isLoading?: boolean;
  isFetching?: boolean;
  data: ActionMenuDataWithId[] | T[];
  placeholder: MessageDescriptor;
  itemData?: (item: T | ActionMenuDataWithId) => ActionMenuItemData;
  query?: string;
  onQueryChange: (query: string) => void;
  actions?: ReactNode;
  height?: string;
}
export function ActionMenuDialog<T extends {id: number}>({
  isLoading,
  isFetching,
  data,
  placeholder,
  itemData,
  query,
  onQueryChange,
  actions,
  height = 'h-[550px]',
}: Props<T>) {
  const {trans} = useTrans();
  const {close} = useDialogContext();

  return (
    <Dialog size="lg">
      <DialogBody padding="p-0" className={clsx('compact-scrollbar', height)}>
        <ComboBox
          prependListbox
          inputValue={query}
          onInputValueChange={onQueryChange}
          isAsync
          isLoading={isLoading}
          isFetching={isFetching}
          items={data as any}
          clearInputOnItemSelection
          hideEndAdornment
          placeholder={trans(placeholder)}
          startAdornment={<SearchIcon />}
          selectionMode="none"
          showEmptyMessage
          placement="bottom"
          autoFocus
          contentClassName="p-10"
          searchFieldClassName="px-14 pt-14 sticky top-1 bg"
        >
          {data.map(item => {
            const {title, description, startIcon, selected} = itemData
              ? itemData(item)
              : (item as unknown as ActionMenuItemData);
            return (
              <Item
                className="mb-4 rounded-panel"
                padding="px-16 py-8"
                key={item.id}
                value={item.id}
                onSelected={() =>
                  'onSelected' in item ? item.onSelected?.(item) : close(item)
                }
                startIcon={startIcon}
                endIcon={
                  selected ? (
                    <CheckIcon size="sm" className="text-primary" />
                  ) : undefined
                }
              >
                <span className={selected ? 'text-primary' : ''}>{title}</span>
                {description ? (
                  <div className="overflow-hidden overflow-ellipsis whitespace-nowrap text-xs text-muted">
                    {description}
                  </div>
                ) : null}
              </Item>
            );
          })}
        </ComboBox>
      </DialogBody>
      <div className="flex items-center gap-6 border-t px-20 py-10 text-xs text-muted">
        <Shortcut>↑</Shortcut>
        <Shortcut>↓</Shortcut>
        <Trans message="to navigate" />
        <Shortcut className="ml-16">⏎</Shortcut>
        <Trans message="to select" />
        <Shortcut className="ml-16">Esc</Shortcut>
        <Trans message="to close" />
        {actions && <div className="ml-auto">{actions}</div>}
      </div>
    </Dialog>
  );
}

interface ShortcutProps {
  children: ReactNode;
  className?: string;
}
function Shortcut({children, className}: ShortcutProps) {
  return (
    <div
      className={clsx(
        'flex h-20 min-w-20 items-center justify-center rounded-md border border-lighter bg-alt px-4 py-2 text-xs text-muted',
        className,
      )}
    >
      {children}
    </div>
  );
}
