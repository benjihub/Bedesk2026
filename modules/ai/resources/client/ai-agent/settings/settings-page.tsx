import {PreviewSidebar} from '@ai/ai-agent/preview/preview-sidebar';
import {CantAssistPanel} from '@ai/ai-agent/settings/cant-assist-panel';
import {GreetingPanel} from '@ai/ai-agent/settings/greeting-panel';
import {IdentityPanel} from '@ai/ai-agent/settings/identity-panel';
import {PersonalityPanel} from '@ai/ai-agent/settings/personality-panel';
import {TransferPanel} from '@ai/ai-agent/settings/transfer-panel';
import {useAuth} from '@common/auth/use-auth';
import {Accordion} from '@common/ui/library/accordion/accordion';
import {Button} from '@common/ui/library/buttons/button';
import {Trans} from '@common/ui/library/i18n/trans';
import {ArrowForwardIcon} from '@common/ui/library/icons/material/ArrowForward';
import {useState} from 'react';
import {Link} from 'react-router';
import {Fragment} from 'react/jsx-runtime';
import {AiAgentPageHeader} from '../ai-agent-page-header';

export function Component() {
  const [previewVisible, setPreviewVisible] = useState(false);
  const {getPermission} = useAuth();
  const isOwner = getPermission('admin') || getPermission('superAdmin');
  return (
    <Fragment>
      <div className="dashboard-grid-content dashboard-rounded-panel flex h-full flex-col">
        <AiAgentPageHeader
          previewVisible={previewVisible}
          onTogglePreview={() => setPreviewVisible(!previewVisible)}
        />
        <div className="flex-auto overflow-y-auto p-24">
          <div>
            <Accordion variant="outline" gap="space-y-24">
              <IdentityPanel />
              <PersonalityPanel />
              <GreetingPanel />
              <CantAssistPanel />
              <TransferPanel />
            </Accordion>
            {isOwner && (
              <div className="mt-24 pl-8">
                <Button
                  elementType={Link}
                  to="/admin/settings/ai"
                  variant="link"
                  color="primary"
                  startIcon={<ArrowForwardIcon />}
                >
                  <Trans message="Additional AI settings" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      {previewVisible && (
        <PreviewSidebar onClose={() => setPreviewVisible(false)} />
      )}
    </Fragment>
  );
}
