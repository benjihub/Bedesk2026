import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {useQuery} from '@tanstack/react-query';
import {Item} from '@ui/forms/listbox/item';
import {FormSelect} from '@ui/forms/select/select';
import {Trans} from '@ui/i18n/trans';
import clsx from 'clsx';
import {ReactNode} from 'react';

interface Props {
  name: string;
  label: ReactNode;
  description?: ReactNode;
  className?: string;
  defaultItem?: ReactNode;
}
export function RoleSelector({
  name,
  label,
  description,
  className,
  defaultItem,
}: Props) {
  const {data} = useQuery(helpdeskQueries.roles.normalizedList('all'));
  const roles = data?.roles || [];

  if (!roles.length) return <div className={clsx(className, 'h-92')} />;

  return (
    <FormSelect
      background="bg"
      label={label}
      name={name}
      description={description}
      className={className}
      selectionMode="single"
    >
      {defaultItem}
      {roles.map(role => (
        <Item value={role.id} key={role.id} capitalizeFirst>
          <Trans message={role.name} />
        </Item>
      ))}
    </FormSelect>
  );
}
