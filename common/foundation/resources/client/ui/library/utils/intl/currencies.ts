import memoize from 'nano-memoize';

const primary = [
  'USD',
  'EUR',
  'JPY',
  'GBP',
  'AUD',
  'CAD',
  'CHF',
  'CNY',
  'HKD',
  'NZD',
];

export const getCurrencyList = memoize((lang = 'en') => {
  const codes = Intl.supportedValuesOf('currency');
  const allCurrencies = codes.map(code => ({
    code,
    name: new Intl.DisplayNames([lang], {type: 'currency'}).of(code),
  }));

  const primaryCurrencies = allCurrencies.filter(currency =>
    primary.includes(currency.code),
  );

  const otherCurrencies = allCurrencies.filter(
    currency => !primary.includes(currency.code),
  );

  return [...primaryCurrencies, ...otherCurrencies];
});
