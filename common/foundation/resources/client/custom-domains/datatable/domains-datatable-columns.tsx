import {CustomDomain} from '@common/custom-domains/custom-domain';
import {ColumnConfig} from '@common/datatable/column-config';
import {FormattedDate} from '@ui/i18n/formatted-date';
import {Trans} from '@ui/i18n/trans';
import {RemoteFavicon} from '@common/ui/other/remote-favicon';
import React from 'react';
import {NameWithAvatar} from '@common/datatable/column-templates/name-with-avatar';
import {BooleanIndicator} from '@common/datatable/column-templates/boolean-indicator';
import {DeleteDomainButton} from '@common/custom-domains/datatable/delete-domain-button';

export const domainsDatatableColumns: ColumnConfig<CustomDomain>[] = [
  {
    key: 'host',
    allowsSorting: true,
    header: () => <Trans message="Domain" />,
    width: 'flex-3 min-w-200',
    visibleInMode: 'all',
    body: domain => (
      <div>
        <div className="flex items-center gap-6 whitespace-nowrap">
          <RemoteFavicon url={domain.host} />
          <a
            className="block w-min overflow-hidden overflow-ellipsis font-semibold hover:underline"
            href={domain.host}
            target="_blank"
            rel="noreferrer"
            data-testid="host-name"
          >
            {domain.host}
          </a>
        </div>
      </div>
    ),
  },
  {
    key: 'user_id',
    allowsSorting: true,
    header: () => <Trans message="Owner" />,
    width: 'flex-2 min-w-140',
    body: domain => {
      if (!domain.user) return '';
      return (
        <NameWithAvatar
          image={domain.user.image}
          label={domain.user.name}
          description={domain.user.email}
        />
      );
    },
  },
  {
    key: 'global',
    allowsSorting: true,
    header: () => <Trans message="Global" />,
    body: domain => <BooleanIndicator value={domain.global} />,
  },
  {
    key: 'updated_at',
    allowsSorting: true,
    header: () => <Trans message="Last updated" />,
    body: domain =>
      domain.updated_at ? <FormattedDate date={domain.updated_at} /> : '',
  },
  {
    key: 'actions',
    header: () => <Trans message="Actions" />,
    hideHeader: true,
    width: 'w-80 flex-shrink-0',
    visibleInMode: 'all',
    align: 'end',
    body: domain => <DeleteDomainButton domain={domain} />,
  },
];
