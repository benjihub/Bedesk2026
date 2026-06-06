import {AdminDocsUrls} from '@app/admin/admin-config';
import {commonAdminQueries} from '@common/admin/common-admin-queries';
import {MenuItemForm} from '@common/admin/menus/menu-item-form';
import {AdminSettings} from '@common/admin/settings/admin-settings';
import {useSettingsPageStore} from '@common/admin/settings/layout/settings-page-store';
import {SettingsSectionButton} from '@common/admin/settings/layout/settings-section-button';
import {SettingsWithPreview} from '@common/admin/settings/layout/settings-with-preview';
import {AddMenuItemDialog} from '@common/admin/settings/pages/menu-settings/add-menu-item-dialog';
import dropdownMenu from '@common/admin/settings/pages/menu-settings/dropdown-menu.svg';
import {useAdminSettings} from '@common/admin/settings/requests/use-admin-settings';
import {MenuItemConfig} from '@common/menus/menu-config';
import {useSuspenseQuery} from '@tanstack/react-query';
import {Accordion, AccordionItem} from '@ui/accordion/accordion';
import {Button} from '@ui/buttons/button';
import {FormChipField} from '@ui/forms/input-field/chip-field/form-chip-field';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {Item} from '@ui/forms/listbox/item';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {createSvgIconFromTree} from '@ui/icons/create-svg-icon';
import {AddIcon} from '@ui/icons/material/Add';
import {ArrowRightIcon} from '@ui/icons/material/ArrowRight';
import {DeleteIcon} from '@ui/icons/material/Delete';
import {DragIndicatorIcon} from '@ui/icons/material/DragIndicator';
import {IllustratedMessage} from '@ui/images/illustrated-message';
import {SvgImage} from '@ui/images/svg-image';
import {
  useSortable,
  UseSortableProps,
} from '@ui/interactions/dnd/sortable/use-sortable';
import {ConfirmationDialog} from '@ui/overlays/dialog/confirmation-dialog';
import {Dialog} from '@ui/overlays/dialog/dialog';
import {DialogBody} from '@ui/overlays/dialog/dialog-body';
import {DialogHeader} from '@ui/overlays/dialog/dialog-header';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {moveItemInNewArray} from '@ui/utils/array/move-item-in-new-array';
import {nanoid} from 'nanoid';
import {Fragment, useCallback, useRef, useState} from 'react';
import {
  FieldArrayWithId,
  useFieldArray,
  useForm,
  useFormContext,
  useWatch,
} from 'react-hook-form';

export function Component() {
  const {trans} = useTrans();
  const {data} = useAdminSettings();

  const form = useForm<AdminSettings>({
    defaultValues: {
      client: {
        menus: data?.client.menus ?? [],
      },
    },
  });

  return (
    <SettingsWithPreview
      title={<Trans message="Menus" />}
      defaultRoute="/"
      docsLink={AdminDocsUrls.settings.menus}
    >
      <SettingsWithPreview.Content>
        <SettingsWithPreview.Form form={form}>
          <div className="mb-12">
            <Button
              variant="outline"
              color="primary"
              startIcon={<AddIcon />}
              size="xs"
              onClick={() => {
                const id = nanoid(10);

                form.setValue(
                  'client.menus',
                  [
                    ...form.getValues('client.menus'),
                    {
                      name: trans(
                        message('New menu :number', {
                          values: {
                            number: form.getValues('client.menus').length + 1,
                          },
                        }),
                      ),
                      id,
                      positions: [],
                      items: [],
                    },
                  ],
                  {shouldDirty: true},
                );
              }}
            >
              <Trans message="Add new menu" />
            </Button>
          </div>
          <MenuList />
        </SettingsWithPreview.Form>
      </SettingsWithPreview.Content>
      <SettingsWithPreview.Preview />
    </SettingsWithPreview>
  );
}

function useSyncPreviewRouteWithActiveMenu() {
  const form = useFormContext<AdminSettings>();
  const setPreviewRoute = useSettingsPageStore(s => s.setPreviewRoute);
  const {
    data: {config},
  } = useSuspenseQuery(commonAdminQueries.settings.menuEditorConfig());

  return useCallback((menuId: string | number | null) => {
    const menu = form.getValues('client.menus').find(m => m.id === menuId);
    if (menu) {
      menu.positions.forEach(positionName => {
        const position = config.positions.find(r => r.name === positionName);
        if (position) {
          setPreviewRoute(position.route);
        }
      });
    } else {
      setPreviewRoute('/');
    }
  }, []);
}

function MenuList() {
  const syncPreviewRouteWithActiveMenu = useSyncPreviewRouteWithActiveMenu();

  const form = useFormContext<AdminSettings>();
  const {fields} = useFieldArray({
    control: form.control,
    name: 'client.menus',
    keyName: 'key',
  });

  return (
    <Accordion
      variant="outline"
      size="lg"
      onExpandedChange={([menuId]) => {
        syncPreviewRouteWithActiveMenu(menuId);
      }}
    >
      {fields.map((menu, index) => (
        <AccordionItem key={menu.key} label={menu.name} value={menu.id}>
          <MenuEditor id={menu.id} index={index} />
        </AccordionItem>
      ))}
    </Accordion>
  );
}

interface MenuEditorProps {
  id: string;
  index: number;
}
function MenuEditor({id, index}: MenuEditorProps) {
  const syncPreviewRouteWithActiveMenu = useSyncPreviewRouteWithActiveMenu();
  const {data} = useSuspenseQuery(
    commonAdminQueries.settings.menuEditorConfig(),
  );
  const menuFormPath = `client.menus.${index}` as const;

  return (
    <Fragment>
      <div className="mb-30 border-b pb-30">
        <FormTextField
          name={`${menuFormPath}.name`}
          label={<Trans message="Name" />}
          className="mb-20"
          autoFocus
        />
        <FormChipField
          chipSize="sm"
          name={`${menuFormPath}.positions`}
          valueKey="id"
          label={<Trans message="Where should this menu appear on the site?" />}
          onChange={() => {
            syncPreviewRouteWithActiveMenu(id);
          }}
        >
          {data.config.positions.map(position => (
            <Item key={position.name} value={position.name}>
              {position.label}
            </Item>
          ))}
        </FormChipField>
      </div>
      <MenuItemsManager formPath={`${menuFormPath}.items`} />
      <div className="mt-24 text-right">
        <DeleteMenuTrigger menuId={id} />
      </div>
    </Fragment>
  );
}

interface MenuItemsManagerProps {
  formPath: string;
}
export function MenuItemsManager({formPath}: MenuItemsManagerProps) {
  const typedFormPath = formPath as `client.menus.${number}.items`;
  const form = useFormContext<AdminSettings>();
  const items =
    useWatch({
      control: form.control,
      name: formPath as `client.menus.${number}.items`,
    }) ?? [];

  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(
    null,
  );

  return (
    <Fragment>
      <div className="flex flex-shrink-0 items-center justify-between gap-16">
        <Trans message="Menu items" />
        <DialogTrigger
          type="drawer"
          placement="right"
          onClose={(menuItemConfig?: MenuItemConfig) => {
            if (menuItemConfig) {
              form.setValue(typedFormPath, [...items, menuItemConfig], {
                shouldDirty: true,
              });
            }
          }}
        >
          <Button color="primary" size="xs" startIcon={<AddIcon />}>
            <Trans message="Add" />
          </Button>
          <AddMenuItemDialog />
        </DialogTrigger>
      </div>
      <div className="mt-12 flex-shrink-0">
        {items.map((item, index) => (
          <MenuListItem
            key={item.id}
            item={item}
            items={items}
            onClick={() => setSelectedItemIndex(index)}
            onSortEnd={(oldIndex, newIndex) => {
              form.setValue(
                typedFormPath,
                moveItemInNewArray(items, oldIndex, newIndex),
                {shouldDirty: true},
              );
            }}
          />
        ))}
        {!items.length ? (
          <IllustratedMessage
            size="xs"
            className="my-40"
            image={<SvgImage src={dropdownMenu} />}
            title={<Trans message="No menu items yet" />}
            description={
              <Trans message="Click “add“ button to start adding links, pages, routes and other items to this menu. " />
            }
          />
        ) : null}
      </div>
      <DialogTrigger
        isOpen={selectedItemIndex !== null}
        type="drawer"
        onClose={() => setSelectedItemIndex(null)}
      >
        <Dialog>
          <DialogHeader
            rightAdornment={
              <Button
                variant="outline"
                size="xs"
                onClick={() => setSelectedItemIndex(null)}
              >
                <Trans message="Save & close" />
              </Button>
            }
          >
            <Trans message="Edit menu item" />
          </DialogHeader>
          <DialogBody>
            <MenuItemForm formPathPrefix={`${formPath}.${selectedItemIndex}`} />
            <div className="mt-24 text-right">
              <DeleteMenuItemTrigger
                itemsPath={formPath}
                itemIndex={selectedItemIndex!}
                onDelete={() => setSelectedItemIndex(null)}
              />
            </div>
          </DialogBody>
        </Dialog>
      </DialogTrigger>
    </Fragment>
  );
}

interface DeleteMenuTriggerProps {
  menuId: string;
}
function DeleteMenuTrigger({menuId}: DeleteMenuTriggerProps) {
  const form = useFormContext<AdminSettings>();
  const name = `client.menus` as const;
  const menus = useWatch({
    control: form.control,
    name,
  });
  const menu = menus.find(m => m.id === menuId);

  if (!menu) {
    return null;
  }

  return (
    <DialogTrigger
      type="modal"
      onClose={isConfirmed => {
        if (isConfirmed) {
          form.setValue(
            name,
            menus.filter(m => m.id !== menuId),
            {
              shouldDirty: true,
            },
          );
        }
      }}
    >
      <Button color="danger" size="xs">
        <Trans message="Delete menu" />
      </Button>
      <ConfirmationDialog
        isDanger
        title={<Trans message="Delete menu" />}
        body={
          <Trans
            message="Are you sure you want to delete “:name“?"
            values={{name: menu.name}}
          />
        }
        confirm={<Trans message="Delete" />}
      />
    </DialogTrigger>
  );
}

interface MenuListItemProps {
  item: MenuItemConfig;
  items: FieldArrayWithId[];
  onSortEnd: UseSortableProps['onSortEnd'];
  onClick: () => void;
}
function MenuListItem({item, items, onSortEnd, onClick}: MenuListItemProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const {sortableProps, dragHandleRef} = useSortable({
    item,
    items,
    type: 'menuEditorSortable',
    ref,
    onSortEnd,
    strategy: 'liveSort',
  });

  const Icon = item.icon && createSvgIconFromTree(item.icon);
  const iconOnlyLabel = (
    <div className="flex items-center gap-4 text-xs text-muted">
      {Icon && <Icon size="sm" />}
      (<Trans message="No label..." />)
    </div>
  );

  return (
    <Fragment>
      <SettingsSectionButton
        ref={ref}
        {...sortableProps}
        onClick={onClick}
        endIcon={<ArrowRightIcon className="text-muted" />}
      >
        <div className="flex items-center gap-10">
          <div
            className="flex h-36 w-36 items-center justify-center"
            ref={dragHandleRef}
          >
            <DragIndicatorIcon
              size="sm"
              className="text-muted hover:cursor-move"
            />
          </div>
          <div>{item.label || iconOnlyLabel}</div>
        </div>
      </SettingsSectionButton>
    </Fragment>
  );
}

interface DeleteMenuItemTriggerProps {
  itemsPath: string;
  itemIndex: number;
  onDelete: () => void;
}
function DeleteMenuItemTrigger({
  itemsPath,
  itemIndex,
  onDelete,
}: DeleteMenuItemTriggerProps) {
  const {fields} = useFieldArray({
    name: itemsPath,
  });
  const {setValue, getValues} = useFormContext();

  const item = fields[+itemIndex] as MenuItemConfig;

  if (!item) return null;

  return (
    <DialogTrigger
      type="modal"
      onClose={isConfirmed => {
        if (isConfirmed && itemIndex > -1) {
          const currentItems = getValues(itemsPath) as MenuItemConfig[];
          setValue(
            itemsPath,
            currentItems.filter((_, i) => i !== +itemIndex),
            {shouldDirty: true},
          );
          onDelete();
        }
      }}
    >
      <Button
        variant="outline"
        color="danger"
        size="xs"
        startIcon={<DeleteIcon />}
      >
        <Trans message="Delete this item" />
      </Button>
      <ConfirmationDialog
        isDanger
        title={<Trans message="Delete item" />}
        body={
          <Trans
            message="Are you sure you want to delete “:name“?"
            values={{name: item.label}}
          />
        }
        confirm={<Trans message="Delete" />}
      />
    </DialogTrigger>
  );
}
