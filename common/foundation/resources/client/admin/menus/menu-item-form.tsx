import {commonAdminQueries} from '@common/admin/common-admin-queries';
import {
  buildPermissionList,
  prettyName,
} from '@common/auth/ui/permission-selector';
import {MenuItemConfig} from '@common/menus/menu-config';
import {useQuery} from '@tanstack/react-query';
import {ButtonBaseProps} from '@ui/buttons/button-base';
import {IconButton} from '@ui/buttons/icon-button';
import {FormChipField} from '@ui/forms/input-field/chip-field/form-chip-field';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {Item} from '@ui/forms/listbox/item';
import {Section} from '@ui/forms/listbox/section';
import {FormSelect, Option} from '@ui/forms/select/select';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {createSvgIconFromTree, IconTree} from '@ui/icons/create-svg-icon';
import {EditIcon} from '@ui/icons/material/Edit';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {useSettings} from '@ui/settings/use-settings';
import {usePrevious} from '@ui/utils/hooks/use-previous';
import {Fragment, ReactNode, useEffect, useMemo} from 'react';
import {useFormContext} from 'react-hook-form';
import {useValueLists} from '../../http/value-lists';
import {IconPickerDialog} from '../../ui/icon-picker/icon-picker-dialog';
import {useAvailableRoutes} from '../settings/pages/menu-settings/use-available-routes';

interface NameProps {
  prefixName: (name: string) => string;
}

interface MenuItemFormProps {
  formPathPrefix?: string;
  hideRoleAndPermissionFields?: boolean;
  children?: ReactNode;
}
export function MenuItemForm({
  formPathPrefix,
  hideRoleAndPermissionFields,
  children,
}: MenuItemFormProps) {
  const {trans} = useTrans();
  const prefixName = (name: string): string => {
    return formPathPrefix ? `${formPathPrefix}.${name}` : name;
  };

  return (
    <Fragment>
      <FormTextField
        className="mb-20"
        name={prefixName('label')}
        label={<Trans message="Label" />}
        placeholder={trans(message('No label...'))}
        startAppend={<IconDialogTrigger prefixName={prefixName} />}
      />
      {children}
      <DestinationSelector prefixName={prefixName} />
      <TargetSelect prefixName={prefixName} />
      {!hideRoleAndPermissionFields && (
        <Fragment>
          <RoleSelector prefixName={prefixName} />
          <PermissionSelector prefixName={prefixName} />
          <SubscriptionStatusSelector prefixName={prefixName} />
        </Fragment>
      )}
    </Fragment>
  );
}

interface IconDialogTriggerProps extends ButtonBaseProps, NameProps {}
function IconDialogTrigger({
  prefixName,
  ...buttonProps
}: IconDialogTriggerProps) {
  const {watch, setValue} = useFormContext<MenuItemConfig>();
  const fieldName = prefixName('icon') as 'icon';
  const watchedItemIcon = watch(fieldName);
  const Icon = watchedItemIcon && createSvgIconFromTree(watchedItemIcon);
  return (
    <DialogTrigger
      type="modal"
      onClose={(iconTree?: IconTree[] | null) => {
        // null will be set explicitly if icon is cleared via icon picker
        if (iconTree || iconTree === null) {
          setValue(fieldName, iconTree, {
            shouldDirty: true,
          });
        }
      }}
    >
      <IconButton
        className="text-muted icon-sm"
        variant="outline"
        size="md"
        {...buttonProps}
      >
        {Icon ? <Icon /> : <EditIcon />}
      </IconButton>
      <IconPickerDialog />
    </DialogTrigger>
  );
}

function DestinationSelector({prefixName}: NameProps) {
  const form = useFormContext<MenuItemConfig>();
  const currentType = form.watch(prefixName('type') as 'type');
  const previousType = usePrevious(currentType);
  const {data} = useValueLists(['menuItemCategories']);
  const categories = data?.menuItemCategories || [];
  const selectedCategory = categories.find(c => c.type === currentType);
  const {trans} = useTrans();
  const routeItems = useAvailableRoutes();

  // clear "action" field when "type" field changes
  useEffect(() => {
    if (
      previousType &&
      previousType !== currentType &&
      form.getValues(prefixName('type') as 'type')
    ) {
      form.setValue(prefixName('action') as 'action', '');
    }
  }, [currentType, previousType, form, prefixName]);

  return (
    <Fragment>
      <FormSelect
        className="mb-20"
        name={prefixName('type')}
        selectionMode="single"
        label={<Trans message="Link type" />}
      >
        <Option value="link">
          <Trans message="External link" />
        </Option>
        <Option value="route">
          <Trans message="Site page" />
        </Option>
        {categories.map(category => (
          <Option key={category.type} value={category.type}>
            {category.name}
          </Option>
        ))}
      </FormSelect>
      {currentType === 'link' && (
        <FormTextField
          className="mb-20"
          required
          type="url"
          name={prefixName('action')}
          placeholder={trans({message: 'Enter a url...'})}
          label={<Trans message="Url" />}
        />
      )}
      {currentType === 'route' && (
        <FormSelect
          className="mb-20"
          required
          items={routeItems}
          name={prefixName('action')}
          label={<Trans message="Page" />}
          searchPlaceholder={trans(message('Search pages'))}
          showSearchField
          selectionMode="single"
        >
          {item => (
            <Item value={item.id} key={item.id}>
              {item.label}
            </Item>
          )}
        </FormSelect>
      )}
      {selectedCategory && (
        <FormSelect
          className="mb-20"
          required
          items={selectedCategory.items}
          name={prefixName('action')}
          showSearchField
          searchPlaceholder={trans(message('Search...'))}
          selectionMode="single"
          label={<Trans message={selectedCategory.name} />}
        >
          {item => (
            <Item value={item.action}>
              <Trans message={item.label} />
            </Item>
          )}
        </FormSelect>
      )}
    </Fragment>
  );
}

function RoleSelector({prefixName}: NameProps) {
  const {data} = useValueLists(['roles']);
  const roles = data?.roles || [];
  const {trans} = useTrans();

  return (
    <FormChipField
      className="my-20"
      placeholder={trans({message: 'Add role...'})}
      label={<Trans message="Only show if user has role" />}
      name={prefixName('roles')}
      chipSize="sm"
      suggestions={roles}
      valueKey="id"
      displayWith={c => roles.find(r => r.id === c.id)?.name}
    >
      {role => (
        <Item value={role.id} key={role.id} capitalizeFirst>
          <Trans message={role.name} />
        </Item>
      )}
    </FormChipField>
  );
}

function PermissionSelector({prefixName}: NameProps) {
  const permissionQuery = useQuery(commonAdminQueries.permissions.index());
  const {trans} = useTrans();

  const groupedPermissions = useMemo(() => {
    return buildPermissionList(permissionQuery.data?.permissions || [], []);
  }, [permissionQuery.data?.permissions]);

  return (
    <FormChipField
      label={<Trans message="Only show if user has permissions" />}
      placeholder={trans({message: 'Add permission...'})}
      chipSize="sm"
      suggestions={groupedPermissions}
      name={prefixName('permissions')}
      valueKey="name"
    >
      {({groupName, items}) => (
        <Section label={prettyName(groupName)} key={groupName}>
          {items.map(permission => (
            <Item
              key={permission.name}
              value={permission.name}
              description={<Trans message={permission.description} />}
            >
              <Trans message={permission.display_name || permission.name} />
            </Item>
          ))}
        </Section>
      )}
    </FormChipField>
  );
}

function SubscriptionStatusSelector({prefixName}: NameProps) {
  const {billing} = useSettings();
  if (!billing.enable) return null;
  return (
    <FormSelect
      selectionMode="single"
      className="mt-20"
      label={<Trans message="Subscription status" />}
      name={prefixName('subscriptionStatus')}
    >
      <Item value="subscribed">
        <Trans message="Only show if user is subscribed" />
      </Item>
      <Item value="unsubscribed">
        <Trans message="Only show if user is not subscribed" />
      </Item>
      <Item value={null}>
        <Trans message="Always show" />
      </Item>
    </FormSelect>
  );
}

function TargetSelect({prefixName}: NameProps) {
  return (
    <FormSelect
      className="mt-20"
      selectionMode="single"
      name={prefixName('target')}
      label={<Trans message="Open link in" />}
    >
      <Option value="_self">
        <Trans message="Same window" />
      </Option>
      <Option value="_blank">
        <Trans message="New window" />
      </Option>
    </FormSelect>
  );
}
