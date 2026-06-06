import {useSendAgentInvites} from '@app/dashboard/agents/invites/requests/use-send-agent-invites';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {useNavigate} from '@common/ui/navigation/use-navigate';
import {useQuery} from '@tanstack/react-query';
import {opacityAnimation} from '@ui/animation/opacity-animation';
import {Avatar} from '@ui/avatar/avatar';
import {Button} from '@ui/buttons/button';
import {Form} from '@ui/forms/form';
import {FormChipField} from '@ui/forms/input-field/chip-field/form-chip-field';
import {Item} from '@ui/forms/listbox/item';
import {FormSelect} from '@ui/forms/select/select';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {Dialog} from '@ui/overlays/dialog/dialog';
import {DialogBody} from '@ui/overlays/dialog/dialog-body';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {DialogFooter} from '@ui/overlays/dialog/dialog-footer';
import {DialogHeader} from '@ui/overlays/dialog/dialog-header';
import {Skeleton} from '@ui/skeleton/skeleton';
import {isEmail} from '@ui/utils/string/is-email';
import {AnimatePresence, m} from 'framer-motion';
import {ReactNode, useEffect, useRef} from 'react';
import {useForm} from 'react-hook-form';

interface FormValues {
  emails: string[];
  role_id: number | string;
  group_id: number | string;
}

export function InviteAgentsDialog() {
  const {trans} = useTrans();
  const {close, formId} = useDialogContext();
  const formResetRef = useRef(false);
  const suggestions = useRolesAndGroups();
  const sendInvites = useSendAgentInvites();
  const navigate = useNavigate();

  const form = useForm<FormValues>({
    defaultValues: {
      emails: [],
    },
  });

  useEffect(() => {
    if (suggestions && !formResetRef.current) {
      form.reset({
        emails: [],
        role_id: suggestions.defaultRoleId,
        group_id: suggestions.defaultGroupId,
      });
      formResetRef.current = true;
    }
  }, [suggestions, form]);

  return (
    <Dialog size="lg">
      <DialogHeader>
        <Trans message="Invite teammates" />
      </DialogHeader>
      <DialogBody>
        <Form
          id={formId}
          form={form}
          onSubmit={values =>
            sendInvites.mutate(values, {
              onSuccess: () => {
                close();
                navigate('../invites');
              },
            })
          }
        >
          <FormChipField
            label={<Trans message="Emails" />}
            name="emails"
            valueKey="name"
            validateWith={chip => {
              const invalid = !isEmail(chip.name);
              return {
                ...chip,
                invalid,
                errorMessage: invalid
                  ? trans({message: 'Not a valid email'})
                  : undefined,
              };
            }}
            placeholder={trans({
              message: 'Type or paste address and press enter',
            })}
          />
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
          disabled={!form.watch('emails').length || sendInvites.isPending}
        >
          <Trans message="Send invites" />
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
