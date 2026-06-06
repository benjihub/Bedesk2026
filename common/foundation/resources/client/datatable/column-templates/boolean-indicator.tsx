import {CheckIcon} from '@ui/icons/material/Check';
import {CloseIcon} from '@ui/icons/material/Close';
import React from 'react';

interface BooleanIndicatorProps {
  value: boolean;
}
export function BooleanIndicator({value}: BooleanIndicatorProps) {
  if (value) {
    return <CheckIcon className="text-positive icon-md" />;
  }
  return <CloseIcon className="text-danger icon-md" />;
}
