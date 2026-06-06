import {UploadType} from '@app/site-config';
import {SettingsSectionHeader} from '@common/admin/settings/layout/settings-panel';
import {SettingsSectionButton} from '@common/admin/settings/layout/settings-section-button';
import {ThemeEditor} from '@common/admin/settings/pages/themes-settings/themes-settings-page';
import {FormImageSelector} from '@common/uploads/components/image-selector';
import {NestedSectionLayout} from '@livechat/admin/settings/nested-section-layout';
import {useChatSettingsNav} from '@livechat/admin/settings/use-chat-settings-nav';
import {LinkStyle} from '@ui/buttons/external-link';
import {Item} from '@ui/forms/listbox/item';
import {FormSelect} from '@ui/forms/select/select';
import {FormSwitch} from '@ui/forms/toggle/switch';
import {Trans} from '@ui/i18n/trans';
import {ArrowRightIcon} from '@ui/icons/material/ArrowRight';
import {Link} from 'react-router';

export function WidgetStyleSettings() {
  const {setActiveSection} = useChatSettingsNav();
  return (
    <div>
      <LogoSection />
      <SettingsSectionHeader margin="mb-16" size="sm">
        <Trans message="Themes" />
      </SettingsSectionHeader>
      <FormSelect
        selectionMode="single"
        name="client.chatWidget.defaultTheme"
        label={<Trans message="Default widget theme" />}
        className="mb-16"
      >
        <Item value="light">
          <Trans message="Light" />
        </Item>
        <Item value="dark">
          <Trans message="Dark" />
        </Item>
        <Item value="system">
          <Trans message="System" />
        </Item>
      </FormSelect>
      <FormSwitch
        className="mb-24"
        name="client.chatWidget.inheritThemes"
        description={
          <Trans
            message="Use themes configured <a>globally</a>, or set unique colors for chat widget."
            values={{
              a: text => (
                <Link
                  className={LinkStyle}
                  to="/admin/settings/themes"
                  target="_blank"
                >
                  {text}
                </Link>
              ),
            }}
          />
        }
      >
        <Trans message="Use global themes" />
      </FormSwitch>
      <SettingsSectionButton
        onClick={() => setActiveSection('themesEditor')}
        endIcon={<ArrowRightIcon className="text-muted" />}
      >
        <Trans message="Customize widget themes" />
      </SettingsSectionButton>
    </div>
  );
}

export function WidgetThemeEditor() {
  return (
    <NestedSectionLayout backLabel={<Trans message="Style" />}>
      <Trans message="Customize widget themes" />
      <ThemeEditor size="lg" type="chatWidget" />
    </NestedSectionLayout>
  );
}

function LogoSection() {
  return (
    <div className="mb-28 border-b border-b-divider-lighter pb-28">
      <SettingsSectionHeader margin="mb-16" size="sm">
        <Trans message="Logos" />
        <Trans message="Use a JPG, PNG, or GIF smaller than 100KB. 50px by 50px works best." />
      </SettingsSectionHeader>
      <div className="flex items-center gap-24">
        <FormImageSelector
          name={`client.chatWidget.logo_dark`}
          label={<Trans message="Light mode" />}
          uploadType={UploadType.brandingImages}
          className="min-w-[186px] max-w-max"
          defaultValue="images/logo-dark-mobile.png"
        />
        <FormImageSelector
          name={`client.chatWidget.logo_light`}
          label={<Trans message="Dark mode" />}
          uploadType={UploadType.brandingImages}
          className="min-w-[186px] max-w-max"
          defaultValue="images/logo-light-mobile.png"
        />
      </div>
    </div>
  );
}
