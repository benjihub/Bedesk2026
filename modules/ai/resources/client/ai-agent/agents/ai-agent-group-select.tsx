import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {useQuery} from '@tanstack/react-query';
import {Item} from '@ui/forms/listbox/item';
import {FormSelect} from '@ui/forms/select/select';
import {Trans} from '@ui/i18n/trans';
import {ProgressCircle} from '@ui/progress/progress-circle';

type Props = {
  name?: string;
  className?: string;
  allowGlobal?: boolean;
};

export function AiAgentGroupSelectField({
  name = 'groupId',
  className,
  allowGlobal = true,
}: Props) {
  const query = useQuery(helpdeskQueries.groups.normalizedList);

  if (!query.data) {
    return (
      <div className={className ?? 'mb-16 flex h-44 items-center justify-center'}>
        <ProgressCircle isIndeterminate size="sm" />
      </div>
    );
  }

  return (
    <FormSelect
      size="sm"
      selectionMode="single"
      name={name}
      label={<Trans message="Group" />}
      className={className}
    >
      {allowGlobal ? (
        <Item value="">
          <Trans message="Global" />
        </Item>
      ) : null}
      {query.data.groups?.map(group => (
        <Item key={group.id} value={`${group.id}`}>
          {group.name}
        </Item>
      ))}
    </FormSelect>
  );
}