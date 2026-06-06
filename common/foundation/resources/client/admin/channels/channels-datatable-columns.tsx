import {ColumnConfig} from '@common/datatable/column-config';
import {Link} from 'react-router';
import {IconButton} from '@ui/buttons/icon-button';
import {EditIcon} from '@ui/icons/material/Edit';
import React from 'react';
import {Channel} from '@common/channels/channel';
import {Chip} from '@ui/forms/input-field/chip-field/chip';
import {Tooltip} from '@ui/tooltip/tooltip';
import {useSettings} from '@ui/settings/use-settings';
import {HomeIcon} from '@ui/icons/material/Home';
import {Trans} from '@ui/i18n/trans';
import {FormattedDate} from '@ui/i18n/formatted-date';

export const ChannelsDatatableColumns: ColumnConfig<Channel>[] = [
  {
    key: 'name',
    allowsSorting: true,
    width: 'flex-3',
    visibleInMode: 'all',
    header: () => <Trans message="Name" />,
    body: channel => {
      return (
        <div>
          <div className="overflow-hidden overflow-ellipsis whitespace-nowrap font-medium">
            <ChannelName channel={channel} />
          </div>
          {channel.config.adminDescription && (
            <p className="max-w-680 whitespace-normal text-xs text-muted">
              {channel.config.adminDescription}
            </p>
          )}
        </div>
      );
    },
  },
  {
    key: 'content',
    allowsSorting: false,
    header: () => <Trans message="Content" />,
    body: channel => <ContentType channel={channel} />,
  },
  {
    key: 'content_type',
    allowsSorting: false,
    header: () => <Trans message="Content type" />,
    body: channel => (
      <span className="capitalize">
        {channel.config.contentModel ? (
          <Trans message={channel.config.contentModel} />
        ) : undefined}
      </span>
    ),
  },
  {
    key: 'internal',
    allowsSorting: true,
    maxWidth: 'max-w-100',
    hideHeader: true,
    header: () => <Trans message="Internal" />,
    body: channel => <InternalColumn channel={channel} />,
  },
  {
    key: 'updated_at',
    allowsSorting: true,
    maxWidth: 'max-w-100',
    header: () => <Trans message="Last updated" />,
    body: channel =>
      channel.updated_at ? <FormattedDate date={channel.updated_at} /> : '',
  },
  {
    key: 'actions',
    header: () => <Trans message="Actions" />,
    hideHeader: true,
    visibleInMode: 'all',
    align: 'end',
    width: 'w-42 flex-shrink-0',
    body: channel => (
      <Link to={`${channel.id}/edit`} className="text-muted">
        <IconButton size="md">
          <EditIcon />
        </IconButton>
      </Link>
    ),
  },
];

interface ContentTypeProps {
  channel: Channel;
}
function ContentType({channel}: ContentTypeProps) {
  switch (channel.config.contentType) {
    case 'listAll':
      return <Trans message="List all" />;
    case 'manual':
      return <Trans message="Managed manually" />;
    case 'autoUpdate':
      return <Trans message="Updated automatically" />;
  }
}

interface ChannelNameProps {
  channel: Channel;
}
function ChannelName({channel}: ChannelNameProps) {
  // link will not work without specific genre name in channel url
  if (
    channel.config.restriction &&
    channel.config.restrictionModelId === 'urlParam'
  ) {
    return channel.name;
  }
  return (
    <a
      className="outline-none hover:underline focus-visible:underline"
      href={`channel/${channel.slug}`}
      target="_blank"
      rel="noreferrer"
    >
      {channel.name}
    </a>
  );
}

function InternalColumn({channel}: ChannelNameProps) {
  const {homepage} = useSettings();
  const internalLabel = channel.internal ? (
    <Tooltip
      label={
        <Trans message="This channel is required for some site functionality to work properly and can't be deleted." />
      }
    >
      <div>
        <Chip className="w-max" size="xs" radius="rounded-panel">
          <Trans message="Internal" />
        </Chip>
      </div>
    </Tooltip>
  ) : (
    ''
  );

  const isHomepage =
    homepage?.type === 'channels' && `${homepage.value}` === `${channel.id}`;

  return (
    <div className="flex items-center gap-6">
      {internalLabel}
      {isHomepage ? <HomeIcon className="text-muted" size="sm" /> : null}
    </div>
  );
}
