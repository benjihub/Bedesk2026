import {useAttachTagToTaggables} from '@common/tags/use-attach-tag-to-taggables';
import {useDetachTagFromTaggables} from '@common/tags/use-detach-tag-from-taggables';
import {useTags} from '@common/tags/use-tags';
import {TextField} from '@ui/forms/input-field/text-field/text-field';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {CheckIcon} from '@ui/icons/material/Check';
import {PushPinIcon} from '@ui/icons/material/PushPin';
import {SearchIcon} from '@ui/icons/material/Search';
import {List, ListItem} from '@ui/list/list';
import {Dialog} from '@ui/overlays/dialog/dialog';
import {DialogBody} from '@ui/overlays/dialog/dialog-body';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {ProgressCircle} from '@ui/progress/progress-circle';
import clsx from 'clsx';
import {useMemo, useState} from 'react';

interface Props {
  attachedTags?: {id: number; name: string}[];
  tagType?: string;
  notTagType?: string;
  taggableType?: string;
  taggableIds?: number[];
  userId?: number;
  isLoading?: boolean;
  onChange?: (tagId: number) => void;
  onSelected?: (tagName: string) => void;
}
export function ManageTagsDialog({
  attachedTags: propsAttachedTags,
  tagType,
  notTagType,
  taggableType,
  taggableIds,
  userId,
  isLoading,
  onChange,
  onSelected,
}: Props) {
  const {trans} = useTrans();
  const [query, setQuery] = useState('');
  const {close} = useDialogContext();
  const {
    data,
    isPlaceholderData,
    isLoading: queryIsLoading,
  } = useTags({
    type: tagType,
    notType: notTagType,
    query,
    userId,
  });
  const detachTag = useDetachTagFromTaggables();
  const attachTag = useAttachTagToTaggables();

  // if all tags does not include tag in attached tags, add it to the top
  const {tags, attachedTagIds} = useMemo(() => {
    const allTags = data?.pagination.data || [];
    const attachedTags = propsAttachedTags || [];
    const attachedTagIds = attachedTags.map(tag => tag.id);

    const tags = allTags.filter(tag => !attachedTagIds.includes(tag.id));
    tags.unshift(...attachedTags);
    return {tags, attachedTagIds};
  }, [propsAttachedTags, data]);

  return (
    <Dialog>
      <DialogBody padding="p-8">
        <form>
          <TextField
            placeholder={trans({message: 'Type tag name...'})}
            inputBorder="border-b"
            inputRadius="rounded-none"
            inputRing="ring-0"
            inputShadow="shadow-none"
            startAdornment={<SearchIcon />}
            value={query}
            onChange={e => setQuery(e.target.value)}
            endAdornment={
              isPlaceholderData && (
                <ProgressCircle isIndeterminate size="w-24 h-24" />
              )
            }
          />
        </form>
        <List className="compact-scrollbar h-320 overflow-y-auto stable-scrollbar">
          {tags.map(tag => {
            const isAttached = attachedTagIds.includes(tag.id);
            const isDisabled =
              attachTag.isPending || detachTag.isPending || isLoading;
            return (
              <ListItem
                isDisabled={isDisabled}
                onSelected={() => {
                  if (onSelected) {
                    onSelected(tag.name);
                    close();
                    return;
                  }

                  if (!taggableIds || !taggableType) {
                    return;
                  }

                  if (isAttached) {
                    detachTag.mutate(
                      {
                        tagId: tag.id,
                        taggableIds,
                        taggableType,
                      },
                      {
                        onSuccess: () => onChange?.(tag.id),
                      },
                    );
                  } else {
                    attachTag.mutate(
                      {
                        taggableType,
                        taggableIds,
                        tagName: tag.name,
                        userId,
                        tagType,
                      },
                      {
                        onSuccess: () => onChange?.(tag.id),
                      },
                    );
                  }
                }}
                className={clsx(
                  isAttached &&
                    (isDisabled ? 'text-primary-light' : 'text-primary'),
                )}
                startIcon={<PushPinIcon size="xs" />}
                key={tag.id}
                endSection={
                  isAttached ? (
                    <CheckIcon size="sm" className="block text-primary" />
                  ) : (
                    <div className="h-20 w-20" />
                  )
                }
              >
                {tag.name}
              </ListItem>
            );
          })}
          {!isPlaceholderData && !data?.pagination.data.length && query && (
            <ListItem
              startIcon={<PushPinIcon size="xs" />}
              onSelected={() => {
                if (onSelected) {
                  onSelected(query);
                  close();
                  return;
                }

                if (!taggableIds || !taggableType) {
                  return;
                }

                attachTag.mutate(
                  {
                    taggableType,
                    taggableIds,
                    tagName: query,
                    userId,
                    tagType,
                  },
                  {
                    onSuccess: r => {
                      setQuery('');
                      onChange?.(r.tag.id);
                    },
                  },
                );
              }}
            >
              <Trans message={`Create tag ":name"`} values={{name: query}} />
            </ListItem>
          )}
          {data && !tags.length && !query && (
            <li className="text-center text-muted">
              <Trans message="No tags found" />
            </li>
          )}
          {queryIsLoading && (
            <li className="flex justify-center">
              <ProgressCircle isIndeterminate size="w-24 h24" />
            </li>
          )}
        </List>
      </DialogBody>
    </Dialog>
  );
}
