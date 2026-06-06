import {TextField} from '@ui/forms/input-field/text-field/text-field';
import {message} from '@ui/i18n/message';
import {MessageDescriptor} from '@ui/i18n/message-descriptor';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {SearchIcon} from '@ui/icons/material/Search';
import {AnimatePresence} from 'framer-motion';
import {ComponentPropsWithoutRef, ReactNode} from 'react';
import {AddFilterButton} from './filters/add-filter-button';
import {BackendFilter} from './filters/backend-filter';

interface Props {
  actions?: ReactNode;
  filters?: BackendFilter[];
  filtersLoading?: boolean;
  searchPlaceholder?: MessageDescriptor;
  searchValue?: string;
  onSearchChange: (value: string) => void;
  selectedItems?: (string | number)[];
  selectedActions?: ReactNode;
}
export function DataTableHeader(props: Props) {
  return (
    <AnimatePresence initial={false} mode="wait">
      {props.selectedItems?.length ? (
        <SelectedStateDatableHeader {...props} key="selected" />
      ) : (
        <DefaultDatatableHeader {...props} key="default" />
      )}
    </AnimatePresence>
  );
}

function DefaultDatatableHeader({
  searchPlaceholder = message('Type to search...'),
  searchValue,
  onSearchChange,
  actions,
  filters,
  filtersLoading,
}: Props) {
  const {trans} = useTrans();
  return (
    <HeaderLayout>
      <TextField
        size="sm"
        className="mr-auto min-w-180 max-w-440 flex-auto"
        inputWrapperClassName="mr-24 md:mr-0"
        placeholder={trans(searchPlaceholder)}
        startAdornment={<SearchIcon size="sm" />}
        value={searchValue}
        onChange={e => {
          onSearchChange(e.target.value);
        }}
      />
      {filters && (
        <AddFilterButton filters={filters} disabled={filtersLoading} />
      )}
      {actions}
    </HeaderLayout>
  );
}

function SelectedStateDatableHeader({selectedActions, selectedItems}: Props) {
  return (
    <HeaderLayout data-testid="datatable-selected-header">
      <div className="mr-auto font-medium">
        <Trans
          message="[one 1 item|other :count items] selected"
          values={{count: selectedItems?.length || 1}}
        />
      </div>
      {selectedActions}
    </HeaderLayout>
  );
}

interface AnimatedHeaderProps extends ComponentPropsWithoutRef<'div'> {
  children: ReactNode;
}
export function HeaderLayout({children, ...domProps}: AnimatedHeaderProps) {
  return (
    <div
      className="hidden-scrollbar relative mb-24 flex h-42 flex-shrink-0 items-center gap-8 overflow-x-auto md:gap-12"
      {...domProps}
    >
      {children}
    </div>
  );
}
