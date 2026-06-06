import {AdminDocsUrls} from '@app/admin/admin-config';
import {AdminSettings} from '@common/admin/settings/admin-settings';
import {AdminSettingsLayout} from '@common/admin/settings/layout/settings-layout';
import {ConfigureLink} from '@common/admin/settings/layout/settings-links';
import {SettingsPanel} from '@common/admin/settings/layout/settings-panel';
import {useAdminSettings} from '@common/admin/settings/requests/use-admin-settings';
import {FormSwitch} from '@ui/forms/toggle/switch';
import {Trans} from '@ui/i18n/trans';
import {useForm, useFormContext} from 'react-hook-form';

export function Component() {
  const {data} = useAdminSettings();
  const form = useForm<AdminSettings>({
    defaultValues: {
      client: {
        tickets: {
          create_from_emails: data.client.tickets?.create_from_emails ?? false,
          send_ticket_created_notification:
            data.client.tickets?.send_ticket_created_notification ?? false,
          send_ticket_rejected_notification:
            data.client.tickets?.send_ticket_rejected_notification ?? false,
          guest_tickets: data.client.tickets?.guest_tickets ?? false,
          include_history: data.client.tickets?.include_history ?? false,
        },
        replies: {
          create_from_emails: data.client.replies?.create_from_emails ?? false,
          send_email: data.client.replies?.send_email ?? false,
        },
        assignments: {
          exclude_tickets: data.client.assignments?.exclude_tickets ?? false,
        },
      },
    },
  });

  return (
    <AdminSettingsLayout
      form={form}
      title={<Trans message="Tickets" />}
      docsLink={AdminDocsUrls.settings.tickets}
    >
      <TicketCreationSection />
      <TicketRepliesSection />
      <ConversationHistorySection />
      <AutoReplySection />
      <SettingsPanel
        className="mb-24"
        title={<Trans message="Ticket assignment" />}
        description={
          <Trans message="When enabled, tickets will not count towards agent active conversation limit during automatic conversation assignment." />
        }
      >
        <FormSwitch name="client.assignments.exclude_tickets">
          <Trans message="Ignore tickets during assignment" />
        </FormSwitch>
      </SettingsPanel>
      <SettingsPanel
        title={<Trans message="Guest tickets" />}
        description={
          <Trans message="Allow non-logged in visitors to create tickets from the help center." />
        }
      >
        <FormSwitch name="client.tickets.guest_tickets">
          <Trans message="Allow guest tickets" />
        </FormSwitch>
      </SettingsPanel>
    </AdminSettingsLayout>
  );
}

function TicketCreationSection() {
  return (
    <SettingsPanel
      className="mb-24"
      title={<Trans message="Convert all incoming emails to tickets" />}
      description={
        <Trans message="Automatically convert emails to tickets for streamlined issue handling." />
      }
      link={
        <ConfigureLink link="/admin/settings/email/incoming">
          <Trans message="Configure incoming email" />
        </ConfigureLink>
      }
    >
      <FormSwitch name="client.tickets.create_from_emails">
        <Trans message="Convert incoming emails to tickets" />
      </FormSwitch>
      <TicketRejectedNotification />
    </SettingsPanel>
  );
}

function TicketRejectedNotification() {
  const {watch} = useFormContext<AdminSettings>();
  if (watch('client.tickets.create_from_emails')) return null;
  return (
    <FormSwitch
      name="client.tickets.send_ticket_rejected_notification"
      className="mt-24"
      description={
        <Trans message="Send a notification to customer, if their ticket has not been created, because ticket creation via email is disabled." />
      }
    >
      <Trans message="Ticket rejected notification" />
    </FormSwitch>
  );
}

function ConversationHistorySection() {
  return (
    <SettingsPanel
      className="mb-24"
      title={<Trans message="Conversation history" />}
      description={
        <Trans message="Show current message and previous messages in email replies sent to customers." />
      }
    >
      <FormSwitch name="client.tickets.include_history">
        <Trans message="Include conversation history in replies" />
      </FormSwitch>
    </SettingsPanel>
  );
}

function TicketRepliesSection() {
  return (
    <SettingsPanel
      className="mb-24"
      title={<Trans message="Ticket Replies" />}
      description={
        <Trans message="Turn customer emails into existing ticket replies and send agent replies to customer via email." />
      }
    >
      <FormSwitch name="client.replies.create_from_emails">
        <Trans message="Turn incoming email into ticket replies" />
      </FormSwitch>
      <FormSwitch className="mt-20" name="client.replies.send_email">
        <Trans message="Send agent reply via email" />
      </FormSwitch>
    </SettingsPanel>
  );
}

export function AutoReplySection() {
  return (
    <SettingsPanel
      className="mb-24"
      title={<Trans message="Auto-reply" />}
      description={
        <Trans message="Send automatic reply to customer via email informing them that their ticket has been received." />
      }
    >
      <FormSwitch name="client.tickets.send_ticket_created_notification">
        <Trans message="Ticket received notification" />
      </FormSwitch>
    </SettingsPanel>
  );
}
