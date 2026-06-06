import {getCategoryLink} from '@app/help-center/categories/category-link';
import {HcCategoryImage} from '@app/help-center/hc-category-icons';
import {helpCenterQueries} from '@app/help-center/help-center-queries';
import {CreateCategoryDialog} from '@app/help-center/manager/crupdate-category-dialog/create-category-dialog';
import {UpdateCategoryDialog} from '@app/help-center/manager/crupdate-category-dialog/update-category-dialog';
import {
  HcCategoryManagerItem,
  HcManagerCategoriesResponse,
} from '@app/help-center/manager/hc-manager-data';
import {HcManagerBreadcrumb} from '@app/help-center/manager/layout/hc-manager-breadcrumb';
import {HcManagerEmptyMessage} from '@app/help-center/manager/layout/hc-manager-empty-message';
import {HcManagerLayout} from '@app/help-center/manager/layout/hc-manager-layout';
import {HcManagerRow} from '@app/help-center/manager/layout/hc-manager-row';
import {HcManagerTitle} from '@app/help-center/manager/layout/hc-manager-title';
import {useDeleteCategory} from '@app/help-center/manager/requests/use-delete-category';
import {useReorderCategories} from '@app/help-center/manager/requests/use-reorder-categories';
import {useNavigate} from '@common/ui/navigation/use-navigate';
import {useRequiredParams} from '@common/ui/navigation/use-required-params';
import {BulletSeparatedItems} from '@common/ui/other/bullet-seprated-items';
import {useSuspenseQuery} from '@tanstack/react-query';
import {Button} from '@ui/buttons/button';
import {Trans} from '@ui/i18n/trans';
import {ConfirmationDialog} from '@ui/overlays/dialog/confirmation-dialog';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {closeDialog, openDialog} from '@ui/overlays/store/dialog-store';
import {useParams} from 'react-router';

export function CategoriesManager() {
  const query = useSuspenseQuery(helpCenterQueries.manager.categories());
  return <ContainersManager type="categories" data={query.data} />;
}

export function SectionsManager() {
  const {categoryId} = useRequiredParams(['categoryId']);
  const query = useSuspenseQuery(
    helpCenterQueries.manager.sections(categoryId),
  );
  return <ContainersManager type="sections" data={query.data} />;
}

interface ContainersManagerProps {
  type: 'categories' | 'sections';
  data: HcManagerCategoriesResponse;
}
function ContainersManager({type, data}: ContainersManagerProps) {
  const categories = data.categories;
  const count = categories.length;

  return (
    <HcManagerLayout
      breadcrumb={<HcManagerBreadcrumb category={data.category} />}
      actionButton={
        <DialogTrigger type="modal">
          <Button
            variant="flat"
            color="primary"
            size="xs"
            className="max-md:mt-12"
          >
            {type === 'categories' ? (
              <Trans message="New category" />
            ) : (
              <Trans message="New section" />
            )}
          </Button>
          <CreateCategoryDialog />
        </DialogTrigger>
      }
    >
      {count ? (
        <HcManagerTitle>
          {type === 'categories' ? (
            <Trans message="Categories (:count)" values={{count}} />
          ) : (
            <Trans message="Sections (:count)" values={{count}} />
          )}
        </HcManagerTitle>
      ) : null}
      {categories.map(category => (
        <CategoryRow category={category} data={data} key={category.id} />
      ))}
      {!categories.length && <NoResultsMessage />}
    </HcManagerLayout>
  );
}

interface CategoryRowProps {
  category: HcCategoryManagerItem;
  data: HcManagerCategoriesResponse;
}
function CategoryRow({
  category,
  data: {categories, category: parent},
}: CategoryRowProps) {
  const navigate = useNavigate();
  const deleteCategory = useDeleteCategory();
  const reorder = useReorderCategories();

  const goToEditPage = () => {
    if (category.is_section) {
      navigate(`../sections/${category.id}`);
    } else {
      navigate(`categories/${category.id}`);
    }
  };

  return (
    <HcManagerRow
      item={category}
      items={categories}
      onSortEnd={(oldIndex, newIndex) => {
        reorder.mutate({oldIndex, newIndex, parentId: parent?.id});
      }}
      onClick={() => goToEditPage()}
      onView={() => navigate(getCategoryLink(category))}
      onEdit={() => openDialog(UpdateCategoryDialog, {item: category})}
      onDelete={() => {
        openDialog(ConfirmationDialog, {
          title: <Trans message="Delete category" />,
          body: (
            <Trans message="Are you sure you want to delete this category?" />
          ),
          confirm: <Trans message="Delete" />,
          isDanger: true,
          isLoading: deleteCategory.isPending,
          onConfirm: () =>
            deleteCategory.mutate(
              {id: category.id},
              {onSuccess: () => closeDialog()},
            ),
        });
      }}
      description={
        <BulletSeparatedItems>
          {!category.is_section ? (
            <Trans
              message="[one 1 section|other :count sections]"
              values={{count: category.sections_count}}
            />
          ) : null}
          <Trans
            message="[one 1 article|other :count articles]"
            values={{count: category.articles_count}}
          />
        </BulletSeparatedItems>
      }
      icon={
        category.image ? (
          <HcCategoryImage
            className="h-40 w-40 border border-divider-lighter p-4"
            src={category.image}
          />
        ) : null
      }
    >
      {category.name}
    </HcManagerRow>
  );
}

function NoResultsMessage() {
  const {categoryId} = useParams();
  if (categoryId) {
    return (
      <HcManagerEmptyMessage
        title={<Trans message="This category is empty" />}
        description={
          <Trans message="Empty categories aren't visible in the Help Center. You can make them visible by adding a section." />
        }
      />
    );
  }
  return (
    <HcManagerEmptyMessage
      title={<Trans message="There are no categories yet" />}
    />
  );
}
