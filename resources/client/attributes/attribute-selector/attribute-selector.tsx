import {
  AttributeSelectorItem,
  AttributeSelectorItemType,
} from '@app/attributes/attribute-selector/attribute-selector-item';
import {CreateCustomAttributeDialog} from '@app/attributes/attribute-selector/create-custom-attribute-dialog';
import {useAttributeSelectorItems} from '@app/attributes/attribute-selector/use-attribute-selector-items';
import {ButtonBaseProps} from '@ui/buttons/button-base';
import {getInputFieldClassNames} from '@ui/forms/input-field/get-input-field-class-names';
import {Item} from '@ui/forms/listbox/item';
import {Section} from '@ui/forms/listbox/section';
import {Trans} from '@ui/i18n/trans';
import {AddIcon} from '@ui/icons/material/Add';
import {KeyboardArrowDownIcon} from '@ui/icons/material/KeyboardArrowDown';
import {Menu, MenuTrigger, MenuTriggerProps} from '@ui/menu/menu-trigger';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import clsx from 'clsx';
import {ReactElement, ReactNode, useState} from 'react';

type Props = Omit<MenuTriggerProps, 'children' | 'selectedValue'> & {
  value?: AttributeSelectorItem | null | '';
  onChange?: (value: AttributeSelectorItem) => void;
  children?: ReactElement<ButtonBaseProps>;
  className?: string;
  showReadonly?: boolean;
  showPageVisitAttributes?: boolean;
  onAddNewAttribute?: (attribute: AttributeSelectorItem) => void;
  label?: ReactNode;
  description?: ReactNode;
  size?: 'xs' | 'sm' | 'md';
  required?: boolean;
  display?: string;
};
export function AttributeSelector({
  value,
  onChange,
  children,
  className,
  showReadonly,
  showPageVisitAttributes,
  onAddNewAttribute,
  floatingWidth = 'matchTrigger',
  label,
  description,
  size = 'md',
  required,
  display = 'block',
  ...menuTriggerProps
}: Props) {
  const fieldClassNames = getInputFieldClassNames({
    size,
    inputDisplay: 'flex items-center justify-between',
  });
  const [createAttributeDialogOpen, setCreateAttributeDialogOpen] =
    useState(false);
  const {groupedItems, getItem} = useAttributeSelectorItems({
    showReadonly,
    showPageVisitAttributes,
  });

  // if no trigger button is provided, show currently selected attribute name
  const displayName = value ? getItem(value)?.displayName : undefined;

  const trigger = children ? (
    children
  ) : (
    <button type="button" className={fieldClassNames.input}>
      {displayName ?? (
        <span className="font-normal text-main/50">
          <Trans message="Select attribute" />
        </span>
      )}
      <KeyboardArrowDownIcon size={size} className="-mr-4 text-muted" />
    </button>
  );

  const selectedValue = value ? `${value.type}.${value.name}` : undefined;

  return (
    <div className={clsx(className, 'relative', display)}>
      {label && <div className={fieldClassNames.label}>{label}</div>}
      <MenuTrigger
        {...menuTriggerProps}
        floatingWidth={floatingWidth}
        showSearchField
        selectedValue={selectedValue}
        selectionMode="single"
        showCheckmark
        floatingMinWidth="min-w-280"
        floatingMaxHeight={600}
      >
        {trigger}
        <Menu>
          {Object.entries(groupedItems).map(([_groupName, items]) => {
            const groupName = _groupName as AttributeSelectorItemType;
            return (
              <Section label={<GroupName group={groupName} />} key={groupName}>
                {items.map(item => (
                  <Item
                    key={item.key}
                    value={item.key}
                    onSelected={() =>
                      onChange?.({
                        name: item.name,
                        type: item.type,
                      })
                    }
                  >
                    {item.displayName}
                  </Item>
                ))}
                {groupName === 'aiAgentSession' && !!onAddNewAttribute && (
                  <Item
                    value="createAttribute"
                    startIcon={<AddIcon size="sm" />}
                    onSelected={() => setCreateAttributeDialogOpen(true)}
                  >
                    <Trans message="Add attribute" />
                  </Item>
                )}
              </Section>
            );
          })}
        </Menu>
      </MenuTrigger>
      {description && (
        <div className={fieldClassNames.description}>{description}</div>
      )}
      <DialogTrigger
        type="modal"
        isOpen={createAttributeDialogOpen}
        onOpenChange={setCreateAttributeDialogOpen}
        onClose={item => {
          if (item) {
            onAddNewAttribute?.(item);
          }
        }}
      >
        <CreateCustomAttributeDialog />
      </DialogTrigger>
      {required ? (
        <input
          aria-hidden
          tabIndex={-1}
          required
          value={selectedValue ?? ''}
          className="pointer-events-none absolute bottom-0 left-0 w-full opacity-0"
          onChange={() => {}}
        />
      ) : null}
    </div>
  );
}

type GroupNameProps = {
  group: AttributeSelectorItemType;
};
function GroupName({group}: GroupNameProps) {
  switch (group) {
    case AttributeSelectorItemType.User:
      return <Trans message="User data" />;
    case AttributeSelectorItemType.Conversation:
      return <Trans message="Conversation data" />;
    case AttributeSelectorItemType.AiAgentSession:
      return <Trans message="AI Agent" />;
    case AttributeSelectorItemType.PageVisit:
      return <Trans message="Page visits" />;
    case AttributeSelectorItemType.AiAgentTool:
      return <Trans message="List item data" />;
    case AttributeSelectorItemType.CollectedData:
      return <Trans message="Collected data" />;
  }
}
