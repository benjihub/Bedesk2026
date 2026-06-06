import {CrupdateCategoryForm} from '@app/help-center/manager/crupdate-category-dialog/crupdate-category-form';
import {CreateCategoryPayload} from '@app/help-center/manager/crupdate-category-dialog/use-create-category';
import {useUpdateCategory} from '@app/help-center/manager/crupdate-category-dialog/use-update-category';
import {HcCategoryManagerItem} from '@app/help-center/manager/hc-manager-data';
import {Button} from '@ui/buttons/button';
import {Trans} from '@ui/i18n/trans';
import {Dialog} from '@ui/overlays/dialog/dialog';
import {DialogBody} from '@ui/overlays/dialog/dialog-body';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {DialogFooter} from '@ui/overlays/dialog/dialog-footer';
import {DialogHeader} from '@ui/overlays/dialog/dialog-header';
import {useForm} from 'react-hook-form';

interface Props {
  item: HcCategoryManagerItem;
}
export function UpdateCategoryDialog({item}: Props) {
  const {close, formId} = useDialogContext();
  const form = useForm<CreateCategoryPayload>({
    defaultValues: {
      name: item.name,
      parent_id: item.parent_id,
      description: item.description,
      image: item.image,
      visible_to_role: item.visible_to_role || ('' as any),
      managed_by_role: item.managed_by_role || ('' as any),
      hide_from_structure: item.hide_from_structure,
    },
  });
  const updateCategory = useUpdateCategory(form);

  return (
    <Dialog size="lg">
      <DialogHeader>
        {item.is_section ? (
          <Trans message="Update section" />
        ) : (
          <Trans message="Update category" />
        )}
      </DialogHeader>
      <DialogBody>
        <CrupdateCategoryForm
          hideParentId={item.is_section}
          formId={formId}
          form={form}
          onSubmit={values => {
            updateCategory.mutate(
              {...values, id: item.id},
              {
                onSuccess: () => close(),
              },
            );
          }}
        />
      </DialogBody>
      <DialogFooter>
        <Button
          onClick={() => {
            close();
          }}
        >
          <Trans message="Cancel" />
        </Button>
        <Button
          form={formId}
          disabled={updateCategory.isPending}
          variant="flat"
          color="primary"
          type="submit"
        >
          <Trans message="Update" />
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
