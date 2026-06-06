import {LocationDatasetItem} from '@common/admin/analytics/report-metric';
import {message} from '@ui/i18n/message';
import {useTrans} from '@ui/i18n/use-trans';
import {useSettings} from '@ui/settings/use-settings';
import {useThemeSelector} from '@ui/themes/theme-selector-context';
import {themeValueToHex} from '@ui/themes/utils/theme-value-to-hex';
import lazyLoader from '@ui/utils/loaders/lazy-loader';
import {RefObject, useCallback, useEffect, useRef} from 'react';

const loaderUrl = 'https://www.gstatic.com/charts/loader.js';

interface UseGoogleGeoChartProps {
  placeholderRef: RefObject<HTMLDivElement | null>;
  data: LocationDatasetItem[];
  onCountrySelected?: (countryCode: string) => void;
  country?: string;
}
export function useGoogleGeoChart({
  placeholderRef,
  data,
  country,
  onCountrySelected,
}: UseGoogleGeoChartProps) {
  const {trans} = useTrans();
  const {analytics} = useSettings();
  const apiKey = analytics?.gchart_api_key;
  const {selectedTheme} = useThemeSelector();
  const geoChartRef = useRef<google.visualization.GeoChart>(null);
  // only allow selecting countries, not cities
  const regionInteractivity = !!onCountrySelected && !country;
  const drawGoogleChart = useCallback(() => {
    if (typeof google === 'undefined') return;

    const seedData = data.map(location => [location.label, location.value]);
    seedData.unshift([
      country ? trans(message('City')) : trans(message('Country')),
      trans(message('Clicks')),
    ]);

    const backgroundColor = `${themeValueToHex(
      selectedTheme.values['--be-bg-elevated'],
    )}`;
    const chartColor = `${themeValueToHex(
      selectedTheme.values['--be-primary'],
    )}`;

    const options: google.visualization.GeoChartOptions = {
      colorAxis: {colors: [chartColor]},
      backgroundColor,
      region: country ? country.toUpperCase() : undefined,
      resolution: country ? 'provinces' : 'countries',
      displayMode: country ? 'markers' : 'regions',
      enableRegionInteractivity: regionInteractivity,
    };

    if (
      !geoChartRef.current &&
      placeholderRef.current &&
      google?.visualization?.GeoChart
    ) {
      geoChartRef.current = new google.visualization.GeoChart(
        placeholderRef.current,
      );
    }
    geoChartRef.current?.draw(
      google.visualization.arrayToDataTable(seedData),
      options,
    );
  }, [
    selectedTheme,
    data,
    placeholderRef,
    trans,
    country,
    regionInteractivity,
  ]);

  const initGoogleGeoChart = useCallback(async () => {
    if (lazyLoader.isLoadingOrLoaded(loaderUrl)) return;
    await lazyLoader.loadAsset(loaderUrl, {type: 'js', id: 'google-charts-js'});
    await google.charts.load('current', {
      packages: ['geochart'],
      mapsApiKey: apiKey,
    });
    drawGoogleChart();
  }, [apiKey, drawGoogleChart]);

  useEffect(() => {
    if (geoChartRef.current && onCountrySelected) {
      google.visualization.events.addListener(
        geoChartRef.current,
        'regionClick',
        (a: {region: string}) => onCountrySelected?.(a.region),
      );
    }

    return () => {
      if (geoChartRef.current) {
        google.visualization.events.removeAllListeners(geoChartRef.current);
      }
    };
    // this will correctly run when geochart instance is set on ref
  }, [onCountrySelected, geoChartRef.current]);

  // on component load: load chart library then draw, otherwise just draw
  useEffect(() => {
    initGoogleGeoChart();
  }, [initGoogleGeoChart]);

  // redraw chart if data or theme changes
  useEffect(() => {
    drawGoogleChart();
  }, [selectedTheme, drawGoogleChart, data]);

  return {drawGoogleChart};
}
