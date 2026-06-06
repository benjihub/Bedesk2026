import {CrupdateCategoryForm} from '@app/help-center/manager/crupdate-category-dialog/crupdate-category-form';
import {
  CreateCategoryPayload,
  useCreateCategory,
} from '@app/help-center/manager/crupdate-category-dialog/use-create-category';
import {Button} from '@ui/buttons/button';
import {Trans} from '@ui/i18n/trans';
import {Dialog} from '@ui/overlays/dialog/dialog';
import {DialogBody} from '@ui/overlays/dialog/dialog-body';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {DialogFooter} from '@ui/overlays/dialog/dialog-footer';
import {DialogHeader} from '@ui/overlays/dialog/dialog-header';
import {useForm} from 'react-hook-form';
import {useParams} from 'react-router';

export function CreateCategoryDialog() {
  const {categoryId} = useParams();
  const {close, formId} = useDialogContext();
  const form = useForm<CreateCategoryPayload>({
    defaultValues: {
      parent_id: categoryId ? parseInt(categoryId as string) : undefined,
      hide_from_structure: false,
      visible_to_role: '' as any,
      managed_by_role: '' as any,
    },
  });
  const createCategory = useCreateCategory(form);

  return (
    <Dialog size="lg">
      <DialogHeader>
        {categoryId ? (
          <Trans message="Add new section" />
        ) : (
          <Trans message="Add new category" />
        )}
      </DialogHeader>
      <DialogBody>
        <CrupdateCategoryForm
          hideParentId={!!categoryId}
          formId={formId}
          form={form}
          onSubmit={values => {
            createCategory.mutate(values, {
              onSuccess: () => close(),
            });
          }}
        />
      </DialogBody>
      <DialogFooter>
        <Button onClick={() => close()}>
          <Trans message="Cancel" />
        </Button>
        <Button
          form={formId}
          disabled={createCategory.isPending}
          variant="flat"
          color="primary"
          type="submit"
        >
          <Trans message="Create" />
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
