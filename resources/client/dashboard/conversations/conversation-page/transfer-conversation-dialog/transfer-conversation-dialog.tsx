import {AgentAvatarWithIndicator} from '@app/dashboard/conversations/avatars/agent-avatar';
import {useTransferConversationsToAgent} from '@app/dashboard/conversations/conversation-page/transfer-conversation-dialog/use-transfer-conversations-to-agent';
import {useTransferConversationsToGroup} from '@app/dashboard/conversations/conversation-page/transfer-conversation-dialog/use-transfer-conversations-to-group';
import {NormalizedGroup} from '@app/dashboard/groups/group';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {CompactAgent} from '@app/dashboard/types/agent';
import {useSuspenseQuery} from '@tanstack/react-query';
import {Avatar} from '@ui/avatar/avatar';
import {Button} from '@ui/buttons/button';
import {TextField} from '@ui/forms/input-field/text-field/text-field';
import {Checkbox} from '@ui/forms/toggle/checkbox';
import {Trans} from '@ui/i18n/trans';
import {useFilter} from '@ui/i18n/use-filter';
import {useTrans} from '@ui/i18n/use-trans';
import {AddIcon} from '@ui/icons/material/Add';
import {SearchIcon} from '@ui/icons/material/Search';
import {IllustratedMessage} from '@ui/images/illustrated-message';
import {SvgImage} from '@ui/images/svg-image';
import {List, ListItem} from '@ui/list/list';
import {Dialog} from '@ui/overlays/dialog/dialog';
import {DialogBody} from '@ui/overlays/dialog/dialog-body';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {DialogFooter} from '@ui/overlays/dialog/dialog-footer';
import {DialogHeader} from '@ui/overlays/dialog/dialog-header';
import {FullPageLoader} from '@ui/progress/full-page-loader';
import {toast} from '@ui/toast/toast';
import {useCallbackRef} from '@ui/utils/hooks/use-callback-ref';
import {Fragment, Suspense, useCallback, useState} from 'react';
import transferImage from './transfer.svg';
import {useIsModuleInstalledAndSetup} from '@app/use-is-module-installed';

type TransferType = 'agent' | 'group' | 'all';
type SelectedItem = {id: number; type: 'agent' | 'group'};

interface Conversation {
  id: number;
  assignee_id?: number | null;
  tags?: Array<{name: string}>;
}

interface Props {
  conversationIds: number[];
  conversations?: Conversation[];
  type?: TransferType;
  onTransfer?: () => void;
}
export function TransferConversationDialog({
  conversationIds,
  conversations = [],
  type = 'all',
  onTransfer,
}: Props) {
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const {handleTransfer, isPending} = useTransfer(onTransfer);

  // Check if any conversation is an unassigned "need-human-support" ticket
  const hasUnassignedNeedSupport = conversations.some(
    conv => 
      conv.assignee_id === null && 
      conv.tags?.some(tag => tag.name === 'need-human-support')
  );

  return (
    <Dialog size="lg">
      <DialogHeader>
        <Trans message="Transfer conversation" />
      </DialogHeader>
      <DialogBody>
        {hasUnassignedNeedSupport ? (
          <div className="text-center py-24">
            <IllustratedMessage
              className="mx-auto"
              size="xs"
              image={<SvgImage src={transferImage} />}
              title={
                <Trans message="Auto-assignment required" />
              }
              description={
                <Trans message="Unassigned 'Need Support' tickets must go through automatic assignment. Manual assignment is not allowed for these tickets." />
              }
            />
          </div>
        ) : (
          <div className="h-288 overflow-y-auto">
            <Suspense fallback={<FullPageLoader />}>
              <Content
                type={type}
                selectedItem={selectedItem}
                onItemSelected={setSelectedItem}
              />
            </Suspense>
          </div>
        )}
      </DialogBody>
      {!hasUnassignedNeedSupport && (
        <Footer
          conversationIds={conversationIds}
          isDisabled={isPending || !selectedItem}
          onTransfer={(privateNote, shouldSummarize) => {
            if (selectedItem) {
              handleTransfer(
                selectedItem!,
                conversationIds,
                privateNote,
                shouldSummarize,
              );
            }
          }}
        />
      )}
    </Dialog>
  );
}

interface ContentProps {
  type: TransferType;
  selectedItem: SelectedItem | null;
  onItemSelected: (item: SelectedItem) => void;
}
function Content({type, selectedItem, onItemSelected}: ContentProps) {
  const {trans} = useTrans();
  const agentQuery = useSuspenseQuery(helpdeskQueries.agents.compact);
  const groupQuery = useSuspenseQuery(helpdeskQueries.groups.normalizedList);

  const {filteredAgents, filteredGroups, searchQuery, setSearchQuery} =
    useItems(agentQuery.data.agents, groupQuery.data.groups, type);

  return (
    <Fragment>
      <TextField
        className="mb-12"
        placeholder={trans({message: 'Search...'})}
        startAdornment={<SearchIcon />}
        size="sm"
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
      />

      {!filteredAgents.length && !filteredGroups.length ? (
        <IllustratedMessage
          className="mx-auto mt-44"
          size="xs"
          image={<SvgImage src={transferImage} />}
          title={
            <Trans message="No matching agents or groups found. Try a different search query." />
          }
        />
      ) : null}

      <List>
        {filteredAgents.map(agent => {
          return (
            <ListItem
              key={`agent-${agent.id}`}
              radius="rounded-panel"
              isSelected={
                selectedItem?.id === agent.id && selectedItem?.type === 'agent'
              }
              onSelected={() => onItemSelected({id: agent.id, type: 'agent'})}
              startIcon={<AgentAvatarWithIndicator user={agent} size="md" />}
              description={
                !agent.acceptsConversations ? (
                  <Trans message="Does not accept conversations" />
                ) : agent.activeAssignedConversationsCount ? (
                  <Trans
                    message="[one 1 active conversation|other :count active conversations]"
                    values={{count: agent.activeAssignedConversationsCount}}
                  />
                ) : (
                  <Trans message="No active conversations" />
                )
              }
            >
              <div>{agent.name}</div>
            </ListItem>
          );
        })}
        {filteredGroups.map(group => {
          const availableAgents = agentQuery.data.agents.filter(
            a =>
              a.acceptsConversations && a.groups.some(g => g.id === group.id),
          );
          return (
            <ListItem
              key={`group-${group.id}`}
              radius="rounded-panel"
              isSelected={
                selectedItem?.id === group.id && selectedItem?.type === 'group'
              }
              onSelected={() => onItemSelected({id: group.id, type: 'group'})}
              startIcon={<Avatar label={group.name} />}
              description={
                availableAgents.length ? (
                  <Trans
                    message="[one 1 agent|other :count agents] accepting conversations"
                    values={{count: availableAgents.length}}
                  />
                ) : (
                  <Trans message="No agents accepting conversations" />
                )
              }
            >
              <div>{group.name}</div>
            </ListItem>
          );
        })}
      </List>
    </Fragment>
  );
}

interface FooterProps {
  onTransfer: (privateNote: string, shouldSummarize: boolean) => void;
  conversationIds: number[];
  isDisabled: boolean;
}
function Footer({onTransfer, conversationIds, isDisabled}: FooterProps) {
  const isAiSetup = useIsModuleInstalledAndSetup('ai');

  const [notePanelVisible, setNotePanelVisible] = useState(false);
  const [privateNote, setPrivateNote] = useState('');

  const [shouldSummarize, setShouldSummarize] = useState(false);

  const noteButtons = (
    <Fragment>
      <Button
        variant="outline"
        className="ml-10"
        onClick={() => {
          setNotePanelVisible(false);
          setPrivateNote('');
        }}
      >
        <Trans message="Remove note" />
      </Button>
      <Button
        variant="flat"
        color="primary"
        type="submit"
        form="private-note-form"
      >
        <Trans message="Save note" />
      </Button>
    </Fragment>
  );

  return (
    <Fragment>
      {notePanelVisible ? (
        <NoteForm
          defaultValue={privateNote}
          onSubmit={value => {
            setPrivateNote(value);
            setNotePanelVisible(false);
          }}
        />
      ) : null}
      <DialogFooter
        startAction={
          isAiSetup && conversationIds.length === 1 ? (
            <Checkbox
              size="sm"
              checked={shouldSummarize}
              onChange={e => setShouldSummarize(e.target.checked)}
            >
              <Trans message="Summarize conversation" />
            </Checkbox>
          ) : null
        }
      >
        {notePanelVisible ? (
          noteButtons
        ) : (
          <Fragment>
            <Button
              color="primary"
              startIcon={!privateNote && <AddIcon />}
              onClick={() => setNotePanelVisible(true)}
            >
              {privateNote ? (
                <Trans message="Edit private note" />
              ) : (
                <Trans message="Add private note" />
              )}
            </Button>
            <Button
              variant="flat"
              color="primary"
              disabled={isDisabled}
              onClick={() => onTransfer(privateNote, shouldSummarize)}
            >
              <Trans message="Transfer" />
            </Button>
          </Fragment>
        )}
      </DialogFooter>
    </Fragment>
  );
}

interface NoteFormProps {
  onSubmit: (value: string) => void;
  defaultValue?: string;
}
function NoteForm({onSubmit, defaultValue}: NoteFormProps) {
  return (
    <form
      id="private-note-form"
      className="mb-12 px-24"
      onSubmit={e => {
        e.preventDefault();
        const data = new FormData(e.target as HTMLFormElement);
        onSubmit(data.get('note-text') as string);
      }}
    >
      <TextField
        defaultValue={defaultValue}
        label={<Trans message="Private note" />}
        name="note-text"
        autoFocus
        inputElementType="textarea"
        rows={2}
      />
    </form>
  );
}

function useItems(
  agents: CompactAgent[],
  groups: NormalizedGroup[],
  type: TransferType,
) {
  const [searchQuery, setSearchQuery] = useState('');
  const {contains} = useFilter({
    sensitivity: 'base',
  });

  const initialAgents = type === 'group' ? [] : agents;
  const initialGroups = type === 'agent' ? [] : groups;

  const filteredAgents = initialAgents.filter(agent =>
    contains(agent.name, searchQuery),
  );
  const filteredGroups = initialGroups.filter(group =>
    contains(group.name, searchQuery),
  );

  return {filteredAgents, filteredGroups, searchQuery, setSearchQuery};
}

function useTransfer(onTransfer?: () => void) {
  const transferCallback = useCallbackRef(onTransfer);
  const assignToAgent = useTransferConversationsToAgent();
  const assignToGroup = useTransferConversationsToGroup();
  const {close} = useDialogContext();

  const handleTransfer = useCallback(
    (
      item: SelectedItem,
      conversationIds: number[],
      privateNote: string,
      shouldSummarize: boolean,
    ) => {
      if (item.type === 'agent') {
        assignToAgent.mutate(
          {
            conversationIds,
            userId: item.id,
            privateNote,
            shouldSummarize,
          },
          {
            onSuccess: () => {
              close();
              toast({message: 'Conversation transferred'});
              transferCallback();
            },
          },
        );
      } else if (item.type === 'group') {
        assignToGroup.mutate(
          {
            conversationIds,
            groupId: item.id,
            privateNote,
            shouldSummarize,
          },
          {
            onSuccess: () => {
              close();
              toast({message: 'Conversation transferred'});
              transferCallback();
            },
          },
        );
      }
    },
    [assignToAgent, assignToGroup, close, transferCallback],
  );

  const isPending = assignToAgent.isPending || assignToGroup.isPending;

  return {handleTransfer, isPending};
}
