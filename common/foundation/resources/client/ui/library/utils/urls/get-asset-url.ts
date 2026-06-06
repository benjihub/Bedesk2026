import {getBootstrapData} from '@ui/bootstrap-data/bootstrap-data-store';
import {isAbsoluteUrl} from '@ui/utils/urls/is-absolute-url';

export function getAssetUrl(url: string) {
  if (isAbsoluteUrl(url)) {
    return url;
  }
  const assetUrl =
    getBootstrapData().settings.asset_url ||
    getBootstrapData().settings.base_url;

  //remove leading slash
  url = url.replace(/^\/+/g, '');

  if (url.startsWith('assets/')) {
    return `${assetUrl}/build/${url}`;
  }

  return `${assetUrl}/${url}`;
}
