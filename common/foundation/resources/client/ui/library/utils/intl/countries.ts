import memoize from 'nano-memoize';

export const getCountryList = memoize(
  (lang = 'en'): {code: string; name: string}[] => {
    const A = 65;
    const Z = 90;
    const countryName = new Intl.DisplayNames([lang], {type: 'region'});
    const countries: {code: string; name: string}[] = [];
    for (let i = A; i <= Z; ++i) {
      for (let j = A; j <= Z; ++j) {
        const code = String.fromCharCode(i) + String.fromCharCode(j);
        const name = countryName.of(code);
        if (code !== name && name) {
          countries.push({code: code.toLowerCase(), name});
        }
      }
    }
    return countries;
  },
);
