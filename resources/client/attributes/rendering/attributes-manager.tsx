import {
  AttributeType,
  CompactAttribute,
} from '@app/attributes/compact-attribute';
import {PrettyAttributeType} from '@app/attributes/rendering/pretty-attribute-type';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {useQuery} from '@tanstack/react-query';
import {opacityAnimation} from '@ui/animation/opacity-animation';
import {Button} from '@ui/buttons/button';
import {IconButton} from '@ui/buttons/icon-button';
import {Item} from '@ui/forms/listbox/item';
import {Section} from '@ui/forms/listbox/section';
import {Trans} from '@ui/i18n/trans';
import {AddIcon} from '@ui/icons/material/Add';
import {CloseIcon} from '@ui/icons/material/Close';
import {DragIndicatorIcon} from '@ui/icons/material/DragIndicator';
import {LockIcon} from '@ui/icons/material/Lock';
import {useSortable} from '@ui/interactions/dnd/sortable/use-sortable';
import {DragPreviewRenderer} from '@ui/interactions/dnd/use-draggable';
import {Menu, MenuTrigger} from '@ui/menu/menu-trigger';
import {Skeleton} from '@ui/skeleton/skeleton';
import {groupArrayBy} from '@ui/utils/array/group-array-by';
import {moveItemInNewArray} from '@ui/utils/array/move-item-in-new-array';
import {AnimatePresence, m} from 'framer-motion';
import {Fragment, ReactNode, useMemo, useRef} from 'react';

interface Props {
  selectedAttributeIds: number[] | undefined;
  nonDeletableAttributeKeys?: string[];
  onChange: (attributeIds: number[]) => void;
  queryOptions: ReturnType<typeof helpdeskQueries.attributes.normalizedList>;
  size?: 'sm' | 'md';
  addButtonLabel?: ReactNode;
}
export function AttributesManager({
  selectedAttributeIds = [],
  nonDeletableAttributeKeys = [],
  onChange,
  queryOptions,
  size = 'md',
  addButtonLabel,
}: Props) {
  selectedAttributeIds = Array.isArray(selectedAttributeIds)
    ? selectedAttributeIds
    : Object.values(selectedAttributeIds);

  const query = useQuery(queryOptions);
  const selectedAttributes = useMemo(() => {
    return selectedAttributeIds
      .map(id => query.data?.attributes.find(f => f.id === id))
      .filter(f => !!f);
  }, [query.data, selectedAttributeIds]);

  const attributeList = selectedAttributes ? (
    <m.div
      key="selected-attributes"
      className="space-y-12"
      {...opacityAnimation}
    >
      {selectedAttributes.map(attribute => (
        <AttributeButton
          size={size}
          key={attribute.id}
          attribute={attribute}
          attributes={selectedAttributes}
          canDelete={!nonDeletableAttributeKeys.includes(attribute.key)}
          onRemove={() => {
            onChange(
              selectedAttributes
                .map(attribute => attribute.id)
                .filter(id => id !== attribute.id),
            );
          }}
          onSortEnd={(oldIndex, newIndex) => {
            onChange(
              moveItemInNewArray(selectedAttributeIds, oldIndex, newIndex),
            );
          }}
        />
      ))}
    </m.div>
  ) : null;

  return (
    <Fragment>
      <AnimatePresence initial={false} mode="wait">
        <div className="mb-24">
          {!query.isLoading ? (
            attributeList
          ) : (
            <AttributeListSkeletons count={selectedAttributeIds.length} />
          )}
        </div>
      </AnimatePresence>
      <div className="flex items-center justify-between gap-8">
        <AddAttributeButton
          label={addButtonLabel}
          attributes={query.data?.attributes}
          selectedIds={selectedAttributeIds}
          onSelected={attributeId => {
            onChange([...selectedAttributeIds, attributeId]);
          }}
        />
      </div>
    </Fragment>
  );
}

type StoredAttribute = {
  id: number;
  name: string;
};

interface AttributeButtonProps {
  attribute: StoredAttribute;
  attributes: StoredAttribute[];
  canDelete: boolean;
  onRemove: () => void;
  onSortEnd: (oldIndex: number, newIndex: number) => void;
  size: 'sm' | 'md';
}
function AttributeButton({
  attribute,
  attributes,
  canDelete,
  onRemove,
  onSortEnd,
  size,
}: AttributeButtonProps) {
  const domRef = useRef<HTMLTableRowElement>(null);
  const previewRef = useRef<DragPreviewRenderer>(null);
  const {sortableProps, dragHandleRef} = useSortable({
    ref: domRef,
    preview: previewRef,
    item: attribute,
    items: attributes,
    type: 'chatWidgetFormsSort',
    onSortEnd,
  });

  return (
    <div
      className="flex items-center rounded-input border p-2 text-sm"
      ref={domRef}
      {...sortableProps}
    >
      <IconButton
        size={size === 'md' ? 'sm' : 'xs'}
        ref={dragHandleRef}
        className="mr-8"
      >
        <DragIndicatorIcon />
      </IconButton>
      <Trans message={attribute.name} />
      {attributes.length > 1 && canDelete && (
        <IconButton
          size={size === 'md' ? 'sm' : 'xs'}
          onClick={() => onRemove()}
          className="ml-auto"
        >
          <CloseIcon />
        </IconButton>
      )}
      {!canDelete && (
        <LockIcon className="ml-auto mr-6 text-muted" size={size} />
      )}
    </div>
  );
}

interface AddAttributeButton {
  attributes: CompactAttribute[] | undefined;
  selectedIds: number[];
  onSelected: (attributeId: number) => void;
  label?: ReactNode;
}
function AddAttributeButton({
  attributes,
  selectedIds,
  onSelected,
  label,
}: AddAttributeButton) {
  const groupedAttributes = useMemo(() => {
    return attributes ? groupArrayBy(attributes, item => item.type) : {};
  }, [attributes]);

  return (
    <MenuTrigger showSearchField floatingMinWidth="min-w-280">
      <Button
        variant="outline"
        startIcon={<AddIcon />}
        size="xs"
        disabled={!attributes}
      >
        {label ?? <Trans message="Add attribute" />}
      </Button>
      <Menu>
        {Object.entries(groupedAttributes).map(([groupName, attributes]) => (
          <Section
            label={<PrettyAttributeType type={groupName as AttributeType} />}
            key={groupName}
          >
            {attributes.map(attribute => (
              <Item
                key={attribute.name}
                isDisabled={selectedIds.includes(attribute.id)}
                value={attribute.name}
                onSelected={() => onSelected(attribute.id)}
              >
                {<Trans message={attribute.name} />}
              </Item>
            ))}
          </Section>
        ))}
      </Menu>
    </MenuTrigger>
  );
}

interface AttributeListSkeletonProps {
  count: number;
}
function AttributeListSkeletons({count}: AttributeListSkeletonProps) {
  return (
    <m.div
      key="attributes-skeleton"
      {...opacityAnimation}
      className="space-y-12"
    >
      {Array.from({length: count}).map((_, index) => (
        <Skeleton
          key={index}
          variant="rect"
          className="rounded-panel"
          size="h-46 w-full"
        />
      ))}
    </m.div>
  );
}
