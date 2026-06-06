import {AdminSettings} from '@common/admin/settings/admin-settings';
import {CtaSectionSettings} from '@common/admin/settings/landing-page-settings/cta-section-settings';
import {FeatureSectionSettings} from '@common/admin/settings/landing-page-settings/feature-section-settings';
import {FeaturesGridSettings} from '@common/admin/settings/landing-page-settings/features-grid-settings';
import {FooterSectionSettings} from '@common/admin/settings/landing-page-settings/footer-section-settings';
import {HeroSectionSettings} from '@common/admin/settings/landing-page-settings/hero-section-settings';
import {PricingSectionSettings} from '@common/admin/settings/landing-page-settings/pricing-section-settings';
import {SettingsWithPreview} from '@common/admin/settings/layout/settings-with-preview';
import {useAdminSettings} from '@common/admin/settings/requests/use-admin-settings';
import {SectionConfig} from '@common/ui/landing-page/landing-page-config';
import {sectionLabels} from '@common/ui/landing-page/section-labels';
import {Accordion, AccordionItem} from '@ui/accordion/accordion';
import {Button} from '@ui/buttons/button';
import {Item} from '@ui/forms/listbox/item';
import {Trans} from '@ui/i18n/trans';
import {AddIcon} from '@ui/icons/material/Add';
import {DragHandleIcon} from '@ui/icons/material/DragHandle';
import {useSortable} from '@ui/interactions/dnd/sortable/use-sortable';
import {Menu, MenuTrigger} from '@ui/menu/menu-trigger';
import {useRef, useState} from 'react';
import {useFieldArray, useForm} from 'react-hook-form';

export function Component() {
  const {data} = useAdminSettings();
  const s = data.client;
  const form = useForm<AdminSettings>({
    defaultValues: {
      client: {
        landingPage: s.landingPage,
      },
    },
  });

  return (
    <SettingsWithPreview
      title={<Trans message="Landing page" />}
      defaultRoute="/"
    >
      <SettingsWithPreview.Content>
        <SettingsWithPreview.Form form={form}>
          <Sections />
        </SettingsWithPreview.Form>
      </SettingsWithPreview.Content>
      <SettingsWithPreview.Preview />
    </SettingsWithPreview>
  );
}

function Sections() {
  const {fields, remove, append, move} = useFieldArray<
    AdminSettings,
    'client.landingPage.sections'
  >({
    name: 'client.landingPage.sections',
  });
  const [expandedSections, setExpandedSections] = useState<(string | number)[]>(
    [],
  );
  return (
    <div>
      <MenuTrigger onItemSelected={(name: any) => append({name})}>
        <Button
          variant="outline"
          color="primary"
          startIcon={<AddIcon />}
          size="xs"
          className="mb-20"
        >
          <Trans message="Add section" />
        </Button>
        <Menu>
          {Object.entries(sectionLabels).map(([name, label]) => (
            <Item key={name} value={name}>
              <Trans {...label} />
            </Item>
          ))}
        </Menu>
      </MenuTrigger>
      <Accordion
        variant="outline"
        size="lg"
        expandedValues={expandedSections}
        onExpandedChange={setExpandedSections}
      >
        {fields.map((field, index) => (
          <SectionWrapper
            key={field.id}
            id={field.id}
            ids={fields.map(f => f.id)}
            name={field.name}
            index={index}
            onSortStart={() => setExpandedSections([])}
            onSortEnd={(oldIndex, newIndex) => {
              move(oldIndex, newIndex);
            }}
            onRemove={() => {
              setExpandedSections([]);
              remove(index);
            }}
          />
        ))}
      </Accordion>
    </div>
  );
}

type SectionWrapperProps = {
  id: string;
  ids: string[];
  name: SectionConfig['name'];
  index: number;
  onSortEnd: (oldIndex: number, newIndex: number) => void;
  onSortStart: () => void;
  onRemove: () => void;
};
function SectionWrapper({
  id,
  ids,
  name,
  index,
  onSortEnd,
  onSortStart,
  onRemove,
  ...accordionProps
}: SectionWrapperProps) {
  const ref = useRef<HTMLDivElement>(null);
  const {sortableProps, dragHandleRef} = useSortable({
    item: id,
    items: ids,
    type: 'sectionsSortable',
    ref,
    onSortEnd,
    onSortStart,
    strategy: 'liveSort',
  });
  return (
    <div ref={ref} {...sortableProps}>
      <AccordionItem
        {...accordionProps}
        startIcon={<DragHandleIcon size="sm" ref={dragHandleRef} />}
        label={<Trans {...sectionLabels[name]} />}
        footerContent={
          <div className="border-t p-8">
            <Button
              variant="text"
              color="danger"
              size="xs"
              onClick={() => onRemove()}
            >
              <Trans message="Remove section" />
            </Button>
          </div>
        }
      >
        <SectionConfigPanel name={name} index={index} />
      </AccordionItem>
    </div>
  );
}

type SectionConfigProps = {
  name: SectionConfig['name'];
  index: number;
};
function SectionConfigPanel({name, index}: SectionConfigProps) {
  switch (name) {
    case 'hero-split-with-screenshot':
    case 'hero-with-background-image':
    case 'hero-simple-centered':
      return <HeroSectionSettings index={index} />;
    case 'feature-with-screenshot':
      return <FeatureSectionSettings index={index} />;
    case 'features-grid':
      return <FeaturesGridSettings index={index} />;
    case 'cta-simple-centered':
      return <CtaSectionSettings index={index} />;
    case 'pricing':
      return <PricingSectionSettings index={index} />;
    case 'footer':
      return <FooterSectionSettings index={index} />;
    default:
      return null;
  }
}
