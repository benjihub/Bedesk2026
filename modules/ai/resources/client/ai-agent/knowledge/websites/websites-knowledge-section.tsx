import {useSuspenseQuery} from '@tanstack/react-query';
import {Button} from '@ui/buttons/button';
import {Item} from '@ui/forms/listbox/item';
import {FormattedRelativeTime} from '@ui/i18n/formatted-relative-time';
import {Trans} from '@ui/i18n/trans';
import {AddIcon} from '@ui/icons/material/Add';
import {ArrowDropDownIcon} from '@ui/icons/material/ArrowDropDown';
import {ContentCopyIcon} from '@ui/icons/material/ContentCopy';
import {DeleteIcon} from '@ui/icons/material/Delete';
import {PublicIcon} from '@ui/icons/material/Public';
import {SettingsIcon} from '@ui/icons/material/Settings';
import {SyncIcon} from '@ui/icons/material/Sync';
import {Menu, MenuTrigger} from '@ui/menu/menu-trigger';
import {ConfirmationDialog} from '@ui/overlays/dialog/confirmation-dialog';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {Fragment, useState} from 'react';
import {Link, useLocation, useNavigate} from 'react-router';
import {aiAgentQueries} from '../../ai-agent-queries';
import {KnowledgePageSectionLayout} from '../knowledge-page-section-layout';
import {KnowledgeSectionItem} from '../knowledge-section-item';
import {IngestWebsiteDialog} from './ingest-website-dialog';
import {AiAgentWebsite} from './requests/ai-agent-website';
import {useDeleteWebsite} from './requests/use-delete-website';
import {useSyncWebsiteContent} from './requests/use-sync-website-content';

export function WebsitesKnowledgeSection() {
  const {data} = useSuspenseQuery(aiAgentQueries.knowledge.index());
  const location = useLocation();
  return (
    <KnowledgePageSectionLayout
      icon={<PublicIcon size="md" />}
      title={
        <Link
          to={`../knowledge/websites${location.search}`}
          className="hover:underline"
        >
          <Trans message="Websites" />
        </Link>
      }
      description={<Trans message="Sync content from a public website" />}
      action={
        <DialogTrigger type="modal">
          <Button startIcon={<AddIcon />} variant="outline" size="xs">
            <Trans message="Add website" />
          </Button>
          <IngestWebsiteDialog />
        </DialogTrigger>
      }
    >
      {data?.websites.items.map(website => (
        <WebsiteRow key={website.id} website={website} />
      ))}
      <MoreWebsitesRow />
    </KnowledgePageSectionLayout>
  );
}

function MoreWebsitesRow() {
  const {data} = useSuspenseQuery(aiAgentQueries.knowledge.index());
  const location = useLocation();
  if (!data?.websites.more.count) return null;

  const link = `../knowledge/websites${location.search}`;
  return (
    <KnowledgeSectionItem
      scanPending={data.websites.more.ingesting}
      to={link}
      name={
        <Trans
          message="And :count more websites"
          values={{count: data.websites.more.count}}
        />
      }
      icon={<ContentCopyIcon size="sm" />}
      actions={
        <Button
          variant="outline"
          size="xs"
          className="min-w-96"
          elementType={Link}
          to={link}
        >
          <Trans message="View all" />
        </Button>
      }
    />
  );
}

interface WebsiteRowProps {
  website: AiAgentWebsite;
}
function WebsiteRow({website}: WebsiteRowProps) {
  const location = useLocation();
  return (
    <KnowledgeSectionItem
      name={website.url}
      icon={<PublicIcon />}
      scanPending={website.scan_pending}
      description={
        <Fragment>
          {website.scan_pending ? (
            <Trans message="Scanning..." />
          ) : (
            <Trans
              message="Last synced: :date"
              values={{
                date: <FormattedRelativeTime date={website.updated_at} />,
              }}
            />
          )}
        </Fragment>
      }
      to={`../knowledge/websites/${website.id}/pages${location.search}`}
      actions={<RowOptionsTrigger website={website} />}
    />
  );
}

interface RowOptionsTriggerProps {
  website: AiAgentWebsite;
}
function RowOptionsTrigger({website}: RowOptionsTriggerProps) {
  const resync = useSyncWebsiteContent();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <Fragment>
      <MenuTrigger>
        <Button variant="outline" size="xs" endIcon={<ArrowDropDownIcon />}>
          <Trans message="Manage" />
        </Button>
        <Menu>
          <Item
            value="resync"
            startIcon={<SyncIcon size="sm" />}
            isDisabled={resync.isPending || website.scan_pending}
            onSelected={() =>
              resync.mutate({
                websiteId: website.id,
              })
            }
          >
            <Trans message="Re-sync" />
          </Item>
          <Item
            value="view"
            startIcon={<SettingsIcon size="sm" />}
            onSelected={() => {
                navigate(
                  `../knowledge/websites/${website.id}/pages${location.search}`,
                );
              }}
            >
            <Trans message="View pages" />
          </Item>
          <Item
            value="delete"
            startIcon={<DeleteIcon size="sm" />}
            className="text-danger"
            onSelected={() => setDeleteDialogOpen(true)}
          >
            <Trans message="Delete website" />
          </Item>
        </Menu>
      </MenuTrigger>
      {deleteDialogOpen && (
        <DialogTrigger
          type="modal"
          isOpen={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
        >
          <DeleteWebsiteDialog websiteId={website.id} />
        </DialogTrigger>
      )}
    </Fragment>
  );
}

interface DeleteWebsiteDialogProps {
  websiteId: string | number;
}
function DeleteWebsiteDialog({websiteId}: DeleteWebsiteDialogProps) {
  const deleteWebsite = useDeleteWebsite();
  const {close} = useDialogContext();
  return (
    <ConfirmationDialog
      isLoading={deleteWebsite.isPending}
      isDanger
      title={<Trans message="Remove website" />}
      body={
        <Trans message="Are you sure you want to delete this website? This action cannot be undone." />
      }
      confirm={<Trans message="Delete" />}
      onConfirm={() => {
        deleteWebsite.mutate({websiteId}, {onSuccess: () => close()});
      }}
    />
  );
}
