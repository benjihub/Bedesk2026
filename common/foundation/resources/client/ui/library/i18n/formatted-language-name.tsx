import {useSelectedLocale} from '@ui/i18n/selected-locale';
import {Fragment, memo} from 'react';

interface Props {
  code: string;
}
export const FormattedLanguageName = memo(({code: languageCode}: Props) => {
  const {localeCode} = useSelectedLocale();
  const regionNames = new Intl.DisplayNames([localeCode], {type: 'language'});
  let formattedName: string | undefined;

  try {
    formattedName = regionNames.of(languageCode);
  } catch (e) {}

  return <Fragment>{formattedName}</Fragment>;
});
