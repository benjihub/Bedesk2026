import {commonAdminQueries} from '@common/admin/common-admin-queries';
import {mergeProps} from '@react-aria/utils';
import {useControlledState} from '@react-stately/utils';
import {useQuery} from '@tanstack/react-query';
import {Accordion, AccordionItem} from '@ui/accordion/accordion';
import {TextField} from '@ui/forms/input-field/text-field/text-field';
import {Switch} from '@ui/forms/toggle/switch';
import {Trans} from '@ui/i18n/trans';
import {DoneAllIcon} from '@ui/icons/material/DoneAll';
import {List, ListItem} from '@ui/list/list';
import {ucFirst} from '@ui/utils/string/uc-first';
import clsx from 'clsx';
import {produce} from 'immer';
import React, {Fragment} from 'react';
import {useController} from 'react-hook-form';
import {Permission, PermissionRestriction} from '../permission';

interface PermissionSelectorProps {
  value?: Permission[];
  onChange?: (value: Permission[]) => void;
  type?: string;
}
export const PermissionSelector = React.forwardRef<
  HTMLDivElement,
  PermissionSelectorProps
>(({type, ...props}, ref) => {
  const query = useQuery(commonAdminQueries.permissions.index());
  const permissions = query.data?.permissions;

  const [value, setValue] = useControlledState(props.value, [], props.onChange);

  if (!permissions) return null;

  const groupedPermissions = buildPermissionList(permissions, value, type);

  const onRestrictionChange = (newPermission: Permission) => {
    const newValue = [...value];
    const index = newValue.findIndex(p => p.id === newPermission.id);
    if (index > -1) {
      newValue.splice(index, 1, newPermission);
    }
    setValue(newValue);
  };

  return (
    <Fragment>
      <Accordion variant="outline" ref={ref}>
        {groupedPermissions.map(({groupName, items, anyChecked}) => (
          <AccordionItem
            label={<Trans message={prettyName(groupName)} />}
            key={groupName}
            startIcon={anyChecked ? <DoneAllIcon size="sm" /> : undefined}
          >
            <List>
              {items.map(permission => {
                const index = value.findIndex(v => v.id === permission.id);
                const isChecked = index > -1;

                return (
                  <div key={permission.id}>
                    <ListItem
                      onSelected={() => {
                        if (isChecked) {
                          const newValue = [...value];
                          newValue.splice(index, 1);
                          setValue(newValue);
                        } else {
                          setValue([...value, permission]);
                        }
                      }}
                      endSection={
                        <Switch
                          tabIndex={-1}
                          checked={isChecked}
                          onChange={() => {}}
                        />
                      }
                      description={<Trans message={permission.description} />}
                    >
                      <Trans message={permission.display_name} />
                    </ListItem>
                    {isChecked && (
                      <Restrictions
                        permission={permission}
                        onChange={onRestrictionChange}
                      />
                    )}
                  </div>
                );
              })}
            </List>
          </AccordionItem>
        ))}
      </Accordion>
    </Fragment>
  );
});

interface RestrictionsProps {
  permission: Permission;
  onChange?: (newPermission: Permission) => void;
}
function Restrictions({permission, onChange}: RestrictionsProps) {
  if (!permission?.restrictions?.length) return null;

  const setRestrictionValue = (
    name: string,
    value: PermissionRestriction['value'],
  ) => {
    const nextState = produce(permission, draftState => {
      const restriction = draftState.restrictions.find(r => r.name === name);
      if (restriction) {
        restriction.value = value;
      }
    });
    onChange?.(nextState);
  };

  return (
    <div className="px-40 py-20">
      {permission.restrictions.map((restriction, index) => {
        const isLast = index === permission.restrictions.length - 1;

        const name = (
          <Trans
            message={
              restriction.display_name
                ? restriction.display_name
                : prettyName(restriction.name)
            }
          />
        );
        const description = restriction.description ? (
          <Trans message={restriction.description} />
        ) : undefined;

        if (restriction.type === 'bool') {
          return (
            <Switch
              description={description}
              key={restriction.name}
              className={clsx(!isLast && 'mb-30')}
              checked={Boolean(restriction.value)}
              onChange={e => {
                setRestrictionValue(restriction.name, e.target.checked);
              }}
            >
              {name}
            </Switch>
          );
        }

        return (
          <TextField
            size="sm"
            label={name}
            description={description}
            type="number"
            key={restriction.name}
            className={clsx(!isLast && 'mb-30')}
            value={(restriction.value as string) || ''}
            onChange={e => {
              setRestrictionValue(
                restriction.name,
                e.target.value === '' ? undefined : parseInt(e.target.value),
              );
            }}
          />
        );
      })}
    </div>
  );
}

export type FormChipFieldProps = PermissionSelectorProps & {
  name: string;
};
export function FormPermissionSelector(props: FormChipFieldProps) {
  const {
    field: {onChange, value = [], ref},
  } = useController({
    name: props.name,
  });

  const formProps: Partial<PermissionSelectorProps> = {
    onChange,
    value,
  };

  return <PermissionSelector ref={ref} {...mergeProps(formProps, props)} />;
}

export const prettyName = (name: string) => {
  return ucFirst(name.replace('_', ' '));
};

interface PermissionGroup {
  groupName: string;
  anyChecked: boolean;
  items: Permission[];
}

// merge "restrictions" from selected value into all permissions to make
// it easier to bind restriction values to form inputs
export function buildPermissionList(
  allPermissions: Permission[],
  selectedPermissions: Permission[],
  type: string = 'users',
) {
  const groupedPermissions: PermissionGroup[] = [];

  allPermissions.forEach(permission => {
    const permissionType = permission.type || 'users';
    if (permissionType !== type) return;

    let group = groupedPermissions.find(g => g.groupName === permission.group);
    if (!group) {
      group = {groupName: permission.group, anyChecked: false, items: []};
      groupedPermissions.push(group);
    }

    const index = selectedPermissions.findIndex(p => p.id === permission.id);
    if (index > -1) {
      const mergedPermission = {
        ...permission,
        restrictions: mergeRestrictions(
          permission.restrictions,
          selectedPermissions[index].restrictions,
        ),
      };
      group.anyChecked = true;
      group.items.push(mergedPermission);
    } else {
      group.items.push(permission);
    }
  });

  return groupedPermissions;
}

function mergeRestrictions(
  allRestrictions: PermissionRestriction[],
  selectedRestrictions: PermissionRestriction[],
): PermissionRestriction[] {
  return allRestrictions?.map(restriction => {
    const selected = selectedRestrictions?.find(
      r => r.name === restriction.name,
    );
    if (selected) {
      return {...restriction, value: selected.value};
    } else {
      return restriction;
    }
  });
}
