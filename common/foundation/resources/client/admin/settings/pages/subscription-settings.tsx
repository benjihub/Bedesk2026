import {AdminSettings} from '@common/admin/settings/admin-settings';
import {SettingsErrorGroup} from '@common/admin/settings/layout/settings-error-group';
import {AdminSettingsLayout} from '@common/admin/settings/layout/settings-layout';
import {DocsLink} from '@common/admin/settings/layout/settings-links';
import {SettingsPanel} from '@common/admin/settings/layout/settings-panel';
import {useAdminSettings} from '@common/admin/settings/requests/use-admin-settings';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {FormSwitch} from '@ui/forms/toggle/switch';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {Fragment} from 'react';
import {useForm, useFormContext} from 'react-hook-form';

export function Component() {
  const {trans} = useTrans();
  const {data} = useAdminSettings();
  const form = useForm<AdminSettings>({
    defaultValues: {
      client: {
        billing: {
          enable: data.client.billing?.enable ?? false,
          paypal_test_mode: data.client.billing?.paypal_test_mode ?? false,
          paypal: {
            enable: data.client.billing?.paypal?.enable ?? false,
          },
          stripe: {
            enable: data.client.billing?.stripe?.enable ?? false,
          },
          invoice: {
            address: data.client.billing?.invoice?.address ?? '',
            notes: data.client.billing?.invoice?.notes ?? '',
          },
        },
      },
      server: {
        paypal_client_id: data.server?.paypal_client_id ?? '',
        paypal_secret: data.server?.paypal_secret ?? '',
        paypal_webhook_id: data.server?.paypal_webhook_id ?? '',
        stripe_key: data.server?.stripe_key ?? '',
        stripe_secret: data.server?.stripe_secret ?? '',
        stripe_webhook_secret: data.server?.stripe_webhook_secret ?? '',
      },
    },
  });

  return (
    <AdminSettingsLayout form={form} title={<Trans message="Subscriptions" />}>
      <GeneralSection />
      <PaypalSection />
      <StripeSection />
      <InvoiceAddressSection />
      <InvoiceNotesSection />
    </AdminSettingsLayout>
  );
}

function GeneralSection() {
  return (
    <SettingsPanel
      className="mb-24"
      title={<Trans message="Subscriptions" />}
      description={
        <Trans message="Enable or disable subscription functionality across the site." />
      }
    >
      <FormSwitch name="client.billing.enable">
        <Trans message="Enable subscriptions" />
      </FormSwitch>
    </SettingsPanel>
  );
}

function PaypalSection() {
  const {watch} = useFormContext<AdminSettings>();
  const paypalIsEnabled = watch('client.billing.paypal.enable');
  return (
    <SettingsPanel
      className="mb-24"
      title={<Trans message="PayPal Gateway" />}
      description={
        <Trans message="Configure PayPal payment gateway integration." />
      }
    >
      <FormSwitch name="client.billing.paypal.enable">
        <Trans message="Enable PayPal" />
      </FormSwitch>
      {paypalIsEnabled && (
        <SettingsErrorGroup
          name="paypal_group"
          separatorTop={false}
          separatorBottom={false}
        >
          {isInvalid => (
            <Fragment>
              <FormTextField
                size="sm"
                name="server.paypal_client_id"
                label={<Trans message="PayPal Client ID" />}
                required
                invalid={isInvalid}
                className="mt-20"
              />
              <FormTextField
                size="sm"
                name="server.paypal_secret"
                label={<Trans message="PayPal Secret" />}
                required
                invalid={isInvalid}
                className="mt-20"
              />
              <FormTextField
                size="sm"
                name="server.paypal_webhook_id"
                label={<Trans message="PayPal Webhook ID" />}
                required
                invalid={isInvalid}
                className="mt-20"
              />
              <FormSwitch
                name="client.billing.paypal_test_mode"
                invalid={isInvalid}
                className="mt-20"
              >
                <Trans message="PayPal test mode" />
              </FormSwitch>
            </Fragment>
          )}
        </SettingsErrorGroup>
      )}
    </SettingsPanel>
  );
}

function StripeSection() {
  const {watch} = useFormContext<AdminSettings>();
  const stripeEnabled = watch('client.billing.stripe.enable');
  return (
    <SettingsPanel
      className="mb-24"
      title={<Trans message="Stripe Gateway" />}
      description={
        <Trans message="Configure Stripe payment gateway integration." />
      }
    >
      <FormSwitch name="client.billing.stripe.enable">
        <Trans message="Enable Stripe" />
      </FormSwitch>
      {stripeEnabled && (
        <SettingsErrorGroup
          name="stripe_group"
          separatorTop={false}
          separatorBottom={false}
        >
          {isInvalid => (
            <Fragment>
              <FormTextField
                size="sm"
                name="server.stripe_key"
                label={<Trans message="Stripe publishable key" />}
                required
                className="mt-20"
                invalid={isInvalid}
              />
              <FormTextField
                size="sm"
                name="server.stripe_secret"
                label={<Trans message="Stripe secret key" />}
                required
                className="mt-20"
                invalid={isInvalid}
              />
              <FormTextField
                size="sm"
                name="server.stripe_webhook_secret"
                label={<Trans message="Stripe webhook signing secret" />}
                className="mt-20"
                invalid={isInvalid}
              />
            </Fragment>
          )}
        </SettingsErrorGroup>
      )}
    </SettingsPanel>
  );
}

function InvoiceAddressSection() {
  return (
    <SettingsPanel
      className="mb-24"
      title={<Trans message="Invoice Address" />}
      description={
        <Trans message="Set the address that will appear on customer invoices." />
      }
    >
      <FormTextField
        size="sm"
        label={<Trans message="Address" />}
        inputElementType="textarea"
        rows={2}
        name="client.billing.invoice.address"
      />
    </SettingsPanel>
  );
}

function InvoiceNotesSection() {
  return (
    <SettingsPanel
      title={<Trans message="Invoice Notes" />}
      description={
        <Trans message="Default notes to show under the notes section of customer invoices." />
      }
    >
      <FormTextField
        size="sm"
        label={<Trans message="Notes" />}
        inputElementType="textarea"
        rows={2}
        name="client.billing.invoice.notes"
      />
    </SettingsPanel>
  );
}
