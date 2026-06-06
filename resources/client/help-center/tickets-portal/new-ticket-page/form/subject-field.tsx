import {CompactAttribute} from '@app/attributes/compact-attribute';
import {SuggestedArticlesDrawer} from '@app/help-center/tickets-portal/new-ticket-page/suggested-articles-drawer';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {Trans} from '@ui/i18n/trans';
import {Fragment} from 'react';

interface Props {
  attribute: CompactAttribute;
  searchQuery: string;
  hcCategoryIds: number[] | undefined;
}
export function SubjectField({attribute, searchQuery, hcCategoryIds}: Props) {
  return (
    <Fragment>
      <FormTextField
        name="subject"
        label={<Trans message={attribute.name} />}
        required
      />
      <SuggestedArticlesDrawer
        query={searchQuery}
        hcCategoryIds={hcCategoryIds}
      />
    </Fragment>
  );
}
