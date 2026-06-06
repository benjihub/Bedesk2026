import {ReplyComposerEmojiPickerButton} from '@app/reply-composer/emoji-picker-button';
import {EnhanceTextWithAiButton} from '@app/reply-composer/enhance-text-with-ai-button';
import {ReplyComposerFooter} from '@app/reply-composer/reply-composer-footer';
import {FloatingToolbar} from '@common/text-editor/floating-toolbar';
import {CampaignTextContentItem} from '@livechat/dashboard/campaigns/campaign-editor/content-items/campaign-content-item';
import {CampaignContentItemDialog} from '@livechat/dashboard/campaigns/campaign-editor/content-items/campaign-content-item-dialog';
import {campaignTextRendererContentClassName} from '@livechat/widget/campaigns/renderers/campaign-text-renderer';
import {Trans} from '@ui/i18n/trans';
import {ProgressCircle} from '@ui/progress/progress-circle';
import {lazy, Suspense, useState} from 'react';

const ReplyComposerContainer = lazy(
  () => import('@app/reply-composer/reply-composer-container'),
);

interface Props {
  defaultValue?: CampaignTextContentItem['value'];
}
export function CampaignTextDialog({defaultValue}: Props) {
  const [value, setValue] = useState(defaultValue ?? {text: ''});
  return (
    <CampaignContentItemDialog
      defaultValue={defaultValue}
      value={value}
      size="lg"
    >
      <Trans message="Text" />
      <Suspense fallback={<Fallback />}>
        <ReplyComposerContainer
          bodyClassName={campaignTextRendererContentClassName}
          height="h-240"
          initialContent={value.text}
          onChange={newValue => setValue({...value, text: newValue})}
          submitToClosestForm
        >
          <FloatingToolbar />
          <ReplyComposerFooter>
            <ReplyComposerEmojiPickerButton />
            <EnhanceTextWithAiButton disabled={!value.text.length} />
          </ReplyComposerFooter>
        </ReplyComposerContainer>
      </Suspense>
    </CampaignContentItemDialog>
  );
}

function Fallback() {
  return (
    <div className="flex h-240 items-center justify-center">
      <ProgressCircle isIndeterminate />
    </div>
  );
}
