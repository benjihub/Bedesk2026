import {Item} from '@ui/forms/listbox/item';
import {FormSelect} from '@ui/forms/select/select';
import {Trans} from '@ui/i18n/trans';
import {ArrowDropDownCircleIcon} from '@ui/icons/material/ArrowDropDownCircle';
import {CheckBoxIcon} from '@ui/icons/material/CheckBox';
import {CheckCircleIcon} from '@ui/icons/material/CheckCircle';
import {EmailIcon} from '@ui/icons/material/Email';
import {EventIcon} from '@ui/icons/material/Event';
import {LinkIcon} from '@ui/icons/material/Link';
import {NumbersIcon} from '@ui/icons/material/Numbers';
import {PhoneIcon} from '@ui/icons/material/Phone';
import {SubjectIcon} from '@ui/icons/material/Subject';
import {TextFieldsIcon} from '@ui/icons/material/TextFields';
import {ThumbUpIcon} from '@ui/icons/material/ThumbUp';
import {ToggleOnIcon} from '@ui/icons/material/ToggleOn';

interface Props {
  disabled: boolean;
  isInternal: boolean;
}
export function FormatField({disabled, isInternal}: Props) {
  return (
    <FormSelect
      selectionMode="single"
      name="format"
      className="mb-24"
      disabled={disabled}
      label={<Trans message="Format" />}
    >
      <Item value="text" startIcon={<TextFieldsIcon size="sm" />}>
        <Trans message="Text" />
      </Item>
      <Item value="multiLineText" startIcon={<SubjectIcon size="sm" />}>
        <Trans message="Multi-line text" />
      </Item>
      <Item value="switch" startIcon={<ToggleOnIcon size="sm" />}>
        <Trans message="Toggle" />
      </Item>
      <Item value="number" startIcon={<NumbersIcon size="sm" />}>
        <Trans message="Number" />
      </Item>
      <Item value="url" startIcon={<LinkIcon size="sm" />}>
        <Trans message="URL" />
      </Item>
      <Item value="date" startIcon={<EventIcon size="sm" />}>
        <Trans message="Date" />
      </Item>
      <Item value="radioGroup" startIcon={<CheckCircleIcon size="sm" />}>
        <Trans message="Choice list" />
      </Item>
      <Item value="checkboxGroup" startIcon={<CheckBoxIcon size="sm" />}>
        <Trans message="Multiple choices" />
      </Item>
      <Item value="dropdown" startIcon={<ArrowDropDownCircleIcon size="sm" />}>
        <Trans message="Dropdown" />
      </Item>
      {isInternal && (
        <Item value="email" startIcon={<EmailIcon size="sm" />}>
          <Trans message="Email" />
        </Item>
      )}
      {isInternal && (
        <Item value="rating" startIcon={<ThumbUpIcon size="sm" />}>
          <Trans message="Rating" />
        </Item>
      )}
      <Item value="phone" startIcon={<PhoneIcon size="sm" />}>
        <Trans message="Phone" />
      </Item>
    </FormSelect>
  );
}
