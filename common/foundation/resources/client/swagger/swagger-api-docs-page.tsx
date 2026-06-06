import {Settings} from '@ui/settings/settings';
import {useSettings} from '@ui/settings/use-settings';
import {useEffect} from 'react';
import {SwaggerUIBundle} from 'swagger-ui-dist';
import 'swagger-ui-dist/swagger-ui.css';
import {Footer} from '../ui/footer/footer';
import {Navbar} from '../ui/navigation/navbar/navbar';

export function Component() {
  const settings = useSettings();

  useEffect(() => {
    SwaggerUIBundle({
      dom_id: '#swagger-container',
      url: `${settings.base_url}/swagger.yaml`,
      plugins: getPluginsConfig(settings),
      onComplete: () => {
        //scroll to Tickets/incomingEmail
        const hash = location.hash.slice(1);
        if (hash) {
          const el = document.querySelector(
            `#operations-${hash.replace(/\//g, '-')}`,
          );
          if (el) {
            el.scrollIntoView();
            el.querySelector('button')?.click();
          }
        }
      },
    });
  }, [settings]);

  return (
    <div className="h-full overflow-y-auto bg-alt">
      <Navbar color="bg" size="sm" />
      <div className="container mx-auto">
        <div id="swagger-container"></div>
        <Footer className="px-20" />
      </div>
    </div>
  );
}

function getPluginsConfig(settings: Settings) {
  return [
    {
      statePlugins: {
        spec: {
          wrapActions: {
            updateSpec: (oriAction: any) => {
              return (spec: any) => {
                // Replace site name
                spec = spec.replaceAll(
                  'SITE_NAME',
                  settings.branding.site_name.replace(':', ''),
                );
                // Replace site url
                spec = spec.replaceAll('SITE_URL', settings.base_url);
                return oriAction(spec);
              };
            },
            // Add current server url to docs
            updateJsonSpec: (oriAction: any) => {
              return (spec: any) => {
                spec.servers = [{url: `${settings.base_url}/api/v1`}];
                return oriAction(spec);
              };
            },
          },
        },
      },
    },
  ];
}
