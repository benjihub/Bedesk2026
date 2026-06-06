import {AdminDocsUrls} from '@app/admin/admin-config';
import {UploadType} from '@app/site-config';
import {AdminSettings} from '@common/admin/settings/admin-settings';
import {AdminSettingsLayout} from '@common/admin/settings/layout/settings-layout';
import {DocsLink} from '@common/admin/settings/layout/settings-links';
import {SettingsPanel} from '@common/admin/settings/layout/settings-panel';
import {useAdminSettings} from '@common/admin/settings/requests/use-admin-settings';
import {useGenerateSitemap} from '@common/admin/settings/requests/use-generate-sitemap';
import {FormImageSelector} from '@common/uploads/components/image-selector';
import {Button} from '@ui/buttons/button';
import {ExternalLink} from '@ui/buttons/external-link';
import {
  FormTextField,
  TextField,
} from '@ui/forms/input-field/text-field/text-field';
import {Trans} from '@ui/i18n/trans';
import {useSettings} from '@ui/settings/use-settings';
import {ReactNode} from 'react';
import {useForm} from 'react-hook-form';

interface Props {
  children?: ReactNode;
  defaultValues?: {client?: Partial<AdminSettings['client']>};
}
export function Component({children, defaultValues}: Props) {
  const {data} = useAdminSettings();

  const form = useForm<AdminSettings>({
    defaultValues: {
      ...defaultValues,
      client: {
        branding: {
          favicon: data.client.branding.favicon,
          logo_light: data.client.branding.logo_light,
          logo_dark: data.client.branding.logo_dark,
          logo_light_mobile: data.client.branding.logo_light_mobile,
          logo_dark_mobile: data.client.branding.logo_dark_mobile,
          site_description: data.client.branding.site_description,
        },
      },
      server: {
        app_name: data.server.app_name,
      },
    },
  });

  return (
    <AdminSettingsLayout
      form={form}
      title={<Trans message="General" />}
      docsLink={AdminDocsUrls.settings.general}
    >
      <SiteUrlSection />
      <SiteNameSection />
      <FaviconSection />
      <LightModeLogo />
      <DarkModeLogo />
      <MobileLogos />
      {children}
      <SitemapSection />
    </AdminSettingsLayout>
  );
}

function SiteUrlSection() {
  const {data} = useAdminSettings();

  if (!data) return null;

  let append = null;
  const server = data!.server;
  const isInvalid = server.newAppUrl && server.newAppUrl !== server.app_url;
  if (isInvalid) {
    append = (
      <div className="mt-20 text-xs text-danger">
        <Trans
          values={{
            baseUrl: server.app_url,
            currentUrl: server.newAppUrl,
            b: chunks => <b>{chunks}</b>,
          }}
          message="Base site url is set as <b>:baseUrl</b> in configuration, but current url is <b>:currentUrl</b>. It is recommended to set the primary url you want to use in configuration file and then redirect all other url versions to this primary version via cpanel or .htaccess file."
        />
      </div>
    );
  }

  return (
    <SettingsPanel
      className="mb-24"
      title={<Trans message="Site URL" />}
      description={
        <div>
          <Trans message="The primary domain for your site." />
        </div>
      }
    >
      <TextField
        readOnly
        invalid={!!isInvalid}
        value={server.app_url}
        label={<Trans message="Primary site url" />}
      />
      {append}
    </SettingsPanel>
  );
}

function SiteNameSection() {
  return (
    <SettingsPanel
      className="mb-24"
      title={<Trans message="Site name" />}
      description={
        <div>
          <Trans message="Short name for the site that will appear in browser tabs, seo tags, PWA app and other places." />
        </div>
      }
    >
      <FormTextField
        name="server.app_name"
        label={<Trans message="Site name" />}
      />
    </SettingsPanel>
  );
}

function FaviconSection() {
  return (
    <SettingsPanel
      className="mb-24"
      title={<Trans message="Favicon" />}
      description={
        <div>
          <Trans message="This will generate different size favicons. Image should be at least 512x512 in size." />
        </div>
      }
    >
      <div className="w-max">
        <BrandingImageSelector type="favicon" />
      </div>
    </SettingsPanel>
  );
}

function LightModeLogo() {
  return (
    <SettingsPanel
      className="mb-24"
      title={<Trans message="Light mode logo" />}
      description={
        <div>
          <Trans message="Logo used in light mode and when enough screen space is available. Default logo is 516x117px size." />
        </div>
      }
    >
      <BrandingImageSelector type="logo_dark" />
    </SettingsPanel>
  );
}

function DarkModeLogo() {
  return (
    <SettingsPanel
      className="mb-24"
      title={<Trans message="Dark mode logo" />}
      description={
        <div>
          <Trans message="Will show light mode logo, if left empty." />
        </div>
      }
    >
      <BrandingImageSelector type="logo_light" />
    </SettingsPanel>
  );
}

function MobileLogos() {
  return (
    <SettingsPanel
      className="mb-24"
      title={<Trans message="Compact logos" />}
      description={
        <div>
          <Trans message="Will show these logos if there's not enough space. For example on mobile or when screen is too small." />
        </div>
      }
    >
      <div className="flex items-center gap-24">
        <BrandingImageSelector type="logo_dark_mobile" title="Light mode" />
        <BrandingImageSelector type="logo_light_mobile" title="Dark mode" />
      </div>
    </SettingsPanel>
  );
}

interface ImageSelectorProps {
  type: keyof AdminSettings['client']['branding'];
  title?: string;
}
function BrandingImageSelector({type, title}: ImageSelectorProps) {
  const {data} = useAdminSettings();
  return (
    <FormImageSelector
      className="max-w-max"
      showEditButtonOnHover
      name={`client.branding.${type}`}
      uploadType={UploadType.brandingImages}
      defaultValue={data?.defaults?.client.branding[type]}
      label={title}
    />
  );
}

function SitemapSection() {
  const generateSitemap = useGenerateSitemap();
  const {base_url} = useSettings();

  const url = `${base_url}/storage/sitemaps/sitemap-index.xml`;
  const link = <ExternalLink href={url}>{url}</ExternalLink>;

  return (
    <SettingsPanel
      className="mb-24"
      title={<Trans message="Sitemap" />}
      description={
        <div>
          <Trans message="Generate a sitemap to help search engines discover and index your site content." />
        </div>
      }
    >
      <Button
        variant="outline"
        size="xs"
        color="primary"
        disabled={generateSitemap.isPending}
        onClick={() => {
          generateSitemap.mutate();
        }}
      >
        <Trans message="Generate sitemap" />
      </Button>
      <div className="mt-14 text-xs text-muted">
        <Trans
          message="Once generated, sitemap url will be: :url"
          values={{
            url: link,
          }}
        />
      </div>
    </SettingsPanel>
  );
}
