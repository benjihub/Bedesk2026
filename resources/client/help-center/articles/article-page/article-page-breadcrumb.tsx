import {ArticlePathItem} from '@app/help-center/articles/article-path-item';
import {getCategoryLink} from '@app/help-center/categories/category-link';
import {useNavigate} from '@common/ui/navigation/use-navigate';
import {Breadcrumb} from '@ui/breadcrumbs/breadcrumb';
import {BreadcrumbItem} from '@ui/breadcrumbs/breadcrumb-item';
import {Trans} from '@ui/i18n/trans';

interface Props {
  path: ArticlePathItem[];
}
export function ArticlePageBreadcrumb({path}: Props) {
  const navigate = useNavigate();

  return (
    <Breadcrumb
      size="sm"
      className="-ml-6 text-muted"
      currentIsClickable
      inactiveMuted={false}
    >
      <BreadcrumbItem onSelected={() => navigate(`/hc`)}>
        <Trans message="Help center" />
      </BreadcrumbItem>
      {path.map(category => {
        if (category.hide_from_structure) {
          return null;
        }
        return (
          <BreadcrumbItem
            key={`${category.parent_id}-${category.id}`} // prevent duplicate keys
            onSelected={() => navigate(getCategoryLink(category))}
          >
            <Trans message={category.name} />
          </BreadcrumbItem>
        );
      })}
    </Breadcrumb>
  );
}
