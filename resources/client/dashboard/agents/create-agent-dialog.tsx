import {useCreateAgent} from '@app/dashboard/agents/requests/use-create-agent';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {useQuery} from '@tanstack/react-query';
import {opacityAnimation} from '@ui/animation/opacity-animation';
import {Avatar} from '@ui/avatar/avatar';
import {Button} from '@ui/buttons/button';
import {Form} from '@ui/forms/form';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {Item} from '@ui/forms/listbox/item';
import {FormSelect} from '@ui/forms/select/select';
import {Trans} from '@ui/i18n/trans';
import {Dialog} from '@ui/overlays/dialog/dialog';
import {DialogBody} from '@ui/overlays/dialog/dialog-body';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {DialogFooter} from '@ui/overlays/dialog/dialog-footer';
import {DialogHeader} from '@ui/overlays/dialog/dialog-header';
import {Skeleton} from '@ui/skeleton/skeleton';
import {AnimatePresence, m} from 'framer-motion';
import {ReactNode, useEffect, useRef} from 'react';
import {useForm} from 'react-hook-form';

interface FormValues {
  name: string;
  email: string;
  password: string;
  role_id: number | string;
  group_id: number | string;
}

export function CreateAgentDialog() {
  const {close, formId} = useDialogContext();
  const formResetRef = useRef(false);
  const suggestions = useRolesAndGroups();
  const createAgent = useCreateAgent();

  const form = useForm<FormValues>({
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    if (suggestions && !formResetRef.current) {
      form.reset({
        name: '',
        email: '',
        password: '',
        role_id: suggestions.defaultRoleId,
        group_id: suggestions.defaultGroupId,
      });
      formResetRef.current = true;
    }
  }, [suggestions, form]);

  return (
    <Dialog size="lg">
      <DialogHeader>
        <Trans message="Create agent" />
      </DialogHeader>
      <DialogBody>
        <Form
          id={formId}
          form={form}
          onSubmit={values =>
            createAgent.mutate(values, {
              onSuccess: r => {
                close();
              },
            })
          }
        >
          <div className="grid grid-cols-1 gap-16">
            <FormTextField name="name" label={<Trans message="Name" />} />
            <FormTextField
              name="email"
              type="email"
              label={<Trans message="Email" />}
            />
            <FormTextField
              name="password"
              type="password"
              autoComplete="new-password"
              label={<Trans message="Password" />}
            />
          </div>

          <AnimatePresence initial={false} mode="wait">
            {suggestions ? (
              <RoleAndGroupSelects
                roles={suggestions.roles}
                groups={suggestions.groups}
              />
            ) : (
              <RoleAndGroupSkeleton />
            )}
          </AnimatePresence>
        </Form>
      </DialogBody>
      <DialogFooter>
        <Button onClick={() => close()}>
          <Trans message="Cancel" />
        </Button>
        <Button
          variant="flat"
          color="primary"
          type="submit"
          form={formId}
          disabled={createAgent.isPending}
        >
          <Trans message="Create" />
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

interface RoleAndGroupSelectsProps {
  roles: {id: number; name: string}[];
  groups: {id: number; name: string}[];
}
function RoleAndGroupSelects({roles, groups}: RoleAndGroupSelectsProps) {
  return (
    <SelectsContainer animationKey="real-selects">
      <FormSelect
        name="role_id"
        selectionMode="single"
        label={<Trans message="Role" />}
        size="sm"
        className="flex-auto"
      >
        {roles.map(role => (
          <Item
            key={role.id}
            value={role.id}
            startIcon={<Avatar label={role.name} size="sm" />}
            capitalizeFirst
          >
            <Trans message={role.name} />
          </Item>
        ))}
      </FormSelect>
      <FormSelect
        name="group_id"
        selectionMode="single"
        label={<Trans message="Group" />}
        size="sm"
        className="flex-auto"
      >
        {groups.map(group => (
          <Item
            key={group.id}
            value={group.id}
            startIcon={<Avatar label={group.name} size="sm" />}
            capitalizeFirst
          >
            <Trans message={group.name} />
          </Item>
        ))}
      </FormSelect>
    </SelectsContainer>
  );
}

interface SelectsContainerProps {
  children: ReactNode;
  animationKey: string;
}
function SelectsContainer({children, animationKey}: SelectsContainerProps) {
  return (
    <m.div
      key={animationKey}
      {...opacityAnimation}
      className="mt-16 flex items-center gap-12"
    >
      {children}
    </m.div>
  );
}

function RoleAndGroupSkeleton() {
  return (
    <SelectsContainer animationKey="select-skeletons">
      <SelectSkeleton key="skeleton-one" />
      <SelectSkeleton key="skeleton-two" />
    </SelectsContainer>
  );
}

function SelectSkeleton() {
  return (
    <div className="flex-auto">
      <Skeleton className="mb-4 max-w-40" />
      <Skeleton variant="rect" size="h-36 w-full" />
    </div>
  );
}

function useRolesAndGroups() {
  const roleQuery = useQuery(helpdeskQueries.roles.normalizedList('agents'));
  const groupQuery = useQuery(helpdeskQueries.groups.normalizedList);

  if (!roleQuery.data || !groupQuery.data) {
    return null;
  }

  return {
    roles: roleQuery.data.roles,
    groups: groupQuery.data.groups,
    defaultRoleId: roleQuery.data.defaultRoleId,
    defaultGroupId: groupQuery.data.defaultGroupId,
  };
}
