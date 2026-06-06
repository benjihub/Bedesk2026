import {getCountryList} from '@ui/utils/intl/countries';
import memoize from 'nano-memoize';

export const getLanguageList = memoize((lang: string = 'en') => {
  const formatter = new Intl.DisplayNames([lang], {type: 'language'});
  const countries = getCountryList(lang);
  const languages = [];

  const usedLangCodes: string[] = [];
  for (let i = 0; i < countries.length; i++) {
    const countryCode = countries[i].code.toLowerCase();
    const langCode = new Intl.Locale('und', {region: countryCode}).maximize()
      .language;
    try {
      const langName = formatter.of(langCode);
      if (
        langName &&
        !usedLangCodes.includes(langCode) &&
        langCode !== langName
      ) {
        usedLangCodes.push(langCode);
        languages.push({code: langCode, name: langName});
      }
    } catch (e) {}
  }

  return languages;
});
