import {UploadType} from '@app/site-config';
import {BackgroundSelectorConfig} from '@common/background-selector/background-selector-config';
import {BgSelectorTabProps} from '@common/background-selector/bg-selector-tab-props';
import {ColorBackgroundTab} from '@common/background-selector/color-background-tab';
import {GradientBackgroundTab} from '@common/background-selector/gradient-background-tab';
import {ImageBackgroundTab} from '@common/background-selector/image-background-tab/image-background-tab';
import {Trans} from '@ui/i18n/trans';
import {FormatColorFillIcon} from '@ui/icons/material/FormatColorFill';
import {GradientIcon} from '@ui/icons/material/Gradient';
import {ImageIcon} from '@ui/icons/material/Image';
import clsx from 'clsx';
import {ReactElement, ReactNode, useState} from 'react';

const TabMap: Record<
  'color' | 'gradient' | 'image',
  (value: BgSelectorTabProps<any>) => ReactElement
> = {
  color: ColorBackgroundTab,
  gradient: GradientBackgroundTab,
  image: ImageBackgroundTab,
};
type TabName = keyof typeof TabMap;

interface BackgroundSelectorProps {
  className?: string;
  value: BackgroundSelectorConfig | undefined;
  onChange: (newValue: BackgroundSelectorConfig) => void;
  tabColWidth?: string;
  centerTabs?: boolean;
  underTabs?: ReactNode;
  isInsideDialog?: boolean;
  positionSelector?: 'simple' | 'advanced';
  uploadType: keyof typeof UploadType;
}
export function BackgroundSelector({
  className,
  value,
  onChange,
  tabColWidth,
  isInsideDialog,
  positionSelector = 'simple',
  centerTabs,
  underTabs,
  uploadType,
}: BackgroundSelectorProps) {
  const [activeTab, setActiveTab] = useState<TabName>(() => {
    if (value?.type === 'image') return 'image';
    if (value?.type === 'gradient') return 'gradient';
    return 'color';
  });

  const Tab = TabMap[activeTab];

  return (
    <div className={className}>
      <TypeSelector
        activeTab={activeTab}
        onTabChange={setActiveTab}
        center={centerTabs}
      />
      {underTabs}
      <Tab
        value={value}
        onChange={onChange}
        isInsideDialog={isInsideDialog}
        positionSelector={positionSelector}
        uploadType={uploadType}
        className={clsx(
          'grid items-start gap-14',
          tabColWidth || 'grid-cols-[repeat(auto-fill,minmax(90px,1fr))]',
        )}
      />
    </div>
  );
}

interface TypeSelectorProps {
  activeTab: TabName;
  onTabChange: (tab: TabName) => void;
  center?: boolean;
}
function TypeSelector({activeTab, onTabChange, center}: TypeSelectorProps) {
  return (
    <div
      className={clsx(
        'mb-20 flex items-center gap-20 border-b pb-20',
        center && 'justify-center',
      )}
    >
      <TypeButton
        isActive={activeTab === 'color'}
        icon={<FormatColorFillIcon />}
        title={<Trans message="Flat color" />}
        onClick={() => onTabChange('color')}
      />
      <TypeButton
        isActive={activeTab === 'gradient'}
        icon={<GradientIcon />}
        title={<Trans message="Gradient" />}
        onClick={() => onTabChange('gradient')}
      />
      <TypeButton
        isActive={activeTab === 'image'}
        icon={<ImageIcon />}
        title={<Trans message="Image" />}
        onClick={() => onTabChange('image')}
      />
    </div>
  );
}

interface TypeButtonProps {
  isActive: boolean;
  icon: ReactNode;
  title: ReactNode;
  onClick?: () => void;
}
function TypeButton({isActive, icon, title, onClick}: TypeButtonProps) {
  return (
    <div role="button" className="block" onClick={onClick}>
      <div
        className={clsx(
          'mx-auto mb-8 flex h-50 w-50 items-center justify-center rounded-panel border text-muted',
          isActive && 'border-primary ring',
        )}
      >
        {icon}
      </div>
      <div className="text-center text-sm text-primary">{title}</div>
    </div>
  );
}
