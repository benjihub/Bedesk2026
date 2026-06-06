import {statusCategory} from '@app/dashboard/statuses/status-category';
import clsx from 'clsx';

interface StatusColor {
  bg: string;
  text: string;
  button: 'chip' | 'primary' | 'danger' | 'positive';
}

export const getStatusColor = (category: number): StatusColor => {
  switch (category) {
    case statusCategory.locked:
      return {
        bg: 'bg-chip',
        text: 'text-chip',
        button: 'chip',
      };
    case statusCategory.pending:
      return {
        bg: 'bg-danger',
        text: 'text-danger',
        button: 'danger',
      };
    case statusCategory.closed:
      return {
        bg: 'bg-positive',
        text: 'text-positive',
        button: 'positive',
      };
    default:
      return {
        bg: 'bg-primary',
        text: 'text-primary',
        button: 'primary',
      };
  }
};

export function StatusColorDot({category}: {category: number}) {
  return (
    <div
      className={clsx('h-8 w-8 rounded-full', getStatusColor(category).bg)}
    />
  );
}
