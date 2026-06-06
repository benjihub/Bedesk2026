import {AttributeInputRenderer} from '@app/attributes/rendering/attribute-input-renderer';
import {getDefaultValuesForFormWithAttributes} from '@app/attributes/utils/get-default-values-for-form-with-attributes';
import {NewConversationForm} from '@app/dashboard/conversations/new-conversation-page/new-conversation-form';
import {NewConversationPayload} from '@app/dashboard/conversations/new-conversation-page/new-conversation-payload';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {InboxViewsSidebar} from '@app/dashboard/inbox/inbox-views-sidebar';
import {DatatablePageHeaderBar} from '@common/datatable/page/datatable-page-with-header-layout';
import {onFormQueryError} from '@common/errors/on-form-query-error';
import {apiClient, queryClient} from '@common/http/query-client';
import {DashboardLayoutContext} from '@common/ui/dashboard-layout/dashboard-layout-context';
import {DashboardSidenav} from '@common/ui/dashboard-layout/dashboard-sidenav';
import {useNavigate} from '@common/ui/navigation/use-navigate';
import {useMutation, useSuspenseQuery} from '@tanstack/react-query';
import {IconButton} from '@ui/buttons/icon-button';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {ToggleRightSidebarIcon} from '@ui/icons/toggle-right-sidebar-icon';
import {toast} from '@ui/toast/toast';
import {useContext} from 'react';
import {FormProvider, useForm} from 'react-hook-form';
import {useSearchParams} from 'react-router';

export function Component() {
  const {rightSidenavStatus} = useContext(DashboardLayoutContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const customerId = searchParams.get('customer_id');

  const statusQuery = useSuspenseQuery(
    helpdeskQueries.statuses.dropdownList('agent'),
  );
  const attributesQuery = useSuspenseQuery(
    helpdeskQueries.attributes.normalizedList({
      type: 'conversation',
      for: 'agent',
    }),
  );

  const form = useForm<NewConversationPayload>({
    defaultValues: {
      status_id: statusQuery.data.statuses[0].id,
      user_id: customerId ? parseInt(customerId) : undefined,
      type: 'ticket',
      message: {
        body: '',
        attachments: [],
      },
      attributes: getDefaultValuesForFormWithAttributes(
        attributesQuery.data.attributes.filter(
          a => !hiddenAttributes.includes(a.key),
        ),
      ),
    },
  });

  const createConversation = useMutation({
    mutationFn: (payload: NewConversationPayload) =>
      apiClient
        .post(`helpdesk/agent/conversations`, {
          ...payload,
          message: {
            ...payload.message,
            attachments: payload.message.attachments.map(a => a.id),
          },
        })
        .then(r => r.data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: helpdeskQueries.conversations.invalidateKey,
      });
      toast(message('Conversation created'));
    },
    onError: err => onFormQueryError(err, form),
  });

  const handleSubmit = () => {
    createConversation.mutate(form.getValues(), {
      onSuccess: r =>
        navigate(`/dashboard/conversations/${r.conversation.id}?viewId=mine`),
    });
  };

  return (
    <FormProvider {...form}>
      <InboxViewsSidebar location="conversationsTable" />
      <div className="dashboard-rounded-panel dashboard-grid-content flex flex-col lg:ml-8">
        <DatatablePageHeaderBar
          title={<Trans message="New conversation" />}
          showSidebarToggleButton
          rightContent={
            rightSidenavStatus === 'closed' ? (
              <ToggleRightSidebarButton />
            ) : null
          }
        />
        <div className="overflow-y-auto p-24">
          <NewConversationForm
            onSubmit={() => handleSubmit()}
            isPending={createConversation.isPending}
          />
        </div>
      </div>
      <DashboardSidenav
        position="right"
        size="w-400"
        className="dashboard-rounded-panel flex-shrink-0 flex-col lg:ml-8"
      >
        <AttributesSidebar />
      </DashboardSidenav>
    </FormProvider>
  );
}

const hiddenAttributes = ['subject', 'description', 'rating'];
function AttributesSidebar() {
  const attributesQuery = useSuspenseQuery(
    helpdeskQueries.attributes.normalizedList({
      type: 'conversation',
      for: 'agent',
    }),
  );

  return (
    <aside className="w-full">
      <DatatablePageHeaderBar
        title={<Trans message="Attributes" />}
        showSidebarToggleButton={false}
        rightContent={<ToggleRightSidebarButton />}
      />
      <div className="p-24">
        {attributesQuery.data.attributes.map(attribute => {
          if (hiddenAttributes.includes(attribute.key)) return null;
          return (
            <AttributeInputRenderer
              key={attribute.id}
              formPrefix="attributes"
              attribute={attribute}
              className="mb-24"
            />
          );
        })}
      </div>
    </aside>
  );
}

function ToggleRightSidebarButton() {
  const {rightSidenavStatus, setRightSidenavStatus} = useContext(
    DashboardLayoutContext,
  );
  return (
    <IconButton
      size="xs"
      onClick={() =>
        setRightSidenavStatus(rightSidenavStatus === 'open' ? 'closed' : 'open')
      }
    >
      <ToggleRightSidebarIcon />
    </IconButton>
  );
}
