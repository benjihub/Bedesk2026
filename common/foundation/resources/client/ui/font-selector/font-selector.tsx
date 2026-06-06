import {Trans} from '@ui/i18n/trans';
import React from 'react';
import {ButtonBase} from '@ui/buttons/button-base';
import clsx from 'clsx';
import {IllustratedMessage} from '@ui/images/illustrated-message';
import fontImage from './font.svg';
import {SvgImage} from '@ui/images/svg-image';
import {FontSelectorFilters} from '@common/ui/font-selector/font-selector-filters';
import {
  FontSelectorState,
  UseFontSelectorProps,
  useFontSelectorState,
} from '@common/ui/font-selector/font-selector-state';
import {FontSelectorPagination} from '@common/ui/font-selector/font-selector-pagination';
import {Skeleton} from '@ui/skeleton/skeleton';
import {AnimatePresence, m} from 'framer-motion';
import {opacityAnimation} from '@ui/animation/opacity-animation';
import {FontConfig} from '@ui/fonts/font-picker/font-config';

interface FontSelectorProps extends UseFontSelectorProps {
  className?: string;
}
export function FontSelector(props: FontSelectorProps) {
  const state = useFontSelectorState(props);
  return (
    <div className={props.className}>
      <FontSelectorFilters state={state} />
      <AnimatePresence initial={false} mode="wait">
        <FontList state={state} />
      </AnimatePresence>
      <FontSelectorPagination state={state} />
    </div>
  );
}

interface FontListProps {
  state: FontSelectorState;
}
function FontList({state}: FontListProps) {
  const {isLoading, fonts} = state;

  const gridClassName =
    'grid gap-24 grid-cols-[repeat(auto-fill,minmax(90px,1fr))] items-start';

  if (isLoading) {
    return <FontListSkeleton className={gridClassName} />;
  }

  if (!fonts?.length) {
    return (
      <IllustratedMessage
        className="mt-60"
        size="sm"
        image={<SvgImage src={fontImage} />}
        title={<Trans message="No matching fonts" />}
        description={
          <Trans message="Try another search query or different category" />
        }
      />
    );
  }

  return (
    <m.div key="font-list" {...opacityAnimation} className={gridClassName}>
      {fonts?.map(font => (
        <FontButton key={font.family} font={font} state={state} />
      ))}
    </m.div>
  );
}

interface FontButtonProps {
  font: FontConfig;
  state: FontSelectorState;
}
function FontButton({font, state: {value, onChange}}: FontButtonProps) {
  const isActive = value?.family === font.family;
  const displayName = font.family.split(',')[0].replace(/"/g, '');

  return (
    <ButtonBase
      key={font.family}
      display="block"
      onClick={() => {
        onChange(font);
      }}
    >
      <span
        className={clsx(
          'flex aspect-square items-center justify-center rounded-panel border text-4xl transition-bg-color hover:bg-hover md:text-5xl',
          isActive && 'ring-2 ring-primary ring-offset-2',
        )}
      >
        <span style={{fontFamily: font.family}}>Aa</span>
      </span>
      <span
        className={clsx(
          'mt-6 block overflow-hidden overflow-ellipsis whitespace-nowrap text-sm',
          isActive && 'text-primary',
        )}
      >
        {font.label ? <Trans {...font.label} /> : displayName}
      </span>
    </ButtonBase>
  );
}

interface FontListSkeletonProps {
  className: string;
}
function FontListSkeleton({className}: FontListSkeletonProps) {
  const items = Array.from(Array(20).keys());
  return (
    <m.div key="font-list-skeleton" {...opacityAnimation} className={className}>
      {items.map(index => (
        <div key={index}>
          <div className="aspect-square">
            <Skeleton display="block" variant="rect" />
          </div>
          <Skeleton className="mt-6 text-sm" />
        </div>
      ))}
    </m.div>
  );
}
