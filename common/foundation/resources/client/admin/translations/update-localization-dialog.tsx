import {Button} from '@ui/buttons/button';
import {Form} from '@ui/forms/form';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {FormSelect, Option} from '@ui/forms/select/select';
import {Localization} from '@ui/i18n/localization';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {Dialog} from '@ui/overlays/dialog/dialog';
import {DialogBody} from '@ui/overlays/dialog/dialog-body';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {DialogFooter} from '@ui/overlays/dialog/dialog-footer';
import {DialogHeader} from '@ui/overlays/dialog/dialog-header';
import {getLanguageList} from '@ui/utils/intl/languages';
import {useForm} from 'react-hook-form';
import {useUpdateLocalization} from './update-localization';

interface UpdateLocalizationDialogProps {
  localization: Localization;
}
export function UpdateLocalizationDialog({
  localization,
}: UpdateLocalizationDialogProps) {
  const {trans} = useTrans();
  const {formId, close} = useDialogContext();
  const form = useForm<Partial<Localization>>({
    defaultValues: {
      id: localization.id,
      name: localization.name,
      language: localization.language,
    },
  });

  const languages = getLanguageList();
  const updateLocalization = useUpdateLocalization(form);

  return (
    <Dialog>
      <DialogHeader>
        <Trans message="Update localization" />
      </DialogHeader>
      <DialogBody>
        <Form
          form={form}
          id={formId}
          onSubmit={values => {
            updateLocalization.mutate(values, {onSuccess: close});
          }}
        >
          <FormTextField
            name="name"
            label={<Trans message="Name" />}
            className="mb-30"
            required
          />
          <FormSelect
            required
            name="language"
            label={<Trans message="Language" />}
            selectionMode="single"
            showSearchField
            searchPlaceholder={trans(message('Search languages'))}
          >
            {languages.map(language => (
              <Option value={language.code} key={language.code}>
                {language.name}
              </Option>
            ))}
          </FormSelect>
        </Form>
      </DialogBody>
      <DialogFooter>
        <Button onClick={close}>
          <Trans message="Cancel" />
        </Button>
        <Button
          variant="flat"
          color="primary"
          type="submit"
          form={formId}
          disabled={updateLocalization.isPending}
        >
          <Trans message="Save" />
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
