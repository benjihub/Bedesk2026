import {Role} from '@common/auth/role';
import {FormPermissionSelector} from '@common/auth/ui/permission-selector';
import {SiteConfigContext} from '@common/core/settings/site-config-context';
import {SectionHelper} from '@common/ui/other/section-helper';
import {Button} from '@ui/buttons/button';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {Item} from '@ui/forms/listbox/item';
import {FormSelect} from '@ui/forms/select/select';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {useContext} from 'react';
import {useFormContext} from 'react-hook-form';
import {useSearchParams} from 'react-router';

export function Component() {
  const {trans} = useTrans();
  const [searchParams] = useSearchParams();
  const {watch, setValue} = useFormContext<Role>();
  const watchedType = watch('type');
  const isDefault = watch('default');
  const isInternal = watch('internal');
  const isGuests = watch('guests');

  const siteConfig = useContext(SiteConfigContext);
  const roleTypes = siteConfig.roles?.types ?? [];
  const typeConfig = roleTypes.find(type => type.type === watchedType);
  const permissionType = typeConfig?.permission_type ?? 'users';

  return (
    <>
      <FormTextField
        label={<Trans message="Name" />}
        name="name"
        className="mb-20"
        required
      />
      <FormTextField
        label={<Trans message="Description" />}
        name="description"
        inputElementType="textarea"
        placeholder={trans(message('Role description...'))}
        rows={4}
        className="mb-20"
      />
      {roleTypes.length && !searchParams.get('type') ? (
        <FormSelect
          label={<Trans message="Type" />}
          name="type"
          selectionMode="single"
          className="mb-20"
          description={
            <Trans message="Whether this role will be assigned to users globally on the site or only within workspaces." />
          }
        >
          {roleTypes.map(type => (
            <Item key={type.type} value={type.type}>
              <Trans {...type.label} />
            </Item>
          ))}
        </FormSelect>
      ) : null}
      {isInternal && isDefault && (
        <SectionHelper
          title={<Trans message="Default role" />}
          description={
            <Trans message="This role will be assigned to new users, if they have no other roles." />
          }
        />
      )}
      {isInternal && isGuests && (
        <SectionHelper
          title={<Trans message="Guests role" />}
          description={
            <Trans message="Non logged in users will be assigned this role." />
          }
        />
      )}
      <div className="mb-14 mt-30 flex items-end justify-between gap-12">
        <h2 className="text-lg font-medium">
          <Trans message="Permissions" />
        </h2>
        <Button
          variant="outline"
          size="xs"
          onClick={() => setValue('permissions', [])}
        >
          <Trans message="Remove all" />
        </Button>
      </div>
      <FormPermissionSelector name="permissions" type={permissionType} />
    </>
  );
}
