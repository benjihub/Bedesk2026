import {CrupdateResourceSection} from '@common/admin/crupdate-resource-layout';
import {useAuth} from '@common/auth/use-auth';
import {useNormalizedModels} from '@common/ui/normalized-model/use-normalized-models';
import {Avatar} from '@ui/avatar/avatar';
import {FormChipField} from '@ui/forms/input-field/chip-field/form-chip-field';
import {Item} from '@ui/forms/listbox/item';
import {Trans} from '@ui/i18n/trans';
import {useState} from 'react';

interface Props {
  endpoint?: string;
}
export function UserRoleSection({endpoint}: Props) {
  const [query, setQuery] = useState('');
  const {data} = useNormalizedModels(endpoint ?? 'normalized-models/role', {
    query,
  });
  const {hasPermission} = useAuth();
  return (
    <CrupdateResourceSection label={<Trans message="Roles" />}>
      <FormChipField
        className="mb-30"
        name="roles"
        suggestions={data?.results}
        inputValue={query}
        onInputValueChange={setQuery}
        alwaysShowAvatar
        readOnly={!hasPermission('users.update')}
        description={
          <Trans message="User will inherit all permissions from the roles they are assigned." />
        }
      >
        {suggestion => (
          <Item
            key={suggestion.id}
            value={suggestion.id}
            startIcon={<Avatar label={suggestion.name} />}
          >
            {suggestion.name}
          </Item>
        )}
      </FormChipField>
    </CrupdateResourceSection>
  );
}
