import {memo, useEffect, useState} from 'react';
import clsx from 'clsx';

interface Props {
  src: string;
  className?: string;
  height?: string | false;
}
export const SvgImage = memo(({src, className, height = 'h-full'}: Props) => {
  const svgString = useSvgImageContent(src);
  // render container even if image is not loaded yet, so there's
  // no layout shift if height is provided via className
  return (
    <div
      className={clsx(
        'svg-image-container inline-block bg-no-repeat',
        height,
        className,
      )}
      dangerouslySetInnerHTML={svgString ? {__html: svgString} : undefined}
    />
  );
});

const svgCache = new Map<string, Promise<any> | string>();

function useSvgImageContent(src: string): string | null {
  const [image, setImage] = useState<string | null>(null);

  useEffect(() => {
    const cached = svgCache.get(src);
    if (cached) {
      // svg was already fetched
      if (typeof cached === 'string') {
        setImage(cached);
        //  svg is currently being fetched
      } else {
        cached.then(setImage);
      }
      // fetch the svg
    } else {
      const promise = fetchSvgImageContent(src);
      svgCache.set(src, promise);
      promise.then(svg => {
        svgCache.set(src, svg);
        setImage(svg);
      });
    }
  }, [src]);

  return image;
}

function fetchSvgImageContent(src: string) {
  return fetch(src).then(response => response.text());
}
