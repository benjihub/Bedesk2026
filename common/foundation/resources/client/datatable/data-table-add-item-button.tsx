import {Button} from '@ui/buttons/button';
import {ButtonBaseProps} from '@ui/buttons/button-base';
import {IconButton} from '@ui/buttons/icon-button';
import {AddIcon} from '@ui/icons/material/Add';
import {useIsMobileMediaQuery} from '@ui/utils/hooks/is-mobile-media-query';
import React, {ReactElement, ReactNode} from 'react';
import {To} from 'react-router';

export interface DataTableAddItemButtonProps {
  children: ReactNode;
  to?: To;
  href?: string;
  download?: boolean | string;
  elementType?: ButtonBaseProps['elementType'];
  onClick?: ButtonBaseProps['onClick'];
  icon?: ReactElement;
  disabled?: boolean;
  className?: string;
  alwaysDesktop?: boolean;
}
export const DataTableAddItemButton = React.forwardRef<
  HTMLButtonElement,
  DataTableAddItemButtonProps
>(
  (
    {
      children,
      to,
      elementType,
      onClick,
      href,
      download,
      icon,
      disabled,
      className,
      alwaysDesktop,
    },
    ref,
  ) => {
    const isMobile = useIsMobileMediaQuery();

    if (isMobile && !alwaysDesktop) {
      return (
        <IconButton
          ref={ref}
          variant="flat"
          color="primary"
          size="sm"
          to={to}
          href={href}
          download={download}
          elementType={elementType}
          onClick={onClick}
          disabled={disabled}
          className={className}
        >
          {icon || <AddIcon />}
        </IconButton>
      );
    }

    return (
      <Button
        ref={ref}
        startIcon={icon || <AddIcon />}
        variant="flat"
        color="primary"
        size="sm"
        to={to}
        href={href}
        download={download}
        elementType={elementType}
        onClick={onClick}
        disabled={disabled}
        display="flex"
        className={className}
      >
        {children}
      </Button>
    );
  },
);
