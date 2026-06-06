import {AiAgentMessageField} from '@ai/ai-agent/flows/flow-editor/node-editor/fields/ai-agent-message-field';
import {NodeNameField} from '@ai/ai-agent/flows/flow-editor/node-editor/fields/node-name-field';
import {NodeEditorForm} from '@ai/ai-agent/flows/flow-editor/node-editor/node-editor-form';
import {NodeEditorPanel} from '@ai/ai-agent/flows/flow-editor/node-editor/selected-node-editor';
import {CardsNodeData} from '@ai/ai-agent/flows/flow-editor/nodes/cards-node/card-node-data';
import {EditCardDialog} from '@ai/ai-agent/flows/flow-editor/nodes/cards-node/edit-card-dialog';
import {FlowCardsNode} from '@ai/ai-agent/flows/flow-editor/nodes/flow-node';
import {nodeConfig} from '@ai/ai-agent/flows/flow-editor/nodes/flow-node-config';
import {Button} from '@ui/buttons/button';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {AddIcon} from '@ui/icons/material/Add';
import {DeleteIcon} from '@ui/icons/material/Delete';
import {DragHandleIcon} from '@ui/icons/material/DragHandle';
import {EditIcon} from '@ui/icons/material/Edit';
import {KeyboardArrowLeftIcon} from '@ui/icons/material/KeyboardArrowLeft';
import {KeyboardArrowRightIcon} from '@ui/icons/material/KeyboardArrowRight';
import {useSortable} from '@ui/interactions/dnd/sortable/use-sortable';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import clsx from 'clsx';
import {
  ComponentPropsWithRef,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  useFieldArray,
  useForm,
  useFormContext,
  useWatch,
} from 'react-hook-form';

interface Props {
  node: FlowCardsNode;
}
export function CardsNodeEditor({node}: Props) {
  const {trans} = useTrans();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const form = useForm<CardsNodeData>({
    defaultValues: {
      ...node.data,
      attachmentIds: node.data.attachmentIds ?? [],
    },
  });

  const {fields, append, remove, move} = useFieldArray<CardsNodeData, 'cards'>({
    control: form.control,
    name: 'cards',
  });

  const fieldIds = fields.map(field => field.id);

  return (
    <NodeEditorForm node={node} form={form}>
      <NodeEditorPanel node={node}>
        <NodeNameField className="mb-24" />
        <AiAgentMessageField
          className="mb-24"
          placeholder={trans(message('Optional'))}
          required={false}
        />
        <div className="relative">
          <div
            ref={scrollContainerRef}
            className="compact-scrollbar mb-12 flex snap-x snap-mandatory items-start gap-24 overflow-x-auto"
          >
            {fields.map((field, index) => (
              <CardItem
                key={field.id}
                node={node}
                index={index}
                id={field.id}
                ids={fieldIds}
                onRemove={() => remove(index)}
                onSortEnd={move}
              />
            ))}
          </div>
          {fields.length ? (
            <NavigationButtons scrollRef={scrollContainerRef} />
          ) : null}
        </div>
        <Button
          className="-ml-14"
          size="sm"
          color="primary"
          startIcon={<AddIcon />}
          disabled={fields.length >= 6}
          onClick={() => {
            const [newNode] = nodeConfig.cards.createNewStoredNode(node.id);
            append(newNode.data.cards[0]);
            const scrollEl = scrollContainerRef.current;
            if (scrollEl) {
              setTimeout(() => {
                scrollEl.scrollTo({
                  left: scrollEl.scrollWidth,
                  behavior: 'smooth',
                });
              });
            }
          }}
        >
          <Trans message="Add card" />
        </Button>
      </NodeEditorPanel>
    </NodeEditorForm>
  );
}

interface CardItemProps {
  node: FlowCardsNode;
  index: number;
  id: string;
  ids: string[];
  onRemove: () => void;
  onSortEnd: (oldIndex: number, newIndex: number) => void;
}
function CardItem({node, index, id, ids, onRemove, onSortEnd}: CardItemProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const {sortableProps, dragHandleRef} = useSortable({
    ref: cardRef,
    item: id,
    items: ids,
    type: 'channelContentItem',
    strategy: 'liveSort',
    onSortEnd,
  });

  const form = useFormContext<CardsNodeData>();
  const path = `cards.${index}` as const;
  const data = useWatch<CardsNodeData, typeof path>({
    name: path,
  });

  return (
    <div
      ref={cardRef}
      {...sortableProps}
      className="group relative w-240 flex-shrink-0 snap-center pt-16"
    >
      <div className="rounded-panel border shadow-sm">
        {data.image && (
          <img
            src={data.image}
            alt=""
            className="h-172 w-full rounded-t-panel"
          />
        )}
        <div className="px-20 pb-20 pt-16 text-sm">
          <div className="line-clamp-2 whitespace-pre-wrap break-words font-semibold">
            {data.title}
          </div>
          <div className="mt-8 line-clamp-4 whitespace-pre-wrap break-words">
            {data.description}
          </div>
        </div>
        {data.buttons.map((button, index) => (
          <div key={index}>
            <div className="flex h-44 w-full items-center justify-center overflow-hidden overflow-ellipsis whitespace-nowrap border-t px-20 text-sm font-semibold text-primary">
              <Trans message={button.name} />
            </div>
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute left-0 right-0 top-0 mx-auto flex w-max items-center gap-6 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
        <FloatingButton ref={dragHandleRef}>
          <DragHandleIcon size="sm" />
        </FloatingButton>
        <DialogTrigger
          type="popover"
          triggerRef={cardRef}
          placement="left"
          offset={10}
          onClose={value => {
            if (value) {
              form.setValue(`cards.${index}`, value);
            }
          }}
        >
          <FloatingButton>
            <EditIcon size="sm" />
          </FloatingButton>
          <EditCardDialog card={data} />
        </DialogTrigger>
        {ids.length > 1 && (
          <FloatingButton onClick={() => onRemove()}>
            <DeleteIcon size="sm" />
          </FloatingButton>
        )}
      </div>
    </div>
  );
}

interface NavigationButtonsProps {
  scrollRef: React.RefObject<HTMLDivElement | null>;
}
function NavigationButtons({scrollRef}: NavigationButtonsProps) {
  const [isScrolledToStart, setIsScrolledToStart] = useState(true);
  const [isScrolledToEnd, setIsScrolledToEnd] = useState(false);

  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (scrollEl) {
      const scrollHandler = () => {
        setIsScrolledToStart(scrollEl.scrollLeft === 0);
        setIsScrolledToEnd(
          scrollEl.scrollLeft + scrollEl.clientWidth === scrollEl.scrollWidth,
        );
      };

      scrollEl.addEventListener('scroll', scrollHandler);

      return () => {
        scrollEl.removeEventListener('scroll', scrollHandler);
      };
    }
  }, []);

  return (
    <div className="pointer-events-none absolute top-0 flex h-full w-full items-center">
      <FloatingButton
        hidden={isScrolledToStart}
        className="mr-auto"
        shadow="shadow-[0_0_15px_0_rgba(0,0,0,.34)]"
        onClick={() => {
          if (scrollRef.current) {
            scrollRef.current.scrollBy({
              left: -240,
              behavior: 'smooth',
            });
          }
        }}
      >
        <KeyboardArrowLeftIcon />
      </FloatingButton>
      <FloatingButton
        hidden={isScrolledToEnd}
        className="ml-auto"
        shadow="shadow-[0_0_15px_0_rgba(0,0,0,.34)]"
        onClick={() => {
          if (scrollRef.current) {
            scrollRef.current.scrollBy({
              left: 240,
              behavior: 'smooth',
            });
          }
        }}
      >
        <KeyboardArrowRightIcon />
      </FloatingButton>
    </div>
  );
}

interface FloatingButtonProps extends ComponentPropsWithRef<'button'> {
  children: ReactNode;
  hidden?: boolean;
  className?: string;
  shadow?: string;
}
function FloatingButton({
  children,
  hidden,
  className,
  shadow,
  ...other
}: FloatingButtonProps) {
  return (
    <button
      {...other}
      type="button"
      className={clsx(
        'flex size-34 items-center justify-center rounded-full border bg outline-none transition-[opacity,color,background-color] hover:bg-primary hover:text-on-primary focus-visible:ring',
        hidden ? 'pointer-events-none opacity-0' : 'pointer-events-auto',
        className,
        shadow ? shadow : 'shadow-md',
      )}
    >
      {children}
    </button>
  );
}
