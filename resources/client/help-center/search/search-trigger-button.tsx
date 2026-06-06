import React, {forwardRef, ReactNode} from 'react';
import clsx from 'clsx';
import {SearchIcon} from '@ui/icons/material/Search';
import {ButtonBase} from '@ui/buttons/button-base';
import {useKeybind} from '@ui/utils/keybinds/use-keybind';

const ignoredElements = ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'];

export interface SearchTriggerButtonProps {
  onTrigger: () => void;
  onClick?: () => void;
  bg?: string;
  radius?: string;
  width?: string;
  className?: string;
  children: ReactNode;
  size?: 'sm' | 'lg';
}

export const SearchTriggerButton = forwardRef<
  HTMLButtonElement,
  SearchTriggerButtonProps
>(
  (
    {
      onTrigger,
      size,
      children,
      bg,
      width,
      radius = 'rounded-input',
      className,
      onClick,
      ...buttonProps
    },
    ref,
  ) => {
    useKeybind('window', 'ctrl+k', e => {
      if (!ignoredElements.includes((e?.target as HTMLElement).tagName)) {
        onTrigger();
      }
    });

    return (
      <ButtonBase
        ref={ref}
        {...buttonProps}
        display="block"
        onClick={e => onTrigger()}
        justify="justify-none"
        className="flex-shrink-0"
      >
        <span
          className={clsx(
            'hidden items-center border bg-background text-muted shadow-sm transition-shadow focus:border-primary/60 focus:outline-none focus:ring focus:ring-primary/focus md:flex',
            size === 'sm' && 'h-36 gap-6 px-12 text-sm',
            size === 'lg' && 'text-md h-60 gap-12 px-24',
            bg,
            width,
            radius,
            className,
          )}
        >
          <SearchIcon
            className="text-muted"
            size={size === 'sm' ? 'sm' : 'md'}
          />
          <span>{children}</span>
          <kbd className="ml-auto hidden font-medium md:block">
            <kbd className="font-sans">⌘</kbd>
            <kbd className="font-sans">K</kbd>
          </kbd>
        </span>
        <span className="focus:border-primary/60 focus:outline-none focus:ring focus:ring-primary/focus md:hidden">
          <SearchIcon />
        </span>
      </ButtonBase>
    );
  },
);
