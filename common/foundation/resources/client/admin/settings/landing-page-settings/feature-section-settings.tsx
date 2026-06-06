import {LandingPageImageSelector} from '@common/admin/settings/landing-page-settings/landing-page-image-selector';
import {SettingsSectionButton} from '@common/admin/settings/layout/settings-section-button';
import {IconPickerDialog} from '@common/ui/icon-picker/icon-picker-dialog';
import {FeatureWithScreenshotConfig} from '@common/ui/landing-page/features/feature-with-screenshot';
import {Button} from '@ui/buttons/button';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {Item} from '@ui/forms/listbox/item';
import {FormSelect} from '@ui/forms/select/select';
import {FormSwitch} from '@ui/forms/toggle/switch';
import {Trans} from '@ui/i18n/trans';
import {createSvgIconFromTree, IconTree} from '@ui/icons/create-svg-icon';
import {AddIcon} from '@ui/icons/material/Add';
import {ArrowRightIcon} from '@ui/icons/material/ArrowRight';
import {DragHandleIcon} from '@ui/icons/material/DragHandle';
import {EditIcon} from '@ui/icons/material/Edit';
import {
  useSortable,
  UseSortableProps,
} from '@ui/interactions/dnd/sortable/use-sortable';
import {Dialog} from '@ui/overlays/dialog/dialog';
import {DialogBody} from '@ui/overlays/dialog/dialog-body';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {DialogFooter} from '@ui/overlays/dialog/dialog-footer';
import {DialogHeader} from '@ui/overlays/dialog/dialog-header';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {ReactNode, useRef, useState} from 'react';
import {
  useFieldArray,
  UseFieldArrayReturn,
  useFormContext,
  useWatch,
} from 'react-hook-form';
import {Fragment} from 'react/jsx-runtime';

type Props = {
  index: number;
};
export function FeatureSectionSettings({index}: Props) {
  const prefix = `client.landingPage.sections.${index}`;
  return (
    <Fragment>
      <FormTextField
        label={<Trans message="Title" />}
        className="mb-20"
        name={`${prefix}.title`}
      />
      <FormTextField
        label={<Trans message="Subtitle" />}
        className="mb-20"
        rows={4}
        name={`${prefix}.subtitle`}
      />
      <FormTextField
        label={<Trans message="Description" />}
        className="mb-20"
        inputElementType="textarea"
        rows={4}
        name={`${prefix}.description`}
      />
      <Divider />
      <FeatureListEditor prefix={prefix} />
      <Divider />
      <LandingPageImageSelector
        formPrefix={prefix}
        className="mb-20"
        label={<Trans message="Screenshot" />}
      />
      <FormSelect
        name={`${prefix}.imageSize`}
        className="mb-20"
        label={<Trans message="Image size" />}
      >
        <Item value="xs">
          <Trans message="Extra small" />
        </Item>
        <Item value="sm">
          <Trans message="Small" />
        </Item>
        <Item value="md">
          <Trans message="Medium" />
        </Item>
        <Item value="lg">
          <Trans message="Large" />
        </Item>
      </FormSelect>
      <FormSwitch name={`${prefix}.alignLeft`} className="mb-12">
        <Trans message="Align image left" />
      </FormSwitch>
      <FormSwitch name={`${prefix}.inPanel`} className="mb-12">
        <Trans message="Wrap section with panel" />
      </FormSwitch>
      <FormSwitch name={`${prefix}.imagePanel`} className="mb-12">
        <Trans message="Wrap image with panel" />
      </FormSwitch>
      <FormSwitch name={`${prefix}.forceDarkMode`}>
        <Trans message="Always use dark mode" />
      </FormSwitch>
    </Fragment>
  );
}

type FeatureListEditorProps = {
  prefix: string;
};
export function FeatureListEditor({prefix}: FeatureListEditorProps) {
  const {fields, remove, append, move} = useFieldArray({
    name: `${prefix}.features`,
  }) as unknown as UseFieldArrayReturn<FeatureWithScreenshotConfig, 'features'>;
  const [activeFeatureIndex, setActiveFeatureIndex] = useState<number | null>(
    null,
  );
  return (
    <div>
      <div className="mb-10 text-sm font-semibold">
        <Trans message="Feature list" />
      </div>
      {fields.map((feature, index) => (
        <FeatureListItem
          key={feature.id}
          feature={feature}
          features={fields}
          onSortEnd={(oldIndex, newIndex) => move(oldIndex, newIndex)}
          onSelected={() => setActiveFeatureIndex(index)}
          index={index}
          prefix={prefix}
        />
      ))}
      <DialogTrigger
        type="drawer"
        isOpen={activeFeatureIndex !== null}
        onClose={() => setActiveFeatureIndex(null)}
      >
        <EditFeatureDialog
          formPathPrefix={`${prefix}.features.${activeFeatureIndex}`}
          title={fields[activeFeatureIndex!]?.title}
          onDelete={() => {
            if (activeFeatureIndex !== null) {
              remove(activeFeatureIndex);
              setActiveFeatureIndex(null);
            }
          }}
        />
      </DialogTrigger>
      <Button
        variant="outline"
        color="primary"
        size="xs"
        startIcon={<AddIcon />}
        onClick={() => {
          const oldLastIndex = fields.length - 1;
          append({
            title: `Feature ${fields.length + 1}`,
            description: `Feature ${fields.length + 1} description`,
          });
          setActiveFeatureIndex(oldLastIndex + 1);
        }}
      >
        <Trans message="Add new feature" />
      </Button>
      <FormSwitch name={`${prefix}.wrapIconsInBg`} className="mt-12">
        <Trans message="Wrap icons in background" />
      </FormSwitch>
    </div>
  );
}

type FeatureListItemProps = {
  feature: {id: string};
  features: {id: string}[];
  onSortEnd: UseSortableProps['onSortEnd'];
  onSelected: () => void;
  index: number;
  prefix: string;
};
function FeatureListItem({
  feature,
  features,
  onSortEnd,
  onSelected,
  index,
  prefix,
}: FeatureListItemProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const {sortableProps, dragHandleRef} = useSortable({
    item: feature.id,
    items: features.map(f => f.id),
    ref,
    type: 'featureList',
    onSortEnd,
    strategy: 'liveSort',
  });

  return (
    <SettingsSectionButton
      {...sortableProps}
      ref={ref}
      className="mb-10"
      endIcon={<ArrowRightIcon className="text-muted" />}
      startIcon={<DragHandleIcon size="sm" ref={dragHandleRef} />}
      onClick={() => onSelected()}
    >
      <FeatureName index={index} formPathPrefix={`${prefix}.features`} />
    </SettingsSectionButton>
  );
}

type EditFeatureDialogProps = {
  formPathPrefix: string;
  title: ReactNode;
  onDelete: () => void;
};
function EditFeatureDialog({
  formPathPrefix,
  title,
  onDelete,
}: EditFeatureDialogProps) {
  const {close} = useDialogContext();
  return (
    <Dialog>
      <DialogHeader
        rightAdornment={
          <Button variant="outline" size="xs" onClick={close}>
            <Trans message="Save & close" />
          </Button>
        }
      >
        {title || <Trans message="Edit feature" />}
      </DialogHeader>
      <DialogBody>
        <IconDialogTrigger formPrefix={formPathPrefix} />
        <FormTextField
          name={`${formPathPrefix}.title`}
          label={<Trans message="Title" />}
          className="mb-20"
        />
        <FormTextField
          name={`${formPathPrefix}.description`}
          label={<Trans message="Description" />}
          inputElementType="textarea"
          rows={4}
        />
      </DialogBody>
      <DialogFooter>
        <Button
          variant="outline"
          color="danger"
          size="xs"
          onClick={() => onDelete()}
        >
          <Trans message="Delete feature" />
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

type FeatureNameProps = {
  index: number;
  formPathPrefix: string;
};
function FeatureName({index, formPathPrefix}: FeatureNameProps) {
  const title = useWatch({
    name: `${formPathPrefix}.${index}.title`,
  });
  return (
    title || <Trans message="Feature :number" values={{number: index + 1}} />
  );
}

type IconDialogTriggerProps = {
  formPrefix: string;
};
function IconDialogTrigger({formPrefix}: IconDialogTriggerProps) {
  const {setValue} = useFormContext();
  const fieldName = `${formPrefix}.icon`;
  const watchedItemIcon = useWatch({
    name: fieldName,
  });
  const Icon = watchedItemIcon && createSvgIconFromTree(watchedItemIcon);
  return (
    <DialogTrigger
      type="modal"
      onClose={(iconTree?: IconTree[] | null) => {
        // null will be set explicitly if icon is cleared via icon picker
        if (iconTree || iconTree === null) {
          setValue(fieldName, iconTree, {
            shouldDirty: true,
          });
        }
      }}
    >
      <Button
        className="mb-20"
        variant="outline"
        startIcon={Icon ? <Icon /> : <EditIcon />}
      >
        <Trans message="Select icon" />
      </Button>
      <IconPickerDialog />
    </DialogTrigger>
  );
}

function Divider() {
  return <div className="my-20 h-1 bg-divider" />;
}
