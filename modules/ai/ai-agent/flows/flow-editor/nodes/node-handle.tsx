import {Handle, HandleProps} from '@xyflow/react';
import clsx from 'clsx';

interface Props extends HandleProps {
  size?: string;
}
export function NodeHandle({type, position, size = 'w-8 h-8'}: Props) {
  return (
    <Handle
      className={clsx(size, 'pointer-events-none opacity-0')}
      type={type}
      position={position}
    />
  );
}
