import {IconButton} from '@ui/buttons/icon-button';
import {Trans} from '@ui/i18n/trans';
import {DeleteIcon} from '@ui/icons/material/Delete';
import {VisibilityIcon} from '@ui/icons/material/Visibility';
import {IllustratedMessage} from '@ui/images/illustrated-message';
import {SvgImage} from '@ui/images/svg-image';
import {ConfirmationDialog} from '@ui/overlays/dialog/confirmation-dialog';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import React, {Fragment, ReactElement, Suspense} from 'react';
import pendingApprovalImage from '../websites/pending-approval.svg';

const MarkdownRenderer = React.lazy(() => import('./markdown-renderer'));

interface Props {
  markdown: string | undefined;
  header: ReactElement;
}
export function KnowledgePreviewLayout({markdown, header}: Props) {
  const content = markdown ? (
    <Fragment>
      <div className="absolute -top-16 left-0 right-0 mx-auto flex w-max items-center gap-8 rounded-full border bg-elevated px-12 py-4 text-sm shadow">
        <VisibilityIcon size="sm" />
        <Trans message="Content preview" />
      </div>
      <div className="prose mx-auto dark:prose-invert">
        <Suspense>
          <MarkdownRenderer>{markdown}</MarkdownRenderer>
        </Suspense>
      </div>
    </Fragment>
  ) : (
    <IllustratedMessage
      className="mt-40"
      image={<SvgImage src={pendingApprovalImage} />}
      title={<Trans message="This document was not fully ingested yet" />}
      description={
        <Trans message="You will be notified when ingestion is complete" />
      }
    />
  );

  return (
    <div className="isolate flex h-full flex-col">
      {header}
      <div className="flex-auto overflow-y-auto p-16 stable-scrollbar md:p-24">
        <div className="container relative mx-auto mt-24 min-h-[calc(100%-24px)] rounded-panel bg-alt p-24 dark:border">
          {content}
        </div>
      </div>
    </div>
  );
}

interface DeleteKnowledgeItemButtonProps {
  onDelete: () => Promise<any>;
  isPending: boolean;
}
export function DeleteKnowledgeItemButton({
  onDelete,
  isPending,
}: DeleteKnowledgeItemButtonProps) {
  return (
    <DialogTrigger type="modal">
      <IconButton variant="outline" size="sm">
        <DeleteIcon />
      </IconButton>
      <DeleteKnowledgeItemDialog onDelete={onDelete} isPending={isPending} />
    </DialogTrigger>
  );
}

export function DeleteKnowledgeItemDialog({
  onDelete,
  isPending,
}: DeleteKnowledgeItemButtonProps) {
  const {close} = useDialogContext();
  return (
    <ConfirmationDialog
      isLoading={isPending}
      isDanger
      title={<Trans message="Remove content" />}
      body={
        <Trans message="Are you sure you want to delete the document? This action cannot be undone." />
      }
      confirm={<Trans message="Delete" />}
      onConfirm={async () => {
        try {
          await onDelete();
          close();
        } catch (e) {}
      }}
    />
  );
}
