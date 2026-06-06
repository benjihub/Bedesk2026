import {Trans} from '@ui/i18n/trans';
import {SvgIconProps} from '@ui/icons/svg-icon';
import {IllustratedMessage} from '@ui/images/illustrated-message';
import {SvgImage} from '@ui/images/svg-image';
import {useIsMobileMediaQuery} from '@ui/utils/hooks/is-mobile-media-query';
import {cloneElement, isValidElement, ReactElement, ReactNode} from 'react';

export interface DataTableEmptyStateMessageProps {
  isFiltering?: boolean;
  title: ReactNode;
  filteringTitle?: ReactNode;
  description?: ReactNode;
  image?: string;
  icon?: ReactElement<SvgIconProps>;
  size?: 'sm' | 'md';
  className?: string;
}
export function DataTableEmptyStateMessage(
  props: DataTableEmptyStateMessageProps,
) {
  const isMobile = useIsMobileMediaQuery();
  const {isFiltering, title, filteringTitle, image, icon, className} = props;
  let size = props.size;
  if (!size) {
    size = isMobile ? 'sm' : 'md';
  }

  // allow user to disable filtering message variation by not passing in "filteringTitle"
  return (
    <IllustratedMessage
      className={className}
      size={size}
      imageHeight={icon ? 'h-auto' : undefined}
      image={
        image ? (
          <SvgImage src={image} />
        ) : isValidElement(icon) ? (
          cloneElement(icon, {
            size: (icon.props && (icon.props as any).size) || 'xl',
            className: 'text-muted',
          })
        ) : undefined
      }
      title={isFiltering && filteringTitle ? filteringTitle : title}
      description={<Description {...props} />}
    />
  );
}

function Description({
  isFiltering,
  filteringTitle,
  description,
}: DataTableEmptyStateMessageProps) {
  if (isFiltering) {
    return filteringTitle ? (
      <Trans message="Try another search query or different filters" />
    ) : undefined;
  } else {
    return description;
  }
}
