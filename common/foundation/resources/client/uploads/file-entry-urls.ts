import {getBootstrapData} from '@ui/bootstrap-data/bootstrap-data-store';
import {useSettings} from '@ui/settings/use-settings';
import {isAbsoluteUrl} from '@ui/utils/urls/is-absolute-url';
import {createContext, useContext, useMemo} from 'react';

export const FileEntryUrlsContext = createContext<
  Record<string, string | number | null | undefined>
>(null!);

interface PartialEntry {
  url?: string;
  hash: string;
  file_name: string;
  extension?: string;
  thumbnail?: boolean;
}

export function useFileEntryUrls(
  entry?: PartialEntry,
  options?: {preferThumbnail?: boolean; downloadHashes?: string[]},
): {previewUrl?: string; downloadUrl?: string} {
  const {base_url} = useSettings();
  const urlSearchParams = useContext(FileEntryUrlsContext);

  return useMemo(() => {
    if (!entry) {
      return {};
    }

    const previewUrl = buildPreviewUrl(
      entry,
      options?.preferThumbnail || false,
    );

    const urls = {
      previewUrl,
      downloadUrl: `${base_url}/api/v1/file-entries/download/${
        options?.downloadHashes || entry.hash
      }`,
    };

    if (urlSearchParams) {
      // preview url
      if (urls.previewUrl) {
        urls.previewUrl = addParams(
          urls.previewUrl,
          {
            ...urlSearchParams,
            thumbnail: options?.preferThumbnail ? 'true' : '',
          },
          base_url,
        );
      }

      // download url
      urls.downloadUrl = addParams(urls.downloadUrl, urlSearchParams, base_url);
    }

    return urls;
  }, [
    base_url,
    entry,
    options?.downloadHashes,
    options?.preferThumbnail,
    urlSearchParams,
  ]);
}

function buildPreviewUrl(
  entry: PartialEntry,
  preferThumbnail: boolean,
): string | undefined {
  if (!entry.url) return;

  if (isAbsoluteUrl(entry.url)) {
    if (preferThumbnail && entry.thumbnail) {
      // replace last instance of entry.file_name in entry.url with 'thumbnail'
      const extension = entry.extension === 'png' ? 'png' : 'jpg';
      return entry.url.replace(
        new RegExp(entry.file_name + '$'),
        `thumbnail.${extension}`,
      );
    } else {
      return entry.url;
    }
  }

  return `${getBootstrapData().settings.base_url}/${entry.url}`;
}

function addParams(urlString: string, params: object, baseUrl: string): string {
  const url = new URL(urlString, baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value as string);
  });
  return url.toString();
}
