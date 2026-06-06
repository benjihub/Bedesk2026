import {CreateCustomPagePayload} from '@common/admin/custom-pages/requests/use-create-custom-page';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {useTrans} from '@ui/i18n/use-trans';
import {EditIcon} from '@ui/icons/material/Edit';
import clsx from 'clsx';
import {useState} from 'react';
import {useFormContext} from 'react-hook-form';

export function ArticleEditorTitle() {
  const [editingTitle, setEditingTitle] = useState(false);
  const {trans} = useTrans();
  const form = useFormContext<CreateCustomPagePayload>();
  const watchedTitle = form.watch('title');

  const titlePlaceholder = trans({message: 'Title'});

  const title = editingTitle ? (
    <FormTextField
      placeholder={titlePlaceholder}
      autoFocus
      className="mb-30"
      onBlur={() => {
        setEditingTitle(false);
      }}
      name="title"
      required
    />
  ) : (
    <h1
      tabIndex={0}
      onClick={() => {
        setEditingTitle(true);
      }}
      onFocus={() => {
        setEditingTitle(true);
      }}
      className={clsx(
        'cursor-pointer rounded hover:bg-primary/focus',
        !watchedTitle && 'text-muted',
      )}
    >
      {watchedTitle || titlePlaceholder}
      <EditIcon className="mx-8 mt-8 align-top text-muted icon-sm" />
    </h1>
  );

  return (
    <div className="prose mx-auto my-48 w-full flex-shrink-0 px-24 dark:prose-invert">
      {title}
    </div>
  );
}
