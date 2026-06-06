import {AdminDocsUrls} from '@app/admin/admin-config';
import {AdminSettings} from '@common/admin/settings/admin-settings';
import {useSettingsPageStore} from '@common/admin/settings/layout/settings-page-store';
import {SettingsWithPreview} from '@common/admin/settings/layout/settings-with-preview';
import {CreateNewThemeButton} from '@common/admin/settings/pages/themes-settings/create-new-theme-button';
import {SelectThemeButton} from '@common/admin/settings/pages/themes-settings/select-theme-button';
import {ThemeColorButton} from '@common/admin/settings/pages/themes-settings/theme-color-button';
import {
  themeColorList,
  themeRadiusMap,
} from '@common/admin/settings/pages/themes-settings/theme-constants';
import {ThemeOptionsButton} from '@common/admin/settings/pages/themes-settings/theme-options-button';
import {useAdminSettings} from '@common/admin/settings/requests/use-admin-settings';
import {SiteConfigContext} from '@common/core/settings/site-config-context';
import {FontSelector} from '@common/ui/font-selector/font-selector';
import {Accordion, AccordionItem} from '@ui/accordion/accordion';
import {getBootstrapData} from '@ui/bootstrap-data/bootstrap-data-store';
import {ButtonBase} from '@ui/buttons/button-base';
import {Item as Option} from '@ui/forms/listbox/item';
import {FormSelect} from '@ui/forms/select/select';
import {FormSwitch} from '@ui/forms/toggle/switch';
import {Trans} from '@ui/i18n/trans';
import {useThemeSelector} from '@ui/themes/theme-selector-context';
import clsx from 'clsx';
import {ReactNode, use, useState} from 'react';
import {useForm, useFormContext, useWatch} from 'react-hook-form';

export function Component() {
  const {data} = useAdminSettings();
  const {auth} = use(SiteConfigContext);
  const siteThemes = data.themes.filter(t => t.type === 'site');

  const form = useForm<AdminSettings>({
    defaultValues: {
      themes: siteThemes,
      client: {
        themes: {
          default_id: data.client.themes?.default_id
            ? parseInt(data.client.themes.default_id as string)
            : 0,
          user_change: data.client.themes?.user_change ?? false,
        },
      },
    },
  });

  return (
    <SettingsWithPreview
      title={<Trans message="Themes" />}
      defaultRoute={getBootstrapData().auth_redirect_uri ?? '/'}
      docsLink={AdminDocsUrls.settings.themes}
    >
      <SettingsWithPreview.Content>
        <SettingsWithPreview.Form form={form}>
          <div className="mb-20 border-b pb-20">
            <FormSelect
              className="mb-20"
              size="sm"
              name="client.themes.default_id"
              selectionMode="single"
              label={<Trans message="Default site theme" />}
            >
              <Option value={0}>
                <Trans message="System" />
              </Option>
              {siteThemes.map(theme => (
                <Option key={theme.id} value={theme.id}>
                  {theme.name}
                </Option>
              ))}
            </FormSelect>
            <FormSwitch name="client.themes.user_change">
              <Trans message="Allow users to switch theme" />
            </FormSwitch>
          </div>
          <ThemeEditor />
        </SettingsWithPreview.Form>
      </SettingsWithPreview.Content>
      <SettingsWithPreview.Preview />
    </SettingsWithPreview>
  );
}

interface ThemeEditorProps {
  size?: 'md' | 'lg';
  type?: string;
}
export function ThemeEditor({size = 'lg', type = 'site'}: ThemeEditorProps) {
  const preview = useSettingsPageStore(s => s.preview);
  const form = useFormContext<AdminSettings>();
  const allThemes = useWatch<AdminSettings, 'themes'>({name: 'themes'}).filter(
    t => t.type === type,
  );
  const {selectedTheme: initialSelectedTheme} = useThemeSelector();
  const [selectedThemeId, setSelectedThemeId] = useState(() => {
    const initialTheme = allThemes.find(t => t.id === initialSelectedTheme.id);
    return initialTheme ? initialTheme.id : allThemes[0]?.id;
  });
  const selectedTheme = form
    .watch('themes')
    .find(t => t.id === selectedThemeId);

  const setSelectedTheme = (themeId: number) => {
    if (themeId === selectedThemeId) return;
    setSelectedThemeId(themeId);
    const theme = form.getValues('themes').find(t => t.id === themeId);
    if (theme) {
      preview.setActiveTheme(theme.id);
    }
  };

  return (
    <div>
      <div className="mb-24 flex items-center gap-8">
        <SelectThemeButton
          selectedThemeId={selectedThemeId}
          onSelectionChange={setSelectedTheme}
          allThemes={allThemes}
        />
        <ThemeOptionsButton
          selectedThemeId={selectedThemeId}
          initialThemeId={initialSelectedTheme.id}
          onSelectedThemeChange={setSelectedTheme}
        />
        <CreateNewThemeButton type={type} onCreated={setSelectedTheme} />
      </div>
      <Accordion variant="outline" size={size} className="mb-10">
        <AccordionItem
          fontClassName="text-sm"
          label={<Trans message="Font" />}
          descriptionClassName="overflow-hidden text-ellipsis whitespace-nowrap text-xs text-muted"
          description={
            selectedTheme?.font?.family ? (
              selectedTheme.font.family
            ) : (
              <Trans message="System" />
            )
          }
        >
          <FontList themeId={selectedThemeId} />
        </AccordionItem>
        <AccordionItem
          label={<Trans message="Rounding" />}
          fontClassName="text-sm"
        >
          <RadiusSelector
            label={<Trans message="Button rounding" />}
            name="button-radius"
            themeId={selectedThemeId}
            className="mb-24"
          />
          <RadiusSelector
            label={<Trans message="Input rounding" />}
            name="input-radius"
            themeId={selectedThemeId}
            className="mb-24"
          />
          <RadiusSelector
            label={<Trans message="Panel rounding" />}
            name="panel-radius"
            hidePill
            themeId={selectedThemeId}
          />
        </AccordionItem>
      </Accordion>
      {themeColorList.map(color => (
        <ThemeColorButton
          key={color.key}
          colorName={color.key}
          size={size}
          label={<Trans {...color.label} />}
          initialThemeValue={selectedTheme?.values[color.key] ?? ''}
          themeId={selectedThemeId}
        />
      ))}
    </div>
  );
}

interface FontListProps {
  themeId: number;
}
function FontList({themeId}: FontListProps) {
  const preview = useSettingsPageStore(s => s.preview);
  const {setValue, watch} = useFormContext<AdminSettings>();
  const selectedThemeIndex = watch('themes').findIndex(t => t.id === themeId);
  const key = `themes.${selectedThemeIndex}.font` as 'themes.1.font';
  return (
    <FontSelector
      value={watch(key)}
      onChange={font => {
        setValue(key, font, {shouldDirty: true});
        preview.setThemeFont(font);
      }}
    />
  );
}

interface RadiusSelectorProps {
  label: ReactNode;
  name: string;
  hidePill?: boolean;
  themeId: number;
  className?: string;
}
function RadiusSelector({
  label,
  name,
  hidePill,
  themeId,
  className,
}: RadiusSelectorProps) {
  const preview = useSettingsPageStore(s => s.preview);
  const {watch, setValue} = useFormContext<AdminSettings>();
  const themeIndex = watch('themes').findIndex(t => t.id === themeId);
  const formKey =
    `themes.${themeIndex}.values.--be-${name}` as 'themes.1.values.--be-button-radius';
  const currentValue = watch(formKey);
  return (
    <div className={className}>
      <div className="mb-10 text-sm font-semibold">{label}</div>
      <div className="grid grid-cols-3 gap-10 text-sm">
        {Object.entries(themeRadiusMap)
          .filter(([key]) => !hidePill || !key.includes('full'))
          .map(([key, {label, value}]) => (
            <ButtonBase
              key={key}
              display="block"
              className={clsx(
                'h-36 border-2 hover:bg-hover',
                key,
                value === currentValue && 'border-primary',
              )}
              onClick={() => {
                setValue(formKey, value, {shouldDirty: true});
                preview.setThemeValue(`--be-${name}`, value);
              }}
            >
              <Trans {...label} />
            </ButtonBase>
          ))}
      </div>
    </div>
  );
}
