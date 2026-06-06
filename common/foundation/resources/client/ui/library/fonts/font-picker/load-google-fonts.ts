import lazyLoader from '@ui/utils/loaders/lazy-loader';
import {FontConfig} from '@ui/fonts/font-picker/font-config';

export function loadGoogleFonts(fonts: FontConfig[], id: string) {
  const googleFonts = fonts.filter(f => f.google);
  if (googleFonts?.length) {
    const families = fonts.map(f => `${f.family}:400`).join('|');
    lazyLoader.loadAsset(
      `https://fonts.googleapis.com/css?family=${families}&display=swap`,
      {type: 'css', id},
    );
  }
}
