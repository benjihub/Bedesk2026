import {Trans} from '@ui/i18n/trans';
import {Fragment, useState} from 'react';
import {TextField} from '@ui/forms/input-field/text-field/text-field';
import {CampaignButtonContentItem} from '@livechat/dashboard/campaigns/campaign-editor/content-items/campaign-content-item';
import {Select} from '@ui/forms/select/select';
import {Item} from '@ui/forms/listbox/item';
import {CampaignContentItemDialog} from '@livechat/dashboard/campaigns/campaign-editor/content-items/campaign-content-item-dialog';

interface Props {
  defaultValue?: CampaignButtonContentItem['value'];
}
export function CampaignButtonDialog({defaultValue}: Props) {
  const [value, setValue] = useState(
    defaultValue ?? {
      label: '',
    },
  );
  return (
    <CampaignContentItemDialog defaultValue={defaultValue} value={value}>
      <Trans message="Button" />
      <Fragment>
        <TextField
          autoFocus
          value={value.label}
          label={<Trans message="Button label" />}
          onChange={e => setValue({...value, label: e.target.value})}
          required
          className="mb-24"
        />
        <Select
          selectionMode="single"
          label={<Trans message="Action" />}
          selectedValue={value['action'] ?? 'dismiss'}
          onItemSelected={action => setValue({...value, action: action as any})}
          className="mb-24"
        >
          <Item value="dismiss">
            <Trans message="Dismiss campaign" />
          </Item>
          <Item value="openUrl">
            <Trans message="Open a link" />
          </Item>
          <Item value="copyToClipboard">
            <Trans message="Copy text to clipboard" />
          </Item>
          <Item value="openEmbed">
            <Trans message="Show link in embedded window" />
          </Item>
          <Item value="sendMessage">
            <Trans message="Send message" />
          </Item>
        </Select>
        {value['action'] && value['action'] !== 'dismiss' && (
          <TextField
            label={<ActionValueLabel action={value['action']} />}
            value={value['actionValue'] ?? ''}
            onChange={e => setValue({...value, actionValue: e.target.value})}
            className="mb-24"
            required
          />
        )}
        <Select
          selectionMode="single"
          label={<Trans message="Size" />}
          selectedValue={value['size'] ?? 'sm'}
          onItemSelected={size => setValue({...value, size: size as any})}
          className="mb-24"
        >
          <Item value="xs">
            <Trans message="Small" />
          </Item>
          <Item value="sm">
            <Trans message="Medium" />
          </Item>
          <Item value="md">
            <Trans message="Large" />
          </Item>
        </Select>
        <Select
          selectionMode="single"
          label={<Trans message="Style" />}
          className="mb-24"
          selectedValue={value['variant'] ?? 'flat'}
          onItemSelected={variant =>
            setValue({...value, variant: variant as any})
          }
        >
          <Item value="">
            <Trans message="Basic" />
          </Item>
          <Item value="flat">
            <Trans message="Filled" />
          </Item>
          <Item value="outline">
            <Trans message="Outlined" />
          </Item>
        </Select>
        <Select
          selectionMode="single"
          label={<Trans message="Color" />}
          selectedValue={value['color'] ?? 'primary'}
          onItemSelected={color => setValue({...value, color: color as any})}
        >
          <Item value="primary">
            <Trans message="Primary" />
          </Item>
          <Item value="danger">
            <Trans message="Danger" />
          </Item>
          <Item value="positive">
            <Trans message="Sucess" />
          </Item>
          <Item value="chip">
            <Trans message="Gray" />
          </Item>
          <Item value="white">
            <Trans message="White" />
          </Item>
        </Select>
      </Fragment>
    </CampaignContentItemDialog>
  );
}

interface ActionValueLabelProps {
  action: CampaignButtonContentItem['value']['action'];
}
function ActionValueLabel({action}: ActionValueLabelProps) {
  switch (action) {
    case 'dismiss':
      return <Trans message="Action value" />;
    case 'openUrl':
      return <Trans message="URL to open" />;
    case 'copyToClipboard':
      return <Trans message="Text to copy" />;
    case 'openEmbed':
      return <Trans message="Embed URL" />;
    case 'sendMessage':
      return <Trans message="Message to send" />;
  }
}
