import {Button, ButtonProps} from '@ui/buttons/button';
import {IconButton} from '@ui/buttons/icon-button';
import {Trans} from '@ui/i18n/trans';
import {FilterAltIcon} from '@ui/icons/material/FilterAlt';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {useIsMobileMediaQuery} from '@ui/utils/hooks/is-mobile-media-query';
import {ReactElement} from 'react';
import {AddFilterDialog} from './add-filter-dialog';
import {BackendFilter} from './backend-filter';

interface AddFilterButtonProps {
  filters: BackendFilter[];
  icon?: ReactElement;
  color?: ButtonProps['color'];
  variant?: ButtonProps['variant'];
  disabled?: boolean;
  size?: ButtonProps['size'];
  className?: string;
}
export function AddFilterButton({
  filters,
  icon = <FilterAltIcon />,
  color = 'primary',
  variant = 'outline',
  size = 'sm',
  disabled,
  className,
}: AddFilterButtonProps) {
  const isMobile = useIsMobileMediaQuery();

  const desktopButton = (
    <Button
      variant={variant}
      color={color}
      startIcon={icon}
      disabled={disabled}
      size={size}
      className={className}
    >
      <Trans message="Filter" />
    </Button>
  );

  const mobileButton = (
    <IconButton
      color={color}
      size="sm"
      variant={variant}
      disabled={disabled}
      className={className}
    >
      {icon}
    </IconButton>
  );

  return (
    <DialogTrigger type="popover">
      {isMobile ? mobileButton : desktopButton}
      <AddFilterDialog filters={filters} />
    </DialogTrigger>
  );
}
