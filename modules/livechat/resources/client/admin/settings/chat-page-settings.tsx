import { Button } from '@ui/buttons/button';
import { FormTextField } from '@ui/forms/input-field/text-field/text-field';
import { Trans } from '@ui/i18n/trans';
import { useSettings } from '@ui/settings/use-settings';
import useClipboard from '@ui/utils/hooks/use-clipboard';
;

export function ChatPageSettings() {
  const {base_url} = useSettings();
  const [isCopied, copyToClipboard] = useClipboard(`${base_url}/livechat`, {
    successDuration: 1000,
  });

  return (
    <div>
      <div className="text-sm">
        <Trans message="Share a link to direct chat page without needing to install chat widget on your website." />
      </div>
      <Button
        className="mb-24 mt-6"
        variant="outline"
        color="primary"
        size="xs"
        onClick={() => copyToClipboard()}
      >
        {isCopied ? (
          <Trans message="Link copied!" />
        ) : (
          <Trans message="Copy chat link" />
        )}
      </Button>
      <FormTextField
        name="client.chatPage.title"
        label={<Trans message="Title" />}
        className="mb-16"
      />
      <FormTextField
        name="client.chatPage.subtitle"
        label={<Trans message="Subtitle" />}
        className="mb-16"
        inputElementType="textarea"
        rows={2}
      />
    </div>
  );
}
