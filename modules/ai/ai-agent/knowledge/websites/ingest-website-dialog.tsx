import {aiAgentQueries} from '@ai/ai-agent/ai-agent-queries';
import {apiClient, queryClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {useMutation} from '@tanstack/react-query';
import {AccordionAnimation} from '@ui/accordion/accordtion-animation';
import {Button} from '@ui/buttons/button';
import {ButtonBase} from '@ui/buttons/button-base';
import {Form} from '@ui/forms/form';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {FormRadio} from '@ui/forms/radio-group/radio';
import {FormRadioGroup} from '@ui/forms/radio-group/radio-group';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {KeyboardArrowDownIcon} from '@ui/icons/material/KeyboardArrowDown';
import {KeyboardArrowRightIcon} from '@ui/icons/material/KeyboardArrowRight';
import {Dialog} from '@ui/overlays/dialog/dialog';
import {DialogBody} from '@ui/overlays/dialog/dialog-body';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {DialogFooter} from '@ui/overlays/dialog/dialog-footer';
import {DialogHeader} from '@ui/overlays/dialog/dialog-header';
import {toast} from '@ui/toast/toast';
import {AnimatePresence, m} from 'framer-motion';
import {useState} from 'react';
import {useForm} from 'react-hook-form';

export function IngestWebsiteDialog() {
  const {formId, close} = useDialogContext();
  const ingestWebsite = useIngestWebsite();
  const [advancedIsOpen, setAdvancedIsOpen] = useState(false);

  const form = useForm<IngestWebsitePayload>({
    defaultValues: {
      scanType: 'nested',
      scrapeConfig: {
        contentCssSelector: '',
      },
    },
  });

  return (
    <Dialog size="lg">
      <DialogHeader showDivider>
        <Trans message="Add website" />
      </DialogHeader>
      <DialogBody>
        <Form
          form={form}
          id={formId}
          onSubmit={data => {
            ingestWebsite.mutate(data, {
              onSuccess: () => {
                toast(message('Website queued for ingestion'));
                close();
              },
            });
          }}
        >
          <FormTextField
            name="url"
            autoFocus
            label={
              <Trans message="Enter the URL of the site you want to sync" />
            }
            placeholder="https://myhelpcenter.com"
            type="url"
            description={
              <Trans message="Only publicly accessible URLs are supported." />
            }
          />
          <FormRadioGroup
            name="scanType"
            size="sm"
            orientation="vertical"
            className="mt-24"
          >
            <FormRadio value="nested">
              <Trans message="Scan only child pages of specified url." />
            </FormRadio>
            <FormRadio value="full">
              <Trans message="Scan all pages of specified domain." />
            </FormRadio>
            <FormRadio value="single">
              <Trans message="Scan only specified url" />
            </FormRadio>
          </FormRadioGroup>
          <ButtonBase
            onClick={() => setAdvancedIsOpen(!advancedIsOpen)}
            className="mt-16 gap-4 font-semibold"
          >
            <Trans message="Advanced options" />
            {!advancedIsOpen ? (
              <KeyboardArrowRightIcon size="sm" />
            ) : (
              <KeyboardArrowDownIcon size="sm" />
            )}
          </ButtonBase>
          <AnimatePresence initial={false}>
            <AdvancedOptionsPanel isExpanded={advancedIsOpen} />
          </AnimatePresence>
        </Form>
      </DialogBody>
      <DialogFooter dividerTop>
        <Button onClick={() => close()}>
          <Trans message="Cancel" />
        </Button>
        <Button
          type="submit"
          form={formId}
          variant="flat"
          color="primary"
          disabled={ingestWebsite.isPending}
        >
          <Trans message="Sync" />
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

interface AdvancedOptionsPanelProps {
  isExpanded: boolean;
}
function AdvancedOptionsPanel({isExpanded}: AdvancedOptionsPanelProps) {
  return (
    <m.div
      className="pt-16"
      variants={AccordionAnimation.variants}
      transition={{type: 'tween', duration: 0.1}}
      initial={false}
      animate={isExpanded ? 'open' : 'closed'}
    >
      <FormTextField
        name="scrapeConfig.contentCssSelector"
        label={<Trans message="Content CSS selector" />}
        placeholder=".main-content"
        size="sm"
        className="mb-16"
        description={
          <Trans message="When specified, only content inside this selector will be extracted. Leave empty to extract content from the entire page. Must be a valid CSS selector as accepted by the document.querySelectorAll() function." />
        }
      />
      <FormTextField
        name="scrapeConfig.cssSelectorsToExclude"
        label={<Trans message="CSS selectors to exclude" />}
        placeholder="footer, navbar, .sidebar"
        size="sm"
        description={
          <Trans message="Add a list of CSS selectors you want to ignore when scraping content. We already exclude some elements like navigation, scripts, footer, inline images etc. " />
        }
      />
    </m.div>
  );
}

interface IngestWebsitePayload {
  url: string;
  scanType: string;
  scrapeConfig: {
    contentCssSelector: string;
  };
}
function useIngestWebsite() {
  return useMutation({
    mutationFn: (payload: IngestWebsitePayload) => {
      return apiClient
        .post('lc/ai-agent/ingest/website', payload)
        .then(res => res.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: aiAgentQueries.knowledge.invalidateKey,
      });
    },
    onError: err => showHttpErrorToast(err),
  });
}
