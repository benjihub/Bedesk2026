import {useUploadTranslationFile} from '@common/admin/translations/use-upload-translation-file';
import {useVirtualizer} from '@tanstack/react-virtual';
import {Button} from '@ui/buttons/button';
import {IconButton} from '@ui/buttons/icon-button';
import {TextField} from '@ui/forms/input-field/text-field/text-field';
import {Localization} from '@ui/i18n/localization';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {AddIcon} from '@ui/icons/material/Add';
import {CloseIcon} from '@ui/icons/material/Close';
import {MoreVertIcon} from '@ui/icons/material/MoreVert';
import {SearchIcon} from '@ui/icons/material/Search';
import {Menu, MenuItem, MenuTrigger} from '@ui/menu/menu-trigger';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {downloadFileFromUrl} from '@ui/utils/files/download-file-from-url';
import {openUploadWindow} from '@ui/utils/files/open-upload-window';
import {useIsMobileMediaQuery} from '@ui/utils/hooks/is-mobile-media-query';
import {useMemo, useRef, useState} from 'react';
import {useNavigate} from '../../ui/navigation/use-navigate';
import {NewTranslationDialog} from './new-translation-dialog';
import {useUpdateLocalization} from './update-localization';

import {commonAdminQueries} from '@common/admin/common-admin-queries';
import {DatatablePageHeaderBar} from '@common/datatable/page/datatable-page-with-header-layout';
import {useRequiredParams} from '@common/ui/navigation/use-required-params';
import {useSuspenseQuery} from '@tanstack/react-query';
import {Breadcrumb} from '@ui/breadcrumbs/breadcrumb';
import {BreadcrumbItem} from '@ui/breadcrumbs/breadcrumb-item';
import {FileInputType} from '@ui/utils/files/file-input-config';

type Lines = Record<string, string>;

export function Component() {
  const {localeId} = useRequiredParams(['localeId']);
  const query = useSuspenseQuery(
    commonAdminQueries.localizations.get(localeId),
  );

  const [lines, setLines] = useState<Lines>(
    query.data.localization.lines || {},
  );

  const navigate = useNavigate();
  const updateLocalization = useUpdateLocalization();
  const [searchQuery, setSearchQuery] = useState<string>('');

  return (
    <form
      className="flex h-full flex-col"
      onSubmit={e => {
        e.preventDefault();
        updateLocalization.mutate(
          {id: query.data.localization.id, lines},
          {
            onSuccess: () => {
              navigate('/admin/localizations');
            },
          },
        );
      }}
    >
      <DatatablePageHeaderBar
        showSidebarToggleButton
        title={
          <Breadcrumb size="xl">
            <BreadcrumbItem
              onSelected={() => {
                navigate('/admin/localizations');
              }}
            >
              <Trans message="Localizations" />
            </BreadcrumbItem>
            <BreadcrumbItem>
              <Trans
                message=":locale translations"
                values={{locale: query.data.localization.name}}
              />
            </BreadcrumbItem>
          </Breadcrumb>
        }
      />
      <Header
        localization={query.data.localization}
        setLines={setLines}
        lines={lines}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isLoading={updateLocalization.isPending}
      />
      <LinesList lines={lines} setLines={setLines} searchQuery={searchQuery} />
    </form>
  );
}

interface HeaderProps {
  localization: Localization;
  lines: Lines;
  setLines: (lines: Lines) => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  isLoading: boolean;
}
function Header({
  localization,
  searchQuery,
  setSearchQuery,
  isLoading,
  lines,
  setLines,
}: HeaderProps) {
  const isMobile = useIsMobileMediaQuery();
  const {trans} = useTrans();

  return (
    <div className="flex-shrink-0 p-14 md:p-24">
      <div className="flex items-center gap-32 md:gap-12">
        <div className="max-w-440 flex-auto">
          <TextField
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            startAdornment={<SearchIcon />}
            placeholder={trans({message: 'Type to search...'})}
          />
        </div>
        <DialogTrigger
          type="modal"
          onClose={newTranslation => {
            if (newTranslation) {
              const newLines = {...lines};
              newLines[newTranslation.key] = newTranslation.value;
              setLines(newLines);
            }
          }}
        >
          {!isMobile && (
            <Button
              className="ml-auto"
              variant="outline"
              color="primary"
              startIcon={<AddIcon />}
            >
              <Trans message="Add new" />
            </Button>
          )}
          <NewTranslationDialog />
        </DialogTrigger>
        <ActionsMenuTrigger locale={localization} />
        <Button
          variant="flat"
          color="primary"
          type="submit"
          disabled={isLoading}
        >
          {isMobile ? (
            <Trans message="Save" />
          ) : (
            <Trans message="Save translations" />
          )}
        </Button>
      </div>
    </div>
  );
}

interface LinesListProps {
  searchQuery?: string;
  lines: Lines;
  setLines: (lines: Lines) => void;
}
function LinesList({searchQuery, lines, setLines}: LinesListProps) {
  const filteredLines = useMemo(() => {
    return Object.entries(lines).filter(([id, translation]) => {
      const lowerCaseQuery = searchQuery?.toLowerCase();
      return (
        !lowerCaseQuery ||
        id?.toLowerCase().includes(lowerCaseQuery) ||
        translation?.toLowerCase().includes(lowerCaseQuery)
      );
    });
  }, [lines, searchQuery]);

  const ref = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: filteredLines.length,
    getScrollElement: () => ref.current,
    estimateSize: () => 123,
  });

  return (
    <div className="flex-auto overflow-y-auto px-14 md:px-24" ref={ref}>
      <div
        className="relative w-full"
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
        }}
      >
        {rowVirtualizer.getVirtualItems().map(virtualItem => {
          const [id, translation] = filteredLines[virtualItem.index];
          return (
            <div
              key={id}
              className="absolute left-0 top-0 w-full"
              style={{
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <div className="mb-10 rounded border md:mr-10">
                <div className="flex items-center justify-between gap-24 border-b px-10 py-2">
                  <label
                    className="flex-auto text-xs font-semibold"
                    htmlFor={id}
                  >
                    {id}
                  </label>
                  <IconButton
                    size="xs"
                    className="text-muted"
                    onClick={() => {
                      const newLines = {...lines};
                      delete newLines[id];
                      setLines(newLines);
                    }}
                  >
                    <CloseIcon />
                  </IconButton>
                </div>
                <div>
                  <textarea
                    id={id}
                    name={id}
                    defaultValue={translation}
                    className="block w-full resize-none rounded bg-inherit p-10 text-sm outline-none focus-visible:ring-2"
                    rows={2}
                    onChange={e => {
                      const newLines = {...lines};
                      newLines[id] = e.target.value;
                      setLines(newLines);
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface ActionsMenuTriggerProps {
  locale: Localization;
}
function ActionsMenuTrigger({locale}: ActionsMenuTriggerProps) {
  const uploadFile = useUploadTranslationFile();
  return (
    <MenuTrigger>
      <IconButton
        variant="outline"
        size="sm"
        color="primary"
        disabled={uploadFile.isPending}
      >
        <MoreVertIcon />
      </IconButton>
      <Menu>
        <MenuItem
          value="download"
          onSelected={() =>
            downloadFileFromUrl(`api/v1/localizations/${locale.id}/download`)
          }
        >
          <Trans message="Download" />
        </MenuItem>
        <MenuItem
          value="upload"
          onSelected={async () => {
            const files = await openUploadWindow({
              types: [FileInputType.json],
            });
            if (files.length == 1) {
              uploadFile.mutate({localeId: locale.id, file: files[0]});
            }
          }}
        >
          <Trans message="Upload" />
        </MenuItem>
      </Menu>
    </MenuTrigger>
  );
}
