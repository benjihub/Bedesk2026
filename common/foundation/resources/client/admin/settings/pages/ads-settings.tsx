import {AdminSettings} from '@common/admin/settings/admin-settings';
import {AdminSettingsLayout} from '@common/admin/settings/layout/settings-layout';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {FormSwitch} from '@ui/forms/toggle/switch';
import {Trans} from '@ui/i18n/trans';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {ImageZoomDialog} from '@ui/overlays/dialog/image-zoom-dialog';
import {useContext} from 'react';
import {useForm} from 'react-hook-form';
import {
  AdConfig,
  SiteConfigContext,
} from '../../../core/settings/site-config-context';
import {useAdminSettings} from '../requests/use-admin-settings';

export function Component() {
  const {data} = useAdminSettings();
  const {
    admin: {ads},
  } = useContext(SiteConfigContext);

  const adsData = data?.client?.ads as Record<string, string | boolean>;
  const defaultAdsSettings: Record<string, string | boolean> = {
    disable: adsData?.disable ?? false,
  };
  ads.forEach(ad => {
    const key = ad.slot.replace('ads.', '');
    defaultAdsSettings[key] = adsData?.[key] ?? '';
  });

  const form = useForm<AdminSettings>({
    defaultValues: {client: {ads: defaultAdsSettings}},
  });

  return (
    <AdminSettingsLayout
      form={form}
      title={<Trans message="Predefined AD slots" />}
    >
      {ads.map(ad => (
        <AdSection key={ad.slot} adConfig={ad} />
      ))}
      <FormSwitch
        name="client.ads.disable"
        className="mb-30"
        description={
          <Trans message="Disable all add related functionality across the site." />
        }
      >
        <Trans message="Disable ads" />
      </FormSwitch>
    </AdminSettingsLayout>
  );
}

interface AdSectionProps {
  adConfig: AdConfig;
}
function AdSection({adConfig}: AdSectionProps) {
  return (
    <div className="flex items-center gap-24">
      <FormTextField
        className="mb-30 flex-auto"
        name={`client.${adConfig.slot}`}
        inputElementType="textarea"
        rows={8}
        label={<Trans {...adConfig.description} />}
      />
      <DialogTrigger type="modal">
        <button
          type="button"
          className="cursor-zoom-in overflow-hidden rounded-input outline-none transition hover:scale-105 focus-visible:ring max-md:hidden"
        >
          <img
            src={adConfig.image}
            className="h-[186px] w-auto border"
            alt="Ad slot example"
          />
        </button>
        <ImageZoomDialog image={adConfig.image} />
      </DialogTrigger>
    </div>
  );
}
