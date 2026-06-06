import {AdminSettings} from '@common/admin/settings/admin-settings';
import {SettingsSectionHeader} from '@common/admin/settings/layout/settings-panel';
import {SettingsSectionButton} from '@common/admin/settings/layout/settings-section-button';
import {widgetNavigationTabs} from '@livechat/widget/widget-navigation/widget-navigation';
import {IconButton} from '@ui/buttons/icon-button';
import {Item} from '@ui/forms/listbox/item';
import {FormSelect} from '@ui/forms/select/select';
import {Checkbox} from '@ui/forms/toggle/checkbox';
import {FormSwitch} from '@ui/forms/toggle/switch';
import {Trans} from '@ui/i18n/trans';
import {DragIndicatorIcon} from '@ui/icons/material/DragIndicator';
import {useSortable} from '@ui/interactions/dnd/sortable/use-sortable';
import {moveItemInNewArray} from '@ui/utils/array/move-item-in-new-array';
import {useRef, useState} from 'react';
import {useFormContext} from 'react-hook-form';

export function ScreensSettings() {
  return (
    <div>
      <FormSelect
        name="client.chatWidget.defaultScreen"
        selectionMode="single"
        label={<Trans message="Default screen" />}
        className="mb-16"
      >
        {widgetNavigationTabs.map(tab => (
          <Item key={tab.route} value={tab.route}>
            <Trans {...tab.label} />
          </Item>
        ))}
        <Item value="conversations/new">
          <Trans message="New chat" />
        </Item>
        <Item value="tickets/new">
          <Trans message="New ticket" />
        </Item>
      </FormSelect>
      <FormSwitch name="client.chatWidget.hideNavigation" className="mb-16">
        <Trans message="Hide bottom navigation" />
      </FormSwitch>
      <ScreenEditor />
    </div>
  );
}

function ScreenEditor() {
  const availableScreens = widgetNavigationTabs.map(tab => tab.route);
  const form = useFormContext<AdminSettings>();

  const getSavedValue = (): string[] => {
    return form.getValues('client.chatWidget.screens') || [];
  };

  const [allScreens, setAllScreens] = useState(() => {
    const savedValue = getSavedValue();
    const sortFn = (x: string) =>
      savedValue.includes(x) ? savedValue.indexOf(x) : savedValue.length;
    return [...availableScreens].sort((a, b) => sortFn(a) - sortFn(b));
  });

  return (
    <div>
      <SettingsSectionHeader margin="mt-24 mb-6" size="sm">
        <Trans message="Screens" />
      </SettingsSectionHeader>
      {allScreens.map(item => (
        <ScreenEditorItem
          key={item}
          item={item}
          items={allScreens}
          onToggle={(item, checked) => {
            const savedValue = getSavedValue();
            const newValue = checked
              ? [...savedValue, item]
              : savedValue.filter(x => x !== item);
            form.setValue('client.chatWidget.screens', newValue, {
              shouldDirty: true,
            });
          }}
          onSortEnd={(oldIndex, newIndex) => {
            const sortedItems = moveItemInNewArray(
              allScreens,
              oldIndex,
              newIndex,
            );
            setAllScreens(sortedItems);
            const savedValue = getSavedValue();
            const newValue = sortedItems
              .filter(x => savedValue.includes(x))
              .map(x => x);
            form.setValue('client.chatWidget.screens', newValue, {
              shouldDirty: true,
            });
          }}
        />
      ))}
    </div>
  );
}

interface MenuListItemProps {
  item: string;
  items: string[];
  onSortEnd: (oldIndex: number, newIndex: number) => void;
  onToggle: (section: string, checked: boolean) => void;
}
function ScreenEditorItem({
  item,
  items,
  onToggle,
  onSortEnd,
}: MenuListItemProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const {watch} = useFormContext<AdminSettings>();
  const {sortableProps, dragHandleRef} = useSortable({
    item,
    items,
    type: 'widgetScreensSortable',
    ref,
    onSortEnd,
    strategy: 'liveSort',
  });

  const savedValue = watch('client.chatWidget.screens') || [];
  const isChecked = savedValue.includes(item);
  const label = widgetNavigationTabs.find(tab => tab.route === item)!.label;

  return (
    <SettingsSectionButton
      ref={ref}
      elementType="div"
      startIcon={
        <IconButton ref={dragHandleRef} size="sm">
          <DragIndicatorIcon className="text-muted hover:cursor-move" />
        </IconButton>
      }
      endIcon={
        <Checkbox
          checked={isChecked}
          onChange={() => onToggle(item, !isChecked)}
        />
      }
      {...sortableProps}
    >
      <Trans {...label} />
    </SettingsSectionButton>
  );
}
