import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {useNavigate} from '@common/ui/navigation/use-navigate';
import {useRequiredParams} from '@common/ui/navigation/use-required-params';
import {CampaignEditor} from '@livechat/dashboard/campaigns/campaign-editor/campaign-editor';
import {
  CampaignEditorPreviewSizer,
  CampaignEditorPreviewSizerCallback,
} from '@livechat/dashboard/campaigns/campaign-editor/campaign-editor-preview-sizer';
import {
  CampaignEditorStoreProvider,
  useCampaignEditorStore,
} from '@livechat/dashboard/campaigns/campaign-editor/campaign-editor-store';
import {useUpdateCampaign} from '@livechat/dashboard/campaigns/use-update-campaign';
import {useSuspenseQuery} from '@tanstack/react-query';
import {Button} from '@ui/buttons/button';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {toast} from '@ui/toast/toast';
import {Fragment, useRef} from 'react';

export function Component() {
  const {campaignId} = useRequiredParams(['campaignId']);
  const query = useSuspenseQuery(helpdeskQueries.campaigns.get(campaignId));

  return (
    <CampaignEditorStoreProvider initialData={query.data.campaign}>
      <Editor />
    </CampaignEditorStoreProvider>
  );
}

function Editor() {
  const {trans} = useTrans();
  const {campaignId} = useRequiredParams(['campaignId']);
  const getPayload = useCampaignEditorStore(s => s.getPayload);
  const updateCampaign = useUpdateCampaign(campaignId);
  const navigate = useNavigate();
  const sizerRef = useRef<CampaignEditorPreviewSizerCallback>(null!);

  return (
    <Fragment>
      <CampaignEditor
        saveButton={
          <Button
            variant="flat"
            color="primary"
            disabled={updateCampaign.isPending}
            onClick={() => {
              sizerRef.current(node => {
                const {width, height} = node.getBoundingClientRect();
                updateCampaign.mutate(
                  {
                    ...getPayload(),
                    width,
                    height,
                  },
                  {
                    onSuccess: () => {
                      toast(trans(message('Campaign updated')));
                      navigate(`../..`, {relative: 'path'});
                    },
                  },
                );
              });
            }}
          >
            <Trans message="Save" />
          </Button>
        }
      />
      <CampaignEditorPreviewSizer ref={sizerRef} />
    </Fragment>
  );
}
