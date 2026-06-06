import {useBootstrapDataStore} from '@ui/bootstrap-data/bootstrap-data-store';

export function useSelectedLocale() {
  const data = useBootstrapDataStore(s => s.data);
  const selected = data?.i18n?.locales.find(
    l => l.language === data?.i18n.active,
  );
  return {
    localeName: selected?.name,
    localeCode: data?.i18n.active || 'en',
    lines: selected?.lines,
  };
}
