import {ColumnConfig} from '@common/datatable/column-config';
import {Campaign} from '@livechat/dashboard/campaigns/campaign';
import {DeleteCampaignDialog} from '@livechat/dashboard/campaigns/campaign-index-page/delete-campaign-dialog';
import {RenameCampaignDialog} from '@livechat/dashboard/campaigns/campaign-index-page/rename-campaign-dialog';
import {useUpdateCampaign} from '@livechat/dashboard/campaigns/use-update-campaign';
import {LinkStyle} from '@ui/buttons/external-link';
import {IconButton} from '@ui/buttons/icon-button';
import {Item} from '@ui/forms/listbox/item';
import {Switch} from '@ui/forms/toggle/switch';
import {Trans} from '@ui/i18n/trans';
import {BarChartIcon} from '@ui/icons/material/BarChart';
import {MoreVertIcon} from '@ui/icons/material/MoreVert';
import {Menu, MenuTrigger} from '@ui/menu/menu-trigger';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {Skeleton} from '@ui/skeleton/skeleton';
import {Tooltip} from '@ui/tooltip/tooltip';
import {Fragment, useState} from 'react';
import {Link, useLocation} from 'react-router';

export const CampaignDatatableColumns: ColumnConfig<Campaign>[] = [
  {
    key: 'name',
    allowsSorting: true,
    visibleInMode: 'all',
    header: () => <Trans message="Name" />,
    body: (campaign, row) =>
      row.isPlaceholder ? (
        <Skeleton variant="rect" className="max-w-100" />
      ) : (
        <Link className={LinkStyle} to={`../campaigns/${campaign.id}/edit`}>
          {campaign.name}
        </Link>
      ),
  },
  {
    key: 'enabled',
    allowsSorting: true,
    header: () => <Trans message="Enabled" />,
    body: (campaign, row) =>
      row.isPlaceholder ? (
        <Skeleton variant="rect" className="max-w-40" />
      ) : (
        <EnabledColumn campaign={campaign} />
      ),
  },
  {
    key: 'impression_count',
    allowsSorting: true,
    header: () => <Trans message="Displayed" />,
    body: (campaign, row) =>
      row.isPlaceholder ? (
        <Skeleton variant="rect" className="max-w-30" />
      ) : (
        (campaign.impression_count ?? '-')
      ),
  },
  {
    key: 'interaction_count',
    allowsSorting: true,
    header: () => <Trans message="Interactions" />,
    body: (campaign, row) =>
      row.isPlaceholder ? (
        <Skeleton variant="rect" className="max-w-30" />
      ) : (
        (campaign.interaction_count ?? '-')
      ),
  },
  {
    key: 'conversion',
    allowsSorting: false,
    header: () => <Trans message="Conversion" />,
    body: (campaign, row) =>
      campaign.interaction_count && campaign.impression_count
        ? `${(
            (campaign.interaction_count / campaign.impression_count) *
            100
          ).toFixed(2)}%`
        : '-',
  },
  {
    key: 'actions',
    header: () => <Trans message="Actions" />,
    hideHeader: true,
    visibleInMode: 'all',
    align: 'end',
    width: 'w-84 flex-shrink-0',
    body: (campaign, row) => (
      <CampaignDatatableActionColumn
        campaign={campaign}
        isPlaceholder={row.isPlaceholder}
      />
    ),
  },
];

interface CampaignDatatableActionColumnColumnProps {
  campaign: Campaign;
  isPlaceholder?: boolean;
}
export function CampaignDatatableActionColumn({
  campaign,
  isPlaceholder,
}: CampaignDatatableActionColumnColumnProps) {
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const {pathname} = useLocation();

  if (isPlaceholder) {
    return <Skeleton variant="rect" size="w-84 h-24" />;
  }

  return (
    <Fragment>
      <Tooltip label={<Trans message="Report" />}>
        <IconButton
          elementType={Link}
          to={`../campaigns/${campaign.id}`}
          state={{from: pathname}}
          className="text-muted"
        >
          <BarChartIcon />
        </IconButton>
      </Tooltip>
      <MenuTrigger>
        <IconButton className="text-muted">
          <MoreVertIcon />
        </IconButton>
        <Menu>
          <Item
            value="edit"
            elementType={Link}
            to={`../campaigns/${campaign.id}/edit`}
          >
            <Trans message="Edit" />
          </Item>
          <Item value="rename" onSelected={() => setRenameDialogOpen(true)}>
            <Trans message="Rename" />
          </Item>
          <Item value="delete" onSelected={() => setDeleteDialogOpen(true)}>
            <Trans message="Delete" />
          </Item>
        </Menu>
      </MenuTrigger>
      <DialogTrigger
        type="modal"
        isOpen={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
      >
        <RenameCampaignDialog campaign={campaign} />
      </DialogTrigger>
      <DialogTrigger
        type="modal"
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      >
        <DeleteCampaignDialog campaignId={campaign.id} />
      </DialogTrigger>
    </Fragment>
  );
}

function EnabledColumn({campaign}: {campaign: Campaign}) {
  const updateCampaign = useUpdateCampaign(campaign.id);
  const [isEnabled, setIsEnabled] = useState(campaign.enabled);
  return (
    <div className="w-max">
      <Switch
        checked={isEnabled}
        disabled={updateCampaign.isPending}
        onChange={e => {
          setIsEnabled(e.target.checked);
          updateCampaign.mutate({enabled: e.target.checked});
        }}
      />
    </div>
  );
}
