import {WidgetScreenHeader} from '@livechat/widget/widget-screen-header';
import {Button} from '@ui/buttons/button';
import {Trans} from '@ui/i18n/trans';
import {ArrowBackIcon} from '@ui/icons/material/ArrowBack';
import {Link, Navigate, useLocation} from 'react-router';

export function EmbedScreen() {
  const {state} = useLocation();

  if (!state.embedUrl) {
    return <Navigate to="/" />;
  }

  return (
    <div className="relative flex min-h-0 flex-auto flex-col">
      <WidgetScreenHeader
        start={
          <Button
            elementType={Link}
            to={state?.prevPath ?? '/'}
            startIcon={<ArrowBackIcon />}
          >
            <Trans message="Back" />
          </Button>
        }
      />
      <div className="m-8 flex grow overflow-hidden rounded-panel">
        <div className="grow overflow-auto">
          <iframe
            src={state.embedUrl}
            className="h-full w-full border-none bg-none p-0"
            sandbox="allow-forms allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts allow-storage-access-by-user-activation"
          />
        </div>
      </div>
      <div className="mb-8 text-center text-xs text-muted">
        {getDomain(state.embedUrl)}
      </div>
    </div>
  );
}

function getDomain(url: string) {
  return new URL(url).hostname;
}
