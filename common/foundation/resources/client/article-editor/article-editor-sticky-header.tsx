import {UploadType} from '@app/site-config';
import {DatatablePageHeaderBar} from '@common/datatable/page/datatable-page-with-header-layout';
import {HistoryButtons} from '@common/text-editor/menubar/history-buttons';
import {ModeButton} from '@common/text-editor/mode-button';
import {useCurrentTextEditor} from '@common/text-editor/tiptap-editor-context';
import {Button} from '@ui/buttons/button';
import {Trans} from '@ui/i18n/trans';
import {ArrowBackIcon} from '@ui/icons/material/ArrowBack';
import {useIsMobileMediaQuery} from '@ui/utils/hooks/is-mobile-media-query';
import {useStickySentinel} from '@ui/utils/hooks/sticky-sentinel';
import clsx from 'clsx';
import {Fragment, ReactNode} from 'react';
import {useFormContext} from 'react-hook-form';
import {Link} from 'react-router';
import {ArticleEditorMenubar} from './article-editor-menubar';

interface ArticleEditorHeaderProps {
  children: ReactNode;
  onSave?: (editorContent: string) => void;
  saveButton?: ReactNode;
  isSaving?: boolean;
  rightContent?: ReactNode;
  showSidebarToggleButton?: boolean;
}
export function ArticleEditorHeader({
  children,
  onSave,
  saveButton,
  isSaving = false,
  rightContent,
  showSidebarToggleButton = true,
}: ArticleEditorHeaderProps) {
  const editor = useCurrentTextEditor();
  return (
    <DatatablePageHeaderBar
      showSidebarToggleButton={showSidebarToggleButton}
      rightContent={
        <Fragment>
          <HistoryButtons />
          <ModeButton />
          {onSave && (
            <SaveButton
              onSave={() => {
                onSave(editor?.getHTML() ?? '');
              }}
              isLoading={isSaving}
            />
          )}
          {saveButton}
          {rightContent}
        </Fragment>
      }
    >
      {children}
    </DatatablePageHeaderBar>
  );
}

interface StickyHeaderProps {
  onSave?: (editorContent: string) => void;
  saveButton?: ReactNode;
  backLink: string;
  isLoading?: boolean;
  imageUploadType: keyof typeof UploadType;
}
export function ArticleEditorStickyHeader({
  onSave,
  saveButton,
  isLoading = false,
  backLink,
  imageUploadType,
}: StickyHeaderProps) {
  const {isSticky, sentinelRef} = useStickySentinel();
  const isMobile = useIsMobileMediaQuery();
  const editor = useCurrentTextEditor()!;

  return (
    <Fragment>
      <div ref={sentinelRef} />
      <div
        className={clsx(
          'sticky top-0 z-10 mb-20 w-full flex-shrink-0 bg',
          isSticky && 'shadow',
        )}
      >
        <div className="flex items-center justify-between gap-20 border-b px-20 py-10 text-muted sm:justify-start">
          {!isMobile && (
            <Fragment>
              <Button
                variant="text"
                size="sm"
                elementType={Link}
                to={backLink}
                relative="path"
                startIcon={<ArrowBackIcon />}
              >
                <Trans message="Back" />
              </Button>
            </Fragment>
          )}
          {editor && <HistoryButtons />}
          {!isMobile && <ModeButton />}
          {onSave && <SaveButton onSave={onSave} isLoading={isLoading} />}
          {saveButton}
        </div>
        <ArticleEditorMenubar size="sm" imageUploadType={imageUploadType} />
      </div>
    </Fragment>
  );
}

interface SaveButtonProps {
  onSave: (editorContent: string) => void;
  isLoading: boolean;
}
function SaveButton({onSave, isLoading}: SaveButtonProps) {
  const editor = useCurrentTextEditor();
  const form = useFormContext();
  const title = form.watch('title');

  return (
    <Button
      variant="flat"
      size="sm"
      color="primary"
      className="min-w-90"
      disabled={isLoading || !title || !editor}
      onClick={() => onSave(editor?.getHTML() ?? '')}
    >
      <Trans message="Save" />
    </Button>
  );
}
