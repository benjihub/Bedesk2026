import {IllustratedMessage} from '@ui/images/illustrated-message';
import {ErrorIcon} from '@ui/icons/material/Error';
import React, {ReactNode} from 'react';

interface Props {
  title?: ReactNode;
  description?: ReactNode;
}
export function HcManagerEmptyMessage({title, description}: Props) {
  return (
    <IllustratedMessage
      className="mx-auto mt-40 max-w-450"
      image={
        <div>
          <ErrorIcon size="lg" />
        </div>
      }
      size="sm"
      imageHeight="h-auto"
      imageMargin="mb-12"
      title={title}
      description={description}
    />
  );
}
