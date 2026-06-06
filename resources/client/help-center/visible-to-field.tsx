import {RoleSelector} from '@app/help-center/role-selector';
import {Item} from '@ui/forms/listbox/item';
import {Trans} from '@ui/i18n/trans';
import {ReactNode} from 'react';

interface Props {
  className?: string;
  description?: ReactNode;
}
export function VisibleToField({className, description}: Props) {
  return (
    <RoleSelector
      className={className}
      name="visible_to_role"
      label={<Trans message="Visible to" />}
      description={description}
      defaultItem={
        <Item key="everyone-default" value="">
          <Trans message="Everyone" />
        </Item>
      }
    />
  );
}
