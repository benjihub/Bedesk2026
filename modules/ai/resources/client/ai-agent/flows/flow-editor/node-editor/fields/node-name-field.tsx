import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';

interface Props {
  className?: string;
}
export function NodeNameField({className}: Props) {
  const {trans} = useTrans();
  return (
    <FormTextField
      name="name"
      label={<Trans message="Step name" />}
      descriptionPosition="top"
      className={className}
      placeholder={trans({message: 'Optional'})}
    />
  );
}
