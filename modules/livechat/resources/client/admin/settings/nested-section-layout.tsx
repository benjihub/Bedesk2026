import {SettingsSectionHeader} from '@common/admin/settings/layout/settings-panel';
import {useChatSettingsNav} from '@livechat/admin/settings/use-chat-settings-nav';
import {Button} from '@ui/buttons/button';
import {ArrowBackIcon} from '@ui/icons/material/ArrowBack';
import {ReactElement, ReactNode} from 'react';

interface Props {
  backLabel: ReactNode;
  children: [ReactElement, ReactElement];
}
export function NestedSectionLayout({backLabel, children}: Props) {
  const {setActiveSection} = useChatSettingsNav();
  return (
    <div>
      <Button
        variant="outline"
        onClick={() => setActiveSection(null)}
        startIcon={<ArrowBackIcon />}
        className="mb-24"
      >
        {backLabel}
      </Button>
      <SettingsSectionHeader>{children[0]}</SettingsSectionHeader>
      {children[1]}
    </div>
  );
}
