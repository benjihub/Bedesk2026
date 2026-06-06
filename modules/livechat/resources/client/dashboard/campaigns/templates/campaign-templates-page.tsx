import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {CampaignTemplate} from '@app/dashboard/types/campaign-template';
import {apiClient, queryClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {useNavigate} from '@common/ui/navigation/use-navigate';
import {Campaign} from '@livechat/dashboard/campaigns/campaign';
import {useMutation, useSuspenseQuery} from '@tanstack/react-query';
import {Button} from '@ui/buttons/button';
import {IconButton} from '@ui/buttons/icon-button';
import {Form} from '@ui/forms/form';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {Trans} from '@ui/i18n/trans';
import {ArrowBackIcon} from '@ui/icons/material/ArrowBack';
import {Dialog} from '@ui/overlays/dialog/dialog';
import {DialogBody} from '@ui/overlays/dialog/dialog-body';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {DialogFooter} from '@ui/overlays/dialog/dialog-footer';
import {DialogHeader} from '@ui/overlays/dialog/dialog-header';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import clsx from 'clsx';
import {ReactNode} from 'react';
import {useForm} from 'react-hook-form';
import {Link} from 'react-router';

export function Component() {
  const query = useSuspenseQuery(helpdeskQueries.campaigns.templates);
  return (
    <div className="dashboard-stable-scrollbar h-full overflow-auto">
      <div className="container mx-auto mt-40 px-24 pb-24">
        <div className="items-center justify-between gap-24 md:flex">
          <div>
            <div className="flex items-center gap-24">
              <IconButton elementType={Link} to=".." relative="path">
                <ArrowBackIcon />
              </IconButton>
              <h1 className="text-3xl font-medium">
                <Trans message="Choose a template for your campaign" />
              </h1>
            </div>
            <h2 className="mt-2 text-muted max-md:my-20">
              <Trans message="All templates are 100% customizable so choose one then make it your own." />
            </h2>
          </div>
          <DialogTrigger type="modal">
            <Button variant="flat" color="primary">
              <Trans message="Start with blank template" />
            </Button>
            <CreateCampaignDialog />
          </DialogTrigger>
        </div>
        <div className="mt-20 grid grid-cols-1 gap-24 md:mt-40 md:grid-cols-3">
          {query.data.templates.map(template => (
            <DialogTrigger key={template.name} type="modal">
              <button>
                <TemplateCard name={template.name} label={template.label} />
              </button>
              <CreateCampaignDialog template={template} />
            </DialogTrigger>
          ))}
        </div>
      </div>
    </div>
  );
}

interface TemplateCardProps {
  name: string;
  label: string;
}
function TemplateCard({name, label}: TemplateCardProps) {
  const imageName = `${name.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
  return (
    <TemplateCardLayout
      image={<img src={`images/campaigns/templates/${imageName}.png`} alt="" />}
      label={<Trans message={label} />}
    />
  );
}

interface TemplateCardLayoutProps {
  image: ReactNode;
  label: ReactNode;
  className?: string;
}
function TemplateCardLayout({
  image,
  label,
  className,
}: TemplateCardLayoutProps) {
  return (
    <div
      className={clsx(
        'flex cursor-pointer flex-col rounded border transition-shadow hover:shadow-lg',
        className,
      )}
    >
      <div className="flex h-[374px] flex-auto justify-center bg-gradient-to-t from-primary/10 p-30">
        <div className="self-center shadow-md">{image}</div>
      </div>
      <div className="flex h-50 flex-shrink-0 items-center justify-center border-t px-12">
        <h2 className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold">
          {label}
        </h2>
      </div>
    </div>
  );
}

interface CreateCampaignDialogProps {
  template?: CampaignTemplate;
}
export function CreateCampaignDialog({template}: CreateCampaignDialogProps) {
  const navigate = useNavigate();
  const {formId, close} = useDialogContext();
  const form = useForm<{name: string}>({
    defaultValues: {
      name: template?.name ?? '',
    },
  });

  const createCampaign = useMutation({
    mutationFn: (payload: Partial<Campaign>) =>
      apiClient
        .post('lc/campaigns', {
          conditions: [],
          content: [],
          width: 240,
          height: 156,
          ...template,
          ...payload,
        })
        .then(r => r.data),
    onSuccess: response => {
      queryClient.invalidateQueries({
        queryKey: helpdeskQueries.campaigns.invalidateKey,
      });
      close();
      navigate(`../${response.campaign.id}/edit`, {relative: 'path'});
    },
    onError: r => showHttpErrorToast(r),
  });

  return (
    <Dialog>
      <DialogHeader>
        <Trans message="Create campaign" />
      </DialogHeader>
      <DialogBody>
        <Form
          id={formId}
          form={form}
          onSubmit={values => createCampaign.mutate(values)}
        >
          <FormTextField
            required
            name="name"
            autoFocus
            label={<Trans message="Name" />}
          />
        </Form>
      </DialogBody>
      <DialogFooter>
        <Button type="button" onClick={() => close()}>
          <Trans message="Cancel" />
        </Button>
        <Button
          type="submit"
          disabled={createCampaign.isPending}
          variant="flat"
          color="primary"
          form={formId}
        >
          <Trans message="Create" />
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
