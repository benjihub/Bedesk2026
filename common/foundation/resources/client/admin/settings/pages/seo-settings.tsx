import {AdminDocsUrls} from '@app/admin/admin-config';
import {commonAdminQueries} from '@common/admin/common-admin-queries';
import {AdminSettings} from '@common/admin/settings/admin-settings';
import {AdminSettingsLayout} from '@common/admin/settings/layout/settings-layout';
import {useSuspenseQuery} from '@tanstack/react-query';
import {Button} from '@ui/buttons/button';
import {Item} from '@ui/forms/listbox/item';
import {Select} from '@ui/forms/select/select';
import {Trans} from '@ui/i18n/trans';
import {ProgressCircle} from '@ui/progress/progress-circle';
import React, {ReactElement, Suspense, useRef} from 'react';
import type ReactAce from 'react-ace/lib/ace';
import {useForm, useFormContext} from 'react-hook-form';
import {useSearchParams} from 'react-router';

const AceEditor = React.lazy(() => import('@common/ace-editor/ace-editor'));

export function Component() {
  const {
    data: {tags},
  } = useSuspenseQuery(commonAdminQueries.settings.seoTags());

  const [searchParams, setSearchParams] = useSearchParams();
  const selectedView = searchParams.get('view') || Object.keys(tags)[0];

  return (
    <EditorLayout
      view={selectedView}
      key={selectedView}
      select={
        <Select
          label={<Trans message="Page" />}
          selectionMode="single"
          selectedValue={selectedView}
          onSelectionChange={value => setSearchParams({view: value as string})}
          className="mb-24"
        >
          {Object.entries(tags).map(([key]) => (
            <Item key={key} value={key}>
              {prettyName(key)}
            </Item>
          ))}
        </Select>
      }
    />
  );
}

interface EditorLayoutProps {
  view: string;
  select: ReactElement;
}
function EditorLayout({view, select}: EditorLayoutProps) {
  const {
    data: {tags},
  } = useSuspenseQuery(commonAdminQueries.settings.seoTags());

  const form = useForm<AdminSettings>({
    defaultValues: {
      seo: {
        [view]: tags[view].custom || tags[view].original,
      },
    },
  });

  return (
    <AdminSettingsLayout
      form={form}
      title={<Trans message="SEO tags" />}
      docsLink={AdminDocsUrls.settings.seo}
    >
      {select}
      <div className="mb-4 text-sm">
        <Trans message="Content" />
      </div>
      <CodeEditor view={view} />
    </AdminSettingsLayout>
  );
}

interface CodeEditorProps {
  view: string;
}
function CodeEditor({view}: CodeEditorProps) {
  const {
    data: {tags},
  } = useSuspenseQuery(commonAdminQueries.settings.seoTags());
  const editorRef = useRef<ReactAce | null>(null);
  const {setValue, getValues, setError, clearErrors} =
    useFormContext<AdminSettings>();

  // There's a bug in AceEditor, onChange is called on mount,
  // so we need to ignore it, otherwise form will be marked as dirty
  const ignoreChange = useRef(true);

  return (
    <Suspense fallback={<ProgressCircle isIndeterminate />}>
      <div className="relative h-580 overflow-hidden rounded-panel border">
        <AceEditor
          editorRef={editorRef}
          beautify={false}
          mode="php_laravel_blade"
          onLoad={() => {
            setTimeout(() => (ignoreChange.current = false), 10);
          }}
          onChange={newValue => {
            if (!ignoreChange.current) {
              return setValue(`seo.${view}`, newValue, {shouldDirty: true});
            }
          }}
          defaultValue={getValues(`seo.${view}`) || ''}
          onIsValidChange={isValid => {
            if (isValid) {
              clearErrors(`seo.${view}`);
            } else {
              setError(`seo.${view}`, {type: 'manual'});
            }
          }}
        />
      </div>
      <Button
        className="mt-12"
        variant="outline"
        color="primary"
        onClick={() => {
          if (editorRef.current) {
            editorRef.current.editor.setValue(tags[view].original);
          }
        }}
      >
        <Trans message="Reset to original" />
      </Button>
    </Suspense>
  );
}

function prettyName(name: string) {
  return name
    .replace(/-/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .split(' ')
    .filter(p => p.length > 2)
    .join(' ');
}
