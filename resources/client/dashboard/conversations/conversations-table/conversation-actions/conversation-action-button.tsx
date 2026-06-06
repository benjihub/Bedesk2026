import {Button, ButtonProps} from '@ui/buttons/button';
import {ButtonColor} from '@ui/buttons/get-shared-button-style';
import {IconButton} from '@ui/buttons/icon-button';
import {MessageDescriptor} from '@ui/i18n/message-descriptor';
import {Tooltip} from '@ui/tooltip/tooltip';
import {forwardRef, ReactElement} from 'react';

interface Props {
  startIcon: ReactElement;
  endIcon?: ReactElement;
  children: ReactElement<MessageDescriptor>;
  color?: ButtonColor;
  isCompact?: boolean;
  disabled?: boolean;
  elementType?: ButtonProps['elementType'];
  to?: ButtonProps['to'];
  relative?: ButtonProps['relative'];
  className?: string;
}
export const ConversationActionButton = forwardRef<HTMLButtonElement, Props>(
  (
    {
      startIcon,
      endIcon,
      children,
      color,
      isCompact = false,
      className,
      ...buttonProps
    },
    ref,
  ) => {
    if (isCompact) {
      return (
        <Tooltip label={children} ref={ref}>
          <IconButton
            color={color}
            iconSize="md"
            size="sm"
            className={className}
            {...buttonProps}
          >
            {startIcon}
          </IconButton>
        </Tooltip>
      );
    }
    return (
      <Button
        startIcon={startIcon}
        endIcon={endIcon}
        variant="outline"
        color={color}
        size="xs"
        ref={ref}
        className={className}
        {...buttonProps}
      >
        {children}
      </Button>
    );
  },
);
