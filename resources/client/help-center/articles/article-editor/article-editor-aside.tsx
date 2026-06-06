import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {ArticleAttachmentsEditor} from '@app/help-center/articles/article-editor/article-attachments-editor';
import {ArticleAuthorField} from '@app/help-center/articles/article-editor/article-author-field';
import {ArticleSectionSelector} from '@app/help-center/articles/article-editor/article-section-selector';
import {UpdateArticlePayload} from '@app/help-center/articles/requests/use-update-article';
import {ManagedByField} from '@app/help-center/managed-by-field';
import {VisibleToField} from '@app/help-center/visible-to-field';
import {FileUploadProvider} from '@common/uploads/uploader/file-upload-provider';
import {useQuery} from '@tanstack/react-query';
import {FormChipField} from '@ui/forms/input-field/chip-field/form-chip-field';
import {Item} from '@ui/forms/listbox/item';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {Fragment, ReactNode} from 'react';
import {useFormContext} from 'react-hook-form';

interface Props {
  children?: ReactNode;
}
export function ArticleEditorAside({children}: Props) {
  const form = useFormContext<UpdateArticlePayload>();
  return (
    <Fragment>
      {children}
      <VisibleToField
        className="mb-24"
        description={
          <Trans message="Control who can see this article in help center" />
        }
      />
      <ArticleAuthorField />
      <ManagedByField
        className="mb-24"
        description={
          <Trans message="Control who can edit and publish this article" />
        }
      />
      <ArticleSectionSelector
        onSave={sections => {
          form.setValue('sections', sections);
        }}
      />
      <TagSelector />
      <FileUploadProvider>
        <ArticleAttachmentsEditor />
      </FileUploadProvider>
    </Fragment>
  );
}

function TagSelector() {
  const {data} = useQuery(helpdeskQueries.tags.index());
  const tags = data?.pagination.data || [];
  const {trans} = useTrans();

  if (!tags.length) return null;

  return (
    <FormChipField
      className="mt-24"
      placeholder={trans({message: 'Add tag...'})}
      background="bg"
      label={<Trans message="Tags" />}
      name="tags"
      chipSize="sm"
      suggestions={tags}
      description={
        <Trans message="Add content tags to help users find articles easier" />
      }
    >
      {tag => (
        <Item value={tag.id} key={tag.id} capitalizeFirst>
          <Trans message={tag.name} />
        </Item>
      )}
    </FormChipField>
  );
}
