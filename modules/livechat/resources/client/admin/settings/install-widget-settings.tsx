import {highlightCode} from '@common/text-editor/highlight/highlight-code';
import {Trans} from '@ui/i18n/trans';
import {useSettings} from '@ui/settings/use-settings';
import {useEffect, useRef} from 'react';

export function InstallWidgetSettings() {
  return (
    <div className="prose-col prose prose-sm dark:prose-invert prose-p:text-main">
      <p>
        <Trans message="To install livechat widget on your site, copy and paste this code snippet before the </body> tag on every page you want the widget to appear." />
      </p>
      <WidgetCode />
      <p>
        <Trans message="If your helpdesk is on a different domain than the loader script, or you need to specify the domain manuallly for some other reason, you can specify it via settings:" />
      </p>
      <WidgetCode showDomainSettings />
    </div>
  );
}

type WidgetCodeProps = {
  showDomainSettings?: boolean;
};
function WidgetCode({showDomainSettings = false}: WidgetCodeProps) {
  const ref = useRef<HTMLPreElement>(null);
  const {base_url} = useSettings();

  useEffect(() => {
    if (ref.current) {
      highlightCode(ref.current, 'dark', true);
    }
  }, []);

  /* prettier-ignore */
  return (
<pre ref={ref}>
<code>
{showDomainSettings && `<script>
  window.BeChatSettings = {
    widgetDomain: "https://your-site.com",
  };
</script>
`}
{`<script src="${base_url}/livechat-loader.js"></script>`}
</code>
</pre>
  );
}
