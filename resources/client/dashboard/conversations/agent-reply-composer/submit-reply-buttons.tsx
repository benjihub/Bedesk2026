import {FullConversationResponse} from '@app/dashboard/conversation';
import {AfterReplyActionSelector} from '@app/dashboard/conversations/agent-reply-composer/after-reply-action';
import {useAgentReplyComposerStore} from '@app/dashboard/conversations/agent-reply-composer/agent-reply-composer-store';
import {submitAgentReplyMutationKey} from '@app/dashboard/conversations/agent-reply-composer/use-submit-agent-reply';
import {StatusColorDot} from '@app/dashboard/conversations/utils/get-status-color';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {useIsMutating, useQuery} from '@tanstack/react-query';
import {Button} from '@ui/buttons/button';
import {IconButton} from '@ui/buttons/icon-button';
import {Item} from '@ui/forms/listbox/item';
import {Trans} from '@ui/i18n/trans';
import {FlagIcon} from '@ui/icons/material/Flag';
import {KeyboardArrowDownIcon} from '@ui/icons/material/KeyboardArrowDown';
import {Menu, MenuTrigger} from '@ui/menu/menu-trigger';
import {useIsMobileMediaQuery} from '@ui/utils/hooks/is-mobile-media-query';
import clsx from 'clsx';
import {Fragment} from 'react';

interface Props {
  conversation: FullConversationResponse['conversation'];
  disabled?: boolean;
}
export function SubmitReplyButtons({conversation, disabled}: Props) {
  const isMobile = useIsMobileMediaQuery();
  const selectedStatus = useAgentReplyComposerStore(s => s.selectedStatus);
  const messageType = useAgentReplyComposerStore(s => s.messageType);
  const updateSelectedStatus = useAgentReplyComposerStore(
    s => s.updateSelectedStatus,
  );

  const body = useAgentReplyComposerStore(s => s.draft.body);
  const isMutating =
    useIsMutating({mutationKey: submitAgentReplyMutationKey}) > 0;
  const isDisabled = !!disabled || isMutating || !body.trim();

  if (messageType === 'note') {
    return (
      <Button
        type="submit"
        variant="flat"
        color="primary"
        size="xs"
        disabled={isDisabled}
        className="mr-4"
      >
        <Trans message="Add note" />
      </Button>
    );
  }

  return (
    <Fragment>
      {conversation.type === 'ticket' && (
        <StatusDropdown
          selectedStatus={selectedStatus}
          onStatusChange={updateSelectedStatus}
        />
      )}
      <div className="mr-4 flex">
        <Button
          type="submit"
          variant="flat"
          color="primary"
          size="xs"
          disabled={isDisabled}
          radius="rounded-l-button"
        >
          {isMobile ? <Trans message="Send" /> : <Trans message="Send reply" />}
        </Button>
        <div
          className={clsx(
            'w-1',
            isDisabled ? 'bg-disabled/20' : 'bg-primary/70',
          )}
        />
        <AfterReplyActionSelector
          disabled={isDisabled}
          conversation={conversation}
        />
      </div>
    </Fragment>
  );
}

interface StatusDropdownProps {
  selectedStatus: number | null;
  onStatusChange: (status: number) => void;
}
function StatusDropdown({selectedStatus, onStatusChange}: StatusDropdownProps) {
  const isMobile = useIsMobileMediaQuery();
  const query = useQuery(helpdeskQueries.statuses.dropdownList('agent'));
  if (!query.data) return null;
  const status = query.data.statuses.find(s => s.id === selectedStatus);

  return (
    <MenuTrigger selectionMode="single" selectedValue={selectedStatus}>
      {isMobile ? (
        <IconButton variant="outline" size="xs" className="mr-4">
          <FlagIcon />
        </IconButton>
      ) : (
        <Button
          variant="outline"
          size="xs"
          className="mr-4"
          endIcon={<KeyboardArrowDownIcon />}
        >
          {status?.label}
        </Button>
      )}
      <Menu>
        {query.data.statuses.map(status => (
          <Item
            key={status.id}
            value={status.id}
            onSelected={() => onStatusChange(status.id)}
            startIcon={<StatusColorDot category={status.category} />}
          >
            <Trans message={status.label} />
          </Item>
        ))}
      </Menu>
    </MenuTrigger>
  );
}
