import {useChangeLocale} from '@common/locale-switcher/change-locale';
import {useBootstrapDataStore} from '@ui/bootstrap-data/bootstrap-data-store';
import {Button} from '@ui/buttons/button';
import {useSelectedLocale} from '@ui/i18n/selected-locale';
import {KeyboardArrowDownIcon} from '@ui/icons/material/KeyboardArrowDown';
import {LanguageIcon} from '@ui/icons/material/Language';
import {Menu, MenuItem, MenuTrigger} from '@ui/menu/menu-trigger';
import {useSettings} from '@ui/settings/use-settings';

export function LocaleSwitcher() {
  const {localeCode, localeName} = useSelectedLocale();
  const changeLocale = useChangeLocale();
  const siteLocales = useBootstrapDataStore(s => s.data.i18n.locales);
  const {i18n} = useSettings();

  if (!siteLocales || !localeCode || !i18n.enable) return null;

  return (
    <MenuTrigger
      floatingWidth="matchTrigger"
      selectionMode="single"
      selectedValue={localeCode}
      onSelectionChange={value => {
        const newLocale = value as string;
        if (newLocale !== localeCode) {
          changeLocale.mutate({locale: newLocale});
        }
      }}
    >
      <Button
        disabled={changeLocale.isPending}
        className="capitalize"
        startIcon={<LanguageIcon />}
        endIcon={<KeyboardArrowDownIcon />}
      >
        {localeName}
      </Button>
      <Menu>
        {siteLocales.map(locale => (
          <MenuItem
            value={locale.language}
            key={locale.language}
            className="capitalize"
          >
            {locale.name}
          </MenuItem>
        ))}
      </Menu>
    </MenuTrigger>
  );
}
