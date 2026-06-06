import {commonAdminQueries} from '@common/admin/common-admin-queries';
import {AdminSettings} from '@common/admin/settings/admin-settings';
import {settingsPreviewPageId} from '@common/admin/settings/layout/settings-constants';
import {
  SettingsForm,
  SettingsPageHeader,
} from '@common/admin/settings/layout/settings-layout';
import {
  SettingsPageState,
  SettingsPageStoreProvider,
  useSettingsPageStore,
} from '@common/admin/settings/layout/settings-page-store';
import {queryClient} from '@common/http/query-client';
import {Button} from '@ui/buttons/button';
import {IconButton} from '@ui/buttons/icon-button';
import {Item} from '@ui/forms/listbox/item';
import {message} from '@ui/i18n/message';
import {MessageDescriptor} from '@ui/i18n/message-descriptor';
import {Trans} from '@ui/i18n/trans';
import {ArrowDropDownIcon} from '@ui/icons/material/ArrowDropDown';
import {CloseFullscreenIcon} from '@ui/icons/material/CloseFullscreen';
import {OpenInFullIcon} from '@ui/icons/material/OpenInFull';
import {Menu, MenuTrigger} from '@ui/menu/menu-trigger';
import {useSettings} from '@ui/settings/use-settings';
import clsx from 'clsx';
import {
  Fragment,
  ReactElement,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from 'react';
import {UseFormReturn} from 'react-hook-form';
import {BlockerFunction} from 'react-router';

const PreviewSize = {
  real: {
    label: message('Actual size (100%)'),
    width: null,
  },
  desktop: {
    label: message('Desktop'),
    width: 1440,
  },
  tablet: {
    label: message('Tablet'),
    width: 768,
  },
  mobile: {
    label: message('Mobile'),
    width: 390,
  },
};

interface Props {
  children: [ReactElement<ContentProps>, ReactElement];
  title: ReactElement<MessageDescriptor>;
  gridCols?: string;
  allowNavigation?: BlockerFunction;
  defaultRoute?: SettingsPageState['previewRoute'];
  availableRoutes?: SettingsPageState['availableRoutes'];
  docsLink?: string;
}
export function SettingsWithPreview({
  title,
  children,
  gridCols,
  allowNavigation,
  defaultRoute,
  availableRoutes,
  docsLink,
}: Props) {
  return (
    <SettingsPageStoreProvider
      defaultRoute={defaultRoute}
      availableRoutes={availableRoutes}
    >
      <ExpandableContent>
        <div
          className={clsx(
            'grid h-full flex-auto grid-rows-[auto,auto,1fr] bg-elevated md:rounded-panel md:border',
            gridCols ?? 'grid-cols-1 @5xl/with-preview:grid-cols-[auto,1fr]',
          )}
        >
          <SettingsPageHeader
            className="col-span-full row-[1/2]"
            title={title}
            allowNavigation={allowNavigation}
            docsLink={docsLink}
          />
          {children[0]}
          {children[1]}
        </div>
      </ExpandableContent>
    </SettingsPageStoreProvider>
  );
}

interface ExpandableContentProps {
  children: ReactNode;
}
function ExpandableContent({children}: ExpandableContentProps) {
  const isFullScreen = useSettingsPageStore(s => s.isFullScreen);
  return (
    <section
      className={clsx(
        'dashboard-grid-content h-full overflow-y-auto @container/with-preview',
        isFullScreen && 'fixed inset-8',
      )}
    >
      {children}
    </section>
  );
}

interface ContentProps {
  children: ReactNode;
  width?: string;
}
function Content({children, width}: ContentProps) {
  return (
    <div
      className={clsx(
        'compact-scrollbar col-[1/2] row-[2/-1] h-full flex-shrink-0 overflow-y-auto p-24 @container/settings-form',
        width ?? 'w-full @5xl/with-preview:w-440',
      )}
    >
      {children}
    </div>
  );
}

interface FormProps {
  form: UseFormReturn<AdminSettings>;
  children: ReactNode;
  mergePreviewSettings?: boolean;
}
function Form({form, children, mergePreviewSettings}: FormProps) {
  const setValues = useSettingsPageStore(s => s.preview.setValues);

  useEffect(() => {
    // reset setting to the ones that are saved. This will happen
    // when navigating between different settings pages or tabs.
    const currentAdminSettings = queryClient.getQueryData<AdminSettings>(
      commonAdminQueries.settings.index.queryKey,
    );
    if (currentAdminSettings) {
      setValues(currentAdminSettings, {merge: mergePreviewSettings});
    }

    // update settings in preview when any form value changes
    const subscription = form.watch(values => {
      setValues(values as AdminSettings, {merge: mergePreviewSettings});
    });
    return () => subscription.unsubscribe();
  }, [form, setValues]);

  return <SettingsForm form={form}>{children}</SettingsForm>;
}

function PreviewContainer() {
  const [selectedSize, setSelectedSize] =
    useState<keyof typeof PreviewSize>('desktop');

  const [containerSize, setContainerSize] = useState({
    width: 0,
    height: 0,
  });

  const contentWidth = PreviewSize[selectedSize].width;
  const setIframeWindow = useSettingsPageStore(s => s.setIframeWindow);
  const [scaledContentHeight, setScaledContentHeight] = useState(0);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!containerSize) return;

    const scaleFactor = contentWidth
      ? Math.min(containerSize.width / contentWidth, 1)
      : 1;
    const scaledHeight = containerSize.height / scaleFactor;
    setScaledContentHeight(scaledHeight);

    const newScale = contentWidth
      ? Math.min(containerSize.width / contentWidth, 1)
      : 1;

    setScale(newScale);
  }, [contentWidth, containerSize]);

  const src = useSettingsPreviewSrc();

  const rigisterContainerHeightObserver = useCallback((el: HTMLDivElement) => {
    if (!el) return;
    const resizeObserver = new ResizeObserver(entries => {
      setContainerSize(entries[0].contentRect);
    });

    resizeObserver.observe(el);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div className="col-[2/-1] row-[2/-1] hidden grid-rows-subgrid border-l @5xl/with-preview:grid">
      {src ? (
        <Fragment>
          <PreviewHeader size={selectedSize} onSizeChange={setSelectedSize} />
          <div className="col-[1/-1] row-[2/-1] mx-24 mb-24 flex flex-col overflow-hidden rounded-panel border">
            <PreviewToolbar src={src} />
            <div
              ref={rigisterContainerHeightObserver}
              className="height-container relative flex-auto bg-alt"
            >
              <div
                className="absolute left-0 right-0 mx-auto origin-top-left bg"
                style={{
                  width: contentWidth ? `${contentWidth}px` : '100%',
                  height: scaledContentHeight
                    ? `${scaledContentHeight}px`
                    : '100%',
                  transform: `scale(${scale})`,
                }}
              >
                <iframe
                  src={src}
                  className="h-full w-full shadow"
                  ref={el => setIframeWindow(el?.contentWindow ?? null)}
                />
              </div>
            </div>
          </div>
        </Fragment>
      ) : (
        <div className="col-[1/-1] row-[2/-1] m-auto rounded-panel border px-28 py-14">
          <Trans message="No preview available" />
        </div>
      )}
    </div>
  );
}

export function useSettingsPreviewSrc(): string | null {
  const {base_url} = useSettings();
  const uri = useSettingsPageStore(s => s.previewRoute);

  // allow empty string or / as homepage
  if (uri == null) {
    return null;
  }

  const url = new URL(`${base_url}/${uri.replace(/^\//, '')}`);
  url.searchParams.set('settingsPreview', 'true');
  return url.toString();
}

interface PreviewHeaderProps {
  size?: keyof typeof PreviewSize;
  onSizeChange?: (size: keyof typeof PreviewSize) => void;
  padding?: string;
  className?: string;
}
function PreviewHeader({
  size,
  onSizeChange,
  padding,
  className,
}: PreviewHeaderProps) {
  const setPreviewRoute = useSettingsPageStore(s => s.setPreviewRoute);
  const activeRoute = useSettingsPageStore(s => s.previewRoute)!;
  const availableRoutes = Object.values(
    useSettingsPageStore(s => s.availableRoutes),
  );
  return (
    <div
      className={clsx(
        'col-[1/-1] row-[1/2] flex items-center gap-12',
        padding ?? 'px-24 pb-12 pt-24',
        className,
      )}
    >
      {!!availableRoutes?.length && (
        <MenuTrigger
          selectionMode="single"
          selectedValue={activeRoute}
          onSelectionChange={value => setPreviewRoute(value as string)}
        >
          <Button variant="outline" endIcon={<ArrowDropDownIcon />} size="xs">
            <Trans
              {...availableRoutes.find(page => page.route === activeRoute)!
                .label}
            />
          </Button>
          <Menu>
            {availableRoutes.map(page => (
              <Item key={page.route} value={page.route}>
                <Trans {...page.label} />
              </Item>
            ))}
          </Menu>
        </MenuTrigger>
      )}

      <div className="ml-auto w-0" />
      {!!onSizeChange && !!size && (
        <MenuTrigger
          selectionMode="single"
          selectedValue={size}
          onSelectionChange={value =>
            onSizeChange(value as keyof typeof PreviewSize)
          }
        >
          <Button variant="outline" endIcon={<ArrowDropDownIcon />} size="xs">
            <Trans {...PreviewSize[size].label} />
          </Button>
          <Menu>
            {Object.entries(PreviewSize).map(([value, item]) => (
              <Item key={value} value={value}>
                <Trans {...item.label} />
              </Item>
            ))}
          </Menu>
        </MenuTrigger>
      )}
      <FullScreenToogleButton />
    </div>
  );
}

function FullScreenToogleButton() {
  const isFullScreen = useSettingsPageStore(s => s.isFullScreen);
  const setIsFullScreen = useSettingsPageStore(s => s.setIsFullScreen);
  return (
    <IconButton
      variant="outline"
      size="xs"
      onClick={() => setIsFullScreen(!isFullScreen)}
    >
      {isFullScreen ? <CloseFullscreenIcon /> : <OpenInFullIcon />}
    </IconButton>
  );
}

interface PreviewToolbarProps {
  src: string;
}
function PreviewToolbar({src}: PreviewToolbarProps) {
  const parts = new URL(src);
  // remove query params and protocol
  const previewUrl = `${parts.host}${parts.pathname !== '/' ? parts.pathname : ''}`;
  // remove query params only
  const previewSrc = `${parts.protocol}//${previewUrl}`;
  return (
    <div className="flex items-center gap-4 border-b px-12 py-10">
      <div className="mr-auto flex items-center gap-4">
        <div className="size-8 rounded-full bg-chip" />
        <div className="size-8 rounded-full bg-chip" />
        <div className="size-8 rounded-full bg-chip" />
      </div>
      <a
        href={previewSrc}
        target="_blank"
        rel="noreferrer"
        className={clsx(
          'mr-auto block max-w-384 flex-auto rounded-panel border border-divider-lighter px-40 py-4 text-center text-xs text-muted hover:text-primary',
          previewSrc.includes(settingsPreviewPageId) && 'pointer-events-none',
        )}
      >
        {previewUrl}
      </a>
    </div>
  );
}

SettingsWithPreview.Preview = PreviewContainer;
SettingsWithPreview.PreviewHeader = PreviewHeader;
SettingsWithPreview.Content = Content;
SettingsWithPreview.Form = Form;
