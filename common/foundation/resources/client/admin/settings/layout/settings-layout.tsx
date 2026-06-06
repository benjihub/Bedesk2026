import {AdminSettings} from '@common/admin/settings/admin-settings';
import {settingsFormId} from '@common/admin/settings/layout/settings-constants';
import {DocsLink} from '@common/admin/settings/layout/settings-links';
import {
  SettingsPageStoreProvider,
  useSettingsPageStore,
} from '@common/admin/settings/layout/settings-page-store';
import {useUpdateAdminSettings} from '@common/admin/settings/requests/use-update-admin-settings';
import {useAdminSettingsPageNavConfig} from '@common/admin/settings/use-admin-settings-page-nav-config';
import {DatatablePageHeaderBar} from '@common/datatable/page/datatable-page-with-header-layout';
import {useNavigate} from '@common/ui/navigation/use-navigate';
import {FileUploadProvider} from '@common/uploads/uploader/file-upload-provider';
import {useIsMutating} from '@tanstack/react-query';
import {Button} from '@ui/buttons/button';
import {IconButton} from '@ui/buttons/icon-button';
import {Form} from '@ui/forms/form';
import {Item} from '@ui/forms/listbox/item';
import {MessageDescriptor} from '@ui/i18n/message-descriptor';
import {Trans} from '@ui/i18n/trans';
import {MenuIcon} from '@ui/icons/material/Menu';
import {Menu, MenuTrigger} from '@ui/menu/menu-trigger';
import {BlockerDialog} from '@ui/overlays/dialog/blocker-dialog';
import {useIsMobileMediaQuery} from '@ui/utils/hooks/is-mobile-media-query';
import {isAbsoluteUrl} from '@ui/utils/urls/is-absolute-url';
import clsx from 'clsx';
import {Fragment, ReactElement, ReactNode, useEffect} from 'react';
import {FieldErrors, UseFormReturn} from 'react-hook-form';
import {BlockerFunction, useLocation} from 'react-router';

interface Props {
  children: ReactNode;
  title: ReactElement<MessageDescriptor>;
  form: UseFormReturn<any>;
  padding?: string;
  tabs?: ReactElement;
  docsLink?: string;
}
export function AdminSettingsLayout({
  title,
  form,
  children,
  padding = 'p-12 md:p-24',
  tabs,
  docsLink,
}: Props) {
  return (
    <SettingsPageStoreProvider>
      <div className="dashboard-grid-content dashboard-rounded-panel relative flex flex-auto flex-col">
        <SettingsPageHeader title={title} tabs={tabs} docsLink={docsLink} />
        <div className="flex-auto overflow-y-auto">
          <div
            className={clsx(
              'mx-auto @container/settings-form lg:max-w-[1440px]',
              padding,
            )}
          >
            <SettingsForm form={form}>{children}</SettingsForm>
          </div>
        </div>
      </div>
    </SettingsPageStoreProvider>
  );
}

interface SettingsPageHeaderProps {
  title: ReactElement<MessageDescriptor>;
  className?: string;
  tabs?: ReactElement;
  allowNavigation?: BlockerFunction;
  docsLink?: string;
}
export function SettingsPageHeader({
  title,
  className,
  tabs,
  allowNavigation,
  docsLink,
}: SettingsPageHeaderProps) {
  const isDirty = useSettingsPageStore(s => s.isDirty);
  const isMobile = useIsMobileMediaQuery();
  const isPending =
    useIsMutating({
      mutationKey: ['submitAdminSettings'],
    }) > 0;

  const submitButton = (
    <Button
      type="submit"
      form={settingsFormId}
      variant="flat"
      color="primary"
      size="xs"
      disabled={isPending || !isDirty}
      className="min-w-84"
    >
      {isMobile ? <Trans message="Save" /> : <Trans message="Save changes" />}
    </Button>
  );

  return (
    <Fragment>
      <DatatablePageHeaderBar
        className={className}
        title={title}
        showSidebarToggleButton={!!isMobile}
        border={tabs ? 'border-none' : undefined}
        rightContent={
          <Fragment>
            {isMobile && <SettingsMobileNav />}
            {docsLink ? (
              <DocsLink
                link={docsLink}
                variant="button"
                size="xs"
                buttonVariant={isMobile ? 'icon' : 'text'}
              >
                <Trans message="Learn more" />
              </DocsLink>
            ) : null}
            {submitButton}
          </Fragment>
        }
      />
      {tabs}
      <BlockerDialog shouldBlock={isDirty} allowNavigation={allowNavigation} />
    </Fragment>
  );
}

interface SettingsFormProps {
  form: UseFormReturn<AdminSettings>;
  children: ReactNode;
}
export function SettingsForm({form, children}: SettingsFormProps) {
  const setIsDirty = useSettingsPageStore(s => s.setIsDirty);
  const updateSettings = useUpdateAdminSettings(form);

  useEffect(() => {
    setIsDirty(form.formState.isDirty);
    return () => setIsDirty(false);
  }, [form.formState.isDirty, setIsDirty]);

  return (
    <FileUploadProvider>
      <Form
        id={settingsFormId}
        form={form}
        disableNativeValidation
        onBeforeSubmit={() => {
          // clear group errors, because hook form won't automatically
          // clear errors that are not bound to a specific form field
          const errors = form.formState.errors as FieldErrors<object>;
          const keys = Object.keys(errors).filter(key => {
            return key.endsWith('_group');
          });
          form.clearErrors(keys as any);
        }}
        onSubmit={values => {
          updateSettings.mutate(values, {
            onSuccess: () => {
              form.reset(values);
              // set not dirty on the same render, so there's no flash on submit button
              setIsDirty(false);
            },
          });
        }}
      >
        {children}
      </Form>
    </FileUploadProvider>
  );
}

export function SettingsMobileNav() {
  const {pathname} = useLocation();
  const navigate = useNavigate();
  const value = pathname.split('/').pop();

  const navConfig = useAdminSettingsPageNavConfig();

  return (
    <MenuTrigger
      selectionMode="single"
      selectedValue={value}
      onSelectionChange={newPage => {
        newPage = !isAbsoluteUrl(newPage as string)
          ? `/admin/settings/${newPage}`
          : newPage;
        navigate(newPage as string, {state: {prevPath: pathname}});
      }}
    >
      <IconButton>
        <MenuIcon />
      </IconButton>
      <Menu>
        {navConfig.map(item => (
          <Item key={item.to as string} value={item.to}>
            <Trans {...item.label} />
          </Item>
        ))}
      </Menu>
    </MenuTrigger>
  );
}
