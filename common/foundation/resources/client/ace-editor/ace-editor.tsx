import {useIsDarkMode} from '@ui/themes/use-is-dark-mode';
import ace from 'ace-builds/src-noconflict/ace';
import Beautify from 'ace-builds/src-noconflict/ext-beautify';
import 'ace-builds/src-noconflict/ext-language_tools';
import 'ace-builds/src-noconflict/mode-css';
import 'ace-builds/src-noconflict/mode-html';
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/mode-php_laravel_blade';
import 'ace-builds/src-noconflict/theme-chrome';
import 'ace-builds/src-noconflict/theme-tomorrow_night';
import cssWorkerUrl from 'ace-builds/src-noconflict/worker-css?url';
import htmlWorkerUrl from 'ace-builds/src-noconflict/worker-html?url';
import javascriptWorkerUrl from 'ace-builds/src-noconflict/worker-javascript?url';
import jsonWorkerUrl from 'ace-builds/src-noconflict/worker-json?url';
import phpWorkerUrl from 'ace-builds/src-noconflict/worker-php?url';
import {RefObject, useEffect, useRef} from 'react';
import {default as AceEditorRender, default as ReactAce} from 'react-ace';

ace.config.setModuleUrl('ace/mode/css_worker', cssWorkerUrl);
ace.config.setModuleUrl('ace/mode/html_worker', htmlWorkerUrl);
ace.config.setModuleUrl('ace/mode/json_worker', jsonWorkerUrl);
ace.config.setModuleUrl('ace/mode/php_worker', phpWorkerUrl);
ace.config.setModuleUrl('ace/mode/javascript_worker', javascriptWorkerUrl);

interface Props {
  mode: 'css' | 'html' | 'javascript' | 'php_laravel_blade' | 'json';
  onChange?: (value: string) => void;
  onIsValidChange?: (isValid: boolean) => void;
  defaultValue?: string;
  value?: string;
  beautify?: boolean;
  editorRef?: RefObject<ReactAce | null>;
  onLoad?: () => void;
  readOnly?: boolean;
  onBlur?: () => void;
  onFocus?: () => void;
}
export default function AceEditor({
  mode,
  onChange,
  onIsValidChange,
  defaultValue,
  value,
  beautify = true,
  editorRef: propsEditorRef,
  onLoad,
  readOnly,
  onBlur,
  onFocus,
}: Props) {
  const isDarkMode = useIsDarkMode();
  const defaultRef = useRef<ReactAce | null>(null);
  const editorRef = propsEditorRef || defaultRef;

  useEffect(() => {
    if (beautify && editorRef.current) {
      Beautify.beautify(editorRef.current.editor.session);
    }
  }, [beautify, editorRef]);

  return (
    <AceEditorRender
      readOnly={readOnly}
      ref={editorRef}
      width="auto"
      height="auto"
      wrapEnabled
      className="absolute inset-0"
      focus
      onBlur={onBlur}
      onFocus={onFocus}
      onLoad={onLoad}
      mode={mode}
      theme={isDarkMode ? 'tomorrow_night' : 'chrome'}
      enableBasicAutocompletion
      enableLiveAutocompletion
      defaultValue={defaultValue}
      value={value}
      onChange={onChange}
      editorProps={{$blockScrolling: true}}
      commands={Beautify.commands as any}
      onValidate={annotations => {
        const isValid =
          annotations.filter(a => a.type === 'error').length === 0;
        onIsValidChange?.(isValid);
      }}
    />
  );
}
