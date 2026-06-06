import {FormNormalizedModelField} from '@common/ui/normalized-model/normalized-model-field';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';

const placeholder = message('Select author...');
const searchPlaceholder = message('Find a user');
export function ArticleAuthorField() {
  return (
    <FormNormalizedModelField
      endpoint="helpdesk/normalized-models/article-authors"
      name="author_id"
      background="bg"
      className="mb-24"
      label={<Trans message="Author" />}
      placeholder={placeholder}
      searchPlaceholder={searchPlaceholder}
    />
  );
}
