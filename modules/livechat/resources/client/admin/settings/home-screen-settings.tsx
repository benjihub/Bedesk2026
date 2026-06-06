import {UploadType} from '@app/site-config';
import {AdminSettings} from '@common/admin/settings/admin-settings';
import {SettingsSectionHeader} from '@common/admin/settings/layout/settings-panel';
import {SettingsSectionButton} from '@common/admin/settings/layout/settings-section-button';
import {MenuItemsManager} from '@common/admin/settings/pages/menu-settings/menu-settings';
import {BackgroundSelector} from '@common/background-selector/background-selector';
import {NestedSectionLayout} from '@livechat/admin/settings/nested-section-layout';
import {useChatSettingsNav} from '@livechat/admin/settings/use-chat-settings-nav';
import {LinkStyle} from '@ui/buttons/external-link';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {FormSwitch} from '@ui/forms/toggle/switch';
import {Trans} from '@ui/i18n/trans';
import {ArrowRightIcon} from '@ui/icons/material/ArrowRight';
import {InfoIcon} from '@ui/icons/material/Info';
import {removeEmptyValuesFromObject} from '@ui/utils/objects/remove-empty-values-from-object';
import {Fragment} from 'react';
import {useFormContext, useWatch} from 'react-hook-form';
import {Link} from 'react-router';

export function HomeScreenSettings() {
  const {setActiveSection} = useChatSettingsNav();
  const form = useFormContext<AdminSettings>();
  const showHcCard = useWatch({
    control: form.control,
    name: 'client.chatWidget.showHcCard',
  });

  return (
    <div>
      <FormSwitch
        className="mb-24"
        name="client.chatWidget.showAvatars"
        description={
          <Trans message="Whether active agent avatars should be visible." />
        }
      >
        <Trans message="Show avatars" />
      </FormSwitch>
      <SettingsSectionButton
        onClick={() => setActiveSection('background')}
        endIcon={<ArrowRightIcon className="text-muted" />}
      >
        <Trans message="Background" />
      </SettingsSectionButton>
      <SettingsSectionHeader margin="mt-24 mb-6" size="sm">
        <Trans message="Content" />
      </SettingsSectionHeader>
      <SettingsSectionButton
        onClick={() => setActiveSection('messages')}
        endIcon={<ArrowRightIcon className="text-muted" />}
      >
        <Trans message="Messages" />
      </SettingsSectionButton>
      <SettingsSectionButton
        onClick={() => setActiveSection('links')}
        endIcon={<ArrowRightIcon className="text-muted" />}
      >
        <Trans message="Links" />
      </SettingsSectionButton>
      <FormSwitch className="mt-14" name="client.chatWidget.showHcCard">
        <Trans message="Show help center card" />
      </FormSwitch>
      {showHcCard && (
        <FormSwitch className="mt-14" name="client.chatWidget.hideHomeArticles">
          <Trans message="Hide suggested articles" />
        </FormSwitch>
      )}
      <FormSwitch name="client.chatWidget.homeShowTickets" className="mt-14">
        <Trans message="Show tickets section" />
      </FormSwitch>
    </div>
  );
}

export function HomeScreenBackgroundSettings() {
  const {watch, setValue} = useFormContext<AdminSettings>();
  return (
    <NestedSectionLayout backLabel={<Trans message="Home screen" />}>
      <Trans message="Background" />
      <BackgroundSelector
        uploadType={UploadType.brandingImages}
        value={watch('client.chatWidget.background')}
        onChange={value => {
          // remove undefined values so isDirty on hook form works correctly
          const finalValue = removeEmptyValuesFromObject(value);
          // @ts-ignore
          delete finalValue.label;
          setValue('client.chatWidget.background', finalValue, {
            shouldDirty: true,
          });
        }}
        underTabs={
          <FormSwitch name="client.chatWidget.fadeBg" className="mb-20">
            <Trans message="Fade background" />
          </FormSwitch>
        }
      />
    </NestedSectionLayout>
  );
}

export function HomeScreenMessagesSettings() {
  return (
    <NestedSectionLayout backLabel={<Trans message="Home screen" />}>
      <Trans message="Messages" />
      <div>
        <FormTextField
          name="client.chatWidget.greeting"
          label={<Trans message="Greeting" />}
          className="mb-16"
          description={
            <Trans message="Greeting for when user name is available." />
          }
        />
        <FormTextField
          name="client.chatWidget.greetingAnonymous"
          label={<Trans message="Anonymous greeting" />}
          className="mb-16"
          description={
            <Trans message="Greeting for when user name is not available." />
          }
        />
        <FormTextField
          name="client.chatWidget.introduction"
          label={<Trans message="Introduction" />}
        />
        <SettingsSectionHeader margin="mt-24 mb-6" size="sm">
          <Trans message="Chats" />
        </SettingsSectionHeader>
        <FormTextField
          name="client.chatWidget.homeNewChatTitle"
          label={<Trans message="New chat title" />}
          className="mb-16"
        />
        <FormTextField
          name="client.chatWidget.homeNewChatSubtitle"
          label={<Trans message="New chat description" />}
        />
        <SettingsSectionHeader margin="mt-24 mb-16" size="sm">
          <Trans message="Tickets" />
        </SettingsSectionHeader>
        <FormSwitch name="client.chatWidget.homeShowTickets" className="mb-16">
          <Trans message="Show tickets section" />
        </FormSwitch>
        <FormTextField
          name="client.chatWidget.homeNewTicketTitle"
          label={<Trans message="New ticket title" />}
          className="mb-16"
        />
        <FormTextField
          name="client.chatWidget.homeNewTicketSubtitle"
          label={<Trans message="New ticket description" />}
        />
        <div className="mt-24 text-sm text-muted">
          <InfoIcon size="xs" className="mr-4" />
          <Trans
            message="You can translate these messages from <a>localizations page.</a>"
            values={{
              a: text => (
                <Link
                  className={LinkStyle}
                  to="/admin/localizations"
                  target="_blank"
                >
                  {text}
                </Link>
              ),
            }}
          />
        </div>
      </div>
    </NestedSectionLayout>
  );
}

export function HomeScreenLinksSettings() {
  return (
    <Fragment>
      <NestedSectionLayout backLabel={<Trans message="Home screen" />}>
        <Trans message="Links" />
        <MenuItemsManager formPath="client.chatWidget.homeLinks" />
      </NestedSectionLayout>
    </Fragment>
  );
}
