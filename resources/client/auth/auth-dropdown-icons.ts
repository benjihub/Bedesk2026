import {AccountCircleIcon} from '@ui/icons/material/AccountCircle';
import {SettingsIcon} from '@ui/icons/material/Settings';
import {SupportIcon} from '@ui/icons/material/Support';
import {SupportAgentIcon} from '@ui/icons/material/SupportAgent';
import {SvgIconProps} from '@ui/icons/svg-icon';
import {ComponentType} from 'react';

export const authDropdownIcons: Record<string, ComponentType<SvgIconProps>> = {
  '/admin/settings': SettingsIcon,
  '/dashboard/conversations': SupportAgentIcon,
  '/account-settings': AccountCircleIcon,
  '/hc/tickets': SupportIcon,
};
