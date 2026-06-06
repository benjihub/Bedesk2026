import {RoleSelector} from '@app/help-center/role-selector';
import {Item} from '@ui/forms/listbox/item';
import {Trans} from '@ui/i18n/trans';
import {ReactNode} from 'react';

interface Props {
  className?: string;
  description?: ReactNode;
}
export function ManagedByField({className, description}: Props) {
  return (
    <RoleSelector
      className={className}
      name="managed_by_role"
      label={<Trans message="Managed by" />}
      description={description}
      defaultItem={
        <Item key="anyone-default" value="">
          <Trans message="Anyone with permissions" />
        </Item>
      }
    />
  );
}
