import {AiAgentMessageField} from '@ai/ai-agent/flows/flow-editor/node-editor/fields/ai-agent-message-field';
import {NodeNameField} from '@ai/ai-agent/flows/flow-editor/node-editor/fields/node-name-field';
import {NodeSectionHeader} from '@ai/ai-agent/flows/flow-editor/node-editor/fields/node-section-header';
import {NodeEditorForm} from '@ai/ai-agent/flows/flow-editor/node-editor/node-editor-form';
import {NodeEditorPanel} from '@ai/ai-agent/flows/flow-editor/node-editor/selected-node-editor';
import {ArticlesNodeData} from '@ai/ai-agent/flows/flow-editor/nodes/articles-node/articles-node-data';
import {FlowArticlesNode} from '@ai/ai-agent/flows/flow-editor/nodes/flow-node';
import {helpCenterQueries} from '@app/help-center/help-center-queries';
import {useNormalizedModels} from '@common/ui/normalized-model/use-normalized-models';
import {useQuery} from '@tanstack/react-query';
import {IconButton} from '@ui/buttons/icon-button';
import {ComboBox} from '@ui/forms/combobox/combobox';
import {Item} from '@ui/forms/listbox/item';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {CloseIcon} from '@ui/icons/material/Close';
import {DragHandleIcon} from '@ui/icons/material/DragHandle';
import {useSortable} from '@ui/interactions/dnd/sortable/use-sortable';
import {moveItemInArray} from '@ui/utils/array/move-item-in-array';
import {useRef, useState} from 'react';
import {useForm, useFormContext, useWatch} from 'react-hook-form';

interface Props {
  node: FlowArticlesNode;
}
export function ArticlesNodeEditor({node}: Props) {
  const {trans} = useTrans();
  const form = useForm<ArticlesNodeData>({
    defaultValues: {
      ...node.data,
      attachmentIds: node.data.attachmentIds ?? [],
    },
  });

  const handleAddArticle = (articleId: number) => {
    const current = form.getValues('articleIds') ?? [];
    if (!current.includes(articleId)) {
      form.setValue('articleIds', [...current, articleId]);
    }
  };

  return (
    <NodeEditorForm node={node} form={form}>
      <NodeEditorPanel node={node}>
        <NodeNameField className="mb-24" />
        <AiAgentMessageField
          className="mb-24"
          placeholder={trans(message('Optional'))}
          required={false}
        />
        <NodeSectionHeader>
          <Trans message="Articles" />
          <Trans message="Show up to 6 articles to customers" />
        </NodeSectionHeader>
        <ArticleSelector
          onSelected={articleId => handleAddArticle(articleId)}
        />
        <ArticleList />
      </NodeEditorPanel>
    </NodeEditorForm>
  );
}

interface ArticleSelectorProps {
  onSelected: (articleId: number) => void;
}
function ArticleSelector({onSelected}: ArticleSelectorProps) {
  const {trans} = useTrans();
  const [query, setQuery] = useState('');
  const {data, isFetching} = useQuery(helpCenterQueries.articles.index({}));
  const items = data?.pagination.data ?? [];

  return (
    <ComboBox
      isAsync
      isLoading={isFetching}
      inputValue={query}
      onInputValueChange={setQuery}
      placeholder={trans(message('Search by title...'))}
      allowCustomValue={false}
      items={items}
      onSelectionChange={item => onSelected(item as number)}
      selectionMode="single"
      clearInputOnItemSelection
      clearSelectionOnInputClear
      blurReferenceOnItemSelection
    >
      {items.map(item => (
        <Item key={item.id} value={item.id} textLabel={item.title}>
          {item.title}
        </Item>
      ))}
    </ComboBox>
  );
}

function ArticleList() {
  const articleIds =
    useWatch<ArticlesNodeData, 'articleIds'>({
      name: 'articleIds',
    }) ?? [];

  const query = useNormalizedModels(
    'normalized-models/article',
    {
      modelIds: articleIds.join(','),
    },
    {enabled: !!articleIds.length},
  );
  const items = query.data?.results ?? [];

  return (
    <div className="mt-12 space-y-10">
      {articleIds.map(articleId => {
        const article = items.find(item => item.id === articleId);
        if (!article) {
          return null;
        }
        return (
          <ArticleListItem
            key={articleId}
            articleId={articleId}
            articleIds={articleIds}
            name={article.name}
          />
        );
      })}
    </div>
  );
}

interface ArticleListItemProps {
  articleId: number;
  articleIds: number[];
  name: string;
}
function ArticleListItem({articleId, articleIds, name}: ArticleListItemProps) {
  const {setValue} = useFormContext<ArticlesNodeData>();
  const ref = useRef<HTMLDivElement>(null);
  const {sortableProps, dragHandleRef} = useSortable({
    item: articleId,
    items: articleIds,
    type: 'articlesFlowSortable',
    ref,
    onSortEnd: (prevIndex, targetIndex) => {
      setValue(
        'articleIds',
        moveItemInArray(articleIds, prevIndex, targetIndex),
      );
    },
    strategy: 'liveSort',
  });

  return (
    <div
      {...sortableProps}
      ref={ref}
      className="flex items-center gap-8 rounded-panel border px-12 py-8 text-sm"
    >
      <IconButton ref={dragHandleRef} size="xs" iconSize="sm">
        <DragHandleIcon />
      </IconButton>
      {name}
      <IconButton size="xs" iconSize="sm" className="ml-auto">
        <CloseIcon
          onClick={() =>
            setValue(
              'articleIds',
              articleIds.filter(id => id !== articleId),
            )
          }
        />
      </IconButton>
    </div>
  );
}
