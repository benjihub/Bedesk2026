import {AdminDocsUrls} from '@app/admin/admin-config';
import {AdminSettings} from '@common/admin/settings/admin-settings';
import {AdminSettingsLayout} from '@common/admin/settings/layout/settings-layout';
import {useAdminSettings} from '@common/admin/settings/requests/use-admin-settings';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {ProgressCircle} from '@ui/progress/progress-circle';
import {Tab} from '@ui/tabs/tab';
import {TabList} from '@ui/tabs/tab-list';
import {Tabs} from '@ui/tabs/tabs';
import React, {ReactElement, Suspense, useRef} from 'react';
import {useForm, useFormContext} from 'react-hook-form';
import {useSearchParams} from 'react-router';

const AceEditor = React.lazy(() => import('@common/ace-editor/ace-editor'));

const tabs = [
  {
    name: 'html',
    label: message('Custom HTML & JavaScript'),
  },
  {
    name: 'css',
    label: message('Custom CSS'),
  },
];

export function Component() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedTabName = searchParams.get('tab') || 'html';
  let selectedTabIndex = tabs.findIndex(tab => tab.name === selectedTabName);
  selectedTabIndex = selectedTabIndex === -1 ? 0 : selectedTabIndex;

  const mode = selectedTabName === 'html' ? 'html' : 'css';

  const tabList = (
    <Tabs
      selectedTab={selectedTabIndex}
      onTabChange={index => setSearchParams({tab: tabs[index].name})}
    >
      <TabList className="px-8">
        {tabs.map(tab => (
          <Tab key={tab.name}>
            <Trans {...tab.label} />
          </Tab>
        ))}
      </TabList>
    </Tabs>
  );

  return <EditorLayout key={mode} mode={mode} tabList={tabList} />;
}

interface EditorLayoutProps {
  mode: 'css' | 'html';
  tabList: ReactElement;
}
function EditorLayout({mode, tabList}: EditorLayoutProps) {
  const {data} = useAdminSettings();
  const defaultValues =
    mode === 'css'
      ? {custom_code: {css: data.custom_code.css}}
      : {custom_code: {html: data.custom_code.html}};

  const form = useForm<AdminSettings>({
    defaultValues,
  });

  return (
    <AdminSettingsLayout
      form={form}
      title={<Trans message="Custom code" />}
      tabs={tabList}
      docsLink={AdminDocsUrls.settings.customCode}
    >
      <div className="relative h-580 overflow-hidden rounded-panel border">
        <CodeEditor mode={mode} />
      </div>
    </AdminSettingsLayout>
  );
}

interface CodeEditorProps {
  mode: 'css' | 'html';
}
function CodeEditor({mode}: CodeEditorProps) {
  const {setValue, getValues, setError, clearErrors} =
    useFormContext<AdminSettings>();

  // There's a bug in AceEditor, onChange is called on mount,
  // so we need to ignore it, otherwise form will be marked as dirty
  const ignoreChange = useRef(true);

  const formPath =
    mode === 'html'
      ? ('custom_code.html' as const)
      : ('custom_code.css' as const);

  return (
    <Suspense fallback={<ProgressCircle isIndeterminate />}>
      <AceEditor
        mode={mode}
        onLoad={() => {
          setTimeout(() => (ignoreChange.current = false), 10);
        }}
        onChange={newValue => {
          if (!ignoreChange.current) {
            return setValue(formPath, newValue, {shouldDirty: true});
          }
        }}
        defaultValue={getValues(formPath) || ''}
        onIsValidChange={isValid => {
          if (isValid) {
            clearErrors(formPath);
          } else {
            setError(formPath, {type: 'manual'});
          }
        }}
      />
    </Suspense>
  );
}
