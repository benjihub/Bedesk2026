import {IconButton} from '@ui/buttons/icon-button';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {FormatAlignCenterIcon} from '@ui/icons/material/FormatAlignCenter';
import {FormatAlignJustifyIcon} from '@ui/icons/material/FormatAlignJustify';
import {FormatAlignLeftIcon} from '@ui/icons/material/FormatAlignLeft';
import {FormatAlignRightIcon} from '@ui/icons/material/FormatAlignRight';
import {Menu, MenuItem, MenuTrigger} from '@ui/menu/menu-trigger';
import clsx from 'clsx';
import {ComponentType} from 'react';
import {useCurrentTextEditor} from '../tiptap-editor-context';
import {MenubarButtonProps} from './menubar-button-props';

const iconMap = {
  left: {
    icon: FormatAlignLeftIcon,
    label: message('Align left'),
  },
  center: {
    icon: FormatAlignCenterIcon,
    label: message('Align center'),
  },
  right: {
    icon: FormatAlignRightIcon,
    label: message('Align right'),
  },
  justify: {
    icon: FormatAlignJustifyIcon,
    label: message('Justify'),
  },
};

export function AlignButtons({size}: MenubarButtonProps) {
  const editor = useCurrentTextEditor();
  const activeKey = Object.keys(iconMap).find(key =>
    editor?.isActive({textAlign: key}),
  ) as keyof typeof iconMap | null;
  const ActiveIcon: ComponentType = activeKey
    ? iconMap[activeKey].icon
    : iconMap.left.icon;

  return (
    <MenuTrigger
      floatingWidth="auto"
      selectionMode="single"
      selectedValue={activeKey}
      onSelectionChange={key => {
        editor?.commands.focus();
        editor?.commands.setTextAlign(key as keyof typeof iconMap);
      }}
    >
      <IconButton
        size={size}
        disabled={!editor}
        color={activeKey ? 'primary' : null}
        className={clsx('flex-shrink-0')}
      >
        <ActiveIcon />
      </IconButton>
      <Menu>
        {Object.entries(iconMap).map(([name, config]) => {
          const Icon = config.icon;
          return (
            <MenuItem
              key={name}
              value={name}
              startIcon={<Icon size="md" />}
              capitalizeFirst
            >
              <Trans message={config.label.message} />
            </MenuItem>
          );
        })}
      </Menu>
    </MenuTrigger>
  );
}
