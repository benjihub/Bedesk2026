import {AttributeInputRenderer} from '@app/attributes/rendering/attribute-input-renderer';
import {getDefaultValuesForFormWithAttributes} from '@app/attributes/utils/get-default-values-for-form-with-attributes';
import {CustomerProfile} from '@app/dashboard/contacts/customer-profile-page/customer-profile';
import {
  DetailsList,
  DetailsListItem,
} from '@app/dashboard/conversations/conversation-page/details-sidebar/details-list';
import {PageVisitsPanel} from '@app/dashboard/conversations/conversation-page/details-sidebar/page-visists-panel';
import {TechnologyPanel} from '@app/dashboard/conversations/conversation-page/details-sidebar/technology-panel';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {useIsModuleInstalledAndSetup} from '@app/use-is-module-installed';
import {DirtyFormSaveDrawer} from '@common/admin/crupdate-resource-layout';
import {DatatablePageHeaderBar} from '@common/datatable/page/datatable-page-with-header-layout';
import {onFormQueryError} from '@common/errors/on-form-query-error';
import {apiClient, queryClient} from '@common/http/query-client';
import {ManageTagsDialog} from '@common/tags/manage-tags-dialog';
import {DashboardLayoutContext} from '@common/ui/dashboard-layout/dashboard-layout-context';
import {useRequiredParams} from '@common/ui/navigation/use-required-params';
import {EnvatoPurchaseList} from '@envato/envato-purchase-list/envato-purchase-list';
import {useMutation, useQuery, useSuspenseQuery} from '@tanstack/react-query';
import {
  Accordion,
  AccordionItem,
  AccordionItemProps,
} from '@ui/accordion/accordion';
import {Button} from '@ui/buttons/button';
import {IconButton} from '@ui/buttons/icon-button';
import {Form} from '@ui/forms/form';
import {Chip} from '@ui/forms/input-field/chip-field/chip';
import {ChipList} from '@ui/forms/input-field/chip-field/chip-list';
import {
  FormTextField,
  TextField,
} from '@ui/forms/input-field/text-field/text-field';
import {Item} from '@ui/forms/listbox/item';
import {Section} from '@ui/forms/listbox/section';
import {FormSelect} from '@ui/forms/select/select';
import {FormattedRelativeTime} from '@ui/i18n/formatted-relative-time';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {AddIcon} from '@ui/icons/material/Add';
import {ToggleRightSidebarIcon} from '@ui/icons/toggle-right-sidebar-icon';
import {Dialog} from '@ui/overlays/dialog/dialog';
import {DialogBody} from '@ui/overlays/dialog/dialog-body';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {DialogFooter} from '@ui/overlays/dialog/dialog-footer';
import {DialogHeader} from '@ui/overlays/dialog/dialog-header';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {ProgressCircle} from '@ui/progress/progress-circle';
import {toast} from '@ui/toast/toast';
import {useLocalStorage} from '@ui/utils/hooks/local-storage';
import {getCountryList} from '@ui/utils/intl/countries';
import {getLanguageList} from '@ui/utils/intl/languages';
import {getTimeZoneGroups} from '@ui/utils/intl/timezones';
import {Fragment, useContext, useId, useState} from 'react';
import {useForm, useFormContext, useWatch} from 'react-hook-form';

interface DetailsFormPayload {
  name: string;
  timezone: string;
  country: string;
  language: string;
  tags: string[];
  notes: string;
  emails: string[];
  attributes: Record<string, any>;
}

export function DetailsSidebar() {
  const {userId} = useRequiredParams(['userId']);
  const isEnvatoSetup = useIsModuleInstalledAndSetup('envato');
  const isLivechatSetup = useIsModuleInstalledAndSetup('livechat');
  const userQuery = useSuspenseQuery(helpdeskQueries.customers.get(userId));
  const user = userQuery.data.user;

  const {rightSidenavStatus, setRightSidenavStatus} = useContext(
    DashboardLayoutContext,
  );
  const [expandedItems, setExpendedItems] = useLocalStorage(
    'dash.customer.details',
    [0, 1, 2, 3, 4, 5],
  );

  const form = useForm<DetailsFormPayload>({
    defaultValues: {
      name: user.name,
      timezone: user.timezone,
      country: user.country ? user.country.toLowerCase() : '',
      language: user.language ?? '',
      tags: user.tags ?? [],
      notes: user.notes ?? '',
      emails: user.emails ?? [],
      attributes: getDefaultValuesForFormWithAttributes(user.attributes),
    },
  });

  const updateDetails = useMutation({
    mutationFn: (values: DetailsFormPayload) =>
      apiClient.put(`helpdesk/customers/${userId}`, values),
    onSuccess: (r, values) => {
      form.reset(values);
      queryClient.invalidateQueries(helpdeskQueries.customers.get(userId));
      toast(message('Customer details updated'));
    },
    onError: r => onFormQueryError(r, form),
  });

  return (
    <Fragment>
      <DatatablePageHeaderBar
        rightContent={
          <IconButton
            className="ml-auto"
            size="xs"
            onClick={() =>
              setRightSidenavStatus(
                rightSidenavStatus === 'open' ? 'closed' : 'open',
              )
            }
          >
            <ToggleRightSidebarIcon />
          </IconButton>
        }
      >
        <Trans message="Details" />
      </DatatablePageHeaderBar>
      <div className="compact-scrollbar flex-auto overflow-y-auto stable-scrollbar">
        <Form form={form} onSubmit={values => updateDetails.mutate(values)}>
          <Accordion
            expandedValues={expandedItems ?? []}
            onExpandedChange={values => setExpendedItems(values as number[])}
            mode="multiple"
            variant="minimal"
          >
            <SidebarAccordionItem label={<Trans message="General" />}>
              <PrimaryDetailsPanel user={user} />
            </SidebarAccordionItem>
            <SidebarAccordionItem label={<Trans message="Emails" />}>
              <EmailsPanel user={user} />
            </SidebarAccordionItem>
            <SidebarAccordionItem label={<Trans message="Tags" />}>
              <TagsPanel />
            </SidebarAccordionItem>
            {isEnvatoSetup && (
              <SidebarAccordionItem
                label={<Trans message="Envato purchase codes" />}
              >
                <EnvatoPurchaseCodesPanel user={user} />
              </SidebarAccordionItem>
            )}
            <SidebarAccordionItem label={<Trans message="Notes" />}>
              <NotesPanel />
            </SidebarAccordionItem>
            {user.session && (
              <SidebarAccordionItem label={<Trans message="Technology" />}>
                <TechnologyPanel session={user.session} />
              </SidebarAccordionItem>
            )}
            {isLivechatSetup && (
              <SidebarAccordionItem label={<Trans message="Visited pages" />}>
                <PageVisitsPanel userId={user.id} />
              </SidebarAccordionItem>
            )}
            <SidebarAccordionItem label={<Trans message="Searches" />}>
              <SearchesPanel user={user} />
            </SidebarAccordionItem>
          </Accordion>
          <DirtyFormSaveDrawer isLoading={updateDetails.isPending} />
        </Form>
      </div>
    </Fragment>
  );
}

interface PrimaryDetailsPanelProps {
  user: CustomerProfile;
}
function PrimaryDetailsPanel({user}: PrimaryDetailsPanelProps) {
  const timezoneGroups = getTimeZoneGroups();
  const countries = getCountryList('en');
  const languages = getLanguageList('en');
  return (
    <DetailsList>
      <DetailsListItem label={<Trans message="Name" />}>
        <FormTextField
          name="name"
          size="xs"
          inputBorder="border border-divider-lighter"
        />
      </DetailsListItem>
      <DetailsListItem label={<Trans message="Timezone" />}>
        <FormSelect
          name="timezone"
          size="xs"
          inputBorder="border border-divider-lighter"
          showSearchField
          floatingWidth="auto"
        >
          {Object.entries(timezoneGroups).map(([name, timezones]) => (
            <Section key={name} label={name}>
              {timezones.map(timezone => (
                <Item key={timezone} value={timezone}>
                  {timezone}
                </Item>
              ))}
            </Section>
          ))}
        </FormSelect>
      </DetailsListItem>
      <DetailsListItem label={<Trans message="Country" />}>
        <FormSelect
          name="country"
          size="xs"
          inputBorder="border border-divider-lighter"
          showSearchField
          floatingWidth="auto"
        >
          {countries.map(country => (
            <Item key={country.code} value={country.code}>
              {country.name}
            </Item>
          ))}
        </FormSelect>
      </DetailsListItem>
      <DetailsListItem label={<Trans message="Language" />}>
        <FormSelect
          name="language"
          size="xs"
          inputBorder="border border-divider-lighter"
        >
          {languages.map(language => (
            <Item key={language.code} value={language.code}>
              {language.name}
            </Item>
          ))}
        </FormSelect>
      </DetailsListItem>
      <DetailsListItem label={<Trans message="Last login" />}>
        {user.last_active_at ? (
          <FormattedRelativeTime date={user.last_active_at} />
        ) : (
          '-'
        )}
      </DetailsListItem>
      <DetailsListItem label={<Trans message="Created" />}>
        {user.created_at ? (
          <FormattedRelativeTime date={user.created_at} />
        ) : (
          '-'
        )}
      </DetailsListItem>
      {user.attributes.map(item => (
        <DetailsListItem key={item.id} label={<Trans message={item.name} />}>
          <AttributeInputRenderer
            attribute={item}
            formPrefix="attributes"
            hideLabel
            inputBorder="border border-divider-lighter"
            size="xs"
            className="text-sm"
            preferSelects
          />
        </DetailsListItem>
      ))}
    </DetailsList>
  );
}

function EmailsPanel({user}: {user: CustomerProfile}) {
  const form = useFormContext<DetailsFormPayload>();
  const emails = useWatch<DetailsFormPayload, 'emails'>({name: 'emails'});

  const addEmailButton = (
    <DialogTrigger
      type="modal"
      onClose={newEmail => {
        if (newEmail && !emails.includes(newEmail)) {
          form.setValue('emails', [...emails, newEmail], {shouldDirty: true});
        }
      }}
    >
      <Button
        variant="flat"
        color="chip"
        size="xs"
        className="max-h-26"
        startIcon={<AddIcon />}
      >
        <Trans message="Add email" />
      </Button>
      <AddEmailDialog />
    </DialogTrigger>
  );

  return (
    <Fragment>
      {user.email && (
        <div className="mb-12 text-xs text-muted">
          <Trans message="Primary: :email" values={{email: user.email}} />
        </div>
      )}
      <ChipList size="sm" radius="rounded-button" startButton={addEmailButton}>
        {emails.map(email => (
          <Chip
            key={email}
            onRemove={() =>
              form.setValue(
                'emails',
                emails.filter(e => e !== email),
                {shouldDirty: true},
              )
            }
          >
            {email}
          </Chip>
        ))}
      </ChipList>
    </Fragment>
  );
}

function AddEmailDialog() {
  const [email, setEmail] = useState('');
  const formId = useId();
  const {close} = useDialogContext();
  return (
    <Dialog>
      <DialogHeader>
        <Trans message="Add email" />
      </DialogHeader>
      <DialogBody>
        <form
          id={formId}
          onSubmit={e => {
            e.stopPropagation();
            e.preventDefault();
            close(email);
          }}
        >
          <TextField
            label={<Trans message="Email" />}
            type="email"
            required
            autoFocus
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </form>
      </DialogBody>
      <DialogFooter>
        <Button>
          <Trans message="Cancel" />
        </Button>
        <Button type="submit" variant="flat" color="primary" form={formId}>
          <Trans message="Add" />
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

function TagsPanel() {
  const form = useFormContext<DetailsFormPayload>();
  const tags = useWatch<DetailsFormPayload, 'tags'>({name: 'tags'});
  return (
    <ChipList
      size="sm"
      radius="rounded-button"
      startButton={
        <DialogTrigger type="modal">
          <Button
            variant="flat"
            color="chip"
            size="xs"
            className="max-h-26"
            startIcon={<AddIcon />}
          >
            <Trans message="Add tag" />
          </Button>
          <ManageTagsDialog
            onSelected={tag => {
              if (!tags.includes(tag)) {
                form.setValue('tags', [...tags, tag], {shouldDirty: true});
              }
            }}
          />
        </DialogTrigger>
      }
    >
      {tags.map(tag => (
        <Chip
          key={tag}
          onRemove={() =>
            form.setValue(
              'tags',
              tags.filter(t => t !== tag),
              {shouldDirty: true},
            )
          }
        >
          {tag}
        </Chip>
      ))}
    </ChipList>
  );
}

function NotesPanel() {
  return (
    <FormTextField
      inputElementType="textarea"
      rows={3}
      name="notes"
      size="xs"
      inputBorder="border border-divider-lighter"
    />
  );
}

function EnvatoPurchaseCodesPanel({user}: PrimaryDetailsPanelProps) {
  return (
    <Fragment>
      {!user.envato_purchase_codes?.length ? (
        <div className="text-sm text-muted">
          <Trans message="No envato purchases yet" />
        </div>
      ) : (
        <EnvatoPurchaseList
          userId={user.id}
          initialData={user.envato_purchase_codes}
        />
      )}
    </Fragment>
  );
}

function SearchesPanel({user}: PrimaryDetailsPanelProps) {
  const {data} = useQuery(
    helpdeskQueries.customers.indexSearches(user.id, {perPage: '8'}),
  );

  if (!data) {
    return (
      <div className="flex justify-center">
        <ProgressCircle isIndeterminate size="xs" />
      </div>
    );
  }

  if (!data.pagination.data.length) {
    return (
      <div className="font-italic text-xs text-muted">
        <Trans message="No recent searches" />
      </div>
    );
  }

  return (
    <div className="space-y-14">
      {data.pagination.data.map(item => {
        return (
          <div key={item.id}>
            <div className="overflow-hidden overflow-ellipsis whitespace-nowrap text-sm">
              {item.term}
            </div>
            <div className="text-[13px] text-muted">
              <div className="min-w-0 overflow-hidden overflow-ellipsis whitespace-nowrap">
                <FormattedRelativeTime date={item.last_seen} style="long" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SidebarAccordionItem(props: AccordionItemProps) {
  return (
    <AccordionItem
      {...props}
      buttonPadding="py-12 pl-24 pr-2r"
      bodyPadding="px-24 pb-16 pt-4"
      labelClassName="font-semibold"
      className="border-b"
    >
      {props.children}
    </AccordionItem>
  );
}
