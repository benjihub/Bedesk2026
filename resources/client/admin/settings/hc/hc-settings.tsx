import {AdminDocsUrls} from '@app/admin/admin-config';
import {useImportHcDataFromZip} from '@app/admin/settings/hc/use-import-hc-data-from-zip';
import {AttributesManager} from '@app/attributes/rendering/attributes-manager';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {UploadType} from '@app/site-config';
import {AdminSettings} from '@common/admin/settings/admin-settings';
import {settingsPreviewPageId} from '@common/admin/settings/layout/settings-constants';
import {useSettingsPageStore} from '@common/admin/settings/layout/settings-page-store';
import {SettingsSectionHeader} from '@common/admin/settings/layout/settings-panel';
import {SettingsSectionButton} from '@common/admin/settings/layout/settings-section-button';
import {SettingsWithPreview} from '@common/admin/settings/layout/settings-with-preview';
import {useAdminSettings} from '@common/admin/settings/requests/use-admin-settings';
import {SimpleBackgroundPositionSelector} from '@common/background-selector/image-background-tab/simple-background-position-selector';
import {FormImageSelector} from '@common/uploads/components/image-selector';
import {Accordion, AccordionItem} from '@ui/accordion/accordion';
import {Button} from '@ui/buttons/button';
import {LinkStyle} from '@ui/buttons/external-link';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {Item} from '@ui/forms/listbox/item';
import {FormSelect} from '@ui/forms/select/select';
import {FormSwitch} from '@ui/forms/toggle/switch';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {AddIcon} from '@ui/icons/material/Add';
import {ArrowRightIcon} from '@ui/icons/material/ArrowRight';
import {ConfirmationDialog} from '@ui/overlays/dialog/confirmation-dialog';
import {Dialog} from '@ui/overlays/dialog/dialog';
import {DialogBody} from '@ui/overlays/dialog/dialog-body';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {DialogHeader} from '@ui/overlays/dialog/dialog-header';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {useSettings} from '@ui/settings/use-settings';
import {downloadFileFromUrl} from '@ui/utils/files/download-file-from-url';
import {openUploadWindow} from '@ui/utils/files/open-upload-window';
import {Fragment} from 'react';
import {
  useFieldArray,
  useForm,
  useFormContext,
  useWatch,
} from 'react-hook-form';
import {Link} from 'react-router';

const routes = {
  home: {
    route: 'hc',
    label: message('Homepage'),
  },
  newTicket: {
    route: 'hc/tickets/new',
    label: message('New ticket'),
  },
  article: {
    route: `hc/articles/${settingsPreviewPageId}/preview`,
    label: message('Article'),
  },
};

const sections = [
  {
    label: message('Header'),
    component: HeaderSettings,
    route: routes.home.route,
  },
  {
    label: message('Landing page'),
    component: LandingPageSettings,
    route: routes.home.route,
  },
  {
    label: message('Article page'),
    component: ArticlePageSettings,
    route: routes.article.route,
  },
  {
    label: message('New ticket page'),
    component: NewTicketPageSettings,
    route: routes.newTicket.route,
  },
  {
    label: message('Footer'),
    component: FooterSettings,
    route: routes.home.route,
  },
  {
    label: message('Data'),
    component: DataSettings,
    route: routes.home.route,
  },
  {
    label: message('Livechat'),
    component: LivechatSettings,
    route: routes.home.route,
  },
];

export function Component() {
  const {data} = useAdminSettings();
  const s = data.client;
  const form = useForm<AdminSettings>({
    defaultValues: {
      client: {
        articles: {
          default_order: s.articles?.default_order ?? 'position|desc',
        },
        article: {
          hide_new_ticket_link: s.article?.hide_new_ticket_link ?? false,
        },
        hcLanding: {
          articles_per_category: s.hcLanding?.articles_per_category ?? 10,
          children_per_category: s.hcLanding?.children_per_category ?? 10,
          hide_small_categories: s.hcLanding?.hide_small_categories ?? false,
          header: {
            variant: s.hcLanding?.header?.variant ?? 'simple',
            background: s.hcLanding?.header?.background ?? '',
            backgroundPosition: s.hcLanding?.header?.backgroundPosition ?? '',
            title: s.hcLanding?.header?.title ?? '',
            subtitle: s.hcLanding?.header?.subtitle ?? '',
            placeholder: s.hcLanding?.header?.placeholder ?? '',
          },
          content: {
            variant: s.hcLanding?.content?.variant ?? 'articleGrid',
          },
          show_footer: s.hcLanding?.show_footer ?? false,
        },
        hc: {
          newTicket: {appearance: s.hc?.newTicket?.appearance ?? {}},
          showLivechat: s.hc?.showLivechat ?? false,
        },
      },
    },
  });

  return (
    <SettingsWithPreview
      title={<Trans message="Help center" />}
      defaultRoute={routes.home.route}
      availableRoutes={routes}
      docsLink={AdminDocsUrls.settings.helpCenter}
    >
      <SettingsWithPreview.Content>
        <SettingsWithPreview.Form form={form}>
          <Sections />
        </SettingsWithPreview.Form>
      </SettingsWithPreview.Content>
      <SettingsWithPreview.Preview />
    </SettingsWithPreview>
  );
}

function Sections() {
  const setPreviewRoute = useSettingsPageStore(s => s.setPreviewRoute);
  return (
    <Accordion
      variant="outline"
      size="lg"
      onExpandedChange={([index]) => {
        if (!index || index === -1) {
          setPreviewRoute(routes.home.route);
        } else {
          setPreviewRoute(sections[index as number].route);
        }
      }}
    >
      {sections.map(section => {
        const Component = section.component;
        return (
          <AccordionItem
            key={section.label.message}
            label={<Trans {...section.label} />}
          >
            <Component />
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
function ArticlePageSettings() {
  return (
    <Fragment>
      <FormSelect
        label={<Trans message="Default article order" />}
        name="client.articles.default_order"
        className="mb-24"
        selectionMode="single"
      >
        <Item value="position|desc">
          <Trans message="Position" />
        </Item>
        <Item value="views|desc">
          <Trans message="Most viewed first" />
        </Item>
        <Item value="was_helpful|desc">
          <Trans message="Most helpful first" />
        </Item>
        <Item value="created_at|desc">
          <Trans message="Newest first" />
        </Item>
        <Item value="title|asc">
          <Trans message="A to Z" />
        </Item>
      </FormSelect>
      <FormSwitch name="client.article.hide_new_ticket_link">
        <Trans message="Hide 'Submit a Request' link" />
      </FormSwitch>
    </Fragment>
  );
}

function NewTicketPageSettings() {
  const selectedAttributeIds = useWatch<
    AdminSettings,
    'client.hc.newTicket.appearance.attributeIds'
  >({
    name: 'client.hc.newTicket.appearance.attributeIds',
  });
  const {setValue} = useFormContext<AdminSettings>();
  return (
    <Fragment>
      <FormTextField
        label={<Trans message="Title" />}
        className="mb-24"
        name="client.hc.newTicket.appearance.title"
      />
      <FormTextField
        label={<Trans message="Submit button text" />}
        className="mb-24"
        name="client.hc.newTicket.appearance.submitButtonText"
      />
      <SettingsSectionHeader
        margin="mt-24 mb-12"
        size="sm"
        className="border-t pt-18"
      >
        <Trans message="Fields" />
      </SettingsSectionHeader>
      <AttributesManager
        addButtonLabel={<Trans message="Add field" />}
        queryOptions={helpdeskQueries.attributes.normalizedList({
          type: 'conversation',
          for: 'agent',
        })}
        nonDeletableAttributeKeys={['subject', 'description']}
        selectedAttributeIds={selectedAttributeIds}
        onChange={newIds =>
          setValue('client.hc.newTicket.appearance.attributeIds', newIds, {
            shouldDirty: true,
          })
        }
      />
      <SettingsSectionHeader
        margin="mt-24 mb-12"
        size="sm"
        className="border-t pt-18"
      >
        <Trans message="Sidebar" />
      </SettingsSectionHeader>
      <FormTextField
        label={<Trans message="Title" />}
        className="mb-20"
        name="client.hc.newTicket.appearance.sidebarTitle"
      />
      <DialogTrigger type="drawer">
        <SettingsSectionButton
          size="md"
          endIcon={<ArrowRightIcon className="text-muted" />}
        >
          <Trans message="Tips" />
        </SettingsSectionButton>
        <TipsDialog />
      </DialogTrigger>
    </Fragment>
  );
}

function TipsDialog() {
  const {close} = useDialogContext();
  const {fields, append, remove} = useFieldArray<
    AdminSettings,
    'client.hc.newTicket.appearance.sidebarTips'
  >({
    name: 'client.hc.newTicket.appearance.sidebarTips',
  });

  return (
    <Dialog>
      <DialogHeader
        actions={
          <Button
            size="xs"
            variant="outline"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => append({title: '', content: ''})}
          >
            <Trans message="Add tip" />
          </Button>
        }
        rightAdornment={
          <Button variant="outline" size="xs" onClick={close}>
            <Trans message="Save & close" />
          </Button>
        }
      >
        <Trans message="Sidebar tips" />
      </DialogHeader>
      <DialogBody>
        {fields.map((tip, index) => (
          <div
            key={tip.id}
            className={
              index < fields.length - 1 ? 'mb-24 border-b pb-24' : undefined
            }
          >
            <FormTextField
              label={<Trans message="Title" />}
              className="mb-24"
              name={`client.hc.newTicket.appearance.sidebarTips.${index}.title`}
            />
            <FormTextField
              label={<Trans message="Content" />}
              className="mb-12"
              name={`client.hc.newTicket.appearance.sidebarTips.${index}.content`}
              inputElementType="textarea"
              rows={2}
            />
            <Button color="danger" size="xs" onClick={() => remove(index)}>
              <Trans message="Delete" />
            </Button>
          </div>
        ))}
      </DialogBody>
    </Dialog>
  );
}

function HeaderSettings() {
  const form = useFormContext<AdminSettings>();
  return (
    <Fragment>
      <FormSelect
        className="mb-24"
        selectionMode="single"
        label={<Trans message="Header style" />}
        name="client.hcLanding.header.variant"
      >
        <Item value="simple">
          <Trans message="Simple" />
        </Item>
        <Item value="colorful">
          <Trans message="Colorful" />
        </Item>
      </FormSelect>
      <FormImageSelector
        name="client.hcLanding.header.background"
        className="mb-12"
        label={<Trans message="Background image" />}
        uploadType={UploadType.brandingImages}
        showRemoveButton
      />
      <BackgroundPositionSelector />
      <FormTextField
        label={<Trans message="Header title" />}
        size="sm"
        className="mb-24"
        name="client.hcLanding.header.title"
        inputElementType="textarea"
        rows={2}
      />
      <FormTextField
        label={<Trans message="Header subtitle" />}
        size="sm"
        className="mb-24"
        inputElementType="textarea"
        rows={2}
        name="client.hcLanding.header.subtitle"
      />
      <FormTextField
        label={<Trans message="Search field placeholder" />}
        size="sm"
        name="client.hcLanding.header.placeholder"
        inputElementType="textarea"
        rows={2}
      />
    </Fragment>
  );
}

function BackgroundPositionSelector() {
  const {setValue, getValues} = useFormContext<AdminSettings>();
  const value = useWatch<AdminSettings, 'client.hcLanding.header'>({
    name: 'client.hcLanding.header',
  });
  console.log(value);
  return (
    <SimpleBackgroundPositionSelector
      className="mb-20"
      compactLabels
      value={value}
      disabled={!value?.background}
      onChange={value => {
        console.log(value);
        setValue(
          'client.hcLanding.header',
          {
            ...getValues('client.hcLanding.header'),
            ...value,
          },
          {shouldDirty: true},
        );
      }}
    />
  );
}

function LandingPageSettings() {
  const form = useFormContext<AdminSettings>();
  return (
    <Fragment>
      <FormSelect
        selectionMode="single"
        label={<Trans message="Content style" />}
        name="client.hcLanding.content.variant"
      >
        <Item value="categoryGrid">
          <Trans message="Category grid" />
        </Item>
        <Item value="articleGrid">
          <Trans message="Article grid" />
        </Item>
        <Item value="multiProduct">
          <Trans message="Multiproduct" />
        </Item>
      </FormSelect>
      <FormTextField
        name="client.hcLanding.children_per_category"
        label={<Trans message="Maximum categories to show" />}
        className="my-24"
        type="number"
        min="1"
        max="50"
      />
      {form.watch('client.hcLanding.content.variant') === 'articleGrid' && (
        <div>
          <FormTextField
            name="client.hcLanding.articles_per_category"
            label={<Trans message="Maximum articles per section" />}
            type="number"
            className="mb-24"
            min="1"
            max="50"
          />
          <FormSwitch name="client.hcLanding.hide_small_categories">
            <Trans message="Hide empty categories" />
          </FormSwitch>
        </div>
      )}
    </Fragment>
  );
}

function FooterSettings() {
  return (
    <Fragment>
      <FormSwitch name="client.hcLanding.show_footer">
        <Trans message="Show footer" />
      </FormSwitch>
      <div className="mt-12 text-sm">
        <Trans
          message="Customize footer content from <a>menu manager</a>."
          values={{
            a: content => (
              <Link
                to="/admin/settings/menus"
                target="_blank"
                className={LinkStyle}
              >
                {content}
              </Link>
            ),
          }}
        />
      </div>
    </Fragment>
  );
}

function DataSettings() {
  return (
    <div>
      <div className="mb-4 text-sm">
        <Trans message="Import and export help center data (articles, categories, images, tags) in a .zip file for backup or migration." />
      </div>
      <div className="mt-10 flex items-center gap-10">
        <ImportButton />
        <ExportButton />
      </div>
    </div>
  );
}

function LivechatSettings() {
  return (
    <FormSwitch
      name="client.hc.showLivechat"
      description={
        <Trans message="Show livechat launcher on all help center pages" />
      }
    >
      <Trans message="Show livechat" />
    </FormSwitch>
  );
}

function ImportButton() {
  const importData = useImportHcDataFromZip();
  return (
    <DialogTrigger type="modal">
      <Button variant="outline" className="mr-2" size="xs">
        <Trans message="Import" />
      </Button>
      {({close}) => (
        <ConfirmationDialog
          isDanger
          title={<Trans message="Import help center data" />}
          body={
            <div>
              <Trans message="Are you sure you want to import help center data?" />
              <div className="mt-8 font-bold">
                <Trans message="This will erase all existing articles and categories." />
              </div>
            </div>
          }
          confirm={<Trans message="Import" />}
          isLoading={importData.isPending}
          onConfirm={async () => {
            const files = await openUploadWindow({
              extensions: ['zip'],
            });
            importData.mutate({file: files[0]}, {onSuccess: () => close()});
          }}
        />
      )}
    </DialogTrigger>
  );
}

function ExportButton() {
  const {base_url} = useSettings();
  const exportData = () => {
    const url = `${base_url}/api/v1/hc/actions/export`;
    downloadFileFromUrl(url, `hc-export.zip`);
  };

  return (
    <Button variant="outline" size="xs" onClick={() => exportData()}>
      <Trans message="Export" />
    </Button>
  );
}
