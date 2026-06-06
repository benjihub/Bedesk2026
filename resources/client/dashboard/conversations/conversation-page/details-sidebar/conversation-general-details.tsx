import {FullConversationResponse} from '@app/dashboard/conversation';
import {AgentAvatar} from '@app/dashboard/conversations/avatars/agent-avatar';
import {CustomerAvatar} from '@app/dashboard/conversations/avatars/customer-avatar';
import {ConversationTagList} from '@app/dashboard/conversations/conversation-page/details-sidebar/conversation-tag-list';
import {TransferConversationDialog} from '@app/dashboard/conversations/conversation-page/transfer-conversation-dialog/transfer-conversation-dialog';
import {CustomerName} from '@app/dashboard/conversations/customer-name';
import {getLocalTimeZone, now} from '@internationalized/date';
import {Avatar} from '@ui/avatar/avatar';
import {Chip} from '@ui/forms/input-field/chip-field/chip';
import {ChipList} from '@ui/forms/input-field/chip-field/chip-list';
import {FormattedDate} from '@ui/i18n/formatted-date';
import {FormattedDuration} from '@ui/i18n/formatted-duration';
import {Trans} from '@ui/i18n/trans';
import {BlockIcon} from '@ui/icons/material/Block';
import {GroupIcon} from '@ui/icons/material/Group';
import {SupervisorAccountIcon} from '@ui/icons/material/SupervisorAccount';
import {ThumbDownIcon} from '@ui/icons/material/ThumbDown';
import {ThumbUpIcon} from '@ui/icons/material/ThumbUp';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import clsx from 'clsx';
import {Fragment, ReactNode} from 'react';
import {Link} from 'react-router';

interface Props {
  data: FullConversationResponse;
}
export function ConversationGeneralDetails({data}: Props) {
  const user = data.user;
  const agent = data.conversation.assignee;
  const group = data.conversation.group;

  return (
    <div className="m-20">
      <Header user={user} />
      <DetailLayout
        label={<Trans message="Assignee" />}
        className="mb-4"
        value={
          <DialogTrigger type="modal">
            <button className="contents">
              {agent ? (
                <DetailValue image={<AgentAvatar user={agent} size="xs" />}>
                  {agent.name}
                </DetailValue>
              ) : (
                <DetailValue image={<SupervisorAccountIcon size="sm" />}>
                  <Trans message="Unassigned" />
                </DetailValue>
              )}
            </button>
            <TransferConversationDialog
              type="agent"
              conversationIds={[data.conversation.id]}
              conversations={[data.conversation]}
            />
          </DialogTrigger>
        }
      />
      <DetailLayout
        label={<Trans message="Group" />}
        value={
          <DialogTrigger type="modal">
            <button className="contents">
              {group ? (
                <DetailValue image={<Avatar label={group.name} size="xs" />}>
                  {group.name}
                </DetailValue>
              ) : (
                <DetailValue image={<GroupIcon size="sm" />}>
                  <Trans message="Unassigned" />
                </DetailValue>
              )}
            </button>
            <TransferConversationDialog
              type="group"
              conversationIds={[data.conversation.id]}
              conversations={[data.conversation]}
            />
          </DialogTrigger>
        }
      />
      <ConversationTagList
        className="pt-20"
        conversationId={data.conversation.id}
        tags={data.tags}
      />
      <SuspendedSection user={user} />
      {data.conversation.rating != null && (
        <div className="mt-12 flex items-center gap-8 text-sm">
          {data.conversation.rating ? (
            <Fragment>
              <ThumbUpIcon className="text-positive" size="sm" />
              <Trans message="Rated good" />
            </Fragment>
          ) : (
            <Fragment>
              <ThumbDownIcon className="text-danger" size="sm" />
              <Trans message="Rated bad" />
            </Fragment>
          )}
        </div>
      )}
    </div>
  );
}

interface SuspendedSectionProps {
  user: FullConversationResponse['user'];
}
function SuspendedSection({user}: SuspendedSectionProps) {
  if (!user.banned_at) {
    return null;
  }

  const ban = user.bans?.[0];

  return (
    <Fragment>
      <div className="mt-12 flex items-center gap-8 text-sm text-danger">
        <BlockIcon size="sm" />
        <div>
          <Trans message="Suspended user" />
          {ban?.expired_at && (
            <Fragment>
              {' '}
              ({<FormattedDuration endDate={ban.expired_at} verbose />})
            </Fragment>
          )}
        </div>
      </div>
      {ban?.comment && (
        <div className="mt-6 text-xs text-danger">{ban.comment}</div>
      )}
    </Fragment>
  );
}

interface DetailLayoutProps {
  label: ReactNode;
  value: ReactNode;
  className?: string;
}
export function DetailLayout({label, value, className}: DetailLayoutProps) {
  return (
    <div className={clsx('flex overflow-hidden py-4 text-sm', className)}>
      <div className="w-84 flex-shrink-0 text-muted">{label}</div>
      <div className="min-w-0 flex-auto">{value}</div>
    </div>
  );
}

interface DetailValueProps {
  image: ReactNode;
  children: ReactNode;
}

export function DetailValue({image, children}: DetailValueProps) {
  return (
    <div className="flex items-center gap-6">
      {image}
      <div className="overflow-hidden overflow-ellipsis whitespace-nowrap">
        {children}
      </div>
    </div>
  );
}

interface HeaderProps {
  user: FullConversationResponse['user'];
}
function Header({user}: HeaderProps) {
  return (
    <div className="mb-12 overflow-hidden border-b pb-18">
      <div className="flex items-center gap-12 whitespace-nowrap">
        <Link to={`/dashboard/customers/${user.id}`} target="_blank">
          <CustomerAvatar user={user} size="w-64 h-64" />
        </Link>
        <div className="min-w-0 flex-auto">
          <Link
            to={`/dashboard/customers/${user.id}`}
            target="_blank"
            className="hover:underline"
          >
            <CustomerName
              className="overflow-hidden overflow-ellipsis text-base font-semibold"
              user={user}
            />
          </Link>
          {user.email && (
            <div className="overflow-hidden overflow-ellipsis text-sm">
              {user.email}
            </div>
          )}
          {(user.country || user.city) && (
            <div className="mb-2 text-sm">
              {user.country}, {user.city}
            </div>
          )}
          <div className="text-sm text-muted">
            <FormattedDate date={getCurrentDate(user.timezone)} preset="time" />{' '}
            <Trans message="local time" />
          </div>
        </div>
      </div>
      {!!user.tags?.length && (
        <ChipList size="xs" className="mt-18">
          {user.tags.map(tag => (
            <Chip key={tag}>{tag}</Chip>
          ))}
        </ChipList>
      )}
    </div>
  );
}

function getCurrentDate(timezone?: string) {
  try {
    return now(timezone ?? getLocalTimeZone());
  } catch (e) {
    return now(getLocalTimeZone());
  }
}
