import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';

export const statusCategoryNames = {
  open: message('Open'),
  pending: message('Pending'),
  closed: message('Closed'),
  locked: message('Locked'),
};

export const statusCategory = {
  open: 6,
  pending: 5,
  closed: 4,
  locked: 3,
};

export function StatusCategoryName({category}: {category: number}) {
  switch (category) {
    case statusCategory.open:
      return <Trans {...statusCategoryNames.open} />;
    case statusCategory.pending:
      return <Trans {...statusCategoryNames.pending} />;
    case statusCategory.closed:
      return <Trans {...statusCategoryNames.closed} />;
    case statusCategory.locked:
      return <Trans {...statusCategoryNames.locked} />;
    default:
      return '-';
  }
}
