import {getArticleLink} from '@app/help-center/articles/article-link';
import {ArticlePath} from '@app/help-center/articles/article-path';
import {helpCenterQueries} from '@app/help-center/help-center-queries';
import {
  SearchTriggerButton,
  SearchTriggerButtonProps,
} from '@app/help-center/search/search-trigger-button';
import {useSearchTermLogger} from '@app/help-center/search/use-search-term-logger';
import {useNavigate} from '@common/ui/navigation/use-navigate';
import {useQuery} from '@tanstack/react-query';
import {ComboBox} from '@ui/forms/combobox/combobox';
import {Item} from '@ui/forms/listbox/item';
import {message} from '@ui/i18n/message';
import {MessageDescriptor} from '@ui/i18n/message-descriptor';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {CloseIcon} from '@ui/icons/material/Close';
import {SearchIcon} from '@ui/icons/material/Search';
import {Dialog} from '@ui/overlays/dialog/dialog';
import {DialogBody} from '@ui/overlays/dialog/dialog-body';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {useCallback, useState} from 'react';
import {useParams} from 'react-router';

interface Props
  extends Omit<SearchTriggerButtonProps, 'children' | 'onTrigger'> {
  placeholder?: MessageDescriptor;
  categoryId?: number;
}
export function HcSearchBar({
  placeholder = message('Search documentation'),
  size = 'sm',
  width = 'w-320',
  categoryId,
  ...buttonProps
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
  }, []);

  return (
    <DialogTrigger
      type="modal"
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      placement="top"
    >
      <SearchTriggerButton
        {...buttonProps}
        onTrigger={handleOpen}
        size={size}
        width={width}
      >
        <Trans {...placeholder} />
      </SearchTriggerButton>
      <Dialog size="lg">
        <DialogBody padding="p-0">
          <DialogContent placeholder={placeholder} categoryId={categoryId} />
        </DialogBody>
      </Dialog>
    </DialogTrigger>
  );
}

interface SearchFieldProps {
  placeholder: MessageDescriptor;
  categoryId?: number | string;
}
function DialogContent({placeholder, categoryId}: SearchFieldProps) {
  const params = useParams();
  categoryId = categoryId || params.categoryId;
  const {close} = useDialogContext();
  const {trans} = useTrans();
  const [query, setQuery] = useState('');
  const searchLogger = useSearchTermLogger();
  const {data, isFetching, isPending} = useQuery(
    helpCenterQueries.articles.search(
      {query, categoryIds: categoryId ? [categoryId] : undefined},
      r => {
        searchLogger.log({
          term: r.query,
          results: r.pagination.data,
          categoryId: r.categoryIds?.[0],
        });
      },
    ),
  );
  const navigate = useNavigate();

  return (
    <ComboBox
      inputValue={query}
      onInputValueChange={setQuery}
      isAsync
      isLoading={isFetching}
      isPending={isPending}
      items={data?.pagination.data}
      clearInputOnItemSelection
      endAdornmentIcon={<CloseIcon />}
      placeholder={trans(placeholder)}
      startAdornment={<SearchIcon />}
      prependListbox
      listboxClassName="py-12 px-8"
      inputRadius="rounded-none"
      inputBorder="border-b"
      inputRing="ring-0"
      size="lg"
      inputFontSize="text-md"
      inputShadow="shadow-none"
      onEndAdornmentClick={close}
      selectionMode="none"
      showEmptyMessage
    >
      {result => (
        <Item
          padding="py-8 px-12"
          radius="rounded"
          key={result.id}
          value={result.id}
          onSelected={() => {
            close();
            searchLogger.updateLastSearch({clickedArticle: true});
            navigate(getArticleLink(result));
          }}
          description={<ArticlePath path={result.path} />}
          textLabel={result.title}
        >
          {result.title}
        </Item>
      )}
    </ComboBox>
  );
}
