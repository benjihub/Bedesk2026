import {ActionMenuDialog} from '@app/dashboard/conversations/agent-reply-composer/action-menu-dialog';
import {getArticleLink} from '@app/help-center/articles/article-link';
import {ArticlePath} from '@app/help-center/articles/article-path';
import {helpCenterQueries} from '@app/help-center/help-center-queries';
import {insertLinkIntoTextEditor} from '@common/text-editor/insert-link-into-text-editor';
import {useCurrentTextEditor} from '@common/text-editor/tiptap-editor-context';
import {useQuery} from '@tanstack/react-query';
import {IconButton} from '@ui/buttons/icon-button';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {LibraryIcon} from '@ui/icons/lucide/library-icon';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {Tooltip} from '@ui/tooltip/tooltip';
import {useKeybind} from '@ui/utils/keybinds/use-keybind';
import {useState} from 'react';

interface Props {
  categoryIds?: number[];
}
export function ArticleSearchButton({categoryIds}: Props) {
  const editor = useCurrentTextEditor();
  const [isOpen, setIsOpen] = useState(false);

  useKeybind(
    'window',
    'ctrl+/',
    () => {
      setIsOpen(true);
    },
    {allowedInputSelector: '.ProseMirror'},
  );

  return (
    <DialogTrigger
      type="modal"
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      underlayTransparent={true}
      underlayBlurred={false}
      returnFocusToTrigger={false}
      onClose={item => {
        if (item && editor) {
          insertLinkIntoTextEditor(editor, {
            href: getArticleLink(item),
            target: '_blank',
            text: item.title,
          });
        }
      }}
    >
      <Tooltip label={<Trans message="Insert article (ctrl + /)" />}>
        <IconButton size="xs" iconSize="sm">
          <LibraryIcon />
        </IconButton>
      </Tooltip>
      <ArticleSearchDialog categoryIds={categoryIds} />
    </DialogTrigger>
  );
}

export function ArticleSearchDialog({categoryIds}: Props) {
  const [searchTerm, setSearchTerm] = useState('');

  const query = useQuery({
    ...helpCenterQueries.articles.search({
      query: searchTerm,
      categoryIds,
    }),
    enabled: true,
  });

  return (
    <ActionMenuDialog
      placeholder={message('Search help center...')}
      query={searchTerm}
      onQueryChange={setSearchTerm}
      isLoading={query.isLoading}
      isFetching={query.isFetching}
      data={query.data?.pagination.data || []}
      itemData={item => ({
        title: item.title,
        description: 'path' in item && item.path && (
          <ArticlePath path={item.path} noLinks />
        ),
      })}
    />
  );
}
